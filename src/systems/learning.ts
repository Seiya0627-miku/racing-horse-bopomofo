import type { SaveData, SymbolStats } from '../types/index.ts';

/** 1問の回答結果を学習記録に反映する（最初の回答だけを数える） */
export function recordAnswer(save: SaveData, symbol: string, correct: boolean): void {
  const { learning } = save;
  const stats: SymbolStats = learning.symbols[symbol] ??= {
    correct: 0, wrong: 0, streak: 0, bestStreak: 0, lastAnsweredAt: 0,
  };
  if (correct) {
    learning.totalCorrect++;
    stats.correct++;
    stats.streak++;
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
  } else {
    learning.totalWrong++;
    stats.wrong++;
    stats.streak = 0;
  }
  stats.lastAnsweredAt = Date.now();
}

export function recordHorseCleared(save: SaveData, horseId: string, perfect: boolean): void {
  const p = save.progress.horses[horseId] ??= { cleared: 0, perfect: 0 };
  p.cleared++;
  if (perfect) p.perfect++;
}
