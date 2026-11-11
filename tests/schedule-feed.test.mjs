// The next-classes feed contract (src/lib/schedule-feed.ts): what the booking app's endpoint must return, and
// what the cards do with it. The mock endpoint is built to the same shape.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { MAX_CARDS, firstFreeBike, parseSchedule } from '../src/lib/schedule-feed.ts';
import { buildMockSchedule } from '../src/lib/mock-schedule.ts';

const now = new Date('2026-12-01T10:00:00+01:00');
const bikes = (n) => Array.from({ length: n }, (_, i) => i + 1);
const row = (id, startsAt, extra = {}) => ({
  id,
  startsAt,
  name: "50' Riders Room",
  instructor: 'Ena',
  freeBikes: 5,
  capacity: 20,
  takenBikes: bikes(15),
  ...extra,
});

test('keeps valid upcoming classes, sorted by start, at most four', () => {
  const feed = parseSchedule(
    {
      classes: [
        row('c', '2026-12-03T18:00:00+01:00'),
        row('a', '2026-12-01T17:30:00+01:00'),
        row('b', '2026-12-02T17:30:00+01:00', { themeName: 'Britney Spears' }),
        row('d', '2026-12-04T17:30:00+01:00'),
        row('e', '2026-12-05T17:30:00+01:00'),
      ],
    },
    now
  );
  assert.equal(feed.classes.length, MAX_CARDS);
  assert.deepEqual(
    feed.classes.map((c) => c.id),
    ['a', 'b', 'c', 'd']
  );
  assert.equal(feed.classes[1].themeName, 'Britney Spears');
});

test('drops classes that already started and rows with missing or bad fields', () => {
  const feed = parseSchedule(
    {
      classes: [
        row('past', '2026-12-01T09:00:00+01:00'),
        row('bad-date', 'tomorrow'),
        { id: 'no-instructor', startsAt: '2026-12-02T17:30:00+01:00', name: 'x' },
        null,
        row('ok', '2026-12-02T17:30:00+01:00'),
      ],
    },
    now
  );
  assert.deepEqual(
    feed.classes.map((c) => c.id),
    ['ok']
  );
});

test('carries the free-bike count and nothing else beyond the card fields', () => {
  const feed = parseSchedule(
    {
      classes: [
        row('a', '2026-12-02T17:30:00+01:00', {
          freeBikes: 0,
          takenBikes: bikes(20),
          email: 'x@y.z',
          riders: ['Ana'],
        }),
      ],
    },
    now
  );
  assert.deepEqual(Object.keys(feed.classes[0]).sort(), [
    'capacity',
    'freeBikes',
    'id',
    'instructor',
    'name',
    'startsAt',
    'takenBikes',
  ]);
  assert.equal(feed.classes[0].freeBikes, 0);
});

test('drops classes with a missing or impossible bike count', () => {
  const feed = parseSchedule(
    {
      classes: [
        row('negative', '2026-12-02T17:30:00+01:00', { freeBikes: -1 }),
        row('too-many', '2026-12-02T17:30:00+01:00', { freeBikes: 21, takenBikes: [] }),
        row('fraction', '2026-12-02T17:30:00+01:00', { freeBikes: 2.5 }),
        row('no-capacity', '2026-12-02T17:30:00+01:00', { capacity: 0 }),
        row('text', '2026-12-02T17:30:00+01:00', { freeBikes: '5' }),
        row('ok', '2026-12-02T17:30:00+01:00'),
      ],
    },
    now
  );
  assert.deepEqual(
    feed.classes.map((c) => c.id),
    ['ok']
  );
});

test('keeps takenBikes sorted and drops rows with bad bike numbers or a count that disagrees', () => {
  const at = '2026-12-02T17:30:00+01:00';
  const feed = parseSchedule(
    {
      classes: [
        row('sorted', at, { freeBikes: 17, takenBikes: [3, 1, 2] }),
        row('dupe', at, { freeBikes: 18, takenBikes: [4, 4] }),
        row('zero', at, { freeBikes: 19, takenBikes: [0] }),
        row('over', at, { freeBikes: 19, takenBikes: [21] }),
        row('fraction', at, { freeBikes: 19, takenBikes: [2.5] }),
        row('text', at, { freeBikes: 19, takenBikes: ['3'] }),
        row('missing', at, { takenBikes: undefined }),
        row('mismatch', at, { freeBikes: 5, takenBikes: [1, 2] }),
      ],
    },
    now
  );
  assert.deepEqual(
    feed.classes.map((c) => c.id),
    ['sorted']
  );
  assert.deepEqual(feed.classes[0].takenBikes, [1, 2, 3]);
});

