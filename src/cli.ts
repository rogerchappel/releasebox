import { cwd, exit } from 'node:process';
import { resolve } from 'node:path';
import { defaultConfig, isProjectType, projectTypes } from './config.js';
import { createJson } from './fs.js';
import { checkReadiness, summarize } from './checks.js';
import { installGithubTemplates } from './template.js';
import { recentCommits } from './git.js';
import { renderReleaseNotes } from './releaseNotes.js';

const version = '0.1.0';

function help(): string {
  return `releasebox ${version}

Continuous release readiness tooling for OSS CLIs and apps.

Usage:
  releasebox init [--type <node-cli|desktop-app|capacitor-app|library|docs>]
  releasebox check [path]
  releasebox install-templates [path]
  releasebox notes [path]
  releasebox --help
  releasebox --version

Init creates releasebox.config.json and refuses to overwrite an existing file.
`;
}

function usageError(message: string, usage: string): number {
  console.error(`${message}\nUsage: ${usage}`);
  return 2;
}

export async function main(args = process.argv.slice(2)): Promise<number> {
  if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
    console.log(help());
    return 0;
  }

  if (args.length === 1 && args[0] === '--version') {
    console.log(version);
    return 0;
  }

  const [command] = args;
  if (command === 'init') {
    if (args.length === 2 && args[1] === '--type') {
      return usageError(`--type requires one of: ${projectTypes.join(', ')}`, 'releasebox init [--type <type>]');
    }
    if (args.length !== 1 && !(args.length === 3 && args[1] === '--type')) {
      return usageError('invalid arguments for init', 'releasebox init [--type <type>]');
    }
    const type = args[2] ?? 'node-cli';
    if (!isProjectType(type)) {
      return usageError(
        `unsupported project type "${type}"; expected one of: ${projectTypes.join(', ')}`,
        'releasebox init [--type <type>]',
      );
    }
    try {
      await createJson(resolve(cwd(), 'releasebox.config.json'), defaultConfig(type));
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        console.error('releasebox.config.json already exists; remove it before initializing');
        return 1;
      }
      throw error;
    }
    console.log(`created releasebox.config.json for ${type}`);
    return 0;
  }

  if (command === 'check') {
    if (args.length > 2 || args[1]?.startsWith('-')) {
      return usageError('invalid arguments for check', 'releasebox check [path]');
    }
    const root = resolve(cwd(), args[1] ?? '.');
    const results = await checkReadiness(root);
    console.log(summarize(results));
    return results.every((result) => result.ok) ? 0 : 1;
  }

  if (command === 'install-templates') {
    if (args.length > 2 || args[1]?.startsWith('-')) {
      return usageError('invalid arguments for install-templates', 'releasebox install-templates [path]');
    }
    const root = resolve(cwd(), args[1] ?? '.');
    const written = await installGithubTemplates({ targetRoot: root });
    console.log(written.map((path) => `created ${path}`).join('\n'));
    return 0;
  }

  if (command === 'notes') {
    if (args.length > 2 || args[1]?.startsWith('-')) {
      return usageError('invalid arguments for notes', 'releasebox notes [path]');
    }
    const root = resolve(cwd(), args[1] ?? '.');
    const result = await recentCommits(root);
    console.log(renderReleaseNotes(result));
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
