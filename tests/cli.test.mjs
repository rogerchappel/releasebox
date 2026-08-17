import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const executable = join(projectRoot, 'bin/releasebox.js');
const projectTypes = ['node-cli', 'desktop-app', 'capacitor-app', 'library', 'docs'];

function run(args, cwd) {
  return spawnSync(process.execPath, [executable, ...args], { cwd, encoding: 'utf8' });
}

test('check rejects malformed nested config instead of reporting readiness', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-invalid-config-'));
  await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({ projectType: 'node-cli', release: { publishNpm: null } }));
  const result = run(['check', root], projectRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /release\.publishNpm must be a boolean/);
  assert.doesNotMatch(result.stdout, /releasebox config/);
});

test('init accepts every advertised project type', async () => {
  for (const projectType of projectTypes) {
    const root = await mkdtemp(join(tmpdir(), `releasebox-${projectType}-`));
    const result = run(['init', '--type', projectType], root);

    assert.equal(result.status, 0, result.stderr);
    const config = JSON.parse(await readFile(join(root, 'releasebox.config.json'), 'utf8'));
    assert.equal(config.projectType, projectType);
  }
});

test('init preserves an existing config without regard to its contents', async () => {
  for (const contents of [
    '{"projectType":"docs","marker":"keep-me"}',
    '{ malformed config',
  ]) {
    const root = await mkdtemp(join(tmpdir(), 'releasebox-existing-config-'));
    const configPath = join(root, 'releasebox.config.json');
    await writeFile(configPath, contents);

    const result = run(['init', '--type', 'node-cli'], root);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /releasebox\.config\.json already exists/);
    assert.equal(await readFile(configPath, 'utf8'), contents);
  }
});

test('init rejects an unsupported project type before writing config', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-invalid-type-'));
  const result = run(['init', '--type', 'nonsense'], root);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /unsupported project type "nonsense"/);
  await assert.rejects(readFile(join(root, 'releasebox.config.json'), 'utf8'), { code: 'ENOENT' });
});

test('init rejects --type without a value before writing config', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-missing-type-'));
  const result = run(['init', '--type'], root);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /--type requires one of/);
  await assert.rejects(readFile(join(root, 'releasebox.config.json'), 'utf8'), { code: 'ENOENT' });
});

test('init rejects unknown, extra, and misplaced arguments before reading config', async () => {
  for (const args of [
    ['init', '--bogus'],
    ['init', 'node-cli'],
    ['init', '--type', 'node-cli', 'extra'],
    ['init', 'extra', '--type', 'node-cli'],
  ]) {
    const root = await mkdtemp(join(tmpdir(), 'releasebox-invalid-init-'));
    const result = run(args, root);

    assert.equal(result.status, 2, `${args.join(' ')}: ${result.stderr}`);
    assert.match(result.stderr, /Usage: releasebox init/);
    await assert.rejects(access(join(root, 'releasebox.config.json')), { code: 'ENOENT' });
  }
});

test('path commands accept one optional path', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-path-commands-'));
  await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({ projectType: 'docs' }));

  assert.notEqual(run(['check', root], projectRoot).status, 2);
  assert.notEqual(run(['notes', root], projectRoot).status, 2);
  assert.equal(run(['install-templates', root], projectRoot).status, 0);
});

test('generated projects install only executable workflow command sets', async () => {
  for (const projectType of projectTypes) {
    const root = await mkdtemp(join(tmpdir(), `releasebox-generated-${projectType}-`));
    assert.equal(run(['init', '--type', projectType], root).status, 0);
    const installed = run(['install-templates'], root);
    assert.equal(installed.status, 0, installed.stderr);

    const workflowRoot = join(root, '.github/workflows');
    if (projectType === 'node-cli') {
      for (const name of ['ci.yml', 'release-dry-run.yml', 'release.yml']) {
        assert.match(await readFile(join(workflowRoot, name), 'utf8'), /npm ci/);
      }
    } else {
      await assert.rejects(access(join(workflowRoot, 'ci.yml')), { code: 'ENOENT' });
      await assert.rejects(access(join(workflowRoot, 'release-dry-run.yml')), { code: 'ENOENT' });
      assert.doesNotMatch(await readFile(join(workflowRoot, 'release.yml'), 'utf8'), /npm /);
    }
  }
});

