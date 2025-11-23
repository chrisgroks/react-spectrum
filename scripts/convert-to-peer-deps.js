#!/usr/bin/env node

/**
 * Script to convert internal package dependencies to peer dependencies
 * for meta-packages (react-aria, react-stately, react-aria-components)
 * 
 * This addresses issue #8777 by ensuring singleton behavior for internal packages
 */

const fs = require('fs');
const path = require('path');

// Meta-packages that should have their internal deps converted to peer deps
const META_PACKAGES = [
  'packages/react-aria/package.json',
  'packages/react-stately/package.json',
  'packages/react-aria-components/package.json'
];

// Internal package scopes that should be converted to peer dependencies
const INTERNAL_SCOPES = [
  '@react-aria/',
  '@react-stately/',
  '@react-types/',
  '@internationalized/'
];

function isInternalPackage(packageName) {
  return INTERNAL_SCOPES.some(scope => packageName.startsWith(scope)) ||
         packageName === 'react-aria' ||
         packageName === 'react-stately';
}

function convertPackage(packagePath) {
  console.log(`\nProcessing: ${packagePath}`);
  
  const fullPath = path.join(process.cwd(), packagePath);
  const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  
  if (!pkg.dependencies) {
    console.log('  No dependencies found');
    return;
  }
  
  const deps = pkg.dependencies;
  const peerDeps = pkg.peerDependencies || {};
  const movedDeps = [];
  
  // Find internal dependencies that should be moved to peer dependencies
  for (const [depName, depVersion] of Object.entries(deps)) {
    if (isInternalPackage(depName) && !peerDeps[depName]) {
      // Move from dependencies to peerDependencies
      peerDeps[depName] = depVersion;
      delete deps[depName];
      movedDeps.push(`${depName}: ${depVersion}`);
    }
  }
  
  if (movedDeps.length === 0) {
    console.log('  No internal dependencies to convert');
    return;
  }
  
  console.log(`  Moved ${movedDeps.length} dependencies to peerDependencies:`);
  movedDeps.forEach(dep => console.log(`    - ${dep}`));
  
  // Update the package.json with sorted peer dependencies
  pkg.peerDependencies = Object.keys(peerDeps)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = peerDeps[key];
      return sorted;
    }, {});
  
  // Write back to file
  fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log('  ✓ Updated package.json');
}

function main() {
  console.log('Converting internal dependencies to peer dependencies...\n');
  console.log('This addresses GitHub issue #8777: Duplicate package installations');
  console.log('Solution: Move internal monorepo dependencies to peerDependencies');
  console.log('=========================================================================');
  
  for (const packagePath of META_PACKAGES) {
    try {
      convertPackage(packagePath);
    } catch (error) {
      console.error(`Error processing ${packagePath}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n✓ All meta-packages updated successfully!');
  console.log('\nNext steps:');
  console.log('  1. Review the changes with: git diff');
  console.log('  2. Build the packages: make build');
  console.log('  3. Run tests: yarn test');
}

main();
