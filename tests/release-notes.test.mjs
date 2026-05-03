import assert from 'node:assert/strict';
import test from 'node:test';
import { renderReleaseNotes } from '../dist/index.js';

test('release notes include commits and verification checklist', () => {
  const notes = renderReleaseNotes({ since: 'v0.1.0', commits: ['abc123 feat: add thing'] });
  assert.match(notes, /Release candidate since v0.1.0/);
  assert.match(notes, /abc123 feat: add thing/);
  assert.match(notes, /Package smoke passed/);
});
