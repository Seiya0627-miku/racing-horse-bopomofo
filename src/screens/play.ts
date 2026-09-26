import { HORSES_PER_ROUND, NEXT_QUESTION_DELAY } from '../config.ts';
import { HORSES } from '../data/horses.ts';
import { PART_LABELS, ROMAJI } from '../data/zhuyin.ts';
import { recordAnswer, recordHorseCleared } from '../systems/learning.ts';
import { buildQuestions, shuffle } from '../systems/quiz.ts';
import { writeSave } from '../systems/save.ts';
import { speak } from '../systems/speech.ts';
import type { Horse, Question } from '../types/index.ts';
import { assetUrl, h } from '../ui/dom.ts';
import type { Nav, RoundResult } from './types.ts';

/** 1回のプレイ（数頭分）を進める。タップ処理の中から呼ぶこと（読み上げのため） */
export function renderPlay(root: HTMLElement, nav: Nav): void {
  const horses = shuffle(HORSES).slice(0, HORSES_PER_ROUND);
  const result: RoundResult = { horses, correct: 0, wrong: 0, missed: {} };
  let horseIndex = 0;

  startHorse();

  function startHorse(): void {
    const horse = horses[horseIndex];
    const questions = buildQuestions(horse);
    // 音節ごとに、答え終わった記号を入れていく
    const filled: string[][] = horse.syllables.map(() => []);
    let qIndex = 0;
    let missedThisQuestion = false;
    let mistakesThisHorse = 0;

    const sayName = () => speak(horse.nameZh, horse.audio);

    const word = h('div', { class: 'word' });
    const prompt = h('p', { class: 'prompt' });
    const choices = h('div', { class: 'choices' });
    const bottom = h('div', { class: 'bottom' }, [prompt, choices]);

    root.replaceChildren(
      h('main', { class: 'screen play' }, [
        h('header', { class: 'topbar' }, [
          h('span', { text: `${horseIndex + 1} / ${horses.length} 頭目` }),
          h('button', { class: 'btn small ghost', text: 'やめる', onClick: nav.toTitle }),
        ]),
        photo(horse),
        h('div', { class: 'names' }, [
          h('div', { class: 'name-ja', text: horse.nameJa ?? horse.nameEn }),
          ...(horse.nameJa ? [h('div', { class: 'name-en', text: horse.nameEn })] : []),
        ]),
        h('button', { class: 'btn speak', text: '🔊 名前を聞く', onClick: sayName }),
        word,
        bottom,
      ]),
    );
    sayName();
    showQuestion();

    function renderWord(): void {
      const current = questions[qIndex];
      word.replaceChildren(
        ...horse.syllables.map((s, i) => {
          const zy = h('div', { class: 'zy' });
          // 1声は本来記号を書かないので表示しない
          zy.append(...filled[i].filter((sym) => sym !== 'ˉ').map((sym) =>
            h('span', { class: sym.match(/[ˊˇˋ˙]/) ? 'tone' : '', text: sym })));
          // まだ答えていない部分: 今の問題は「？」、残りは下線1本ずつ
          const remaining = questions.filter((q) => q.syllableIndex === i).length - filled[i].length;
          for (let n = 0; n < remaining; n++) {
            const isCurrent = n === 0 && current?.syllableIndex === i;
            zy.append(h('span', { class: isCurrent ? 'slot' : 'blank', text: isCurrent ? '？' : '' }));
          }
          return h('div', { class: `syl${current?.syllableIndex === i ? ' active' : ''}` }, [
            h('div', { class: 'char', text: s.char }),
            zy,
          ]);
        }),
      );
    }

    function showQuestion(): void {
      renderWord();
      const q = questions[qIndex];
      if (!q) {
        finishHorse();
        return;
      }
      missedThisQuestion = false;
      prompt.textContent = `「${horse.syllables[q.syllableIndex].char}」の${PART_LABELS[q.part]}は？`;
      choices.className = `choices${q.choices.length === 3 ? ' three' : ''}`;
      choices.replaceChildren(...q.choices.map((c) => choiceButton(q, c)));
    }

    function choiceButton(q: Question, symbol: string): HTMLButtonElement {
      const hint = h('span', { class: 'hint', text: ROMAJI[symbol] ?? '' });
      // 声調は記号だけだと分からないので、最初から「4声」などを表示する
      if (q.part === 'tone') hint.classList.add('always');
      const btn = h('button', { class: 'btn choice' }, [
        h('span', { class: 'symbol', text: symbol }),
        hint,
      ]);
      btn.addEventListener('click', () => answer(q, symbol, btn));
      return btn;
    }

    function answer(q: Question, symbol: string, btn: HTMLButtonElement): void {
      if (symbol !== q.answer) {
        btn.classList.add('wrong');
        btn.disabled = true;
        // 間違えたらローマ字のヒントを出す
        choices.classList.add('show-hints');
        if (!missedThisQuestion) {
          missedThisQuestion = true;
          mistakesThisHorse++;
          result.wrong++;
          result.missed[q.answer] = (result.missed[q.answer] ?? 0) + 1;
          recordAnswer(nav.save, q.answer, false);
          writeSave(nav.save);
        }
        return;
      }

      btn.classList.add('correct');
      for (const b of choices.querySelectorAll('button')) b.disabled = true;
      if (!missedThisQuestion) {
        result.correct++;
        recordAnswer(nav.save, q.answer, true);
        writeSave(nav.save);
      }
      filled[q.syllableIndex].push(symbol);
      qIndex++;
      setTimeout(showQuestion, NEXT_QUESTION_DELAY);
    }

    function finishHorse(): void {
      recordHorseCleared(nav.save, horse.id, mistakesThisHorse === 0);
      writeSave(nav.save);

      const isLast = horseIndex === horses.length - 1;
      bottom.replaceChildren(
        h('div', { class: 'complete' }, [
          h('p', { class: 'complete-title', text: mistakesThisHorse === 0 ? '完璧！🎉' : '完成！' }),
          h('p', { class: 'complete-zhuyin', text: horse.syllables.map((s) => s.zhuyin).join('  ') }),
          h('button', {
            class: 'btn primary big',
            text: isLast ? '結果を見る' : '次の馬へ ▶',
            onClick: () => {
              if (isLast) {
                nav.save.progress.roundsPlayed++;
                writeSave(nav.save);
                nav.toResult(result);
              } else {
                horseIndex++;
                startHorse();
              }
            },
          }),
        ]),
      );
    }
  }
}

function photo(horse: Horse): HTMLElement {
  if (!horse.image) return h('div', { class: 'photo empty', text: '🐎' });
  const { src, credit, license, sourceUrl } = horse.image;
  return h('figure', { class: 'photo' }, [
    h('img', { attrs: { src: assetUrl(src), alt: horse.nameEn } }),
    h('figcaption', {}, [
      h('a', { text: `写真: ${credit} / ${license}`, attrs: { href: sourceUrl, target: '_blank', rel: 'noopener' } }),
    ]),
  ]);
}
