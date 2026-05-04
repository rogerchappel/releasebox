import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export interface RecentCommitsResult {
  since?: string;
  commits: string[];
  contributors: string[];
}

async function git(root: string, args: string[]): Promise<string> {
  const { stdout } = await exec('git', args, { cwd: root });
  return stdout.trim();
}

async function hasTagPointingAtHead(root: string): Promise<boolean> {
  try {
    return (await git(root, ['tag', '--points-at', 'HEAD'])).length > 0;
  } catch {
    return false;
  }
}

async function latestReachableTag(root: string): Promise<string | undefined> {
  const ref = (await hasTagPointingAtHead(root)) ? 'HEAD^' : 'HEAD';
  try {
    return await git(root, ['describe', '--tags', '--abbrev=0', ref]);
  } catch {
    return undefined;
  }
}

function parseContributor(line: string): string | undefined {
  const trimmed = line.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/^(.*?)\s+<([^>]+)>$/);
  const name = (match?.[1] ?? trimmed).trim();
  const email = match?.[2]?.trim();
  const noreplyLogin = email?.match(/(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i)?.[1];
  const contributor = noreplyLogin ? `@${noreplyLogin}` : name;
  return /\[bot\]$/.test(contributor) ? undefined : contributor;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export async function recentCommits(root: string, maxCount = 20): Promise<RecentCommitsResult> {
  const since = await latestReachableTag(root);
  const range = since ? [`${since}..HEAD`] : [`--max-count=${maxCount}`];
  const stdout = await git(root, ['log', ...range, '--pretty=format:%h %s']);
  const contributorStdout = await git(root, ['log', ...range, '--pretty=format:%aN <%aE>']);
  return {
    since,
    commits: stdout.split('\n').map((line: string) => line.trim()).filter(Boolean),
    contributors: uniqueSorted(contributorStdout.split('\n').map(parseContributor).filter((value): value is string => Boolean(value))),
  };
}

export async function recentCommitSubjects(root: string, maxCount = 20): Promise<string[]> {
  return (await recentCommits(root, maxCount)).commits;
}
