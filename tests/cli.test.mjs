import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
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
