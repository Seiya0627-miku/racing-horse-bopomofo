import { HORSES } from '../data/horses.ts';
import { h } from '../ui/dom.ts';
import type { Nav } from './types.ts';

export function renderTitle(root: HTMLElement, nav: Nav): void {
  const { learning, progress } = nav.save;
  const clearedCount = Object.keys(progress.horses).length;

  root.replaceChildren(
    h('main', { class: 'screen title' }, [
      h('div', { class: 'title-logo', text: 'ㄇㄚˇ' }),
      h('h1', { text: '名馬で覚える注音' }),
      h('p', { class: 'lead', text: '香港の競走馬の中国語名を聞いて、注音（ㄅㄆㄇㄈ）を1つずつ選ぼう！' }),
      h('ol', { class: 'howto' }, [
        h('li', { text: '🔊 ボタンで馬の名前を聞く' }),
        h('li', { text: '「最初の音」「後ろの音」「声調」を4択で選ぶ' }),
        h('li', { text: '全部そろったら次の馬へ' }),
      ]),
      h('button', { class: 'btn primary big', text: 'はじめる', onClick: nav.toPlay }),
      h('p', { class: 'stats', text:
        `出会った馬: ${clearedCount} / ${HORSES.length}頭　` +
        `これまでの正解: ${learning.totalCorrect}問` }),
    ]),
  );
}
