// The bike map dialog on the schedule page (Stage B, task 3): opens from Book, shows the 20 bikes of the class,
// takes a pick, and follows the feed. The feed is intercepted so each case controls what the "booking app" answers.
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

/** Opens the schedule. `setEdit(fn)` changes what the feed answers from then on. `errors` collects page errors. */
async function open({ width = 390, height = 900, path = '/raspored', reduced = false, init } = {}) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  if (init) await page.addInitScript(init);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let current = (b) => b;
  await page.route('**/api/schedule.json', async (route) => {
    const res = await route.fetch();
    return route.fulfill({ json: current(await res.json()) });
  });
  await page.goto(`${origin}${path}`);
  await page.waitForSelector('[data-schedule]');
  return { page, errors, setEdit: (fn) => (current = fn) };
}

const refresh = (page) => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
const sheet = (page) => page.locator('dialog[data-bike-sheet]');
const bike = (page, n) => sheet(page).locator(`button[data-bike="${n}"]`);
const openRow = (page) =>
  page.locator('[data-day-panel]:not([hidden]):not([data-off]) [data-class-id]:not([data-full])').first();
const data = (page) => page.evaluate(() => JSON.parse(document.querySelector('[data-schedule-data]').textContent));
const closed = (page) => page.waitForFunction(() => !document.querySelector('dialog[data-bike-sheet]')?.open);

for (const width of [390, 1280]) {
  test(`${width}px: Book opens the dialog for that class with 20 bikes, the taken ones disabled`, async () => {
    const { page, errors } = await open({ width });
    const row = openRow(page);
    const id = await row.getAttribute('data-class-id');
    const klass = (await data(page)).find((c) => c.id === id);
    await row.locator('a').click();
    await sheet(page).waitFor({ state: 'visible' });
    assert.equal(await sheet(page).locator('button[data-bike]').count(), 20);
    for (let n = 1; n <= 20; n++) {
      assert.equal(await bike(page, n).isDisabled(), klass.takenBikes.includes(n), `bike ${n} disabled state`);
    }
    const head = await sheet(page).locator('[data-sheet-head]').innerText();
    assert.ok(head.includes(klass.instructor), 'head names the instructor');
    assert.ok(/\d{2}:\d{2}.\d{2}:\d{2}/.test(head), 'head shows the time range');
    assert.deepEqual(errors, []);
    await page.close();
  });

  test(`${width}px: two columns, bikes 1 to 10 on the right, aisle after the fifth row, no sideways scroll`, async () => {
    const { page } = await open({ width });
    await openRow(page).locator('a').click();
    await sheet(page).waitFor({ state: 'visible' });
    await page.waitForTimeout(450);
    const box = async (n) => bike(page, n).boundingBox();
    const xs = new Set();
    for (let n = 1; n <= 20; n++) xs.add(Math.round((await box(n)).x));
    assert.equal(xs.size, 2, 'two columns');
    assert.ok((await box(1)).x > (await box(11)).x, 'bikes 1 to 10 are in the right column');
    assert.ok(Math.abs((await box(1)).x - (await box(10)).x) < 1, 'bikes 1 and 10 share a column');
    // From the bottom: bike 1 is row 11, bike 5 row 7, bike 6 row 5, bike 10 row 1.
    const gap = (a, b) => a.y - (b.y + b.height);
    const aisle = gap(await box(5), await box(6));
    const normal = gap(await box(4), await box(5));
    assert.ok(aisle > normal + 6, `aisle ${aisle} is wider than the row gap ${normal}`);
    assert.ok((await box(10)).y < (await box(6)).y && (await box(5)).y < (await box(1)).y, 'rows run top to bottom');
    const overflow = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth - innerWidth,
      sheet: (() => {
        const d = document.querySelector('dialog[data-bike-sheet]');
        return d.scrollWidth - d.clientWidth;
      })(),
    }));
    assert.deepEqual(overflow, { page: 0, sheet: 0 });
    await page.close();
  });

  test(`${width}px: picking a bike presses it, enables Continue with the number, and moves with the next pick`, async () => {
    const { page } = await open({ width });
    const row = openRow(page);
    const id = await row.getAttribute('data-class-id');
    const klass = (await data(page)).find((c) => c.id === id);
    const [a, b] = Array.from({ length: 20 }, (_, i) => i + 1).filter((n) => !klass.takenBikes.includes(n));
    await row.locator('a').click();
    await sheet(page).waitFor({ state: 'visible' });
    const go = sheet(page).locator('[data-continue]');
    assert.ok(await go.isDisabled(), 'Continue waits for a pick');
    await bike(page, a).click();
    assert.equal(await sheet(page).locator('button[aria-pressed="true"]').count(), 1);
    assert.equal(await bike(page, a).getAttribute('aria-pressed'), 'true');
    assert.ok(await go.isEnabled());
    assert.ok((await go.innerText()).includes(String(a)), 'Continue names the bike');
    await bike(page, b).click();
    assert.equal(await sheet(page).locator('button[aria-pressed="true"]').count(), 1);
    assert.equal(await bike(page, b).getAttribute('aria-pressed'), 'true');
    assert.ok((await go.innerText()).includes(String(b)));
    await page.close();
  });

  test(`${width}px: Esc and the close button close it and focus goes back to the Book button`, async () => {
    const { page } = await open({ width });
    const link = openRow(page).locator('a');
    await link.click();
    await sheet(page).waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await closed(page);
    assert.ok(await link.evaluate((el) => el === document.activeElement), 'focus back on Book after Esc');
    await link.click();
    await sheet(page).waitFor({ state: 'visible' });
    await sheet(page).locator('[data-sheet-close]').click();
    await closed(page);
    assert.ok(await link.evaluate((el) => el === document.activeElement), 'focus back on Book after Close');
    await page.close();
  });
}

