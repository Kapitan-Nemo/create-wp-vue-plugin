## [1.1.1] - 2026-05-27

### Added
- Scaffolder (`cli-auto.js` and `cli.js`) now automatically generates `.github/instructions/version-bump.instructions.md` inside every newly created plugin, with the plugin-specific PHP filename and `_VERSION` constant name filled in.
- `version-bump.instructions.md` updated to cover all four version locations: `package.json`, `package-lock.json`, PHP plugin header (`* Version:`), and the `define('..._VERSION', ...)` constant.

### Changed
- `applyTo` pattern in `version-bump.instructions.md` extended to include `**/*.php` so the instructions are triggered when editing the main PHP plugin file.
