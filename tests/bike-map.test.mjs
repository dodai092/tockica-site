// Bike map layout (src/lib/bike-map.ts). Defined for 20 bikes, same as the prototype.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { BIKE_COUNT, bikePosition } from '../src/lib/bike-map.ts';

const proto = join(fileURLToPath(new URL('../', import.meta.url)), '..', 'prototype', 'src', 'layout.js');

test('there are 20 bikes', () => {
  assert.equal(BIKE_COUNT, 20);
});

test('all 20 bikes sit in distinct cells of two columns', () => {
  const cells = new Set();
  for (let n = 1; n <= BIKE_COUNT; n++) {
    const { column, row } = bikePosition(n);
    assert.ok(column === 1 || column === 2, `bike ${n} column ${column}`);
    cells.add(`${column}/${row}`);
  }
  assert.equal(cells.size, 20);
});

test('row 6 is the aisle, no bike sits in it', () => {
  for (let n = 1; n <= BIKE_COUNT; n++) assert.notEqual(bikePosition(n).row, 6, `bike ${n}`);
});

test(
  'positions match the prototype layout',
  { skip: existsSync(proto) ? false : 'prototype folder not present' },
  async () => {
    const { bikePosition: original } = await import(pathToFileURL(proto).href);
    for (let n = 1; n <= BIKE_COUNT; n++) assert.deepEqual(bikePosition(n), original(n), `bike ${n}`);
  }
);
