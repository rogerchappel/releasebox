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
  await mkdir(join(root, '.github/ISSUE_TEMPLATE'), { recursive: true });
  await writeFile(join(root, '.github/workflows/ci.yml'), 'name: CI\n');
  await writeFile(join(root, '.github/workflows/release-dry-run.yml'), 'name: Release dry run\n');
  await writeFile(join(root, '.github/ISSUE_TEMPLATE/release-readiness.md'), '# Release readiness\n');
  await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({ projectType: 'node-cli' }));
  await writeFile(join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test', build: 'tsc', smoke: 'node cli.js --help' }, bin: './cli.js' }));

  const results = await checkReadiness(root);
  assert.equal(results.every((result) => result.ok), true);
});
