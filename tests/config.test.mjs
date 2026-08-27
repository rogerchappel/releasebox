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

test('config parser rejects unknown keys with their full field path', () => {
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', projectTypo: 'library' }), /unknown config key: projectTypo/);
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', smoke: { command: [['npm', 'test']] } }), /unknown config key: smoke\.command/);
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', release: { publishNmp: true } }), /unknown config key: release\.publishNmp/);
});

test('config parser preserves valid partial and explicit configuration', () => {
  assert.deepEqual(parseReleaseBoxConfig({ projectType: 'library' }), { projectType: 'library', packageManagers: [], smoke: { commands: [] }, release: { mode: 'reviewed', createGithubRelease: true } });
  assert.deepEqual(parseReleaseBoxConfig({ projectType: 'node-cli', packageManagers: ['npm'], smoke: { commands: [['npm', 'test']] }, release: { mode: 'manual', publishNpm: false } }).smoke.commands, [['npm', 'test']]);
});

test('config parser validates packageManagers', () => {
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', packageManagers: 'npm' }), /packageManagers must be an array/);
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', packageManagers: ['other'] }), /packageManagers\[0\]/);
});

test('config parser validates smoke commands and argv strings', () => {
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', smoke: null }), /smoke must be an object/);
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', smoke: { commands: 'npm test' } }), /smoke.commands must be an array/);
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', smoke: { commands: ['npm'] } }), /smoke.commands\[0\]/);
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', smoke: { commands: [[]] } }), /smoke.commands\[0\]/);
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', smoke: { commands: [['npm', '']] } }), /smoke.commands\[0\]\[1\]/);
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', smoke: { commands: [['npm', 1]] } }), /smoke.commands\[0\]\[1\]/);
});

test('config parser validates release mode and publishing flags', () => {
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', release: [] }), /release must be an object/);
  assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', release: { mode: 'automatic' } }), /release.mode/);
  for (const [field, value] of [['createGithubRelease', 0], ['publishNpm', null], ['updateHomebrew', 'sometimes']]) assert.throws(() => parseReleaseBoxConfig({ projectType: 'node-cli', release: { [field]: value } }), new RegExp(`release\\.${field}`));
});
