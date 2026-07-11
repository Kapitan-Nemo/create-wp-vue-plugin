## [1.3.0] - 2026-07-11

### Added
- Scaffolder (`cli-auto.js` and `cli.js`) now generates `.github/copilot-instructions.md` with the Ponytail "lazy senior dev" ruleset in every newly created plugin.

## [1.2.0] - 2026-07-11

### Changed
- `version-bump.instructions.md` now follows [Semantic Versioning 2.0.0](https://semver.org/): the version segment (MAJOR/MINOR/PATCH) is chosen based on the nature of the change instead of always incrementing patch.
- Scaffolder templates in `cli-auto.js` and `cli.js` updated to generate the new SemVer-based `version-bump.instructions.md` in every newly created plugin.

## [1.1.1] - 2026-05-27

### Added
- Scaffolder (`cli-auto.js` and `cli.js`) now automatically generates `.github/instructions/version-bump.instructions.md` inside every newly created plugin, with the plugin-specific PHP filename and `_VERSION` constant name filled in.
- `version-bump.instructions.md` updated to cover all four version locations: `package.json`, `package-lock.json`, PHP plugin header (`* Version:`), and the `define('..._VERSION', ...)` constant.

### Changed
- `applyTo` pattern in `version-bump.instructions.md` extended to include `**/*.php` so the instructions are triggered when editing the main PHP plugin file.
