// MOCK DATA, and the offline fallback behind the live feed (src/lib/schedule-feed.ts). The cards show these until
// the booking app's public schedule endpoint (ADR 0005) answers. Class name and times are placeholders, not the real timetable.
// Instructors are first names only.
import type { NextClass } from '~/lib/schedule-feed';

export const nextClasses: NextClass[] = [
  {
    id: 'mock-1',
    startsAt: '2026-12-01T17:30:00+01:00',
    name: 'Riders Room',
    instructor: 'Oliver',
    freeBikes: 12,
    capacity: 20,
    takenBikes: Array.from({ length: 8 }, (_, i) => i + 1),
  },
  {
    id: 'mock-2',
    startsAt: '2026-12-01T19:00:00+01:00',
    name: 'Riders Room',
    instructor: 'Mirna',
    freeBikes: 3,
    capacity: 20,
    takenBikes: Array.from({ length: 17 }, (_, i) => i + 1),
  },
  {
    id: 'mock-3',
    startsAt: '2026-12-02T18:00:00+01:00',
    name: 'Riders Room',
    instructor: 'Ena',
    freeBikes: 0,
    capacity: 20,
    takenBikes: Array.from({ length: 20 }, (_, i) => i + 1),
  },
  {
    id: 'mock-4',
    startsAt: '2026-12-02T19:15:00+01:00',
    name: 'ABS Spin',
    instructor: 'Emma',
    freeBikes: 8,
    capacity: 20,
    takenBikes: Array.from({ length: 12 }, (_, i) => i + 1),
  },
];
