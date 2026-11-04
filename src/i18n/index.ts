import type { Copy } from './copy/types.ts';
import { en } from './copy/en.ts';
import { hr } from './copy/hr.ts';
import type { Lang } from './routes.ts';

export * from './routes.ts';
export type { Copy };

const copy: Record<Lang, Copy> = { hr, en };

export const getCopy = (lang: Lang): Copy => copy[lang];
