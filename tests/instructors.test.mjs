import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { pathFor } from '../src/i18n/index.ts';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const pages = [
  { lang: 'hr', file: 'dist/instruktori/index.html' },
  { lang: 'en', file: 'dist/en/instructors/index.html' },
];
const order = ['dunia', 'oliver', 'ivana', 'mirna', 'ena', 'domagoj', 'emma', 'mario'];
const firstNames = {
  dunia: 'Dunia',
  oliver: 'Oliver',
  ivana: 'Ivana',
  mirna: 'Mirna',
  ena: 'Ena',
  domagoj: 'Domagoj',
  emma: 'Emma',
  mario: 'Mario',
};

// Lines come straight from the client copy source table, not from the page's own data file.
async function sourceLines() {
  const md = await read('docs/copy/source.md');
  const rows = md.split('\n').filter((l) => /^\| (Dunia|Oliver|Ivana|Mirna|Ena|Domagoj|Emma|Mario) /.test(l));
  assert.equal(rows.length, 8, 'source table must list eight instructors');
  return Object.fromEntries(
    rows.map((row) => {
      const [full, en, hr] = row
        .split('|')
        .slice(1, 4)
        .map((c) => c.trim());
      return [full.split(' ')[0].toLowerCase(), { en, hr }];
    })
  );
}

function cards(html) {
  const found = [...html.matchAll(/<li\b[^>]*data-instructor="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)];
  return Object.fromEntries(found.map((m) => [m[1], m[2]]));
}

for (const { lang, file } of pages) {
  test(`${lang}: eight instructor cards in roster order, first names only`, async () => {
    const html = await read(file);
    const found = [...html.matchAll(/data-instructor="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(found, order);
    const byCard = cards(html);
    for (const slug of order)
      assert.match(byCard[slug], new RegExp(`<h2[^>]*>\\s*(?:<a[^>]*>\\s*)?${firstNames[slug]}\\s*(?:</a>\\s*)?</h2>`));
  });

  test(`${lang}: lines for Oliver, Mirna, Ena and Emma match the client copy exactly`, async () => {
    const src = await sourceLines();
    const byCard = cards(await read(file));
    for (const slug of ['oliver', 'mirna', 'ena', 'emma']) {
      assert.ok(byCard[slug].includes(src[slug][lang]), `${slug} ${lang} line differs from source.md`);
      assert.ok(!/data-todo=/.test(byCard[slug]), `${slug} must not be a placeholder`);
    }
  });

  test(`${lang}: Dunia, Mario and Domagoj are open placeholders`, async () => {
    const byCard = cards(await read(file));
    for (const slug of ['dunia', 'mario', 'domagoj'])
      assert.ok(/data-todo="[^"]+"/.test(byCard[slug]), `${slug} should be data-todo`);
  });

  test(`${lang}: Domagoj ships neither alternative until Dunia picks one`, async () => {
    const html = await read(file);
    for (const text of [
      'Accidentally started a concert',
      'forgets to cue',
      'Slučajno održao koncert',
      'zaboravi najaviti',
    ]) {
      assert.ok(!html.includes(text), text);
    }
  });

  test(`${lang}: no full instructor name in the page`, async () => {
    const html = await read(file);
    for (const name of ['Mando', 'Mauer', 'Zebec', 'Vušić', 'Vusic', 'Vončina', 'Voncina', 'Stepinac', 'Petrak']) {
      assert.ok(!html.includes(name), `${name} found`);
    }
  });

  test(`${lang}: a portrait is the photo with the first name as alt, a missing one is a placeholder`, async () => {
    const byCard = cards(await read(file));
    for (const slug of order) {
      assert.ok(/data-photo="/.test(byCard[slug]));
      if (slug === 'mario') {
        assert.ok(!/<img\b/.test(byCard[slug]), 'Mario has no photo yet, so he shows the placeholder');
      } else {
        assert.ok(new RegExp(`<img\\b[^>]*alt="${firstNames[slug]}"`).test(byCard[slug]), `${slug} photo`);
      }
    }
  });
}

test('hr: Ivana has no Croatian line yet, en shows hers', async () => {
  const src = await sourceLines();
  assert.ok(/data-todo=/.test(cards(await read(pages[0].file)).ivana));
  assert.ok(cards(await read(pages[1].file)).ivana.includes(src.ivana.en));
});

test('instructors route points at the built pages', () => {
  assert.equal(pathFor('instructors', 'hr'), '/instruktori');
  assert.equal(pathFor('instructors', 'en'), '/en/instructors');
});
