interface Props {
  class?: string;
  text?: string;
  onClick?: () => void;
  attrs?: Record<string, string>;
}

/** 小さな要素作成ヘルパー: h('button', { class: 'btn', text: 'はじめる', onClick }) */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.text !== undefined) el.textContent = props.text;
  if (props.onClick) el.addEventListener('click', props.onClick);
  for (const [k, v] of Object.entries(props.attrs ?? {})) el.setAttribute(k, v);
  el.append(...children);
  return el;
}

export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path;
}
