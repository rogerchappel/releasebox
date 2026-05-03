import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseReleaseBoxConfig, type ReleaseBoxConfig } from './config.js';
import { readJson } from './fs.js';

export interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function loadProjectConfig(root: string): Promise<ReleaseBoxConfig | null> {
  const path = join(root, 'releasebox.config.json');
  if (!(await exists(path))) return null;
  return parseReleaseBoxConfig(await readJson(path));
}

export async function checkNodeCliProject(root: string): Promise<CheckResult[]> {
  const packagePath = join(root, 'package.json');
  if (!(await exists(packagePath))) {
    return [{ name: 'package.json', ok: false, detail: 'missing package.json' }];
  }

  const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as Record<string, unknown>;
  const scripts = typeof pkg.scripts === 'object' && pkg.scripts ? pkg.scripts as Record<string, unknown> : {};

  return [
    { name: 'npm test script', ok: typeof scripts.test === 'string', detail: scripts.test ? String(scripts.test) : 'missing scripts.test' },
    { name: 'build script', ok: typeof scripts.build === 'string', detail: scripts.build ? String(scripts.build) : 'missing scripts.build' },
    { name: 'smoke script', ok: typeof scripts.smoke === 'string', detail: scripts.smoke ? String(scripts.smoke) : 'missing scripts.smoke' },
    { name: 'bin entry', ok: typeof pkg.bin === 'object' || typeof pkg.bin === 'string', detail: pkg.bin ? JSON.stringify(pkg.bin) : 'missing package bin' }
  ];
}

export async function checkReadiness(root: string): Promise<CheckResult[]> {
  const config = await loadProjectConfig(root);
  const base: CheckResult[] = [
    { name: 'releasebox config', ok: Boolean(config), detail: config ? config.projectType : 'missing releasebox.config.json' },
    { name: 'ci workflow', ok: await exists(join(root, '.github/workflows/ci.yml')), detail: '.github/workflows/ci.yml' },
    { name: 'release dry run workflow', ok: await exists(join(root, '.github/workflows/release-dry-run.yml')), detail: '.github/workflows/release-dry-run.yml' },
    { name: 'release readiness issue template', ok: await exists(join(root, '.github/ISSUE_TEMPLATE/release-readiness.md')), detail: '.github/ISSUE_TEMPLATE/release-readiness.md' }
  ];

  if (!config || config.projectType === 'node-cli') {
    return [...base, ...(await checkNodeCliProject(root))];
  }

  return base;
}

export function summarize(results: CheckResult[]): string {
  return results.map((result) => `${result.ok ? '✅' : '❌'} ${result.name}: ${result.detail}`).join('\n');
}
