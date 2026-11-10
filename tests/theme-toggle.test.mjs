// The theme toggle icon is the same colour as the header's menu bars in every state: white over the hero
// photo, black on the light glass, white on the dark glass, and the close bars when the menu is open.
// Real browser, both colour schemes, phone and desktop widths.
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

// Toggle text colour and the menu bar colour (the three aria-hidden bars, not the sr-only label).
const pair = (page) =>
  page.evaluate(() => {
    const toggle = document.querySelector('[data-aw-toggle-color-scheme]');
    const bar = document.querySelector('[data-aw-toggle-menu] span[aria-hidden="true"]');
    return {
      toggle: getComputedStyle(toggle).color,
      bar: getComputedStyle(bar).backgroundColor,
      header: document.querySelector('#header').getAttribute('data-hdr'),
    };
  });

for (const scheme of ['light', 'dark']) {
  for (const width of [390, 1280]) {
    test(`${scheme} ${width}px: the theme toggle matches the menu bars over the hero, below it and on /raspored`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 800 }, colorScheme: scheme });
      const seen = {};
      await page.goto(`${origin}/`);
      await page.waitForTimeout(400);
      seen['home, over the hero'] = await pair(page);
      await page.evaluate(() => window.scrollTo(0, 1400));
      await page.waitForTimeout(700);
      seen['home, below the hero'] = await pair(page);
      await page.goto(`${origin}/raspored`);
      await page.waitForTimeout(400);
      seen['schedule'] = await pair(page);
      await page.close();
      assert.equal(seen['home, over the hero'].header, 'clear', JSON.stringify(seen));
      assert.equal(seen['home, below the hero'].header, 'glass', JSON.stringify(seen));
      for (const [where, p] of Object.entries(seen)) {
        assert.equal(p.toggle, p.bar, `${where}: ${JSON.stringify(p)}`);
      }
    });
  }

  test(`${scheme} 390px: the theme toggle matches the close bars with the menu open`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 800 }, colorScheme: scheme });
    await page.goto(`${origin}/`);
    await page.waitForTimeout(400);
    await page.click('[data-aw-toggle-menu]');
    await page.waitForTimeout(700);
    const p = await pair(page);
    await page.close();
    assert.equal(p.toggle, p.bar, JSON.stringify(p));
  });
}
