export type ProjectType = 'node-cli' | 'desktop-app' | 'capacitor-app' | 'library' | 'docs';

export interface ReleaseForgeConfig {
  projectType: ProjectType;
  packageManagers?: Array<'npm' | 'homebrew' | 'github-release'>;
  smoke?: {
    commands?: string[][];
  };
  release?: {
    mode?: 'manual' | 'reviewed' | 'tag-gated';
    createGithubRelease?: boolean;
    publishNpm?: boolean;
    updateHomebrew?: boolean;
  };
}

const projectTypes = new Set<ProjectType>(['node-cli', 'desktop-app', 'capacitor-app', 'library', 'docs']);

export function parseReleaseForgeConfig(input: unknown): ReleaseForgeConfig {
  if (!input || typeof input !== 'object') {
    throw new Error('releaseforge config must be a JSON object');
  }

  const record = input as Record<string, unknown>;
  if (typeof record.projectType !== 'string' || !projectTypes.has(record.projectType as ProjectType)) {
    throw new Error('projectType must be one of: node-cli, desktop-app, capacitor-app, library, docs');
  }

  return {
    projectType: record.projectType as ProjectType,
    packageManagers: Array.isArray(record.packageManagers) ? record.packageManagers as ReleaseForgeConfig['packageManagers'] : [],
    smoke: typeof record.smoke === 'object' && record.smoke ? record.smoke as ReleaseForgeConfig['smoke'] : { commands: [] },
    release: typeof record.release === 'object' && record.release ? record.release as ReleaseForgeConfig['release'] : { mode: 'reviewed', createGithubRelease: true }
  };
}

export function defaultConfig(projectType: ProjectType = 'node-cli'): ReleaseForgeConfig {
  return {
    projectType,
    packageManagers: projectType === 'node-cli' ? ['npm', 'github-release'] : ['github-release'],
    smoke: {
      commands: projectType === 'node-cli'
        ? [['npm', 'run', 'smoke'], ['npm', 'pack', '--dry-run']]
        : []
    },
    release: {
      mode: 'reviewed',
      createGithubRelease: true,
      publishNpm: false,
      updateHomebrew: false
    }
  };
}
