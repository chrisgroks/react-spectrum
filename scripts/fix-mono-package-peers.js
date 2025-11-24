#!/usr/bin/env node

/**
 * Script to add peer dependencies to mono-packages so they satisfy their component dependencies
 */

const fs = require('fs');
const path = require('path');

const MONO_PACKAGES = [
  'packages/react-aria/package.json',
  'packages/react-stately/package.json',
  'packages/@adobe/react-spectrum/package.json',
  'packages/react-aria-components/package.json'
];

const SINGLETON_PACKAGES = {
  '@react-types/shared': '^3.32.1',
  '@react-aria/utils': '^3.31.0',
  '@react-aria/ssr': '^3.9.10',
  '@react-stately/utils': '^3.10.8',
  '@react-stately/flags': '^3.1.2',
  '@internationalized/string': '^3.2.7',
  '@internationalized/date': '^3.10.0',
  '@internationalized/number': '^3.6.5'
};

function addPeerDepsToMonoPackages() {
  for (const pkgPath of MONO_PACKAGES) {
    const fullPath = path.join(process.cwd(), pkgPath);
    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    console.log(`\n📦 Processing ${pkg.name}...`);
    
    // Ensure all singleton packages are in peerDependencies
    let modified = false;
    for (const [depName, depVersion] of Object.entries(SINGLETON_PACKAGES)) {
      if (!pkg.peerDependencies[depName]) {
        pkg.peerDependencies[depName] = depVersion;
        console.log(`  ✅ Added ${depName}: ${depVersion}`);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`  💾 Saved ${pkgPath}`);
    } else {
      console.log(`  ℹ️  No changes needed`);
    }
  }
}

addPeerDepsToMonoPackages();
console.log('\n✨ Done!');
