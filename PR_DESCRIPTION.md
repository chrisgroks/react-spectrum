# Fix: Convert Internal Monorepo Dependencies to Peer Dependencies

## 🎯 Overview

This PR addresses [GitHub issue #8777](https://github.com/adobe/react-spectrum/issues/8777) by converting internal monorepo dependencies to peer dependencies, preventing duplicate package installations and ensuring true singleton behavior.

## 🐛 Problem Statement

Internal packages using version ranges (e.g., `^3.5.27`) caused duplicate package installations in consumers' `node_modules`. This resulted in:

1. **Broken Type Overrides**: Type augmentation (like `RouterConfig` extension) stopped working because multiple versions of `@react-types/shared` were installed
2. **Broken Singleton Behavior**: Packages like `@react-aria/utils` ended up with multiple instances, breaking `RouterProvider` context
3. **Version Drift**: Easy to accidentally install incompatible versions of internal packages
4. **Manual Workarounds**: Consumers needed to use `resolutions` field to force single versions

### Example Scenario

```json
// Consumer pins @react-types/shared@3.31.0
"dependencies": {
  "@react-types/shared": "3.31.0",
  "react-aria": "3.42.0"
}

// But react-aria depends on @react-aria/breadcrumbs with ^3.5.27
// And @react-aria/breadcrumbs@3.5.28 depends on @react-types/shared@^3.32.0
// Result: Both 3.31.0 AND 3.32.0 get installed! 💥
```

## ✅ Solution

Convert all internal monorepo dependencies to **peer dependencies**. This ensures:

- Only one version of each internal package is installed
- Package managers resolve to a single version
- Type augmentation works correctly
- Singleton packages maintain singleton behavior
- No manual `resolutions` needed

### What Changed

#### Before
```json
{
  "dependencies": {
    "@react-aria/utils": "^3.31.0",
    "@react-types/shared": "^3.32.1",
    "@swc/helpers": "^0.5.0",
    "clsx": "^2.0.0"
  }
}
```

#### After
```json
{
  "dependencies": {
    "@swc/helpers": "^0.5.0",
    "clsx": "^2.0.0"
  },
  "peerDependencies": {
    "@react-aria/utils": "^3.31.0",
    "@react-types/shared": "^3.32.1",
    "react": "^16.8.0 || ^17.0.0-rc.1 || ^18.0.0 || ^19.0.0-rc.1",
    "react-dom": "^16.8.0 || ^17.0.0-rc.1 || ^18.0.0 || ^19.0.0-rc.1"
  }
}
```

## 📊 Impact

- **Modified**: 201 package.json files
- **Packages affected**: 
  - All `@react-aria/*` packages
  - All `@react-stately/*` packages
  - All `@react-types/*` packages
  - All `@react-spectrum/*` packages
  - Aggregate packages: `react-aria`, `react-stately`, `react-aria-components`

## 🔧 Implementation Details

### Automated Script
Created `/workspace/scripts/convert-to-peer-deps.mjs` that:
1. Scans all package.json files in the monorepo
2. Identifies internal dependencies (packages with `@react-*` or `@internationalized/*` scopes)
3. Moves them from `dependencies` to `peerDependencies`
4. Keeps external dependencies (like `clsx`, `@swc/helpers`) in `dependencies`
5. Maintains proper sorting and formatting

### Internal Scopes Converted
- `@react-aria/*`
- `@react-stately/*`
- `@react-types/*`
- `@react-spectrum/*`
- `@internationalized/*`

### External Dependencies (Kept as Regular Dependencies)
- `@swc/helpers`
- `clsx`
- `react` and `react-dom` (already peer dependencies)
- Other npm packages

## 🧪 Testing

### Verification Steps
✅ All 201 package.json files transformed correctly  
✅ External dependencies remain in `dependencies`  
✅ Internal dependencies moved to `peerDependencies`  
✅ `yarn install` completes successfully  
✅ Peer dependency warnings are expected and intentional  

### Expected Behavior
Modern package managers (npm 7+, pnpm, yarn 2+) automatically install peer dependencies. The warnings from `yarn install` are **expected** and indicate that the peer dependencies are being enforced correctly.

## 🔄 Backward Compatibility

### Modern Package Managers (Recommended)
- **npm 7+**: Automatically installs peer dependencies
- **pnpm**: Automatically installs peer dependencies
- **yarn 2+**: Enforces peer dependencies with warnings

### Legacy Package Managers
For older package managers, consumers may need to explicitly install the peer dependencies, but this is standard npm ecosystem behavior.

## 📚 Benefits

1. **Guaranteed Singletons**: Only one version of each internal package
2. **Type Safety**: Type augmentation works correctly across all packages
3. **No Duplicates**: Eliminates duplicate package installations
4. **No Manual Workarounds**: Removes need for `resolutions` field
5. **Cleaner Upgrades**: All packages upgrade together
6. **Better Error Messages**: Package managers warn about incompatible versions

## 🚀 Migration Guide for Consumers

### If Using npm 7+, pnpm, or yarn 2+
No action required! Package managers automatically handle peer dependencies.

### If Using Older Package Managers
You may see peer dependency warnings. To resolve:

```bash
# For npm 6.x
npm install --legacy-peer-deps

# Or upgrade to npm 7+
npm install -g npm@latest
```

### For Library Authors Building on React Aria
When adding react-aria to your project:

```bash
# Modern package managers auto-install peers
npm install react-aria

# Or be explicit
npm install react-aria @react-aria/utils @react-types/shared
```

## 📝 Related Issues

- Addresses [#8777](https://github.com/adobe/react-spectrum/issues/8777) - Duplicate package installations
- Related to [#7946](https://github.com/adobe/react-spectrum/issues/7946) - Unmanageable dependency versions
- Related to [#7644](https://github.com/adobe/react-spectrum/issues/7644) - peerDependency issues
- Related to [#6326](https://github.com/adobe/react-spectrum/issues/6326) - Pin dependency versions

## 🔗 PR Links

- **Fork PR**: https://github.com/chrisgroks/react-spectrum/compare/main...fix/internal-deps-peer-dependencies-issue-8777
- **Branch**: `fix/internal-deps-peer-dependencies-issue-8777`
- **Base**: `main` (chrisgroks/react-spectrum)

## 📦 Files Changed

Key files:
- 201 × `packages/*/package.json` - Converted dependencies to peers
- 1 × `PEER_DEPS_IMPLEMENTATION_PLAN.md` - Detailed implementation plan
- 1 × `scripts/convert-to-peer-deps.mjs` - Automated conversion script

## 🎬 Next Steps

1. Review the changes to package.json files
2. Verify the implementation approach
3. Test with a consumer project to confirm no duplicates
4. Consider if this approach should be extended to future packages
5. Update documentation if needed

## 💬 Discussion

This approach was chosen over:
- **Pinning versions**: Would cause more duplication as each consumer would have separate copies
- **Workspace protocol**: Only works within the monorepo, not for external consumers
- **Exact versions**: Still allows duplicates, just reduces the frequency

Peer dependencies is the npm ecosystem standard for ensuring singleton behavior across packages.

---

**Note**: This PR is created in the chrisgroks fork for demonstration purposes. For production use, this would need Adobe maintainer review and consideration of the long-term implications for the ecosystem.
