#!/usr/bin/env node

/**
 * Enhanced CLI that auto-detects the created Vue project folder
 * by monitoring the directory for new folders
 */

import { spawn } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';

// Determine target directory:
// When running locally from inside the CLI package (npm start / npm run start:manual),
// create the new plugin one level up (in the actual plugins/ folder).
// When running via npx from the plugins/ directory, use cwd directly.
const __cliDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const targetDir = process.cwd() === __cliDir ? path.dirname(process.cwd()) : process.cwd();

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.green('🚀 Create WordPress Vue Plugin')}                           ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Scaffold Vue.js powered WordPress plugins with ease')}       ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

console.log(banner);

// Get list of directories before Vue create
function getDirectories(dir) {
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

// Step 1: Run npm create vue@latest and detect created folder
async function runVueCreate() {
    console.log(chalk.blue('\n📦 Step 1: Creating Vue.js project...\n'));
    console.log(chalk.gray('This will run: npm create vue@latest\n'));

    // Get directories before
    const dirsBefore = new Set(getDirectories(targetDir));

    return new Promise((resolve, reject) => {
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const child = spawn(npmCmd, ['create', 'vue@latest'], {
            stdio: 'inherit',
            cwd: targetDir
        });

        child.on('close', (code) => {
            if (code === 0) {
                // Get directories after
                const dirsAfter = getDirectories(targetDir);

                // Find new directory
                const newDirs = dirsAfter.filter(dir => !dirsBefore.has(dir));

                if (newDirs.length === 1) {
                    console.log(chalk.green(`\n✓ Detected new project folder: ${newDirs[0]}`));
                    resolve(newDirs[0]);
                } else if (newDirs.length > 1) {
                    // Multiple new folders, ask user
                    resolve(null);
                } else {
                    // No new folder detected
                    resolve(null);
                }
            } else {
                reject(new Error(`Vue CLI exited with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

// Step 2: Ask for project folder name (if not auto-detected)
async function askForProjectFolder(detectedFolder) {
    console.log(chalk.blue('\n🔍 Step 2: WordPress Plugin Configuration\n'));

    if (detectedFolder) {
        const { useDetected } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'useDetected',
                message: `Use detected folder "${detectedFolder}"?`,
                default: true
            }
        ]);

        if (useDetected) {
            return detectedFolder;
        }
    }

    const { folderName } = await inquirer.prompt([
        {
            type: 'input',
            name: 'folderName',
            message: 'Enter the Vue project folder name:',
            default: detectedFolder || '',
            validate: (input) => {
                if (!input.trim()) {
                    return 'Folder name is required';
                }
                if (!fs.existsSync(path.join(targetDir, input))) {
                    return `Folder "${input}" does not exist in target directory`;
                }
                return true;
            }
        }
    ]);

    return folderName;
}

// Step 3: Ask WordPress plugin details
async function askWordPressDetails(defaultName) {
    const formattedName = defaultName
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'pluginName',
            message: 'Plugin Name:',
            default: formattedName
        },
        {
            type: 'input',
            name: 'pluginUri',
            message: 'Plugin URI:',
            default: `https://github.com/Kapitan-Nemo/${defaultName}`
        },
        {
            type: 'input',
            name: 'description',
            message: 'Description:',
            default: 'A WordPress plugin powered by Vue.js'
        },
        {
            type: 'input',
            name: 'tags',
            message: 'Tags (comma-separated):',
            default: 'vue, wordpress, plugin'
        },
        {
            type: 'input',
            name: 'version',
            message: 'Version:',
            default: '1.0.0'
        },
        {
            type: 'input',
            name: 'author',
            message: 'Author:',
            default: 'Kapitan Nemo'
        },
        {
            type: 'input',
            name: 'authorUri',
            message: 'Author URI:',
            default: 'https://github.com/Kapitan-Nemo/'
        },
        {
            type: 'select',
            name: 'licenseType',
            message: 'License:',
            choices: ['GPL-2.0+', 'GPL-3.0+', 'MIT'],
            default: 'GPL-2.0+'
        },
        {
            type: 'input',
            name: 'textDomain',
            message: 'Text Domain:',
            default: defaultName.toLowerCase()
        },
        {
            type: 'confirm',
            name: 'addAdminPage',
            message: 'Add WordPress admin page?',
            default: true
        }
    ]);

    // Map license type to full license object
    const licenseMap = {
        'GPL-2.0+': { name: 'GPL-2.0+', uri: 'http://www.gnu.org/licenses/gpl-2.0.txt' },
        'GPL-3.0+': { name: 'GPL-3.0+', uri: 'http://www.gnu.org/licenses/gpl-3.0.txt' },
        'MIT': { name: 'MIT', uri: 'https://opensource.org/licenses/MIT' }
    };
    
    answers.license = licenseMap[answers.licenseType];
    
    return answers;
}

// Generate PHP plugin file
function generatePluginPhp(folderName, options) {
    const {
        pluginName,
        pluginUri,
        description,
        tags,
        version,
        author,
        authorUri,
        license,
        textDomain,
        addAdminPage
    } = options;

    const constantPrefix = folderName.toUpperCase().replace(/-/g, '_');
    const functionPrefix = textDomain.replace(/-/g, '_');

    let phpContent = `<?php
/**
 * @wordpress-plugin
 * Plugin Name:       ${pluginName}
 * Plugin URI:        ${pluginUri}
 * Description:       ${description}
 * Tags:              ${tags}
 * Version:           ${version}
 * Author:            ${author}
 * Author URI:        ${authorUri}
 * License:           ${license.name}
 * License URI:       ${license.uri}
 * Text Domain:       ${textDomain}
 * Domain Path:       /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('${constantPrefix}_VERSION', '${version}');
define('${constantPrefix}_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('${constantPrefix}_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Enqueue Vue.js app scripts and styles
 */
function ${functionPrefix}_enqueue_scripts() {
    $manifest_path = ${constantPrefix}_PLUGIN_DIR . 'dist/.vite/manifest.json';
    
    if (!file_exists($manifest_path)) {
        return;
    }
    
    $manifest = json_decode(file_get_contents($manifest_path), true);
    
    if (!isset($manifest['src/main.ts'])) {
        return;
    }
    
    $main = $manifest['src/main.ts'];
    
    // Enqueue main JS
    wp_enqueue_script(
        '${textDomain}-app',
        ${constantPrefix}_PLUGIN_URL . 'dist/' . $main['file'],
        array(),
        ${constantPrefix}_VERSION,
        true
    );
    
    // Add type="module" to script
    add_filter('script_loader_tag', function($tag, $handle) {
        if ($handle === '${textDomain}-app') {
            return str_replace(' src', ' type="module" src', $tag);
        }
        return $tag;
    }, 10, 2);
    
    // Enqueue CSS if exists
    if (isset($main['css'])) {
        foreach ($main['css'] as $index => $css_file) {
            wp_enqueue_style(
                '${textDomain}-style-' . $index,
                ${constantPrefix}_PLUGIN_URL . 'dist/' . $css_file,
                array(),
                ${constantPrefix}_VERSION
            );
        }
    }
    
    // Pass data to JavaScript
    wp_localize_script('${textDomain}-app', '${textDomain.replace(/-/g, '')}Data', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'restUrl' => rest_url('${textDomain}/v1/'),
        'nonce' => wp_create_nonce('wp_rest'),
        'pluginUrl' => ${constantPrefix}_PLUGIN_URL,
    ));
}
`;

    if (addAdminPage) {
        phpContent += `
/**
 * Add admin menu page
 */
function ${functionPrefix}_admin_menu() {
    add_menu_page(
        __('${pluginName}', '${textDomain}'),
        __('${pluginName}', '${textDomain}'),
        'manage_options',
        '${textDomain}',
        '${functionPrefix}_admin_page',
        'dashicons-admin-generic',
        30
    );
}
add_action('admin_menu', '${functionPrefix}_admin_menu');

/**
 * Render admin page
 */
function ${functionPrefix}_admin_page() {
    // Remove admin notices on plugin page
    remove_all_actions('admin_notices');
    
    ${functionPrefix}_enqueue_scripts();
    echo '<div class="wrap"><div id="app"></div></div>';
}
`;
    }



    phpContent += `
/**
 * Plugin activation hook
 */
function ${functionPrefix}_activate() {
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, '${functionPrefix}_activate');

/**
 * Plugin deactivation hook
 */
function ${functionPrefix}_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, '${functionPrefix}_deactivate');
`;

    return phpContent;
}

// Generate Vite config for WordPress
function generateViteConfig(folderName) {
    return `import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    outDir: 'dist',
    manifest: true,
    rollupOptions: {
      input: {
        main: './src/main.ts',
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
`;
}

// Generate build-zip.js script for creating WordPress distribution archives
function generateBuildZipScript() {
    return `#!/usr/bin/env node
/**
 * WordPress Plugin ZIP Builder
 * Creates a clean production-ready ZIP archive using .wpignore
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
    green: (t) => \`\\x1b[32m\${t}\\x1b[0m\`,
    red: (t) => \`\\x1b[31m\${t}\\x1b[0m\`,
    cyan: (t) => \`\\x1b[36m\${t}\\x1b[0m\`,
    yellow: (t) => \`\\x1b[33m\${t}\\x1b[0m\`,
    gray: (t) => \`\\x1b[90m\${t}\\x1b[0m\`,
    bold: (t) => \`\\x1b[1m\${t}\\x1b[0m\`,
};

function parseWpIgnore(projectPath) {
    const wpIgnorePath = path.join(projectPath, '.wpignore');
    if (!fs.existsSync(wpIgnorePath)) {
        return ['node_modules/', 'src/', '*.config.ts', '*.config.js', 'tsconfig*.json', 
                'package*.json', '.git/', '.gitignore', '.wpignore', 'README.md', 
                '.env*', '*.log', '.vscode/', '*.map', '*.zip', 'build-zip.js'];
    }
    return fs.readFileSync(wpIgnorePath, 'utf8')
        .split('\\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
}

function shouldIgnore(relativePath, patterns) {
    for (const pattern of patterns) {
        if (relativePath === pattern || relativePath === pattern.replace(/\\/$/, '')) return true;
        if (pattern.endsWith('/')) {
            const dir = pattern.slice(0, -1);
            if (relativePath === dir || relativePath.startsWith(dir + '/')) return true;
        }
        if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\\./g, '\\\\.').replace(/\\*/g, '.*') + '$');
            if (regex.test(relativePath) || regex.test(path.basename(relativePath))) return true;
        }
        if (!pattern.includes('/') && !pattern.includes('*') && path.basename(relativePath) === pattern) return true;
    }
    return false;
}

function getIncludedFiles(dir, baseDir, patterns, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);
        if (shouldIgnore(relativePath, patterns)) continue;
        if (entry.isDirectory()) getIncludedFiles(fullPath, baseDir, patterns, files);
        else files.push({ fullPath, relativePath });
    }
    return files;
}

function getPluginInfo(projectPath) {
    const files = fs.readdirSync(projectPath);
    const phpFile = files.find(f => f.endsWith('.php') && !f.startsWith('.'));
    if (!phpFile) return { name: path.basename(projectPath), version: '1.0.0' };
    const content = fs.readFileSync(path.join(projectPath, phpFile), 'utf8');
    const version = content.match(/Version:\\s*(.+)/i)?.[1]?.trim() || '1.0.0';
    const name = content.match(/Plugin Name:\\s*(.+)/i)?.[1]?.trim() || path.basename(projectPath);
    return { name, version };
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function buildZip() {
    console.log('\\n' + colors.cyan('📦 WordPress Plugin ZIP Builder') + '\\n');
    
    const projectPath = process.cwd();
    const distPath = path.join(projectPath, 'dist');
    
    if (!fs.existsSync(distPath)) {
        console.log(colors.red('❌ dist/ folder not found! Run "npm run build" first.'));
        process.exit(1);
    }
    
    const pluginInfo = getPluginInfo(projectPath);
    console.log(colors.cyan('📋 Plugin:  ') + pluginInfo.name);
    console.log(colors.cyan('📌 Version: ') + pluginInfo.version);
    
    const patterns = parseWpIgnore(projectPath);
    const files = getIncludedFiles(projectPath, projectPath, patterns);
    console.log(colors.cyan('📁 Including ') + files.length + ' files\\n');
    
    const pluginSlug = path.basename(projectPath);
    const zipFilename = pluginSlug + '-' + pluginInfo.version + '.zip';
    const outputPath = path.join(projectPath, zipFilename);
    const tempDir = path.join(projectPath, '.wp-build-temp');
    const pluginDir = path.join(tempDir, pluginSlug);
    
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
    fs.mkdirSync(pluginDir, { recursive: true });
    
    for (const file of files) {
        const destPath = path.join(pluginDir, file.relativePath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(file.fullPath, destPath);
    }
    
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    
    try {
        execSync('zip -r "' + outputPath + '" "' + pluginSlug + '"', { cwd: tempDir, stdio: 'pipe' });
    } catch (e) {
        console.log(colors.red('❌ Error: zip command failed. Please install zip.'));
        fs.rmSync(tempDir, { recursive: true });
        process.exit(1);
    }
    
    fs.rmSync(tempDir, { recursive: true });
    
    const stats = fs.statSync(outputPath);
    console.log(colors.green('✅ ZIP created: ') + zipFilename);
    console.log(colors.cyan('📊 Size: ') + formatSize(stats.size));
    console.log('\\n' + colors.gray('Upload via: Plugins → Add New → Upload Plugin') + '\\n');
}

buildZip();
`;
}

// Create WordPress-specific files
async function createWordPressFiles(folderName, options) {
    const spinner = ora('Creating WordPress plugin files...').start();

    try {
        const projectPath = path.join(targetDir, folderName);

        // Create main PHP file
        const phpContent = generatePluginPhp(folderName, options);
        fs.writeFileSync(path.join(projectPath, `${folderName}.php`), phpContent);
        spinner.text = 'Created main plugin PHP file...';

        // Update vite.config.ts for WordPress
        const viteConfigPath = path.join(projectPath, 'vite.config.ts');
        if (fs.existsSync(viteConfigPath)) {
            const newViteConfig = generateViteConfig(folderName);
            fs.writeFileSync(viteConfigPath, newViteConfig);
            spinner.text = 'Updated Vite configuration for WordPress...';
        }

        // Update package.json - add watch and build:zip scripts
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            packageJson.scripts = packageJson.scripts || {};
            packageJson.scripts.watch = 'vite build --watch';
            packageJson.scripts['build:zip'] = 'vite build && node ./build-zip.js';
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            spinner.text = 'Added watch and build:zip scripts to package.json...';
        }

        // Create .wpignore file
        const wpIgnoreContent = `# ==============================================
# WordPress Plugin Distribution Ignore File
# ==============================================
# Files and folders listed here will be excluded
# when creating a ZIP archive for WordPress
# ==============================================

# Dependencies
node_modules/

# Source files (not needed in production)
src/
public/

# Build configuration
*.config.ts
*.config.js
*.config.mjs
tsconfig*.json
package*.json

# Development tools
.git/
.gitignore
.gitattributes
.vscode/
.idea/
.editorconfig
.eslintrc*
.prettierrc*
.stylelintrc*
.oxfmtrc*
.oxlintrc*
env.d.ts

# Documentation (optional - uncomment to include)
README.md
CHANGELOG.md
CONTRIBUTING.md
LICENSE

# Environment & logs
.env*
*.log
npm-debug.log*

# Testing
tests/
__tests__/
coverage/
*.test.ts
*.test.js
*.spec.ts
*.spec.js
jest.config.*
vitest.config.*
cypress/
playwright/

# Build artifacts
*.map
*.zip
*.tar.gz
.wp-build-temp/

# OS files
.DS_Store
Thumbs.db
desktop.ini

# Build script
build-zip.js
`;
        fs.writeFileSync(path.join(projectPath, '.wpignore'), wpIgnoreContent);

        // Create build-zip.js script
        const buildZipContent = generateBuildZipScript();
        fs.writeFileSync(path.join(projectPath, 'build-zip.js'), buildZipContent);
        spinner.text = 'Created build-zip.js script...';

        // Create README with instructions
        const readmeContent = `# ${options.pluginName}

${options.description}

## Development

\`\`\`bash
# Install dependencies
npm install

# Watch for changes (rebuilds automatically)
npm run watch

# Build for production
npm run build

# Create distribution ZIP for WordPress
npm run build:zip
\`\`\`

## How it works

The plugin loads Vue.js assets from the \`dist/\` folder.

- Use \`npm run watch\` during development - it rebuilds automatically when you save files
- Use \`npm run build\` for final production build
- Use \`npm run build:zip\` to create a clean ZIP file ready for WordPress upload

## Creating Distribution Package

Run \`npm run build:zip\` to create a production-ready ZIP archive.
The script uses \`.wpignore\` file to exclude development files (node_modules, src, etc.).

Upload the generated \`${options.textDomain}-x.x.x.zip\` file via:
**WordPress Admin → Plugins → Add New → Upload Plugin**

## Features
${options.addAdminPage ? '- ✅ Admin page at: WordPress Admin → ' + options.pluginName : ''}

## Accessing WordPress Data in Vue

The plugin exposes data via \`window.${options.textDomain.replace(/-/g, '')}Data\`:

\`\`\`typescript
// In your Vue component
declare global {
  interface Window {
    ${options.textDomain.replace(/-/g, '')}Data: {
      ajaxUrl: string
      restUrl: string
      nonce: string
      pluginUrl: string
    }
  }
}

const wpData = window.${options.textDomain.replace(/-/g, '')}Data

// Make authenticated REST API calls
fetch(wpData.restUrl + 'data', {
  headers: {
    'X-WP-Nonce': wpData.nonce
  }
})
\`\`\`

## License

${options.license.name}
`;
        fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);

        // Create types file for WordPress data
        const typesContent = `// WordPress data types
declare global {
  interface Window {
    ${options.textDomain.replace(/-/g, '')}Data: {
      ajaxUrl: string
      restUrl: string
      nonce: string
      pluginUrl: string
    }
  }
}

export {}
`;
        fs.writeFileSync(path.join(projectPath, 'src', 'wordpress.d.ts'), typesContent);

        // Create .github/instructions for AI agent
        const githubInstructionsDir = path.join(projectPath, '.github', 'instructions');
        fs.mkdirSync(githubInstructionsDir, { recursive: true });
        const constantPrefix = folderName.toUpperCase().replace(/-/g, '_');
        const versionConstant = `${constantPrefix}_VERSION`;
        const versionBumpInstructions = `---
description: "Use when modifying package.json, package-lock.json, or the main PHP plugin file: bump the version according to Semantic Versioning (MAJOR.MINOR.PATCH) in all version fields, write changelog entry in English."
applyTo: "{package.json,package-lock.json,**/*.php}"
---
# Version Bump & Changelog Rules

## Version Bump (Semantic Versioning 2.0.0)

Follow [Semantic Versioning](https://semver.org/) — \`MAJOR.MINOR.PATCH\`. Pick the segment to increment based on the nature of the change:

- **MAJOR** (\`X.y.z\`) — increment when introducing **backward-incompatible** changes to the public API/behavior (breaking changes). Reset MINOR and PATCH to \`0\` (e.g. \`1.4.2\` → \`2.0.0\`).
- **MINOR** (\`x.Y.z\`) — increment when adding **new, backward-compatible** functionality, or when marking public API as deprecated. Reset PATCH to \`0\` (e.g. \`1.4.2\` → \`1.5.0\`).
- **PATCH** (\`x.y.Z\`) — increment for **backward-compatible bug fixes** and internal changes that don't alter the public API (e.g. \`1.4.2\` → \`1.4.3\`).

Rules:
- Increment only **one** segment per release, and only by 1.
- When in doubt between two segments, choose the higher-impact one (breaking → MAJOR, new feature → MINOR).
- During initial development (\`0.y.z\`) the API is unstable: bump MINOR for new features/breaking changes and PATCH for fixes.
- Never skip versions or jump more than one increment unless explicitly requested.

Update the version in **all four locations** — never leave any out of sync:
  1. \`version\` field in \`package.json\`
  2. Root \`version\` field in \`package-lock.json\` and the matching entry under \`packages[""]\`
  3. \`* Version:           X.X.X\` line in the main PHP plugin file header (\`${folderName}.php\`)
  4. \`define('${versionConstant}', 'X.X.X');\` constant in \`${folderName}.php\`

## Changelog

- Always write changelog entries in **English**.
- Add a new entry at the top of \`CHANGELOG.md\` (create the file if it doesn't exist) using this format:

\`\`\`markdown
## [<new-version>] - <YYYY-MM-DD>

### Added
- ...

### Changed
- ...

### Fixed
- ...
\`\`\`

- Only include sections that have actual changes (omit empty sections).
- Keep entries concise — one line per change.
`;
        fs.writeFileSync(path.join(githubInstructionsDir, 'version-bump.instructions.md'), versionBumpInstructions);
        spinner.text = 'Created .github/instructions for AI agent...';

        const copilotInstructions = `# Ponytail, lazy senior dev mode

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse the helper, util, or pattern that's already here, don't re-write it.
3. Does the standard library already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

The ladder runs after you understand the problem, not instead of it: read the task and the code it touches, trace the real flow end to end, then climb.

Bug fix = root cause, not symptom: a report names a symptom. Grep every caller of the function you touch and fix the shared function once — one guard there is a smaller diff than one per caller, and patching only the path the ticket names leaves a sibling caller still broken.

Rules:

- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Shortest working diff wins, but only once you understand the problem. The smallest change in the wrong place isn't lazy, it's a second bug.
- Question complex requests: "Do you actually need X, or does Y cover it?"
- Pick the edge-case-correct option when two stdlib approaches are the same size, lazy means less code, not the flimsier algorithm.
- Mark deliberate simplifications that cut a real corner with a known ceiling (global lock, O(n²) scan, naive heuristic) with a \`ponytail:\` comment naming the ceiling and upgrade path.

Not lazy about: understanding the problem (read it fully and trace the real flow before picking a rung, a small diff you don't understand is just laziness dressed up as efficiency), input validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs (the platform is never the spec ideal, a clock drifts, a sensor reads off), anything explicitly requested. Lazy code without its check is unfinished: non-trivial logic leaves ONE runnable check behind, the smallest thing that fails if the logic breaks (an assert-based demo/self-check or one small test file; no frameworks, no fixtures). Trivial one-liners need no test.
`;
        fs.writeFileSync(path.join(projectPath, '.github', 'copilot-instructions.md'), copilotInstructions);
        spinner.text = 'Created .github/copilot-instructions.md for AI agent...';

        spinner.succeed(chalk.green('WordPress plugin files created successfully!'));
    } catch (error) {
        spinner.fail(chalk.red('Failed to create WordPress files'));
        throw error;
    }
}

// Main function
async function main() {
    try {
        // Step 1: Run Vue create and detect folder
        const detectedFolder = await runVueCreate();

        // Step 2: Confirm or ask for folder name
        const folderName = await askForProjectFolder(detectedFolder);

        // Step 3: Ask WordPress details
        const wpOptions = await askWordPressDetails(folderName);

        // Step 4: Create WordPress files
        await createWordPressFiles(folderName, wpOptions);

        // Success message
        console.log(chalk.green('\n✨ WordPress Vue plugin created successfully!\n'));
        console.log(chalk.cyan('Next steps:'));
        console.log(chalk.white(`  1. cd ${folderName}`));
        console.log(chalk.white('  2. npm install'));
        console.log(chalk.white('  3. npm run build'));
        console.log(chalk.white('  4. npm run watch  (for development)'));
        console.log(chalk.cyan('\n📦 Create distribution ZIP:'));
        console.log(chalk.white('  npm run build:zip'));
        console.log(chalk.gray('  (Uses .wpignore to create clean WordPress package)'));
        console.log(chalk.white('\n🔌 Activate the plugin in WordPress Admin'));
        console.log(chalk.white('📝 Access your plugin at: WordPress Admin → ' + folderName));
        console.log(chalk.white('\nHappy coding! 🚀\n'));

    } catch (error) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
    }
}

main();
