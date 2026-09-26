import { FINALS, INITIALS, MEDIALS } from '../data/zhuyin.ts';
import type { ParsedZhuyin, ZhuyinPart } from '../types/index.ts';

/**
 * "ㄌㄤˋ" のような1音節の注音を、声母・介音・韻母・声調に分解する。
 * 形式がおかしい場合は null を返す。
 */
export function parseZhuyin(text: string): ParsedZhuyin | null {
  let rest = text.trim();
  let tone = 'ˉ';

  // 軽声は先頭に "˙" が付く
  if (rest.startsWith('˙')) {
    tone = '˙';
    rest = rest.slice(1);
  }
  const last = rest.at(-1);
  if (last === 'ˊ' || last === 'ˇ' || last === 'ˋ' || last === '˙') {
    tone = last;
    rest = rest.slice(0, -1);
  }

  const chars = [...rest];
  const result: ParsedZhuyin = { initial: null, medial: null, final: null, tone };

  if (chars[0] && INITIALS.includes(chars[0])) result.initial = chars.shift()!;
  if (chars[0] && MEDIALS.includes(chars[0])) result.medial = chars.shift()!;
  if (chars[0] && FINALS.includes(chars[0])) result.final = chars.shift()!;

  const empty = !result.initial && !result.medial && !result.final;
  if (chars.length > 0 || empty) return null;
  return result;
}

/** 出題する順番に、その音節に含まれる要素を並べる */
export function partsOf(parsed: ParsedZhuyin): { part: ZhuyinPart; symbol: string }[] {
  const parts: { part: ZhuyinPart; symbol: string }[] = [];
  if (parsed.initial) parts.push({ part: 'initial', symbol: parsed.initial });
  if (parsed.medial) parts.push({ part: 'medial', symbol: parsed.medial });
  if (parsed.final) parts.push({ part: 'final', symbol: parsed.final });
  parts.push({ part: 'tone', symbol: parsed.tone });
  return parts;
}
