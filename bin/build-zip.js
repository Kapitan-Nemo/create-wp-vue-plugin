#!/usr/bin/env node

/**
 * WordPress Plugin ZIP Builder
 * 
 * Creates a clean production-ready ZIP archive for WordPress plugin distribution.
 * Uses .wpignore file to exclude development files.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createWriteStream } from 'fs';

// Colors for terminal output (inline to avoid dependency)
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

/**
 * Parse .wpignore file and return array of patterns
 */
function parseWpIgnore(projectPath) {
    const wpIgnorePath = path.join(projectPath, '.wpignore');
    
    if (!fs.existsSync(wpIgnorePath)) {
        console.log(colors.yellow('⚠️  No .wpignore file found, using default patterns'));
        return getDefaultIgnorePatterns();
    }
    
    const content = fs.readFileSync(wpIgnorePath, 'utf8');
    const patterns = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    
    return patterns;
}

/**
 * Default ignore patterns if .wpignore doesn't exist
 */
function getDefaultIgnorePatterns() {
    return [
        'node_modules/',
        'src/',
        '*.config.ts',
        '*.config.js',
        '*.config.mjs',
        'tsconfig*.json',
        'package*.json',
        '.git/',
        '.gitignore',
        '.gitattributes',
        '.wpignore',
        'README.md',
        '.env*',
        '*.log',
        '.vscode/',
        '.idea/',
        '*.map',
        'tests/',
        '__tests__/',
        '*.test.ts',
        '*.test.js',
        '*.spec.ts',
        '*.spec.js',
        '.DS_Store',
        'Thumbs.db',
        '*.zip',
        '.oxfmtrc*',
        '.oxlintrc*',
        'env.d.ts',
    ];
}

/**
 * Check if a file/folder should be ignored based on patterns
 */
function shouldIgnore(relativePath, patterns) {
    for (const pattern of patterns) {
        // Exact match
        if (relativePath === pattern || relativePath === pattern.replace(/\/$/, '')) {
            return true;
        }
        
        // Directory pattern (ends with /)
        if (pattern.endsWith('/')) {
            const dirPattern = pattern.slice(0, -1);
            if (relativePath === dirPattern || relativePath.startsWith(dirPattern + '/')) {
                return true;
            }
        }
        
        // Glob pattern with *
        if (pattern.includes('*')) {
            const regexPattern = pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*');
            const regex = new RegExp(`^${regexPattern}$`);
            if (regex.test(relativePath) || regex.test(path.basename(relativePath))) {
                return true;
            }
        }
        
        // Simple filename match
        if (!pattern.includes('/') && !pattern.includes('*')) {
            if (path.basename(relativePath) === pattern) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Recursively get all files that should be included
 */
function getIncludedFiles(dir, baseDir, patterns, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);
        
        if (shouldIgnore(relativePath, patterns)) {
            continue;
        }
        
        if (entry.isDirectory()) {
            getIncludedFiles(fullPath, baseDir, patterns, files);
        } else {
            files.push({
                fullPath,
                relativePath
            });
        }
    }
    
    return files;
}

/**
 * Get plugin info from main PHP file
 */
function getPluginInfo(projectPath) {
    const files = fs.readdirSync(projectPath);
    const phpFile = files.find(f => f.endsWith('.php') && !f.startsWith('.'));
    
    if (!phpFile) {
        return { name: path.basename(projectPath), version: '1.0.0' };
    }
    
    const content = fs.readFileSync(path.join(projectPath, phpFile), 'utf8');
    
    const versionMatch = content.match(/Version:\s*(.+)/i);
    const nameMatch = content.match(/Plugin Name:\s*(.+)/i);
    
    return {
        name: nameMatch ? nameMatch[1].trim() : path.basename(projectPath),
        version: versionMatch ? versionMatch[1].trim() : '1.0.0',
        mainFile: phpFile
    };
}

/**
 * Create ZIP archive using system zip command
 */
function createZipArchive(projectPath, outputPath, files, pluginName) {
    const tempDir = path.join(projectPath, '.wp-build-temp');
    const pluginDir = path.join(tempDir, pluginName);
    
    // Clean up temp directory if exists
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
    }
    
    // Create temp structure
    fs.mkdirSync(pluginDir, { recursive: true });
    
    // Copy files to temp directory
    for (const file of files) {
        const destPath = path.join(pluginDir, file.relativePath);
        const destDir = path.dirname(destPath);
        
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(file.fullPath, destPath);
    }
    
    // Remove existing zip if exists
    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }
    
    // Create ZIP using system command
    try {
        const cwd = tempDir;
        execSync(`zip -r "${outputPath}" "${pluginName}"`, { 
            cwd, 
            stdio: 'pipe' 
        });
    } catch (error) {
        // Fallback: try using tar on systems without zip
        try {
            execSync(`tar -czf "${outputPath.replace('.zip', '.tar.gz')}" -C "${tempDir}" "${pluginName}"`, {
                stdio: 'pipe'
            });
            console.log(colors.yellow('⚠️  Created .tar.gz instead (zip command not available)'));
        } catch (tarError) {
            throw new Error('Could not create archive. Please install zip or tar.');
        }
    }
    
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true });
    
    return outputPath;
}

/**
 * Format file size
 */
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Main build function
 */
async function buildZip() {
    console.log('\n' + colors.cyan('╔═══════════════════════════════════════════════════════════╗'));
    console.log(colors.cyan('║') + '  ' + colors.bold(colors.green('📦 WordPress Plugin ZIP Builder')) + '                         ' + colors.cyan('║'));
    console.log(colors.cyan('╚═══════════════════════════════════════════════════════════╝') + '\n');
    
    const projectPath = process.cwd();
    
    // Check if dist folder exists
    const distPath = path.join(projectPath, 'dist');
    if (!fs.existsSync(distPath)) {
        console.log(colors.red('❌ Error: dist/ folder not found!'));
        console.log(colors.yellow('   Run "npm run build" first to create production assets.\n'));
        process.exit(1);
    }
    
    // Get plugin info
    const pluginInfo = getPluginInfo(projectPath);
    console.log(colors.cyan('📋 Plugin:  ') + pluginInfo.name);
    console.log(colors.cyan('📌 Version: ') + pluginInfo.version);
    
    // Parse ignore patterns
    const patterns = parseWpIgnore(projectPath);
    console.log(colors.cyan('🚫 Ignoring ') + patterns.length + ' patterns from .wpignore\n');
    
    // Get files to include
    const files = getIncludedFiles(projectPath, projectPath, patterns);
    console.log(colors.cyan('📁 Including ') + files.length + ' files\n');
    
    // Generate output filename
    const pluginSlug = path.basename(projectPath);
    const zipFilename = `${pluginSlug}-${pluginInfo.version}.zip`;
    const outputPath = path.join(projectPath, zipFilename);
    
    // Create ZIP
    console.log(colors.gray('Creating archive...'));
    
    try {
        createZipArchive(projectPath, outputPath, files, pluginSlug);
        
        const stats = fs.statSync(outputPath);
        
        console.log('\n' + colors.green('✅ ZIP archive created successfully!'));
        console.log(colors.cyan('   📦 ') + zipFilename);
        console.log(colors.cyan('   📊 ') + formatSize(stats.size));
        console.log(colors.cyan('   📂 ') + outputPath);
        
        console.log('\n' + colors.gray('Upload this file to WordPress via:'));
        console.log(colors.gray('   Plugins → Add New → Upload Plugin\n'));
        
    } catch (error) {
        console.log(colors.red('\n❌ Error creating ZIP: ') + error.message);
        process.exit(1);
    }
}

// Run
buildZip();
