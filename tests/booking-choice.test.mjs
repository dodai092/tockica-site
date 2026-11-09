// The kept choice (src/lib/booking-choice.ts): class id, start time and bike number, nothing else.
import assert from 'node:assert/strict';
import test from 'node:test';
import { clearChoice, loadChoice, saveChoice } from '../src/lib/booking-choice.ts';

const NOW = new Date('2026-11-10T10:00:00Z');
const FUTURE = '2026-11-10T17:00:00Z';
const PAST = '2026-11-10T09:00:00Z';
const KEY = 'tockica.choice';

const fake = () => {
  const m = new Map();
  return {
    m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
  };
};
const broken = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
  removeItem() {
    throw new Error('blocked');
  },
};

test('a choice round-trips', () => {
  const s = fake();
  saveChoice({ classId: 'c1', startsAt: FUTURE, bike: 7 }, s);
  assert.deepEqual(loadChoice(NOW, s), { classId: 'c1', startsAt: FUTURE, bike: 7 });
});

test('bike null (waiting list) is allowed', () => {
  const s = fake();
  saveChoice({ classId: 'c1', startsAt: FUTURE, bike: null }, s);
  assert.deepEqual(loadChoice(NOW, s), { classId: 'c1', startsAt: FUTURE, bike: null });
});

test('only classId, startsAt and bike are stored', () => {
  const s = fake();
  saveChoice({ classId: 'c1', startsAt: FUTURE, bike: 3, name: 'Ana', email: 'a@b.hr' }, s);
  assert.deepEqual(Object.keys(JSON.parse(s.m.get(KEY))).sort(), ['bike', 'classId', 'startsAt']);
});

test('missing, garbage and wrong types load as null', () => {
  const s = fake();
  assert.equal(loadChoice(NOW, s), null);
  for (const raw of [
    'not json',
    'null',
    '[]',
    '"x"',
    '{}',
    JSON.stringify({ classId: 1, startsAt: FUTURE, bike: 3 }),
    JSON.stringify({ classId: 'c1', startsAt: 5, bike: 3 }),
    JSON.stringify({ classId: 'c1', startsAt: 'soon', bike: 3 }),
    JSON.stringify({ classId: 'c1', startsAt: FUTURE, bike: '3' }),
    JSON.stringify({ classId: 'c1', startsAt: FUTURE, bike: 2.5 }),
    JSON.stringify({ classId: '', startsAt: FUTURE, bike: 3 }),
  ]) {
    s.setItem(KEY, raw);
    assert.equal(loadChoice(NOW, s), null, raw);
  }
});

test('bike outside 1 to 20 loads as null', () => {
  const s = fake();
  for (const bike of [0, 21, -1]) {
    s.setItem(KEY, JSON.stringify({ classId: 'c1', startsAt: FUTURE, bike }));
    assert.equal(loadChoice(NOW, s), null, String(bike));
  }
  for (const bike of [1, 20]) {
    s.setItem(KEY, JSON.stringify({ classId: 'c1', startsAt: FUTURE, bike }));
    assert.equal(loadChoice(NOW, s)?.bike, bike);
  }
});

test('a class that has started loads as null', () => {
  const s = fake();
  saveChoice({ classId: 'c1', startsAt: PAST, bike: 3 }, s);
  assert.equal(loadChoice(NOW, s), null);
  saveChoice({ classId: 'c1', startsAt: NOW.toISOString(), bike: 3 }, s);
  assert.equal(loadChoice(NOW, s), null, 'starting exactly now is not in the future');
});

test('clearChoice removes the key', () => {
  const s = fake();
  saveChoice({ classId: 'c1', startsAt: FUTURE, bike: 3 }, s);
  clearChoice(s);
  assert.equal(s.m.has(KEY), false);
});

test('storage that throws never throws out of the functions', () => {
  assert.doesNotThrow(() => saveChoice({ classId: 'c1', startsAt: FUTURE, bike: 3 }, broken));
  assert.equal(loadChoice(NOW, broken), null);
  assert.doesNotThrow(() => clearChoice(broken));
});

test('a blocked default sessionStorage (accessor throws) keeps the functions silent', () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    get() {
      throw new Error('SecurityError');
    },
  });
  try {
    assert.doesNotThrow(() => saveChoice({ classId: 'c1', startsAt: FUTURE, bike: 3 }));
    assert.equal(loadChoice(NOW), null);
    assert.doesNotThrow(() => clearChoice());
  } finally {
    if (saved) Object.defineProperty(globalThis, 'sessionStorage', saved);
    else delete globalThis.sessionStorage;
  }
});
