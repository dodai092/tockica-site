import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

// brand.ts imports the logo SVG through Vite's `~` alias. Node cannot load that, so
// stub any .svg import with a placeholder object for this test only.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('.svg'))
      return { url: 'data:text/javascript,export default {src:"logo"}', shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
const { brand } = await import('../src/brand.ts');

function channels(value) {
  const m = value.match(/rgb\((\d+) (\d+) (\d+)/);
  assert.ok(m, `not an rgb() value: ${value}`);
  return [m[1], m[2], m[3]].map(Number);
}

function luminance(value) {
  const [r, g, b] = channels(value).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = 'rgb(255 255 255)';

test('primary red is the Tockica red', () => {
  assert.equal(brand.light.primary, 'rgb(215 25 32)');
});

test('template blue and purple are gone from both modes', () => {
  for (const mode of [brand.light, brand.dark]) {
    assert.notEqual(mode.secondary, 'rgb(1 84 207)');
    assert.notEqual(mode.accent, 'rgb(109 40 217)');
  }
});

test('dark page is the slate from the original site', () => {
  assert.equal(brand.dark.bgPage, 'rgb(35 42 53)');
});

test('fonts point at Montserrat and Roboto', () => {
  assert.equal(brand.fonts.heading, 'var(--font-montserrat)');
  assert.equal(brand.fonts.sans, 'var(--font-roboto)');
});

test('logo is wired with alt text', () => {
  assert.ok(brand.logo.image);
  assert.equal(brand.logo.alt, 'Točkica na i logo');
});

for (const [name, fg, bg] of [
  ['white on light red button', WHITE, brand.light.primary],
  ['white on dark red button', WHITE, brand.dark.primary],
  ['light body text on light page', brand.light.textDefault, brand.light.bgPage],
  ['dark body text on slate page', brand.dark.textDefault, brand.dark.bgPage],
  ['light heading on light page', brand.light.textHeading, brand.light.bgPage],
  ['dark heading on slate page', brand.dark.textHeading, brand.dark.bgPage],
]) {
  test(`contrast >= 4.5: ${name}`, () => {
    assert.ok(contrast(fg, bg) >= 4.5, `${name}: ${contrast(fg, bg).toFixed(2)}`);
  });
}
