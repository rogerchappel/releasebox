import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export async function recentCommitSubjects(root: string, maxCount = 20): Promise<string[]> {
  const { stdout } = await exec('git', ['log', `--max-count=${maxCount}`, '--pretty=format:%h %s'], { cwd: root });
  return stdout.split('\n').map((line) => line.trim()).filter(Boolean);
}
