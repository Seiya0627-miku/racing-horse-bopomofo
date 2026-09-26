import './style.css';
import { renderPlay } from './screens/play.ts';
import { renderResult } from './screens/result.ts';
import { renderTitle } from './screens/title.ts';
import type { Nav } from './screens/types.ts';
import { loadSave } from './systems/save.ts';

const root = document.getElementById('app')!;

const nav: Nav = {
  save: loadSave(),
  toTitle: () => show(() => renderTitle(root, nav)),
  toPlay: () => show(() => renderPlay(root, nav)),
  toResult: (result) => show(() => renderResult(root, nav, result)),
};

function show(render: () => void): void {
  render();
  window.scrollTo(0, 0);
}

nav.toTitle();
