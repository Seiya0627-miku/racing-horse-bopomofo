import { CONFUSABLE_GROUPS, SYMBOLS_BY_PART } from '../data/zhuyin.ts';
import type { Horse, Question, ZhuyinPart } from '../types/index.ts';
import { parseZhuyin, partsOf } from './zhuyin.ts';

const CHOICE_COUNT = 4;

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 1頭分の問題を、音節の順・声母→介音→韻母→声調の順に作る */
export function buildQuestions(horse: Horse): Question[] {
  const questions: Question[] = [];
  horse.syllables.forEach((syllable, syllableIndex) => {
    const parsed = parseZhuyin(syllable.zhuyin);
    if (!parsed) throw new Error(`注音の形式が不正: ${horse.id} ${syllable.zhuyin}`);
    for (const { part, symbol } of partsOf(parsed)) {
      questions.push({ syllableIndex, part, answer: symbol, choices: makeChoices(part, symbol) });
    }
  });
  return questions;
}

/** 正解＋まぎらわしい記号で選択肢を作る（介音は3つしかないので3択） */
function makeChoices(part: ZhuyinPart, answer: string): string[] {
  const pool = SYMBOLS_BY_PART[part].filter((s) => s !== answer);

  const confusable = shuffle(
    [...new Set(CONFUSABLE_GROUPS.filter((g) => g.includes(answer)).flat())]
      .filter((s) => s !== answer && pool.includes(s)),
  );
  const others = shuffle(pool.filter((s) => !confusable.includes(s)));
  const wrong = [...confusable, ...others].slice(0, CHOICE_COUNT - 1);

  const choices = shuffle([answer, ...wrong]);
  // 声調は ˉˊˇˋ の順に並んでいる方が分かりやすい
  if (part === 'tone') {
    const order = SYMBOLS_BY_PART.tone;
    choices.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
  return choices;
}
