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

test('Lighthouse has one exact route assertion and one run per route', () => {
  const rows = routeTools.loadQualityRoutes();
  assert.deepEqual(
    config.ci.collect.url,
    rows.map((row) => row.path)
  );
  assert.equal(config.ci.collect.numberOfRuns, 1);
  assert.equal(config.ci.collect.chromePath, chromium.executablePath());
  assert.equal(config.ci.collect.settings.throttlingMethod, 'simulate');
  assert.equal(config.ci.collect.settings.formFactor, 'mobile');
  assert.equal(config.ci.collect.settings.chromeFlags, '--no-sandbox');
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
    'npm run test:meta',
    'npm run test:baselines',
    'npm run test:contrast',
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
    'npm run build && npm run check && npm run test:quality && npm run test:routes && npm run test:analytics && npm run test:meta && npm run test:baselines && npm run test:contrast && npm run test:links && npm run test:lhci && npm run screenshot:check'
  );
});
