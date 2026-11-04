// Walks every visible text element on every quality-routes.json route, in both color
// schemes, and asserts WCAG contrast against its effective background. Catches exactly
// the bug class that shipped on the Dodai Referrals build (text-primary used as text
// color against a background of a similar dark tone): that was caught only by CI's
// aggregate Lighthouse accessibility score, and only after push, and every other review
// layer missed it because none computed contrast per element.
// See docs/retrospectives/2026-09-12-referral-build-retro.md.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test, { before, after } from 'node:test';
import { chromium } from 'playwright';
import routeTools from '../scripts/quality-routes.cjs';

const { loadQualityRoutes } = routeTools;

const root = fileURLToPath(new URL('../', import.meta.url));
const PORT = 4325;
const origin = `http://127.0.0.1:${PORT}`;
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
      // The preview is still starting; retry until the deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Production preview did not start at ' + origin);
});

after(async () => {
  if (server?.pid) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      // The preview launcher may already have exited.
    }
  }
  spawnSync('npx', ['--no-install', 'astro', 'preview', 'stop'], { cwd: root, stdio: 'ignore', timeout: 10000 });
  await browser?.close();
});

// Runs inside the page. Walks visible text nodes, resolves each one's effective
// foreground/background pair (walking up ancestors for the first non-transparent
// background), and returns every pair that fails its WCAG threshold.
function collectContrastFailures() {
  function parseRGBA(value) {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((s) => parseFloat(s));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }

  function relativeLuminance({ r, g, b }) {
    const linear = (c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  }

  function contrastRatio(a, b) {
    const l1 = relativeLuminance(a);
    const l2 = relativeLuminance(b);
    const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (lighter + 0.05) / (darker + 0.05);
  }

  function effectiveBackground(el) {
    let node = el;
    while (node) {
      const bg = parseRGBA(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) return bg;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 }; // default canvas background
  }

  const failures = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let textNode;
  while ((textNode = walker.nextNode())) {
    const text = textNode.textContent.trim();
    if (!text) continue;
    const el = textNode.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const fg = parseRGBA(style.color);
    if (!fg || fg.a === 0) continue;
    const bg = effectiveBackground(el);
    const ratio = contrastRatio(fg, bg);

    const fontSize = parseFloat(style.fontSize);
    const isBold = parseInt(style.fontWeight, 10) >= 700;
    const isLarge = fontSize >= 24 || (isBold && fontSize >= 18.66);
    const threshold = isLarge ? 3.0 : 4.5;

    if (ratio < threshold) {
      failures.push({
        text: text.slice(0, 60),
        ratio: Math.round(ratio * 100) / 100,
        threshold,
        color: style.color,
        background: `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a})`,
        selector: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').join('.') : ''),
      });
    }
  }
  return failures;
}

const routes = loadQualityRoutes(root).filter((r) => r.kind !== 'dev');
const schemes = ['light', 'dark'];

for (const route of routes) {
  for (const scheme of schemes) {
    test(`contrast: ${route.path} (${scheme})`, async (t) => {
      const context = await browser.newContext({ colorScheme: scheme });
      t.after(() => context.close());
      const page = await context.newPage();
      await page.goto(origin + route.path, { waitUntil: 'networkidle' });
      const failures = await page.evaluate(collectContrastFailures);
      assert.deepEqual(
        failures,
        [],
        failures
          .map((f) => `"${f.text}" (${f.selector}): ${f.ratio}:1 < ${f.threshold}:1, ${f.color} on ${f.background}`)
          .join('\n')
      );
    });
  }
}
