// The homepage next-class cards in a real browser: they share the schedule page's class design, are rebuilt from
// the booking app's feed, and keep their layout (a sideways row on phones, four across on desktop).
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
  let feed;
  await page.route('**/api/schedule.json', async (route) => {
    const res = await route.fetch();
    feed = await res.json();
    return route.fulfill({ json: feed });
  });
  await page.goto(`${origin}${path}`);
  await page.waitForSelector('[data-section="next-classes"][data-feed-live]');
  return { page, feed: () => feed };
}

const cards = (page) => page.locator('[data-section="next-classes"] ul > li[data-next-class]');

for (const path of ['/', '/en']) {
  test(`${path}: cards rebuilt from the feed keep time, instructor, training name, avatar, seats and meter`, async () => {
    const { page, feed } = await open(path, 1280);
    // What the page does with the feed: upcoming classes only, the first four.
    const classes = feed()
      .classes.filter((c) => Date.parse(c.startsAt) > Date.now())
      .slice(0, 4);
    assert.equal(await cards(page).count(), classes.length);
    for (const [i, c] of classes.entries()) {
      const li = cards(page).nth(i);
      const left = c.capacity - c.takenBikes.length;
      assert.equal(await li.locator('[data-f="instructor"]').innerText(), c.instructor);
      assert.equal(await li.locator('[data-f="initial"]').innerText(), c.instructor[0].toUpperCase());
      assert.equal(await li.locator('[data-f="name"]').innerText(), c.themeName ?? c.name);
      assert.match(await li.locator('[data-f="time"]').innerText(), /\d{2}:\d{2}/);
      assert.equal(
        await li.locator('[data-meter]').evaluate((el) => el.style.width),
        `${Math.round(((c.capacity - left) / c.capacity) * 100)}%`
      );
      assert.equal(
        await li.evaluate((el) => el.hasAttribute('data-scarce')),
        left > 0 && left <= 3,
        `scarce on card ${i}`
      );
      assert.equal(await li.evaluate((el) => el.hasAttribute('data-full')), left === 0, `full on card ${i}`);
      assert.ok(!/50' Riders Room/.test(await li.innerText()));
    }
    await page.close();
  });
}

test('phone: a card is a stacked box, time, instructor, training, meter, seats, action, in a sideways row', async () => {
  const { page } = await open('/', 390);
  const li = cards(page).first();
  const box = (sel) => li.locator(sel).boundingBox();
  const [time, who, kind, meter, seats, action] = await Promise.all(
    ['[data-f="time"]', '[data-f="instructor"]', '[data-f="name"]', '[data-meter]', '[data-f="seats"]', 'a'].map(box)
  );
  assert.ok(
    time.y < who.y && who.y < kind.y && kind.y < meter.y && meter.y < seats.y && seats.y < action.y,
    'top to bottom'
  );
  const card = await li.boundingBox();
  assert.ok(card.width > 150 && card.width < 190, `card width ${card.width}`);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    0,
    'page does not scroll sideways'
  );
  const row = page.locator('[data-section="next-classes"] ul');
  assert.ok(await row.evaluate((el) => el.scrollWidth > el.clientWidth), 'the cards scroll sideways inside their row');
  await page.close();
});

test('desktop: four cards in one row, same width', async () => {
  const { page } = await open('/', 1280);
  const boxes = await cards(page).evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect()).map((r) => ({ y: Math.round(r.y), w: Math.round(r.width) }))
  );
  assert.equal(boxes.length, 4);
  assert.equal(new Set(boxes.map((b) => b.y)).size, 1, 'one row');
  assert.ok(Math.max(...boxes.map((b) => b.w)) - Math.min(...boxes.map((b) => b.w)) <= 1, 'equal widths');
  await page.close();
});
