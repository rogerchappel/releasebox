import { cp, lstat, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectConfig } from './checks.js';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export interface InstallTemplatesOptions {
  targetRoot: string;
}

export async function installGithubTemplates(options: InstallTemplatesOptions): Promise<string[]> {
  const templatesRoot = join(projectRoot, 'templates/github');
  const config = await loadProjectConfig(options.targetRoot);
  if (!config) throw new Error('releasebox.config.json is required before installing templates');

  const usesNpm = config.projectType === 'node-cli' || config.packageManagers?.includes('npm') || config.release?.publishNpm === true;
  const createsRelease = config.release?.createGithubRelease === true || config.release?.publishNpm === true;
  const installed: string[][] = [['labels.json', '.github/labels.json']];
  if (usesNpm) {
    installed.unshift(
      ['workflows/ci.yml', '.github/workflows/ci.yml'],
      ['workflows/release-dry-run.yml', '.github/workflows/release-dry-run.yml'],
    );
  }
  if (createsRelease) {
    installed.splice(installed.length - 1, 0, [
      usesNpm ? 'workflows/release.yml' : 'workflows/release-github.yml',
      '.github/workflows/release.yml',
    ]);
  }

  const conflicts = (
    await Promise.all(installed.map(async ([, to]) => {
      try {
        await lstat(join(options.targetRoot, to));
        return to;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return undefined;
        }
        throw error;
      }
    }))
  ).filter((path): path is string => path !== undefined);

  if (conflicts.length > 0) {
    throw new Error(`refusing to overwrite existing template paths:\n${conflicts.map((path) => `- ${path}`).join('\n')}`);
  }

  const written: string[] = [];
  for (const [from, to] of installed) {
    const destination = join(options.targetRoot, to);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(templatesRoot, from), destination, { force: false, errorOnExist: true });
    written.push(to);
  }

  return written;
}
