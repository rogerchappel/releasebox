# Dogfood rollout

## Batch 1

Pick three projects and make release readiness visible before enabling publishing.

Recommended shapes:

1. Mature CLI with existing tests
2. New generated CLI with simple scope
3. Tooling/library repo that exercises release notes and issue tracking

## Per-repo commit sequence

1. Add `releasebox.config.json`
2. Add GitHub workflows
3. Add release issue templates and labels
4. Add or tighten `smoke` script
5. Add package install smoke test
6. Add realistic e2e fixture
7. Add release dry-run docs
8. Create/update release readiness issue

## Acceptance

A dogfood repo is done only when:

- `releasebox check` passes
- CI would run all deterministic gates
- local smoke passes
- package smoke passes
- release dry-run produces notes/artifacts
- open blockers are tracked as GitHub issues
