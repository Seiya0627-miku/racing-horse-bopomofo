import type { SaveData } from '../types/index.ts';

const STORAGE_KEY = 'bopomofo-horses-save';
const CURRENT_VERSION = 1;

export function createEmptySave(): SaveData {
  return {
    version: CURRENT_VERSION,
    learning: { totalCorrect: 0, totalWrong: 0, symbols: {} },
    progress: { roundsPlayed: 0, horses: {} },
  };
}

/**
 * 古いセーブデータを1バージョンずつ新しい形式へ変換する。
 * 例: 2 へ上げるときは `1: (old) => ({ ...old, version: 2, 新しい項目 })` を追加する。
 */
const migrations: Record<number, (data: any) => any> = {};

export function loadSave(): SaveData {
  let data: any;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptySave();
    data = JSON.parse(raw);
  } catch {
    return createEmptySave();
  }

  if (typeof data?.version !== 'number') return createEmptySave();
  while (data.version < CURRENT_VERSION) {
    const migrate = migrations[data.version];
    if (!migrate) return createEmptySave();
    data = migrate(data);
  }
  // 新しいバージョンで保存されたデータは読めないので初期化する
  if (data.version !== CURRENT_VERSION) return createEmptySave();
  return data as SaveData;
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // プライベートブラウズなどで保存できない場合は、その回だけ記録なしで遊べればよい
  }
}
