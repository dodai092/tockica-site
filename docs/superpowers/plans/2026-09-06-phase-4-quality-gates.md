# Phase 4 Quality Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Follow the repository's SDD context gate and retain the task ledger. This document revision does not execute these tasks or authorize a push.

**Goal:** Make client quality verification blocking, repeatable, and supported by durable evidence.

**Architecture:** One validated route manifest drives Lighthouse and screenshots. Keep route and image helpers in scripts, optional event behavior in the client layer, and quality policy in one document. Test configuration directly and analytics in a real browser.

**Tech Stack:** Astro 7, Node 22.22.3, Node test runner, LHCI 0.15.1, Playwright 1.62.1, TypeScript, pixelmatch, PNGJS, Markdown.

**Spec:** `docs/superpowers/specs/2026-09-06-phase-4-quality-gates-design.md`

## Global constraints

- Do not edit `src/layouts/`, `src/utils/`, `src/components/{ui,common,blog}/`, `src/components/widgets/`, `vendor/`, content collections, `astro.config.ts`, or the configuration system.
- The named Lighthouse, package, and CI tooling changes are template-maintenance scope. They do not authorize changes to runtime core or deployment configuration.
- Event code belongs only in `src/components/client/`; `GlobalEmbeds.astro` is the only global mount.
- Three Lighthouse runs per route, median aggregation: performance `0.90`, accessibility `1.00`, best practices `0.95`, public-route SEO `0.95`, all errors.
- `quality-routes.json` is the only route list. Both tools cover all its records.
- Client baselines stay committed. Pixel comparison remains a hard local gate, excluded from CI.
- No free text, personal data, form values, URLs, identifiers, or queued pre-consent events.
- Review statuses are `pass`, `fail`, `not applicable`, and `exception`. N/A means absent feature only.
- Evidence lives in `docs/reviews/YYYY-MM-DD-<slug>/`, not private scratch space.
- Art-direction presets remain deferred. Do not push or implement unrelated core fixes.
- Use Karpathy guidelines: simplest change, scoped files, concrete red/green checks.

This is template maintenance, not a client build, so the client Discovery artifact task does not apply. Read the spec, CONTEXT.md, SETUP.md, and docs/client-build-rules.md before executing. Client copy is not being authored.

## File map

| File                                                                             | Responsibility                                                 |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `quality-routes.json`                                                            | Single route inventory with public/noindex/dev classification. |
| `scripts/quality-routes.cjs`                                                     | Validate/load routes and compare built HTML inventory.         |
| `scripts/check-quality-routes.mjs`                                               | CLI for the build inventory assertion.                         |
| `lighthouserc.cjs`                                                               | Route-derived assertions, three runs, pinned Chromium.         |
| `.github/workflows/actions.yaml`                                                 | Controlled Node/browser/OS environment and portable gates.     |
| `scripts/visual-regression.mjs`                                                  | Existing image comparison extracted with explicit directories. |
| `scripts/screenshot.mjs`                                                         | Shared manifest, browser capture, existing cleanup lifecycle.  |
| `scripts/init-client.mjs`                                                        | Remove inherited baselines; initialize empty shared manifest.  |
| `src/components/client/analytics-events.ts`                                      | Idempotent delegated event bridge.                             |
| `src/components/client/AnalyticsEvents.astro`                                    | Processed-script mount.                                        |
| `tests/quality-routes.test.mjs`, `tests/quality-gates.test.mjs`                  | Behavior and parsed configuration assertions.                  |
| `tests/visual-regression.test.mjs`, `tests/init-client-visual-baseline.test.mjs` | Image and initialization integration tests.                    |
| `tests/analytics-events.browser.mjs`                                             | Browser runtime, mounted integration, real navigation tests.   |
| `docs/quality-gates.md`                                                          | Canonical process, rubric, taxonomy, evidence convention.      |

## Task 1: Unify route coverage and enforce reproducible Lighthouse gates

**Files:** Create the manifest, route helper/CLI and two quality tests above. Modify `lighthouserc.cjs`, `scripts/init-client.mjs`, `package.json`, `package-lock.json`, `.github/workflows/actions.yaml`, `README.md`, and `CHANGELOG.md`. The old screenshot manifest is removed in Task 2 so existing screenshots keep working until then.

**Interfaces:**

- `loadQualityRoutes(root = repositoryRoot): Array<{path: string, kind: 'public'|'noindex'|'dev'}>`.
- `validateQualityRoutes(value, {isTemplate}): Route[]`.
- `assertBuiltRoutes(routes, distDir): void`, synchronous, throws route-specific errors.
- `slugForRoute(path): string`, preserves existing PNG names.
- CommonJS exports permit both the LHCI CJS config and ESM scripts to consume one implementation.

- [ ] **Step 1: Write failing route behavior tests.**

Create `tests/quality-routes.test.mjs`:

```js
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import routes from '../scripts/quality-routes.cjs';

const publicRoute = (path) => ({ path, kind: 'public' });
const validate = (value) => routes.validateQualityRoutes(value, { isTemplate: false });

test('route grammar and classification reject ambiguous coverage', () => {
  assert.deepEqual(validate([publicRoute('/')]), [publicRoute('/')]);
  for (const value of [
    [],
    {},
    [publicRoute('contact')],
    [publicRoute('//example.com/')],
    [publicRoute('/contact?email=x')],
    [publicRoute('/a/../b/')],
    [publicRoute('/a%2fb/')],
    [publicRoute('/contact#form')],
    [publicRoute('/contact')],
    [publicRoute('/'), publicRoute('/')],
    [{ path: '/', kind: 'skip' }],
    [{ path: '/', kind: 'public', skip: true }],
    [{ path: '/dev/tokens/', kind: 'dev' }],
    [{ path: '/dev/tokens/', kind: 'public' }],
    [publicRoute('/a-b/'), publicRoute('/a/b/')],
  ])
    assert.throws(() => validate(value));
  assert.deepEqual(routes.validateQualityRoutes([{ path: '/dev/tokens/', kind: 'dev' }], { isTemplate: true }), [
    { path: '/dev/tokens/', kind: 'dev' },
  ]);
});

test('inventory catches uncovered and stale routes, including noindex pages', (t) => {
  const dist = mkdtempSync(path.join(tmpdir(), 'quality-inventory-'));
  t.after(() => rmSync(dist, { recursive: true, force: true }));
  mkdirSync(path.join(dist, 'contact'));
  writeFileSync(path.join(dist, 'index.html'), '<h1>Home</h1>');
  writeFileSync(path.join(dist, 'contact/index.html'), '<h1>Contact</h1>');
  writeFileSync(path.join(dist, '404.html'), '<h1>Not found</h1>');
  const complete = [publicRoute('/'), { path: '/contact/', kind: 'noindex' }];
  assert.doesNotThrow(() => routes.assertBuiltRoutes(complete, dist));
  assert.throws(() => routes.assertBuiltRoutes([publicRoute('/')], dist), /contact/);
  assert.throws(() => routes.assertBuiltRoutes([...complete, publicRoute('/missing/')], dist), /missing/);
});
```

