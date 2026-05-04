import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export interface RecentCommitsResult {
  since?: string;
  commits: string[];
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

export async function recentCommits(root: string, maxCount = 20): Promise<RecentCommitsResult> {
  const since = await latestReachableTag(root);
  const range = since ? [`${since}..HEAD`] : [`--max-count=${maxCount}`];
  const stdout = await git(root, ['log', ...range, '--pretty=format:%h %s']);
  return {
    since,
    commits: stdout.split('\n').map((line: string) => line.trim()).filter(Boolean),
  };
}

export async function recentCommitSubjects(root: string, maxCount = 20): Promise<string[]> {
  return (await recentCommits(root, maxCount)).commits;
}
