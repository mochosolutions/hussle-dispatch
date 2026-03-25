# Mocho UI Repatriation Guide

## Overview

All mocho-ui components, utilities, hooks, Redux factories, types, and theme have been copied into `dispatch-ui/src/mocho/` for local development independence. This document explains how to copy changed files back to mocho-ui when development is complete.

## Current Structure

```
dispatch-ui/src/mocho/           ← Complete copy of mocho-ui/src
├── components/                   → mocho-ui/src/components
├── redux/                        → mocho-ui/src/redux
├── forms/                        → mocho-ui/src/forms
├── hooks/                        → mocho-ui/src/hooks
├── utils/                        → mocho-ui/src/utils
├── types/                        → mocho-ui/src/types
├── theme/                        → mocho-ui/src/theme
├── contexts/                     → mocho-ui/src/contexts
├── store/                        → mocho-ui/src/store
├── config.ts                     → mocho-ui/src/config.ts
├── index.ts                      → mocho-ui/src/index.ts
└── __tests__/                    → mocho-ui/src/__tests__/
```

## Import Paths During Development

**In dispatch-ui source files:**

```typescript
import { Component } from '@mocho/ui/components'; // Resolves to dispatch-ui/src/mocho/components
import { createEntityModule } from '@mocho/ui/redux'; // Resolves to dispatch-ui/src/mocho/redux
// etc.
```

**Path resolution via:**

- `vite.config.ts` - Vite alias mapping
- `tsconfig.app.json` - TypeScript path mapping

## Repatriation Process (When Ready to Return)

### Phase 1: Prepare for Copy-back

1. **Identify changed files**

   ```bash
   # Find all modified files in dispatch-ui/src/mocho/
   git diff --name-only mocho-ui/src dispatch-ui/src/mocho
   ```

2. **Backup mocho-ui**
   ```bash
   # Create a backup branch in mocho-ui repo
   cd mocho-ui
   git checkout -b backup/pre-repatriation
   ```

### Phase 2: Copy Files Back

**Option A: Selective copy (for specific changed files)**

```bash
# From fleet-command root, copy specific files back
# Replace modified components:
cp dispatch-ui/src/mocho/components/YourComponent/*.tsx mocho-ui/src/components/YourComponent/

# Replace modified hooks:
cp dispatch-ui/src/mocho/hooks/useYourHook.ts mocho-ui/src/hooks/useYourHook.ts

# Replace modified Redux utilities:
cp dispatch-ui/src/mocho/redux/createYourSlice.ts mocho-ui/src/redux/createYourSlice.ts
```

**Option B: Full repatriation (bulk copy-back)**

```bash
# From fleet-command root, copy entire mocho directory back
cp -r dispatch-ui/src/mocho/* mocho-ui/src/

# Then verify in mocho-ui:
cd mocho-ui
git diff src/
git add src/
git commit -m "Repatriate components from dispatch-ui development cycle"
```

### Phase 3: Restore Original Imports

**In mocho-ui source files, change import paths:**

```typescript
// BEFORE (dispatch-ui style - shouldn't exist in mocho-ui):
import { Component } from 'src/mocho/components';

// AFTER (mocho-ui style):
import { Component } from '../components';
// or for external imports from same package:
export { Component } from './components';
```

**Search and replace pattern:**

```bash
cd mocho-ui
# Revert any accidental @mocho/ui imports back to relative imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' \
    "s|from '@mocho/ui/|from '../|g;" \
    "s|from '@mocho/ui';|from '../index';|g" \
  {} \;
```

### Phase 4: Update dispatch-ui to Use Published Package

1. **Delete mocho copy**

   ```bash
   rm -rf dispatch-ui/src/mocho
   ```

2. **Reinstall from npm**

   ```bash
   cd dispatch-ui
   npm install @mocho/ui   # (if using npm packages)
   ```

