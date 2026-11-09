// The visitor's pick, kept for the tab session so it survives the login step and a reload (ADR 0006).
// Holds the class id, its start time and the bike number. Never a name, email or booking data.
import { BIKE_COUNT } from './bike-map.ts';

export type Choice = { classId: string; startsAt: string; bike: number | null };

const KEY = 'tockica.choice';

const store = (storage?: Storage): Storage | undefined => {
  try {
    return storage ?? sessionStorage;
  } catch {
    return undefined;
  }
};

export function saveChoice(c: Choice, storage?: Storage): void {
  try {
    const { classId, startsAt, bike } = c;
    store(storage)?.setItem(KEY, JSON.stringify({ classId, startsAt, bike }));
  } catch {
    /* storage blocked: the page works without a kept choice */
  }
}

export function loadChoice(now: Date = new Date(), storage?: Storage): Choice | null {
  try {
    const raw = store(storage)?.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v !== 'object') return null;
    const { classId, startsAt, bike } = v;
    if (typeof classId !== 'string' || !classId) return null;
    if (typeof startsAt !== 'string') return null;
    const t = Date.parse(startsAt);
    if (!Number.isFinite(t) || t <= now.getTime()) return null;
    if (bike !== null && !(Number.isInteger(bike) && bike >= 1 && bike <= BIKE_COUNT)) return null;
    return { classId, startsAt, bike };
  } catch {
    return null;
  }
}

export function clearChoice(storage?: Storage): void {
  try {
    store(storage)?.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
}
