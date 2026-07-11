---
description: "Use when modifying package.json, package-lock.json, or the main PHP plugin file: bump the version according to Semantic Versioning (MAJOR.MINOR.PATCH) in all version fields, write changelog entry in English."
applyTo: "{package.json,package-lock.json,**/*.php}"
---
# Version Bump & Changelog Rules

## Version Bump (Semantic Versioning 2.0.0)

Follow [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`. Pick the segment to increment based on the nature of the change:

- **MAJOR** (`X.y.z`) — increment when introducing **backward-incompatible** changes to the public API/behavior (breaking changes). Reset MINOR and PATCH to `0` (e.g. `1.4.2` → `2.0.0`).
- **MINOR** (`x.Y.z`) — increment when adding **new, backward-compatible** functionality, or when marking public API as deprecated. Reset PATCH to `0` (e.g. `1.4.2` → `1.5.0`).
- **PATCH** (`x.y.Z`) — increment for **backward-compatible bug fixes** and internal changes that don't alter the public API (e.g. `1.4.2` → `1.4.3`).

Rules:
- Increment only **one** segment per release, and only by 1.
- When in doubt between two segments, choose the higher-impact one (breaking → MAJOR, new feature → MINOR).
- During initial development (`0.y.z`) the API is unstable: bump MINOR for new features/breaking changes and PATCH for fixes.
- Never skip versions or jump more than one increment unless explicitly requested.

Update the version in **all four locations** — never leave any out of sync:
  1. `version` field in `package.json`
  2. Root `version` field in `package-lock.json` and the matching entry under `packages[""]`
  3. `* Version:           X.X.X` line in the main PHP plugin file header
  4. `define('PLUGINNAME_VERSION', 'X.X.X');` constant in the main PHP plugin file (the constant name varies per plugin — match whatever `_VERSION` constant is already present)

## Changelog

- Always write changelog entries in **English**.
- Add a new entry at the top of `CHANGELOG.md` (create the file if it doesn't exist) using this format:

```markdown
## [<new-version>] - <YYYY-MM-DD>

### Added
- ...

### Changed
- ...

### Fixed
- ...
```

- Only include sections that have actual changes (omit empty sections).
- Keep entries concise — one line per change.
