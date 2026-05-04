import assert from 'node:assert/strict';
import test from 'node:test';
import { renderReleaseNotes } from '../dist/index.js';

test('release notes include OpenClaw-style sections', () => {
  const notes = renderReleaseNotes({ since: 'v0.1.0', commits: ['abc1234 feat(cli): add thing'] });
  assert.match(notes, /Release candidate since v0.1.0/);
  assert.match(notes, /### Highlights/);
  assert.match(notes, /- Cli: Add thing\./);
  assert.match(notes, /### Changes/);
  assert.match(notes, /- Cli: Add thing\. \(abc1234\)/);
  assert.match(notes, /### Contributors/);
  assert.match(notes, /- No contributors detected from commit history\./);
  assert.doesNotMatch(notes, /### Verification/);
  assert.doesNotMatch(notes, /### Artifacts/);
});

test('release notes produce flat deterministic change bullets', () => {
  const notes = renderReleaseNotes({
    commits: [
      '1111111 docs: update usage',
      '2222222 fix(dry-run): repair dry run',
      '3333333 ci: add release workflow',
      '4444444 chore: refresh metadata',
      '5555555 chore(deps-dev): bump typescript from 5.9.3 to 6.0.3',
      '6666666 Merge pull request #4 from rogerchappel/dependabot/npm_and_yarn/typescript-6.0.3',
    ],
    contributors: ['@rogerchappel', '@dependabot[bot]', '@rogerchappel', 'Ada Lovelace'],
  });
  assert.match(notes, /- Dry Run: Repair dry run\. \(2222222\)/);
  assert.match(notes, /- CI\/release: Add release workflow\. \(3333333\)/);
  assert.match(notes, /- Docs: Update usage\. \(1111111\)/);
  assert.match(notes, /- Maintenance: Refresh metadata\. \(4444444\)/);
  assert.match(notes, /- Dependencies: Bump typescript from 5\.9\.3 to 6\.0\.3\. \(5555555\)/);
  assert.doesNotMatch(notes, /rogerchappel\/dependabot/);
  assert.doesNotMatch(notes, /Merge pull request/);
  assert.ok(notes.indexOf('Dry Run') < notes.indexOf('CI/release'));
  assert.ok(notes.indexOf('CI/release') < notes.indexOf('Docs'));
  assert.ok(notes.indexOf('Docs') < notes.indexOf('Dependencies'));
  assert.match(notes, /### Contributors/);
  assert.match(notes, /- Ada Lovelace/);
  assert.match(notes, /- \[@rogerchappel\]\(https:\/\/github\.com\/rogerchappel\)/);
});
