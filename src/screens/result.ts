import { ROMAJI } from '../data/zhuyin.ts';
import { h } from '../ui/dom.ts';
import type { Nav, RoundResult } from './types.ts';

export function renderResult(root: HTMLElement, nav: Nav, result: RoundResult): void {
  const total = result.correct + result.wrong;
  const rate = total === 0 ? 0 : Math.round((result.correct / total) * 100);
  const missed = Object.entries(result.missed).sort((a, b) => b[1] - a[1]).slice(0, 5);

  root.replaceChildren(
    h('main', { class: 'screen result' }, [
      h('h1', { text: '結果' }),
      h('p', { class: 'score', text: `${result.correct} / ${total} 問 正解` }),
      h('p', { class: 'rate', text: `正解率 ${rate}%` }),

      h('h2', { text: '今回の馬' }),
      h('ul', { class: 'horse-list' }, result.horses.map((horse) =>
        h('li', {}, [
          h('div', { class: 'hl-zh', text: horse.nameZh }),
          h('div', { class: 'hl-zy', text: horse.syllables.map((s) => s.zhuyin).join(' ') }),
          h('div', { class: 'hl-ja', text: horse.nameJa ?? horse.nameEn }),
        ]),
      )),

      ...(missed.length > 0
        ? [
            h('h2', { text: 'まちがえた記号' }),
            h('div', { class: 'missed' }, missed.map(([sym, n]) =>
              h('span', { class: 'missed-item', text: `${sym}（${ROMAJI[sym] ?? ''}）×${n}` }))),
          ]
        : []),

      h('div', { class: 'actions' }, [
        h('button', { class: 'btn primary big', text: 'もう一度', onClick: nav.toPlay }),
        h('button', { class: 'btn ghost', text: 'タイトルへ', onClick: nav.toTitle }),
      ]),
    ]),
  );
}
