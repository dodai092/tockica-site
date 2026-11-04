import type { Lang } from '../i18n/routes.ts';

export function pricePerClass(priceEur: number, classes: number): number {
  if (classes <= 0) throw new Error(`classes must be positive, got ${classes}`);
  return Math.round((priceEur / classes + Number.EPSILON) * 100) / 100;
}

// HR: "13,33 €" (euro sign after). EN: "€13.33" (before). Whole amounts drop the decimals.
export function formatEur(value: number, lang: Lang): string {
  const n = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return lang === 'hr' ? `${n.replace('.', ',')} €` : `€${n}`;
}
