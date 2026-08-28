import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPairs = [
  ['CI', '.github/workflows/ci.yml', 'templates/github/workflows/ci.yml'],
  ['release dry run', '.github/workflows/release-dry-run.yml', 'templates/github/workflows/release-dry-run.yml'],
];

for (const [name, repositoryPath, templatePath] of workflowPairs) {
  test(`${name} runs the complete release gate with read-only permissions`, async () => {
    const [workflow, template] = await Promise.all([
      readFile(new URL(`../${repositoryPath}`, import.meta.url), 'utf8'),
      readFile(new URL(`../${templatePath}`, import.meta.url), 'utf8'),
    ]);

    assert.equal(template, workflow, `${templatePath} must match ${repositoryPath}`);
    assert.match(workflow, /^permissions:\n  contents: read$/m);
    assert.equal(workflow.match(/run: npm run release:check/g)?.length, 1);

    for (const partialGate of [
      'run: npm run build --if-present',
      'run: npm test',
      'run: npm run smoke --if-present',
      'run: npm pack --dry-run',
    ]) {
      assert.doesNotMatch(workflow, new RegExp(partialGate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });
}

test('release dry run watches every input to release validation and packaging', async () => {
  const workflow = await readFile(new URL('../.github/workflows/release-dry-run.yml', import.meta.url), 'utf8');
  for (const path of [
    'src/**', 'bin/**', 'scripts/**', 'tests/**', 'templates/**', 'docs/**',
    'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md',
    'releasebox.config.json', 'package.json', 'package-lock.json', 'tsconfig.json',
    '.github/workflows/**',
  ]) {
    assert.match(workflow, new RegExp(`^      - ${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  }
});

test('the complete release gate retains every required validation stage', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const releaseCheck = packageJson.scripts['release:check'];
  for (const command of [
    'npm run lint', 'npm test', 'npm run smoke', 'npm run package:smoke',
    'npm run artifact:smoke', 'npm run distribution:check', 'npm pack --dry-run',
  ]) {
    assert.match(releaseCheck, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
