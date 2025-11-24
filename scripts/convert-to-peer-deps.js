#!/usr/bin/env node
/**
 * Script to convert internal package dependencies to peer dependencies
 * This addresses issue #8777 where version ranges cause duplicate installations
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Singleton packages that should always be peer dependencies
// These are packages that should have exactly one instance in node_modules
const SINGLETON_PACKAGES = new Set([
  '@react-types/shared',
  '@react-aria/utils',
  '@react-aria/ssr',
  '@react-stately/utils',
  '@internationalized/string',
  '@internationalized/date',
  '@internationalized/number',
  '@internationalized/message',
]);

// All internal package prefixes
const INTERNAL_PREFIXES = [
  '@react-aria/',
  '@react-types/',
  '@react-stately/',
  '@internationalized/',
];

function isInternalPackage(packageName) {
  return INTERNAL_PREFIXES.some(prefix => packageName.startsWith(prefix));
}

function isSingletonPackage(packageName) {
  return SINGLETON_PACKAGES.has(packageName);
}

// Convert ALL internal dependencies to peer dependencies for true singleton behavior
// This ensures consumers install these packages once at the root level
function shouldConvertToPeer(packageName, currentPackageName) {
  // Don't convert if it's the same package (self-reference)
  if (packageName === currentPackageName) {
    return false;
  }
  
  // Convert all internal packages to peer dependencies
  return isInternalPackage(packageName);
}

function findPackageJsonFiles() {
  return glob.sync('packages/**/package.json', { 
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**']
  });
}

function convertDependenciesToPeerDependencies(packagePath) {
  const content = fs.readFileSync(packagePath, 'utf8');
  const pkg = JSON.parse(content);
  let modified = false;

  if (!pkg.dependencies) {
    return false;
  }

  // Initialize peerDependencies if it doesn't exist
  if (!pkg.peerDependencies) {
    pkg.peerDependencies = {};
  }

  // Convert singleton internal dependencies to peer dependencies
  // Focus on packages that are true singletons (shared utilities, types, etc.)
  const depsToMove = [];
  Object.keys(pkg.dependencies).forEach(dep => {
    if (isInternalPackage(dep) && isSingletonPackage(dep)) {
      depsToMove.push(dep);
    }
  });

  if (depsToMove.length === 0) {
    return false;
  }

  // Move dependencies to peerDependencies
  depsToMove.forEach(dep => {
    const version = pkg.dependencies[dep];
    
    // If it already exists in peerDependencies, merge versions (use the broader range)
    if (pkg.peerDependencies[dep]) {
      // Keep existing peer dependency version
      console.log(`  ${dep}: already in peerDependencies, keeping existing version`);
    } else {
      pkg.peerDependencies[dep] = version;
    }
    
    // Remove from dependencies
    delete pkg.dependencies[dep];
    modified = true;
  });

  // Clean up empty dependencies object
  if (Object.keys(pkg.dependencies).length === 0) {
    delete pkg.dependencies;
  }

  if (modified) {
    // Write back with proper formatting
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  return modified;
}

function main() {
  console.log('Converting singleton internal dependencies to peer dependencies...\n');
  console.log('This ensures singleton behavior and prevents duplicate installations.\n');
  console.log('Singleton packages:', Array.from(SINGLETON_PACKAGES).join(', '));
  console.log('');

  const packageFiles = findPackageJsonFiles();
  let modifiedCount = 0;
  const modifiedPackages = [];

  packageFiles.forEach(pkgPath => {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (!pkg.name) {
        return;
      }

      if (convertDependenciesToPeerDependencies(pkgPath)) {
        modifiedCount++;
        modifiedPackages.push(pkg.name || path.relative(process.cwd(), pkgPath));
        console.log(`✓ Modified: ${pkg.name || pkgPath}`);
      }
    } catch (error) {
      console.error(`Error processing ${pkgPath}:`, error.message);
    }
  });

  console.log(`\n✓ Conversion complete!`);
  console.log(`  Modified ${modifiedCount} packages`);
  
  if (modifiedPackages.length > 0) {
    console.log('\nModified packages:');
    modifiedPackages.forEach(pkg => console.log(`  - ${pkg}`));
  }
}

if (require.main === module) {
  main();
}

module.exports = { convertDependenciesToPeerDependencies, isSingletonPackage };
