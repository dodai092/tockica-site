import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('page language and hreflang alternates come from page metadata', async () => {
  const [layout, metadata, types] = await Promise.all([
    read('src/layouts/Layout.astro'),
    read('src/components/common/Metadata.astro'),
    read('src/types.d.ts'),
  ]);

  assert.match(types, /lang\?: string;/);
  assert.match(types, /alternates\?: \{ hreflang: string; href: string \}\[\];/);
  assert.match(layout, /const language = metadata\.lang \?\? I18N\.language;/);
  assert.match(metadata, /locale: lang \|\| I18N\?\.language \|\| 'en'/);
  assert.match(metadata, /rel="alternate" hreflang=\{hreflang\}/);
});
