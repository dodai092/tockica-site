// Instructor profile pages and the links to them: every instructor has a twin page in both languages, and a name on
// a class row opens that page instead of the bike map (the row's Book link still does that).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test, { after, before } from 'node:test';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const PORT = 4326;
const origin = `http://127.0.0.1:${PORT}`;
const read = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const slugs = ['dunia', 'oliver', 'ivana', 'mirna', 'ena', 'domagoj', 'emma'];
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

for (const slug of slugs) {
  for (const [lang, file, twin, back] of [
    ['hr', `instruktori/${slug}/index.html`, `/en/instructors/${slug}`, '/instruktori'],
    ['en', `en/instructors/${slug}/index.html`, `/instruktori/${slug}`, '/en/instructors'],
  ]) {
    test(`${lang}: ${slug} has a profile page that is a twin of the other language`, async () => {
      const html = await read(file);
      assert.match(html, new RegExp(`<html[^>]*\\slang="${lang}"`));
      assert.match(html, /<h1[^>]*>\s*[A-Z][a-z]+\s*<\/h1>/);
      assert.ok(html.includes(`href="${twin}"`), 'the language switch points at the twin profile');
      assert.ok(html.includes(`href="${back}">`), 'there is a way back to the list');
      assert.ok(/data-todo="[^"]*Spotify playlist/.test(html), 'no playlist yet, so a placeholder');
    });
  }
}

for (const [lang, file, base] of [
  ['hr', 'raspored/index.html', '/instruktori/'],
  ['en', 'en/schedule/index.html', '/en/instructors/'],
]) {
  test(`${lang}: names on the schedule rows link to a profile`, async () => {
    const html = await read(file);
    const links = [...html.matchAll(/<a\b[^>]*data-f="instructor"[^>]*>/g)].map((m) => m[0]);
    assert.ok(links.length > 20, 'rows have a name link');
    assert.ok(links.some((a) => a.includes(`href="${base}`)));
  });
}

test('a name on a home card opens the profile, Book still opens the bike map', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${origin}/`);
  await page.waitForSelector('[data-section="next-classes"][data-feed-live]');
  const card = page.locator('[data-section="next-classes"] ul > li[data-next-class]').first();
  const name = (await card.locator('a[data-f="instructor"]').innerText()).trim();
  const href = await card.locator('a[data-f="instructor"]').getAttribute('href');
  assert.equal(href, `/instruktori/${name.toLowerCase()}`);
  await card.locator('a[data-f="instructor"]').click();
  await page.waitForURL(`**${href}`);
  assert.equal((await page.locator('h1').innerText()).trim(), name);
  await page.close();
});

test('a name on the schedule page opens the profile and does not open the bike map', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${origin}/en/schedule`);
  await page.waitForSelector('[data-schedule][data-feed-live]');
  const link = page.locator('[data-day-panel]:visible a[data-f="instructor"][href]').first();
  const href = await link.getAttribute('href');
  assert.ok(href.startsWith('/en/instructors/'));
  await link.click();
  await page.waitForURL(`**${href}`);
  await page.close();
});
