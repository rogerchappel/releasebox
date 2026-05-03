# Release standard

A project is release-ready when a new contributor can verify the same artifact a user will install.

## Node CLI standard

Required checks:

- dependency install succeeds from a clean checkout
- build succeeds, if the project compiles
- unit/integration tests pass
- CLI help works from source
- CLI version works from source
- package can be packed with `npm pack`
- packed package can be installed in a temporary project
- installed binary can run `--help` and `--version`
- at least one realistic fixture workflow asserts output
- release notes can be generated from recent commits/PRs/issues

## GitHub release standard

A release candidate issue should capture:

- target version
- included commits/PRs/issues
- user-facing changes
- breaking changes
- package/artifact targets
- dry-run evidence
- post-release verification evidence

## Publishing standard

Publishing is disabled until a repo explicitly opts in.

Recommended progression:

1. dry-run only
2. GitHub release artifact only
3. npm publish from protected tag
4. Homebrew formula PR generation
5. fully automated publishing, only after repeated successful reviewed releases

## Audit trail standard

Prefer many atomic commits:

- config only
- workflow only
- issue templates only
- smoke script only
- fixture test only
- release notes generator only
- docs only

This makes AI-assisted work easier to review and revert.
