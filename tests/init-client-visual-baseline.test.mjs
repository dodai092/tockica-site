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
