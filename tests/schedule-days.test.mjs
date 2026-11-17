// Studio-day helpers behind the schedule page (src/lib/schedule-days.ts).
import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays, dayOfWeek, groupByDay, isBookable, mondayOf, studioDay } from '../src/lib/schedule-days.ts';

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

test('isBookable opens this studio week and the next, later weeks are not open yet', () => {
  const monday = new Date('2026-11-16T09:00:00+01:00');
  const sunday = new Date('2026-11-22T22:00:00+01:00');
  // Week of 16 Nov and the week of 23 Nov are open, the week of 30 Nov is not.
  assert.equal(isBookable('2026-11-29T20:00:00+01:00', monday, '2000-01-01'), true);
  assert.equal(isBookable('2026-11-30T07:30:00+01:00', monday, '2000-01-01'), false);
  // The window is by studio week, so on the Sunday it is the same two weeks.
  assert.equal(isBookable('2026-11-29T20:00:00+01:00', sunday, '2000-01-01'), true);
  assert.equal(isBookable('2026-11-30T07:30:00+01:00', sunday, '2000-01-01'), false);
  // The day after the Sunday starts a new week, and the window moves on.
  assert.equal(isBookable('2026-11-30T07:30:00+01:00', new Date('2026-11-23T08:00:00+01:00'), '2000-01-01'), true);
});

test('isBookable is false before the opening day, whatever the week', () => {
  const now = new Date('2027-01-03T20:00:00+01:00');
  assert.equal(isBookable('2027-01-04T07:30:00+01:00', now, '2027-01-04'), false);
  assert.equal(isBookable('2027-01-04T07:30:00+01:00', new Date('2027-01-04T08:00:00+01:00'), '2027-01-04'), true);
});
