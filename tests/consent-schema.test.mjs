import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const files = ['dist/index.html', 'dist/en/index.html', 'dist/raspored/index.html', 'dist/en/schedule/index.html'];

for (const file of files) {
  test(`${file}: no consent banner while there is no GA id (nothing to consent to, a banner could not remember the choice)`, async () => {
    const html = await read(file);
    assert.ok(!/id="?cookie-consent/.test(html), 'banner must not render without a GA id');
  });

  test(`${file}: consent is required and no GA id is set`, async () => {
    const html = await read(file);
    const init = html.match(/<script[^>]*id="?ga-init"?[^>]*>/)?.[0] ?? '';
    assert.match(init, /data-consent="?required/);
    assert.match(init, /data-id(?=[\s>])/, 'GA id stays empty (TODO(client), intake)');
    assert.ok(!/<script[^>]*src=[^>]*googletagmanager/.test(html), 'no GA tag loads before consent');
  });

  test(`${file}: JSON-LD has the name and none of the unconfirmed NAP`, async () => {
    const html = await read(file);
    const ld = html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/)?.[1];
    assert.ok(ld, 'no JSON-LD');
    const data = JSON.parse(ld);
    assert.equal(data.name, 'Točkica na i');
    for (const key of ['address', 'telephone', 'email', 'openingHours', 'geo'])
      assert.ok(!(key in data), `${key} must stay out until doc item 8`);
  });
}
