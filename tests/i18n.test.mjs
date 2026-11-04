import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import test from 'node:test';
import { alternatesFor, pathFor, routeKeys } from '../src/i18n/routes.ts';
import { getCopy } from '../src/i18n/index.ts';

const langs = ['hr', 'en'];
const pageFile = (path) => {
  // '/' -> index.astro, '/en' -> en/index.astro, '/instruktori' -> instruktori.astro
  if (path === '/') return 'src/pages/index.astro';
  if (path === '/en') return 'src/pages/en/index.astro';
  return `src/pages${path}.astro`;
};

function keyShape(value) {
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, keyShape(value[k])])
    );
  }
  return typeof value;
}

function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

test('every route has an HR and EN path with no trailing slash except home', () => {
  const seen = new Set();
  for (const key of routeKeys) {
    for (const lang of langs) {
      const path = pathFor(key, lang);
      assert.ok(path.startsWith('/'), `${key} ${lang}: ${path}`);
      assert.ok(path === '/' || !path.endsWith('/'), `${key} ${lang} has a trailing slash: ${path}`);
      if (lang === 'en') assert.ok(path === '/en' || path.startsWith('/en/'), `${key} en: ${path}`);
      else assert.ok(!path.startsWith('/en'), `${key} hr: ${path}`);
      assert.ok(!seen.has(path), `duplicate path ${path}`);
      seen.add(path);
    }
  }
  assert.equal(pathFor('home', 'hr'), '/');
  assert.equal(pathFor('home', 'en'), '/en');
});

test('route table lists the ten agreed pages', () => {
  assert.deepEqual([...routeKeys].sort(), [
    'contact',
    'home',
    'instructors',
    'packs',
    'privacy',
    'rules',
    'schedule',
    'sculpt',
    'terms',
    'thanks',
  ]);
});

test('every route has a page file in both languages', async () => {
  for (const key of routeKeys) {
    for (const lang of langs) {
      await access(new URL(`../${pageFile(pathFor(key, lang))}`, import.meta.url));
    }
  }
});

test('alternatesFor lists hr, en and x-default pointing at HR', () => {
  assert.deepEqual(alternatesFor('instructors'), [
    { hreflang: 'hr', href: '/instruktori' },
    { hreflang: 'en', href: '/en/instructors' },
    { hreflang: 'x-default', href: '/instruktori' },
  ]);
  assert.deepEqual(
    alternatesFor('home').map((a) => a.href),
    ['/', '/en', '/']
  );
});

test('hr and en copy have identical keys', () => {
  assert.deepEqual(keyShape(getCopy('hr')), keyShape(getCopy('en')));
});

test('copy contains no em dash', () => {
  for (const lang of langs) {
    for (const value of strings(getCopy(lang))) {
      assert.ok(!value.includes('—'), `${lang}: ${value}`);
    }
  }
});