test('path commands reject options and extra operands before side effects', async () => {
  for (const command of ['check', 'notes', 'install-templates']) {
    for (const tail of [['--bogus'], ['one', 'two']]) {
      const root = await mkdtemp(join(tmpdir(), `releasebox-invalid-${command}-`));
      const result = run([command, ...tail], root);

      assert.equal(result.status, 2, `${command} ${tail.join(' ')}: ${result.stderr}`);
      assert.match(result.stderr, new RegExp(`Usage: releasebox ${command}`));
      if (command === 'install-templates') {
        await assert.rejects(access(join(root, '.github')), { code: 'ENOENT' });
      }
    }
  }
});

test('check names the missing release workflow when publishing is configured', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-publishing-check-'));
  await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({
    projectType: 'docs',
    release: { createGithubRelease: true, publishNpm: false },
  }));

  const result = run(['check', root], projectRoot);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /❌ release workflow: \.github\/workflows\/release\.yml/);
});

test('check exits nonzero and names a missing package bin target', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-missing-bin-'));
  await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({
    projectType: 'node-cli',
    release: { createGithubRelease: false, publishNpm: false },
  }));
  await writeFile(join(root, 'package.json'), JSON.stringify({
    scripts: { test: 'node --test', build: 'tsc', smoke: 'node cli.js --help' },
    bin: { sample: './missing-cli.js' },
  }));

  const result = run(['check', root], projectRoot);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /❌ bin entry: .*\.\/missing-cli\.js/);
});

test('check exits nonzero and names every invalid target in a mixed multi-bin package', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-mixed-bin-'));
  await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({
    projectType: 'node-cli',
    release: { createGithubRelease: false, publishNpm: false },
  }));
  await writeFile(join(root, 'package.json'), JSON.stringify({
    scripts: { test: 'node --test', build: 'tsc', smoke: 'node good.js --help' },
    bin: { good: './good.js', missing: './missing.js', empty: './empty.js' },
  }));
  await writeFile(join(root, 'good.js'), '#!/usr/bin/env node\n');
  await writeFile(join(root, 'empty.js'), '');

  const result = run(['check', root], projectRoot);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /missing: missing file \.\/missing\.js/);
  assert.match(result.stdout, /empty: empty file \.\/empty\.js/);
});

test('check exits nonzero with field-specific diagnostics for unusable readiness inputs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-unusable-inputs-'));
  for (const path of [
    '.github/workflows/ci.yml',
    '.github/workflows/release-dry-run.yml',
    '.github/dependabot.yml',
    'docs/TASKS.md',
    'docs/ORCHESTRATION.md',
  ]) {
    await mkdir(join(root, path), { recursive: true });
  }
  await writeFile(join(root, 'releasebox.config.json'), JSON.stringify({
    projectType: 'node-cli',
    release: { createGithubRelease: false, publishNpm: false },
  }));
  await writeFile(join(root, 'package.json'), JSON.stringify({
    scripts: { test: '', build: '', smoke: '' },
    bin: {},
  }));

  const result = run(['check', root], projectRoot);

  assert.equal(result.status, 1);
  for (const diagnostic of [
    '❌ ci workflow: .github/workflows/ci.yml',
    '❌ release dry run workflow: .github/workflows/release-dry-run.yml',
    '❌ task breakdown: docs/TASKS.md',
    '❌ orchestration plan: docs/ORCHESTRATION.md',
    '❌ dependabot config: .github/dependabot.yml',
    '❌ npm test script: missing or empty scripts.test',
    '❌ build script: missing or empty scripts.build',
    '❌ smoke script: missing or empty scripts.smoke',
    '❌ bin entry: missing or empty package bin executable path',
  ]) {
    assert.match(result.stdout, new RegExp(diagnostic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
