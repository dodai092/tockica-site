/* eslint-disable @typescript-eslint/no-require-imports -- LHCI loads this CommonJS configuration synchronously. */
const { chromium } = require('playwright');
const { loadQualityRoutes, assertBuiltRoutes } = require('./scripts/quality-routes.cjs');
const { existsSync } = require('node:fs');
const path = require('node:path');

const routes = loadQualityRoutes(__dirname);
const dist = path.join(__dirname, 'dist');
if (existsSync(dist)) assertBuiltRoutes(routes, dist);
const gate = (minScore) => ['error', { minScore, aggregationMethod: 'median' }];
const escapeRegex = (value) => value.replace(/[.*+?^$()|[\]\\]/g, '\\$&');

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 1,
      chromePath: chromium.executablePath(),
      url: routes.map((route) => route.path),
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
      assertMatrix: routes.map((route) => ({
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
