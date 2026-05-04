# TASKS: releasebox

## Build Slices

1. **StackForge-aligned repo foundation**
   - Keep the repo public, auditable, and release-automation friendly.
   - Maintain atomic commits for each meaningful change.
   - Keep publish automation disabled until explicitly reviewed.
   - Add Dependabot, clear task docs, and orchestration docs.

2. **CLI foundation**
   - Provide `releasebox --help` and `releasebox --version`.
   - Provide `releasebox init` for creating project-local release config.
   - Provide `releasebox check` for deterministic release-readiness checks.
   - Provide `releasebox install-templates` for GitHub workflow rollout.

3. **Release configuration model**
   - Support project profiles: `node-cli`, `desktop-app`, `capacitor-app`, `library`, and `docs`.
   - Keep package publishing off by default.
   - Represent GitHub release, npm, and Homebrew readiness independently.

4. **GitHub release operating system**
   - Ship GitHub Actions templates for CI, release dry-run, and tag-gated release.
   - Ship labels/config for release, e2e, packaging, npm, Homebrew, blocked, and AI-assisted work.

5. **Strict Node CLI gates**
   - Require clean install, build/typecheck, tests, smoke, and `npm pack --dry-run`.
   - Add packed-package install smoke so the installed binary is tested, not just source.
   - Make this gate reusable by dogfood repos.

6. **Release note generation**
   - Generate release-candidate notes from git history first.
   - Later enrich with GitHub PR metadata while keeping output reviewable.
   - Include verification checklist in every release candidate.

7. **Dogfood rollout**
   - First targets: `proofdock`, `lockfilelens`, and `failureseed`.
   - Add ReleaseBox config, explicit release gates, workflows, and package smoke checks to each.
   - Keep each repo change atomic and public-trackable.

8. **StackForge template integration**
   - Backfill ReleaseBox patterns into StackForge-generated OSS CLI templates.
   - Ensure future StackForge repos start with task docs, orchestration docs, Dependabot, release config, and dry-run workflows.

## Acceptance Criteria

- `npm run release:check` passes from a clean checkout.
- `releasebox check .` passes in this repo.
- Packed package install smoke proves `npx releasebox --help` and `--version` work.
- GitHub repo includes Dependabot, docs/TASKS.md, docs/ORCHESTRATION.md, and release workflows.
- Rolling release-candidate PRs or docs track release-readiness gaps.
- No npm/Homebrew publishing occurs without explicit human approval.
