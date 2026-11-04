import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const banner = (html) => html.match(/<div[^>]*id="cookie-consent"[\s\S]*?<\/div><\/div>/)?.[0] ?? '';
const pages = [
  {
    lang: 'hr',
    file: 'dist/index.html',
    schedule: 'dist/raspored/index.html',
    accept: 'Prihvati',
    decline: 'Odbij',
    privacy: '/privatnost',
  },
  {
    lang: 'en',
    file: 'dist/en/index.html',
    schedule: 'dist/en/schedule/index.html',
    accept: 'Accept',
    decline: 'Decline',
    privacy: '/en/privacy',
  },
];

for (const { lang, file, schedule, accept, decline, privacy } of pages) {
  test(`${lang}: consent banner is in that language and links that language's privacy page`, async () => {
    const b = banner(await read(file));
    assert.ok(b, 'no banner');
    assert.ok(b.includes(`>${accept}<`) || b.includes(`${accept}\n`) || b.includes(accept));
    assert.ok(b.includes(decline));
    assert.ok(b.includes(`href="${privacy}"`));
    assert.ok(!b.includes('href="/cookies"'));
    if (lang === 'hr') assert.ok(!/Decline|Accept|We use cookies/.test(b));
    else assert.ok(!/Prihvati|Odbij/.test(b));
  });

  test(`${lang}: banner sits above the mobile book bar, and flush bottom on the schedule page`, async () => {
    const html = await read(file);
    assert.match(banner(html), /bottom-\[calc\(4\.5rem/);
    assert.match(banner(html), /md:bottom-0/);
    assert.ok(!/bottom-\[calc\(4\.5rem/.test(banner(await read(schedule))), 'schedule has no book bar');
  });

  test(`${lang}: consent is required and no GA id is set`, async () => {
    const html = await read(file);
    const init = html.match(/<script[^>]*id="?ga-init"?[^>]*>/)?.[0] ?? '';
    assert.match(init, /data-consent="?required/);
    assert.match(init, /data-id(?=[\s>])/, 'GA id stays empty (TODO(client), intake)');
    assert.ok(!/<script[^>]*src=[^>]*googletagmanager/.test(html), 'no GA tag loads before consent');
  });

  test(`${lang}: JSON-LD has the name and none of the unconfirmed NAP`, async () => {
    const html = await read(file);
    const ld = html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/)?.[1];
    assert.ok(ld, 'no JSON-LD');
    const data = JSON.parse(ld);
    assert.equal(data.name, 'Točkica na i');
    for (const key of ['address', 'telephone', 'email', 'openingHours', 'geo'])
      assert.ok(!(key in data), `${key} must stay out until doc item 8`);
  });
}
