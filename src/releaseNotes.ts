export interface CommitSummaryInput {
  since?: string;
  commits: string[];
}

type ChangeGroup = 'Features' | 'Fixes' | 'CI and release' | 'Documentation' | 'Maintenance';

interface ParsedCommit {
  raw: string;
  hash?: string;
  type?: string;
  scope?: string;
  summary: string;
  group: ChangeGroup;
}

const groupRank: Record<ChangeGroup, number> = {
  Features: 0,
  Fixes: 1,
  'CI and release': 2,
  Documentation: 3,
  Maintenance: 4,
};

const typeAreas: Record<string, string> = {
  feat: 'Features',
  fix: 'Fixes',
  ci: 'CI/release',
  docs: 'Docs',
  chore: 'Maintenance',
  test: 'Tests',
  refactor: 'Maintenance',
  perf: 'Performance',
  build: 'Build',
};

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function finishSentence(value: string): string {
  const trimmed = value.trim();
  return /[.!?)]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function humanArea(value: string): string {
  return value
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseCommit(commit: string): ParsedCommit {
  const trimmed = commit.trim();
  const hashMatch = trimmed.match(/^([a-f0-9]{7,40})\s+(.+)$/i);
  const hash = hashMatch?.[1];
  const subject = hashMatch?.[2] ?? trimmed;
  const conventional = subject.match(/^([a-z]+)(?:\(([^)]+)\))?!?:\s*(.+)$/i);
  const type = conventional?.[1]?.toLowerCase();
  const scope = conventional?.[2];
  const summary = conventional?.[3] ?? subject;
  const normalized = subject.toLowerCase();

  let group: ChangeGroup = 'Maintenance';
  if (type === 'feat') group = 'Features';
  else if (type === 'fix') group = 'Fixes';
  else if (type === 'ci' || type === 'build' || normalized.includes('release') || normalized.includes('dependabot')) group = 'CI and release';
  else if (type === 'docs') group = 'Documentation';

  return { raw: trimmed, hash, type, scope, summary, group };
}

function formatChange(commit: ParsedCommit): string {
  const area = commit.scope ? humanArea(commit.scope) : typeAreas[commit.type ?? ''] ?? commit.group;
  const suffix = commit.hash ? ` (${commit.hash.slice(0, 7)})` : '';
  return `- ${area}: ${finishSentence(sentenceCase(commit.summary))}${suffix}`;
}

function formatHighlight(commit: ParsedCommit): string {
  const area = commit.scope ? humanArea(commit.scope) : typeAreas[commit.type ?? ''] ?? commit.group;
  return `- ${area}: ${finishSentence(sentenceCase(commit.summary))}`;
}

export function renderReleaseNotes(input: CommitSummaryInput): string {
  const parsed = input.commits.map(parseCommit).filter((commit) => commit.raw.length > 0);
  const title = input.since ? `Release candidate since ${input.since}` : 'Release candidate';
  const lines = [`# ${title}`, '', '### Highlights', ''];
  const highlightCommits = parsed.filter((commit) => ['Features', 'Fixes', 'CI and release'].includes(commit.group)).slice(0, 5);

  if (highlightCommits.length === 0) {
    lines.push('- No user-facing highlights detected from commit history.');
  } else {
    for (const commit of highlightCommits) {
      lines.push(formatHighlight(commit));
    }
  }

  lines.push('', '### Changes', '');

  if (parsed.length === 0) {
    lines.push('- No commits found.');
  } else {
    const sorted = [...parsed].sort((a, b) => groupRank[a.group] - groupRank[b.group]);
    for (const commit of sorted) {
      lines.push(formatChange(commit));
    }
  }
  return `${lines.join('\n')}\n`;
}
