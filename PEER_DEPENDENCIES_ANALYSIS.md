# Peer Dependencies Implementation Analysis for Issue #8777

## Executive Summary

This document analyzes the implementation of peer dependencies for internal React Spectrum packages to address duplicate package installation issues reported in [issue #8777](https://github.com/adobe/react-spectrum/issues/8777).

## Problem Statement

### Current Issue
When using React Spectrum packages, consumers frequently experience duplicate package installations due to version range mismatches. For example:

```
node_modules/
├── @react-types/shared@3.31.0  (explicitly installed)
└── @react-types/shared@3.32.0  (transitively via @react-aria/breadcrumbs)
```

This causes:
1. **Type override failures** - TypeScript module augmentation doesn't work across duplicate packages
2. **Singleton behavior breaks** - React Context and global handlers don't work across instances
3. **Increased bundle sizes** - Multiple copies of the same code
4. **Version drift issues** - Difficult to control which versions are used

### Root Cause
Packages like `react-aria` declare internal dependencies with caret ranges:
```json
{
  "dependencies": {
    "@react-aria/breadcrumbs": "^3.5.27"
  }
}
```

This allows package managers to install newer versions than explicitly requested, causing duplication.

## Proposed Solutions Comparison

### Solution A: Pinned Versions (Not Implemented)
**Approach**: Remove caret ranges, use exact versions
```json
{
  "dependencies": {
    "@react-aria/breadcrumbs": "3.5.27"
  }
}
```

**Pros:**
- Simple to implement
- Maintains current dependency structure
- No consumer-side changes needed

**Cons:**
- Doesn't guarantee deduplication across library boundaries
- Still allows duplication when multiple libraries use React Spectrum
- Harder to manage transitive dependencies

### Solution B: Peer Dependencies (THIS IMPLEMENTATION)
**Approach**: Move singleton packages to peer dependencies
```json
{
  "peerDependencies": {
    "@react-types/shared": "^3.32.1",
    "@react-aria/utils": "^3.31.0"
  }
}
```

**Pros:**
- ✅ Guarantees true singleton behavior
- ✅ Prevents any version duplication
- ✅ Makes dependency requirements explicit
- ✅ npm/pnpm auto-install peer dependencies by default

**Cons:**
- ⚠️ Yarn requires explicit declaration (verbose package.json)
- ⚠️ Breaking change for some consumers
- ⚠️ Increases cognitive load for understanding dependencies

### Solution C: Monolithic Packages (RFC #8797 - Team's Preferred)
**Approach**: Consolidate all code into mono-packages with pinned versions

**Status**: Proposed in [RFC PR #8797](https://github.com/adobe/react-spectrum/pull/8797)

This is the Adobe team's preferred long-term solution but requires significant restructuring.

## Implementation Details

### Scope of Changes

This implementation converts the following **singleton packages** to peer dependencies:

#### Core Type Packages
- `@react-types/shared` - Common types used across all components

#### Core Utility Packages  
- `@react-aria/utils` - Core React Aria utilities with global handlers
- `@react-aria/ssr` - SSR context (must be singleton)
- `@react-stately/utils` - Core state management utilities
- `@react-stately/flags` - Feature flags (must be singleton)

#### Internationalization
- `@internationalized/string` - String internationalization
- `@internationalized/date` - Date internationalization  
- `@internationalized/number` - Number internationalization

### Package Categories

1. **Singleton Packages** (converted to peer deps)
   - Must have only one instance in the dependency tree
   - Contains React Context, global state, or type definitions
   - Examples: `@react-types/shared`, `@react-aria/utils`, `@react-aria/ssr`

2. **Component Packages** (keep as regular dependencies)
   - Individual component implementations
   - Safe to have multiple versions (though not ideal)
   - Examples: `@react-aria/button`, `@react-aria/checkbox`

3. **Mono Packages** (use peer deps for singletons)
   - Aggregate packages that re-export components
   - Examples: `react-aria`, `react-stately`, `react-aria-components`

### Migration Impact

#### For Package Maintainers (React Spectrum team)
- All internal packages must declare peer dependencies for singletons
- Mono-packages will have longer peerDependencies lists
- Build and test processes remain unchanged

#### For Consumers Using npm/pnpm
✅ **No changes required** - Auto-install behavior handles peer dependencies

#### For Consumers Using Yarn
⚠️ Must explicitly declare peer dependencies:
```json
{
  "dependencies": {
    "react-aria": "^3.44.0",
    "@react-types/shared": "^3.32.1",
    "@react-aria/utils": "^3.31.0"
    // ... other peer dependencies
  }
}
```

Yarn will warn about missing peer dependencies.

## Implementation Steps

1. ✅ Identify singleton packages
2. ✅ Create conversion script
3. ⬜ Run conversion on all packages
4. ⬜ Update mono-packages to use peer dependencies
5. ⬜ Update documentation
6. ⬜ Test builds
7. ⬜ Update migration guide

## Testing Strategy

### Build Tests
```bash
yarn install          # Verify installation works
yarn build           # Verify builds succeed
yarn test            # Verify tests pass
```

### Consumer Simulation
Test in separate projects:
1. Fresh install with npm
2. Fresh install with pnpm
3. Fresh install with Yarn (should require explicit peer deps)
4. Upgrade scenario from current version

### Duplication Check
```bash
# Verify no duplicates for singleton packages
npx yarn-deduplicate --list
npm ls @react-types/shared
npm ls @react-aria/utils
```

## Rollout Plan

### Phase 1: Internal Testing (Current)
- Implement peer dependencies for singleton packages
- Test within monorepo
- Verify builds and tests pass

### Phase 2: Beta Release
- Release as pre-release versions
- Gather feedback from early adopters
- Document migration path

### Phase 3: Stable Release
- Release stable versions
- Publish migration guide
- Provide codemod if needed

### Phase 4: Documentation
- Update getting started guides
- Add peer dependencies section to docs
- Create FAQ for common issues

## Alternatives Considered

### 1. Package Manager Plugins
Create plugins for yarn/npm/pnpm to auto-deduplicate on install.

**Rejected**: Requires consumers to install and configure plugins.

### 2. Resolutions Field
Document use of package.json `resolutions` field.

**Rejected**: Workaround, not a proper solution. Allows incompatible versions.

### 3. Single Mega-Package
Combine everything into one package.

**Rejected**: Too large, breaks modularity. (But see RFC #8797 for nuanced approach)

## Relationship to RFC #8797

This peer dependencies implementation is a **stepping stone** toward the RFC:

1. **Short-term**: Peer dependencies solve immediate singleton issues
2. **Medium-term**: Gain experience with dependency management
3. **Long-term**: RFC #8797's monolithic approach is more comprehensive

The RFC proposes:
- Moving all code into mono-packages (not re-exporting)
- Sub-path exports for tree-shaking
- Pinned versions between mono-packages
- Significant file structure changes

Our peer dependencies approach:
- Works with current structure
- Can be implemented incrementally
- Provides immediate relief for issue #8777
- Doesn't conflict with future RFC implementation

## Recommendations

### For React Spectrum Team
1. ✅ **Proceed with peer dependencies** for immediate relief
2. 📋 **Document clearly** the peer dependency requirements
3. 🔮 **Plan RFC #8797** implementation as comprehensive solution
4. 🧪 **Create migration tools** (codemods, scripts) to help consumers

### For Consumers
1. **npm/pnpm users**: No action needed, auto-install works
2. **Yarn users**: Add peer dependencies to package.json
3. **All users**: Run deduplication commands after upgrades
4. **Library authors**: Consider using peer dependencies for React Spectrum

## Conclusion

Converting singleton packages to peer dependencies is a **practical, incremental solution** to issue #8777 that:

- ✅ Solves the immediate duplicate installation problem
- ✅ Ensures true singleton behavior
- ✅ Works with current monorepo structure
- ✅ Doesn't block RFC #8797 implementation
- ⚠️ Has manageable trade-offs (Yarn verbosity)

This approach provides immediate value while the team works on the more comprehensive RFC #8797 solution.

## References

- [Issue #8777](https://github.com/adobe/react-spectrum/issues/8777) - Original issue
- [RFC PR #8797](https://github.com/adobe/react-spectrum/pull/8797) - Dependency management RFC
- [RFC Document](../rfcs/2025-dependencies.md) - Full RFC text
- [Yarn Berry Issue #5421](https://github.com/yarnpkg/berry/issues/5421) - Peer deps auto-install
