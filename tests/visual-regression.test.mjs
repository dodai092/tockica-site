import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import pngjs from 'pngjs';
import { checkAgainstBaselines } from '../scripts/visual-regression.mjs';

const { PNG } = pngjs;
const png = (width, color) => {
  const value = new PNG({ width, height: 8 });
  for (let i = 0; i < value.data.length; i += 4) {
    value.data[i] = value.data[i + 1] = value.data[i + 2] = color;
    value.data[i + 3] = 255;
  }
  return PNG.sync.write(value);
};

test('missing, matching, dimensions, and pixel changes produce correct outcomes', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'quality-images-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const baselinesDir = path.join(root, 'baseline');
  const diffDir = path.join(root, 'diff');
  const shot = { slug: 'home', fileName: 'light-mobile.png', buffer: png(8, 0) };
  const run = () => checkAgainstBaselines({ shots: [shot], baselinesDir, diffDir, maxDiffPixels: 25 });
  const diagnostic = path.join(diffDir, 'home/light-mobile.png');
  assert.equal(await run(), 1);
  assert.deepEqual(await readFile(diagnostic), shot.buffer);
  await mkdir(path.join(baselinesDir, 'home'), { recursive: true });
  await writeFile(path.join(baselinesDir, 'home/light-mobile.png'), shot.buffer);
  assert.equal(await run(), 0);
  assert.equal(existsSync(diffDir), false);
  shot.buffer = png(9, 0);
  assert.equal(await run(), 1);
  assert.deepEqual(await readFile(diagnostic), shot.buffer);
  shot.buffer = png(8, 255);
  assert.equal(await run(), 1);
  assert.equal(existsSync(diagnostic), true);
});
