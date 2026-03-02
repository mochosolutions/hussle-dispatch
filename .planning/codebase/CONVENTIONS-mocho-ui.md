# @mocho/ui (mocho-ui) Coding Conventions

## Overview
Mocho UI is a shared React component library built on Material-UI, Redux, and Formik. The package exports multiple entry points for tree-shaking and features extensive type safety with TypeScript.

---

## Conventions Table

| Convention | Pattern | Example |
|------------|---------|---------|
| **File naming** | PascalCase for component files, camelCase for utility/hook files | `ConfirmDialog.tsx`, `useConfig.ts`, `imageUploadErrors.ts` |
| **Component folders** | PascalCase directory with `index.tsx` re-export | `/ConfirmDialog/index.tsx`, `/DebouncedInput/index.tsx` |
| **Utility/hook files** | Single file per function, camelCase naming | `useAutoFocus.ts`, `formatLocation.ts`, `getShadow.ts` |
| **Test file location** | Co-located with component OR in `__tests__` subdirectory | `ConfirmDialog.test.tsx`, `DataGrid/__tests__/ActionsCell.test.tsx` |
| **Test file naming** | `.test.tsx` suffix (Jest convention) | `ConfirmDialog.test.tsx`, `EmptyState.test.tsx` |
| **Storybook stories** | `.stories.tsx` co-located with component | `ConfirmDialog.stories.tsx`, `MainCard.stories.tsx` |
| **Barrel exports (index files)** | Re-export components and types with explicit names | `export { default as EmptyState } from './EmptyState'` |
| **Import ordering** | React → MUI → Internal types → Internal utils/functions | (see Import Conventions below) |
| **Type imports** | Separate `import type` statements; never mix type and value | `import type { ConfirmDialogProps } from './index'` |
| **Props interfaces** | Suffixed with `Props`, exported from component file | `ConfirmDialogProps`, `DebouncedInputProps` |
| **Error handling** | Typed error enums + interface structure | `ImageUploadErrorType` enum + `ImageUploadError` interface |
| **State management** | Redux Toolkit + Redux Saga (createCrudSlice, createCrudSagas) | `/redux/createCrudSlice/`, `/redux/createCrudSagas/` |
| **Hooks naming** | `use` prefix, placed in `/src/hooks/` or `/src/forms/hooks/` | `useConfig.ts`, `useDocumentUpload.ts`, `useFormRef.ts` |
| **Component styling** | Inline `sx` prop (MUI) — no CSS modules or styled-components in components | `sx={{minWidth: 300}}` |
| **Form fields** | Type-safe discriminated union pattern (via Formik + Yup) | `CharCounterField`, `SlugField`, `ImageUploadField` |
| **Custom field components** | Placed in `/components/DynamicForm/fields/` with `index.ts` re-export | `/DynamicForm/fields/SlugField.tsx`, `/DynamicForm/fields/index.ts` |
| **Type definitions** | Feature-specific `types.ts` files (not generic `types.ts`) | `DynamicForm/types.ts`, `EditableSection/types.ts` |
| **Utility organization** | Each utility is a separate file; no `utils.ts` catch-all | `formatLocation.ts`, `getShadow.ts`, `getColors.ts` |
| **Package exports** | Multi-entry configuration via `package.json` exports field | `./`, `./redux`, `./forms`, `./components`, `./theme`, `./hooks`, `./utils`, `./types` |
| **Module format** | ES modules (`"type": "module"`, bundled via Vite) | Exports `.js`, `.cjs`, and `.d.ts` files |
| **Documentation** | JSDoc with examples for exported components and hooks | `/** Calculates total price... @example ... */` |
| **Default exports** | Component name matches filename (single export per file) | File: `ConfirmDialog.tsx` → `export default ConfirmDialog` |

---

## Import Conventions

```typescript
// Order: builtin → external → internal types → internal utils → components
import React from 'react';
import {
  Dialog,
  DialogTitle,
} from '@mui/material';
import {
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';

import type { ConfirmDialogProps } from './types';
import { getFieldValue } from './utils';
import { SlugField } from './fields';
```

---

## Component Structure Examples

### Standard Component Folder
```
ConfirmDialog/
├── index.tsx (re-exports default component + types)
├── ConfirmDialog.test.tsx
└── ConfirmDialog.stories.tsx
```

### Complex Component with Subcomponents
```
DynamicForm/
├── index.tsx (main component)
├── types.ts (feature-specific types)
├── utils.ts (feature-specific utilities)
├── DynamicForm.test.tsx
├── DynamicForm.stories.tsx
└── fields/
    ├── index.ts (barrel export)
    ├── SlugField.tsx
    └── CharCounterField.tsx
```

### Utility File Pattern
```
src/utils/
├── imageUploadErrors.ts (enum + interface + functions)
├── formatLocation.ts (single function)
├── getShadow.ts (single function)
└── index.ts (barrel export of all utilities)
```

---

## Type Safety Patterns

### Error Handling
```typescript
export enum ImageUploadErrorType {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  // ...
}

export interface ImageUploadError {
  type: ImageUploadErrorType;
  message: string;
  retryable: boolean;
}
```

### Props Interfaces
```typescript
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ ... }) => { ... };
```

### Type-safe Form Fields
```typescript
// Uses discriminated union with `type` discriminator
case 'input': {
  const inputType = field.inputType || 'text';
  // TypeScript now knows this is InputFieldConfig
  return <OutlinedInput ... />;
}
```

---

## Testing Conventions

### Test Structure (AAA Pattern)
```typescript
describe('ConfirmDialog', () => {
  const defaultProps = { /* ... */ };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders dialog when open is true', () => {
      // Arrange
      renderWithTheme(<ConfirmDialog {...defaultProps} />);

      // Assert
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
```

### Test Utilities
- **Test render wrapper**: Custom `renderWithTheme()` function (from `/src/__tests__/test-utils.tsx`)
- **Mocking**: Mock theme and dependencies in test utilities
- **Framework**: Jest + React Testing Library

---

## Key Takeaways

1. **File organization** follows feature-based structure with clear separation of concerns
2. **Type safety** is paramount — no `any` types, use discriminated unions for variants
3. **Exports** are explicit (no generic `utils.ts` or `index.ts` logic files)
4. **Styling** uses MUI's `sx` prop — no external CSS approach
5. **Error handling** uses typed enums + interfaces (never generic `Error`)
6. **Testing** is co-located with components, using Jest + React Testing Library
7. **Documentation** includes JSDoc with usage examples for public APIs
8. **Module exports** support tree-shaking via explicit multi-entry-point configuration

---

## Stack Details

- **UI Framework**: React 18.x + Material-UI (MUI) 5.x
- **State Management**: Redux Toolkit + Redux Saga (optional)
- **Forms**: Formik + Yup
- **Styling**: MUI `sx` prop + Emotion (not CSS Modules)
- **Testing**: Jest + React Testing Library
- **Storybook**: 8.x for component documentation
- **Build**: Vite + TypeScript