test('a refresh that takes the picked bike unpicks it, says so, and keeps focus on the map', async () => {
  const { page, setEdit } = await open();
  const row = openRow(page);
  const id = await row.getAttribute('data-class-id');
  const klass = (await data(page)).find((c) => c.id === id);
  const free = Array.from({ length: klass.capacity }, (_, i) => i + 1).filter((n) => !klass.takenBikes.includes(n));
  const mine = free[0];
  await row.locator('a').click();
  await sheet(page).waitFor({ state: 'visible' });
  await bike(page, mine).click();
  setEdit((body) => {
    const c = body.classes.find((x) => x.id === id);
    c.takenBikes = [...c.takenBikes, mine].sort((a, b) => a - b);
    c.freeBikes -= 1;
    return body;
  });
  await refresh(page);
  await page.waitForFunction((n) => document.querySelector(`button[data-bike="${n}"]`).disabled, mine);
  assert.equal(await sheet(page).locator('button[aria-pressed="true"]').count(), 0, 'the pick is dropped');
  assert.ok(await sheet(page).locator('[data-continue]').isDisabled());
  const message = await sheet(page).locator('[data-sheet-message]').innerText();
  assert.ok(message.includes(String(mine)), 'the message names the bike');
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    return { inside: !!el?.closest('dialog[data-bike-sheet]'), disabled: el?.disabled === true };
  });
  assert.deepEqual(focus, { inside: true, disabled: false }, 'focus stays on the map, on a bike that can be picked');
  // The grid is updated in place, not rebuilt.
  assert.ok(await bike(page, free[1]).isEnabled());
  await page.close();
});

test('a class with another capacity than 20 disables the bikes above it and keeps the layout', async () => {
  const { page, setEdit } = await open();
  const id = await openRow(page).getAttribute('data-class-id');
  setEdit((body) => {
    const c = body.classes.find((x) => x.id === id);
    c.capacity = 16;
    c.takenBikes = c.takenBikes.filter((n) => n <= 16);
    c.freeBikes = 16 - c.takenBikes.length;
    return body;
  });
  await refresh(page);
  await page.waitForFunction((i) => document.querySelector(`[data-class-id="${i}"]`)?.textContent !== undefined, id);
  await page.waitForTimeout(100);
  await openRow(page).locator('a').click();
  await sheet(page).waitFor({ state: 'visible' });
  assert.equal(await sheet(page).locator('button[data-bike]').count(), 20);
  for (let n = 17; n <= 20; n++) assert.ok(await bike(page, n).isDisabled(), `bike ${n} is above capacity`);
  await page.close();
});

