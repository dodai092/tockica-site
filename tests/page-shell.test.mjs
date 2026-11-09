import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getCopy, otherLang, pathFor } from '../src/i18n/index.ts';
import { bookBarEnabled } from '../src/lib/book-bar.ts';

const ORIGIN = 'https://tockicanai.hr';
const read = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const pages = [
  { lang: 'hr', file: 'index.html', self: '/' },
  { lang: 'en', file: 'en/index.html', self: '/en' },
];

function header(html) {
  const m = html.match(/<header[\s\S]*?<\/header>/);
  assert.ok(m, 'no <header> in page');
  return m[0];
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
}

for (const { lang, file, self } of pages) {
  test(`${lang}: html lang attribute matches the page language`, async () => {
    const html = await read(file);
    assert.match(html, new RegExp(`<html[^>]*\\slang="${lang}"`));
  });

  test(`${lang}: hreflang lists hr, en and x-default as absolute URLs`, async () => {
    const html = await read(file);
    const tags = [...html.matchAll(/<link[^>]*rel="alternate"[^>]*hreflang="[^"]*"[^>]*>/g)].map((m) => m[0]);
    const found = Object.fromEntries(tags.map((t) => [attr(t, 'hreflang'), attr(t, 'href')]));
    assert.deepEqual(found, {
      hr: ORIGIN + '/',
      en: ORIGIN + '/en',
      'x-default': ORIGIN + '/',
    });
    assert.equal(tags.length, 3);
    assert.equal(self === '/' ? found.hr : found.en, found[lang]);
  });

  test(`${lang}: language switch in the header goes to the twin page`, async () => {
    const html = header(await read(file));
    const links = [...html.matchAll(/<a[^>]*data-lang-switch[^>]*>/g)].map((m) => m[0]);
    assert.equal(links.length, 1);
    assert.equal(attr(links[0], 'href'), pathFor('home', otherLang(lang)));
    assert.equal(attr(links[0], 'hreflang'), otherLang(lang));
  });

  test(`${lang}: header has one primary book link to the schedule`, async () => {
    const html = header(await read(file));
    const links = [...html.matchAll(/<a[^>]*data-book[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);
    assert.equal(links.length, 1);
    assert.equal(attr(links[0], 'href'), pathFor('schedule', lang));
    assert.match(attr(links[0], 'class'), /btn-primary/);
    assert.ok(links[0].includes(getCopy(lang).cta.book));
  });

  test(`${lang}: Prijava link is flagged data-todo without a visible badge`, async () => {
    const html = header(await read(file));
    const link = html.match(/<a[^>]*data-login[^>]*>[\s\S]*?<\/a>/)?.[0];
    assert.ok(link, 'no login link');
    assert.ok(/\sdata-todo="[^"]+"/.test(link.match(/<a[^>]*>/)[0]), 'login anchor has no data-todo');
    assert.ok(!/<span[^>]*data-todo/.test(link), 'visible placeholder badge inside the nav link');
  });

  test(`${lang}: fixed mobile book bar follows the bookBarEnabled switch`, async () => {
    const html = await read(file);
    if (!bookBarEnabled) {
      assert.ok(!html.includes('data-book-bar'), 'book bar rendered while disabled');
      return;
    }
    const m = html.match(/<div[^>]*class="([^"]*)"[^>]*>\s*<a[^>]*data-book-bar[^>]*>/);
    assert.ok(m, 'no mobile book bar');
    assert.match(m[1], /\bfixed\b/);
    assert.match(m[1], /\bmd:hidden\b/);
    const link = html.match(/<a[^>]*data-book-bar[^>]*>/)[0];
    assert.equal(attr(link, 'href'), pathFor('schedule', lang));
  });

  test(`${lang}: footer links the legal pages and shows the company line`, async () => {
    const html = await read(file);
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0];
    assert.ok(footer, 'no <footer>');
    for (const key of ['rules', 'terms', 'privacy']) {
      assert.ok(footer.includes(`href="${pathFor(key, lang)}"`), `${key} link missing`);
    }
    assert.ok(footer.includes('OIB HR37892279693'));
    assert.ok(!footer.includes('Antuna Bauera'), 'unconfirmed seat must not ship');
    assert.ok(!footer.includes('Rusanova'), 'unconfirmed address must not ship');
  });

  test(`${lang}: no Dodai co-brand bar`, async () => {
    const html = await read(file);
    assert.ok(!/co-?brand/i.test(html));
  });
}

test('instructors pages are twins of each other', async () => {
  const hr = await read('instruktori/index.html');
  const en = await read('en/instructors/index.html');
  assert.match(hr, /<html[^>]*\slang="hr"/);
  assert.match(en, /<html[^>]*\slang="en"/);
  assert.ok(header(hr).includes('href="/en/instructors"'));
  assert.ok(header(en).includes('href="/instruktori"'));
});

for (const { lang, file } of [
  { lang: 'hr', file: 'raspored/index.html' },
  { lang: 'en', file: 'en/schedule/index.html' },
]) {
  test(`${lang}: schedule page shows the class list, a booking-soon notice and an open booking placeholder`, async () => {
    const html = await read(file);
    assert.match(html, new RegExp(`<html[^>]*\\slang="${lang}"`));
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
    assert.ok(html.includes('data-schedule'), 'class list missing');
    assert.ok(/data-schedule-notice/.test(html), 'booking-soon notice missing');
    assert.ok(/data-todo="[^"]*book[^"]*"/.test(html), 'where-to-book placeholder missing');
  });

  test(`${lang}: schedule page hides the mobile book bar`, async () => {
    assert.ok(!(await read(file)).includes('data-book-bar'));
  });

  test(`${lang}: schedule page language switch lands on the twin`, async () => {
    const html = header(await read(file));
    const link = html.match(/<a[^>]*data-lang-switch[^>]*>/)[0];
    assert.equal(attr(link, 'href'), pathFor('schedule', otherLang(lang)));
  });
}
