/**
 * Wikipedia / Wikidata / Wikimedia Commons / 萌典 から馬のデータを集め、
 * src/data/horses.json と public/images/horses/ を生成する。
 *
 * 使い方: npm run fetch-horses -- [頭数(省略時10)]
 *
 * 読みの修正や除外は scripts/overrides.json で行う。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseZhuyin } from '../src/systems/zhuyin.ts';
import type { Horse, HorseImage, HorseSyllable } from '../src/types/index.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = join(ROOT, 'src/data/horses.json');
const IMAGE_DIR = join(ROOT, 'public/images/horses');
const OVERRIDES_PATH = join(ROOT, 'scripts/overrides.json');

/** 香港で走った馬の一覧として使うカテゴリ */
const CATEGORIES = ['Category:Racehorses trained in Hong Kong'];
/** カテゴリにない馬（日本馬など）を追加したいときは英語版Wikipediaの記事名を書く */
const EXTRA_TITLES: string[] = [];

const LIMIT = Number(process.argv[2] ?? 10);
const IMAGE_WIDTH = 800;
const USER_AGENT = 'BopomofoHorseQuiz/0.1 (personal learning game)';

interface Overrides {
  exclude: string[]; // 除外する馬の id
  zhuyin: Record<string, string[]>; // id → 1文字ずつの注音
  speechText: Record<string, string>; // id → 読み上げ用の文字（同音の別の字）
}

interface Candidate {
  title: string;
  length: number;
  wikidataId?: string;
  pageImage?: string;
}

// ---------- 通信 ----------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** アクセスしすぎで 429 が返ったら、少し待ってやり直す */
async function politeFetch(url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    await sleep(500);
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.status !== 429 || attempt >= 5) {
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return res;
    }
    const wait = Number(res.headers.get('retry-after')) || 2 ** attempt * 5;
    console.log(`    (アクセス制限のため ${wait}秒待ちます)`);
    await sleep(wait * 1000);
  }
}

async function getJson(url: string): Promise<any> {
  return (await politeFetch(url)).json();
}

function apiUrl(host: string, params: Record<string, string>): string {
  const q = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  return `https://${host}/w/api.php?${q}`;
}

// ---------- 各データソース ----------

async function fetchCandidates(): Promise<Candidate[]> {
  const pages: any[] = [];
  const common = { prop: 'pageimages|pageprops|info', piprop: 'name', ppprop: 'wikibase_item' };
  for (const category of CATEGORIES) {
    const json = await getJson(apiUrl('en.wikipedia.org', {
      action: 'query', generator: 'categorymembers', gcmtitle: category,
      gcmnamespace: '0', gcmlimit: '500', ...common,
    }));
    pages.push(...(json.query?.pages ?? []));
  }
  if (EXTRA_TITLES.length > 0) {
    const json = await getJson(apiUrl('en.wikipedia.org', {
      action: 'query', titles: EXTRA_TITLES.join('|'), redirects: '1', ...common,
    }));
    pages.push(...(json.query?.pages ?? []));
  }

  const seen = new Set<string>();
  return pages
    .filter((p) => !p.missing && !seen.has(p.title) && seen.add(p.title))
    .map((p) => ({
      title: p.title,
      length: p.length ?? 0,
      wikidataId: p.pageprops?.wikibase_item,
      pageImage: p.pageimage,
    }))
    // 記事が長い＝有名な馬、とみなして優先する
    .sort((a, b) => b.length - a.length);
}

async function fetchNames(wikidataId: string): Promise<{ zh: string | null; ja: string | null }> {
  const json = await getJson(apiUrl('www.wikidata.org', {
    action: 'wbgetentities', ids: wikidataId, props: 'labels|sitelinks',
    languages: 'zh-hk|zh-hant|zh-tw|zh',
  }));
  const entity = json.entities[wikidataId];
  const labels = entity.labels ?? {};
  // 香港の正式名を優先し、繁体字 → その他の順で探す
  const zh = ['zh-hk', 'zh-hant', 'zh-tw', 'zh']
    .map((lang) => labels[lang]?.value as string | undefined)
    .find((v) => v && /^\p{Script=Han}+$/u.test(v)) ?? null;
  const jaTitle: string | undefined = entity.sitelinks?.jawiki?.title;
  const ja = jaTitle ? jaTitle.replace(/\s*[(（].*[)）]\s*$/, '') : null;
  return { zh, ja };
}

