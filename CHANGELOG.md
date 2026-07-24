# Changelog

## Unreleased

- Reject unsupported or missing `init --type` values before creating configuration.
- Preflight every workflow-template destination so collisions are reported together
  without partially installing templates.

## 0.1.0

- Initial release-candidate surface for release readiness checks, workflow templates, package smoke testing, and deterministic release notes.
- Includes reviewed-by-default GitHub Actions templates for CI, release dry-runs, and tag-based release workflows.
