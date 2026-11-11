import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { formatEur, pricePerClass } from '../src/lib/packs.ts';
import { packs, regularPacks } from '../src/data/packs.ts';

const read = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), 'utf8');

test('pricePerClass divides and rounds to two decimals', () => {
  assert.equal(pricePerClass(30, 3), 10);
  assert.equal(pricePerClass(40, 3), 13.33);
  assert.equal(pricePerClass(10, 1), 10);
});

test('pricePerClass throws when classes is zero or negative', () => {
  assert.throws(() => pricePerClass(30, 0));
  assert.throws(() => pricePerClass(30, -3));
});

test('formatEur uses the euro sign after the number in HR and before it in EN', () => {
  assert.equal(formatEur(13.33, 'hr'), '13,33 €');
  assert.equal(formatEur(13.33, 'en'), '€13.33');
  assert.equal(formatEur(10, 'hr'), '10 €');
  assert.equal(formatEur(10, 'en'), '€10');
});

test('data: two intro packs and five regular packs from source.md item 5', () => {
  assert.deepEqual(
    packs.map((p) => [p.classes, p.priceEur, p.intro]),
    [
      [1, 10, true],
      [3, 30, true],
    ]
  );
  assert.deepEqual(
    regularPacks.map((p) => [p.classes, p.priceEur, p.discountPct]),
    [
      [1, 15, null],
      [3, 40, 11],
      [5, 65, 13],
      [9, 115, 15],
      [12, 144, 20],
    ]
  );
});

const rows = [
  ['intro-1', 10, 10, null],
  ['intro-3', 30, 10, null],
  ['regular-1', 15, 15, null],
  ['regular-3', 40, 13.33, 11],
  ['regular-5', 65, 13, 13],
  ['regular-9', 115, 12.78, 15],
  ['regular-12', 144, 12, 20],
];

for (const [lang, file, fmt] of [
  ['hr', 'paketi/index.html', (n) => `${String(n).replace('.', ',')} €`],
  ['en', 'en/packs/index.html', (n) => `€${n}`],
]) {
  test(`${lang}: page lists all seven packs with price, price per class and discount`, async () => {
    const html = await read(file);
    const cards = [...html.matchAll(/<li\b[^>]*data-pack="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)];
    assert.deepEqual(
      cards.map((c) => c[1]),
      rows.map((r) => r[0])
    );
    for (const [i, [, price, per, disc]] of rows.entries()) {
      const card = cards[i][2];
      assert.ok(card.includes(fmt(price)), `${cards[i][1]} price`);
      assert.ok(
        new RegExp(`data-per-class="${per}"[^>]*>\\s*${fmt(per).replace(/[€.]/g, '\\$&')}`).test(card),
        `${cards[i][1]} per class`
      );
      if (disc !== null) assert.ok(card.includes(`${disc}%`), `${cards[i][1]} discount`);
    }
  });

  test(`${lang}: shows the 50 minute and ABS Spin notes`, async () => {
    const html = await read(file);
    const note =
      lang === 'hr'
        ? ['traju 50 minuta', '30% kardio i 70% strength']
        : ['last 50 minutes', '30% cardio and 70% strength'];
    for (const n of note) assert.ok(html.includes(n), n);
  });

  test(`${lang}: no placeholder and no old-site prices`, async () => {
    const html = await read(file);
    const box = html.slice(html.indexOf('<h1'), html.indexOf('</main>'));
    assert.ok(!/data-todo=|Placeholder/.test(box));
    for (const old of [55, 70, 77, 85]) assert.ok(!box.includes(fmt(old)));
  });

  test(`${lang}: page is a twin of the other language`, async () => {
    const html = await read(file);
    assert.match(html, new RegExp(`<html[^>]*\\slang="${lang}"`));
    assert.ok(html.includes(lang === 'hr' ? 'href="/en/packs"' : 'href="/paketi"'));
  });
}
