# Release candidate readiness

Status: **READY**

Generated: 2026-05-05 21:27:39 UTC

## Scope

Release-candidate readiness pass for `rogerchappel/releasebox` against `origin/main`.

## Local verification

- npm ci:pass
- release:check:pass
- validate.sh:skipped(not present)
- releasebox:pass

## Blockers

- None found in local readiness gates.

## ReleaseBox check / command log

```text
\n===== npm ci =====
+ npm ci --prefix /Users/roger/Developer/my-opensource/_worktrees/releasebox-release-candidate-readiness

added 3 packages, and audited 4 packages in 383ms

found 0 vulnerabilities
EXIT_CODE=0
\n===== npm run release:check =====
+ npm --prefix /Users/roger/Developer/my-opensource/_worktrees/releasebox-release-candidate-readiness run release:check

> releasebox@0.1.0 release:check
> npm run lint && npm test && npm run smoke && npm run package:smoke && npm pack --dry-run


> releasebox@0.1.0 lint
> tsc -p tsconfig.json --noEmit


> releasebox@0.1.0 test
> npm run build && node --test tests/*.test.mjs


> releasebox@0.1.0 build
> tsc -p tsconfig.json

✔ readiness check reports missing releasebox files (4.101334ms)
✔ readiness check accepts basic node cli package metadata (5.047375ms)
✔ default node cli config is reviewed and does not publish (0.5965ms)
✔ config parser rejects unknown project types (0.179542ms)
✔ recent commits ignore a tag pointing at HEAD when choosing the previous release range (188.434166ms)
✔ release notes include OpenClaw-style sections (1.046292ms)
✔ release notes produce flat deterministic change bullets (6.200125ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 261.838458

> releasebox@0.1.0 smoke
> npm run build && node bin/releasebox.js --help && node bin/releasebox.js --version


> releasebox@0.1.0 build
> tsc -p tsconfig.json

releasebox 0.1.0

Continuous release readiness tooling for OSS CLIs and apps.

Usage:
  releasebox init [--type node-cli]
  releasebox check [path]
  releasebox install-templates [path]
  releasebox notes [path]
  releasebox --help
  releasebox --version

0.1.0

> releasebox@0.1.0 package:smoke
> npm run build && node scripts/package-smoke.mjs .


> releasebox@0.1.0 build
> tsc -p tsconfig.json


> releasebox@0.1.0 prepack
> npm run build


> releasebox@0.1.0 build
> tsc -p tsconfig.json


added 1 package, and audited 2 packages in 454ms

found 0 vulnerabilities
releasebox 0.1.0

Continuous release readiness tooling for OSS CLIs and apps.

Usage:
  releasebox init [--type node-cli]
  releasebox check [path]
  releasebox install-templates [path]
  releasebox notes [path]
  releasebox --help
  releasebox --version

0.1.0
package smoke passed for releasebox-0.1.0.tgz

> releasebox@0.1.0 prepack
> npm run build


> releasebox@0.1.0 build
> tsc -p tsconfig.json

npm notice
npm notice package: releasebox@0.1.0
npm notice Tarball Contents
npm notice 1.1kB LICENSE
npm notice 3.0kB README.md
npm notice 45B bin/releasebox.js
npm notice 460B dist/checks.d.ts
npm notice 2.8kB dist/checks.js
npm notice 3.2kB dist/checks.js.map
npm notice 64B dist/cli.d.ts
npm notice 2.4kB dist/cli.js
npm notice 2.9kB dist/cli.js.map
npm notice 624B dist/config.d.ts
npm notice 1.5kB dist/config.js
npm notice 1.5kB dist/config.js.map
npm notice 146B dist/fs.d.ts
npm notice 400B dist/fs.js
npm notice 579B dist/fs.js.map
npm notice 312B dist/git.d.ts
npm notice 2.1kB dist/git.js
npm notice 2.6kB dist/git.js.map
npm notice 368B dist/index.d.ts
npm notice 221B dist/index.js
npm notice 251B dist/index.js.map
npm notice 191B dist/releaseNotes.d.ts
npm notice 4.5kB dist/releaseNotes.js
npm notice 5.1kB dist/releaseNotes.js.map
npm notice 170B dist/template.d.ts
npm notice 984B dist/template.js
npm notice 1.1kB dist/template.js.map
npm notice 1.4kB package.json
npm notice 920B templates/github/labels.json
npm notice 417B templates/github/workflows/ci.yml
npm notice 1.1kB templates/github/workflows/release-dry-run.yml
npm notice 1.0kB templates/github/workflows/release.yml
npm notice Tarball Details
npm notice name: releasebox
npm notice version: 0.1.0
npm notice filename: releasebox-0.1.0.tgz
npm notice package size: 12.7 kB
npm notice unpacked size: 43.4 kB
npm notice shasum: 434faaec085d143a93bd339cc88f233127e743a7
npm notice integrity: sha512-h+JKkY+ycO8WC[...]zODetysc1HMDw==
npm notice total files: 32
npm notice
releasebox-0.1.0.tgz
EXIT_CODE=0
\n===== releasebox check =====
+ node /Users/roger/Developer/my-opensource/releasebox/bin/releasebox.js check /Users/roger/Developer/my-opensource/_worktrees/releasebox-release-candidate-readiness
✅ releasebox config: node-cli
✅ ci workflow: .github/workflows/ci.yml
✅ release dry run workflow: .github/workflows/release-dry-run.yml
✅ task breakdown: docs/TASKS.md
✅ orchestration plan: docs/ORCHESTRATION.md
✅ dependabot config: .github/dependabot.yml
✅ npm test script: npm run build && node --test tests/*.test.mjs
✅ build script: tsc -p tsconfig.json
✅ smoke script: npm run build && node bin/releasebox.js --help && node bin/releasebox.js --version
✅ bin entry: {"releasebox":"./bin/releasebox.js"}
EXIT_CODE=0
```
