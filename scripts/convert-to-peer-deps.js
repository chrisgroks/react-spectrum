#!/usr/bin/env node

/**
 * Script to convert internal monorepo dependencies to peer dependencies
 * This addresses issue #8777 by ensuring singleton packages behave as singletons
 */

const fs = require('fs');
const path = require('path');
const glob = require('fast-glob');

// Packages that should be treated as singletons (peer dependencies)
const SINGLETON_PACKAGES = [
  '@react-types/shared',
  '@react-aria/utils',
  '@react-aria/ssr',
  '@react-stately/utils',
  '@react-stately/flags',
  '@internationalized/string',
  '@internationalized/date',
  '@internationalized/number'
];

// Mono-packages that aggregate other packages
const MONO_PACKAGES = [
  'react-aria',
  'react-stately',
  '@adobe/react-spectrum',
  'react-aria-components'
];

async function main() {
  console.log('🔍 Finding all package.json files...');
  const packageFiles = await glob('packages/**/package.json', {
    ignore: ['**/node_modules/**', '**/dist/**']
  });

  console.log(`📦 Found ${packageFiles.length} packages\n`);

  let modifiedCount = 0;
  const changes = [];

  for (const pkgFile of packageFiles) {
    const fullPath = path.join(process.cwd(), pkgFile);
    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    // Skip private packages
    if (pkg.private) continue;

    let modified = false;
    const pkgChanges = {
      name: pkg.name,
      file: pkgFile,
      changes: []
    };

    // Check dependencies
    if (pkg.dependencies) {
      const depsToMove = {};
      
      for (const [depName, depVersion] of Object.entries(pkg.dependencies)) {
        // Move singleton packages to peer dependencies
        if (SINGLETON_PACKAGES.includes(depName)) {
          depsToMove[depName] = depVersion;
        }
      }

      if (Object.keys(depsToMove).length > 0) {
        // Initialize peerDependencies if it doesn't exist
        if (!pkg.peerDependencies) {
          pkg.peerDependencies = {};
        }

        // Move dependencies to peerDependencies
        for (const [depName, depVersion] of Object.entries(depsToMove)) {
          // Remove from dependencies
          delete pkg.dependencies[depName];
          
          // Add to peerDependencies if not already there
          if (!pkg.peerDependencies[depName]) {
            pkg.peerDependencies[depName] = depVersion;
            pkgChanges.changes.push(`  ${depName}: ${depVersion} → peerDependencies`);
            modified = true;
          }
        }

        // Clean up empty dependencies object
        if (Object.keys(pkg.dependencies).length === 0) {
          delete pkg.dependencies;
        }
      }
    }

    if (modified) {
      // Write back the modified package.json
      fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
      modifiedCount++;
      changes.push(pkgChanges);
      console.log(`✅ Modified: ${pkg.name}`);
      pkgChanges.changes.forEach(change => console.log(change));
      console.log('');
    }
  }

  console.log(`\n✨ Summary: Modified ${modifiedCount} packages`);
  
  if (changes.length > 0) {
    console.log('\n📋 Detailed changes:');
    changes.forEach(({ name, file, changes: pkgChanges }) => {
      console.log(`\n${name} (${file}):`);
      pkgChanges.forEach(change => console.log(change));
    });
  }

  console.log('\n⚠️  Important notes:');
  console.log('1. Consumers using npm/pnpm will auto-install peer dependencies');
  console.log('2. Consumers using Yarn will need to explicitly declare peer dependencies');
  console.log('3. This ensures singleton packages truly behave as singletons');
  console.log('4. Run `yarn install` to update lockfiles');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
