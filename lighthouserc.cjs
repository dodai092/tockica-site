/* eslint-disable @typescript-eslint/no-require-imports -- LHCI loads this CommonJS configuration synchronously. */
const { chromium } = require('playwright');
const { loadQualityRoutes, assertBuiltRoutes } = require('./scripts/quality-routes.cjs');
const { existsSync } = require('node:fs');
const path = require('node:path');

const routes = loadQualityRoutes(__dirname);
const dist = path.join(__dirname, 'dist');
if (existsSync(dist)) assertBuiltRoutes(routes, dist);
// CI sets LHCI_QUICK=1 so Lighthouse covers a representative set instead of every route (all 43 took about 10 minutes).
// Without it, local and pre-go-live runs still cover every route in the manifest.
const quickPaths = [
  '/',
  '/en/',
  '/raspored/',
  '/en/schedule/',
  '/instruktori/',
  '/instruktori/ena/',
  '/en/instructors/ena/',
  '/waitlist/',
];
const covered = process.env.LHCI_QUICK === '1' ? routes.filter((route) => quickPaths.includes(route.path)) : routes;
const gate = (minScore) => ['error', { minScore, aggregationMethod: 'median' }];
const escapeRegex = (value) => value.replace(/[.*+?^$()|[\]\\]/g, '\\$&');

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 1,
      chromePath: chromium.executablePath(),
      url: covered.map((route) => route.path),
      settings: {
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        // The pinned ubuntu-24.04 runner restricts unprivileged user namespaces
        // (AppArmor), so Chromium's setuid sandbox cannot start and the Lighthouse
        // Chrome launch aborts with "No usable sandbox!". This is a throwaway
        // measurement browser loading a local static build, so dropping the sandbox
        // is safe here. Harmless locally.
        chromeFlags: '--no-sandbox',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 562.5,
          downloadThroughputKbps: 1474.56,
          uploadThroughputKbps: 675,
        },
      },
    },
    assert: {
      assertMatrix: covered.map((route) => ({
        matchingUrlPattern:
          '^https?://[^/]+' +
          escapeRegex(route.path === '/' ? '/' : route.path.slice(0, -1)) +
          (route.path === '/' ? '$' : '/?$'),
        assertions: {
          'categories:performance': gate(0.9),
          'categories:accessibility': gate(1),
          'categories:best-practices': gate(0.95),
          ...(route.kind === 'public' ? { 'categories:seo': gate(0.95) } : {}),
        },
      })),
    },
  },
};
