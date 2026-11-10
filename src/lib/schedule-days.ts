// Studio-day helpers for the schedule page. The studio is in Zagreb, so a "day" is a Zagreb calendar day, whatever
// time zone the visitor's browser is in. Dates are "YYYY-MM-DD" strings, weeks start on Monday.
import type { NextClass } from './schedule-feed.ts';

export const STUDIO_ZONE = 'Europe/Zagreb';

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: STUDIO_ZONE });

export const studioDay = (when: string | Date): string => dayFormat.format(new Date(when));

const utcNoon = (ymd: string) => new Date(`${ymd}T12:00:00Z`);

/** 1 for Monday to 7 for Sunday. */
export const dayOfWeek = (ymd: string): number => utcNoon(ymd).getUTCDay() || 7;

export const addDays = (ymd: string, n: number): string => {
  const d = utcNoon(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const mondayOf = (ymd: string): string => addDays(ymd, 1 - dayOfWeek(ymd));

/** Classes by studio day, in start order. A day with no class has no entry. */
export function groupByDay<T extends Pick<NextClass, 'startsAt'>>(classes: T[]): Map<string, T[]> {
  const out = new Map<string, T[]>();
  const sorted = [...classes].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  for (const c of sorted) {
    const day = studioDay(c.startsAt);
    out.set(day, [...(out.get(day) ?? []), c]);
  }
  return out;
}