test('pressing Book twice quickly, Esc while it opens, then reopening never leaves it stuck', async () => {
  const { page, errors } = await open();
  const link = openRow(page).locator('a');
  await link.dblclick();
  await sheet(page).waitFor({ state: 'visible' });
  assert.equal(await sheet(page).locator('button[data-bike]').count(), 20);
  await page.keyboard.press('Escape');
  await closed(page);
  await link.click();
  await page.keyboard.press('Escape');
  await closed(page);
  await link.click();
  await sheet(page).waitFor({ state: 'visible' });
  await page.waitForTimeout(450);
  const shown = await sheet(page).evaluate((d) => ({
    open: d.open,
    transform: getComputedStyle(d).transform,
    opacity: getComputedStyle(d).opacity,
  }));
  assert.deepEqual(shown, { open: true, transform: 'none', opacity: '1' });
  assert.deepEqual(errors, []);
  await page.close();
});

test('reopening starts with no bike picked', async () => {
  const { page } = await open();
  const link = openRow(page).locator('a');
  await link.click();
  await sheet(page).waitFor({ state: 'visible' });
  await sheet(page).locator('button[data-bike]:not([disabled])').first().click();
  await page.keyboard.press('Escape');
  await closed(page);
  await link.click();
  await sheet(page).waitFor({ state: 'visible' });
  assert.equal(await sheet(page).locator('button[aria-pressed="true"]').count(), 0);
  assert.ok(await sheet(page).locator('[data-continue]').isDisabled());
  await page.close();
});

test('English page: the sheet speaks English', async () => {
  const { page } = await open({ path: '/en/schedule' });
  await openRow(page).locator('a').click();
  await sheet(page).waitFor({ state: 'visible' });
  assert.equal(await sheet(page).locator('button[data-bike="3"]').getAttribute('aria-label'), 'Bike 3');
  assert.ok((await sheet(page).locator('[data-continue]').innerText()).length > 0);
  await page.close();
});

// Task 4: login placeholder, "opens soon" notice, kept choice.
const KEY = 'tockica.choice';
const step = (page, name) => sheet(page).locator(`[data-step="${name}"]`);
const stored = (page) => page.evaluate((k) => sessionStorage.getItem(k), KEY);
const pending = (page) => page.locator('[data-pending]');

/** Book the first open class, pick the first free bike, press Continue. Returns the class id and the bike. */
async function pickAndContinue(page) {
  const row = openRow(page);
  const id = await row.getAttribute('data-class-id');
  await row.locator('a').click();
  await sheet(page).waitFor({ state: 'visible' });
  const free = sheet(page).locator('button[data-bike]:not([disabled])').first();
  const n = Number(await free.getAttribute('data-bike'));
  await free.click();
  await sheet(page).locator('[data-continue]').click();
  return { id, n };
}

const words = {
  '/raspored': { send: 'Pošalji kod', soon: 'uskoro', waitlist: 'Lista čekanja', bike: 'Bicikl' },
  '/en/schedule': { send: 'Send code', soon: 'soon', waitlist: 'Waiting list', bike: 'Bike' },
};

