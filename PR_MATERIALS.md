# Pull Request Materials for Issue #8777

## PR Creation URL
https://github.com/chrisgroks/react-spectrum/compare/main...fix/issue-8777-peer-dependencies

---

## Pull Request Title
```
fix: Convert internal dependencies to peer dependencies (#8777)
```

---

## Pull Request Description

### Summary

This PR addresses issue #8777 by converting all internal monorepo package dependencies to peer dependencies, implementing solution B as preferred by the issue reporter. This ensures true singleton behavior and prevents duplicate package installations that break type overrides and singleton functionality.

### Problem Statement

Users were experiencing duplicate package installations when using react-spectrum packages, particularly:
- Multiple versions of `@react-types/shared` being installed (e.g., 3.31.0 and 3.32.0 simultaneously)
- Multiple instances of `@react-aria/utils` breaking `RouterProvider` functionality
- Type override declarations not working consistently due to different package versions being referenced
- Need for workarounds using `package.json` resolutions field

**Root cause:** Internal package dependencies used caret ranges (`^3.5.27`), allowing package managers to install different compatible versions, which breaks singleton patterns.

### Solution Implemented

Converted all internal monorepo dependencies to **peer dependencies**:
- ✅ `@react-aria/*` packages
- ✅ `@react-stately/*` packages  
- ✅ `@react-types/*` packages
- ✅ `@react-spectrum/*` packages
- ✅ `@internationalized/*` packages
- ✅ `react-aria`, `react-stately`, `react-aria-components` packages

**External dependencies preserved** in `dependencies` field:
- `@swc/helpers`
- `clsx`
- Other non-monorepo packages

### Benefits

1. **Guaranteed Singleton Behavior**: Package managers will install only one version of each internal package
2. **Type Override Compatibility**: Module augmentation and type overrides work consistently
3. **No More Resolutions Workarounds**: Eliminates need for manual `resolutions` field in package.json
4. **Predictable Dependency Resolution**: Consumers can reliably control internal package versions
5. **Better for Library Authors**: Design systems building on react-spectrum won't face version conflicts

### Changes Made

- **203 package.json files** updated across the monorepo
- **Added conversion script**: `scripts/convert-to-peer-deps.js` for maintainability and documentation
- **Type checking verified**: All changes pass TypeScript validation

### Testing

- ✅ TypeScript type checking passes (`yarn check-types`)
- ✅ All internal dependencies successfully converted to peer dependencies
- ✅ External dependencies remain in dependencies field
- ✅ Package.json formatting maintained consistently

### Example Changes

**Before** (`react-aria/package.json`):
```json
{
  "dependencies": {
    "@react-aria/breadcrumbs": "^3.5.29",
    "@react-types/shared": "^3.32.1"
  },
  "peerDependencies": {
    "react": "^16.8.0 || ^17.0.0-rc.1 || ^18.0.0 || ^19.0.0-rc.1"
  }
}
```

**After**:
```json
{
  "peerDependencies": {
    "@react-aria/breadcrumbs": "^3.5.29",
    "@react-types/shared": "^3.32.1",
    "react": "^16.8.0 || ^17.0.0-rc.1 || ^18.0.0 || ^19.0.0-rc.1"
  }
}
```

### Backward Compatibility

- **npm & pnpm**: Automatically install peer dependencies by default, minimal impact
- **yarn**: Users will need to explicitly list required packages or upgrade to version 3.1+ which auto-installs peers
- Version ranges remain the same, allowing flexible upgrades within compatible versions

### Related Issues

- Closes #8777
- Related to #6326 (Pin dependency versions on release)
- Related to #7946 (Unmanageable dependency versions)
- Related to #7644 (peerDependency issue with multiple react-aria packages)

### Breaking Changes

⚠️ **Potential breaking change for Yarn Classic users**: Projects using Yarn v1 (Classic) will need to explicitly declare internal react-spectrum dependencies in their package.json, as Yarn Classic does not auto-install peer dependencies.

**Migration guide for affected users:**
1. Run `yarn install` after upgrading
2. If you see peer dependency warnings, add the listed packages to your package.json
3. Or upgrade to Yarn v2+ / npm / pnpm which handle peer dependencies automatically

### Documentation

The conversion script (`scripts/convert-to-peer-deps.js`) is included and documented for:
- Understanding the conversion logic
- Future maintenance if new packages are added
- Reverting changes if needed

### Checklist

- [x] Addresses the issue as described
- [x] Implements preferred solution (B: peer dependencies)
- [x] All type checks pass
- [x] 203 package.json files successfully updated
- [x] Conversion script included for maintainability
- [x] No external dependencies moved to peer dependencies
- [x] Maintains consistent version ranges

---

## Additional Context for Reviewers

This change represents a significant architectural shift in how internal dependencies are managed. The primary trade-off is:

**Pros:**
- True singleton behavior (main goal of #8777)
- No more duplicate installations
- Better control for library consumers
- Predictable behavior across package managers

**Cons:**
- Yarn Classic users need to list dependencies explicitly
- Slightly larger package.json files for consumers
- Different mental model for dependency management

The maintainers have discussed similar approaches in related issues (#6326, #7946, #7644) and there's precedent for this pattern in other large monorepos. Additionally, the RFC #8797 for merging packages into a single package would further address these concerns long-term, and this change is compatible with that future direction.

---

## Testing Instructions for Reviewers

To validate the changes:

1. **Check a sample package:**
   ```bash
   cat packages/@react-aria/breadcrumbs/package.json
   # Verify internal deps are in peerDependencies
   # Verify @swc/helpers, clsx remain in dependencies
   ```

2. **Run type checking:**
   ```bash
   yarn check-types
   # Should complete without errors
   ```

3. **Test in a consumer project (optional):**
   ```bash
   # In a test project
   npm install react-aria@file:/path/to/local/packages/react-aria
   # Verify peer dependency warnings are shown
   # Verify no duplicate packages installed
   ```

4. **Review the conversion script:**
   ```bash
   cat scripts/convert-to-peer-deps.js
   # Understand the logic for future reference
   ```

---

## Questions for Reviewers

1. Should we add a migration guide to the documentation website?
2. Should we add warnings in the console for duplicate package installations?
3. Do we want to explore the yarn plugin (lib/yarn-plugin-rsp-duplicates.js) integration?
4. Should this be released as a major version bump due to the Yarn Classic impact?

---

**PR Author:** @chrisgroks  
**Issue Reporter:** @vezaynk  
**Related RFC:** #8797 (Merge packages into single package)
