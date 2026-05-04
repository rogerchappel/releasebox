export interface CommitSummaryInput {
  since?: string;
  commits: string[];
}

type ChangeGroup = 'Features' | 'Fixes' | 'CI and release' | 'Documentation' | 'Maintenance';

const groupOrder: ChangeGroup[] = ['Features', 'Fixes', 'CI and release', 'Documentation', 'Maintenance'];

function commitSubject(commit: string): string {
  return commit.replace(/^[a-f0-9]{7,40}\s+/i, '').trim();
}

function classifyCommit(commit: string): ChangeGroup {
  const subject = commitSubject(commit).toLowerCase();
  if (subject.startsWith('feat')) return 'Features';
  if (subject.startsWith('fix')) return 'Fixes';
  if (subject.startsWith('ci') || subject.includes('release') || subject.includes('dependabot')) return 'CI and release';
  if (subject.startsWith('docs')) return 'Documentation';
  return 'Maintenance';
}

function highlightFromCommit(commit: string): string {
  const subject = commitSubject(commit)
    .replace(/^(feat|fix|docs|ci|chore|test)(\([^)]*\))?:\s*/i, '')
    .replace(/\.$/, '');
  return subject.charAt(0).toUpperCase() + subject.slice(1);
}

export function renderReleaseNotes(input: CommitSummaryInput): string {
  const title = input.since ? `Release candidate since ${input.since}` : 'Release candidate';
  const lines = [`# ${title}`, '', '## Highlights', ''];
  const highlightCommits = input.commits.filter((commit) => ['Features', 'Fixes', 'CI and release'].includes(classifyCommit(commit))).slice(0, 5);

  if (highlightCommits.length === 0) {
    lines.push('- No user-facing highlights detected from commit history.');
  } else {
    for (const commit of highlightCommits) {
      lines.push(`- ${highlightFromCommit(commit)}.`);
    }
  }

  lines.push('', '## Changes', '');

  if (input.commits.length === 0) {
    lines.push('- No commits found.');
  } else {
    const grouped = new Map<ChangeGroup, string[]>();
    for (const commit of input.commits) {
      const group = classifyCommit(commit);
      grouped.set(group, [...(grouped.get(group) ?? []), commit]);
    }

    for (const group of groupOrder) {
      const commits = grouped.get(group);
      if (!commits || commits.length === 0) continue;
      lines.push(`### ${group}`, '');
      for (const commit of commits) {
        lines.push(`- ${commit}`);
      }
      lines.push('');
    }
  }

  lines.push('## Verification', '', '- [ ] CI passed', '- [ ] Package smoke passed', '- [ ] Release dry-run passed');
  lines.push('', '## Artifacts', '', '- [ ] npm package tarball reviewed', '- [ ] GitHub release artifact reviewed');
  return `${lines.join('\n')}\n`;
}
