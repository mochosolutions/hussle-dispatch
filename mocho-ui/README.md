# @mocho/ui

Unified shared UI library for Mocho Solutions React applications. This library combines Redux utilities, form hooks, UI components, theming, and utilities into a single package with modular exports.

## Installation

```bash
npm install @mocho/ui
```

## Peer Dependencies

Core dependencies (required):
- `react` ^18.0.0
- `react-dom` ^18.0.0
- `@mui/material` ^5.0.0
- `@mui/icons-material` ^5.0.0
- `@emotion/react` ^11.0.0
- `@emotion/styled` ^11.0.0
- `@reduxjs/toolkit` ^2.0.0
- `react-redux` ^9.0.0
- `formik` ^2.0.0
- `yup` ^1.0.0

Optional dependencies (install as needed):
- `redux-saga` - For Redux saga utilities
- `ag-grid-react` - For DataGrid components
- `framer-motion` - For AnimateButton
- `notistack` - For Snackbar/notifications
- `react-router-dom` - For form navigation blocking

## Usage

### Import from Subpaths (Recommended)

For better tree-shaking, import from specific subpaths:

```typescript
// Redux utilities
import { createCrudSlice, createEntityModule, LoadingState } from '@mocho/ui/redux';

// Form utilities
import { useFormRef, useDirtyFormBlocker } from '@mocho/ui/forms';
import type { FormHandle, FormState } from '@mocho/ui/forms';

// Components
import { MainCard, EmptyState, AnimateButton, ActionsCell } from '@mocho/ui/components';

// Theme
import { ThemeCustomization } from '@mocho/ui/theme';

// Hooks
import { useLocalStorage, usePagination } from '@mocho/ui/hooks';

// Utilities
import { generateSlug, strengthColor } from '@mocho/ui/utils';

// Types
import type { ThemeMode, KeyedObject } from '@mocho/ui/types';
```

### Import from Main Entry

You can also import everything from the main entry (larger bundle):

```typescript
import {
  createCrudSlice,
  useFormRef,
  MainCard,
  ThemeCustomization,
  useLocalStorage,
  generateSlug,
  ThemeMode,
} from '@mocho/ui';
```

## Available Exports

### `/redux` - Redux Utilities

- `createCrudSlice` - Factory for CRUD slice with loading/error states
- `createEntityModule` - Factory for normalized entity state with adapters
- `createCrudSelectors` - Memoized selector factory
- `LoadingState` - Enum: Idle, Pending, Fulfilled, Rejected
- `setPending`, `setFulfilled`, `setRejected` - State helpers

### `/forms` - Form Utilities

- `useFormRef` - Hook for ref-based form submission
- `useDirtyFormBlocker` - Hook for navigation blocking with unsaved changes
- Types: `FormHandle`, `FormState`, field prop types

### `/components` - UI Components

- `MainCard` - Styled card wrapper
- `ActionsCell` - AG Grid actions cell renderer
- `EmptyState`, `ErrorState`, `PageLoader`, `Loader` - Feedback components
- `AnimateButton`, `Avatar`, `IconButton`, `LoadingButton` - Extended MUI
- `FormDialog`, `ConfirmDialog`, `DynamicForm` - Form components
- `Breadcrumbs`, `Tooltip`, `Snackbar` - Navigation/feedback

### `/theme` - Theme System

- `ThemeCustomization` - Theme provider component
- 8 color presets: default, theme1-theme8
- Light/dark mode support
- Configurable typography and shadows

### `/hooks` - Custom Hooks

- `useLocalStorage` - Persistent localStorage state
- `useAutoFocus` - Auto-focus management
- `usePagination` - Pagination logic

### `/utils` - Utilities

- `generateSlug` - URL-friendly slug generation
- `getImageUrl` - Image URL helper
- `strengthColor`, `strengthIndicator` - Password strength
- `getColors`, `getShadow` - Theme helpers
- `obfuscateEmail`, `createMarkup` - String utilities

### `/types` - Type Definitions

- `ThemeMode`, `ThemeDirection` - Theme enums
- `LoadingState` - Loading state enum
- `KeyedObject`, `CustomShadowProps` - Utility types
- Auth, menu, and component types

## Development

```bash
# Install dependencies
npm install

# Start Storybook
npm run dev

# Build library
npm run build

# Run tests
npm test

# Type check
npm run type-check
```

## License

MIT
