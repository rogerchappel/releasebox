import assert from 'node:assert/strict';
import test from 'node:test';
import { renderReleaseNotes } from '../dist/index.js';

test('release notes include OpenClaw-style sections and verification checklist', () => {
  const notes = renderReleaseNotes({ since: 'v0.1.0', commits: ['abc1234 feat: add thing'] });
  assert.match(notes, /Release candidate since v0.1.0/);
  assert.match(notes, /## Highlights/);
  assert.match(notes, /## Changes/);
  assert.match(notes, /### Features/);
  assert.match(notes, /abc1234 feat: add thing/);
  assert.match(notes, /Package smoke passed/);
  assert.match(notes, /## Artifacts/);
});

test('release notes group commits deterministically', () => {
  const notes = renderReleaseNotes({
    commits: [
      '1111111 docs: update usage',
      '2222222 fix: repair dry run',
      '3333333 ci: add release workflow',
      '4444444 chore: refresh metadata',
    ],
  });
  assert.match(notes, /### Fixes[\s\S]*2222222 fix: repair dry run/);
  assert.match(notes, /### CI and release[\s\S]*3333333 ci: add release workflow/);
  assert.match(notes, /### Documentation[\s\S]*1111111 docs: update usage/);
  assert.match(notes, /### Maintenance[\s\S]*4444444 chore: refresh metadata/);
});
