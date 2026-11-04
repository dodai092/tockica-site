// MOCK DATA. Replace with the booking app's public schedule endpoint when the ADR 0005
// endpoint exists. Class name and times are placeholders, not the real timetable.
// Instructors are first names only.
export type NextClass = {
  id: string;
  startsAt: string;
  name: string;
  instructor: string;
  freeBikes: number;
  capacity: number;
};

export const nextClasses: NextClass[] = [
  {
    id: 'mock-1',
    startsAt: '2026-12-01T17:30:00+01:00',
    name: 'Rhythm spin',
    instructor: 'Oliver',
    freeBikes: 12,
    capacity: 20,
  },
  {
    id: 'mock-2',
    startsAt: '2026-12-01T19:00:00+01:00',
    name: 'Rhythm spin',
    instructor: 'Mirna',
    freeBikes: 3,
    capacity: 20,
  },
  {
    id: 'mock-3',
    startsAt: '2026-12-02T18:00:00+01:00',
    name: 'Rhythm spin',
    instructor: 'Ena',
    freeBikes: 0,
    capacity: 20,
  },
  {
    id: 'mock-4',
    startsAt: '2026-12-02T19:15:00+01:00',
    name: 'Rhythm spin',
    instructor: 'Emma',
    freeBikes: 8,
    capacity: 20,
  },
];
