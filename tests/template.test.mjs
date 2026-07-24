import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { installGithubTemplates } from '../dist/template.js';

const expectedPaths = [
  '.github/workflows/ci.yml',
  '.github/workflows/release-dry-run.yml',
  '.github/workflows/release.yml',
  '.github/labels.json'
];

test('template installation writes every template to an empty target', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-templates-empty-'));

  assert.deepEqual(await installGithubTemplates({ targetRoot: root }), expectedPaths);
  for (const path of expectedPaths) {
    assert.ok((await readFile(join(root, path), 'utf8')).length > 0, `${path} should not be empty`);
  }
});

test('template collisions report every path and leave the target unchanged', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-templates-conflict-'));
  const firstConflict = '.github/workflows/release-dry-run.yml';
  const secondConflict = '.github/labels.json';
  await mkdir(join(root, '.github/workflows'), { recursive: true });
  await writeFile(join(root, firstConflict), 'keep workflow\n');
  await writeFile(join(root, secondConflict), 'keep labels\n');

  await assert.rejects(
    installGithubTemplates({ targetRoot: root }),
    (error) => {
      assert.match(error.message, /refusing to overwrite existing template paths/);
      assert.match(error.message, new RegExp(firstConflict.replaceAll('.', '\\.')));
      assert.match(error.message, new RegExp(secondConflict.replaceAll('.', '\\.')));
      return true;
    }
  );

  assert.equal(await readFile(join(root, firstConflict), 'utf8'), 'keep workflow\n');
  assert.equal(await readFile(join(root, secondConflict), 'utf8'), 'keep labels\n');
  await assert.rejects(readFile(join(root, '.github/workflows/ci.yml'), 'utf8'), { code: 'ENOENT' });
  await assert.rejects(readFile(join(root, '.github/workflows/release.yml'), 'utf8'), { code: 'ENOENT' });
});
