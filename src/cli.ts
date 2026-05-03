import { cwd, exit } from 'node:process';
import { resolve } from 'node:path';
import { defaultConfig, type ProjectType } from './config.js';
import { writeJson } from './fs.js';
import { checkReadiness, summarize } from './checks.js';
import { installGithubTemplates } from './template.js';
import { recentCommitSubjects } from './git.js';
import { renderReleaseNotes } from './releaseNotes.js';

const version = '0.1.0';

function help(): string {
  return `releasebox ${version}

Issue-driven release readiness tooling for OSS CLIs and apps.

Usage:
  releasebox init [--type node-cli]
  releasebox check [path]
  releasebox install-templates [path]
  releasebox notes [path]
  releasebox --help
  releasebox --version
`;
}

function readFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

export async function main(args = process.argv.slice(2)): Promise<number> {
  if (args.includes('--help') || args.length === 0) {
    console.log(help());
    return 0;
  }

  if (args.includes('--version')) {
    console.log(version);
    return 0;
  }

  const [command] = args;
  if (command === 'init') {
    const type = (readFlag(args, '--type') ?? 'node-cli') as ProjectType;
    await writeJson(resolve(cwd(), 'releasebox.config.json'), defaultConfig(type));
    console.log(`created releasebox.config.json for ${type}`);
    return 0;
  }

  if (command === 'check') {
    const root = resolve(cwd(), args[1] ?? '.');
    const results = await checkReadiness(root);
    console.log(summarize(results));
    return results.every((result) => result.ok) ? 0 : 1;
  }

  if (command === 'install-templates') {
    const root = resolve(cwd(), args[1] ?? '.');
    const written = await installGithubTemplates({ targetRoot: root });
    console.log(written.map((path) => `created ${path}`).join('\n'));
    return 0;
  }

  if (command === 'notes') {
    const root = resolve(cwd(), args[1] ?? '.');
    const commits = await recentCommitSubjects(root);
    console.log(renderReleaseNotes({ commits }));
    return 0;
  }

  console.error(`unknown command: ${command}`);
  console.error(help());
  return 2;
}

main().then((code) => {
  exitCode(code);
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  exitCode(1);
});

function exitCode(code: number): void {
  exit(code);
}
