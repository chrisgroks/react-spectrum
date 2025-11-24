# Peer Dependencies Implementation Plan - Issue #8777

## Problem Statement
Internal packages using version ranges (e.g., `^3.5.27`) cause duplicate package installations in consumers' node_modules, breaking type overrides and singleton behavior for packages like `@react-types/shared` and `@react-aria/utils`.

## Solution Overview
Convert internal monorepo dependencies to **peerDependencies** to ensure true singleton behavior. This approach:
- Guarantees only one version of each internal package is installed
- Prevents version drift between internal packages
- Maintains backward compatibility with modern package managers (npm, pnpm)
- Avoids the need for manual `resolutions` in consumer package.json files

## Implementation Strategy

### Phase 1: Core Singleton Packages
Convert the following packages to use peerDependencies (these are widely used and should be singletons):

1. **@react-types/*** - All type packages (47 packages)
   - These define shared types and interfaces
   - Must be singletons for type augmentation to work correctly
   
2. **@react-aria/utils** - Core utilities (101 references)
   - Contains RouterProvider and other singleton utilities
   - Must maintain single instance for context providers

3. **@react-aria/ssr** - Server-side rendering utilities
   - Manages SSR context that must be singleton

4. **@react-stately/utils** - State management utilities
   - Core utilities for state management

### Phase 2: Individual @react-aria/* and @react-stately/* packages
Convert internal references between monorepo packages:
- When `@react-aria/button` depends on `@react-aria/utils`, use peerDependencies
- When `@react-aria/button` depends on `@react-types/button`, use peerDependencies
- When `@react-stately/button` depends on `@react-stately/utils`, use peerDependencies

### Phase 3: Aggregate packages
Update aggregate packages (react-aria, react-stately, react-aria-components):
- Convert all internal package references to peerDependencies
- Keep external dependencies (like clsx, @swc/helpers) as regular dependencies

## Technical Approach

### For each package.json:
1. Move internal monorepo dependencies from `dependencies` to `peerDependencies`
2. Keep the same version ranges (e.g., `^3.5.27`)
3. Optionally add them to `dependencies` as well for backward compatibility with older package managers
4. Keep external dependencies (npm packages) in `dependencies` only

### Example Transformation:

**Before:**
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

**After:**
```json
{
  "dependencies": {
    "@swc/helpers": "^0.5.0",
    "clsx": "^2.0.0"
  },
  "peerDependencies": {
    "@react-aria/utils": "^3.31.0",
    "@react-types/shared": "^3.32.1"
  }
}
```

## Packages to Modify

### Priority 1 - Core Singletons (High Impact)
- All packages that depend on `@react-types/shared` (~178 packages)
- All packages that depend on `@react-aria/utils` (~101 packages)
- All packages that depend on `@react-aria/ssr`
- All packages that depend on `@react-stately/utils`

### Priority 2 - Aggregate Packages
- `packages/react-aria/package.json` - The main aggregate package
- `packages/react-stately/package.json` - State management aggregate
- `packages/react-aria-components/package.json` - Components aggregate

### Priority 3 - Cross-dependencies
- All `@react-aria/*` packages that reference other `@react-aria/*` packages
- All `@react-stately/*` packages that reference other `@react-stately/*` packages
- All `@react-spectrum/*` packages that reference `@react-aria/*` or `@react-stately/*`

## Testing Strategy

1. **Build Test**: Run `make build` to ensure all packages build correctly
2. **Type Check**: Run `yarn check-types` to verify TypeScript types
3. **Unit Tests**: Run `yarn test` to ensure functionality is preserved
4. **Integration Test**: Create a test project that installs the modified packages
5. **Duplication Check**: Use the existing `lib/yarn-plugin-rsp-duplicates.js` to verify no duplicates

## Backward Compatibility

Modern package managers (npm 7+, pnpm, yarn 2+) automatically install peer dependencies, so consumers won't need to explicitly list all 200+ packages. For older package managers, the packages can also be listed in `dependencies` as a fallback (though this partially defeats the purpose of using peers).

## Expected Benefits

1. **No More Duplicates**: Only one version of each internal package will be installed
2. **Type Safety**: Type augmentation (like RouterConfig) will work correctly
3. **Singleton Behavior**: Packages like RouterProvider will work across all components
4. **Cleaner Dependencies**: Consumers can upgrade all packages together without version conflicts
5. **No Manual Resolutions**: Eliminates the need for `resolutions` field in consumer package.json

## Rollout Plan

1. Create feature branch from main
2. Implement changes to all package.json files
3. Test build and type-checking
4. Run test suite
5. Create PR to chrisgroks fork (base: main, compare: feature-branch)
6. Document changes and migration guide

## Files to Modify

Approximately 200+ package.json files across:
- `/workspace/packages/@react-types/*/package.json`
- `/workspace/packages/@react-aria/*/package.json`
- `/workspace/packages/@react-stately/*/package.json`
- `/workspace/packages/@react-spectrum/*/package.json`
- `/workspace/packages/react-aria/package.json`
- `/workspace/packages/react-stately/package.json`
- `/workspace/packages/react-aria-components/package.json`
