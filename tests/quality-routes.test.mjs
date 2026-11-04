import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import routes from '../scripts/quality-routes.cjs';

const publicRoute = (path) => ({ path, kind: 'public' });
const validate = (value) => routes.validateQualityRoutes(value, { isTemplate: false });

test('route grammar and classification reject ambiguous coverage', () => {
  assert.deepEqual(validate([publicRoute('/')]), [publicRoute('/')]);
  for (const value of [
    [],
    {},
    [publicRoute('contact')],
    [publicRoute('//example.com/')],
    [publicRoute('/contact?email=x')],
    [publicRoute('/a/../b/')],
    [publicRoute('/a%2fb/')],
    [publicRoute('/contact#form')],
    [publicRoute('/contact')],
    [publicRoute('/'), publicRoute('/')],
    [{ path: '/', kind: 'skip' }],
    [{ path: '/', kind: 'public', skip: true }],
    [{ path: '/dev/tokens/', kind: 'dev' }],
    [{ path: '/dev/tokens/', kind: 'public' }],
    [publicRoute('/a-b/'), publicRoute('/a/b/')],
  ])
    assert.throws(() => validate(value));
  assert.deepEqual(routes.validateQualityRoutes([{ path: '/dev/tokens/', kind: 'dev' }], { isTemplate: true }), [
    { path: '/dev/tokens/', kind: 'dev' },
  ]);
});

test('inventory catches uncovered and stale routes, including noindex pages', (t) => {
  const dist = mkdtempSync(path.join(tmpdir(), 'quality-inventory-'));
  t.after(() => rmSync(dist, { recursive: true, force: true }));
  mkdirSync(path.join(dist, 'contact'));
  writeFileSync(path.join(dist, 'index.html'), '<h1>Home</h1>');
  writeFileSync(path.join(dist, 'contact/index.html'), '<h1>Contact</h1>');
  writeFileSync(path.join(dist, '404.html'), '<h1>Not found</h1>');
  const complete = [publicRoute('/'), { path: '/contact/', kind: 'noindex' }];
  assert.doesNotThrow(() => routes.assertBuiltRoutes(complete, dist));
  assert.throws(() => routes.assertBuiltRoutes([publicRoute('/')], dist), /contact/);
  assert.throws(() => routes.assertBuiltRoutes([...complete, publicRoute('/missing/')], dist), /missing/);
});

test('sitemap exclusion check catches noindex/dev routes left in the sitemap', (t) => {
  const dist = mkdtempSync(path.join(tmpdir(), 'quality-sitemap-'));
  t.after(() => rmSync(dist, { recursive: true, force: true }));
  const manifest = [publicRoute('/'), { path: '/thank-you/', kind: 'noindex' }, { path: '/dev/tokens/', kind: 'dev' }];
  const sitemap = (locs) => '<?xml version="1.0"?><urlset>' + locs.map((l) => `<loc>${l}</loc>`).join('') + '</urlset>';
  const file = path.join(dist, 'sitemap-0.xml');

  writeFileSync(file, sitemap(['https://example.com/', 'https://example.com/thank-you']));
  assert.throws(() => routes.assertSitemapExcludes(manifest, dist), /thank-you/);

  writeFileSync(file, sitemap(['https://example.com/', 'https://example.com/dev/tokens/']));
  assert.throws(() => routes.assertSitemapExcludes(manifest, dist), /dev\/tokens/);

  writeFileSync(file, sitemap(['https://example.com/', 'https://example.com/about/', 'https://example.com/contact/']));
  assert.doesNotThrow(() => routes.assertSitemapExcludes(manifest, dist));

  rmSync(file);
  assert.throws(() => routes.assertSitemapExcludes(manifest, dist), /sitemap/i);
});
