// One route table for the whole site. Every page is named once with its HR and EN path.
// Links, the language switch, hreflang alternates and the twin test all read from here.
// Paths have no trailing slash (site is trailingSlash: false), except home at '/'.

export type Lang = 'hr' | 'en';
export const defaultLang: Lang = 'hr';

export type RouteKey =
  'home' | 'schedule' | 'instructors' | 'packs' | 'sculpt' | 'contact' | 'rules' | 'terms' | 'privacy' | 'thanks';

const paths: Record<RouteKey, Record<Lang, string>> = {
  home: { hr: '/', en: '/en' },
  schedule: { hr: '/raspored', en: '/en/schedule' },
  instructors: { hr: '/instruktori', en: '/en/instructors' },
  packs: { hr: '/paketi', en: '/en/packs' },
  sculpt: { hr: '/sculpt-room', en: '/en/sculpt-room' },
  contact: { hr: '/kontakt', en: '/en/contact' },
  rules: { hr: '/pravilnik', en: '/en/rules' },
  terms: { hr: '/uvjeti', en: '/en/terms' },
  privacy: { hr: '/privatnost', en: '/en/privacy' },
  thanks: { hr: '/hvala', en: '/en/thanks' },
};

export const routeKeys = Object.keys(paths) as RouteKey[];

export const otherLang = (lang: Lang): Lang => (lang === 'hr' ? 'en' : 'hr');

export const pathFor = (key: RouteKey, lang: Lang): string => paths[key][lang];

// Root-relative. The layout turns these into absolute URLs.
export const alternatesFor = (key: RouteKey): { hreflang: string; href: string }[] => [
  { hreflang: 'hr', href: paths[key].hr },
  { hreflang: 'en', href: paths[key].en },
  { hreflang: 'x-default', href: paths[key][defaultLang] },
];
