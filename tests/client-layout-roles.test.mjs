import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

// Widget names from AstroWind's parts bin, copied into src/components/client/ for
// per-client customization. A client build may delete the ones it doesn't need
// (SETUP.md's "delete the pages/widgets you don't need" step), so this only checks
// the layout-role classes of whichever of these still exist, not that all of them do.
const files = [
  'Hero',
  'HeroText',
  'Note',
  'Features',
  'Features2',
  'Features3',
  'Steps',
  'Steps2',
  'Content',
  'Testimonials',
  'FAQs',
  'CallToAction',
  'Pricing',
];
const url = (path) => new URL(`../${path}`, import.meta.url);

const exists = async (path) => {
  try {
    await access(url(path));
    return true;
  } catch {
    return false;
  }
};

const layoutRolePatterns = {
  Hero: [/layout-page layout-gutter/, /layout-reading/, /layout-media/],
  HeroText: [/layout-page layout-gutter/],
  Features2: [/layout-page/],
  Content: [/layout-page/],
  FAQs: [/layout-page/],
  CallToAction: [/layout-reading/],
  Pricing: [/layout-page/],
};

test('starter-page widgets that still exist are client-owned and use balanced layout roles', async () => {
  const presence = await Promise.all(
    files.map(async (name) => [name, await exists(`src/components/client/${name}.astro`)])
  );
  const present = new Set(presence.filter(([, found]) => found).map(([name]) => name));
  assert.ok(present.size > 0, 'expected at least one client-layer widget to remain');

  for (const [name, patterns] of Object.entries(layoutRolePatterns)) {
    if (!present.has(name)) continue;
    const source = await readFile(url(`src/components/client/${name}.astro`), 'utf8');
    for (const pattern of patterns) assert.match(source, pattern, `${name}.astro`);
  }
});
