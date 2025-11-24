#!/usr/bin/env node

/**
 * Script to convert internal monorepo dependencies to peer dependencies
 * Addresses GitHub issue #8777 - preventing duplicate package installations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.resolve(__dirname, '..');

// Internal package scopes that should be converted to peer dependencies
const INTERNAL_SCOPES = [
  '@react-aria/',
  '@react-stately/',
  '@react-types/',
  '@react-spectrum/',
  '@internationalized/'
];

// Packages that should always be singletons (high priority)
const SINGLETON_PACKAGES = [
  '@react-types/shared',
  '@react-aria/utils',
  '@react-aria/ssr',
  '@react-stately/utils',
  '@react-stately/flags'
];

let modifiedCount = 0;
let skippedCount = 0;
const errors = [];

/**
 * Check if a dependency is an internal monorepo package
 */
function isInternalDependency(depName) {
  return INTERNAL_SCOPES.some(scope => depName.startsWith(scope));
}

/**
 * Transform a package.json by moving internal dependencies to peerDependencies
 */
function transformPackageJson(packageJsonPath) {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);
    
    // Skip if no dependencies
    if (!pkg.dependencies || Object.keys(pkg.dependencies).length === 0) {
      return false;
    }
    
    let modified = false;
    const internalDeps = {};
    const externalDeps = {};
    
    // Separate internal and external dependencies
    for (const [depName, version] of Object.entries(pkg.dependencies)) {
      if (isInternalDependency(depName)) {
        internalDeps[depName] = version;
      } else {
        externalDeps[depName] = version;
      }
    }
    
    // If there are internal dependencies to move
    if (Object.keys(internalDeps).length > 0) {
      // Update dependencies to only have external packages
      pkg.dependencies = externalDeps;
      
      // If dependencies object is empty, remove it
      if (Object.keys(pkg.dependencies).length === 0) {
        delete pkg.dependencies;
      }
      
      // Initialize peerDependencies if it doesn't exist
      if (!pkg.peerDependencies) {
        pkg.peerDependencies = {};
      }
      
      // Add internal dependencies as peer dependencies
      // Keep existing peer dependencies (like react, react-dom)
      pkg.peerDependencies = {
        ...pkg.peerDependencies,
        ...internalDeps
      };
      
      // Sort peer dependencies alphabetically for consistency
      const sortedPeerDeps = {};
      Object.keys(pkg.peerDependencies).sort().forEach(key => {
        sortedPeerDeps[key] = pkg.peerDependencies[key];
      });
      pkg.peerDependencies = sortedPeerDeps;
      
      modified = true;
    }
    
    if (modified) {
      // Write back with proper formatting
      fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
      return true;
    }
    
    return false;
  } catch (error) {
    errors.push({ file: packageJsonPath, error: error.message });
    return false;
  }
}

/**
 * Recursively find all package.json files in a directory
 */
function findPackageJsonFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (item !== 'node_modules' && !item.startsWith('.')) {
        findPackageJsonFiles(fullPath, files);
      }
    } else if (item === 'package.json') {
      // Skip the root package.json
      if (fullPath !== path.join(WORKSPACE_ROOT, 'package.json')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Finding all package.json files in /workspace/packages...\n');
  
  const packagesDir = path.join(WORKSPACE_ROOT, 'packages');
  const packageJsonFiles = findPackageJsonFiles(packagesDir);
  
  console.log(`Found ${packageJsonFiles.length} package.json files\n`);
  console.log('🔄 Converting internal dependencies to peer dependencies...\n');
  
  for (const pkgPath of packageJsonFiles) {
    const relativePath = path.relative(WORKSPACE_ROOT, pkgPath);
    
    if (transformPackageJson(pkgPath)) {
      modifiedCount++;
      console.log(`✅ Modified: ${relativePath}`);
    } else {
      skippedCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Modified: ${modifiedCount} files`);
  console.log(`⏭️  Skipped:  ${skippedCount} files (no internal dependencies)`);
  
  if (errors.length > 0) {
    console.log(`❌ Errors:   ${errors.length} files`);
    console.log('\nErrors:');
    errors.forEach(({ file, error }) => {
      console.log(`  - ${path.relative(WORKSPACE_ROOT, file)}: ${error}`);
    });
    process.exit(1);
  }
  
  console.log('\n✨ Conversion complete!');
  console.log('\nNext steps:');
  console.log('  1. Run: yarn check-types');
  console.log('  2. Run: make build');
  console.log('  3. Run: yarn test');
}

main();
