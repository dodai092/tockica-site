// Studio-day helpers behind the schedule page (src/lib/schedule-days.ts).
import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays, dayOfWeek, groupByDay, mondayOf, studioDay } from '../src/lib/schedule-days.ts';

test('studioDay uses Zagreb time, not UTC', () => {
  assert.equal(studioDay('2026-12-01T23:30:00+01:00'), '2026-12-01');
  assert.equal(studioDay('2026-12-01T22:30:00Z'), '2026-12-01');
  assert.equal(studioDay('2026-12-01T23:30:00Z'), '2026-12-02');
});

test('dayOfWeek is 1 for Monday to 7 for Sunday', () => {
  assert.equal(dayOfWeek('2026-11-30'), 1);
  assert.equal(dayOfWeek('2026-12-05'), 6);
  assert.equal(dayOfWeek('2026-12-06'), 7);
});

test('addDays crosses month and year ends', () => {
  assert.equal(addDays('2026-12-30', 3), '2027-01-02');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('mondayOf gives the Monday of the studio week, a Sunday belongs to the week before', () => {
  assert.equal(mondayOf('2026-12-02'), '2026-11-30');
  assert.equal(mondayOf('2026-11-30'), '2026-11-30');
  assert.equal(mondayOf('2026-12-06'), '2026-11-30');
});

test('groupByDay groups by studio day in start order and leaves empty days out', () => {
  const c = (id, startsAt) => ({ id, startsAt });
  const groups = groupByDay([
    c('b', '2026-12-02T19:00:00+01:00'),
    c('a', '2026-12-02T09:00:00+01:00'),
    c('z', '2026-12-04T09:00:00+01:00'),
  ]);
  assert.deepEqual([...groups.keys()], ['2026-12-02', '2026-12-04']);
  assert.deepEqual(
    groups.get('2026-12-02').map((x) => x.id),
    ['a', 'b']
  );
});