Run `node --test tests/quality-routes.test.mjs`. Expected: missing helper failure.

- [ ] **Step 2: Implement the shared manifest and inventory.**

Create `quality-routes.json`:

```json
[
  { "path": "/", "kind": "public" },
  { "path": "/about/", "kind": "public" },
  { "path": "/services/", "kind": "public" },
  { "path": "/pricing/", "kind": "public" },
  { "path": "/contact/", "kind": "public" },
  { "path": "/privacy/", "kind": "public" },
  { "path": "/terms/", "kind": "public" },
  { "path": "/thank-you/", "kind": "noindex" },
  { "path": "/dev/components/", "kind": "dev" },
  { "path": "/dev/og/", "kind": "dev" },
  { "path": "/dev/tokens/", "kind": "dev" }
]
```

Create `scripts/quality-routes.cjs`:

```js
/* eslint-disable @typescript-eslint/no-require-imports -- Shared with the synchronous LHCI CommonJS configuration. */
const { existsSync, readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');

const slugForRoute = (route) => (route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-'));

function validateQualityRoutes(value, { isTemplate }) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Quality route manifest is empty. Populate quality-routes.json before running gates.');
  }
  const seen = new Set();
  const slugs = new Set();
  for (const row of value) {
    if (
      !row ||
      typeof row !== 'object' ||
      Array.isArray(row) ||
      Object.keys(row).sort().join(',') !== 'kind,path' ||
      typeof row.path !== 'string' ||
      !/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(row.path) ||
      !['public', 'noindex', 'dev'].includes(row.kind)
    ) {
      throw new Error('Invalid quality route: ' + JSON.stringify(row));
    }
    if ((row.kind === 'dev') !== row.path.startsWith('/dev/') || (row.kind === 'dev' && !isTemplate)) {
      throw new Error('Development route is not permitted here: ' + row.path);
    }
    const slug = slugForRoute(row.path);
    if (seen.has(row.path) || slugs.has(slug)) {
      throw new Error('Duplicate route or screenshot slug: ' + row.path);
    }
    seen.add(row.path);
    slugs.add(slug);
  }
  return value;
}

function loadQualityRoutes(root = path.resolve(__dirname, '..')) {
  return validateQualityRoutes(JSON.parse(readFileSync(path.join(root, 'quality-routes.json'), 'utf8')), {
    isTemplate: existsSync(path.join(root, '.template-repo')),
  });
}

function assertBuiltRoutes(routes, distDir) {
  const built = new Set();
  function visit(dir, relative = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const name = relative + entry.name;
      if (entry.isDirectory()) visit(path.join(dir, entry.name), name + '/');
      else if (name.endsWith('.html') && name !== '404.html') {
        built.add(
          name === 'index.html'
            ? '/'
            : '/' + (name.endsWith('/index.html') ? name.slice(0, -10) : name.slice(0, -5) + '/')
        );
      }
    }
  }
  visit(distDir);
  const listed = new Set(routes.map((row) => row.path));
  const missing = [...built].filter((route) => !listed.has(route));
  const stale = [...listed].filter((route) => !built.has(route));
  if (missing.length || stale.length) {
    throw new Error('Quality route coverage: missing [' + missing.join(', ') + ']; stale [' + stale.join(', ') + ']');
  }
}

module.exports = { loadQualityRoutes, validateQualityRoutes, assertBuiltRoutes, slugForRoute };
```

Create `scripts/check-quality-routes.mjs`:

```js
import { fileURLToPath } from 'node:url';
import routes from './quality-routes.cjs';

const root = fileURLToPath(new URL('../', import.meta.url));
routes.assertBuiltRoutes(routes.loadQualityRoutes(root), fileURLToPath(new URL('../dist/', import.meta.url)));
console.log('Quality route manifest covers the production HTML inventory.');
```

- [ ] **Step 3: Write failing configuration assertions.**

Create `tests/quality-gates.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import yaml from 'js-yaml';
import { chromium } from 'playwright';
import routeTools from '../scripts/quality-routes.cjs';

const require = createRequire(import.meta.url);
const config = require('../lighthouserc.cjs');
const read = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('Lighthouse has one exact route assertion and three median runs', () => {
  const rows = routeTools.loadQualityRoutes();
  assert.deepEqual(
    config.ci.collect.url,
    rows.map((row) => row.path)
  );
  assert.equal(config.ci.collect.numberOfRuns, 3);
  assert.equal(config.ci.collect.chromePath, chromium.executablePath());
  assert.equal(config.ci.collect.settings.throttlingMethod, 'simulate');
  assert.equal(config.ci.collect.settings.formFactor, 'mobile');
  for (const row of rows) {
    const matches = config.ci.assert.assertMatrix.filter((entry) =>
      new RegExp(entry.matchingUrlPattern).test('http://localhost:4321' + row.path)
    );
    assert.equal(matches.length, 1, row.path);
    const assertions = matches[0].assertions;
    for (const [category, minScore] of [
      ['performance', 0.9],
      ['accessibility', 1],
      ['best-practices', 0.95],
    ]) {
      assert.deepEqual(assertions['categories:' + category], ['error', { minScore, aggregationMethod: 'median' }]);
    }
    assert.deepEqual(
      assertions['categories:seo'],
      row.kind === 'public' ? ['error', { minScore: 0.95, aggregationMethod: 'median' }] : undefined
    );
  }
});

test('CI pins the browser toolchain and runs portable gates', () => {
  const workflow = yaml.load(read('.github/workflows/actions.yaml'));
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.devDependencies.playwright, '1.62.1');
  assert.equal(pkg.devDependencies['@lhci/cli'], '0.15.1');
  for (const job of Object.values(workflow.jobs)) {
    assert.equal(job['runs-on'], 'ubuntu-24.04');
    const node = job.steps.find((step) => step.uses?.startsWith('actions/setup-node@'));
    assert.equal(node.with['node-version'], '22.22.3');
    assert.ok(job.steps.some((step) => step.run === 'npm ci'));
  }
  const build = workflow.jobs.build;
  assert.equal(build.env.TZ, 'UTC');
  assert.equal(build.env.LANG, 'C.UTF-8');
  for (const command of [
    'npx --no-install playwright install --with-deps chromium',
    'npm run test:quality',
    'npm run test:routes',
    'npm run test:analytics',
    'npm run test:links',
    'npm run test:lhci',
  ])
    assert.ok(
      build.steps.some((step) => step.run === command),
      command
    );
  assert.ok(!build.steps.some((step) => step.run?.includes('screenshot:check')));
  assert.equal(
    pkg.scripts.verify,
    'npm run build && npm run check && npm run test:quality && npm run test:routes && npm run test:analytics && npm run test:links && npm run test:lhci && npm run screenshot:check'
  );
});
```

