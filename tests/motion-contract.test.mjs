// The site and the booking prototype must move the same way. The prototype is the source of truth
// (../prototype); the site holds copies. This test fails when they drift. It is skipped when the
// prototype folder is not next to the site (a deploy that only has site/).
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const site = fileURLToPath(new URL('../', import.meta.url));
const proto = join(site, '..', 'prototype');
const have = existsSync(join(proto, 'styles.css'));
const opts = { skip: have ? false : 'prototype folder not present' };

const norm = (v) => v.replace(/\s+/g, '').replace(/(^|[^\d])0\./g, '$1.');
const tokens = (css) => {
  const out = {};
  for (const m of css.matchAll(/--(ease-[a-z-]+):\s*(cubic-bezier\([^)]*\))/g)) out[m[1]] ??= norm(m[2]);
  return out;
};

test('the four easing tokens are the prototype values', opts, () => {
  const p = tokens(readFileSync(join(proto, 'styles.css'), 'utf8'));
  const s = tokens(readFileSync(join(site, 'src/components/client/MotionStyles.astro'), 'utf8'));
  assert.deepEqual(Object.keys(p).sort(), ['ease-drawer', 'ease-out', 'ease-out-strong', 'ease-spring']);
  assert.deepEqual(s, p);
});

test('src/lib/motion.js is a verbatim copy of the prototype helpers', opts, () => {
  const copy = readFileSync(join(site, 'src/lib/motion.js'), 'utf8');
  const original = readFileSync(join(proto, 'src/pages/motion.js'), 'utf8');
  assert.equal(copy.split('\n').slice(2).join('\n'), original, 'copy ../prototype/src/pages/motion.js again');
});

test('src/lib/sheet.js is a verbatim copy of the prototype sheet', opts, () => {
  const copy = readFileSync(join(site, 'src/lib/sheet.js'), 'utf8');
  const original = readFileSync(join(proto, 'src/pages/sheet.js'), 'utf8');
  assert.equal(copy.split('\n').slice(2).join('\n'), original, 'copy ../prototype/src/pages/sheet.js again');
});

test('the site invents no curve of its own', opts, () => {
  const allowed = new Set(Object.values(tokens(readFileSync(join(proto, 'styles.css'), 'utf8'))));
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(astro|css|ts|js)$/.test(name) && !full.includes(join('src', 'components', 'widgets')))
        files.push(full);
    }
  };
  walk(join(site, 'src/components/client'));
  walk(join(site, 'src/lib'));
  const stray = [];
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/cubic-bezier\([^)]*\)/g)) {
      if (!allowed.has(norm(m[0]))) stray.push(`${f.replace(site, '')}: ${m[0]}`);
    }
  }
  assert.deepEqual(stray, [], 'use a prototype token (var(--ease-*)) or a keyword such as ease-in-out');
});

test('press feedback and page fades use the prototype numbers', opts, () => {
  const p = readFileSync(join(proto, 'styles.css'), 'utf8');
  const s = readFileSync(join(site, 'src/components/client/MotionStyles.astro'), 'utf8');
  assert.match(p, /scale\(\.96\); transition-duration: \.08s/);
  assert.match(s, /scale\(0\.96\);\s*transition-duration: 0\.08s/);
  assert.match(p, /animation-duration: 400ms; animation-timing-function: ease-in-out/);
  assert.match(s, /fade-out 400ms ease-in-out/);
  assert.match(s, /fade-in 400ms ease-in-out/);
  assert.match(p, /lang-out 180ms ease-in both/);
  assert.match(s, /tk-lang-out 180ms ease-in both/);
  assert.match(p, /lang-in 260ms ease-out 140ms both/);
  assert.match(s, /tk-lang-in 260ms ease-out 140ms both/);
});
