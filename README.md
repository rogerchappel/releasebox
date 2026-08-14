# releasebox

Continuous release readiness tooling for OSS CLIs and apps.

`releasebox` helps small OSS projects move toward continuous release without pretending that publishing is safe before the basics work. It gives each repo a repeatable path from strict CI to package smoke tests, release dry-runs, deterministic release notes, and reviewed tag-based publishing.

## Why

Many OSS tools have code, tests, and READMEs, but still fail the real user path:

1. install the package or artifact
2. run the CLI/app
3. complete a realistic workflow
4. produce a release with clear notes
5. prove the published artifact works

`releasebox` makes those checks explicit and public.

## Install

```sh
npm install -D https://github.com/rogerchappel/releasebox/releases/download/v0.1.0/releasebox-0.1.0.tgz
```

ReleaseBox is currently distributed through GitHub Releases, not the npm
registry. The command above installs the reviewed v0.1.0 release artifact. The
commands below use `npx --no-install` to invoke that project-local binary
without falling back to a registry download.

The v0.1.0 artifact supports `node-cli` initialization and installs its npm CI,
release dry-run, and release workflows. The additional project types and
type-aware workflow selection documented below are available on the current
development branch and are not part of the downloadable v0.1.0 artifact.

For local development in this repo:

```sh
npm install
npm run build
node bin/releasebox.js --help
```

## Usage

Create config:

```sh
npx --no-install releasebox init --type node-cli
```

Initialization never overwrites `releasebox.config.json`. If that file already
exists—even if it is malformed—ReleaseBox exits with an error and preserves its
contents. Remove or rename the existing file only when you deliberately want to
create a fresh config.

Install GitHub workflows:

```sh
npx --no-install releasebox install-templates
```

Template installation reads `releasebox.config.json` and never overwrites existing
files. ReleaseBox checks every selected destination before writing anything; if one or more collide, it lists every
conflicting path and leaves the target unchanged.

Projects configured with the `npm` package manager (or `release.publishNpm`) get
the npm CI, release dry-run, and release workflows. Other project types omit the
npm-only CI and dry-run workflows. When `release.createGithubRelease` is enabled,
they instead get a release workflow that uses Git and GitHub CLI only; when both
release flags are disabled, no release workflow is installed. Labels are installed
for every project type.

Check release readiness:

```sh
npx --no-install releasebox check
```

When `releasebox.config.json` enables `release.createGithubRelease` or
`release.publishNpm`, readiness also requires `.github/workflows/release.yml`.
Configurations with both publishing flags set to `false` do not require that
workflow. CI and release dry-run workflows are required only when npm is configured,
matching the templates selected by `install-templates`.
For `node-cli` projects, the package `bin` field must declare at least one target
that resolves relative to `package.json` to an existing, non-empty regular file.

The configuration schema is:

```json
{
  "projectType": "node-cli",
  "packageManagers": ["npm", "homebrew", "github-release"],
  "smoke": { "commands": [["npm", "test"], ["npm", "pack", "--dry-run"]] },
  "release": {
    "mode": "reviewed",
    "createGithubRelease": true,
    "publishNpm": false,
    "updateHomebrew": false
  }
}
```

`projectType` is required and accepts the values listed below. The other fields
are optional. Each package manager must be `npm`, `homebrew`, or
`github-release`; each smoke command must be a non-empty array of non-empty
string arguments; and release mode must be `manual`, `reviewed`, or
`tag-gated`. All three publishing flags are booleans. `releasebox check` reports
a field-specific error and exits nonzero when the file violates this schema;
it does not report readiness from malformed configuration.

`check`, `notes`, and `install-templates` accept at most one optional path.
`init` accepts only the optional `--type <type>` pair. Unknown options, extra
operands, and missing or misplaced option values are rejected with a usage
diagnostic and exit status 2 before ReleaseBox reads or writes project files.

## Project types

Current development builds accept all five project types. The reviewed v0.1.0
artifact supports only the documented `node-cli` interface above.

- `node-cli` — npm package with CLI smoke and packed artifact checks
- `desktop-app` — packaged desktop release profile
- `capacitor-app` — web build plus native compile/package profile
- `library` — tests, docs, and changelog without CLI assumptions
- `docs` — validation and release notes for resource/template repos

## Release philosophy

Automation should be strict where machines are good:

- test/build/lint gates
- package install smoke tests
- deterministic e2e fixtures
- release dry-runs
- artifact generation

AI assistance is useful for:

- summarising PRs since the last release
- finding test gaps
- explaining CI failures

Publishing remains review-gated by default.

## Limitations

`releasebox` checks release readiness signals; it does not publish packages,
create tags, or replace maintainer review. Generated notes and workflow
templates should be reviewed against the repo's actual release policy before
they are used for a public release.

## Dogfood plan

Initial targets should be real Roger OSS repos with different shapes:

- a mature Node CLI
- a fresh generated Node CLI
- a workflow/tooling repo that needs release notes and package proof

Each dogfood PR should be atomic: config, workflows, smoke script, package smoke, docs, and fixes as separate commits.


## Project operating files

ReleaseBox follows the StackForge repo operating style:

- `docs/TASKS.md` tracks build slices and acceptance criteria.
- `docs/ORCHESTRATION.md` tracks agent lanes, review gates, and dogfood rollout rules.
- `.github/dependabot.yml` keeps npm and GitHub Actions dependencies moving.
- Release dry-run workflows make release readiness visible before publishing.

## First dogfood targets

The first rollout batch should be:

1. `proofdock` — TypeScript CLI with clean build/test/smoke/pack baseline.
2. `lockfilelens` — TypeScript CLI with richer fixture coverage and executable build step.
3. `failureseed` — small JavaScript CLI that proves the standard is not TypeScript-only.

Per repo, keep the audit trail granular:

1. package metadata
2. local release gate
3. CI release-readiness workflow
4. release dry-run workflow
5. labels for release automation
6. package install smoke
7. realistic e2e fixture
8. docs/checklist
