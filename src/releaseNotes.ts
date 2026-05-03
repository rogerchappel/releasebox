export interface CommitSummaryInput {
  since?: string;
  commits: string[];
}

export function renderReleaseNotes(input: CommitSummaryInput): string {
  const title = input.since ? `Release candidate since ${input.since}` : 'Release candidate';
  const lines = [`# ${title}`, '', '## Changes', ''];

  if (input.commits.length === 0) {
    lines.push('- No commits found.');
  } else {
    for (const commit of input.commits) {
      lines.push(`- ${commit}`);
    }
  }

  lines.push('', '## Verification', '', '- [ ] CI passed', '- [ ] Package smoke passed', '- [ ] Release dry-run passed');
  return `${lines.join('\n')}\n`;
}
