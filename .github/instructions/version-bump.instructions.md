---
description: "Use when modifying package.json, package-lock.json, or the main PHP plugin file: bump patch version (+1) in all version fields, write changelog entry in English."
applyTo: "{package.json,package-lock.json,**/*.php}"
---
# Version Bump & Changelog Rules

## Version Bump

- Always increment the **patch** segment by 1 (e.g. `1.1.0` → `1.1.1`).
- Update the version in **all four locations** — never leave any out of sync:
  1. `version` field in `package.json`
  2. Root `version` field in `package-lock.json` and the matching entry under `packages[""]`
  3. `* Version:           X.X.X` line in the main PHP plugin file header
  4. `define('PLUGINNAME_VERSION', 'X.X.X');` constant in the main PHP plugin file (the constant name varies per plugin — match whatever `_VERSION` constant is already present)
- Never skip a version or jump more than one patch at a time unless explicitly requested.

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