3. **Restore path aliases in tsconfig and vite.config**

   ```jsonc
   // tsconfig.app.json - revert to node_modules paths
   "@mocho/ui": ["../../node_modules/@mocho/ui/dist/types/index.d.ts"]
   ```

   ```typescript
   // vite.config.ts - remove local aliases
   '@mocho/ui/components': path.resolve(__dirname, '../mocho-ui/src/components'),  // Remove or revert
   ```

4. **Update package.json**
   ```json
   "dependencies": {
     "@mocho/ui": "*"   // Re-add from dependencies
   }
   ```

## Dependency Management

### New Dependencies Added to dispatch-ui

The following optional mocho-ui dependencies were added to support local development:

```json
{
  "dependencies": {
    "dompurify": "^3.0.6",
    "simplebar-react": "^3.2.3",
    "@tiptap/react": "^2.0.0",
    "@tiptap/starter-kit": "^2.0.0",
    "@tiptap/extension-link": "^2.0.0",
    "@tiptap/extension-image": "^2.0.0",
    "@tiptap/extension-placeholder": "^2.0.0",
    "normalizr": "^3.6.2",
    "styled-components": "^6.0.0"
  },
  "devDependencies": {
    "@types/lodash": "^4.14.0"
  }
}
```

### When Returning to Published Package

These dependencies can be:

- **Kept** if dispatch-ui continues to need them for its own features
- **Removed** if they were only needed for mocho components that aren't actively used

## TypeScript Configuration

### Current (dispatch-ui Local Development)

```jsonc
// tsconfig.app.json
"erasableSyntaxOnly": false,       // Loosened for mocho code compatibility
"noUnusedLocals": false,           // Loosened for mocho code
"noUnusedParameters": false,       // Loosened for mocho code
"paths": {
  "@mocho/ui": ["mocho"],          // Points to local mocho directory
  "@mocho/ui/components": ["mocho/components"],
  // ...
}
```

### After Repatriation

```jsonc
// Restore strict settings once mocho code is gone
"erasableSyntaxOnly": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"paths": {
  "@mocho/ui": ["../../node_modules/@mocho/ui/dist/types/index.d.ts"]
  // ...
}
```

## Common Issues & Solutions

| Issue                                  | Solution                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Import errors after copy-back**      | Run `npm install` in mocho-ui and verify node_modules is installed                                                        |
| **Storybook missing**                  | Storybook stories were copied but dispatch-ui doesn't have Storybook configured; these can be deleted before repatriation |
| **Missing dependencies**               | Dispatch-ui has all mocho optional dependencies installed; mocho-ui has them as peer/optional                             |
| **Type mismatches after repatriation** | Run `npm run type-check` in mocho-ui to verify and fix any issues                                                         |
| **Git conflicts during merge**         | Small, focused copy-backs per component reduce merge complexity                                                           |

## Files to Delete Before Repatriation

The following dispatch-ui-only files should **not** be copied back to mocho-ui:

```
dispatch-ui/src/mocho/**/*.test.tsx    # Tests are dispatch-ui specific
dispatch-ui/src/mocho/**/*.stories.tsx # Storybook references are dispatch-ui specific
dispatch-ui/src/mocho/index.ts         # Dispatch-ui re-export, mocho-ui has its own
```

Or, to be safe, manually review each changed file before copying.

## Checklist

- [ ] Document all component changes during local development
- [ ] Identify files modified vs. files unchanged
- [ ] Create backup branch in mocho-ui
- [ ] Perform selective or bulk copy-back
- [ ] Update imports from local to relative/mocho-ui style
- [ ] Run type checks and tests in mocho-ui
- [ ] Delete dispatch-ui/src/mocho/
- [ ] Restore tsconfig and vite.config paths
- [ ] Reinstall @mocho/ui from npm/published version
- [ ] Run dispatch-ui build to verify
- [ ] Delete unnecessary dependencies if applicable

## Questions?

For issues during repatriation:

1. Check if import paths were correctly reverted
2. Verify mocho-ui package.json has correct exports defined
3. Check tsconfig and vite.config are correctly configured
4. Review git diff to understand what changed and why
