# Migration Guide: Peer Dependencies for React Spectrum

## Overview

This guide helps you migrate to the peer dependencies model for React Spectrum packages, which solves duplicate package installation issues (see [issue #8777](https://github.com/adobe/react-spectrum/issues/8777)).

## What Changed?

### Singleton Packages Now Use Peer Dependencies

The following packages have been moved to `peerDependencies` across all React Spectrum packages:

**Core Types:**
- `@react-types/shared`

**Core Utilities:**
- `@react-aria/utils`
- `@react-aria/ssr`
- `@react-stately/utils`
- `@react-stately/flags`

**Internationalization:**
- `@internationalized/string`
- `@internationalized/date`
- `@internationalized/number`

### Why This Matters

These packages must be singletons to work correctly:
- **Type packages** need to be singletons for TypeScript module augmentation
- **SSR context** must be shared across all components
- **Global handlers** in `@react-aria/utils` must be shared
- **Feature flags** must be consistent across the application

## Migration Steps

### For npm Users (Recommended)

✅ **No action required!** npm 7+ automatically installs peer dependencies.

```bash
npm install
```

### For pnpm Users

✅ **No action required!** pnpm automatically installs peer dependencies by default.

```bash
pnpm install
```

### For Yarn Users

⚠️ **Action required:** Yarn requires explicit declaration of peer dependencies.

#### Option 1: Automatic (Recommended for Yarn Berry)

If using Yarn 2+, enable automatic peer dependency installation:

```yaml
# .yarnrc.yml
nodeLinker: node-modules
pnpMode: loose
```

Then run:

```bash
yarn install
```

#### Option 2: Manual Declaration

Add the peer dependencies to your `package.json`:

```json
{
  "dependencies": {
    "react-aria": "^3.44.0",
    
    "@react-types/shared": "^3.32.1",
    "@react-aria/utils": "^3.31.0",
    "@react-aria/ssr": "^3.9.10",
    "@react-stately/utils": "^3.10.8",
    "@react-stately/flags": "^3.1.2",
    "@internationalized/string": "^3.2.7",
    "@internationalized/date": "^3.10.0",
    "@internationalized/number": "^3.6.5"
  }
}
```

**Note:** Only add the packages you actually use. Yarn will warn you about missing peer dependencies.

#### Option 3: Use Yarn Plugin

Install a plugin to auto-resolve peer dependencies:

```bash
yarn plugin import https://raw.githubusercontent.com/yarnpkg/berry/master/packages/plugin-compat/sources/index.ts
```

## Checking for Duplicate Packages

After migration, verify no duplicates exist:

### npm

```bash
npm ls @react-types/shared
npm ls @react-aria/utils
```

### pnpm

```bash
pnpm ls @react-types/shared
pnpm ls @react-aria/utils
```

### Yarn

```bash
yarn why @react-types/shared
yarn why @react-aria/utils
```

### Using yarn-deduplicate

```bash
npx yarn-deduplicate --list
```

## Common Issues

### Issue: Yarn warns about missing peer dependencies

**Symptom:**
```
warning "react-aria > @react-aria/button" has unmet peer dependency "@react-types/shared@^3.32.1"
```

**Solution:** Add the peer dependency to your `package.json` (see Option 2 above).

### Issue: Type augmentation not working

**Symptom:** TypeScript module augmentation doesn't apply across your codebase.

**Cause:** Multiple versions of `@react-types/shared` are installed.

**Solution:**
1. Run deduplication: `npx yarn-deduplicate` or `npm dedupe`
2. Delete `node_modules` and lockfile
3. Reinstall: `npm install` / `yarn install` / `pnpm install`
4. Verify: `npm ls @react-types/shared`

### Issue: RouterConfig not found

**Symptom:**
```typescript
declare module 'react-aria-components' {
  interface RouterConfig {  // Error: namespace not found
    href: To;
  }
}
```

**Cause:** Multiple instances of `@react-types/shared`.

**Solution:** Same as "Type augmentation not working" above.

### Issue: Multiple React contexts

**Symptom:** `RouterProvider` doesn't apply to links, or global event handlers fire multiple times.

**Cause:** Multiple instances of `@react-aria/utils` or `@react-aria/ssr`.

**Solution:**
1. Check for duplicates: `npm ls @react-aria/utils @react-aria/ssr`
2. Ensure these packages are declared as dependencies (or auto-installed)
3. Run deduplication

## Testing Your Migration

### 1. Clean Install

```bash
# Remove existing dependencies
rm -rf node_modules
rm package-lock.json  # or yarn.lock, pnpm-lock.yaml

# Reinstall
npm install  # or yarn, pnpm
```

### 2. Check for Duplicates

```bash
npm ls @react-types/shared @react-aria/utils @react-aria/ssr
```

Should show a single version for each package.

### 3. Run Your Build

```bash
npm run build
npm test
```

### 4. Test Type Augmentation

If you use TypeScript module augmentation, verify it works:

```typescript
// In your code
declare module 'react-aria-components' {
  interface RouterConfig {
    href: string;
  }
}

// Should compile without errors
```

### 5. Test Runtime Behavior

- Verify `RouterProvider` applies to all links
- Check that global event handlers work correctly
- Confirm SSR renders properly

## Benefits After Migration

✅ **No more duplicates** - Singleton packages truly behave as singletons
✅ **Smaller bundles** - No duplicate code
✅ **Type safety** - Module augmentation works consistently
✅ **Better performance** - Shared context and event handlers
✅ **Explicit dependencies** - Clear what your app depends on

## Need Help?

### Resources

- [Issue #8777](https://github.com/adobe/react-spectrum/issues/8777) - Original issue
- [RFC #8797](https://github.com/adobe/react-spectrum/pull/8797) - Long-term solution
- [npm peer dependencies](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#peerdependencies)
- [Yarn peer dependencies](https://yarnpkg.com/configuration/manifest#peerDependencies)

### Troubleshooting Script

Use this script to diagnose issues:

```bash
#!/bin/bash
echo "Checking for duplicate singleton packages..."

SINGLETONS=(
  "@react-types/shared"
  "@react-aria/utils"
  "@react-aria/ssr"
  "@react-stately/utils"
  "@react-stately/flags"
  "@internationalized/string"
  "@internationalized/date"
  "@internationalized/number"
)

for pkg in "${SINGLETONS[@]}"; do
  echo "\n=== $pkg ==="
  npm ls "$pkg" 2>/dev/null || echo "Not installed"
done
```

Save as `check-singletons.sh`, make executable (`chmod +x check-singletons.sh`), and run:

```bash
./check-singletons.sh
```

## Feedback

If you encounter issues with this migration, please:

1. Check the troubleshooting section above
2. Review existing issues on GitHub
3. Open a new issue with:
   - Your package manager (npm/yarn/pnpm) and version
   - Output of `npm ls @react-types/shared @react-aria/utils`
   - Your package.json (relevant parts)
   - Error messages or unexpected behavior

## Future Plans

This peer dependencies approach is an **interim solution**. The React Spectrum team is working on [RFC #8797](https://github.com/adobe/react-spectrum/pull/8797), which will:

- Consolidate all code into monolithic packages
- Use pinned versions for inter-package dependencies
- Provide sub-path exports for better tree-shaking
- Simplify the overall package structure

The peer dependencies approach is fully compatible with the future RFC implementation.
