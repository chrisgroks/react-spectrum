# Internal Dependencies to Peer Dependencies Migration

## Overview

This document describes the changes made to address [GitHub Issue #8777](https://github.com/adobe/react-spectrum/issues/8777) - preventing duplicate package installations in consumer applications.

## Problem Statement

When using React Aria packages, consumers frequently encountered duplicate package installations due to the way internal dependencies were managed. Specifically:

1. Meta-packages (`react-aria`, `react-stately`, `react-aria-components`) used caret ranges (`^`) for internal dependencies
2. When a new version of an internal package was released with updated peer dependencies, the caret range allowed it to be installed
3. This caused multiple versions of singleton packages (like `@react-types/shared`, `@react-aria/utils`) to be installed
4. Multiple instances broke type overrides and singleton behavior (e.g., `RouterProvider`)

### Example Scenario

```json
// Consumer's package.json
"dependencies": {
  "@react-types/shared": "3.31.0",
  "react-aria": "3.42.0"
}

// react-aria's package.json (before fix)
"dependencies": {
  "@react-aria/breadcrumbs": "^3.5.27"  // Caret range
}

// @react-aria/breadcrumbs@3.5.28 released with:
"peerDependencies": {
  "@react-types/shared": "^3.32.0"
}

// Result: Both @react-types/shared@3.31.0 AND 3.32.0 installed!
```

## Solution

Convert internal monorepo dependencies in meta-packages from regular `dependencies` to `peerDependencies`. This ensures:

1. **True Singleton Behavior**: Only one version of each internal package can be installed
2. **Consumer Control**: Consumers explicitly choose which versions to install
3. **No Surprise Updates**: Caret ranges no longer cause unexpected version bumps
4. **Type Safety**: Type overrides work correctly with a single consistent version

## Changes Made

### Packages Modified

1. **react-aria** (`packages/react-aria/package.json`)
   - Moved 38 internal `@react-aria/*` packages to `peerDependencies`

2. **react-stately** (`packages/react-stately/package.json`)
   - Moved 25 internal `@react-stately/*` packages to `peerDependencies`

3. **react-aria-components** (`packages/react-aria-components/package.json`)
   - Moved 20 internal packages to `peerDependencies`

### What Changed

**Before:**
```json
{
  "dependencies": {
    "@react-aria/breadcrumbs": "^3.5.29",
    "@react-aria/button": "^3.14.2"
  },
  "peerDependencies": {
    "@react-types/shared": "^3.32.1",
    "react": "^16.8.0 || ^17.0.0-rc.1 || ^18.0.0 || ^19.0.0-rc.1"
  }
}
```

**After:**
```json
{
  "dependencies": {},
  "peerDependencies": {
    "@react-aria/breadcrumbs": "^3.5.29",
    "@react-aria/button": "^3.14.2",
    "@react-types/shared": "^3.32.1",
    "react": "^16.8.0 || ^17.0.0-rc.1 || ^18.0.0 || ^19.0.0-rc.1"
  }
}
```

## Migration Guide for Consumers

### NPM and PNPM Users

Modern package managers (npm v7+, pnpm v6+) automatically install peer dependencies. **No changes required** for most users.

If you see warnings about missing peer dependencies:
```bash
npm install --legacy-peer-deps  # Install missing peers automatically
```

### Yarn v2+ (Berry) Users

Yarn v2+ requires explicit declaration of peer dependencies in your `package.json`. You have two options:

#### Option 1: Auto-install with pnpm mode
```yaml
# .yarnrc.yml
nodeLinker: pnpm
```

#### Option 2: Explicit declaration
When installing `react-aria`, add all its peer dependencies to your `package.json`:

```json
{
  "dependencies": {
    "react-aria": "^3.44.0",
    "@react-aria/breadcrumbs": "^3.5.29",
    "@react-aria/button": "^3.14.2",
    // ... (see react-aria's peerDependencies for full list)
  }
}
```

**Tip**: Use the provided helper script:
```bash
node scripts/list-peer-deps.js react-aria
```

### Existing Projects

If you're upgrading from an older version:

1. **Remove resolutions** (if you were using them to fix duplicates):
   ```json
   // Remove these from package.json
   "resolutions": {
     "@react-types/shared": "3.31.0"
   }
   ```

2. **Clean and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json  # or yarn.lock
   npm install  # or yarn install
   ```

3. **Verify no duplicates**:
   ```bash
   npm ls @react-types/shared  # Should show only one version
   ```

## Benefits

### ✅ Prevents Duplicate Installations
Peer dependencies ensure only one version of each package is installed.

### ✅ Fixes Type Override Issues
Module augmentation and type overrides work correctly with singleton packages.

### ✅ Maintains Singleton Behavior
Packages like `@react-aria/utils` that use singleton patterns (e.g., `RouterProvider`) work correctly.

### ✅ Explicit Versioning
Consumers have full control over which versions are installed.

### ✅ Better Debugging
No more mysterious bugs from multiple package versions interacting.

## Backward Compatibility

### Breaking Change: Yarn v2+ Users Only

This is a **minor breaking change** for Yarn v2+ (Berry) users, who must now explicitly list peer dependencies.

For all other package managers (npm, pnpm, yarn v1), behavior is **fully backward compatible** with automatic peer dependency installation.

### Migration Timeline

1. **v3.44.0+**: Peer dependencies model introduced
2. Consumers can migrate at their convenience
3. Future versions will continue using peer dependencies

## Testing

Verify the changes work correctly:

```bash
# Build the packages
make build

# Run tests
yarn test

# Check for peer dependency warnings
npm ls
```

## Related Issues

- [#8777 - Make internal package references strict (or peer dependencies)](https://github.com/adobe/react-spectrum/issues/8777)
- [#6326 - Pin dependency versions on release](https://github.com/adobe/react-spectrum/issues/6326)
- [#7946 - Unmanageable dependency versions](https://github.com/adobe/react-spectrum/issues/7946)
- [#7644 - peerDependency issue with multiple react-aria packages](https://github.com/adobe/react-spectrum/issues/7644)

## Additional Resources

- [Peer Dependencies Documentation](https://nodejs.org/en/blog/npm/peer-dependencies/)
- [NPM Peer Dependencies](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#peerdependencies)
- [Yarn Peer Dependencies](https://yarnpkg.com/configuration/manifest#peerDependencies)
