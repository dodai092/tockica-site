import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Whichever top-level .astro pages exist, starter set or a client build that has
// deleted/added pages per SETUP.md's "delete the pages you don't need" step. Excludes
// `_examples/` (demo reference material, stripped in client repos, allowed to reference
// widgets directly) and non-page route handlers (`og/`, `[...blog]`).
const pagesDir = fileURLToPath(new URL('../src/pages/', import.meta.url));

test('starter pages do not import parts-bin widgets', async () => {
  const entries = await readdir(pagesDir, { withFileTypes: true });
  const pages = entries.filter((e) => e.isFile() && e.name.endsWith('.astro')).map((e) => e.name);
  assert.ok(pages.length > 0, 'expected at least one page in src/pages/');
  for (const page of pages) {
    const source = await readFile(pagesDir + page, 'utf8');
    assert.doesNotMatch(source, /~\/components\/widgets\//, page);
  }
});
