// MOCK schedule for the booking app's public endpoint (src/pages/api/schedule.json.ts). The studio's real weekly
// timetable ("Finalni raspored", Dunia, 2026-11-11), Monday to Sunday, repeated for three weeks, 20 bikes. Only the
// times and instructors are real. The sheet marks ABS classes and nothing else, so every other class is Riders Room.
// The bikes taken are made up. Delete with the endpoint when the app is proxied at that path.
import { addDays, dayOfWeek, studioDay, STUDIO_ZONE } from './schedule-days.ts';
import type { NextClass } from './schedule-feed.ts';

const CAPACITY = 20;
const WEEKS = 3;

type Slot = { dayOfWeek: number; time: string; name: string; instructor: string };

const RIDE = 'Riders Room';
const ABS = 'ABS Spin';
const TEMPLATE: Slot[] = [
  { dayOfWeek: 1, time: '07:30', name: RIDE, instructor: 'Mirna' },
  { dayOfWeek: 1, time: '17:30', name: RIDE, instructor: 'Ivana' },
  { dayOfWeek: 1, time: '18:45', name: RIDE, instructor: 'Dunia' },
  { dayOfWeek: 2, time: '17:30', name: RIDE, instructor: 'Oliver' },
  { dayOfWeek: 2, time: '18:45', name: RIDE, instructor: 'Emma' },
  { dayOfWeek: 3, time: '07:30', name: RIDE, instructor: 'Dunia' },
  { dayOfWeek: 3, time: '17:30', name: RIDE, instructor: 'Ena' },
  { dayOfWeek: 3, time: '18:45', name: ABS, instructor: 'Ivana' },
  { dayOfWeek: 4, time: '17:30', name: RIDE, instructor: 'Oliver' },
  { dayOfWeek: 4, time: '18:45', name: RIDE, instructor: 'Mirna' },
  { dayOfWeek: 5, time: '07:30', name: ABS, instructor: 'Ivana' },
  { dayOfWeek: 5, time: '17:30', name: RIDE, instructor: 'Domagoj' },
  { dayOfWeek: 6, time: '10:30', name: RIDE, instructor: 'Mirna' },
  { dayOfWeek: 6, time: '11:30', name: RIDE, instructor: 'Emma' },
  { dayOfWeek: 7, time: '10:30', name: RIDE, instructor: 'Dunia' },
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

/** The current studio week (Monday to Sunday) and the two after it. Past classes are included. */
export function buildMockSchedule(now: Date): NextClass[] {
  const today = studioDay(now);
  const dow = dayOfWeek(today);
  const monday = addDays(today, 1 - dow);
  const out: NextClass[] = [];
  let position = 0;
  for (let w = 0; w < WEEKS; w += 1) {
    for (const slot of TEMPLATE) {
      const day = addDays(monday, w * 7 + slot.dayOfWeek - 1);
      const id = `mock-${day}-${slot.time.replace(':', '')}`;
      const takenBikes = pickTaken(id, TAKEN_COUNTS[position % TAKEN_COUNTS.length]);
      position += 1;
      out.push({
        id,
        startsAt: atStudioTime(day, slot.time),
        name: slot.name,
        instructor: slot.instructor,
        freeBikes: CAPACITY - takenBikes.length,
        capacity: CAPACITY,
        takenBikes,
      });
    }
  }
  return out.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
