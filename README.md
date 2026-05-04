# Create WP Vue Plugin 🚀

CLI tool to scaffold WordPress plugins with Vue.js in seconds.

## Usage

Run the CLI directly from GitHub with `npx` — no installation required:

```bash
cd wp-content/plugins
npx github:Kapitan-Nemo/create-wp-vue-plugin
```

That's it. The command will fetch the latest version from GitHub and start the scaffolding wizard inside your current directory.

> 💡 **Tip:** Always run the command from inside your `wp-content/plugins/` directory — the new plugin folder will be created there.

### Alternative: Clone for development

If you want to modify the CLI itself or contribute:

```bash
cd wp-content/plugins
git clone https://github.com/Kapitan-Nemo/create-wp-vue-plugin.git
cd create-wp-vue-plugin
npm install
npm start
```

> 💡 **Note:** Even when running `npm start` from inside the `create-wp-vue-plugin/` folder, the new plugin will be created **one level up** — directly in `wp-content/plugins/` — so it behaves the same as the `npx` workflow.

## What it does

1. **Runs `npm create vue@latest`** - Creates a fresh Vue.js project with the latest configuration
2. **Ask WordPress plugin details** - Plugin name, description, author, license, etc.
3. **Generate WordPress files** - Main PHP file with proper headers and integration code

## Features

### WordPress Integration Options

- **Admin Page** - Adds a WordPress admin menu page with Vue.js app
- **Shortcode** - Register a shortcode to embed Vue app anywhere
- **REST API** - Scaffold REST API endpoints for data handling

### Generated Files

```
your-plugin/
├── dist/                  # Production build output
├── src/                   # Vue.js source files
├── your-plugin.php        # Main WordPress plugin file
├── vite.config.ts         # Vite config optimized for WP
├── .wpignore              # Files to exclude from deployment
└── README.md              # Plugin documentation
```

### Vite Configuration

The generated `vite.config.ts` is pre-configured for WordPress:

- Generates manifest.json for proper asset loading
- Configures CORS for local development
- Optimizes build output for WordPress

### PHP Integration

The main plugin file includes:

- WordPress plugin headers
- Asset enqueueing with manifest support
- `wp_localize_script` for passing data to Vue
- Activation/deactivation hooks

## Development Workflow

```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

### Development Mode

During development, the plugin loads assets from Vite dev server (localhost:5173).

### Production Mode

After building, the plugin loads assets from the `dist/` folder using the manifest.json.

## Example Output

```php
<?php
/**
 * @wordpress-plugin
 * Plugin Name:       My Awesome Plugin
 * Plugin URI:        https://github.com/username/my-awesome-plugin
 * Description:       A WordPress plugin powered by Vue.js
 * Version:           1.0.0
 * Author:            Your Name
 * Author URI:        https://github.com/username
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 */
```

## Requirements

- Node.js >= 18.0.0
- npm or yarn
- WordPress 5.0+

## License

GPL-2.0+

## Author

Kapitan Nemo
