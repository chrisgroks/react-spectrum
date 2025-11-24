#!/usr/bin/env node

/**
 * Script to pin internal package dependencies to exact versions
 * This prevents unintended version drift and duplicate package installations
 * Related to: https://github.com/adobe/react-spectrum/issues/8777
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define internal package scopes that should be pinned
const INTERNAL_SCOPES = [
  '@react-aria/',
  '@react-stately/',
  '@react-types/',
  '@internationalized/'
];

// Packages that should remain with caret ranges (external dependencies)
const EXTERNAL_PACKAGES = [
  '@swc/helpers',
  'clsx',
  'tslib'
];

function shouldPinPackage(packageName) {
  return INTERNAL_SCOPES.some(scope => packageName.startsWith(scope));
}

function pinDependencies(pkgPath) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  let modified = false;

  // Process dependencies
  if (pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach(dep => {
      const version = pkg.dependencies[dep];
      // Only pin internal packages with caret ranges
      if (shouldPinPackage(dep) && version.startsWith('^')) {
        const pinnedVersion = version.substring(1); // Remove ^
        pkg.dependencies[dep] = pinnedVersion;
        modified = true;
        console.log(`  ${dep}: ${version} -> ${pinnedVersion}`);
      }
    });
  }

  // Process devDependencies
  if (pkg.devDependencies) {
    Object.keys(pkg.devDependencies).forEach(dep => {
      const version = pkg.devDependencies[dep];
      if (shouldPinPackage(dep) && version.startsWith('^')) {
        const pinnedVersion = version.substring(1);
        pkg.devDependencies[dep] = pinnedVersion;
        modified = true;
        console.log(`  ${dep}: ${version} -> ${pinnedVersion}`);
      }
    });
  }

  if (modified) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  return modified;
}

function main() {
  console.log('Pinning internal package dependencies...\n');

  // Find all package.json files in the monorepo
  const packagePaths = glob.sync('packages/{@react-aria,@react-stately,@react-types,@react-spectrum,@internationalized,react-aria,react-stately,react-aria-components,tailwindcss-react-aria-components}/*/package.json');

  // Also include top-level mono-packages
  packagePaths.push('packages/react-aria/package.json');
  packagePaths.push('packages/react-stately/package.json');
  packagePaths.push('packages/react-aria-components/package.json');

  let totalModified = 0;
  let totalPackages = 0;

  packagePaths.forEach(pkgPath => {
    if (!fs.existsSync(pkgPath)) return;

    totalPackages++;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`\nProcessing: ${pkg.name}`);

    if (pinDependencies(pkgPath)) {
      totalModified++;
    }
  });

  console.log(`\n\nSummary:`);
  console.log(`  Total packages processed: ${totalPackages}`);
  console.log(`  Packages modified: ${totalModified}`);
  console.log(`\nInternal dependencies have been pinned to exact versions.`);
  console.log('This prevents duplicate package installations and version drift.\n');
}

main();