Run `node --test tests/quality-gates.test.mjs`. Expected: old run count, warning threshold, URL coverage, and pins fail.

- [ ] **Step 4: Implement route-derived Lighthouse configuration and CI pins.**

Replace `lighthouserc.cjs` with:

```js
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
      numberOfRuns: 3,
      chromePath: chromium.executablePath(),
      url: routes.map((route) => route.path),
      settings: {
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
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
```

The build inventory check is separate so an unbuilt repo can import config for unit tests. Real verification always builds and checks the inventory first. Both tools independently validate the manifest; a direct LHCI run with a present stale build also fails.

Remove the obsolete `lighthouserc.cjs` entry from `scripts/init-client.mjs`'s REPLACEMENTS array in this same task. Its old hardcoded dev-URL string no longer exists, so leaving the replacement until Task 2 would break `npm run check:init` between tasks.

Pin `@lhci/cli` to `0.15.1` in package.json, retaining the current lock resolution:

```sh
npm install --package-lock-only --ignore-scripts
```

Add these package scripts now; their browser and screenshot implementations arrive in the dependent tasks:

```json
"test:quality": "node --test tests/*.test.mjs",
"test:routes": "node scripts/check-quality-routes.mjs",
"test:analytics": "node --test tests/analytics-events.browser.mjs",
"verify": "npm run build && npm run check && npm run test:quality && npm run test:routes && npm run test:analytics && npm run test:links && npm run test:lhci && npm run screenshot:check"
```

In both existing CI jobs set `runs-on: ubuntu-24.04` and `node-version: '22.22.3'`; retain npm ci and the current job dependency. Add build job `env: { TZ: UTC, LANG: C.UTF-8 }`. After npm ci and before the build, install Chromium. After the build, insert quality, routes, and analytics tests before the existing links and Lighthouse steps:

```yaml
- name: Install pinned Chromium
  run: npx --no-install playwright install --with-deps chromium

- name: Quality behavior and configuration tests
  run: npm run test:quality

- name: Verify route inventory
  run: npm run test:routes

- name: Analytics browser behavior
  run: npm run test:analytics
```

Before Lighthouse, add an environment-record step. After Lighthouse, add an always-run artifact upload. Use a YAML block for the first step's actual multiline shell script:

```yaml
- name: Record quality environment
  run: |
    mkdir -p quality-ci-evidence
    node -p 'JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,runnerImage:process.env.ImageOS,runnerVersion:process.env.ImageVersion})' > quality-ci-evidence/environment.json
    npx --no-install playwright --version > quality-ci-evidence/playwright.txt
    node -e 'const {execFileSync}=require("node:child_process");process.stdout.write(execFileSync(require("playwright").chromium.executablePath(),["--version"]))' > quality-ci-evidence/chromium.txt
    npx --no-install lhci --version > quality-ci-evidence/lhci.txt
    sha256sum package-lock.json quality-routes.json > quality-ci-evidence/hashes.txt

- name: Retain Lighthouse diagnostics
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: quality-lighthouse
    path: |
      .lighthouseci/
      quality-ci-evidence/
    include-hidden-files: true
    retention-days: 30
```

These CI writes are generated run artifacts, not local source-edit instructions. Reviewer-cited artifacts must later be copied into the durable project review folder. The hosted image patch is recorded because pinning its OS family cannot freeze hardware or patch updates.

Add `verify` to the README command table. Update the unreleased changelog with three-run hard performance gating and shared route coverage.

- [ ] **Step 5: Verify and review this task.**

Run:

```sh
node --test tests/quality-routes.test.mjs tests/quality-gates.test.mjs
npm run check:init
npm run build
npm run test:routes
npm run test:lhci
```

Expected: unit assertions and route coverage pass. Lighthouse runs three times per route; any score below the specified median floor fails. Record a real performance failure and its route, do not weaken the gate. Later tasks complete the newly named full verification command. Review the task before proceeding under the SDD gate.

Commit only this task's named files with `feat: unify routes and enforce quality gates` when execution authority permits commits.

## Task 2: Preserve client baseline ownership and comparison behavior

**Files:** Create `scripts/visual-regression.mjs`, `tests/visual-regression.test.mjs`, and `tests/init-client-visual-baseline.test.mjs`. Modify `scripts/screenshot.mjs` and `scripts/init-client.mjs`. Delete `golden-baselines/routes.json`. Add reviewed PNGs under `golden-baselines/dev-components/`, `golden-baselines/dev-og/`, and `golden-baselines/dev-tokens/`.

**Interfaces:** Consume Task 1's loader, inventory checker, and slug function. Produce `checkAgainstBaselines({shots, baselinesDir, diffDir, maxDiffPixels}): Promise<number>`. Shots remain `{slug, fileName, buffer}`.

- [ ] **Step 1: Write failing image behavior tests.**

Create `tests/visual-regression.test.mjs`:

```js
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import pngjs from 'pngjs';
import { checkAgainstBaselines } from '../scripts/visual-regression.mjs';

const { PNG } = pngjs;
const png = (width, color) => {
  const value = new PNG({ width, height: 8 });
  for (let i = 0; i < value.data.length; i += 4) {
    value.data[i] = value.data[i + 1] = value.data[i + 2] = color;
    value.data[i + 3] = 255;
  }
  return PNG.sync.write(value);
};

test('missing, matching, dimensions, and pixel changes produce correct outcomes', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'quality-images-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const baselinesDir = path.join(root, 'baseline');
  const diffDir = path.join(root, 'diff');
  const shot = { slug: 'home', fileName: 'light-mobile.png', buffer: png(8, 0) };
  const run = () => checkAgainstBaselines({ shots: [shot], baselinesDir, diffDir, maxDiffPixels: 25 });
  const diagnostic = path.join(diffDir, 'home/light-mobile.png');
  assert.equal(await run(), 1);
  assert.deepEqual(await readFile(diagnostic), shot.buffer);
  await mkdir(path.join(baselinesDir, 'home'), { recursive: true });
  await writeFile(path.join(baselinesDir, 'home/light-mobile.png'), shot.buffer);
  assert.equal(await run(), 0);
  assert.equal(existsSync(diffDir), false);
  shot.buffer = png(9, 0);
  assert.equal(await run(), 1);
  assert.deepEqual(await readFile(diagnostic), shot.buffer);
  shot.buffer = png(8, 255);
  assert.equal(await run(), 1);
  assert.equal(existsSync(diagnostic), true);
});
```

