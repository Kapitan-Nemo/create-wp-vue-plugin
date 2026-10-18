# Create WP Vue Plugin

CLI that scaffolds a WordPress plugin with a Vue 3 + Vite app inside.

## Quick start

Run it from your `wp-content/plugins/` directory:

```bash
cd wp-content/plugins
npx github:Kapitan-Nemo/create-wp-vue-plugin
```

The wizard:

1. Runs `npm create vue@latest` and detects the new project folder.
2. Asks for plugin details: name, URI, description, tags, version, author, author URI, license (GPL-2.0+, GPL-3.0+ or MIT), text domain, and whether to add an admin page.
3. Turns the Vue project into a WordPress plugin.

> **Choose TypeScript** in the Vue wizard. The generated PHP and Vite config expect `src/main.ts` and `vite.config.ts`.

Then:

```bash
cd your-plugin
npm install
npm run build
```

Activate the plugin in **WordPress Admin → Plugins**.

## What gets generated

```
your-plugin/
├── .github/
│   ├── copilot-instructions.md               # AI agent rules (Ponytail + Caveman)
│   └── instructions/
│       └── version-bump.instructions.md      # SemVer bump + changelog rules
├── src/
│   └── wordpress.d.ts                        # Types for data passed from PHP
├── your-plugin.php                           # Main plugin file
├── vite.config.ts                            # Rewritten for WordPress
├── build-zip.js                              # Builds a distributable ZIP
├── .wpignore                                 # Files excluded from the ZIP
└── README.md                                 # Plugin docs
```

### Main PHP file

- Plugin header, plus `<PREFIX>_VERSION`, `<PREFIX>_PLUGIN_DIR` and `<PREFIX>_PLUGIN_URL` constants.
- Enqueues the built JS (as `type="module"`) and CSS from `dist/.vite/manifest.json`.
- Passes `ajaxUrl`, `restUrl`, `nonce` and `pluginUrl` to Vue via `wp_localize_script` (`window.<textdomain>Data`).
- Optional admin menu page that mounts the app in `<div id="app">`.
- Activation and deactivation hooks.

### Vite config

Builds to `dist/` with `manifest: true` and `src/main.ts` as the entry point.

### npm scripts added

| Script | What it does |
| --- | --- |
| `npm run build` | Production build into `dist/` |
| `npm run watch` | Rebuilds on every save (`vite build --watch`) |
| `npm run build:zip` | Builds, then creates `<text-domain>-<version>.zip`, skipping everything in `.wpignore` |

Upload the ZIP via **WordPress Admin → Plugins → Add New → Upload Plugin**.

### AI agent instructions

- `.github/copilot-instructions.md`: [Ponytail](https://github.com/DietrichGebert/ponytail) rules (smallest complete change) and [Caveman](https://github.com/juliusbrussee/caveman) rules (terse answers).
- `.github/instructions/version-bump.instructions.md`: when the agent edits `package.json`, `package-lock.json` or the PHP file, it bumps the version in all four places and adds a `CHANGELOG.md` entry.

## Manual mode

If folder detection picks the wrong folder, use manual mode. It still runs `npm create vue@latest`, then asks you to type the folder name:

```bash
git clone https://github.com/Kapitan-Nemo/create-wp-vue-plugin.git
cd create-wp-vue-plugin
npm install
npm run start:manual
```

## Developing the CLI

```bash
cd wp-content/plugins
git clone https://github.com/Kapitan-Nemo/create-wp-vue-plugin.git
cd create-wp-vue-plugin
npm install
npm start
```

When run from inside the CLI's own folder, the plugin is created one level up, in `wp-content/plugins/`.

## Requirements

- Node.js >= 18
- `zip` available in your shell (for `npm run build:zip`)
- WordPress

## License

GPL-2.0+ · Author: Kapitan Nemo
