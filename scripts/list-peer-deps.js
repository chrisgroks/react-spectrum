#!/usr/bin/env node

/**
 * Helper script to list all peer dependencies for a given package
 * Useful for Yarn v2+ users who need to explicitly declare peer deps
 */

const fs = require('fs');
const path = require('path');

const packageName = process.argv[2];

if (!packageName) {
  console.error('Usage: node scripts/list-peer-deps.js <package-name>');
  console.error('Example: node scripts/list-peer-deps.js react-aria');
  process.exit(1);
}

// Map short names to full paths
const packagePaths = {
  'react-aria': 'packages/react-aria/package.json',
  'react-stately': 'packages/react-stately/package.json',
  'react-aria-components': 'packages/react-aria-components/package.json'
};

const packagePath = packagePaths[packageName] || `packages/${packageName}/package.json`;
const fullPath = path.join(process.cwd(), packagePath);

if (!fs.existsSync(fullPath)) {
  console.error(`Package not found: ${packagePath}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
const peerDeps = pkg.peerDependencies || {};

console.log(`\nPeer dependencies for ${pkg.name}@${pkg.version}:\n`);
console.log('Add these to your package.json dependencies:\n');
console.log(JSON.stringify(peerDeps, null, 2));

console.log('\n\nOr copy this snippet:\n');
Object.entries(peerDeps).forEach(([name, version]) => {
  console.log(`    "${name}": "${version}",`);
});

console.log(`\nTotal peer dependencies: ${Object.keys(peerDeps).length}\n`);
