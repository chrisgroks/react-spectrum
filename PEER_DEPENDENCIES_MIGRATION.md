# Peer Dependencies Migration

## Overview

This document describes the migration of internal monorepo dependencies from regular `dependencies` to `peerDependencies`. This change addresses issue #8777 where duplicate package installations were causing type override failures and breaking singleton behavior.

## Problem Statement

Previously, internal packages used caret ranges (e.g., `"^3.5.27"`) in their `dependencies` field when referencing other internal packages. This caused several issues:

1. **Duplicate Installations**: When consuming applications pinned specific versions, package managers could install multiple versions of the same package (e.g., both `@react-types/shared@3.31.0` and `@react-types/shared@3.32.0`)

2. **Broken Type Overrides**: Module augmentation and type overrides didn't work correctly when multiple versions were installed, as the types weren't merged across versions

3. **Singleton Violations**: Packages that depend on singleton behavior (like `@react-aria/utils` with `RouterProvider`) would break when multiple instances were loaded

## Solution

Convert all internal monorepo dependencies to peer dependencies, ensuring true singleton behavior.

### What Changed

- All `@react-aria/*` packages now declare their internal dependencies as `peerDependencies`
- All `@react-stately/*` packages now declare their internal dependencies as `peerDependencies`
- All `@react-types/*` packages now declare their internal dependencies as `peerDependencies`
- All `@react-spectrum/*` packages now declare their internal dependencies as `peerDependencies`
- All `@internationalized/*` packages now declare their internal dependencies as `peerDependencies`

### What Didn't Change

- **Umbrella packages** (`react-aria`, `react-stately`, `react-aria-components`, `@adobe/react-spectrum`) still use regular `dependencies` for their re-exported packages
- External dependencies (like `@swc/helpers`, `clsx`) remain in `dependencies`
- React and react-dom remain as `peerDependencies` (no change)

## Benefits

1. **True Singleton Behavior**: Only one version of each internal package will be installed in consuming applications
2. **Consistent Types**: Type augmentation and module declarations work correctly
3. **Predictable Upgrades**: Consuming applications have explicit control over which versions of internal packages are used
4. **Smaller Bundle Sizes**: No duplicate code from multiple versions of the same package

## For Package Consumers

### What You Need to Know

#### Using Package Managers

- **npm** (v7+) and **pnpm** will auto-install peer dependencies by default
- **yarn** (v3+) will install peer dependencies automatically but may show warnings

#### If You See Warnings

You may see warnings like:
```
YN0002: │ your-package doesn't provide @react-aria/utils (p12345), requested by @react-aria/button
```

These warnings are informational. The package manager is still installing the peer dependencies. However, if you want to silence them, you can explicitly add the peer dependencies to your `package.json`:

```json
{
  "dependencies": {
    "react-aria-components": "^1.9.0",
    "@react-aria/utils": "^3.31.0"
  }
}
```

#### Yarn Resolutions (Optional)

If you need to pin specific versions across your entire dependency tree, you can use Yarn's `resolutions` field:

```json
{
  "resolutions": {
    "@react-types/shared": "3.31.0",
    "@react-aria/utils": "3.31.0"
  }
}
```

However, this is now less necessary since peer dependencies already provide version control.

## Migration Script

A migration script is available at `scripts/convertToPeerDependencies.mjs` that automated this conversion. Key features:

- Identifies all internal packages by scope
- Moves internal dependencies to `peerDependencies`
- Preserves external dependencies in `dependencies`
- Skips umbrella packages that need to re-export their dependencies
- Sorts peer dependencies alphabetically for consistency

## Testing

The migration has been tested to ensure:

- ✅ Yarn install completes successfully (with informational warnings)
- ✅ All packages can be built
- ✅ Test suites can be executed
- ✅ Peer dependencies are correctly resolved in the monorepo

## Related Issues

- #8777 - Original issue describing the duplicate package problem
- #6326 - Pin dependency versions on release
- #7946 - Unmanageable dependency versions
- #7644 - peerDependency issue with multiple react-aria packages

## Future Considerations

As mentioned in the issue discussion, the team is also considering:

1. Merging all code into a single (or fewer) packages to simplify dependency management
2. Automated warnings/scripts to detect duplicate installations
3. Post-install hooks to help users identify and resolve duplicate packages

This peer dependency migration is a stepping stone toward better dependency management and can coexist with those future improvements.
