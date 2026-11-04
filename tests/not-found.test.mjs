import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const noindex =
  /<meta[^>]*(?:name="?robots"?[^>]*content="?[^">]*noindex|content="?[^">]*noindex[^">]*"?[^>]*name="?robots"?)/;

test('404 page is Croatian first, with an English line, the site header and footer, and noindex', async () => {
  const html = await read('dist/404.html');
  assert.match(html, /<html[^>]*lang="?hr/);
  assert.match(html, noindex);
  assert.match(html, /Stranica nije pronađena/);
  assert.match(html, /Page not found/);
  assert.ok(html.includes('data-lang-switch'), 'client header present');
  assert.ok(html.includes('Pravilnik studija'), 'client footer present');
  assert.ok(!/Sorry, we couldn/.test(html), 'template English copy gone');
});

test('404 shows the number in readable text colour, not red on slate', async () => {
  const html = await read('dist/404.html');
  const heading = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/)?.[0] ?? '';
  assert.ok(heading.includes('404'));
  assert.ok(!/text-primary/.test(heading), 'red text on slate fails contrast in dark mode');
});

test('go-live runbook tells the launcher to run the placeholder check', async () => {
  const doc = await read('docs/go-live.md');
  assert.match(doc, /LAUNCH=1 npm run check:todos/);
});
