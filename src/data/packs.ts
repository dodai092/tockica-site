// Source: docs/copy/source.md item 5. Only the two intro packs are known (each once per
// account). The regular packs are in an image in Dunia's doc and are not copied yet, so
// they are a TODO(client) row on the page, never a guess. priceEur null = unknown.
export type Pack = { id: string; classes: number; priceEur: number | null; intro: boolean };

export const packs: Pack[] = [
  { id: 'intro-1', classes: 1, priceEur: 10, intro: true },
  { id: 'intro-3', classes: 3, priceEur: 30, intro: true },
];

// Regular packs, from the price table Dunia pasted into the doc under item 5 (read 2026-11-10).
// discountPct is her column, not computed. The packs page still lists only `packs` above.
export type RegularPack = { id: string; classes: number; priceEur: number; discountPct: number | null };

export const regularPacks: RegularPack[] = [
  { id: 'regular-1', classes: 1, priceEur: 15, discountPct: null },
  { id: 'regular-3', classes: 3, priceEur: 40, discountPct: 11 },
  { id: 'regular-5', classes: 5, priceEur: 65, discountPct: 13 },
  { id: 'regular-9', classes: 9, priceEur: 115, discountPct: 15 },
  { id: 'regular-12', classes: 12, priceEur: 144, discountPct: 20 },
];
