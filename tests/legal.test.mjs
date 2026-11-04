import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
// Built HTML is minified, attributes alphabetical, so no regex assumes attribute order.
const noindex = /<meta[^>]*(?:name="robots"[^>]*content="[^"]*noindex|content="[^"]*noindex[^"]*"[^>]*name="robots")/;

const pages = [
  { lang: 'hr', file: 'dist/pravilnik/index.html', h1: 'Pravilnik studija', official: /službeni tekst/i },
  { lang: 'hr', file: 'dist/uvjeti/index.html', h1: 'Uvjeti korištenja', official: /službeni tekst/i },
  { lang: 'hr', file: 'dist/privatnost/index.html', h1: 'Privatnost', official: /službeni tekst/i },
  { lang: 'en', file: 'dist/en/rules/index.html', h1: 'Studio rules', official: /Croatian[^<]*official/i },
  { lang: 'en', file: 'dist/en/terms/index.html', h1: 'Terms of use', official: /Croatian[^<]*official/i },
  { lang: 'en', file: 'dist/en/privacy/index.html', h1: 'Privacy', official: /Croatian[^<]*official/i },
];

for (const { lang, file, h1, official } of pages) {
  test(`${file}: noindex, official-language note, placeholder body`, async () => {
    const html = await read(file);
    assert.match(html, noindex);
    assert.ok(html.includes(`<html lang="${lang}"`) || html.includes(`lang="${lang}"`));
    assert.match(html, new RegExp(`<h1[^>]*>${h1}</h1>`));
    assert.match(html, official);
    assert.match(html, /data-todo="[^"]*"/, 'legal body is a placeholder (doc item 14)');
  });
}

test('pages do not reuse the template terms or privacy text', async () => {
  for (const { file } of pages) {
    const html = await read(file);
    assert.ok(!/AstroWind|Lorem ipsum|arthelokyo/i.test(html), file);
  }
});
