// Fills one cloned class row (ScheduleRow.astro) from a class, in the browser. The schedule page and the homepage
// cards both use it, so a class reads the same wherever it shows up. The row's own state (full or open) is
// chosen by which template the caller cloned.
import { TINTS, initialOf, tintIndex } from './avatar';
import { seatNote, seatState } from './seats';
import type { SeatLabels } from './seats';
import type { NextClass } from './schedule-feed';

const tintClasses = TINTS.flatMap((t) => t.split(' '));

export function fillRow(
  li: HTMLElement,
  c: NextClass,
  opts: {
    time: string;
    day?: string;
    locale: string;
    seatLabels: SeatLabels;
    profileHref?: (first: string) => string | undefined;
  }
): void {
  const set = (field: string, text: string) => {
    const el = li.querySelector(`[data-f="${field}"]`);
    if (el) el.textContent = text;
  };
  const left = c.capacity - c.takenBikes.length;
  const state = seatState(left, c.capacity);
  set('time', opts.time);
  if (opts.day !== undefined) set('day', opts.day);
  set('instructor', c.instructor);
  const who = li.querySelector('a[data-f="instructor"]');
  const href = opts.profileHref?.(c.instructor);
  if (href) who?.setAttribute('href', href);
  else who?.removeAttribute('href');
  set('initial', initialOf(c.instructor));
  const markLink = li.querySelector('a[data-f="initial"]');
  if (href) markLink?.setAttribute('href', href);
  else markLink?.removeAttribute('href');
  set('name', c.themeName ?? c.name);
  set('seats', seatNote(left, c.capacity, opts.seatLabels, opts.locale));
  li.toggleAttribute('data-scarce', state.scarce);
  const mark = li.querySelector<HTMLElement>('[data-f="initial"]');
  if (mark) {
    mark.classList.remove(...tintClasses);
    mark.classList.add(...TINTS[tintIndex(c.instructor)].split(' '));
  }
}
