#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [readme, configText, workflow] = await Promise.all([
  readFile(new URL('../README.md', import.meta.url), 'utf8'),
  readFile(new URL('../releasebox.config.json', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8'),
]);
const config = JSON.parse(configText);
const documentsBareRegistryInstall = /^npm install(?: --save-dev| -D)? releasebox\s*$/m.test(readme);
const workflowPublishesToNpm = /\bnpm publish\b/.test(workflow);

if (config.release?.publishNpm === false && !workflowPublishesToNpm) {
  assert.equal(
    documentsBareRegistryInstall,
    false,
    'README must not claim a registry install when npm publishing is disabled',
  );
}

assert.match(
  readme,
  /npm install -D https:\/\/github\.com\/rogerchappel\/releasebox\/releases\/download\/v0\.1\.0\/releasebox-0\.1\.0\.tgz/,
  'README must document the available v0.1.0 GitHub release artifact',
);
assert.deepEqual(config.packageManagers, ['github-release']);
assert.equal(config.release?.createGithubRelease, true);
assert.equal(config.release?.publishNpm, false);
assert.equal(workflowPublishesToNpm, false);

console.log('distribution contract is GitHub Releases only');
