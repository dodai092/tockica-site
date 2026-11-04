import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { pathFor } from '../src/i18n/index.ts';

const read = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const pages = [
  { lang: 'hr', file: 'index.html' },
  { lang: 'en', file: 'en/index.html' },
];

// Layout A, booking first: hero and next classes come before the story.
const part1 = ['hero', 'next-classes', 'about', 'rooms', 'instructors'];

function section(html, name) {
  const re = new RegExp(`<section[^>]*data-section="${name}"[^>]*>[\\s\\S]*?</section>`);
  const m = html.match(re);
  assert.ok(m, `section ${name} missing`);
  return m[0];
}

for (const { lang, file } of pages) {
  test(`${lang}: sections 0 to 5 appear in layout A order`, async () => {
    const html = await read(file);
    const at = part1.map((name) => {
      const i = html.indexOf(`data-section="${name}"`);
      assert.ok(i >= 0, `section ${name} missing`);
      return i;
    });
    assert.deepEqual(
      at,
      [...at].sort((a, b) => a - b)
    );
  });

  test(`${lang}: hero has exactly two buttons, both to the schedule`, async () => {
    const hero = section(await read(file), 'hero');
    const links = [...hero.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
    assert.equal(links.length, 2);
    for (const link of links) assert.ok(link.includes(`href="${pathFor('schedule', lang)}"`), link);
    assert.ok(links.some((l) => /btn-primary/.test(l)));
  });

  test(`${lang}: hero has no image element, only the placeholder`, async () => {
    const hero = section(await read(file), 'hero');
    assert.ok(!/<img\b/.test(hero));
    assert.ok(/data-photo="[^"]+"/.test(hero));
  });

  test(`${lang}: hero slogan is an open placeholder, not a guess`, async () => {
    const hero = section(await read(file), 'hero');
    assert.ok(/data-todo="[^"]*slogan[^"]*"/.test(hero));
  });

  test(`${lang}: next classes lists four items with a free-bike count`, async () => {
    const block = section(await read(file), 'next-classes');
    const items = [...block.matchAll(/<li\b[^>]*data-next-class[^>]*>/g)].map((m) => m[0]);
    assert.equal(items.length, 4);
    for (const item of items) assert.match(item, /data-free-bikes="\d+"/);
    assert.ok(block.includes(`href="${pathFor('schedule', lang)}"`));
  });

  test(`${lang}: class times use the 24-hour clock`, async () => {
    const block = section(await read(file), 'next-classes');
    assert.ok(!/\b(AM|PM)\b/i.test(block));
    assert.equal([...block.matchAll(/\b\d{2}:\d{2}\b/g)].length, 4);
  });

  test(`${lang}: about section carries the studio line`, async () => {
    const about = section(await read(file), 'about');
    const line =
      lang === 'en'
        ? 'The first and only rhythm spin studio in the heart of Zagreb.'
        : 'Prvi i jedini rhythm spin studio u srcu Zagreba.';
    assert.ok(about.includes(line));
  });

  test(`${lang}: rooms shows Riders Room and Sculpt Room cards`, async () => {
    const rooms = section(await read(file), 'rooms');
    assert.ok(rooms.includes('Riders Room'));
    assert.ok(rooms.includes('Sculpt Room'));
    assert.ok(rooms.includes(`href="${pathFor('sculpt', lang)}"`));
  });

  test(`${lang}: instructor teaser links to all instructors and uses first names only`, async () => {
    const block = section(await read(file), 'instructors');
    assert.ok(block.includes(`href="${pathFor('instructors', lang)}"`));
    assert.ok(/data-instructor="oliver"/.test(block));
  });

  test(`${lang}: no full instructor name anywhere in the page`, async () => {
    const html = await read(file);
    for (const name of ['Mando', 'Mauer', 'Zebec', 'Vušić', 'Vusic', 'Vončina', 'Voncina', 'Stepinac', 'Petrak']) {
      assert.ok(!html.includes(name), `${name} found`);
    }
  });

  test(`${lang}: page has one h1`, async () => {
    const html = await read(file);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  });
}
