import type { Horse } from '../types/index.ts';
import horsesJson from './horses.json';

/** horses.json は `npm run fetch-horses` で自動生成される */
export const HORSES: Horse[] = horsesJson as Horse[];
