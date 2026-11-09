// Seat state and label for a class card (src/lib/seats.ts), and the instructor avatar (src/lib/avatar.ts).
import assert from 'node:assert/strict';
import test from 'node:test';
import { SCARCE_AT, seatLabel, seatState } from '../src/lib/seats.ts';
import { initialOf, tintIndex, TINTS } from '../src/lib/avatar.ts';

const hr = {
  full: 'Popunjeno',
  plenty: '{n} slobodnih',
  scarce: { one: 'Još {n} slobodan', few: 'Još {n} slobodna', other: 'Još {n} slobodnih' },
};
const en = {
  full: 'Full',
  plenty: '{n} free',
  scarce: { one: 'Only {n} left', few: 'Only {n} left', other: 'Only {n} left' },
};

test('seatState: percent of seats taken, scarce at three or fewer, full at none', () => {
  assert.equal(SCARCE_AT, 3);
  assert.deepEqual(seatState(2, 20), { full: false, scarce: true, percent: 90 });
  assert.deepEqual(seatState(3, 20), { full: false, scarce: true, percent: 85 });
  assert.deepEqual(seatState(4, 20), { full: false, scarce: false, percent: 80 });
  assert.deepEqual(seatState(17, 20), { full: false, scarce: false, percent: 15 });
  assert.deepEqual(seatState(0, 20), { full: true, scarce: false, percent: 100 });
  assert.deepEqual(seatState(4, 16), { full: false, scarce: false, percent: 75 });
});

test('seatState stays inside 0 to 100 for odd input', () => {
  assert.equal(seatState(25, 20).percent, 0);
  assert.equal(seatState(-1, 20).percent, 100);
  assert.equal(seatState(-1, 20).full, true);
  assert.equal(seatState(0, 0).percent, 100);
});

test('seatLabel in Croatian follows the plural of the number', () => {
  assert.equal(seatLabel(1, 20, hr, 'hr'), 'Još 1 slobodan');
  assert.equal(seatLabel(2, 20, hr, 'hr'), 'Još 2 slobodna');
  assert.equal(seatLabel(3, 20, hr, 'hr'), 'Još 3 slobodna');
  assert.equal(seatLabel(5, 20, hr, 'hr'), '5 slobodnih');
  assert.equal(seatLabel(17, 20, hr, 'hr'), '17 slobodnih');
  assert.equal(seatLabel(0, 20, hr, 'hr'), 'Popunjeno');
});

test('seatLabel in English', () => {
  assert.equal(seatLabel(1, 20, en, 'en'), 'Only 1 left');
  assert.equal(seatLabel(3, 20, en, 'en'), 'Only 3 left');
  assert.equal(seatLabel(9, 20, en, 'en'), '9 free');
  assert.equal(seatLabel(0, 20, en, 'en'), 'Full');
});

test('avatar: initial in capitals, one of the tints, the same for the same name', () => {
  assert.equal(initialOf('Oliver'), 'O');
  assert.equal(initialOf('  ena'), 'E');
  assert.equal(initialOf(''), '');
  for (const name of ['Oliver', 'Emma', 'Mirna', 'Ena', 'Dunia', 'Šime']) {
    const i = tintIndex(name);
    assert.ok(Number.isInteger(i) && i >= 0 && i < TINTS.length, `${name} -> ${i}`);
    assert.equal(tintIndex(name), i);
  }
  assert.equal(initialOf('Šime'), 'Š');
});