Run `node --test tests/visual-regression.test.mjs`. Expected: missing helper failure.

- [ ] **Step 2: Extract comparison and consume the shared manifest.**

Move the existing `checkAgainstBaselines` function, PNG/pixelmatch imports, and its filesystem imports to `scripts/visual-regression.mjs`. Change only its signature and directory/tolerance references:

```js
export async function checkAgainstBaselines({ shots, baselinesDir, diffDir, maxDiffPixels }) {
```

Replace `BASELINES_DIR`, `DIFF_DIR`, and `MAX_DIFF_PIXELS` inside the function with those arguments. Add current-image diagnostics inside the existing missing-baseline branch before continuing:

```js
await mkdir(path.join(diffDir, shot.slug), { recursive: true });
await writeFile(path.join(diffDir, shot.slug, shot.fileName), shot.buffer);
```

Preserve existing pixelmatch settings, counts, logs, and cleanup of the exact diff directory. Remove only imports made unused by this extraction from the runner.

In `scripts/screenshot.mjs`, replace its manifest and slug definitions:

```js
import routeTools from './quality-routes.cjs';
import { checkAgainstBaselines } from './visual-regression.mjs';
const { loadQualityRoutes, assertBuiltRoutes, slugForRoute } = routeTools;
```

At the start of `main()`, before the dist check and browser/server startup:

```js
const manifest = loadQualityRoutes(ROOT);
const routes = manifest.map((row) => row.path);
```

After the existing dist existence check:

```js
assertBuiltRoutes(manifest, path.join(ROOT, 'dist'));
```

Replace the comparison call:

```js
const changed = await checkAgainstBaselines({
  shots: allShots,
  baselinesDir: BASELINES_DIR,
  diffDir: DIFF_DIR,
  maxDiffPixels: MAX_DIFF_PIXELS,
});
```

Retain the server lifecycle, signal cleanup, color scheme, font/image settling, and all viewports. Make the HTTP error guard handle a null navigation response:

```js
if (!response || !response.ok()) {
  throw new Error(route + ' returned ' + (response ? 'HTTP ' + response.status() : 'no response'));
}
```

Delete the old routes.json only after the runner consumes Task 1's manifest. Update its opening comment to name quality-routes.json.

- [ ] **Step 3: Write the failing client initialization integration test.**

Create `tests/init-client-visual-baseline.test.mjs`:

```js
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('client initialization leaves gates blocked by an empty shared manifest', async (t) => {
  if (!existsSync(fileURLToPath(new URL('../.template-repo', import.meta.url)))) {
    t.skip('template-maintenance integration test');
    return;
  }
  const source = fileURLToPath(new URL('../', import.meta.url));
  const temp = await mkdtemp(path.join(tmpdir(), 'quality-client-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const excluded = new Set([
    '.git',
    'node_modules',
    'dist',
    '.astro',
    '.worktrees',
    '.lighthouseci',
    'golden-baselines-diff',
  ]);
  await cp(source, temp, {
    recursive: true,
    filter: (file) =>
      !path
        .relative(source, file)
        .split(path.sep)
        .some((part) => excluded.has(part)),
  });
  await symlink(path.join(source, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const init = spawnSync(process.execPath, ['scripts/init-client.mjs'], {
    cwd: temp,
    encoding: 'utf8',
    input: [
      'Quality Fixture',
      'example.test',
      'Quality Fixture',
      'contact@example.test',
      'Croatia',
      '',
      'system',
      'n',
      '',
    ].join('\n'),
  });
  assert.equal(init.status, 0, init.stderr + init.stdout);
  assert.equal(await readFile(path.join(temp, 'quality-routes.json'), 'utf8'), '[]\n');
  assert.equal(existsSync(path.join(temp, 'golden-baselines/home/light-desktop.png')), false);
  assert.equal(existsSync(path.join(temp, 'golden-baselines/routes.json')), false);
  assert.equal(existsSync(path.join(temp, 'docs/golden-workflow.md')), true);
  assert.equal(existsSync(path.join(temp, 'scripts/screenshot.mjs')), true);
  for (const args of [[], ['--check']]) {
    const check = spawnSync(process.execPath, ['scripts/screenshot.mjs', ...args], { cwd: temp, encoding: 'utf8' });
    assert.notEqual(check.status, 0);
    assert.match(check.stderr + check.stdout, /route manifest is empty/i);
  }
});
```

The dependency symlink matters: top-level Playwright/pixelmatch imports still resolve before `main()`. No browser binary is launched for the empty-manifest failure. The disposable copy includes uncommitted changes and is removed by its test hook.

Run `node --test tests/init-client-visual-baseline.test.mjs`. Expected: the shared manifest is still inherited and the guide is removed, so it fails.

- [ ] **Step 4: Update initialization and generated checklist.**

Add `mkdir` to init-client's fs/promises import. Task 1 already removed the obsolete Lighthouse text replacement. Keep removing inherited golden-baselines in the existing cleanup loop, but remove `docs/golden-workflow.md` from that loop. Immediately after the loop:

```js
await mkdir('golden-baselines', { recursive: true });
await writeFile('quality-routes.json', '[]\n');
console.log('  initialized empty client quality manifest and baseline directory');
```

Add this generated checklist block:

```md
## Quality routes and visual regression

- [ ] Populate quality-routes.json with every public and intentional noindex page. Development routes are not allowed in a client repo.
- [ ] Run npm run build and npm run test:routes, then npm run screenshot. Inspect desktop and mobile captures and commit approved baselines.
- [ ] Run npm run verify and save the rubric and cited evidence under docs/reviews/YYYY-MM-DD-<slug>/review.md.
```

- [ ] **Step 5: Verify the migration and baseline coverage.**

Run:

```sh
node --test tests/visual-regression.test.mjs tests/init-client-visual-baseline.test.mjs
npm run check:init
npm run build
npm run screenshot:check
npm run screenshot
npm run screenshot:check
```

The first check runs against the previously approved images. Preserve and inspect its diagnostics before writing. It is expected to fail only for newly manifested routes without baselines; any difference on an existing route is a regression to investigate. After that inspection, capture the missing dev baselines and run the check again. A different OS renderer is not automatic permission to overwrite existing baselines. Never refresh an existing baseline merely to make the check pass. Commit this task's files and reviewed new images with `feat: require client-owned visual baselines`.

## Task 3: Implement and behavior-test the client analytics bridge

**Files:** Create `src/components/client/analytics-events.ts`, `src/components/client/AnalyticsEvents.astro`, and `tests/analytics-events.browser.mjs`. Modify `src/components/client/GlobalEmbeds.astro` and `src/components/client/README.md`.

