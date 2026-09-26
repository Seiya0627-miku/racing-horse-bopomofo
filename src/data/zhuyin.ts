import type { ZhuyinPart } from '../types/index.ts';

export const INITIALS = [
  'ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ',
  'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ',
];
export const MEDIALS = ['ㄧ', 'ㄨ', 'ㄩ'];
export const FINALS = [
  'ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ', 'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 'ㄦ',
];
/** 1声は本来記号なしだが、クイズでは "ˉ" で表す */
export const TONES = ['ˉ', 'ˊ', 'ˇ', 'ˋ', '˙'];

export const SYMBOLS_BY_PART: Record<ZhuyinPart, string[]> = {
  initial: INITIALS,
  medial: MEDIALS,
  final: FINALS,
  tone: TONES,
};

/**
 * 間違えやすい記号のグループ。
 * 4択の不正解の選択肢は、まずこのグループから選ぶ。
 */
export const CONFUSABLE_GROUPS: string[][] = [
  ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ'],
  ['ㄉ', 'ㄊ', 'ㄋ', 'ㄌ'],
  ['ㄍ', 'ㄎ', 'ㄏ'],
  ['ㄐ', 'ㄑ', 'ㄒ'],
  ['ㄓ', 'ㄔ', 'ㄕ', 'ㄖ'],
  ['ㄗ', 'ㄘ', 'ㄙ'],
  ['ㄓ', 'ㄗ', 'ㄐ'],
  ['ㄔ', 'ㄘ', 'ㄑ'],
  ['ㄕ', 'ㄙ', 'ㄒ'],
  ['ㄚ', 'ㄛ', 'ㄜ', 'ㄝ'],
  ['ㄞ', 'ㄟ', 'ㄠ', 'ㄡ'],
  ['ㄢ', 'ㄣ', 'ㄤ', 'ㄥ'],
  ['ˉ', 'ˊ', 'ˇ', 'ˋ'],
];

/** ローマ字（ピンイン寄り）の目安。ボタンの補助表示に使う */
export const ROMAJI: Record<string, string> = {
  ㄅ: 'b', ㄆ: 'p', ㄇ: 'm', ㄈ: 'f', ㄉ: 'd', ㄊ: 't', ㄋ: 'n', ㄌ: 'l',
  ㄍ: 'g', ㄎ: 'k', ㄏ: 'h', ㄐ: 'j', ㄑ: 'q', ㄒ: 'x',
  ㄓ: 'zh', ㄔ: 'ch', ㄕ: 'sh', ㄖ: 'r', ㄗ: 'z', ㄘ: 'c', ㄙ: 's',
  ㄧ: 'i', ㄨ: 'u', ㄩ: 'ü',
  ㄚ: 'a', ㄛ: 'o', ㄜ: 'e', ㄝ: 'ê', ㄞ: 'ai', ㄟ: 'ei', ㄠ: 'ao', ㄡ: 'ou',
  ㄢ: 'an', ㄣ: 'en', ㄤ: 'ang', ㄥ: 'eng', ㄦ: 'er',
  'ˉ': '1声', 'ˊ': '2声', 'ˇ': '3声', 'ˋ': '4声', '˙': '軽声',
};

export const PART_LABELS: Record<ZhuyinPart, string> = {
  initial: '最初の音（声母）',
  medial: '間の音（介音）',
  final: '後ろの音（韻母）',
  tone: '声調',
};
