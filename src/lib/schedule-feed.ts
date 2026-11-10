// The next-classes feed. The booking app's public, read-only endpoint (ADR 0005, update 2026-11-04) returns
// JSON in this shape, and the homepage and schedule page cards read it in the visitor's browser, so they show
// what the studio's admin has set in the app, and the number of free bikes. Counts only: never who booked what,
// no names and no personal data in it, by design (the schedule is public, ADR 0006).
//
//   { "classes": [ { "id": "...", "startsAt": "2026-12-01T17:30:00+01:00", "name": "...",
//                    "themeName": "optional", "instructor": "first name",
//                    "freeBikes": 12, "capacity": 20, "takenBikes": [1, 2, 5] } ] }
//
// takenBikes are the bike numbers (1 to capacity) that are booked, sorted, no repeats. Numbers only, never who
// booked them. freeBikes must equal capacity minus takenBikes.length, a row that disagrees is dropped.
//
// Until the app exists, src/pages/api/schedule.json.ts serves mock data at the same path and marks it with
// "source": "mock". When the app is live: proxy this path to the app (Netlify redirect, status 200), delete the
// mock page and the Placeholder in NextClasses.astro, and src/data/next-classes.ts stays as the offline fallback.
import { withBase } from './base.ts';

export type NextClass = {
  id: string;
  startsAt: string;
  name: string;
  /** Optional theme the owner types per class (e.g. "Britney Spears"). Shown instead of the class name. */
  themeName?: string;
  instructor: string;
  /** Bikes still free in the class. 0 means full, and the card offers the waiting list. */
  freeBikes: number;
  capacity: number;
  /** Bike numbers already booked, sorted, unique, each 1 to capacity. Never names or who booked. */
  takenBikes: number[];
};

export const SCHEDULE_FEED_URL = withBase('/api/schedule.json');
export const MAX_CARDS = 4;

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** The lowest bike number nobody has taken, or null when the class is full. */
export function firstFreeBike(c: Pick<NextClass, 'capacity' | 'takenBikes'>): number | null {
  for (let n = 1; n <= c.capacity; n += 1) if (!c.takenBikes.includes(n)) return n;
  return null;
}

/** Sorted copy when every entry is an integer from 1 to capacity and none repeats, else null. */
function cleanBikes(v: unknown, capacity: number): number[] | null {
  if (!Array.isArray(v)) return null;
  const ok = v.every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= capacity);
  const sorted = ok ? [...(v as number[])].sort((a, b) => a - b) : null;
  return sorted && sorted.every((n, i) => i === 0 || n !== sorted[i - 1]) ? sorted : null;
}

/**
 * Validates a feed. Bad rows and classes that already started are dropped. Null when the body is not a feed.
 * The homepage cards keep the default limit, the schedule page passes a larger one.
 */
export function parseSchedule(
  json: unknown,
  now: Date = new Date(),
  limit: number = MAX_CARDS
): { source?: string; classes: NextClass[] } | null {
  if (!json || typeof json !== 'object' || !Array.isArray((json as { classes?: unknown }).classes)) return null;
  const { source, classes } = json as { source?: unknown; classes: unknown[] };
  const out: NextClass[] = [];
  for (const row of classes) {
    const c = row as Partial<NextClass> | null;
    if (!c || !isText(c.id) || !isText(c.startsAt) || !isText(c.name) || !isText(c.instructor)) continue;
    if (!isCount(c.freeBikes) || !isCount(c.capacity) || c.capacity < 1 || c.freeBikes > c.capacity) continue;
    const takenBikes = cleanBikes(c.takenBikes, c.capacity);
    if (!takenBikes || c.freeBikes !== c.capacity - takenBikes.length) continue;
    const at = Date.parse(c.startsAt);
    if (Number.isNaN(at) || at <= now.getTime()) continue;
    out.push({
      id: c.id,
      startsAt: c.startsAt,
      name: c.name,
      ...(isText(c.themeName) ? { themeName: c.themeName } : {}),
      instructor: c.instructor,
      freeBikes: c.freeBikes,
      capacity: c.capacity,
      takenBikes,
    });
  }
  out.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return { source: typeof source === 'string' ? source : undefined, classes: out.slice(0, limit) };
}
