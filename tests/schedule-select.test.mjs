// Real-browser checks of the schedule page script: week and day selection, and the feed refresh. The feed is
// intercepted so each case controls what the "booking app" answers.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test, { after, before } from 'node:test';
import { chromium } from 'playwright';
import { skipWhenThemeOnly } from './theme-only.mjs';

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

const FEED = '**/api/schedule.json';

/** Opens the page. `edit(body)` may change the feed the browser gets, `calls.n` counts feed requests. */
async function open(edit = (b) => b, { clock = false, width = 390 } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const calls = { n: 0 };
  let current = edit;
  await page.route(FEED, async (route) => {
    calls.n += 1;
    const res = await route.fetch();
    const body = await res.json();
    const out = current(body);
    if (out === 'fail') return route.fulfill({ status: 500, body: 'nope' });
    return route.fulfill({ json: out });
  });
  if (clock) await page.clock.install();
  await page.goto(`${origin}/raspored`);
  await page.waitForSelector('[data-schedule]');
  return { page, calls, setEdit: (fn) => (current = fn) };
}

const refresh = (page) => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
// What is on screen: below md one day, from md up the six days of the selected week.
const visibleDays = (page) => page.locator('[data-day-panel]:not([hidden]):not([data-off])');
const shownDays = (page) =>
  page
    .locator('[data-day-panel]')
    .evaluateAll((els) => els.filter((e) => e.offsetParent !== null).map((e) => e.dataset.dayPanel));
const selectedDay = (page) => page.locator('[data-day][aria-pressed="true"]').getAttribute('data-day');

test('week arrows switch the strip and label, keep the weekday, and disable at the ends', async () => {
  const { page } = await open();
  const day = await selectedDay(page);
  const label = await page.locator('[data-week-label]').innerText();
  assert.ok(await page.locator('[data-week-prev]').isDisabled());
  await page.locator('[data-week-next]').click();
  assert.notEqual(await page.locator('[data-week-label]').innerText(), label);
  assert.equal(await visibleDays(page).count(), 1);
  const next = await selectedDay(page);
  assert.equal((Date.parse(next) - Date.parse(day)) / 86_400_000, 7);
  assert.equal(await page.locator('[data-week-strip]:not([hidden])').count(), 1);
  await page.locator('[data-week-next]').click();
  assert.ok(await page.locator('[data-week-next]').isDisabled());
  await page.locator('[data-week-prev]').click();
  await page.locator('[data-week-prev]').click();
  assert.equal(await selectedDay(page), day);
  assert.ok(await page.locator('[data-week-prev]').isDisabled());
  await page.close();
});

test('a day button shows only that day', async () => {
  const { page } = await open();
  const buttons = page.locator('[data-week-strip]:not([hidden]) [data-day]');
  assert.equal(await buttons.count(), 7);
  const first = buttons.first();
  await first.click();
  assert.equal(await first.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-day][aria-pressed="true"]').count(), 1);
  assert.equal(await visibleDays(page).count(), 1);
  assert.equal(await visibleDays(page).getAttribute('data-day-panel'), await first.getAttribute('data-day'));
  await page.close();
});

test('a refresh updates the row that changed and does not rebuild an unchanged day', async () => {
  const { page, setEdit } = await open();
  const rows = visibleDays(page).locator('[data-class-id]');
  const ids = await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-class-id')));
  const otherDay = page.locator('[data-day-panel][hidden]').first();
  const otherMarked = await otherDay.elementHandle();
  await otherMarked.evaluate((el) => (el.__mine = true));
  let target;
  setEdit((body) => {
    const c = ids
      .map((id) => body.classes.find((x) => x.id === id))
      .filter((x) => x.freeBikes > 3)
      .at(-1);
    target = c.id;
    // Plenty of places shows no text on the card, so leave 2 to make the change visible.
    c.takenBikes = Array.from({ length: c.capacity - 2 }, (_, i) => i + 1);
    c.freeBikes = 2;
    return body;
  });
  const row = (id) => page.locator(`[data-class-id="${id}"]`);
  const texts = await rows.allInnerTexts();
  await refresh(page);
  await page.waitForFunction(
    (before) =>
      [...document.querySelectorAll('[data-day-panel]:not([hidden]):not([data-off]) [data-class-id]')]
        .map((e) => e.innerText)
        .join() !== before,
    texts.join()
  );
  assert.ok(target);
  assert.ok((await row(target).innerText()) !== texts[ids.indexOf(target)]);
  assert.equal(
    await otherMarked.evaluate((el) => el.__mine === true && el.isConnected),
    true,
    'unchanged day was rebuilt'
  );
  await page.close();
});

