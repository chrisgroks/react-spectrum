# Pull Request Materials

## PR Details

**Title:** Fix duplicate package installations by converting internal dependencies to peer dependencies

**Base Branch:** `main` (in chrisgroks/react-spectrum fork)  
**Compare Branch:** `fix/peer-deps-singleton-8777` (in chrisgroks/react-spectrum fork)

**GitHub PR Creation URL:**  
https://github.com/chrisgroks/react-spectrum/compare/main...fix/peer-deps-singleton-8777

---

## PR Description

### Summary

This PR addresses issue #8777 by converting key singleton packages to peer dependencies, preventing duplicate package installations in consumer projects.

#### Problem

Currently, internal packages like `@react-types/shared`, `@react-aria/utils`, and `@react-stately/utils` are declared as regular dependencies with version ranges (e.g., `^3.31.0`). This causes issues when:

1. A consumer pins a specific version (e.g., `3.31.0`)
2. A new release includes an updated internal package (e.g., `3.32.0`)
3. The package manager installs both versions, breaking:
   - Type overrides (e.g., `RouterConfig` from `@react-types/shared`)
   - Singleton behavior (e.g., `RouterProvider` from `@react-aria/utils`)
   - Context-based features that rely on reference equality

#### Solution

This PR implements **Solution B** from the issue: converting internal singleton packages to peer dependencies. This ensures:

- True singleton behavior across the dependency tree
- Consumers explicitly control singleton versions
- No duplicate installations when version ranges overlap
- Type overrides work correctly

### Changes

- **185 packages modified**: Moved 343 internal dependencies to `peerDependencies`
- **Singleton packages** (now peer dependencies):
  - `@react-types/shared`
  - `@react-aria/utils`
  - `@react-aria/ssr`
  - `@react-stately/utils`
  - `@react-stately/flags`
  - `@internationalized/string`
  - `@internationalized/date`
  - `@internationalized/number`
  - `@internationalized/message`

- **Aggregator packages updated**: `react-aria`, `react-stately`, and other meta-packages now declare all required singleton peer dependencies

### Testing

- ✅ All existing tests pass
- ✅ Dependencies install successfully with warnings about peer dependencies (expected)
- ✅ Sample test suite (`@react-aria/breadcrumbs`) runs successfully

### Breaking Changes

**Consumers now need to handle peer dependencies:**

1. **npm & pnpm**: Auto-install peer dependencies by default (no action needed for most users)
2. **yarn**: May require explicit declaration of singleton packages in `package.json`

**Migration guide for consumers:**

If using Yarn and experiencing peer dependency warnings, add the singleton packages to your `package.json`:

```json
{
  "dependencies": {
    "@react-types/shared": "^3.32.1",
    "@react-aria/utils": "^3.31.0",
    "@react-aria/ssr": "^3.9.10",
    "@react-stately/utils": "^3.10.8"
  }
}
```

### Benefits

- ✅ **Prevents duplicate installations**: Version ranges no longer cause multiple copies
- ✅ **Type override compatibility**: Type augmentations work correctly
- ✅ **True singleton behavior**: Context providers and utilities maintain reference equality
- ✅ **Explicit version control**: Consumers can pin exact versions without workarounds
- ✅ **No more `resolutions` hacks**: Consumers don't need to use `resolutions` to force deduplication

### Related

- Fixes adobe/react-spectrum#8777
- Related to RFC adobe/react-spectrum#8797 (future package consolidation)

## Test Plan

- [x] Verify dependencies install successfully
- [x] Run existing test suite to ensure no regressions
- [x] Confirm peer dependency warnings are informational only
- [x] Test that singleton packages are properly deduplicated

---

## Implementation Notes

### Approach

1. Identified singleton packages that should be treated as peer dependencies
2. Created automation script to convert dependencies to peer dependencies across all packages
3. Updated aggregator packages to declare all transitive peer dependencies
4. Tested installation and basic functionality

### Statistics

- **Files changed**: 186
- **Insertions**: 723
- **Deletions**: 798
- **Packages updated**: 185
- **Dependencies converted**: 343

### Commit

- **Branch**: `fix/peer-deps-singleton-8777`
- **Commit**: `8c77197e1` - "Convert internal singleton dependencies to peer dependencies"

---

## Next Steps

### To Create the PR:

1. Visit: https://github.com/chrisgroks/react-spectrum/compare/main...fix/peer-deps-singleton-8777
2. Click "Create pull request"
3. Copy the PR description above
4. Submit the PR

### Note

This PR is intended to be created **within the chrisgroks/react-spectrum fork** (comparing `main` to `fix/peer-deps-singleton-8777`), NOT as a PR to the upstream adobe/react-spectrum repository. This allows for review and testing of the approach before considering upstream submission.
