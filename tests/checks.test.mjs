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
  await writeFile(join(root, 'cli.js'), '#!/usr/bin/env node\n');

  const results = await checkReadiness(root);
  assert.equal(results.every((result) => result.ok), true);
  assert.equal(results.some((result) => result.name === 'release workflow'), false);
});

for (const bin of ['./cli.js', { releasebox: './cli.js' }]) {
  test(`readiness check accepts an existing non-empty package bin target: ${JSON.stringify(bin)}`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'releasebox-check-'));
    await writeFile(join(root, 'package.json'), JSON.stringify({ bin }));
    await writeFile(join(root, 'cli.js'), '#!/usr/bin/env node\n');

    const results = await checkReadiness(root);
    assert.equal(results.find((result) => result.name === 'bin entry')?.ok, true);
  });
}

test('readiness check rejects and names a missing package bin target', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-check-'));
  await writeFile(join(root, 'package.json'), JSON.stringify({ bin: { sample: './missing-cli.js' } }));

  const results = await checkReadiness(root);
  const binResult = results.find((result) => result.name === 'bin entry');
  assert.equal(binResult?.ok, false);
  assert.match(binResult?.detail ?? '', /\.\/missing-cli\.js/);
});

test('readiness check rejects an empty package bin target', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-check-'));
  await writeFile(join(root, 'package.json'), JSON.stringify({ bin: './cli.js' }));
  await writeFile(join(root, 'cli.js'), '');

  const results = await checkReadiness(root);
  assert.equal(results.find((result) => result.name === 'bin entry')?.ok, false);
});

test('readiness check rejects directories in place of required files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-check-'));
  await mkdir(join(root, '.github/workflows/ci.yml'), { recursive: true });
  await mkdir(join(root, '.github/workflows/release-dry-run.yml'));
  await mkdir(join(root, '.github/dependabot.yml'));
  await mkdir(join(root, 'docs/TASKS.md'), { recursive: true });
  await mkdir(join(root, 'docs/ORCHESTRATION.md'));
  await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({
    projectType: 'node-cli',
    release: { createGithubRelease: false, publishNpm: false },
  }));
  await writeFile(join(root, 'package.json'), JSON.stringify({
    scripts: { test: 'node --test', build: 'tsc', smoke: 'node cli.js --help' },
    bin: './cli.js',
  }));

  const results = await checkReadiness(root);
  for (const name of ['ci workflow', 'release dry run workflow', 'task breakdown', 'orchestration plan', 'dependabot config']) {
    assert.equal(results.find((result) => result.name === name)?.ok, false, name);
  }
});

test('readiness check rejects empty required files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-check-'));
  await mkdir(join(root, '.github/workflows'), { recursive: true });
  await mkdir(join(root, 'docs'), { recursive: true });
  await writeFile(join(root, '.github/workflows/ci.yml'), '');
  await writeFile(join(root, '.github/workflows/release-dry-run.yml'), '');
  await writeFile(join(root, '.github/dependabot.yml'), '');
  await writeFile(join(root, 'docs/TASKS.md'), '');
  await writeFile(join(root, 'docs/ORCHESTRATION.md'), '');
  await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({
    projectType: 'node-cli',
    release: { createGithubRelease: false, publishNpm: false },
  }));
  await writeFile(join(root, 'package.json'), JSON.stringify({
    scripts: { test: 'node --test', build: 'tsc', smoke: 'node cli.js --help' },
    bin: './cli.js',
  }));

  const results = await checkReadiness(root);
  assert.equal(results.filter((result) => result.detail.endsWith('.yml') || result.detail.endsWith('.md')).every((result) => !result.ok), true);
});

for (const invalidMetadata of [
  { scripts: { test: '', build: '  ', smoke: '\t' }, bin: {} },
  { scripts: { test: '', build: '', smoke: '' }, bin: '' },
  { scripts: { test: '', build: '', smoke: '' }, bin: { releasebox: '' } },
]) {
  test(`readiness check rejects empty commands and bin metadata: ${JSON.stringify(invalidMetadata.bin)}`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'releasebox-check-'));
    await writeFile(join(root, 'package.json'), JSON.stringify(invalidMetadata));

    const results = await checkReadiness(root);
    for (const name of ['npm test script', 'build script', 'smoke script', 'bin entry']) {
      assert.equal(results.find((result) => result.name === name)?.ok, false, name);
    }
  });
}

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
