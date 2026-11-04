#!/usr/bin/env node
// Screenshot every route in quality-routes.json at three viewports and in
// both color schemes, using a built ./dist (run `npm run build` first).
//   node scripts/screenshot.mjs   writes/refreshes golden-baselines/
// See docs/golden-workflow.md for the full workflow this is part of.

import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routeTools from './quality-routes.cjs';
import { checkAgainstBaselines } from './visual-regression.mjs';

const { loadQualityRoutes, assertBuiltRoutes, slugForRoute } = routeTools;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASELINES_DIR = path.join(ROOT, 'golden-baselines');
const DIFF_DIR = path.join(ROOT, 'golden-baselines-diff');
const PORT = 4322;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const MAX_DIFF_PIXELS = 25;

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const SCHEMES = ['light', 'dark'];

const CHECK_MODE = process.argv.includes('--check');

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Preview server at ${url} did not come up within ${timeoutMs}ms`);
}

function startPreviewServer() {
  const child = spawn(
    'npx',
    ['--no-install', 'astro', 'preview', '--background', '--host', '127.0.0.1', '--port', String(PORT)],
    {
      cwd: ROOT,
      stdio: ['ignore', 'ignore', 'pipe'],
      detached: true,
    }
  );
  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  return { child, getStderr: () => stderr };
}

async function settlePage(page) {
  // Freeze animations/transitions so a full-page screenshot doesn't catch mid-fade
  // states, but pin intersect-gated elements (Tailwind's `intersect` variant is
  // `&:not([no-intersect])`, see tailwind.css) to their settled (visible) state instead
  // of letting them sit at their resting opacity-0, since disabling the animation alone
  // would otherwise leave them permanently invisible.
  await page.addStyleTag({
    content: [
      '*, *::before, *::after { animation: none !important; transition: none !important; }',
      '[class*="intersect"] { opacity: 1 !important; }',
    ].join('\n'),
  });
  await page.evaluate(() => document.fonts.ready);
  // Native lazy-loaded <img>s (see src/components/common/Image.astro) otherwise load
  // depending on when Chromium decides they're near the viewport during the full-page
  // screenshot's internal scroll, which is a source of run-to-run flakiness. Force them
  // to load now. A handful of routes reference a live external image URL (e.g. the
  // Unsplash photos in index.astro and pricing.astro), which occasionally fails to
  // rasterize on the first attempt (the `load` event fires but the bitmap never
  // decodes, painting as a blank placeholder) even though the fetch itself succeeded;
  // `decode()` is the reliable signal that a frame is actually ready to paint, so use
  // it to detect that case and retry.
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = 'eager';
    });

    const settleImage = async (img) => {
      const MAX_ATTEMPTS = 4;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          await img.decode();
          return;
        } catch {
          if (attempt === MAX_ATTEMPTS) return; // give up quietly, keep going
          const src = img.src;
          img.src = '';
          img.src = src;
        }
      }
    };

    await Promise.all(Array.from(document.images).map(settleImage));
  });
}

async function captureRoute(browser, route) {
  const slug = slugForRoute(route);
  const previewPath = route === '/' ? route : route.slice(0, -1);
  const shots = [];
  for (const scheme of SCHEMES) {
    const context = await browser.newContext({ colorScheme: scheme });
    if (scheme === 'dark') {
      // Matches ApplyColorMode.astro: it reads localStorage.theme, not just the OS
      // color-scheme preference.
      await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
    }
    const page = await context.newPage();
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(`${BASE_URL}${previewPath}`, { waitUntil: 'networkidle' });
      if (!response || !response.ok()) {
        throw new Error(previewPath + ' returned ' + (response ? 'HTTP ' + response.status() : 'no response'));
      }
      await settlePage(page);
      const fileName = `${scheme}-${viewport.name}.png`;
      const buffer = await page.screenshot({ fullPage: true });
      shots.push({ slug, fileName, buffer });
    }
    await context.close();
  }
  return shots;
}

async function writeBaselines(shots) {
  for (const shot of shots) {
    const dir = path.join(BASELINES_DIR, shot.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, shot.fileName), shot.buffer);
  }
}

// Shared cleanup state so both the normal finally path and the SIGINT/SIGTERM
// handlers can tear down the browser and the preview server's whole process group.
let activeBrowser;
let activeChild;
let cleanedUp = false;

async function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  // Stop the preview server synchronously, before touching the browser. Closing the
  // browser first (e.g. under SIGINT while a page.goto is in flight) makes that
  // in-flight navigation reject, which drives a second, concurrent pass through
  // main()'s own catch/finally/exit path; that second path can call process.exit()
  // before this function reaches the code below, abandoning it mid-cleanup and
  // leaking the server. Doing the synchronous, blocking work first avoids the race
  // entirely: nothing else can run until it returns.
  // The `--background` launcher process exits as soon as the detached server is up, so
  // by the time cleanup runs `activeChild` is almost always already gone. Astro's
  // `preview` server manages its own background-process lifecycle (`astro preview
  // stop`/`status`/`logs`) and `stop` looks the running server up via Astro's own
  // bookkeeping, independent of our process tree, so it is the reliable teardown and
  // must run unconditionally (it no-ops if nothing is running).
  try {
    spawnSync('npx', ['--no-install', 'astro', 'preview', 'stop'], {
      cwd: ROOT,
      stdio: 'ignore',
      timeout: 10000,
    });
  } catch {
    // best effort
  }
  // Belt: if the launcher itself is somehow still alive, kill its whole process group
  // (it was spawned detached).
  if (activeChild && activeChild.pid && activeChild.exitCode === null) {
    try {
      process.kill(-activeChild.pid);
    } catch {
      // already gone
    }
  }
  if (activeBrowser) {
    await activeBrowser.close().catch(() => {});
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await cleanup();
    process.exit(1);
  });
}

async function main() {
  const manifest = loadQualityRoutes(ROOT);
  const routes = manifest.map((row) => row.path);
  if (!existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    console.error('No ./dist build found. Run "npm run build" first.');
    process.exit(1);
  }
  assertBuiltRoutes(manifest, path.join(ROOT, 'dist'));
  const { child, getStderr } = startPreviewServer();
  activeChild = child;
  try {
    await waitForServer(BASE_URL);
    activeBrowser = await chromium.launch();
    const allShots = [];
    for (const route of routes) {
      allShots.push(...(await captureRoute(activeBrowser, route)));
    }
    if (CHECK_MODE) {
      const changed = await checkAgainstBaselines({
        shots: allShots,
        baselinesDir: BASELINES_DIR,
        diffDir: DIFF_DIR,
        maxDiffPixels: MAX_DIFF_PIXELS,
      });
      if (changed > 0) {
        console.error(`\n${changed} screenshot(s) differ from golden-baselines/. See golden-baselines-diff/.`);
        process.exitCode = 1;
      } else {
        console.log(`\nAll ${allShots.length} screenshots match golden-baselines/.`);
      }
    } else {
      await writeBaselines(allShots);
      console.log(`Wrote ${allShots.length} screenshots to golden-baselines/.`);
    }
  } catch (err) {
    console.error(getStderr());
    throw err;
  } finally {
    await cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
