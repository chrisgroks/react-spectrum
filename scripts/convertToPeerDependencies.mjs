#!/usr/bin/env node

/**
 * Script to convert internal monorepo dependencies to peer dependencies
 * This solves the duplicate package installation issue described in #8777
 * 
 * This script:
 * 1. Identifies all internal packages (@react-aria/*, @react-stately/*, @react-types/*, @internationalized/*, @react-spectrum/*)
 * 2. Converts internal package references from dependencies to peerDependencies
 * 3. Keeps external dependencies (like @swc/helpers, clsx, etc.) in dependencies
 * 4. Preserves existing peerDependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

// Internal package scopes that should be treated as peer dependencies
const INTERNAL_SCOPES = [
  '@react-aria/',
  '@react-stately/',
  '@react-types/',
  '@internationalized/',
  '@react-spectrum/',
  '@spectrum-icons/'
];

// External dependencies that should remain in dependencies
const EXTERNAL_DEPENDENCIES = [
  '@swc/helpers',
  'clsx',
  'intl-messageformat',
  'tslib'
];

// Umbrella packages that re-export many sub-packages
// These should keep their internal dependencies as regular dependencies
const UMBRELLA_PACKAGES = [
  'react-aria',
  'react-stately',
  'react-aria-components',
  '@react-spectrum/s2',
  '@adobe/react-spectrum'
];

/**
 * Check if a package name is an internal monorepo package
 */
function isInternalPackage(packageName) {
  return INTERNAL_SCOPES.some(scope => packageName.startsWith(scope));
}

/**
 * Check if a package name is an external dependency
 */
function isExternalDependency(packageName) {
  return EXTERNAL_DEPENDENCIES.includes(packageName) || !isInternalPackage(packageName);
}

/**
 * Find all package.json files in the monorepo
 */
function findPackageJsonFiles(dir) {
  const packageJsonFiles = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and dist directories
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          traverse(fullPath);
        }
      } else if (entry.name === 'package.json') {
        packageJsonFiles.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return packageJsonFiles;
}

/**
 * Convert dependencies to peer dependencies for a single package.json
 */
function convertPackageJson(packageJsonPath) {
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(content);
  
  // Skip if this is the root package.json or doesn't have a name
  if (!pkg.name || packageJsonPath === path.join(ROOT_DIR, 'package.json')) {
    return { updated: false, packageName: pkg.name || 'root' };
  }
  
  // Skip non-internal packages (like workspace packages without internal scope)
  if (!isInternalPackage(pkg.name)) {
    return { updated: false, packageName: pkg.name };
  }
  
  // Skip umbrella packages - they need to keep internal deps as regular dependencies
  if (UMBRELLA_PACKAGES.includes(pkg.name)) {
    return { updated: false, packageName: pkg.name, skipped: true, reason: 'umbrella package' };
  }
  
  let updated = false;
  const changes = [];
  
  // Initialize peerDependencies if it doesn't exist
  if (!pkg.peerDependencies) {
    pkg.peerDependencies = {};
  }
  
  // Process dependencies
  if (pkg.dependencies) {
    const newDependencies = {};
    
    for (const [depName, depVersion] of Object.entries(pkg.dependencies)) {
      if (isInternalPackage(depName)) {
        // Move internal dependency to peerDependencies
        if (!pkg.peerDependencies[depName]) {
          pkg.peerDependencies[depName] = depVersion;
          changes.push(`  ${depName}: ${depVersion} (dependencies -> peerDependencies)`);
          updated = true;
        }
        // Don't add to newDependencies (effectively removing from dependencies)
      } else {
        // Keep external dependencies
        newDependencies[depName] = depVersion;
      }
    }
    
    // Update dependencies with only external ones
    if (Object.keys(newDependencies).length > 0) {
      pkg.dependencies = newDependencies;
    } else {
      // Remove dependencies field if empty
      delete pkg.dependencies;
    }
  }
  
  // Sort peerDependencies for consistency
  if (pkg.peerDependencies && Object.keys(pkg.peerDependencies).length > 0) {
    const sorted = {};
    Object.keys(pkg.peerDependencies).sort().forEach(key => {
      sorted[key] = pkg.peerDependencies[key];
    });
    pkg.peerDependencies = sorted;
  }
  
  // Write back the updated package.json if changes were made
  if (updated) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✅ Updated ${pkg.name}:`);
    changes.forEach(change => console.log(change));
  }
  
  return { updated, packageName: pkg.name, changes };
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Finding all package.json files...\n');
  const packageJsonFiles = findPackageJsonFiles(PACKAGES_DIR);
  console.log(`Found ${packageJsonFiles.length} package.json files\n`);
  
  console.log('🔄 Converting internal dependencies to peer dependencies...\n');
  
  let updatedCount = 0;
  const results = [];
  
  for (const packageJsonPath of packageJsonFiles) {
    const result = convertPackageJson(packageJsonPath);
    if (result.updated) {
      updatedCount++;
      results.push(result);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n✨ Conversion complete!`);
  console.log(`   Updated ${updatedCount} out of ${packageJsonFiles.length} packages\n`);
  
  if (updatedCount > 0) {
    console.log('📋 Summary of changes:');
    console.log(`   - Internal dependencies moved to peerDependencies`);
    console.log(`   - External dependencies kept in dependencies`);
    console.log(`   - This ensures singleton behavior for internal packages\n`);
  }
  
  return updatedCount;
}

// Run the script
try {
  const updatedCount = main();
  process.exit(updatedCount > 0 ? 0 : 1);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