test('a limit argument lifts the card cap', () => {
  const classes = Array.from({ length: 9 }, (_, i) =>
    row(`c${i}`, `2026-12-${String(i + 2).padStart(2, '0')}T17:30:00+01:00`)
  );
  assert.equal(parseSchedule({ classes }, now).classes.length, MAX_CARDS);
  assert.equal(parseSchedule({ classes }, now, 100).classes.length, 9);
});

test('firstFreeBike is the lowest unused number, null when full', () => {
  const base = { capacity: 20, id: 'x' };
  assert.equal(firstFreeBike({ ...base, takenBikes: [1, 2, 4] }), 3);
  assert.equal(firstFreeBike({ ...base, takenBikes: [] }), 1);
  assert.equal(firstFreeBike({ ...base, takenBikes: bikes(20) }), null);
});

test('returns null for anything that is not a feed', () => {
  for (const body of [null, 'x', 42, {}, { classes: 'no' }, []]) assert.equal(parseSchedule(body, now), null);
});

const studioDate = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zagreb' }).format(new Date(iso));
const studioDow = (iso) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Zagreb', weekday: 'short' }).format(new Date(iso));

test('mock schedule: three weeks, Monday to Sunday', () => {
  const all = buildMockSchedule(new Date('2026-12-02T10:00:00+01:00'));
  const days = [...new Set(all.map((c) => studioDate(c.startsAt)))];
  assert.equal(days.length, 21);
  assert.equal(days[0], '2026-11-30');
  assert.equal(days.at(-1), '2026-12-20');
  assert.ok(all.some((c) => studioDow(c.startsAt) === 'Sun'));
});

test('mock schedule: deterministic, unique ids, every row passes the contract', () => {
  const now = new Date('2026-12-02T10:00:00+01:00');
  const a = buildMockSchedule(now);
  assert.deepEqual(a, buildMockSchedule(now));
  assert.equal(new Set(a.map((c) => c.id)).size, a.length);
  const feed = parseSchedule({ classes: a }, new Date('2020-01-01T00:00:00Z'), 1000);
  assert.equal(feed.classes.length, a.length);
});

test("mock schedule: a Sunday still starts at that week's Monday, summer time keeps the studio hour", () => {
  const sunday = buildMockSchedule(new Date('2026-12-06T12:00:00+01:00'));
  assert.equal(studioDate(sunday[0].startsAt), '2026-11-30');
  const summer = buildMockSchedule(new Date('2026-07-01T10:00:00+02:00'));
  const hours = new Set(
    summer.map((c) =>
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zagreb', timeStyle: 'short' }).format(new Date(c.startsAt))
    )
  );
  assert.ok(hours.has('17:30'));
});

test('mock schedule: has full classes and nearly full ones', () => {
  const all = buildMockSchedule(new Date('2026-12-02T10:00:00+01:00'));
  assert.ok(all.some((c) => c.freeBikes === 0));
  assert.ok(all.some((c) => c.freeBikes > 0 && c.freeBikes <= 3));
});

test('the mock endpoint is built, marked as mock and matches the contract', async () => {
  const body = JSON.parse(await readFile(new URL('../dist/api/schedule.json', import.meta.url), 'utf8'));
  assert.equal(body.source, 'mock');
  assert.ok(body.classes.length > MAX_CARDS);
  // Checked against a date before the mock classes, so it keeps passing after they have passed.
  const feed = parseSchedule(body, new Date('2020-01-01T00:00:00Z'), 1000);
  assert.equal(feed.classes.length, body.classes.length);
  for (const c of body.classes)
    assert.ok(Number.isInteger(c.freeBikes) && c.capacity === 20 && Array.isArray(c.takenBikes));
});
