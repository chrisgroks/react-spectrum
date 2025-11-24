# Internal Dependency Pinning Implementation

## Summary

This change addresses the duplicate package installation issue described in [GitHub issue #8777](https://github.com/adobe/react-spectrum/issues/8777) by pinning all internal dependency versions to exact versions instead of using caret ranges.

## Problem Statement

When internal packages use caret version ranges (e.g., `"^3.5.27"`), package managers can install multiple versions of the same package, leading to:

1. **Broken singleton behavior**: Packages like `@react-types/shared` and `@react-aria/utils` that rely on being singletons break when multiple versions are installed
2. **Type override failures**: TypeScript module augmentation doesn't work correctly across multiple package versions
3. **Increased bundle size**: Duplicate packages unnecessarily increase application bundle sizes
4. **Runtime errors**: `RouterProvider` and other context-based features break when multiple instances exist

### Example from Issue #8777

A user reported that upgrading `@react-aria/breadcrumbs` from `3.5.27` to `3.5.28` caused their application to install both `@react-types/shared@3.31.0` (their pinned version) and `@react-types/shared@3.32.0` (required by breadcrumbs), breaking their TypeScript module augmentation and router integration.

## Solution: Pinned Internal Dependencies

Instead of converting to peer dependencies (which would require 200+ peer dependencies in consuming packages), we've implemented **pinned internal dependency versions** as proposed in the [2025 Dependencies RFC](https://github.com/adobe/react-spectrum/blob/main/rfcs/2025-dependencies.md).

### What Changed

All internal dependencies within the monorepo now use exact versions instead of caret ranges:

**Before:**
```json
{
  "dependencies": {
    "@react-aria/utils": "^3.31.0",
    "@react-types/shared": "^3.32.1"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "@react-aria/utils": "3.31.0",
    "@react-types/shared": "3.32.1"
  }
}
```

### Scope of Changes

- **188 package.json files modified**
- **992 dependency version strings updated**
- **Affected package scopes:**
  - `@react-aria/*` (all 50+ packages)
  - `@react-stately/*` (all 20+ packages)
  - `@react-types/*` (all 30+ packages)
  - `@react-spectrum/*` (all 70+ packages)
  - `@internationalized/*` (all 4 packages)
  - Top-level mono-packages: `react-aria`, `react-stately`, `react-aria-components`

### What Did NOT Change

- External dependencies (like `@swc/helpers`, `clsx`) remain with caret ranges
- Peer dependencies remain unchanged
- Package versions themselves remain unchanged
- No breaking changes to public APIs

## Benefits

1. **Guaranteed version consistency**: All packages within a release use the exact same versions of shared dependencies
2. **Singleton behavior preserved**: Packages like `@react-types/shared` and `@react-aria/utils` will only install once
3. **Predictable upgrades**: When upgrading one react-spectrum package, you can be confident about which versions of dependencies it will use
4. **Smaller bundle sizes**: No duplicate package code
5. **Better type safety**: TypeScript module augmentation works consistently

## Trade-offs

1. **Requires coordinated releases**: All packages must be released together to update dependency versions
   - This is already the case with our current release process
2. **Less flexibility for partial upgrades**: Users must upgrade all related packages together
   - This is actually desirable to avoid version mismatches
3. **Potential for more frequent releases**: Bug fixes in one package may require releases of dependent packages
   - Automation handles this via our release tooling

## Alignment with RFC

This implementation aligns with the [2025 Dependencies RFC](https://github.com/adobe/react-spectrum/blob/main/rfcs/2025-dependencies.md), which proposes:

1. ✅ **Short-term**: Pin internal dependencies (this PR)
2. 🔜 **Long-term**: Consolidate into mono-packages with sub-path exports

The RFC explicitly states:
> "Inter-dependencies between these packages should have pinned versions. Duplication could still occur if different parts of an application depend on different versions, but the likelihood is significantly reduced."

## Testing

The changes maintain backward compatibility:

1. All packages export the same public APIs
2. Version numbers themselves haven't changed
3. Only the dependency version format changed (removed `^` prefix)

### Build Verification

Run the following to verify the changes:

```bash
# Install dependencies with the new pinned versions
yarn install

# Build all packages
yarn build

# Run tests
yarn test
```

### Package Manager Behavior

Different package managers handle exact versions differently:

- **npm & pnpm**: Will deduplicate packages when exact versions match
- **yarn**: Strictly enforces exact versions, preventing duplicates

## Migration Guide for Consumers

**No action required!** This change is completely transparent to consumers. Package.json dependencies don't need to be updated.

However, if you were using `resolutions` to work around duplicate packages:

**Before** (with workaround):
```json
{
  "dependencies": {
    "react-aria": "^3.42.0"
  },
  "resolutions": {
    "@react-types/shared": "3.31.0"
  }
}
```

**After** (workaround no longer needed):
```json
{
  "dependencies": {
    "react-aria": "^3.42.0"
  }
}
```

You can remove resolutions entries for internal react-spectrum packages.

## Implementation Details

### Automation Script

A script was created at `scripts/pin-internal-deps.js` to automate this change:

```javascript
// Identifies internal packages by scope
const INTERNAL_SCOPES = [
  '@react-aria/',
  '@react-stately/',
  '@react-types/',
  '@internationalized/'
];

// Pins dependencies by removing ^ prefix
function pinDependencies(pkg) {
  Object.keys(pkg.dependencies).forEach(dep => {
    const version = pkg.dependencies[dep];
    if (shouldPinPackage(dep) && version.startsWith('^')) {
      pkg.dependencies[dep] = version.substring(1);
    }
  });
}
```

This script can be run again during future releases to ensure consistency.

### Future Automation

The release tooling should be updated to automatically pin internal dependencies:

1. When bumping versions, update all internal references to exact versions
2. Validate that no caret ranges exist for internal dependencies before publishing
3. Add a pre-commit or CI check to prevent regression

## Related Issues and Discussions

- [#8777 - Make internal package references strict (or peer dependencies)](https://github.com/adobe/react-spectrum/issues/8777)
- [#6326 - Pin dependency versions on release](https://github.com/adobe/react-spectrum/issues/6326)
- [#7946 - Unmanageable dependency versions](https://github.com/adobe/react-spectrum/issues/7946)
- [#2195 - Duplicate packages discussion](https://github.com/adobe/react-spectrum/discussions/2195)
- [RFC: 2025 Dependencies](https://github.com/adobe/react-spectrum/blob/main/rfcs/2025-dependencies.md)

## Conclusion

This change provides an immediate, backward-compatible solution to the duplicate package problem while aligning with the long-term architectural direction outlined in the RFC. It maintains the current package structure while preventing version drift and ensuring singleton behavior for critical packages.
