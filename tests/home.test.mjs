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
const part2 = ['how-it-works', 'sculpt-band', 'faq', 'contact'];

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

  test(`${lang}: hero photo is a flagged placeholder image until Dunia sends a real one`, async () => {
    const hero = section(await read(file), 'hero');
    assert.ok(/<picture\b[\s\S]*<img\b/.test(hero));
    assert.ok(/data-todo="[^"]*hero photo[^"]*"/.test(hero));
  });

  test(`${lang}: hero slogan is an open placeholder, not a guess`, async () => {
    const hero = section(await read(file), 'hero');
    assert.ok(/data-todo="[^"]*slogan[^"]*"/.test(hero));
  });

  test(`${lang}: next classes lists four items with a free-bike count`, async () => {
    const block = section(await read(file), 'next-classes').replace(/<template[\s\S]*?<\/template>/g, '');
    const items = [...block.matchAll(/<li\b[^>]*data-next-class[^>]*>/g)].map((m) => m[0]);
    assert.equal(items.length, 4);
    for (const item of items) assert.match(item, /data-free-bikes="\d+"/);
    assert.ok(block.includes(`href="${pathFor('schedule', lang)}"`));
  });

  test(`${lang}: a next-class card reads time, instructor, training name, with avatar and seats`, async () => {
    const block = section(await read(file), 'next-classes').replace(/<template[\s\S]*?<\/template>/g, '');
    const li = block.match(/<li\b[^>]*data-next-class[^>]*>[\s\S]*?<\/li>/)?.[0] ?? '';
    const at = (f) => li.indexOf(`data-f="${f}"`);
    assert.ok(at('time') > -1 && at('time') < at('instructor') && at('instructor') < at('name'), 'order of the lines');
    assert.ok(at('initial') > -1 && at('seats') > -1 && 'avatar and seats');
    assert.ok(!/Slobodno bicikala|Free bikes/.test(block), 'the old free-bikes line is gone');
    assert.ok(!block.includes("50' Riders Room"), 'no room name on the cards');
  });

  test(`${lang}: the full mock class says so and offers the waiting list`, async () => {
    const block = section(await read(file), 'next-classes').replace(/<template[\s\S]*?<\/template>/g, '');
    const li = block.match(/<li\b(?=[^>]*data-free-bikes="0")[^>]*>[\s\S]*?<\/li>/)?.[0] ?? '';
    assert.ok(li, 'the mock has a full class');
    assert.ok(li.includes(lang === 'en' ? 'Full' : 'Popunjeno'));
    assert.ok(li.includes(lang === 'en' ? 'Waiting list' : 'Lista čekanja'));
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

  test(`${lang}: lower sections follow the instructors in order`, async () => {
    const html = await read(file);
    const at = ['instructors', ...part2].map((name) => {
      const i = html.indexOf(`data-section="${name}"`);
      assert.ok(i >= 0, `section ${name} missing`);
      return i;
    });
    assert.deepEqual(
      at,
      [...at].sort((a, b) => a - b)
    );
  });

  test(`${lang}: how it works has three steps and names the intro packs`, async () => {
    const block = section(await read(file), 'how-it-works');
    assert.equal([...block.matchAll(/<li\b[^>]*data-step/g)].length, 3);
    assert.ok(block.includes('10 EUR'));
    assert.ok(block.includes('30 EUR'));
  });

  test(`${lang}: Sculpt band has one link to the Sculpt route and an open price`, async () => {
    const block = section(await read(file), 'sculpt-band');
    const links = [...block.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
    assert.equal(links.length, 1);
    assert.ok(links[0].includes(`href="${pathFor('sculpt', lang)}"`));
    assert.ok(/data-todo="[^"]*Sculpt[^"]*"/.test(block), 'price must be an open placeholder (100 or 150 not final)');
    assert.ok(!/\b(100|150) ?(EUR|€)/.test(block));
  });

  test(`${lang}: FAQ is a four-item details accordion`, async () => {
    const block = section(await read(file), 'faq');
    assert.equal([...block.matchAll(/<details\b/g)].length, 4);
    assert.equal([...block.matchAll(/<summary\b/g)].length, 4);
  });

  test(`${lang}: contact block has Dunia's address, e-mail and hours, phone stays a placeholder`, async () => {
    const html = await read(file);
    const block = section(html, 'contact');
    assert.ok(/data-todo="[^"]*phone[^"]*"/.test(block), 'phone placeholder missing');
    for (const fact of ['Ulica Ferde Rusana 8', 'info@tockicanai.hr', '17:00-20:00']) {
      assert.ok(block.includes(fact), `${fact} missing`);
    }
    for (const fact of ['Rusanova', '095 865', 'Bauera']) {
      assert.ok(!html.includes(fact), `${fact} must not ship until Dunia confirms`);
    }
    assert.ok(block.includes(`href="${pathFor('contact', lang)}"`));
  });
}

test('en: FAQ ships the client English verbatim, apostrophes and typos included', async () => {
  const block = section(await read('en/index.html'), 'faq');
  const text = block.replace(/<[^>]+>/g, '\n').replace(/&#x27;|&#39;/g, "'");
  for (const line of [
    'Which classes are beginner friendly?',
    'All of them. Our instructors will help you find the beat and ride at your own pace. We welcome all fitness levels, and you’re always free to sit, stand, slow down or take a break whenever you need to, regardless of the class or instructor. These are your 50 minutes.',
    'If you’d prefer to start with a slightly slower tempo, we recommend trying Mario, Emma or Ivana’s ABS spin classes. ABS Spin class focuses a more on strength and controlled movement, rather than quick sprints and pace.',
    'What do i need to bring?',
    'Clean shoes, water and towel. You can always buy water at the studio.',
    'How early should I arrive?',
    'If you are new, come 15 minutes before to allow your instructor to help you set up.',
    'What if I need to cancel?',
    'Cancellation window is 6 hours prior to the lesson.',
  ]) {
    assert.ok(text.includes(line), `missing verbatim: ${line.slice(0, 40)}`);
  }
  assert.ok(!/data-todo=/.test(block), 'no open placeholders left in the English FAQ');
});

test('hr: FAQ is written in Croatian, no English text and no open placeholders', async () => {
  const block = section(await read('index.html'), 'faq');
  assert.ok(!block.includes('beginner friendly'));
  assert.ok(!block.includes('Clean shoes'));
  assert.ok(!/data-todo=/.test(block), 'no open placeholders left in the Croatian FAQ');
  for (const line of [
    'Koji su treninzi prikladni za početnike?',
    'Što trebam ponijeti?',
    'Koliko ranije trebam doći?',
    'Što ako moram otkazati?',
    'najkasnije 6 sati prije treninga',
  ]) {
    assert.ok(block.includes(line), `missing: ${line}`);
  }
});
