import { cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export interface InstallTemplatesOptions {
  targetRoot: string;
}

export async function installGithubTemplates(options: InstallTemplatesOptions): Promise<string[]> {
  const templatesRoot = join(projectRoot, 'templates/github');
  const installed = [
    ['workflows/ci.yml', '.github/workflows/ci.yml'],
    ['workflows/release-dry-run.yml', '.github/workflows/release-dry-run.yml'],
    ['workflows/release.yml', '.github/workflows/release.yml'],
    ['labels.json', '.github/labels.json']
  ];

  const written: string[] = [];
  for (const [from, to] of installed) {
    const destination = join(options.targetRoot, to);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(templatesRoot, from), destination, { force: false, errorOnExist: true });
    written.push(to);
  }

  return written;
}
