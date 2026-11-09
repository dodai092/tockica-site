import { isBookable, descriptorLine } from './schedule.js';
export { descriptorLine };
import { takenBikes } from './booking.js';
import { taughtBy } from './payroll.js';

export function firstName(name) {
  return name.trim().split(/\s+/)[0] ?? '';
}

// What the public site may show: next open classes, first names only, no customer data.
export function publicNextClasses(store, now, limit = 4) {
  return store.classes
    .filter((c) => isBookable(c, now))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      startsAt: c.startsAt,
      name: c.name,
      themeName: c.themeName?.trim() || null,
      instructor: firstName(store.instructors.find((i) => i.id === taughtBy(c))?.name ?? ''),
      freeBikes: c.bikeCount - takenBikes(store, c.id).length,
      capacity: c.bikeCount,
    }));
}
