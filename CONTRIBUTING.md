# Contributing

Thanks for helping improve ReleaseBox. Keep changes small, reviewable, and tied
to release-readiness behavior that a maintainer can verify locally.

## Local Setup

```sh
npm install
npm run build
```

## Before Opening a PR

Run the full release gate:

```sh
npm run release:check
```

For focused changes, use the narrower commands while iterating:

```sh
npm run lint
npm test
npm run smoke
npm run package:smoke
```

## Change Guidelines

- Keep templates deterministic and easy to review.
- Prefer fixture-backed checks for new readiness rules.
- Do not add publishing, tagging, or package-release side effects to default
  commands.
- Document any new project-type expectation in `docs/release-standard.md` or
  the relevant docs file.

## Safety Boundary

ReleaseBox is a readiness and dry-run tool. Contributions should preserve the
default behavior that checks, notes, and templates are review artifacts until a
maintainer explicitly performs a release outside the tool.
