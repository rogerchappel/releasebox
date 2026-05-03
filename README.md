# releaseforge

Issue-driven release readiness tooling for OSS CLIs and apps.

`releaseforge` helps small OSS projects move toward continuous release without pretending that publishing is safe before the basics work. It gives each repo a repeatable path from GitHub issue tracking to strict CI, package smoke tests, release dry-runs, and reviewed release notes.

## Why

Many OSS tools have code, tests, and READMEs, but still fail the real user path:

1. install the package or artifact
2. run the CLI/app
3. complete a realistic workflow
4. produce a release with clear notes
5. prove the published artifact works

`releaseforge` makes those checks explicit and public.

## Install

```sh
npm install -D releaseforge
```

For local development in this repo:

```sh
npm install
npm run build
node bin/releaseforge.js --help
```

## Usage

Create config:

```sh
releaseforge init --type node-cli
```

Install GitHub workflows and issue templates:

```sh
releaseforge install-templates
```

Check release readiness:

```sh
releaseforge check
```

## Project types

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
- drafting release-candidate issues
- finding test gaps
- explaining CI failures

Publishing remains review-gated by default.

## Dogfood plan

Initial targets should be real Roger OSS repos with different shapes:

- a mature Node CLI
- a fresh generated Node CLI
- a workflow/tooling repo that needs release notes and package proof

Each dogfood PR should be atomic: config, workflows, issue templates, smoke script, package smoke, docs, and fixes as separate commits.
