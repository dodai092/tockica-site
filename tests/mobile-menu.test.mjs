// The phone menu is a compact card that hugs its labels, with no "Book a class" button inside it (booking is
// on the schedule page and the bottom bar). Desktop keeps its booking button in the bar. Real browser.
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

test('390px: the open menu is narrow and has no booking button', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  await page.goto(`${origin}/`);
  await page.waitForTimeout(400);
  await page.click('[data-aw-toggle-menu]');
  await page.waitForTimeout(700);
  const state = await page.evaluate(() => {
    const panel = document.querySelector('[data-menu-panel]').getBoundingClientRect();
    const labels = [...document.querySelectorAll('[data-menu-panel] nav a')]
      .filter((a) => getComputedStyle(a).display !== 'none' && a.getBoundingClientRect().height > 0)
      .map((a) => a.textContent.trim());
    return {
      width: panel.width,
      labels,
      bookVisible:
        !!document.querySelector('[data-menu-panel] [data-book]') &&
        document.querySelector('[data-menu-panel] [data-book]').getBoundingClientRect().height > 0,
    };
  });
  await page.close();
  assert.equal(state.bookVisible, false, 'booking button is still visible in the open menu');
  assert.ok(state.width <= 260, `menu is ${state.width}px wide, expected 260px or less`);
  assert.equal(state.labels.length, 6, JSON.stringify(state.labels));
});

test('1280px: the booking button in the bar is still there', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${origin}/`);
  await page.waitForTimeout(400);
  const visible = await page.locator('#header [data-book]').first().isVisible();
  await page.close();
  assert.equal(visible, true);
});