**Interfaces:** `installAnalyticsEvents(window): void`; DOM attributes and closed values exactly as in spec section 6. `aw:lead-success` is a bubbling event dispatched on a form marked `data-aw-event="contact_submit"` after confirmed backend success. It has no payload. No globals beyond one installation marker.

- [ ] **Step 1: Write failing runtime tests with Playwright and the real TypeScript module.**

Create `tests/analytics-events.browser.mjs`. Its harness imports/transpiles the actual module for isolated tests, then separately verifies the component is mounted in a production page and survives real ClientRouter navigation. A local spy replaces gtag. Do not assert source strings.

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test, { before, after } from 'node:test';
import { chromium } from 'playwright';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'http://127.0.0.1:4323';
let browser;
let server;
let compiled;

before(async () => {
  const source = await readFile(new URL('../src/components/client/analytics-events.ts', import.meta.url), 'utf8');
  compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  browser = await chromium.launch();
  server = spawn('npx', ['--no-install', 'astro', 'preview', '--host', '127.0.0.1', '--port', '4323'], {
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

async function fixture(t) {
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  await page.route('https://**/*', (route) => route.abort());
  await page.setContent(
    '<script id="ga-init" data-id="G-TEST" data-consent="required"></script>' +
      '<button id="cta" data-aw-event="cta_click" data-aw-placement="hero" ' +
      'data-aw-label="primary_cta" data-aw-destination-type="internal"><span>Contact</span></button>' +
      '<form id="form" data-aw-event="contact_submit" data-aw-placement="contact_form" ' +
      'data-aw-destination-type="form"><input required name="email">' +
      '<button id="submit">Send</button></form>'
  );
  await page.addScriptTag({
    content:
      '(() => { const exports = {}; ' + compiled + '; window.testInstall = exports.installAnalyticsEvents; })();',
  });
  await page.evaluate(() => {
    window.calls = [];
    window.gtag = (...args) => window.calls.push(args);
    window.consentState = 'granted';
    window.awAnalytics = { status: () => window.consentState };
    window.testInstall(window);
    document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
  });
  return page;
}

test('grant, unset, denial, revocation, missing API, missing GA and non-consent mode', async (t) => {
  const page = await fixture(t);
  for (const state of ['unset', 'denied', 'granted', 'denied']) {
    await page.evaluate((value) => {
      window.consentState = value;
    }, state);
    await page.locator('#cta span').click();
  }
  assert.equal(await page.evaluate(() => window.calls.length), 1);
  await page.evaluate(() => {
    delete window.awAnalytics;
  });
  await page.locator('#cta').click();
  assert.equal(await page.evaluate(() => window.calls.length), 1);
  await page.evaluate(() => {
    document.querySelector('#ga-init').dataset.consent = '';
  });
  await page.locator('#cta').click();
  assert.equal(await page.evaluate(() => window.calls.length), 2);
  await page.evaluate(() => {
    document.querySelector('#ga-init').dataset.id = '';
  });
  await page.locator('#cta').click();
  assert.equal(await page.evaluate(() => window.calls.length), 2);
  await page.evaluate(() => {
    document.querySelector('#ga-init').dataset.id = 'G-TEST';
    delete window.gtag;
  });
  await page.locator('#cta').click();
  assert.equal(await page.evaluate(() => window.calls.length), 2);
});

test('valid submit attempt and confirmed success are separate, with no field data', async (t) => {
  const page = await fixture(t);
  await page.locator('#submit').click();
  assert.deepEqual(await page.evaluate(() => window.calls), []);
  await page.locator('input').fill('personal@example.test');
  await page.locator('#submit').click();
  assert.deepEqual(await page.evaluate(() => window.calls), [
    ['event', 'contact_submit', { placement: 'contact_form', destination_type: 'form' }],
  ]);
  await page.evaluate(() =>
    document.querySelector('#form').dispatchEvent(
      new CustomEvent('aw:lead-success', {
        bubbles: true,
        detail: { email: 'must-not-forward@example.test' },
      })
    )
  );
  assert.deepEqual(await page.evaluate(() => window.calls), [
    ['event', 'contact_submit', { placement: 'contact_form', destination_type: 'form' }],
    ['event', 'generate_lead', { placement: 'contact_form', destination_type: 'form' }],
  ]);
  await page.evaluate(() => {
    document.querySelector('#cta').dataset.awEvent = 'generate_lead';
  });
  await page.locator('#cta').click();
  assert.equal(await page.evaluate(() => window.calls.length), 2);
});

test('closed values reject personal/free text, long values and wrong event semantics', async (t) => {
  const page = await fixture(t);
  for (const value of [
    'person@example.test',
    '+3851234',
    'https://example.test/?id=42',
    'hello world',
    'unknown_slug',
    '',
    'a'.repeat(33),
  ]) {
    await page.evaluate((label) => {
      document.querySelector('#cta').dataset.awLabel = label;
    }, value);
    await page.locator('#cta').click();
  }
  assert.deepEqual(await page.evaluate(() => window.calls), []);
  await page.evaluate(() => {
    const cta = document.querySelector('#cta');
    cta.dataset.awLabel = 'primary_cta';
    cta.dataset.email = 'must-not-forward@example.test';
  });
  await page.locator('#cta span').click();
  assert.deepEqual(await page.evaluate(() => window.calls), [
    ['event', 'cta_click', { placement: 'hero', label: 'primary_cta', destination_type: 'internal' }],
  ]);
  for (const [name, destination, fileName] of [
    ['phone_click', 'phone', null],
    ['email_click', 'email', null],
    ['file_download', 'file', 'brochure.pdf'],
  ]) {
    await page.evaluate(
      ({ name, destination, fileName }) => {
        const link = document.createElement('a');
        link.id = 'link';
        link.textContent = 'Tracked link';
        link.href = '#';
        link.dataset.awEvent = name;
        link.dataset.awDestinationType = destination;
        if (fileName) link.dataset.awFileName = fileName;
        document.body.append(link);
        link.addEventListener('click', (event) => event.preventDefault());
      },
      { name, destination, fileName }
    );
    await page.locator('#link').click();
    const params = { destination_type: destination, ...(fileName ? { file_name: fileName } : {}) };
    assert.deepEqual(await page.evaluate(() => window.calls.at(-1)), ['event', name, params]);
    await page.locator('#link').evaluate((link) => link.remove());
  }
});

test('reinstall and page-load events retain exactly one listener per interaction', async (t) => {
  const page = await fixture(t);
  await page.evaluate(() => {
    for (let i = 0; i < 3; i++) {
      window.testInstall(window);
      document.dispatchEvent(new Event('astro:page-load'));
    }
  });
  await page.locator('#cta span').click();
  assert.equal(await page.evaluate(() => window.calls.length), 1);
  await page.locator('input').fill('fixture');
  await page.locator('#submit').click();
  await page.evaluate(() =>
    document.querySelector('#form').dispatchEvent(new CustomEvent('aw:lead-success', { bubbles: true }))
  );
  assert.deepEqual(await page.evaluate(() => window.calls.map((call) => call[1])), [
    'cta_click',
    'contact_submit',
    'generate_lead',
  ]);
});

test('built component stays active through two actual ClientRouter navigations', async (t) => {
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  await page.route('https://**/*', (route) => route.abort());
  await page.goto(origin);
  await page.evaluate(() => {
    window.documentSentinel = 'original-document';
    window.calls = [];
    window.navigationCount = 0;
    document.addEventListener('astro:page-load', () => {
      window.navigationCount++;
      window.gtag = (...args) => window.calls.push(args);
    });
  });
  for (const destination of ['/about/', '/contact/']) {
    await page.evaluate((href) => {
      const link = document.createElement('a');
      link.id = 'quality-navigation';
      link.textContent = 'Navigate';
      link.href = href;
      document.body.append(link);
    }, destination);
    await page.locator('#quality-navigation').click();
    await page.waitForURL(origin + destination);
    await page.waitForFunction(() => window.navigationCount > window.calls.length);
    assert.equal(await page.evaluate(() => window.documentSentinel), 'original-document');
    await page.evaluate(() => {
      const init = document.querySelector('#ga-init');
      init.dataset.id = 'G-TEST';
      init.dataset.consent = '';
      delete window.awAnalytics;
      window.gtag = (...args) => window.calls.push(args);
      const button = document.createElement('button');
      button.id = 'quality-cta';
      button.textContent = 'Tracked action';
      button.dataset.awEvent = 'cta_click';
      button.dataset.awDestinationType = 'internal';
      document.body.append(button);
    });
    await page.locator('#quality-cta').click();
  }
  assert.deepEqual(await page.evaluate(() => window.calls), [
    ['event', 'cta_click', { destination_type: 'internal' }],
    ['event', 'cta_click', { destination_type: 'internal' }],
  ]);
});
```

Run `npm run build && npm run test:analytics`. Expected: the new TypeScript module is missing. The integration test must fail if the Astro mount is removed, even when isolated module tests pass.

- [ ] **Step 2: Implement the strict, idempotent bridge.**

Create `src/components/client/analytics-events.ts`:

```ts
type AnalyticsWindow = Window &
  typeof globalThis & {
    __awEventsInstalled?: boolean;
    gtag?: (...args: unknown[]) => void;
  };

const VALUES: Record<string, readonly string[]> = {
  placement: ['header', 'hero', 'body', 'footer', 'contact_form'],
  label: ['primary_cta', 'secondary_cta', 'contact', 'brochure'],
  destination_type: ['internal', 'external', 'phone', 'email', 'file', 'form'],
  file_name: ['brochure.pdf', 'price_list.pdf'],
};
const CLICK_EVENTS = new Set(['cta_click', 'phone_click', 'email_click', 'file_download']);

export function installAnalyticsEvents(win: AnalyticsWindow): void {
  if (win.__awEventsInstalled) return;
  win.__awEventsInstalled = true;
  const doc = win.document;

  const emit = (name: string, element: Element) => {
    const init = doc.getElementById('ga-init');
    if (!init?.dataset.id || typeof win.gtag !== 'function') return;
    try {
      if (win.awAnalytics) {
        if (typeof win.awAnalytics.status !== 'function' || win.awAnalytics.status() !== 'granted') return;
      } else if (init.dataset.consent === 'required') return;
    } catch {
      return;
    }
    const params: Record<string, string> = {};
    for (const [key, allowed] of Object.entries(VALUES)) {
      const value = element.getAttribute('data-aw-' + key.replace(/_/g, '-'));
      if (value === null) continue;
      const pattern = key === 'file_name' ? /^[a-z][a-z0-9_]{0,27}\.pdf$/ : /^[a-z][a-z0-9_]{0,31}$/;
      if (value.length > 32 || !pattern.test(value) || !allowed.includes(value)) return;
      params[key] = value;
    }
    const destination = params.destination_type;
    if (name === 'cta_click' && !['internal', 'external'].includes(destination)) return;
    if (name === 'phone_click' && destination !== 'phone') return;
    if (name === 'email_click' && destination !== 'email') return;
    if (name === 'file_download' && (destination !== 'file' || !params.file_name)) return;
    if (name !== 'file_download' && params.file_name !== undefined) return;
    if (['contact_submit', 'generate_lead'].includes(name) && destination !== 'form') return;
    win.gtag('event', name, params);
  };

  doc.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof win.Element ? event.target : null;
      const element = target?.closest('[data-aw-event]');
      if (!(element instanceof win.HTMLAnchorElement || element instanceof win.HTMLButtonElement)) return;
      const name = element.getAttribute('data-aw-event') ?? '';
      if (!CLICK_EVENTS.has(name)) return;
      if (name !== 'cta_click' && !(element instanceof win.HTMLAnchorElement)) return;
      emit(name, element);
    },
    true
  );

  doc.addEventListener(
    'submit',
    (event) => {
      const form = event.target;
      if (
        !(form instanceof win.HTMLFormElement) ||
        form.getAttribute('data-aw-event') !== 'contact_submit' ||
        !form.checkValidity()
      )
        return;
      emit('contact_submit', form);
    },
    true
  );

  doc.addEventListener('aw:lead-success', (event) => {
    const form = event.target;
    if (!(form instanceof win.HTMLFormElement) || form.getAttribute('data-aw-event') !== 'contact_submit') return;
    emit('generate_lead', form);
  });
}
```

The existing `src/env.d.ts` supplies `Window.awAnalytics`; read it and use its existing type without modifying that core-adjacent file. If the local checker needs a narrower type, keep that type in this client module.

Create `AnalyticsEvents.astro`:

```astro
<script>
  import { installAnalyticsEvents } from './analytics-events';
  installAnalyticsEvents(window);
</script>
```

Import and render `<AnalyticsEvents />` from `GlobalEmbeds.astro`, preserving its explanatory comment except the now-inaccurate "Ships empty" sentence. Processed Astro scripts execute once; the marker also protects repeated explicit installs. No page-load handler is needed because listeners delegate from the persistent document.

- [ ] **Step 3: Add negative runtime cases before considering the bridge complete.**

Append these tests to the same browser test file:

```js
test('all recognized parameter validation is enforced before emission', async (t) => {
  const page = await fixture(t);
  for (const [attribute, value] of [
    ['data-aw-placement', 'private_place'],
    ['data-aw-destination-type', 'phone'],
    ['data-aw-file-name', 'brochure.pdf'],
    ['data-aw-label', 'primary_cta '],
  ]) {
    await page.locator('#cta').evaluate(
      (element, { attribute, value }) => {
        element.setAttribute(attribute, value);
      },
      { attribute, value }
    );
    await page.locator('#cta').click();
    await page.locator('#cta').evaluate((element, attribute) => element.removeAttribute(attribute), attribute);
    await page.locator('#cta').evaluate((element) => {
      element.setAttribute('data-aw-destination-type', 'internal');
      element.setAttribute('data-aw-label', 'primary_cta');
    });
  }
  assert.deepEqual(await page.evaluate(() => window.calls), []);
  await page.evaluate(() => {
    window.awAnalytics = {
      status: () => {
        throw new Error('unavailable');
      },
    };
  });
  await page.locator('#cta').click();
  assert.deepEqual(await page.evaluate(() => window.calls), []);
});

test('submit without success and direct success-page load never confirm a lead', async (t) => {
  const page = await fixture(t);
  await page.locator('input').fill('fixture');
  await page.locator('#submit').click();
  assert.deepEqual(await page.evaluate(() => window.calls.map((call) => call[1])), ['contact_submit']);
  await page.goto(origin + '/thank-you/');
  await page.evaluate(() => {
    window.calls = [];
    window.gtag = (...args) => window.calls.push(args);
    document.querySelector('#ga-init').dataset.id = 'G-TEST';
    document.dispatchEvent(new Event('astro:page-load'));
  });
  assert.deepEqual(await page.evaluate(() => window.calls), []);
});
```

Keep success signaling explicit. Document this exact client integration boundary in the README: after the existing backend integration verifies success, dispatch the following once. Its response parsing/deduplication remains the form integration's responsibility.

```js
form.dispatchEvent(new CustomEvent('aw:lead-success', { bubbles: true }));
```

Document the complete spec event/parameter tables in the README or link to the canonical tables added in Task 4. State that submit means valid attempt, not backend acceptance. A redirect-only form without a confirmed callback has no generate_lead event.

- [ ] **Step 4: Verify and review.**

Run:

```sh
npm run check:astro
npm run build
npm run test:analytics
```

Expected: exact payload checks pass; denied/missing consent sends nothing; invalid form sends nothing; valid submit sends only contact_submit; explicit success sends generate_lead; repeated install and real navigations produce one event per interaction. GA requests are blocked in tests. Commit this task's files with `feat: add tested consent-aware client events`.

## Task 4: Consolidate policy, rubric, and evidence conventions

**Files:** Create `docs/quality-gates.md`. Modify `.prettierignore`, `SETUP.md`, `docs/client-build-rules.md`, `docs/go-live.md`, `docs/golden-workflow.md`, and the client README link if needed.

**Interfaces:** Consume Tasks 1 to 3's actual command, manifest, and event contracts. Produce the four-status rubric and durable review record convention from spec section 5. This documentation-only task does not need invented red tests for strings.

- [ ] **Step 1: Write the canonical policy from the approved spec.**

Use these exact section titles, carrying over the complete corresponding requirements from the spec:

1. Ownership and gate order: full verify command and CI/local split.
2. Lighthouse environment and thresholds: three median runs, all category floors, exact tool pins, runner variability, failed-run diagnosis.
3. Route coverage: quality-routes.json schema, grammar, public/noindex/dev behavior, 404 inventory exclusion, enabled blog coverage, build inventory validation.
4. Visual baseline lifecycle: initialization, six captures per route, inspection, failures, same-commit refresh, diagnostic retention.
5. Agent review rubric and evidence: the table below and the exact storage convention.
6. Analytics taxonomy and validation: complete event and parameter tables, consent/revocation, submit/success distinction, integration example.
7. Exceptions: owner, reason, expiry, follow-up, automation cannot be bypassed.

Use this rubric table as the review record template. The review author fills statuses only after inspecting evidence; blank cells in the reusable template are intentional, not pre-approved results.

```md
| Criterion                                                      | Status | Evidence and finding | Absence reason or exception owner/reason/expiry/follow-up |
| -------------------------------------------------------------- | ------ | -------------------- | --------------------------------------------------------- |
| Hierarchy, reading measure, spacing                            |        |                      |                                                           |
| Responsive layout, overflow, image crops, tap targets          |        |                      |                                                           |
| Dark mode                                                      |        |                      |                                                           |
| Keyboard traversal and visible focus                           |        |                      |                                                           |
| Modal/banner escape and footer cookie settings                 |        |                      |                                                           |
| Heading order, landmarks, labels, form errors                  |        |                      |                                                           |
| 200% zoom, reduced motion, contrast                            |        |                      |                                                           |
| Form privacy notice or required consent                        |        |                      |                                                           |
| Styled success state and confirmed delivery evidence           |        |                      |                                                           |
| Noindex/dev metadata and sitemap exclusion                     |        |                      |                                                           |
| Favicon and OG assets                                          |        |                      |                                                           |
| Consent states, revocation, payloads, submit/success semantics |        |                      |                                                           |
| Screenshot diffs and intended baseline refreshes               |        |                      |                                                           |
| 404 appearance and keyboard use                                |        |                      |                                                           |
```

Specify that every row must be completed as pass/fail/not applicable/exception with evidence. N/A requires the feature to be absent. Fail includes untested or blocked work. Exception records an accepted manual limitation with all four required fields; expired or incomplete exceptions fail. Never label a failed automated check as an exception-based pass.

Use exactly:

```text
docs/reviews/YYYY-MM-DD-<slug>/
  review.md
  evidence/
    commands/<command>.txt
    lighthouse/
    screenshots/
    analytics/events.json
```

Include the source commit and dirty-state note, UTC time, manifest/lockfile hashes, browser/Node/LHCI/OS versions, baseline commit, commands and exit codes. Evidence must be sanitized and committed, linked relatively from review.md. Copy cited ignored diffs and downloaded CI reports into these directories before they disappear.

Add only `docs/reviews/**/evidence/lighthouse/` to `.prettierignore`. Lighthouse HTML and JSON reports are generated evidence and must remain byte-for-byte outputs. The narrow exclusion must not hide authored review Markdown, command logs, screenshots, or analytics evidence from normal checks.

- [ ] **Step 2: Replace duplication with links while preserving local responsibilities.**

Use these sentences at the relevant existing sections:

```md
Complete the [client quality gates](docs/quality-gates.md), then attach the review record and cited evidence before B4 is marked complete.
```

Use that root-relative Markdown link in SETUP.md. In the three docs/ companion files, use `[client quality gates](quality-gates.md)`. Keep Discovery artifacts, client legal/copy approval, launch-only host checks, renderer constraints, and the client-build-rules plan requirements. Remove the obsolete performance-warning language and golden-baselines/routes.json instructions. Do not remove init-client's verbatim SETUP header replacement target.

- [ ] **Step 3: Verify policy directly and check actual contracts.**

Read the rendered Markdown and follow its relative links. Confirm every spec section has a corresponding policy section and no contradictory threshold/status/route/event language remains. Do not add source-grep or documentation-string tests.

Run:

```sh
npx prettier --check docs/quality-gates.md SETUP.md docs/client-build-rules.md docs/go-live.md docs/golden-workflow.md src/components/client/README.md
npm run check:init
node --test tests/quality-routes.test.mjs tests/quality-gates.test.mjs tests/init-client-visual-baseline.test.mjs
```

Expected: formatting and real initialization/configuration contracts pass. Commit these docs with `docs: consolidate quality policy and evidence`.

## Task 5: Run the full gate and complete durable review evidence

**Files:** Create `docs/reviews/2026-09-06-phase-4-quality-gates/review.md` and its cited evidence subdirectories. Change only direct defects introduced by Tasks 1 to 4 and reviewed intentional baseline updates.

**Interfaces:** Consume the canonical process and rendered build. Produce a completed rubric with durable links, recorded exceptions, and observed exit codes.

- [ ] **Step 1: Capture the full verification result in the project.**

Create the review/evidence directories. Run `npm run verify` with stdout/stderr captured to `evidence/commands/verify.txt` and record its actual exit status. When using a shell pipeline, preserve the command's failure with pipefail:

```sh
set -o pipefail
npm run verify 2>&1 | tee docs/reviews/2026-09-06-phase-4-quality-gates/evidence/commands/verify.txt
```

Create directories through the available file tool or mkdir before this command. The file contains observed output, not authored source. Copy the generated `.lighthouseci/` reports byte-for-byte into the Prettier-excluded `evidence/lighthouse/` directory before another run replaces them. Include the environment/hash metadata defined in Task 1. For analytics, export the sanitized exact spy event arrays from the browser run to `evidence/analytics/events.json`, format that authored JSON normally, and retain the browser test command output.

Expected: all automated stages exit zero. If a stage fails, keep its evidence and identify the route and cause. Fix only authorized defects; do not overwrite failures with an assertion that the full command passed.

- [ ] **Step 2: Complete the manual rubric using production preview.**

Inspect every route class and representative client components at 375, 768, and 1440 widths, in light and dark mode. Check forms/navigation by keyboard, focus, labels/errors, 200% zoom, reduced motion, privacy/success states, favicon/OG assets, noindex metadata, sitemap exclusion, and footer cookie settings where present. Inspect enabled blog routes; if the blog is disabled, record its absence, not a fictional passing blog review. Inspect /404 separately.

For noindex/dev classification, inspect the rendered meta robots and generated sitemap contents. The manifest deliberately retains these routes in non-SEO gates and screenshots. An incorrect sitemap is a fail, even if Lighthouse skips SEO for that route.

Store requested or cited captures directly in `evidence/screenshots/`, with route, scheme, viewport, and state in each filename. Copy cited diffs from the ignored diff folder. Record all rubric statuses and findings in review.md. Explain N/A only for absent features; include owner/reason/expiry/follow-up for every exception.

Existing boundary concern to verify: the current sitemap filter in astro.config.ts explicitly excludes dev and configured taxonomy routes, but does not name thank-you. Also, thank-you.astro already imports a widget directly. Do not silently expand this phase into a core sitemap or starter-page rewrite. Record any confirmed failure and obtain scope direction before changing prohibited files.

- [ ] **Step 3: Audit evidence and changed paths.**

Run:

```sh
git diff --check
git diff --check main...HEAD
git diff --name-only main...HEAD
git diff --name-only
git status --short
```

Check committed, uncommitted, and untracked paths. Confirm no prohibited core path and no widget edits. Confirm the review links resolve to committed project files, every criterion has evidence, automation results are reported accurately, and no expired/incomplete exception is treated as approval.

- [ ] **Step 4: Record completion accurately.**

Commit the completed review and cited evidence with `docs: record Phase 4 quality review` only after authorized defects are resolved. A durable record of a blocked review may be committed, but must say blocked and retain its fail rows. Do not describe implementation/release as complete while an automated gate fails or a required manual review remains unresolved.

## Self-review and execution ledger

| Approved improvement                                         | Implemented by                                                              |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 0.90 hard performance, three runs, controlled CI environment | Task 1 configuration and direct assertions                                  |
| Idempotent ClientRouter analytics listeners                  | Task 3 repeated install and real navigation tests                           |
| Valid submit attempt versus confirmed lead                   | Task 3 native validation, submit, and explicit-success tests                |
| Machine-readable value allowlists and strict validation      | Task 3 closed catalogue, length/pattern checks and exact payload assertions |
| Four rubric statuses and complete exceptions                 | Task 4 policy, Task 5 evidence review                                       |
| One checked route manifest for both tools                    | Task 1 inventory, Task 2 screenshot integration                             |
| Durable project evidence paths                               | Task 4 convention, Task 5 recorded artifacts                                |
| Runtime analytics tests                                      | Task 3 browser harness and production mount integration                     |

All created files are named in their task. Shared interfaces are defined before consumers. No art-direction setting is introduced. Test source imports actual implementation; prose is reviewed directly. Full verify becomes runnable after Task 3.

Keep this ledger updated during execution. Finish each in-flight review loop before applying the repository's context-based next-dispatch gate.

| Task | Implementation commit | Spec review | Code review | Evidence / remaining concern |
| ---- | --------------------- | ----------- | ----------- | ---------------------------- |
| 1    | `11402b7`             | compliant   | approved    | Minor: CHANGELOG SEO-scope note (deferred) |
| 2    | `bf6f450`             | compliant   | approved    | golden-workflow.md routes.json ref (fixed in T4) |
| 3    | `da18e1b`             | compliant   | approved    | Minor: success-page spy timing (deferred) |
| 4    | `2d38a55`..`b84209e`   | compliant   | approved (1 fix round) | consolidated policy + links |
| 5    | `b84209e`..`7f679c6`   | compliant   | approved (1 fix round) | review record now PASS after Task 6 sitemap fix; thank-you widget import deferred to TODO.md |
| 6    | `47d2ade`             | compliant   | approved    | authorized scoped astro.config.ts sitemap fix (noindex/dev excluded) |
| final | `a8d06b3`            | -           | PASS (1 fix wave) | +assertSitemapExcludes regression check; 10 review findings applied; 1 standing Lighthouse exception, 1 deferred TODO |