test('a refresh keeps each day header and rows list in place', async () => {
  const { page, setEdit } = await open();
  setEdit((body) => {
    body.classes[0].takenBikes = [...body.classes[0].takenBikes];
    return body;
  });
  await refresh(page);
  await page.waitForTimeout(200);
  assert.equal(await page.locator('[data-day-panel] > [data-day-head]').count(), 21);
  assert.equal(await page.locator('[data-day-panel] > [data-rows]').count(), 21);
  assert.equal(await page.locator('[data-day-panel] > li').count(), 0, 'rows were put straight into the panel');
  await page.close();
});

test('a feed that fails or is malformed leaves the page as it is', async () => {
  const { page, setEdit } = await open();
  const html = await visibleDays(page).innerHTML();
  for (const bad of ['fail', () => ({ nope: true })]) {
    setEdit(typeof bad === 'string' ? () => bad : bad);
    await refresh(page);
    await page.waitForTimeout(150);
    assert.equal(await visibleDays(page).innerHTML(), html);
  }
  await page.close();
});

test('classes missing from the feed (already started) are dropped, and an emptied day falls back to the next day', async () => {
  const { page, setEdit } = await open();
  const day = await selectedDay(page);
  setEdit((body) => {
    body.classes = body.classes.filter(
      (c) => !c.startsAt || new Date(c.startsAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Zagreb' }) !== day
    );
    return body;
  });
  await refresh(page);
  await page.waitForFunction((d) => document.querySelector('[data-day][aria-pressed="true"]')?.dataset.day !== d, day);
  assert.ok((await selectedDay(page)) > day);
  assert.equal(await page.locator(`[data-day-panel="${day}"] [data-empty]`).count(), 1, 'emptied day has no message');
  assert.ok((await visibleDays(page).locator('[data-class-id]').count()) > 0);
  await page.close();
});

test('refreshes every 30 seconds while the tab is visible', async () => {
  const { page, calls } = await open((b) => b, { clock: true });
  await page.waitForFunction(() => true);
  const first = calls.n;
  assert.ok(first >= 1);
  await page.clock.runFor(30_500);
  await page.waitForTimeout(100);
  assert.ok(calls.n > first, 'no refresh after 30 s');
  const second = calls.n;
  await page.clock.runFor(10_000);
  await page.waitForTimeout(100);
  assert.equal(calls.n, second, 'refreshed too early');
  await page.close();
});

test('desktop: the selected week shows as seven day columns and the day strip is hidden', async () => {
  const { page } = await open((b) => b, { width: 1280 });
  assert.equal((await shownDays(page)).length, 7);
  assert.equal(await page.locator('[data-week-strip]:not([hidden])').first().isVisible(), false);
  const columns = await page.locator('[data-day-head]:visible').count();
  assert.equal(columns, 7);
  await page.close();
});

test('desktop: week arrows swap the seven columns and keep the weekday', async () => {
  const { page } = await open((b) => b, { width: 1280 });
  const first = await shownDays(page);
  const label = await page.locator('[data-week-label]').innerText();
  await page.locator('[data-week-next]').click();
  const second = await shownDays(page);
  assert.equal(second.length, 7);
  assert.ok(second.every((d) => !first.includes(d)));
  assert.notEqual(await page.locator('[data-week-label]').innerText(), label);
  await page.locator('[data-week-prev]').click();
  assert.deepEqual(await shownDays(page), first);
  await page.close();
});

test('resizing across lg switches between one day and the whole week and keeps the selected day', async () => {
  const { page } = await open((b) => b, { width: 1280 });
  const day = await selectedDay(page);
  await page.setViewportSize({ width: 390, height: 900 });
  assert.deepEqual(await shownDays(page), [day]);
  await page.setViewportSize({ width: 1280, height: 900 });
  assert.equal((await shownDays(page)).length, 7);
  assert.equal(await selectedDay(page), day);
  await page.close();
});

test('desktop: a refresh updates a row in a column that is not the selected day, and leaves another week alone', async () => {
  const { page, setEdit } = await open((b) => b, { width: 1280 });
  const days = await shownDays(page);
  const selected = await selectedDay(page);
  // A column other than the selected day that still has a class to book. Classes that have started are hidden, so
  // which columns qualify depends on the day and the time the test runs.
  let other;
  for (const d of days) {
    if (d === selected) continue;
    if ((await page.locator(`[data-day-panel="${d}"] [data-class-id]:not([data-full])`).count()) > 0) {
      other = d;
      break;
    }
  }
  assert.ok(other, 'a column other than the selected day has a class that can be booked');
  const rows = page.locator(`[data-day-panel="${other}"] [data-class-id]`);
  const ids = await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-class-id')));
  assert.ok(ids.length > 0);
  const nextWeekPanel = await page.locator('[data-day-panel][hidden]').first().elementHandle();
  await nextWeekPanel.evaluate((el) => (el.__mine = true));
  const before = await rows.allInnerTexts();
  setEdit((body) => {
    const c = ids
      .map((id) => body.classes.find((x) => x.id === id))
      .filter((x) => x.freeBikes > 3)
      .at(-1);
    // Plenty of places shows no text on the card, so leave 2 to make the change visible.
    c.takenBikes = Array.from({ length: c.capacity - 2 }, (_, i) => i + 1);
    c.freeBikes = 2;
    return body;
  });
  await refresh(page);
  await page.waitForFunction(
    ({ d, was }) =>
      [...document.querySelectorAll(`[data-day-panel="${d}"] [data-class-id]`)].map((e) => e.innerText).join() !== was,
    { d: other, was: before.join() }
  );
  assert.equal(await nextWeekPanel.evaluate((el) => el.__mine === true && el.isConnected), true);
  await page.close();
});

test('desktop: an emptied selected day does not move the week while the week still has classes', async () => {
  const { page, setEdit } = await open((b) => b, { width: 1280 });
  const day = await selectedDay(page);
  const label = await page.locator('[data-week-label]').innerText();
  setEdit((body) => {
    body.classes = body.classes.filter(
      (c) => new Date(c.startsAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Zagreb' }) !== day
    );
    return body;
  });
  await refresh(page);
  await page.waitForTimeout(250);
  assert.equal(await page.locator(`[data-day-panel="${day}"] [data-empty]`).count(), 1);
  assert.equal(await page.locator('[data-week-label]').innerText(), label);
  assert.equal((await shownDays(page)).length, 7);
  await page.close();
});

test('desktop: when the whole visible week is gone, it moves to the next week with classes', async () => {
  const { page, setEdit } = await open((b) => b, { width: 1280 });
  const label = await page.locator('[data-week-label]').innerText();
  const week = await shownDays(page);
  setEdit((body) => {
    body.classes = body.classes.filter(
      (c) => !week.includes(new Date(c.startsAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Zagreb' }))
    );
    return body;
  });
  await refresh(page);
  await page.waitForFunction((l) => document.querySelector('[data-week-label]').innerText !== l, label);
  assert.ok((await shownDays(page)).every((d) => !week.includes(d)));
  await page.close();
});

const columnCount = (page) =>
  page
    .locator('[data-day-panel]')
    .evaluateAll(
      (els) =>
        new Set(els.filter((e) => e.offsetParent !== null).map((e) => Math.round(e.getBoundingClientRect().left))).size
    );

test('tablet: from 768 px the week shows as three columns by three rows, the strip is hidden', async () => {
  for (const width of [768, 1023]) {
    const { page } = await open((b) => b, { width });
    assert.equal((await shownDays(page)).length, 7, `${width}: seven days`);
    assert.equal(await columnCount(page), 3, `${width}: three columns`);
    assert.equal(await page.locator('[data-week-strip]:not([hidden])').first().isVisible(), false, `${width}: strip`);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `${width}: no sideways scroll`
    );
    await page.close();
  }
});

test('desktop: four columns from 1024 px, seven from 1280 px, and one day below 768 px', async () => {
  const mid = await open((b) => b, { width: 1024 });
  assert.equal(await columnCount(mid.page), 4);
  await mid.page.close();
  const wide = await open((b) => b, { width: 1280 });
  assert.equal(await columnCount(wide.page), 7);
  await wide.page.close();
  const phone = await open((b) => b, { width: 767 });
  assert.equal((await shownDays(phone.page)).length, 1);
  assert.equal(await phone.page.locator('[data-week-strip]:not([hidden])').first().isVisible(), true);
  await phone.page.close();
});

test('resizing across 768 px switches between one day and the week and keeps the selected day', async () => {
  const { page } = await open((b) => b, { width: 800 });
  const day = await selectedDay(page);
  await page.setViewportSize({ width: 700, height: 900 });
  assert.deepEqual(await shownDays(page), [day]);
  await page.setViewportSize({ width: 800, height: 900 });
  assert.equal((await shownDays(page)).length, 7);
  assert.equal(await selectedDay(page), day);
  await page.close();
});

// Stage B plumbing: the list publishes what the bike sheet needs as events on document.
const record = (page) =>
  page.evaluate(() => {
    window.__ev = [];
    for (const type of ['schedule:update', 'schedule:book'])
      document.addEventListener(type, (e) => window.__ev.push({ type, detail: e.detail }));
    // The router starts a navigation for any link click the list script leaves alone.
    document.addEventListener('astro:before-preparation', () => window.__ev.push({ type: 'navigation' }));
  });
const events = (page, type) => page.evaluate((t) => window.__ev.filter((e) => e.type === t), type);

test('a click on Book dispatches schedule:book with the class id and does not navigate', async () => {
  const { page } = await open();
  await record(page);
  const row = visibleDays(page).locator('[data-class-id]:not([data-full])').first();
  const id = await row.getAttribute('data-class-id');
  await row.locator('a.sched-action').click();
  const got = await events(page, 'schedule:book');
  assert.equal(got.length, 1);
  assert.deepEqual(got[0].detail, { classId: id, full: false });
  await page.waitForTimeout(150);
  assert.equal((await events(page, 'navigation')).length, 0, 'the link must not navigate');
  await page.close();
});

test('a click on the waiting list dispatches schedule:book with full true', async () => {
  const { page, setEdit } = await open();
  const rows = visibleDays(page).locator('[data-class-id]');
  const id = await rows.first().getAttribute('data-class-id');
  setEdit((body) => {
    const c = body.classes.find((x) => x.id === id);
    c.takenBikes = Array.from({ length: c.capacity }, (_, i) => i + 1);
    c.freeBikes = 0;
    return body;
  });
  await refresh(page);
  await page.waitForSelector(`[data-class-id="${id}"][data-full]`);
  await record(page);
  await page.locator(`[data-class-id="${id}"] a.sched-action`).click();
  const got = await events(page, 'schedule:book');
  assert.deepEqual(
    got.map((e) => e.detail),
    [{ classId: id, full: true }]
  );
  await page.close();
});

test('a feed refresh dispatches schedule:update with the feed classes', async () => {
  const { page } = await open();
  await record(page);
  await refresh(page);
  await page.waitForFunction(() => window.__ev.some((e) => e.type === 'schedule:update'));
  const [first] = await events(page, 'schedule:update');
  assert.ok(Array.isArray(first.detail) && first.detail.length > 0);
  assert.ok(first.detail.every((c) => typeof c.id === 'string' && Array.isArray(c.takenBikes)));
  await page.close();
});

// The white day-sheet design: today marker, dots, seats and the two row layouts.
const fullTakenFor = (id) => (body) => {
  const c = body.classes.find((x) => x.id === id);
  c.takenBikes = Array.from({ length: c.capacity }, (_, i) => i + 1);
  c.freeBikes = 0;
  return body;
};

test('the sheet of today carries data-today, and only that one', async () => {
  const { page } = await open();
  const got = await page.evaluate(() => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zagreb' }).format(new Date());
    return {
      marked: [...document.querySelectorAll('[data-day-panel][data-today]')].map((p) => p.dataset.dayPanel),
      exists: !!document.querySelector(`[data-day-panel="${today}"]`),
      today,
    };
  });
  assert.deepEqual(got.marked, got.exists ? [got.today] : [], 'only the panel for today is marked');
  await page.close();
});

test('a refresh that fills a class turns its dot pale and says it is full', async () => {
  const { page, setEdit } = await open();
  const row = visibleDays(page).locator('[data-class-id]:not([data-full])').first();
  const id = await row.getAttribute('data-class-id');
  const day = await row.evaluate((el) => el.closest('[data-day-panel]').dataset.dayPanel);
  const pale = () => page.locator(`[data-day="${day}"] [data-dots] i[data-full]`).count();
  const before = await pale();
  setEdit(fullTakenFor(id));
  await refresh(page);
  await page.waitForSelector(`[data-class-id="${id}"][data-full]`);
  assert.equal(await pale(), before + 1, 'one more pale dot on that day');
  const li = page.locator(`[data-class-id="${id}"]`);
  assert.match(await li.locator('[data-f="seats"]').innerText(), /^(Popunjeno|Full)$/);
  await page.close();
});

test('a refresh that leaves a few places marks the seats as scarce', async () => {
  const { page, setEdit } = await open();
  // A class that is not scarce yet. One with 3 places or fewer already carries the marker, so the wait below would
  // return before the refresh arrived.
  const row = visibleDays(page).locator('[data-class-id]:not([data-full]):not([data-scarce])').first();
  const id = await row.getAttribute('data-class-id');
  setEdit((body) => {
    const c = body.classes.find((x) => x.id === id);
    c.takenBikes = Array.from({ length: c.capacity - 2 }, (_, i) => i + 1);
    c.freeBikes = 2;
    return body;
  });
  await refresh(page);
  await page.waitForFunction((i) => document.querySelector(`[data-class-id="${i}"]`)?.hasAttribute('data-scarce'), id);
  const li = page.locator(`[data-class-id="${id}"]`);
  assert.match(await li.locator('[data-f="seats"]').innerText(), /2/);
  await page.close();
});

test('phone: a row is a rail, mark left, time, instructor and training in the middle, action on the right', async () => {
  const { page } = await open(undefined, { width: 390 });
  const li = visibleDays(page).locator('[data-class-id]:not([data-full])').first();
  const box = (sel) => li.locator(sel).boundingBox();
  const [mark, time, who, kind, action] = await Promise.all(
    ['[data-f="initial"]', '[data-f="time"]', '[data-f="instructor"]', '[data-f="name"]', 'a.sched-action'].map(box)
  );
  assert.ok(time.x > mark.x + mark.width - 1, 'the mark sits left of the time');
  assert.ok(action.x > who.x + 40, 'action is on the right');
  assert.ok(time.y < who.y && who.y < kind.y, 'time, instructor, training from top to bottom');
  assert.ok(Math.abs(kind.x - who.x) < 40, 'training name lines up under the instructor block');
  await page.close();
});

test('desktop: a row stacks inside its sheet, time on top, then the mark with instructor and training, then the action', async () => {
  const { page } = await open(undefined, { width: 1280 });
  // From md up the whole week is on screen, so any bookable class will do. The selected day alone can be empty:
  // classes that have started are hidden.
  const li = page.locator('[data-day-panel]:not([hidden]) [data-class-id]:not([data-full])').first();
  const box = (sel) => li.locator(sel).boundingBox();
  const [mark, time, who, kind, action] = await Promise.all(
    ['[data-f="initial"]', '[data-f="time"]', '[data-f="instructor"]', '[data-f="name"]', 'a.sched-action'].map(box)
  );
  assert.ok(who.x > mark.x + mark.width - 1, 'the names sit right of the mark');
  assert.ok(time.y < who.y && who.y < kind.y && kind.y < action.y, 'top to bottom');
  await page.close();
});

test(
  'each day is a sheet: a hairline outline on white, on a phone and on desktop, on a white page',
  { skip: skipWhenThemeOnly },
  async () => {
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: 'light' });
      await page.goto(`${origin}/raspored`);
      await page.waitForSelector('[data-schedule]');
      const got = await page.evaluate(() => {
        const panel = [...document.querySelectorAll('[data-day-panel]')].find((p) => p.offsetParent !== null);
        const cs = getComputedStyle(panel);
        return {
          border: cs.borderTopWidth,
          bg: cs.backgroundColor,
          radius: parseFloat(cs.borderTopLeftRadius),
          page: getComputedStyle(document.body).backgroundColor,
        };
      });
      assert.equal(got.border, '1px', `${width}px border`);
      assert.equal(got.bg, 'rgb(255, 255, 255)', `${width}px sheet`);
      assert.ok(got.radius >= 16, `${width}px radius`);
      assert.equal(got.page, 'rgb(255, 255, 255)', `${width}px page is white`);
      await page.close();
    }
  }
);
