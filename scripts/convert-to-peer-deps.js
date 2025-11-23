#!/usr/bin/env node

/**
 * Script to convert internal monorepo dependencies to peer dependencies.
 * This addresses issue #8777 by ensuring singleton behavior for internal packages.
 * 
 * The script:
 * 1. Identifies all internal packages (packages within the monorepo)
 * 2. For each package.json, moves internal dependencies to peerDependencies
 * 3. Maintains optionalDependencies for those that should be optional
 * 4. Preserves external dependencies in the dependencies field
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define the internal package scopes that should be treated as peers
const INTERNAL_SCOPES = [
  '@react-aria',
  '@react-stately',
  '@react-types',
  '@react-spectrum',
  '@internationalized',
  'react-aria',
  'react-stately',
  'react-aria-components'
];

// Packages that should remain as regular dependencies (build tools, etc.)
const EXCLUDE_FROM_CONVERSION = [
  '@swc/helpers',
  'clsx',
  '@adobe'  // Adobe internal packages
];

// Find all package.json files in the monorepo
const packageJsonPaths = glob.sync('packages/**/package.json', {
  ignore: ['**/node_modules/**', '**/dist/**']
});

console.log(`Found ${packageJsonPaths.length} package.json files to process`);

let modifiedCount = 0;
let errors = [];

function isInternalPackage(packageName) {
  // Check if package name starts with any internal scope
  return INTERNAL_SCOPES.some(scope => packageName === scope || packageName.startsWith(scope + '/'));
}

function shouldConvertToPeer(packageName) {
  // Don't convert if in exclude list
  if (EXCLUDE_FROM_CONVERSION.some(excluded => packageName.startsWith(excluded))) {
    return false;
  }
  return isInternalPackage(packageName);
}

function processPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const pkg = JSON.parse(content);
    
    let modified = false;
    
    // Initialize peerDependencies if it doesn't exist
    if (!pkg.peerDependencies) {
      pkg.peerDependencies = {};
    }
    
    // Process dependencies
    if (pkg.dependencies) {
      const newDependencies = {};
      
      for (const [depName, depVersion] of Object.entries(pkg.dependencies)) {
        if (shouldConvertToPeer(depName)) {
          // Move to peerDependencies
          pkg.peerDependencies[depName] = depVersion;
          modified = true;
          console.log(`  ${pkg.name}: ${depName} ${depVersion} -> peerDependencies`);
        } else {
          // Keep in dependencies
          newDependencies[depName] = depVersion;
        }
      }
      
      pkg.dependencies = newDependencies;
      
      // Remove dependencies field if empty
      if (Object.keys(pkg.dependencies).length === 0) {
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
    
    if (modified) {
      // Write back with proper formatting (2 spaces, newline at end)
      fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      modifiedCount++;
      return true;
    }
    
    return false;
  } catch (error) {
    errors.push({ file: filePath, error: error.message });
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all package.json files
console.log('\nProcessing package.json files...\n');

for (const pkgPath of packageJsonPaths) {
  processPackageJson(pkgPath);
}

console.log(`\n✅ Complete! Modified ${modifiedCount} package.json files`);

if (errors.length > 0) {
  console.error(`\n❌ Encountered ${errors.length} errors:`);
  errors.forEach(({ file, error }) => {
    console.error(`  - ${file}: ${error}`);
  });
  process.exit(1);
}

console.log('\n📝 Summary:');
console.log(`  - Total files scanned: ${packageJsonPaths.length}`);
console.log(`  - Files modified: ${modifiedCount}`);
console.log(`  - Files unchanged: ${packageJsonPaths.length - modifiedCount}`);
console.log('\n✨ Internal dependencies have been converted to peer dependencies');
console.log('   This ensures singleton behavior and prevents duplicate installations.');
