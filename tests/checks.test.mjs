import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkReadiness } from '../dist/checks.js';

test('readiness check reports missing releasebox files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-check-'));
  await writeFile(join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' }, bin: './cli.js' }));
  const results = await checkReadiness(root);
  assert.equal(results.some((result) => result.name === 'releasebox config' && !result.ok), true);
});

test('readiness check accepts basic node cli package metadata', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-check-'));
  await mkdir(join(root, '.github/workflows'), { recursive: true });
  await mkdir(join(root, 'docs'), { recursive: true });
  await writeFile(join(root, '.github/workflows/ci.yml'), 'name: CI\n');
  await writeFile(join(root, '.github/workflows/release-dry-run.yml'), 'name: Release dry run\n');
  await writeFile(join(root, '.github/dependabot.yml'), 'version: 2\n');
  await writeFile(join(root, 'docs/TASKS.md'), '# Tasks\n');
  await writeFile(join(root, 'docs/ORCHESTRATION.md'), '# Orchestration\n');
  await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({
    projectType: 'node-cli',
    release: { createGithubRelease: false, publishNpm: false },
  }));
  await writeFile(join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test', build: 'tsc', smoke: 'node cli.js --help' }, bin: './cli.js' }));

  const results = await checkReadiness(root);
  assert.equal(results.every((result) => result.ok), true);
  assert.equal(results.some((result) => result.name === 'release workflow'), false);
});

for (const release of [
  { createGithubRelease: true, publishNpm: false },
  { createGithubRelease: false, publishNpm: true },
]) {
  test(`readiness check requires a release workflow for ${release.createGithubRelease ? 'GitHub' : 'npm'} publishing`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'releasebox-check-'));
    await mkdir(join(root, '.github/workflows'), { recursive: true });
    await mkdir(join(root, 'docs'), { recursive: true });
    await writeFile(join(root, '.github/workflows/ci.yml'), 'name: CI\n');
    await writeFile(join(root, '.github/workflows/release-dry-run.yml'), 'name: Release dry run\n');
    await writeFile(join(root, '.github/dependabot.yml'), 'version: 2\n');
    await writeFile(join(root, 'docs/TASKS.md'), '# Tasks\n');
    await writeFile(join(root, 'docs/ORCHESTRATION.md'), '# Orchestration\n');
    await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({ projectType: 'node-cli', release }));
    await writeFile(join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test', build: 'tsc', smoke: 'node cli.js --help' }, bin: './cli.js' }));

    const results = await checkReadiness(root);
    assert.deepEqual(
      results.find((result) => result.name === 'release workflow'),
      { name: 'release workflow', ok: false, detail: '.github/workflows/release.yml' },
    );
  });
}
