// MOCK schedule for the booking app's public endpoint (src/pages/api/schedule.json.ts). A weekly template, as the
// booking prototype keeps it (prototype/src/model.js `template`, schedule.js `generateWeek`), repeated for three
// weeks, Monday to Saturday, 60 minute classes, 20 bikes. Class names, times and instructors are placeholders,
// not the real timetable. Delete with the endpoint when the app is proxied at that path.
import { addDays, dayOfWeek, studioDay, STUDIO_ZONE } from './schedule-days.ts';
import type { NextClass } from './schedule-feed.ts';

const CAPACITY = 20;
const WEEKS = 3;

type Slot = { dayOfWeek: number; time: string; name: string; instructor: string; themeName?: string };

// Training names are placeholders until the studio sends the real list.
const RIDE = 'Riders Room';
const ABS = 'ABS Spin';
const WEEKDAY_INSTRUCTORS = ['Mirna', 'Ena', 'Oliver', 'Emma'];
const TEMPLATE: Slot[] = [
  ...[1, 2, 3, 4, 5].flatMap((dayOfWeek): Slot[] =>
    ['09:00', '17:30', '19:00'].map((time, i) => {
      const instructor = WEEKDAY_INSTRUCTORS[(dayOfWeek + i) % WEEKDAY_INSTRUCTORS.length];
      return {
        dayOfWeek,
        time,
        name: instructor === 'Emma' ? ABS : RIDE,
        instructor,
        ...(dayOfWeek === 3 && time === '19:00' ? { themeName: 'Britney Spears' } : {}),
      };
    })
  ),
  { dayOfWeek: 6, time: '10:00', name: RIDE, instructor: 'Mirna' },
  { dayOfWeek: 6, time: '11:15', name: RIDE, instructor: 'Oliver', themeName: '90s Party' },
];

// Booked bikes per slot position, cycled, so every week has full, nearly full and quiet classes.
const TAKEN_COUNTS = [8, 14, 19, 5, 20, 11, 17, 2, 20, 13];

/** Studio wall time ("YYYY-MM-DD", "HH:mm") to an ISO instant with the right offset for that date. */
function atStudioTime(ymd: string, time: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, h, min);
  const offsetAt = (utc: number) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: STUDIO_ZONE,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
        .formatToParts(new Date(utc))
        .map((x) => [x.type, Number(x.value)])
    );
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - utc;
  };
  const guess = wall - offsetAt(wall);
  return new Date(wall - offsetAt(guess)).toISOString();
}

/** Small seeded generator (mulberry32), so a class always has the same bikes taken. */
function seeded(text: string) {
  let a = 0;
  for (const ch of text) a = (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickTaken(id: string, count: number): number[] {
  const rand = seeded(id);
  const pool = Array.from({ length: CAPACITY }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

/** The current studio week (the next one on a Sunday) and the two after it. Past classes are included. */
export function buildMockSchedule(now: Date): NextClass[] {
  const today = studioDay(now);
  const dow = dayOfWeek(today);
  const monday = addDays(today, dow === 7 ? 1 : 1 - dow);
  const out: NextClass[] = [];
  let position = 0;
  for (let w = 0; w < WEEKS; w += 1) {
    for (const slot of TEMPLATE) {
      const day = addDays(monday, w * 7 + slot.dayOfWeek - 1);
      const id = `mock-${day}-${slot.time.replace(':', '')}${slot.themeName ? '-theme' : ''}`;
      const takenBikes = pickTaken(id, TAKEN_COUNTS[position % TAKEN_COUNTS.length]);
      position += 1;
      out.push({
        id,
        startsAt: atStudioTime(day, slot.time),
        name: slot.name,
        ...(slot.themeName ? { themeName: slot.themeName } : {}),
        instructor: slot.instructor,
        freeBikes: CAPACITY - takenBikes.length,
        capacity: CAPACITY,
        takenBikes,
      });
    }
  }
  return out.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
