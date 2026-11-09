// What a class card says about free places: how full the meter is, whether the count is worth a warning, and the
// label in the page language. Pure, so the page build and the browser script give the same words.
export const SCARCE_AT = 3;

export type SeatLabels = {
  full: string;
  /** {n} is the number of free places. */
  plenty: string;
  scarce: { one: string; few: string; other: string };
};
export type SeatState = { full: boolean; scarce: boolean; percent: number };

export function seatState(free: number, capacity: number): SeatState {
  const full = free <= 0;
  const taken = Math.min(capacity, Math.max(0, capacity - free));
  return {
    full,
    scarce: !full && free <= SCARCE_AT,
    percent: capacity > 0 ? Math.round((taken / capacity) * 100) : 100,
  };
}

export function seatLabel(free: number, capacity: number, labels: SeatLabels, locale: string): string {
  const s = seatState(free, capacity);
  if (s.full) return labels.full;
  const n = String(free);
  if (!s.scarce) return labels.plenty.replace('{n}', n);
  const form = new Intl.PluralRules(locale).select(free);
  const text = form === 'one' || form === 'few' ? labels.scarce[form] : labels.scarce.other;
  return text.replace('{n}', n);
}
