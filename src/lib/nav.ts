// Which pages the header and footer link to. Sculpt Room drops out of both when it is
// not visible (src/data/sculpt.ts), so the nav never points at a page hidden from search.
// Lista čekanja drops out when the full homepage replaces the waitlist page (src/data/waitlist.ts).
import { pathFor } from '../i18n/routes.ts';
import type { Lang } from '../i18n/routes.ts';

export type NavKey = 'schedule' | 'instructors' | 'packs' | 'waitlist' | 'sculpt' | 'contact';

export const headerRoutes = (sculptVisible: boolean, waitlistVisible = true): NavKey[] => [
  'schedule',
  'instructors',
  'packs',
  ...(waitlistVisible ? (['waitlist'] as const) : []),
  ...(sculptVisible ? (['sculpt'] as const) : []),
  'contact',
];

export const footerRoutes = (sculptVisible: boolean, waitlistVisible = true): NavKey[] =>
  headerRoutes(sculptVisible, waitlistVisible);

/** The waitlist page is the homepage while it stands in for it, so its link is the home path. */
export const navPath = (key: NavKey, lang: Lang): string => pathFor(key === 'waitlist' ? 'home' : key, lang);
