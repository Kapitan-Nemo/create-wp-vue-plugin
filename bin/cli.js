#!/usr/bin/env node

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

// Step 1: Run npm create vue@latest
async function runVueCreate() {
    console.log(chalk.blue('\n📦 Step 1: Creating Vue.js project...\n'));
    console.log(chalk.gray('This will run: npm create vue@latest\n'));

    return new Promise((resolve, reject) => {
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const child = spawn(npmCmd, ['create', 'vue@latest'], {
            stdio: 'inherit',
            cwd: targetDir
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Vue CLI exited with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

// Step 2: Ask for project folder name
async function askForProjectFolder() {
    console.log(chalk.blue('\n🔍 Step 2: WordPress Plugin Configuration\n'));

    const { folderName } = await inquirer.prompt([
        {
            type: 'input',
            name: 'folderName',
            message: 'Enter the Vue project folder name you just created:',
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
            type: 'list',
            name: 'license',
            message: 'License:',
            choices: [
                { name: 'GPL-2.0+', value: { name: 'GPL-2.0+', uri: 'http://www.gnu.org/licenses/gpl-2.0.txt' } },
                { name: 'GPL-3.0+', value: { name: 'GPL-3.0+', uri: 'http://www.gnu.org/licenses/gpl-3.0.txt' } },
                { name: 'MIT', value: { name: 'MIT', uri: 'https://opensource.org/licenses/MIT' } }
            ],
            default: 0
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
            message: 'Add WordPress admin page scaffold?',
            default: true
        },
        {
            type: 'confirm',
            name: 'addShortcode',
            message: 'Add shortcode support?',
            default: true
        },
        {
            type: 'confirm',
            name: 'addRestApi',
            message: 'Add REST API endpoints scaffold?',
            default: false
        }
    ]);

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
        addAdminPage,
        addShortcode,
        addRestApi
    } = options;

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
define('${folderName.toUpperCase()}_VERSION', '${version}');
define('${folderName.toUpperCase()}_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('${folderName.toUpperCase()}_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Enqueue Vue.js app scripts and styles
 */
function ${textDomain.replace(/-/g, '_')}_enqueue_scripts() {
    $manifest_path = ${folderName.toUpperCase()}_PLUGIN_DIR . 'dist/.vite/manifest.json';
    
    if (file_exists($manifest_path)) {
        $manifest = json_decode(file_get_contents($manifest_path), true);
        
        if (isset($manifest['src/main.ts'])) {
            $main = $manifest['src/main.ts'];
            
            // Enqueue main JS
            wp_enqueue_script(
                '${textDomain}-app',
                ${folderName.toUpperCase()}_PLUGIN_URL . 'dist/' . $main['file'],
                array(),
                ${folderName.toUpperCase()}_VERSION,
                true
            );
            
            // Enqueue CSS if exists
            if (isset($main['css'])) {
                foreach ($main['css'] as $index => $css_file) {
                    wp_enqueue_style(
                        '${textDomain}-style-' . $index,
                        ${folderName.toUpperCase()}_PLUGIN_URL . 'dist/' . $css_file,
                        array(),
                        ${folderName.toUpperCase()}_VERSION
                    );
                }
            }
        }
    }
    
    // Pass data to JavaScript
    wp_localize_script('${textDomain}-app', '${textDomain.replace(/-/g, '')}Data', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'restUrl' => rest_url('${textDomain}/v1/'),
        'nonce' => wp_create_nonce('${textDomain}_nonce'),
        'pluginUrl' => ${folderName.toUpperCase()}_PLUGIN_URL,
    ));
}
`;

    if (addAdminPage) {
        phpContent += `
/**
 * Add admin menu page
 */
function ${textDomain.replace(/-/g, '_')}_admin_menu() {
    add_menu_page(
        __('${pluginName}', '${textDomain}'),
        __('${pluginName}', '${textDomain}'),
        'manage_options',
        '${textDomain}',
        '${textDomain.replace(/-/g, '_')}_admin_page',
        'dashicons-admin-generic',
        30
    );
}
add_action('admin_menu', '${textDomain.replace(/-/g, '_')}_admin_menu');

/**
 * Render admin page
 */
function ${textDomain.replace(/-/g, '_')}_admin_page() {
    ${textDomain.replace(/-/g, '_')}_enqueue_scripts();
    echo '<div id="app" class="${textDomain}-admin-wrapper"></div>';
}
`;
    }

    if (addShortcode) {
        phpContent += `
/**
 * Register shortcode [${textDomain}]
 */
function ${textDomain.replace(/-/g, '_')}_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => 'app',
        'class' => '',
    ), $atts, '${textDomain}');
    
    ${textDomain.replace(/-/g, '_')}_enqueue_scripts();
    
    $classes = '${textDomain}-wrapper';
    if (!empty($atts['class'])) {
        $classes .= ' ' . esc_attr($atts['class']);
    }
    
    return '<div id="' . esc_attr($atts['id']) . '" class="' . $classes . '"></div>';
}
add_shortcode('${textDomain}', '${textDomain.replace(/-/g, '_')}_shortcode');
`;
    }

    if (addRestApi) {
        phpContent += `
/**
 * Register REST API routes
 */
function ${textDomain.replace(/-/g, '_')}_register_rest_routes() {
    register_rest_route('${textDomain}/v1', '/data', array(
        'methods' => 'GET',
        'callback' => '${textDomain.replace(/-/g, '_')}_get_data',
        'permission_callback' => function() {
            return current_user_can('read');
        }
    ));
    
    register_rest_route('${textDomain}/v1', '/data', array(
        'methods' => 'POST',
        'callback' => '${textDomain.replace(/-/g, '_')}_save_data',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        }
    ));
}
add_action('rest_api_init', '${textDomain.replace(/-/g, '_')}_register_rest_routes');

/**
 * GET endpoint callback
 */
function ${textDomain.replace(/-/g, '_')}_get_data(WP_REST_Request $request) {
    // Your GET logic here
    return rest_ensure_response(array(
        'success' => true,
        'data' => array()
    ));
}

/**
 * POST endpoint callback
 */
function ${textDomain.replace(/-/g, '_')}_save_data(WP_REST_Request $request) {
    // Verify nonce
    $nonce = $request->get_header('X-WP-Nonce');
    if (!wp_verify_nonce($nonce, 'wp_rest')) {
        return new WP_Error('invalid_nonce', 'Invalid nonce', array('status' => 403));
    }
    
    // Your POST logic here
    $data = $request->get_json_params();
    
    return rest_ensure_response(array(
        'success' => true,
        'message' => 'Data saved successfully'
    ));
}
`;
    }

    phpContent += `
/**
 * Plugin activation hook
 */
function ${textDomain.replace(/-/g, '_')}_activate() {
    // Activation logic here
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, '${textDomain.replace(/-/g, '_')}_activate');

/**
 * Plugin deactivation hook
 */
function ${textDomain.replace(/-/g, '_')}_deactivate() {
    // Deactivation logic here
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, '${textDomain.replace(/-/g, '_')}_deactivate');
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
  // WordPress-specific build configuration
  build: {
    // Output to dist folder
    outDir: 'dist',
    // Generate manifest for PHP asset loading
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
  // Dev server configuration
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    // Allow WordPress to access dev server
    origin: 'http://localhost:5173',
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

# Dependencies
node_modules/

# Source files
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
.eslintrc*
.prettierrc*
.oxfmtrc*
.oxlintrc*
env.d.ts

# Documentation
README.md
CHANGELOG.md

# Environment & logs
.env*
*.log

# Testing
tests/
__tests__/
coverage/
*.test.ts
*.test.js

# Build artifacts
*.map
*.zip
*.tar.gz
.wp-build-temp/

# OS files
.DS_Store
Thumbs.db

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

## Creating Distribution Package

Run \`npm run build:zip\` to create a production-ready ZIP archive.
The script uses \`.wpignore\` file to exclude development files.

Upload via: **Plugins → Add New → Upload Plugin**

## Features
${options.addAdminPage ? '- ✅ Admin page' : ''}
${options.addShortcode ? `- ✅ Shortcode: \`[${options.textDomain}]\`` : ''}
${options.addRestApi ? '- ✅ REST API endpoints' : ''}

## License

${options.license.name}
`;
        fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);

        spinner.succeed(chalk.green('WordPress plugin files created successfully!'));
    } catch (error) {
        spinner.fail(chalk.red('Failed to create WordPress files'));
        throw error;
    }
}

// Main function
async function main() {
    try {
        // Step 1: Run Vue create
        await runVueCreate();

        // Step 2: Ask for folder name
        const folderName = await askForProjectFolder();

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
        console.log(chalk.white('\nHappy coding! 🚀\n'));

    } catch (error) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
    }
}

main();
