import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
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
