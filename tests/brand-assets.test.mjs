// The share image and favicons are Točkica placeholders (plain slate with the red ring),
// not the AstroWind demo assets, until Dunia sends the official logo.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url));
const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const png = (buf) => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });

test('share image is 1200x628 and small, not the 3.9 MB template screenshot', async () => {
  const buf = await read('src/assets/images/default.png');
  assert.deepEqual(png(buf), { w: 1200, h: 628 });
  assert.ok(buf.length < 300_000, `${buf.length} bytes`);
});

test('favicon.svg is the slate square with the red ring, not the Astro logo', async () => {
  const svg = (await read('src/assets/favicons/favicon.svg')).toString();
  assert.match(svg, /#232A35/i);
  assert.match(svg, /#D71920/i);
  assert.ok(svg.length < 2000);
});

test('apple-touch-icon is 180x180 and ico holds PNG icons that are not the template ones', async () => {
  const touch = await read('src/assets/favicons/apple-touch-icon.png');
  assert.deepEqual(png(touch), { w: 180, h: 180 });
  assert.notEqual(sha(touch), '1de27c4e5295fd0e', 'still the template apple-touch-icon');
  const ico = await read('src/assets/favicons/favicon.ico');
  assert.equal(ico.readUInt16LE(2), 1, 'icon resource');
  assert.ok(ico.readUInt16LE(4) >= 1);
  assert.notEqual(sha(ico), '0252af4ff9334fe1', 'still the template favicon.ico');
});

test('the built pages point og:image at the new image and the favicon is the new svg', async () => {
  const html = (await read('dist/index.html')).toString();
  assert.ok(/og:image/.test(html));
  const svg = (await read('dist/favicon.svg').catch(() => read('src/assets/favicons/favicon.svg'))).toString();
  assert.match(svg, /#232A35/i);
});
