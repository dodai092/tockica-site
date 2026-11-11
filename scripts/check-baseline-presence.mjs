#!/usr/bin/env node
// Checks that a screenshot baseline exists for every route in quality-routes.json, for
// every viewport/scheme combination `scripts/screenshot.mjs` captures. Pure filesystem
// check, no browser, no rendering, so unlike pixel comparison (renderer-specific, local
// only per docs/quality-gates.md) this is safe to run in CI: it answers "did anyone ever
// capture a baseline for the routes that exist right now", not "does it still match".
//
// On the Dodai Referrals build, no baseline was ever captured before the build was
// shown to the client; nothing caught that before a human looked at the page. See
// docs/retrospectives/2026-09-12-referral-build-retro.md.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routeTools from './quality-routes.cjs';

const { loadQualityRoutes, slugForRoute, needsBaseline } = routeTools;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASELINES_DIR = path.join(ROOT, 'golden-baselines');

const SCHEMES = ['light', 'dark'];
const VIEWPORT_NAMES = ['mobile', 'tablet', 'desktop'];

const routes = loadQualityRoutes(ROOT).filter((row) => needsBaseline(row.path));
const missing = [];

for (const route of routes) {
  const slug = slugForRoute(route.path);
  for (const scheme of SCHEMES) {
    for (const viewportName of VIEWPORT_NAMES) {
      const file = path.join(BASELINES_DIR, slug, `${scheme}-${viewportName}.png`);
      if (!existsSync(file)) missing.push(path.relative(ROOT, file));
    }
  }
}

if (missing.length > 0) {
  console.error(`Missing ${missing.length} baseline screenshot(s):\n` + missing.map((f) => `  ${f}`).join('\n'));
  console.error('\nRun "npm run build && npm run screenshot" and inspect/commit the results.');
  process.exit(1);
}

console.log(`All ${routes.length} route(s) have baseline screenshots for every viewport and scheme.`);
