#!/usr/bin/env node
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const source = process.argv[2] ?? '.';
const expectedTypes = (process.argv[3] ?? 'node-cli,desktop-app,capacitor-app,library,docs').split(',');
const workflowContract = process.argv[4] ?? 'type-aware';
if (!['type-aware', 'npm-only'].includes(workflowContract)) {
  throw new Error(`unknown package smoke workflow contract: ${workflowContract}`);
}
const isRemoteArtifact = /^https:\/\//.test(source);
const root = isRemoteArtifact ? null : resolve(source);
const tmp = await mkdtemp(join(tmpdir(), 'releasebox-package-smoke-'));

try {
  let installSource = source;
  let packedFilename;
  if (root) {
    const packJson = execFileSync('npm', ['pack', '--json'], { cwd: root, encoding: 'utf8' });
    const [pack] = JSON.parse(packJson);
    packedFilename = pack.filename;
    installSource = join(root, packedFilename);
  }
  await writeFile(join(tmp, 'package.json'), JSON.stringify({
    private: true,
    type: 'module',
    bin: './cli.js',
    scripts: {
      build: 'node --check cli.js',
      smoke: 'node cli.js --help',
      test: 'node --test'
    }
  }, null, 2));
  await writeFile(join(tmp, 'cli.js'), '#!/usr/bin/env node\n');
  await mkdir(join(tmp, 'docs'));
  await writeFile(join(tmp, 'docs/TASKS.md'), '# Tasks\n');
  await writeFile(join(tmp, 'docs/ORCHESTRATION.md'), '# Orchestration\n');
  await mkdir(join(tmp, '.github'));
  await writeFile(join(tmp, '.github/dependabot.yml'), 'version: 2\n');

  execFileSync('npm', ['install', '--save-dev', installSource], { cwd: tmp, stdio: 'inherit' });
  const releasebox = (args, options = {}) => execFileSync('npx', ['--no-install', 'releasebox', ...args], {
    cwd: tmp,
    encoding: 'utf8',
    ...options
  });
  const help = releasebox(['--help']);
  releasebox(['--version']);
  const advertisedTypes = help.match(/releasebox init \[--type (?:<)?([^>\]]+)(?:>)?\]/)?.[1].split('|');
  if (JSON.stringify(advertisedTypes) !== JSON.stringify(expectedTypes)) {
    throw new Error(
      `package compatibility mismatch: init advertises ${advertisedTypes?.join(', ') ?? 'no project types'}; ` +
      `expected ${expectedTypes.join(', ')} for ${isRemoteArtifact ? source : basename(packedFilename)}`
    );
  }

  for (const projectType of expectedTypes) {
    await rm(join(tmp, 'releasebox.config.json'), { force: true });
    await rm(join(tmp, '.github/workflows'), { recursive: true, force: true });
    await rm(join(tmp, '.github/labels.json'), { force: true });
    releasebox(['init', '--type', projectType]);
    const config = JSON.parse(await readFile(join(tmp, 'releasebox.config.json'), 'utf8'));
    if (config.projectType !== projectType) {
      throw new Error(`package compatibility mismatch: init --type ${projectType} generated projectType ${config.projectType}`);
    }
    releasebox(['install-templates']);

    const expectedWorkflows = workflowContract === 'npm-only' || projectType === 'node-cli'
      ? ['ci.yml', 'release-dry-run.yml', 'release.yml']
      : ['release.yml'];
    for (const name of ['ci.yml', 'release-dry-run.yml', 'release.yml']) {
      const exists = await access(join(tmp, '.github/workflows', name)).then(() => true, () => false);
      if (exists !== expectedWorkflows.includes(name)) {
        throw new Error(
          `package compatibility mismatch: ${projectType} ${exists ? 'generated' : 'did not generate'} ${name}; ` +
          `expected workflows: ${expectedWorkflows.join(', ')}`
        );
      }
    }
  }

  await rm(join(tmp, 'releasebox.config.json'), { force: true });
  await rm(join(tmp, '.github/workflows'), { recursive: true, force: true });
  await rm(join(tmp, '.github/labels.json'), { force: true });
  releasebox(['init', '--type', 'node-cli']);
  releasebox(['install-templates']);
  releasebox(['check'], { stdio: 'inherit' });
  console.log(`package smoke passed for ${isRemoteArtifact ? source : basename(packedFilename)}`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
