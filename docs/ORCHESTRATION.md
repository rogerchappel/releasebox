# ORCHESTRATION: releasebox

## StackForge Scaffold Note

This repo was initially created manually and then corrected to follow the StackForge operating style. That miss is intentional context for future work: ReleaseBox itself must help prevent repos from skipping task docs, orchestration docs, dependency automation, release gates, and visible release automation.

Future repos should be created through StackForge templates once ReleaseBox is integrated there.

## Agent Lane Plan

- **Lane 1: ReleaseBox core CLI** — maintain command surface, config parsing, readiness checks, and template installation.
- **Lane 2: Deterministic release gates** — package install smoke, `npm pack` proof, CI gates, and release dry-runs.
- **Lane 3: Rolling release candidates** — labels, scheduled release checks, and one update-in-place release PR per repo.
- **Lane 4: StackForge integration** — update future OSS CLI scaffolds so ReleaseBox files are emitted by default.
- **Lane 5: Dogfood repos** — apply the release standard to `proofdock`, `lockfilelens`, and `failureseed` first.

## Review Gates

- Work from latest `main` unless using an isolated dogfood branch/worktree.
- Keep commits atomic; prefer one concept per commit.
- Run `npm run release:check` before handoff.
- Run `node bin/releasebox.js check .` before handoff.
- Do not publish to npm, Homebrew, or GitHub Releases without explicit approval.
- AI-generated notes are drafts until deterministic checks pass.

## Dogfood Commit Contract

For each target repo:

1. Add package/release metadata.
2. Add `releasebox.config.json`.
3. Add/update local release gate scripts.
4. Add CI/release dry-run workflows.
5. Add release labels/config where useful.
6. Add packed package install smoke.
7. Add docs and release checklist.
8. Track remaining blockers in the release-candidate PR or docs.

## Integration Notes

- ReleaseBox should be reusable outside Roger's repos, but dogfood Roger's OSS fleet first.
- StackForge should eventually emit ReleaseBox config and docs for new OSS CLI repos.
- Existing repos should receive ReleaseBox in small reviewable PRs, not broad rewrites.
- Publishing defaults stay conservative: dry-run and reviewed release first, real publish later.
