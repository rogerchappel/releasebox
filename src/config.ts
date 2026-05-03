export type ProjectType = 'node-cli' | 'desktop-app' | 'capacitor-app' | 'library' | 'docs';

export interface ReleaseBoxConfig {
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

export function parseReleaseBoxConfig(input: unknown): ReleaseBoxConfig {
  if (!input || typeof input !== 'object') {
    throw new Error('releasebox config must be a JSON object');
  }

  const record = input as Record<string, unknown>;
  if (typeof record.projectType !== 'string' || !projectTypes.has(record.projectType as ProjectType)) {
    throw new Error('projectType must be one of: node-cli, desktop-app, capacitor-app, library, docs');
  }

  return {
    projectType: record.projectType as ProjectType,
    packageManagers: Array.isArray(record.packageManagers) ? record.packageManagers as ReleaseBoxConfig['packageManagers'] : [],
    smoke: typeof record.smoke === 'object' && record.smoke ? record.smoke as ReleaseBoxConfig['smoke'] : { commands: [] },
    release: typeof record.release === 'object' && record.release ? record.release as ReleaseBoxConfig['release'] : { mode: 'reviewed', createGithubRelease: true }
  };
}

export function defaultConfig(projectType: ProjectType = 'node-cli'): ReleaseBoxConfig {
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
