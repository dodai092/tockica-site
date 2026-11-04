import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathFor, routeKeys } from '../src/i18n/routes.ts';

const script = new URL('../scripts/check-todos.mjs', import.meta.url).pathname;

async function fixture(html) {
  const dir = await mkdtemp(join(tmpdir(), 'todos-'));
  await mkdir(join(dir, 'sub'), { recursive: true });
  await writeFile(join(dir, 'sub', 'index.html'), html);
  return dir;
}
const run = (dir, env = {}) =>
  spawnSync(process.execPath, [script, dir], { encoding: 'utf8', env: { PATH: process.env.PATH, ...env } });

test('exits 0 without LAUNCH and names file and label', async () => {
  const dir = await fixture('<p><span data-todo="address (doc item 8)">x</span></p>');
  const r = run(dir);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /sub\/index\.html/);
  assert.match(r.stdout, /address \(doc item 8\)/);
});

test('exits 1 with LAUNCH=1 and still names the label', async () => {
  const dir = await fixture('<p><span data-todo="address (doc item 8)">x</span></p>');
  const r = run(dir, { LAUNCH: '1' });
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /address \(doc item 8\)/);
});

test('minified unquoted attribute is found too', async () => {
  const dir = await fixture('<a data-todo=login href=#>Prijava</a>');
  const r = run(dir, { LAUNCH: '1' });
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /login/);
});

test('a clean build passes with LAUNCH=1', async () => {
  const dir = await fixture('<p>done</p>');
  const r = run(dir, { LAUNCH: '1' });
  assert.equal(r.status, 0);
});

test('package.json has the check:todos script', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.scripts['check:todos'], /check-todos/);
});

test('quality-routes.json lists every route in the route table, in both languages', async () => {
  const manifest = JSON.parse(await readFile(new URL('../quality-routes.json', import.meta.url), 'utf8'));
  const paths = new Set(manifest.map((r) => r.path));
  for (const key of routeKeys)
    for (const lang of ['hr', 'en']) {
      const p = pathFor(key, lang);
      assert.ok(paths.has(p === '/' ? '/' : `${p}/`), `${key} ${lang} ${p}`);
    }
  for (const key of ['thanks', 'rules', 'terms', 'privacy'])
    for (const lang of ['hr', 'en'])
      assert.equal(manifest.find((r) => r.path === `${pathFor(key, lang)}/`)?.kind, 'noindex', `${key} ${lang}`);
});
