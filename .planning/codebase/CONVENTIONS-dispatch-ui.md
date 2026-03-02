# Coding Conventions — dispatch-ui (hussle-app-dispatch-ui)

Conventions detected from source analysis. This package follows the frontend standards defined in `CLAUDE.md`.

## File Naming & Structure

| Convention | Pattern | Example |
|------------|---------|---------|
| Component folders | PascalCase with index export | `components/MainCard/index.tsx`, `components/PageWrapper/index.tsx` |
| Page components | PascalCase, default export | `pages/home/pages/HomePage.tsx` |
| Route files | PascalCase with `Routes` suffix | `pages/home/routes/HomeRoutes.tsx` |
| Redux slice files | camelCase with `Slice` suffix | `pages/ui/store/uiSlice.ts` |
| Utility files | camelCase | `config.ts`, `axios.ts` |
| Theme files | Matches folder name | `themes/index.tsx` |

## Imports & Path Resolution

| Convention | Pattern | Example |
|------------|---------|---------|
| Path aliases (cross-module) | Direct imports from modules | `import MainCard from 'components/MainCard'` |
| Relative imports (same feature) | Relative paths within feature | Not yet in use; follow `pages/<feature>/` pattern |
| Barrel exports | Named & default exports in index files | `export const PageWrapper: React.FC...` and `export default MainCard` |
| Type imports | `import type` for TypeScript types | `import type { ReactNode } from 'react'` |
| Import order | React → External → Aliases → Relative | See files for examples |

## Component Patterns

| Convention | Pattern | Example |
|------------|---------|---------|
| Shared component typing | `React.FC` with named export | `export const PageWrapper: React.FC<Props> = (...) => {...}` |
| Page component typing | Arrow function, default export | `const HomePage = () => {...}; export default HomePage;` |
| Props interface naming | `<ComponentName>Props` | `PageWrapperProps`, `MainCardProps` |
| Documentation | JSDoc above component | `/** Wraps pages with loading state, error handling, and ErrorBoundary. */` |
| Children prop typing | `ReactNode` from React | `children: ReactNode` |

## Redux Patterns

| Convention | Pattern | Example |
|------------|---------|---------|
| Redux hooks | Typed exports from `store/index.ts` | `import { useSelector, useDispatch } from 'store'` |
| Store configuration | `configureStore` with saga middleware | Thunks disabled (`thunk: false`) |
| Dual-slice pattern | Page slices + entity slices | `pages` + `entities` in root reducer |
| Action creators | Named exports from reducers | `export const { openModal, closeModal } = uiSlice.actions` |
| Selectors | Basic selector functions (not yet memoized) | To be implemented with `createSelector` |

## Styling

| Convention | Pattern | Example |
|------------|---------|---------|
| MUI styling | `sx` prop on components | `<Box sx={{ display: 'flex', mb: 3 }}>` |
| Theme | `createTheme` for palette & typography | `themes/index.tsx` defines primary/secondary colors |
| Component library | MUI v5 only | `@mui/material` components throughout |

## Type Safety

| Convention | Pattern | Example |
|------------|---------|---------|
| Interface naming | PascalCase, exported | `interface PageWrapperProps { ... }` |
| State typing | Explicit types on interfaces | `interface UiState { modal: ModalState | null; ... }` |
| Redux state types | Derived from `store.getState()` | `type RootState = ReturnType<typeof store.getState>` |
| Type narrowing | Type guards (Error handling) | Error handling in sagas and components uses `instanceof` |

## Error Handling

| Convention | Pattern | Example |
|------------|---------|---------|
| Error boundaries | Class-based wrapper | `ErrorBoundary` component with fallback UI |
| HTTP errors | Axios interceptor with refresh | 401 triggers token refresh → retry or logout |
| Error display | `role="alert"` for accessibility | Error boxes in `PageWrapper` and `ErrorBoundary` |

## Testing

| Convention | Pattern | Status |
|------------|---------|--------|
| Test file location | Co-located or `__tests__/` | No tests written yet |
| Test naming | `.test.tsx` or `.spec.ts` | Not yet implemented |
| Testing library | Jest + React Testing Library | Configured in `jest.config.ts` |

## Code Style

| Convention | Pattern | Example |
|------------|---------|---------|
| Variables | `const` (default), `let` when reassigning | All variable declarations use `const` |
| Equality | Always `===` and `!==` | Code uses strict equality throughout |
| Ternary operators | Avoid nesting | Used in conditional rendering (e.g., `{subtitle && ...}`) |
| Arrow functions | For callbacks and definitions | `const handleRetry = () => {...}` |
| Object shorthand | Used where applicable | Components use destructuring in props |
| JSDoc | Multiline comments above functions | `/** Description here */` above components |

## Redux Saga Patterns

| Convention | Pattern | Status |
|------------|---------|--------|
| Saga watchers | `rootsaga.ts` with `fork()` or `takeLatest()` | Basic structure in place (`src/store/sagas/rootsaga.ts`) |
| One saga per operation | Named `<operation><Entity>Saga.ts` | Not yet implemented; structure awaits feature development |
| Error handling | try/catch with dispatch failure actions | To follow standard pattern when sagas added |
| Notifications | Via `notistack` from sagas | Not yet implemented |

## Key Observations

1. **Early-stage codebase** — scaffolded structure in place, minimal feature implementation
2. **Framework adherence** — strict compliance with `CLAUDE.md` standards for React/Redux/MUI
3. **No tests written yet** — test infrastructure configured but no test files present
4. **Placeholder patterns** — root saga and entity reducers have placeholders awaiting features
5. **Type safety strong** — all components and Redux store properly typed
6. **MUI focused** — exclusively uses MUI v5 for styling, no mixed UI libraries

## Notable Deviations / TODO

- No Formik form implementations yet (configured in CLAUDE.md, not used)
- No API integration layer beyond axios setup (`utils/axios.ts`)
- No feature modules with full CRUD yet (structure exists, awaits features)
- No tests — infrastructure ready, files not created
- No date formatting with `date-fns` yet (dependency available, no usage)
