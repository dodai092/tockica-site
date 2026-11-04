// Which pages the header and footer link to. Sculpt Room drops out of both when it is
// not visible (src/data/sculpt.ts), so the nav never points at a page hidden from search.
export type NavKey = 'schedule' | 'instructors' | 'packs' | 'sculpt' | 'contact';

export const headerRoutes = (sculptVisible: boolean): NavKey[] => [
  'schedule',
  'instructors',
  'packs',
  ...(sculptVisible ? (['sculpt'] as const) : []),
];

export const footerRoutes = (sculptVisible: boolean): NavKey[] => [...headerRoutes(sculptVisible), 'contact'];
