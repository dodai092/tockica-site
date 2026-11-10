// Book on a homepage card opens the same bike map as on the schedule page (BikeSheet.astro), for that card's class.
// A full class goes straight to the waiting-list step. A modified click still follows the link.
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

async function open(path, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${origin}${path}`);
  await page.waitForSelector('[data-section="next-classes"][data-feed-live]');
  return { page, errors };
}

const sheet = (page) => page.locator('dialog[data-bike-sheet]');
const card = (page, full) =>
  page
    .locator(`[data-section="next-classes"] li[data-next-class]${full ? '[data-full]' : ':not([data-full])'}`)
    .first();
const closed = (page) => page.waitForFunction(() => !document.querySelector('dialog[data-bike-sheet]')?.open);

for (const [path, width] of [
  ['/', 390],
  ['/en', 1280],
]) {
  test(`${path} at ${width}px: Book on a card opens the bike map for that class`, async () => {
    const { page, errors } = await open(path, width);
    const li = card(page, false);
    const id = await li.getAttribute('data-next-class');
    const instructor = (await li.locator('[data-f="instructor"]').textContent()).trim();
    await li.locator('a').click();
    await sheet(page).waitFor({ state: 'visible' });
    assert.equal(page.url(), `${origin}${path}`, 'the page did not navigate');
    assert.equal(await sheet(page).locator('button[data-bike]').count(), 20);
    assert.match(await sheet(page).locator('[data-sheet-meta]').textContent(), new RegExp(instructor));
    const go = sheet(page).locator('[data-continue]');
    assert.equal(await go.isDisabled(), true, 'no bike picked yet');
    await sheet(page).locator('button[data-bike]:not([disabled])').first().click();
    assert.equal(await go.isDisabled(), false);
    await page.keyboard.press('Escape');
    await closed(page);
    const focusedInCard = await page.evaluate(
      (cardId) => !!document.activeElement?.closest(`li[data-next-class="${cardId}"]`),
      id
    );
    assert.ok(focusedInCard, 'focus returns to the card Book link');
    assert.deepEqual(errors, []);
    await page.close();
  });

  test(`${path} at ${width}px: a full class opens on the waiting-list login step`, async () => {
    const { page } = await open(path, width);
    const li = card(page, true);
    if (!(await li.count())) return; // the feed has no full class right now
    await li.locator('a').click();
    await sheet(page).waitFor({ state: 'visible' });
    assert.equal(await sheet(page).locator('[data-step="login"]').isVisible(), true);
    assert.equal(await sheet(page).locator('[data-step="map"]').isHidden(), true);
    await page.close();
  });
}

test('a ctrl-click on a card does not open the dialog', async () => {
  const { page } = await open('/en', 1280);
  await card(page, false)
    .locator('a')
    .click({ modifiers: ['Control'], noWaitAfter: true });
  await page.waitForTimeout(300);
  assert.equal(await sheet(page).evaluate((d) => d.open), false);
  await page.close();
});
