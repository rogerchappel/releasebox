import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseReleaseBoxConfig, type ReleaseBoxConfig } from './config.js';
import { readJson } from './fs.js';

export interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

async function isNonEmptyFile(path: string): Promise<boolean> {
  try {
    const metadata = await stat(path);
    return metadata.isFile() && metadata.size > 0;
  } catch {
    return false;
  }
}

function isNonEmptyCommand(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

interface BinTarget {
  name: string;
  target: unknown;
}

function binTargets(pkgBin: unknown): BinTarget[] {
  if (typeof pkgBin === 'string') return [{ name: 'bin', target: pkgBin }];
  if (!pkgBin || typeof pkgBin !== 'object' || Array.isArray(pkgBin)) return [];
  return Object.entries(pkgBin).map(([name, target]) => ({ name, target }));
}

async function checkBinTarget(root: string, entry: BinTarget): Promise<string | null> {
  if (!isNonEmptyCommand(entry.target)) {
    return `${entry.name}: empty or non-string executable path`;
  }

  const target = entry.target;
  try {
    const metadata = await stat(join(root, target));
    if (!metadata.isFile()) return `${entry.name}: non-regular file ${target}`;
    if (metadata.size === 0) return `${entry.name}: empty file ${target}`;
    return null;
  } catch {
    return `${entry.name}: missing file ${target}`;
  }
}

export async function loadProjectConfig(root: string): Promise<ReleaseBoxConfig | null> {
  const path = join(root, 'releasebox.config.json');
  if (!(await isNonEmptyFile(path))) return null;
  return parseReleaseBoxConfig(await readJson(path));
}

export async function checkNodeCliProject(root: string): Promise<CheckResult[]> {
  const packagePath = join(root, 'package.json');
  if (!(await isNonEmptyFile(packagePath))) {
    return [{ name: 'package.json', ok: false, detail: 'missing or empty regular file: package.json' }];
  }

  const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as Record<string, unknown>;
  const scripts = typeof pkg.scripts === 'object' && pkg.scripts ? pkg.scripts as Record<string, unknown> : {};
  const declaredBinTargets = binTargets(pkg.bin);
  const binFailures = await Promise.all(declaredBinTargets.map((entry) => checkBinTarget(root, entry)));
  const failedBinTargets = binFailures.filter((failure): failure is string => failure !== null);
  const binOk = declaredBinTargets.length > 0 && failedBinTargets.length === 0;
  const binDetail = binOk
    ? JSON.stringify(pkg.bin)
    : failedBinTargets.length > 0
      ? failedBinTargets.join('; ')
      : 'missing or empty package bin executable path';

  return [
    { name: 'npm test script', ok: isNonEmptyCommand(scripts.test), detail: isNonEmptyCommand(scripts.test) ? scripts.test : 'missing or empty scripts.test' },
    { name: 'build script', ok: isNonEmptyCommand(scripts.build), detail: isNonEmptyCommand(scripts.build) ? scripts.build : 'missing or empty scripts.build' },
    { name: 'smoke script', ok: isNonEmptyCommand(scripts.smoke), detail: isNonEmptyCommand(scripts.smoke) ? scripts.smoke : 'missing or empty scripts.smoke' },
    { name: 'bin entry', ok: binOk, detail: binDetail }
  ];
}

export async function checkReadiness(root: string): Promise<CheckResult[]> {
  const config = await loadProjectConfig(root);
  const usesNpm = config?.projectType === 'node-cli' || config?.packageManagers?.includes('npm') || config?.release?.publishNpm === true;
  const base: CheckResult[] = [
    { name: 'releasebox config', ok: Boolean(config), detail: config ? config.projectType : 'missing releasebox.config.json' },
    { name: 'task breakdown', ok: await isNonEmptyFile(join(root, 'docs/TASKS.md')), detail: 'docs/TASKS.md' },
    { name: 'orchestration plan', ok: await isNonEmptyFile(join(root, 'docs/ORCHESTRATION.md')), detail: 'docs/ORCHESTRATION.md' },
    { name: 'dependabot config', ok: await isNonEmptyFile(join(root, '.github/dependabot.yml')), detail: '.github/dependabot.yml' }
  ];

  if (!config || usesNpm) {
    base.splice(1, 0,
      { name: 'ci workflow', ok: await isNonEmptyFile(join(root, '.github/workflows/ci.yml')), detail: '.github/workflows/ci.yml' },
      { name: 'release dry run workflow', ok: await isNonEmptyFile(join(root, '.github/workflows/release-dry-run.yml')), detail: '.github/workflows/release-dry-run.yml' },
    );
  }

  if (config?.release?.createGithubRelease || config?.release?.publishNpm) {
    base.push({
      name: 'release workflow',
      ok: await isNonEmptyFile(join(root, '.github/workflows/release.yml')),
      detail: '.github/workflows/release.yml'
    });
  }

  if (!config || config.projectType === 'node-cli') {
    return [...base, ...(await checkNodeCliProject(root))];
  }

  return base;
}

export function summarize(results: CheckResult[]): string {
  return results.map((result) => `${result.ok ? '✅' : '❌'} ${result.name}: ${result.detail}`).join('\n');
}
