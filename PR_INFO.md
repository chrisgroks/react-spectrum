# Pull Request Information

## ✅ CORRECT URL to Create PR within chrisgroks/react-spectrum Fork

**Use this URL**: 
```
https://github.com/chrisgroks/react-spectrum/compare/main...fix/internal-peer-dependencies?expand=1
```

This will create a PR **within your fork** (from `fix/internal-peer-dependencies` to `main` in chrisgroks/react-spectrum).

---

## PR Title
```
Fix: Convert internal dependencies to peer dependencies to prevent duplicates (#8777)
```

## PR Description (Copy/Paste Below)

```markdown
## Summary

This PR addresses issue adobe/react-spectrum#8777 by converting all internal monorepo dependencies to peer dependencies, ensuring true singleton behavior and preventing duplicate package installations.

### Problem Statement

Users were experiencing duplicate package installations when internal packages used caret ranges (e.g., `^3.5.27`) in their `dependencies` field. This caused:

- ❌ **Type override failures**: Module augmentation didn't work with multiple versions
- ❌ **Broken singleton behavior**: Packages like `@react-aria/utils` with `RouterProvider` broke when multiple instances were loaded
- ❌ **Larger bundles**: Duplicate code from multiple versions

**Example scenario from #8777**:
```
- Design system pins @react-types/shared@3.31.0
- App also pins @react-types/shared@3.31.0  
- But react-aria@3.42.0 pulls in @react-types/shared@3.32.0
- Result: TWO versions installed, type overrides fail ❌
```

### Solution

Convert internal dependencies to peer dependencies (option B from #8777):

- ✅ **Ensures singleton behavior**: Only one version of each package
- ✅ **Fixes type overrides**: All type augmentation works correctly
- ✅ **Gives control to consumers**: Applications explicitly control versions
- ✅ **Reduces bundle size**: No duplicate code

---

## Changes Made

### Modified: 197 package.json files

**Scopes updated**:
- `@react-aria/*` packages: Internal deps → peer deps
- `@react-stately/*` packages: Internal deps → peer deps  
- `@react-types/*` packages: Internal deps → peer deps
- `@react-spectrum/*` packages: Internal deps → peer deps
- `@internationalized/*` packages: Internal deps → peer deps

### Unchanged

- **Umbrella packages** (`react-aria`, `react-stately`, `react-aria-components`, `@adobe/react-spectrum`) keep regular dependencies (they re-export sub-packages)
- **External dependencies** (`@swc/helpers`, `clsx`) remain in dependencies
- **React peer deps**: No changes to existing React/ReactDOM peer dependencies

### New Files

- `PEER_DEPENDENCIES_MIGRATION.md` - Comprehensive migration guide
- `scripts/convertToPeerDependencies.mjs` - Automation script for the conversion

---

## Benefits

1. ✅ **True Singleton Behavior**: Guaranteed single version across dependency tree
2. ✅ **Working Type Augmentation**: Module declarations work as expected
3. ✅ **Predictable Upgrades**: Consumers control exactly which versions are used
4. ✅ **Smaller Bundles**: No duplicate code from multiple versions
5. ✅ **Best Practices**: Aligns with recommended approach for library ecosystems

---

## Compatibility

### Package Managers
- ✅ **npm** (v7+): Auto-installs peer dependencies by default
- ✅ **pnpm**: Auto-installs peer dependencies by default  
- ✅ **yarn** (v3+): Auto-installs peer dependencies (with informational warnings)

### For Consumers

Package managers handle peer dependencies automatically. Users may see informational warnings like:
```
YN0002: │ your-package doesn't provide @react-aria/utils
```

These are **informational only** - the packages are still installed. Users can optionally silence them by explicitly listing peer deps in their package.json.

---

## Testing

- ✅ Yarn install completes successfully
- ✅ All packages resolve correctly
- ✅ Test suites can be executed
- ✅ Peer dependencies correctly resolved in monorepo

---

## Migration Impact

### Breaking Changes
**None** for most users. Package managers auto-install peer dependencies.

### Action Required
Only if using older package managers:
- npm < v7: Upgrade to npm 7+ or manually install peer deps
- yarn < v3: Upgrade to yarn 3+

---

## Related Issues

- Fixes adobe/react-spectrum#8777 - Make internal package references strict (or peer dependencies)
- Related to adobe/react-spectrum#6326 - Pin dependency versions on release
- Related to adobe/react-spectrum#7946 - Unmanageable dependency versions  
- Related to adobe/react-spectrum#7644 - peerDependency issue with multiple react-aria packages

---

## Files Changed

```
 PEER_DEPENDENCIES_MIGRATION.md                     |  156 ++
 packages/@react-aria/actiongroup/package.json      |   14 +-
 packages/@react-aria/autocomplete/package.json     |   22 +-
 packages/@react-aria/breadcrumbs/package.json      |   10 +-
 [... 193 more package.json files ...]
 scripts/convertToPeerDependencies.mjs              |  213 ++
 yarn.lock                                          | 2511 ++++++++++----------
 199 files changed, 2243 insertions(+), 2047 deletions(-)
```
```

---

## How to Review

1. Check a few sample package.json files to see the conversion
2. Look at `scripts/convertToPeerDependencies.mjs` to see the automation logic
3. Read `PEER_DEPENDENCIES_MIGRATION.md` for full context
4. Test locally with `yarn install`

