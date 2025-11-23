#!/usr/bin/env node

/**
 * Script to convert internal React Spectrum dependencies to peerDependencies
 * 
 * This solves the issue where internal package dependencies using version ranges
 * cause duplicate package installations in consumers' node_modules, breaking
 * type overrides and singleton behavior.
 * 
 * See: https://github.com/adobe/react-spectrum/issues/8777
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Define the internal package prefixes that should be converted to peerDependencies
const INTERNAL_PREFIXES = [
  '@react-aria/',
  '@react-stately/',
  '@react-types/',
  '@react-spectrum/',
  '@internationalized/'
];

// Packages that should remain as regular dependencies (e.g., external packages)
const EXTERNAL_PACKAGES = [
  '@swc/helpers',
  'clsx',
  'intl-messageformat'
];

/**
 * Check if a package name is an internal React Spectrum package
 */
function isInternalPackage(packageName) {
  return INTERNAL_PREFIXES.some(prefix => packageName.startsWith(prefix));
}

/**
 * Check if a package should remain as a regular dependency
 */
function shouldRemainAsDependency(packageName) {
  return EXTERNAL_PACKAGES.includes(packageName);
}

/**
 * Find all package.json files in the monorepo
 */
function findPackageJsonFiles(dir) {
  const packageJsonFiles = [];
  
  function walk(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and hidden directories
        if (file !== 'node_modules' && file !== 'dist' && !file.startsWith('.')) {
          walk(filePath);
        }
      } else if (file === 'package.json') {
        packageJsonFiles.push(filePath);
      }
    }
  }
  
  walk(dir);
  return packageJsonFiles;
}

/**
 * Convert internal dependencies to peerDependencies in a package.json
 */
function convertDependencies(packageJsonPath) {
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(content);
  
  // Skip the root package.json
  if (pkg.private && pkg.name === 'react-spectrum-monorepo') {
    return { modified: false };
  }
  
  let modified = false;
  const changes = [];
  
  if (pkg.dependencies) {
    const newDependencies = {};
    const newPeerDependencies = pkg.peerDependencies || {};
    
    for (const [depName, depVersion] of Object.entries(pkg.dependencies)) {
      if (isInternalPackage(depName) && !shouldRemainAsDependency(depName)) {
        // Move to peerDependencies
        newPeerDependencies[depName] = depVersion;
        modified = true;
        changes.push(`  ${depName}: dependencies -> peerDependencies`);
      } else {
        // Keep as regular dependency
        newDependencies[depName] = depVersion;
      }
    }
    
    // Update the package
    if (modified) {
      if (Object.keys(newDependencies).length > 0) {
        pkg.dependencies = newDependencies;
      } else {
        delete pkg.dependencies;
      }
      
      // Sort peerDependencies alphabetically
      const sortedPeerDeps = {};
      Object.keys(newPeerDependencies).sort().forEach(key => {
        sortedPeerDeps[key] = newPeerDependencies[key];
      });
      pkg.peerDependencies = sortedPeerDeps;
    }
  }
  
  if (modified) {
    // Write back with proper formatting
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✓ Modified: ${path.relative(rootDir, packageJsonPath)}`);
    changes.forEach(change => console.log(change));
  }
  
  return { modified, changes };
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Finding all package.json files...\n');
  
  const packagesDir = path.join(rootDir, 'packages');
  const packageJsonFiles = findPackageJsonFiles(packagesDir);
  
  console.log(`📦 Found ${packageJsonFiles.length} package.json files\n`);
  console.log('🔄 Converting internal dependencies to peerDependencies...\n');
  
  let modifiedCount = 0;
  const results = [];
  
  for (const packageJsonPath of packageJsonFiles) {
    const result = convertDependencies(packageJsonPath);
    if (result.modified) {
      modifiedCount++;
      results.push({
        path: packageJsonPath,
        changes: result.changes
      });
    }
  }
  
  console.log(`\n✅ Conversion complete!`);
  console.log(`   Modified: ${modifiedCount} packages`);
  console.log(`   Unchanged: ${packageJsonFiles.length - modifiedCount} packages`);
  
  if (modifiedCount > 0) {
    console.log('\n📋 Summary of changes:');
    console.log('   - Internal dependencies (@react-aria/*, @react-stately/*, @react-types/*, etc.)');
    console.log('     have been moved from dependencies to peerDependencies');
    console.log('   - External dependencies (@swc/helpers, clsx, etc.) remain as dependencies');
    console.log('   - This ensures singleton behavior and prevents duplicate installations');
  }
}

// Run the script
main();
