import assert from 'node:assert/strict';
import test from 'node:test';
import { renderReleaseNotes } from '../dist/index.js';

test('release notes include OpenClaw-style sections and verification checklist', () => {
  const notes = renderReleaseNotes({ since: 'v0.1.0', commits: ['abc1234 feat(cli): add thing'] });
  assert.match(notes, /Release candidate since v0.1.0/);
  assert.match(notes, /### Highlights/);
  assert.match(notes, /- Cli: Add thing\./);
  assert.match(notes, /### Changes/);
  assert.match(notes, /- Cli: Add thing\. \(abc1234\)/);
  assert.match(notes, /Package smoke passed/);
  assert.match(notes, /### Artifacts/);
});

test('release notes produce flat deterministic change bullets', () => {
  const notes = renderReleaseNotes({
    commits: [
      '1111111 docs: update usage',
      '2222222 fix(dry-run): repair dry run',
      '3333333 ci: add release workflow',
      '4444444 chore: refresh metadata',
    ],
  });
  assert.match(notes, /- Dry Run: Repair dry run\. \(2222222\)/);
  assert.match(notes, /- CI\/release: Add release workflow\. \(3333333\)/);
  assert.match(notes, /- Docs: Update usage\. \(1111111\)/);
  assert.match(notes, /- Maintenance: Refresh metadata\. \(4444444\)/);
  assert.ok(notes.indexOf('Dry Run') < notes.indexOf('CI/release'));
  assert.ok(notes.indexOf('CI/release') < notes.indexOf('Docs'));
});
