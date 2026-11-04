// Source: docs/copy/source.md item 5. Only the two intro packs are known (each once per
// account). The regular packs are in an image in Dunia's doc and are not copied yet, so
// they are a TODO(client) row on the page, never a guess. priceEur null = unknown.
export type Pack = { id: string; classes: number; priceEur: number | null; intro: boolean };

export const packs: Pack[] = [
  { id: 'intro-1', classes: 1, priceEur: 10, intro: true },
  { id: 'intro-3', classes: 3, priceEur: 30, intro: true },
];
