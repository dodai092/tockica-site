import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { footerRoutes, headerRoutes } from '../src/lib/nav.ts';
import { sculpt } from '../src/data/sculpt.ts';
import { pathFor } from '../src/i18n/index.ts';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const pages = [
  { lang: 'hr', file: 'dist/sculpt-room/index.html', thanks: 'dist/hvala/index.html' },
  { lang: 'en', file: 'dist/en/sculpt-room/index.html', thanks: 'dist/en/thanks/index.html' },
];
// The built HTML is minified and orders attributes alphabetically (content before name).
const noindex = /<meta[^>]*(?:name="robots"[^>]*content="[^"]*noindex|content="[^"]*noindex[^"]*"[^>]*name="robots")/;

test('sculpt data: 6 month minimum, price and visits still open', () => {
  assert.equal(sculpt.minMonths, 6);
  assert.equal(sculpt.monthlyPriceEur, null);
  assert.equal(sculpt.visitsPerMonth, null);
  assert.equal(sculpt.visible, true);
});

test('nav helpers drop Sculpt Room when it is not visible', () => {
  assert.ok(headerRoutes(true).includes('sculpt'));
  assert.ok(footerRoutes(true).includes('sculpt'));
  assert.ok(!headerRoutes(false).includes('sculpt'));
  assert.ok(!footerRoutes(false).includes('sculpt'));
  assert.deepEqual(
    headerRoutes(false),
    headerRoutes(true).filter((k) => k !== 'sculpt')
  );
});

test('the page hides itself from search when visible is false', async () => {
  const source = await read('src/components/client/SculptPage.astro');
  assert.match(source, /noindex=\{!sculpt\.visible\}/);
});

for (const { lang, file, thanks } of pages) {
  test(`${lang}: price and visits are open placeholders, 6 months is shown, no 100 or 150`, async () => {
    const html = await read(file);
    assert.ok(/data-todo="[^"]*monthly price[^"]*"/.test(html));
    assert.ok(/data-todo="[^"]*visits[^"]*"/.test(html));
    assert.ok(/data-todo="[^"]*pitch[^"]*"/.test(html), 'one-sentence pitch is open (doc item 6)');
    assert.ok(/data-min-months="6"/.test(html));
    assert.ok(!/\b(100|150) ?(EUR|€)/.test(html));
  });

  test(`${lang}: inquiry form follows docs/forms.md`, async () => {
    const html = await read(file);
    const form = html.match(/<form\b[\s\S]*?<\/form>/)?.[0];
    assert.ok(form, 'no form');
    assert.match(form, /name="sculpt-inquiry"/);
    assert.match(form, /data-netlify="true"/);
    assert.match(form, /netlify-honeypot="bot-field"/);
    assert.match(form, /<input[^>]*name="form-name"[^>]*value="sculpt-inquiry"/);
    assert.match(form, /<input[^>]*name="bot-field"/);
    assert.match(form, new RegExp(`action="${pathFor('thanks', lang)}"`));
    const consent = form.match(/<input[^>]*type="checkbox"[^>]*>/)?.[0];
    assert.ok(consent && /\brequired\b/.test(consent), 'consent checkbox must be required');
    assert.ok(form.includes(`href="${pathFor('privacy', lang)}"`), 'consent links the privacy page');
    for (const field of ['name', 'email', 'message'])
      assert.match(form, new RegExp(`name="${field}"[^>]*required|required[^>]*name="${field}"`));
  });

  test(`${lang}: page is indexable and Sculpt Room is in the header and footer`, async () => {
    const html = await read(file);
    assert.ok(!noindex.test(html));
    const header = html.match(/<header[\s\S]*?<\/header>/)[0];
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)[0];
    assert.ok(header.includes(`href="${pathFor('sculpt', lang)}"`));
    assert.ok(footer.includes(`href="${pathFor('sculpt', lang)}"`));
  });

  test(`${lang}: thanks page is plain, noindex, and links home`, async () => {
    const html = await read(thanks);
    assert.match(html, noindex);
    assert.match(html, new RegExp(`<html[^>]*\\slang="${lang}"`));
    assert.ok(html.includes(`href="${pathFor('home', lang)}"`));
    assert.ok(!html.includes('<form'));
  });
}

test('sitemap lists Sculpt Room and leaves the thanks pages out', async () => {
  const xml = await read('dist/sitemap-0.xml');
  assert.ok(xml.includes('/sculpt-room'));
  assert.ok(!xml.includes('/hvala'));
  assert.ok(!xml.includes('/en/thanks'));
});
