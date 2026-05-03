import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultConfig, parseReleaseBoxConfig } from '../dist/index.js';

test('default node cli config is reviewed and does not publish', () => {
  const config = defaultConfig('node-cli');
  assert.equal(config.projectType, 'node-cli');
  assert.equal(config.release.publishNpm, false);
  assert.equal(config.release.mode, 'reviewed');
});

test('config parser rejects unknown project types', () => {
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'banana' }), /projectType/);
});
