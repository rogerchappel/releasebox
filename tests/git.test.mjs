import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import { recentCommits } from '../dist/index.js';

const exec = promisify(execFile);

async function git(root, args) {
  await exec('git', args, { cwd: root });
}

async function commit(root, name, message) {
  await writeFile(join(root, name), message);
  await git(root, ['add', name]);
  await git(root, ['commit', '-m', message]);
}

test('recent commits ignore a tag pointing at HEAD when choosing the previous release range', async () => {
  const root = await mkdtemp(join(tmpdir(), 'releasebox-git-'));
  await git(root, ['init']);
  await git(root, ['config', 'user.email', 'releasebox@example.com']);
  await git(root, ['config', 'user.name', 'ReleaseBox Test']);

  await commit(root, 'one.txt', 'feat: first release');
  await git(root, ['tag', 'v0.1.0']);

  const result = await recentCommits(root);
  assert.equal(result.since, undefined);
  assert.equal(result.commits.length, 1);
  assert.match(result.commits[0], /feat: first release/);
  assert.deepEqual(result.contributors, ['ReleaseBox Test']);

  await commit(root, 'two.txt', 'fix: second release');
  await git(root, ['tag', 'v0.2.0']);

  const second = await recentCommits(root);
  assert.equal(second.since, 'v0.1.0');
  assert.equal(second.commits.length, 1);
  assert.match(second.commits[0], /fix: second release/);
  assert.deepEqual(second.contributors, ['ReleaseBox Test']);
});
