---
description: "Use when modifying package.json or package-lock.json: bump patch version (+1), write changelog entry in English."
applyTo: "{package.json,package-lock.json}"
---
# Version Bump & Changelog Rules

## Version Bump

- Always increment the **patch** segment by 1 (e.g. `1.1.0` → `1.1.1`).
- Update `version` in **both** `package.json` and `package-lock.json` (root `version` field and the matching entry under `packages[""]`).
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
