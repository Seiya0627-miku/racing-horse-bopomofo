import type { Horse, SaveData } from '../types/index.ts';

export interface RoundResult {
  horses: Horse[];
  correct: number;
  wrong: number;
  missed: Record<string, number>; // 間違えた記号 → 回数
}

/** 画面の切り替えは main.ts がまとめて行う */
export interface Nav {
  save: SaveData;
  toTitle(): void;
  toPlay(): void;
  toResult(result: RoundResult): void;
}
