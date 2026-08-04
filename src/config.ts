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

export const projectTypes: readonly ProjectType[] = ['node-cli', 'desktop-app', 'capacitor-app', 'library', 'docs'];
const projectTypeSet = new Set<ProjectType>(projectTypes);
const packageManagers = ['npm', 'homebrew', 'github-release'] as const;
const packageManagerSet = new Set<string>(packageManagers);
const releaseModes = ['manual', 'reviewed', 'tag-gated'] as const;
const releaseModeSet = new Set<string>(releaseModes);

export function isProjectType(input: string): input is ProjectType {
  return projectTypeSet.has(input as ProjectType);
}

export function parseReleaseBoxConfig(input: unknown): ReleaseBoxConfig {
  if (!input || typeof input !== 'object') {
    throw new Error('releasebox config must be a JSON object');
  }

  const record = input as Record<string, unknown>;
  if (typeof record.projectType !== 'string' || !isProjectType(record.projectType)) {
    throw new Error(`projectType must be one of: ${projectTypes.join(', ')}`);
  }

  if (record.packageManagers !== undefined && !Array.isArray(record.packageManagers)) throw new Error('packageManagers must be an array');
  if (Array.isArray(record.packageManagers)) record.packageManagers.forEach((manager, index) => {
    if (typeof manager !== 'string' || !packageManagerSet.has(manager)) throw new Error(`packageManagers[${index}] must be one of: ${packageManagers.join(', ')}`);
  });

  if (record.smoke !== undefined && (!record.smoke || typeof record.smoke !== 'object' || Array.isArray(record.smoke))) throw new Error('smoke must be an object');
  const smoke = record.smoke as Record<string, unknown> | undefined;
  if (smoke?.commands !== undefined && !Array.isArray(smoke.commands)) throw new Error('smoke.commands must be an array');
  if (Array.isArray(smoke?.commands)) smoke.commands.forEach((command, commandIndex) => {
    if (!Array.isArray(command) || command.length === 0) throw new Error(`smoke.commands[${commandIndex}] must be a non-empty argv array`);
    command.forEach((argument, argumentIndex) => {
      if (typeof argument !== 'string' || argument.length === 0) throw new Error(`smoke.commands[${commandIndex}][${argumentIndex}] must be a non-empty string`);
    });
  });

  if (record.release !== undefined && (!record.release || typeof record.release !== 'object' || Array.isArray(record.release))) throw new Error('release must be an object');
  const release = record.release as Record<string, unknown> | undefined;
  if (release?.mode !== undefined && (typeof release.mode !== 'string' || !releaseModeSet.has(release.mode))) throw new Error(`release.mode must be one of: ${releaseModes.join(', ')}`);
  for (const field of ['createGithubRelease', 'publishNpm', 'updateHomebrew'] as const) {
    if (release?.[field] !== undefined && typeof release[field] !== 'boolean') throw new Error(`release.${field} must be a boolean`);
  }

  return {
    projectType: record.projectType,
    packageManagers: record.packageManagers as ReleaseBoxConfig['packageManagers'] ?? [],
    smoke: record.smoke as ReleaseBoxConfig['smoke'] ?? { commands: [] },
    release: record.release as ReleaseBoxConfig['release'] ?? { mode: 'reviewed', createGithubRelease: true }
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
