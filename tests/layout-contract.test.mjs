import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('balanced layout variables and utilities remain defined', async () => {
  const [styles, utilities] = await Promise.all([
    read('src/components/CustomStyles.astro'),
    read('src/assets/styles/tailwind.css'),
  ]);

  assert.match(styles, /--aw-layout-page-max: var\(--aw-container-max\);/);
  assert.match(styles, /--aw-layout-reading-max: 48rem;/);
  assert.match(styles, /--aw-layout-media-max: 64rem;/);
  assert.match(styles, /--aw-layout-grid-gap: 2rem;/);

  for (const utility of ['layout-page', 'layout-reading', 'layout-media', 'layout-grid', 'layout-gutter']) {
    assert.match(utilities, new RegExp(`@utility ${utility} \\{`));
  }
});