for (const width of [390, 1280]) {
  for (const path of Object.keys(words)) {
    test(`${width}px ${path}: map, login, notice, and back`, async () => {
      const w = words[path];
      const { page, errors } = await open({ width, path });
      const { n } = await pickAndContinue(page);
      await step(page, 'login').waitFor({ state: 'visible' });
      assert.ok(await step(page, 'map').isHidden(), 'the map is gone');
      assert.ok((await step(page, 'login').innerText()).includes(String(n)), 'login summary names the bike');
      assert.equal(await step(page, 'login').locator('[data-send-code]').innerText(), w.send);
      assert.ok(await step(page, 'login').locator('[data-todo]').count(), 'login is marked as a placeholder');
      await step(page, 'login').locator('[data-email]').fill('visitor@example.com');
      await step(page, 'login').locator('[data-send-code]').click();
      await step(page, 'soon').waitFor({ state: 'visible' });
      assert.ok(await step(page, 'login').isHidden());
      const soon = await step(page, 'soon').innerText();
      assert.ok(soon.toLowerCase().includes(w.soon), 'the notice says booking opens soon');
      assert.ok(soon.includes(String(n)), 'the notice keeps the bike');
      assert.ok(await step(page, 'soon').locator('[data-todo]').count(), 'the notice is marked as a placeholder');
      assert.ok(!(await stored(page))?.includes('visitor@example.com'), 'the email is never stored');
      // Change bike goes back to the map with the pick still on.
      await step(page, 'soon').locator('[data-change-bike]').click();
      await step(page, 'map').waitFor({ state: 'visible' });
      assert.equal(await bike(page, n).getAttribute('aria-pressed'), 'true');
      await sheet(page).locator('[data-continue]').click();
      await step(page, 'login').waitFor({ state: 'visible' });
      await step(page, 'login').locator('[data-email]').fill('visitor@example.com');
      await step(page, 'login').locator('[data-send-code]').click();
      await step(page, 'soon').waitFor({ state: 'visible' });
      await step(page, 'soon').locator('[data-back-to-schedule]').click();
      await closed(page);
      assert.deepEqual(errors, []);
      await page.close();
    });
  }
}

test('Continue keeps class id, start time and bike, and nothing else', async () => {
  const { page } = await open();
  const { id, n } = await pickAndContinue(page);
  const klass = (await data(page)).find((c) => c.id === id);
  assert.deepEqual(JSON.parse(await stored(page)), { classId: id, startsAt: klass.startsAt, bike: n });
  await page.close();
});

test('after a reload the "your pick" bar shows the same class and bike, Continue goes to login, Clear removes it', async () => {
  const { page } = await open();
  const { id, n } = await pickAndContinue(page);
  await page.reload();
  await page.waitForSelector('[data-schedule]');
  await pending(page).waitFor({ state: 'visible' });
  assert.ok((await pending(page).innerText()).includes(String(n)), 'the bar names the bike');
  const klass = (await data(page)).find((c) => c.id === id);
  assert.ok((await pending(page).innerText()).includes(klass.instructor), 'the bar names the class');
  assert.equal(await sheet(page).evaluate((d) => d.open), false, 'the dialog does not open by itself');
  await pending(page).locator('[data-pending-continue]').click();
  await step(page, 'login').waitFor({ state: 'visible' });
  assert.ok((await step(page, 'login').innerText()).includes(String(n)));
  await page.keyboard.press('Escape');
  await closed(page);
  await pending(page).locator('[data-pending-clear]').click();
  await pending(page).waitFor({ state: 'hidden' });
  assert.equal(await stored(page), null);
  await page.close();
});

test('a stored choice for an unknown class or one that has started shows no bar', async () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 3_600_000).toISOString();
  for (const choice of [
    { classId: 'no-such-class', startsAt: future, bike: 3 },
    { classId: 'x', startsAt: past, bike: 3 },
  ]) {
    const { page, errors } = await open({
      init: `sessionStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(JSON.stringify(choice))})`,
    });
    await page.waitForTimeout(400);
    assert.ok(await pending(page).isHidden(), JSON.stringify(choice.classId));
    assert.deepEqual(errors, []);
    await page.close();
  }
});

test('a stored bike that is taken now sends Continue back to the map with the message', async () => {
  const { page } = await open();
  const row = openRow(page);
  const id = await row.getAttribute('data-class-id');
  const klass = (await data(page)).find((c) => c.id === id);
  const taken = klass.takenBikes[0];
  await page.evaluate(
    ([k, v]) => sessionStorage.setItem(k, v),
    [KEY, JSON.stringify({ classId: id, startsAt: klass.startsAt, bike: taken })]
  );
  await page.reload();
  await pending(page).waitFor({ state: 'visible' });
  await pending(page).locator('[data-pending-continue]').click();
  await step(page, 'map').waitFor({ state: 'visible' });
  assert.ok(await step(page, 'login').isHidden());
  assert.ok((await sheet(page).locator('[data-sheet-message]').innerText()).includes(String(taken)));
  assert.equal(await sheet(page).locator('button[aria-pressed="true"]').count(), 0);
  assert.ok(await sheet(page).locator('[data-continue]').isDisabled());
  await page.close();
});