async function fetchImage(fileName: string, id: string): Promise<HorseImage | null> {
  if (/\.svg$/i.test(fileName)) return null; // 勝負服の図などは除外
  const json = await getJson(apiUrl('commons.wikimedia.org', {
    action: 'query', titles: `File:${fileName}`, prop: 'imageinfo',
    iiprop: 'url|extmetadata', iiurlwidth: String(IMAGE_WIDTH),
  }));
  const page = json.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  // Commons に無い（＝英語版Wikipedia限定のフェアユース画像など）は使わない
  if (!info) return null;

  const meta = info.extmetadata ?? {};
  const license: string = meta.LicenseShortName?.value ?? '';
  if (!/^(CC|Public domain|PD)/i.test(license)) return null;
  const credit = stripHtml(meta.Artist?.value ?? 'Unknown');

  const thumbUrl: string = info.thumburl ?? info.url;
  const ext = extname(new URL(thumbUrl).pathname).toLowerCase() || '.jpg';
  const res = await politeFetch(thumbUrl);
  const fileNameOut = `${id}${ext}`;
  await writeFile(join(IMAGE_DIR, fileNameOut), Buffer.from(await res.arrayBuffer()));

  return {
    src: `images/horses/${fileNameOut}`,
    credit,
    license,
    sourceUrl: info.descriptionurl,
  };
}

/** 萌典（教育部の辞典データ）から1文字の注音を取る。読みが複数ある場合も返す */
const zhuyinCache = new Map<string, string[]>();
async function fetchCharZhuyin(char: string): Promise<string[]> {
  const cached = zhuyinCache.get(char);
  if (cached) return cached;
  let readings: string[] = [];
  try {
    const json = await getJson(`https://www.moedict.tw/a/${encodeURIComponent(char)}.json`);
    readings = (json.h ?? [])
      .map((h: any) => String(h.b ?? '').split(/\s+/)[0])
      .filter((b: string) => parseZhuyin(b) !== null);
  } catch {
    readings = [];
  }
  zhuyinCache.set(char, readings);
  return readings;
}

// ---------- ユーティリティ ----------

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function toId(title: string): string {
  return title
    .replace(/\s*\((horse|racehorse)\)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function loadOverrides(): Promise<Overrides> {
  try {
    const json = JSON.parse(await readFile(OVERRIDES_PATH, 'utf8'));
    return { exclude: json.exclude ?? [], zhuyin: json.zhuyin ?? {}, speechText: json.speechText ?? {} };
  } catch {
    return { exclude: [], zhuyin: {}, speechText: {} };
  }
}

// ---------- メイン ----------

async function main() {
  await mkdir(IMAGE_DIR, { recursive: true });
  const overrides = await loadOverrides();
  const candidates = await fetchCandidates();
  console.log(`候補: ${candidates.length}頭 / 目標: ${LIMIT}頭\n`);

  const horses: Horse[] = [];
  const warnings: string[] = [];

  for (const c of candidates) {
    if (horses.length >= LIMIT) break;
    const id = toId(c.title);
    const skip = (reason: string) => console.log(`  - ${c.title}: ${reason}`);

    if (overrides.exclude.includes(id)) { skip('overrides で除外'); continue; }
    if (!c.wikidataId) { skip('Wikidata なし'); continue; }
    if (!c.pageImage) { skip('写真なし'); continue; }

    const names = await fetchNames(c.wikidataId);
    if (!names.zh) { skip('中国語名なし'); continue; }

    // 注音: overrides があればそれを使い、なければ萌典から取る
    const chars = [...names.zh];
    const manual = overrides.zhuyin[id];
    const syllables: HorseSyllable[] = [];
    const horseWarnings: string[] = [];
    let ok = true;
    for (const [i, char] of chars.entries()) {
      if (manual) {
        syllables.push({ char, zhuyin: manual[i] });
        continue;
      }
      const readings = await fetchCharZhuyin(char);
      if (readings.length === 0) { ok = false; skip(`「${char}」の注音が見つからない`); break; }
      if (new Set(readings).size > 1) {
        horseWarnings.push(`${id} (${names.zh}): 「${char}」は多音字 ${readings.join(' / ')} → ${readings[0]} を使用`);
      }
      syllables.push({ char, zhuyin: readings[0] });
    }
    if (!ok) continue;
    if (syllables.some((s) => !s.zhuyin || !parseZhuyin(s.zhuyin))) {
      skip('overrides の注音の形式が不正'); continue;
    }

    const image = await fetchImage(c.pageImage, id);
    if (!image) { skip('自由ライセンスの写真なし'); continue; }

    horses.push({
      id,
      nameZh: names.zh,
      nameEn: c.title.replace(/\s*\((horse|racehorse)\)$/i, ''),
      nameJa: names.ja,
      syllables,
      image,
      ...(overrides.speechText[id] ? { speechText: overrides.speechText[id] } : {}),
    });
    warnings.push(...horseWarnings);
    console.log(`  ✓ ${names.zh}  ${syllables.map((s) => s.zhuyin).join(' ')}  (${c.title})`);
  }

  await writeFile(OUT_JSON, JSON.stringify(horses, null, 2) + '\n', 'utf8');
  console.log(`\n${horses.length}頭を ${OUT_JSON} に保存しました。`);
  if (warnings.length > 0) {
    console.log('\n⚠ 読みを確認してください（間違っていたら scripts/overrides.json で修正）:');
    for (const w of warnings) console.log(`  ${w}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
