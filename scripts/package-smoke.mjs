#!/usr/bin/env node
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(process.argv[2] ?? '.');
const tmp = await mkdtemp(join(tmpdir(), 'releasebox-package-smoke-'));

try {
  const packJson = execFileSync('npm', ['pack', '--json'], { cwd: root, encoding: 'utf8' });
  const [pack] = JSON.parse(packJson);
  const tarball = join(root, pack.filename);
  await writeFile(join(tmp, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: {} }, null, 2));
  execFileSync('npm', ['install', tarball], { cwd: tmp, stdio: 'inherit' });
  execFileSync('npx', ['releasebox', '--help'], { cwd: tmp, stdio: 'inherit' });
  execFileSync('npx', ['releasebox', '--version'], { cwd: tmp, stdio: 'inherit' });
  console.log(`package smoke passed for ${basename(tarball)}`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