test('the waiting list goes straight to login without a bike, and keeps the class', async () => {
  const { page, setEdit } = await open();
  const id = await openRow(page).getAttribute('data-class-id');
  setEdit((body) => {
    const c = body.classes.find((x) => x.id === id);
    c.takenBikes = Array.from({ length: c.capacity }, (_, i) => i + 1);
    c.freeBikes = 0;
    return body;
  });
  await refresh(page);
  await page.waitForSelector(`[data-class-id="${id}"][data-full]`);
  await page.locator(`[data-class-id="${id}"] a`).click();
  await step(page, 'login').waitFor({ state: 'visible' });
  assert.ok(await step(page, 'map').isHidden());
  assert.ok((await step(page, 'login').innerText()).includes('Lista čekanja'));
  const klass = (await data(page)).find((c) => c.id === id);
  assert.deepEqual(JSON.parse(await stored(page)), { classId: id, startsAt: klass.startsAt, bike: null });
  await page.close();
});

test('with sessionStorage blocked the flow still works and nothing is kept', async () => {
  const { page, errors } = await open({
    init: `Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } })`,
  });
  await pickAndContinue(page);
  await step(page, 'login').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await closed(page);
  await page.reload();
  await page.waitForSelector('[data-schedule]');
  await page.waitForTimeout(300);
  assert.ok(await pending(page).isHidden());
  assert.deepEqual(errors, []);
  await page.close();
});

test('switching language keeps the choice, and the bar and sheet follow the page language', async () => {
  const { page } = await open({ width: 1280 });
  const { id, n } = await pickAndContinue(page);
  await page.keyboard.press('Escape');
  await closed(page);
  const raw = await stored(page);
  assert.ok(!/Bicikl|Bike/.test(raw), 'the stored value has no words');
  await page.locator('#header [data-lang-switch]').first().click();
  await page.waitForURL('**/en/schedule');
  await pending(page).waitFor({ state: 'visible' });
  const text = await pending(page).innerText();
  assert.ok(text.includes(String(n)), 'same bike');
  assert.ok(/Continue|Clear/.test(text) && !/Nastavi/.test(text), 'the bar is in English');
  assert.equal(await stored(page), raw, 'the stored value is untouched');
  await pending(page).locator('[data-pending-continue]').click();
  await step(page, 'login').waitFor({ state: 'visible' });
  assert.equal(await step(page, 'login').locator('[data-send-code]').innerText(), 'Send code');
  assert.ok(id);
  await page.close();
});

test('Tab order follows the map: row by row, left to right', async () => {
  const { page } = await open({ width: 1280 });
  await openRow(page).locator('a').click();
  await sheet(page).waitFor({ state: 'visible' });
  await page.waitForTimeout(450);
  const boxes = await sheet(page)
    .locator('button[data-bike]')
    .evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return { n: e.dataset.bike, x: Math.round(r.x), y: Math.round(r.y) };
      })
    );
  for (let i = 1; i < boxes.length; i++) {
    const a = boxes[i - 1];
    const b = boxes[i];
    const forward = b.y > a.y + 2 || (Math.abs(b.y - a.y) <= 2 && b.x > a.x);
    assert.ok(forward, `bike ${b.n} comes after bike ${a.n} in the DOM but not on the map`);
  }
  await page.close();
});

test('on a laptop-height window the whole map fits the card without scrolling', async () => {
  for (const width of [768, 1024, 1280]) {
    const { page } = await open({ width, height: 800 });
    await openRow(page).locator('a').click();
    await sheet(page).waitFor({ state: 'visible' });
    await page.waitForTimeout(450);
    const scrolls = await sheet(page)
      .locator('[data-step="map"] > div')
      .first()
      .evaluate((el) => el.scrollHeight - el.clientHeight);
    assert.ok(scrolls <= 1, `${width}px: the map overflows its card by ${scrolls}px`);
    await page.close();
  }
});
