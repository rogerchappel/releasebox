#!/usr/bin/env node
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const source = process.argv[2] ?? '.';
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
  const releasebox = (args) => execFileSync('npx', ['--no-install', 'releasebox', ...args], {
    cwd: tmp,
    stdio: 'inherit'
  });
  releasebox(['--help']);
  releasebox(['--version']);
  releasebox(['init', '--type', 'node-cli']);
  releasebox(['install-templates']);
  releasebox(['check']);
  console.log(`package smoke passed for ${isRemoteArtifact ? source : basename(packedFilename)}`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
