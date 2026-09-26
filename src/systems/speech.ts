import { SPEECH_RATE } from '../config.ts';

/**
 * 読み上げ。音声ファイルが指定されていればそれを、無ければブラウザの読み上げ機能を使う。
 * iOS の制限により、必ずボタンのタップ処理の中から呼ぶこと。
 */
let voice: SpeechSynthesisVoice | null = null;

function pickVoice(): void {
  const voices = speechSynthesis.getVoices();
  voice =
    voices.find((v) => v.lang.replace('_', '-') === 'zh-TW') ??
    voices.find((v) => v.lang.startsWith('zh')) ??
    null;
}

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function speak(text: string, audioSrc?: string): void {
  if (audioSrc) {
    void new Audio(import.meta.env.BASE_URL + audioSrc).play().catch(() => speakWithTts(text));
    return;
  }
  speakWithTts(text);
}

function speakWithTts(text: string): void {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-TW';
  if (voice) u.voice = voice;
  u.rate = SPEECH_RATE;
  speechSynthesis.speak(u);
}
