// Real-browser check of the language switch across client-side navigation. The header
// must not persist between pages: a persisted header kept the first page's twin link and
// its old language (the switch could land on the schedule, the nav stayed Croatian).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test, { after, before } from 'node:test';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const PORT = 4326;
const origin = `http://127.0.0.1:${PORT}`;
let browser;
let server;

before(async () => {
  browser = await chromium.launch();
  server = spawn('npx', ['--no-install', 'astro', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: root,
    stdio: 'ignore',
    detached: true,
  });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(origin)).ok) return;
    } catch {
      // still starting
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('preview did not start');
});

after(async () => {
  await browser?.close();
  if (server?.pid) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      // already gone
    }
  }
});

const navTexts = (page) => page.locator('header nav a').allInnerTexts();

test('switch lands on the twin after client-side navigation, and the whole page changes language', async () => {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(origin + '/');
  await page.locator('header nav a[href="/instruktori"]').click();
  await page.waitForURL('**/instruktori');
  const sw = page.locator('[data-lang-switch]');
  assert.equal(await sw.getAttribute('href'), '/en/instructors', 'switch must point at the twin of the CURRENT page');

  await sw.click();
  await page.waitForURL('**/en/instructors');
  assert.ok((await navTexts(page)).includes('Schedule'), 'header nav must be English after the switch');
  assert.equal(await page.locator('[data-book]').getAttribute('href'), '/en/schedule');
  assert.equal(await page.locator('[data-lang-switch]').getAttribute('href'), '/instruktori');

  await page.locator('[data-lang-switch]').click();
  await page.waitForURL('**/instruktori');
  assert.ok((await navTexts(page)).includes('Raspored'));
});

test('the switch is a flag of the language it switches to, with no EN/HR text', async () => {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  for (const [path, flag, label] of [
    ['/', 'gb', 'English'],
    ['/en', 'hr', 'Hrvatski'],
  ]) {
    await page.goto(origin + path);
    const sw = page.locator('[data-lang-switch]');
    assert.equal((await sw.innerText()).trim(), '', `${path}: no text in the switch`);
    assert.equal(await sw.getAttribute('aria-label'), label);
    const img = sw.locator('img');
    assert.match(await img.getAttribute('src'), new RegExp(`flag-${flag}`), `${path}: flag-${flag}`);
    assert.equal(await img.getAttribute('alt'), '');
  }
});

test('the theme toggle in the header draws its icon and flips dark mode', async () => {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(origin + '/paketi');
  const btn = page.locator('header [data-aw-toggle-color-scheme]');
  const box = await btn.locator('svg').boundingBox();
  assert.ok(box && box.width > 10, 'icon svg must have size');
  const drawn = await btn.locator('svg').evaluate((svg) => svg.querySelectorAll('path, circle').length);
  assert.ok(drawn > 0, 'icon svg must contain its own shapes (no external sprite reference)');
  const before = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  await btn.click();
  assert.notEqual(await page.evaluate(() => document.documentElement.classList.contains('dark')), before);
});
