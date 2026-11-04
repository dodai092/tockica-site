import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { formatEur, pricePerClass } from '../src/lib/packs.ts';
import { packs } from '../src/data/packs.ts';

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

test('data lists only the two intro packs from source.md item 5', () => {
  assert.deepEqual(
    packs.map((p) => [p.classes, p.priceEur, p.intro]),
    [
      [1, 10, true],
      [3, 30, true],
    ]
  );
});

for (const [lang, file, fmt] of [
  ['hr', 'paketi/index.html', (n) => `${n} €`],
  ['en', 'en/packs/index.html', (n) => `€${n}`],
]) {
  test(`${lang}: page lists both intro packs with price and price per class`, async () => {
    const html = await read(file);
    const cards = [...html.matchAll(/<li\b[^>]*data-pack="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)];
    assert.equal(cards.length, 2);
    const [one, three] = cards.map((c) => c[2]);
    assert.ok(one.includes(fmt(10)));
    assert.ok(three.includes(fmt(30)));
    for (const card of [one, three]) assert.ok(/data-per-class="10"/.test(card) && card.includes(fmt(10)));
  });

  test(`${lang}: regular packs are an open placeholder, no invented prices`, async () => {
    const html = await read(file);
    assert.ok(/data-todo="[^"]*regular packs[^"]*"/.test(html));
    assert.equal([...html.matchAll(/data-pack="/g)].length, 2);
  });

  test(`${lang}: page is a twin of the other language`, async () => {
    const html = await read(file);
    assert.match(html, new RegExp(`<html[^>]*\\slang="${lang}"`));
    assert.ok(html.includes(lang === 'hr' ? 'href="/en/packs"' : 'href="/paketi"'));
  });
}
