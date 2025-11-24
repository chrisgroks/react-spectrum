# Pull Request Materials

## PR Details

**Title:** Fix duplicate package installations by converting internal dependencies to peer dependencies

**Base Branch:** `main` (in chrisgroks/react-spectrum fork)  
**Compare Branch:** `feature/fix-duplicate-deps-8777` (in chrisgroks/react-spectrum fork)

**GitHub PR Creation URL:**  
https://github.com/chrisgroks/react-spectrum/compare/main...feature/fix-duplicate-deps-8777

---

## PR Description

### Summary

This PR addresses issue #8777 by converting internal package dependencies (within the monorepo) to `peerDependencies` for component and utility packages. This ensures singleton behavior for shared utilities and types, preventing duplicate installations in consumer projects.

### Problem

Internal packages like `@react-types/shared`, `@react-aria/utils`, and others are declared as regular `dependencies` with version ranges (e.g., `^3.x.x`). This can lead to duplicate installations when consumers rely on different versions or when hoisting fails, breaking:
- Type overrides (e.g., globally augmented types)
- Singleton behavior (e.g., Context providers, IDs)

### Solution

Implemented **Solution B** from the issue: converting internal dependencies to `peerDependencies`.
- Internal dependencies (e.g., `@react-aria/utils` inside `@react-aria/button`) are moved to `peerDependencies`.
- They are also added to `devDependencies` to ensure local development and testing work correctly.
- Umbrella packages (`react-aria`, `react-stately`, `@adobe/react-spectrum`, `react-aria-components`) are **excluded** from this change, as they are intended to bundle dependencies for the consumer.

### Changes

- **Modified Packages**: ~180 packages (components, utilities, types)
- **Action**: Moved internal dependencies from `dependencies` to `peerDependencies` + `devDependencies`.
- **Excluded**: Aggregator/Umbrella packages to maintain ease of use for consumers using the full libraries.

### Testing

- ✅ Build verification: Built `@react-spectrum/button` successfully with the new dependency structure.
- ✅ `yarn install` completes successfully.

### Migration Guide

Consumers using individual packages (e.g. `@react-spectrum/button` directly) may need to ensure peer dependencies are installed. Modern package managers (npm 7+, pnpm) handle this automatically. Yarn v1 users may see warnings and need to install peers manually if not hoisted.

### Related

- Fixes #8777
