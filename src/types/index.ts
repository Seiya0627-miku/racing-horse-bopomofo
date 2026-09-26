// ===== マスターデータ（どんな馬・問題が存在するか） =====

export interface HorseImage {
  src: string; // public/ からの相対パス
  credit: string; // 撮影者など
  license: string; // 例: "CC BY-SA 4.0"
  sourceUrl: string; // Wikimedia Commons のファイルページ
}

export interface HorseSyllable {
  char: string; // 漢字1文字
  zhuyin: string; // 例: "ㄌㄤˋ"
}

export interface Horse {
  id: string;
  nameZh: string;
  nameEn: string;
  nameJa: string | null;
  syllables: HorseSyllable[];
  image: HorseImage | null;
  /** 読み上げ用の文字。多音字を読み間違える場合に、同じ音の別の字に置き換える */
  speechText?: string;
  audio?: string; // 音声ファイル（あれば読み上げ機能より優先）
}

// ===== 注音の分解 =====

export type ZhuyinPart = 'initial' | 'medial' | 'final' | 'tone';

export interface ParsedZhuyin {
  initial: string | null; // 声母 ㄅㄆㄇ…
  medial: string | null; // 介音 ㄧㄨㄩ
  final: string | null; // 韻母 ㄚㄛㄜ…
  tone: string; // 声調記号 ˉˊˇˋ˙（1声は "ˉ" で表す）
}

// ===== クイズ =====

export interface Question {
  syllableIndex: number;
  part: ZhuyinPart;
  answer: string; // 注音記号 or 声調記号
  choices: string[];
}

// ===== セーブデータ =====

export interface SymbolStats {
  correct: number;
  wrong: number;
  streak: number; // 現在の連続正解数
  bestStreak: number;
  lastAnsweredAt: number; // Date.now()
}

/** どの記号をどれくらい覚えているか */
export interface LearningData {
  totalCorrect: number;
  totalWrong: number;
  symbols: Record<string, SymbolStats>; // キーは注音記号・声調記号
}

export interface HorseProgress {
  cleared: number; // クリア回数
  perfect: number; // ノーミスでクリアした回数
}

/** ゲーム内でどこまで進んだか */
export interface ProgressData {
  roundsPlayed: number;
  horses: Record<string, HorseProgress>; // キーは Horse.id
}

export interface SaveData {
  version: 1;
  learning: LearningData;
  progress: ProgressData;
}
