# Frontend UI Standards — React + Vite + MUI + Redux + Formik

All global standards from `~/.claude/CLAUDE.md` apply. This file adds frontend-specific patterns and overrides.

**Standard stack:** React 18, Vite, TypeScript, MUI v5, Redux Toolkit + Redux Saga, Formik + Yup, Axios, AG Grid, notistack, React Router v6.

---

## Global CLAUDE.md Overrides

These frontend rules override or adapt specific global `~/.claude/CLAUDE.md` conventions:

| Global Rule | Frontend Override | Why |
|-----------|------------------|-----|
| Relative imports only | **Path aliases** (`store`, `utils/*`, `components/*`, `pages/*`, `hooks/*`, `types/*`) | Vite + tsconfig path aliases eliminate deep relative chains. Use relative imports only within the same feature module. |
| DI via `deps` parameter | **Hooks and Redux** for component dependencies | React components get dependencies through hooks (`useSelector`, `useDispatch`, `useNavigate`), not function parameter injection. DI still applies to pure utility functions. |
| Shared utils in `src/shared/utils/` | **`src/utils/`** for shared frontend utilities | Frontend projects use `src/utils/` as the shared location. |
| `npm run validate` | **Run `npm run lint && npm run check-ts && npm test` separately** | No unified validate script. Run all three before completing work. |
| No type assertions (`as`) | **Allowed for `formik.errors[name] as string \| undefined`** | Formik's error type is `string \| string[] \| FormikErrors<any> \| undefined`. Narrowing to `string \| undefined` is the established pattern across all form fields. Only place `as` is acceptable. |

---

## Tooling

### Prettier

Config: `.prettierrc` in project root.

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### ESLint

Config: `eslint.config.js` (flat config). Must include:

- `eslint.configs.recommended` — core JS rules
- `tseslint.configs.strict` — TypeScript strict (includes `no-explicit-any`, `no-non-null-assertion`)
- `tseslint.configs.stylistic` — TypeScript style conventions
- `reactHooks.configs['recommended-latest']` — Rules of Hooks
- `reactRefresh.configs.vite` — Vite HMR
- `eslint-config-prettier` — disables formatting rules that conflict with Prettier

**Custom rules:**
```
no-console: 'warn'
eqeqeq: 'error'
no-nested-ternary: 'error'
no-unneeded-ternary: 'error'
prefer-const: 'error'
no-return-assign: 'error'
prefer-template: 'error'
max-params: ['error', 5]
@typescript-eslint/no-unused-vars: ['warn', { argsIgnorePattern: '^_' }]
```

**Migration overrides** — these strict rules are set to `warn` while the existing codebase is migrated. New code must comply (treat as errors):
- `@typescript-eslint/no-explicit-any` — use proper types or `unknown`
- `@typescript-eslint/no-non-null-assertion` — use null checks instead of `!`
- `@typescript-eslint/consistent-type-definitions` — use `interface` over `type` for object shapes

When bootstrapping a new project, create `.prettierrc` and update `eslint.config.js` with these configs before writing any code.

---

## Critical Rules

1. **Redux Saga for all async** — no thunks (explicitly disabled in store config). All side effects flow through sagas.
2. **Formik + Yup for all forms** — derive form value types from Yup schemas via `InferType<typeof schema>`.
3. **MUI v5 only** — `@mui/material`, `@mui/lab`, `@ant-design/icons`. Never add a second component library.
4. **Typed Redux hooks from `store`** — always `import { useSelector, useDispatch } from 'store'`, never from `react-redux`.
5. **Cookie-based auth** — httpOnly cookies only. Never store tokens in localStorage or Redux state. Axios interceptor handles refresh.
6. **Dual-slice entity pattern** — every CRUD entity gets a page slice (UI state) AND an entity slice (normalized data).
7. **Co-locate feature code** — store, selectors, sagas, components, routes, validators, and constants live inside `pages/<feature>/`.
8. **One saga per file** — each operation gets its own file named `<operation><Entity>Saga.ts`.
9. **All pages wrapped in `PageWrapper`** — provides loading states and ErrorBoundary.
10. **Path aliases for cross-module imports** — relative imports only within the same feature.

---

## Directory Structure

```
src/
├── index.tsx                    # Entry — ReduxProvider + RouterProvider
├── App.tsx                      # Root layout — Theme → Locales → Notistack → Outlet + ModalManager + DrawerManager
├── config.ts                    # App-wide configuration constants
├── routes/index.tsx             # Route composition — merges all feature route modules
│
├── store/                       # Global Redux store
│   ├── index.ts                 # configureStore + typed useDispatch/useSelector exports
│   ├── reducers/index.ts        # combineReducers — { pages, entities, auth, ui, ... }
│   ├── sagas/rootsaga.ts        # Root saga — all([...feature saga watchers])
│   └── middleware/              # Custom saga middleware (navigation injection)
│
├── pages/                       # Feature modules — each is a self-contained domain
│   ├── <feature>/
│   │   ├── pages/               # Page-level components (Index, Create, Edit, Detail)
│   │   │   └── <Page>/
│   │   │       ├── index.tsx    # Page entry — orchestrates state, composes components
│   │   │       └── components/  # Page-local components (see Component Placement rule)
│   │   ├── components/          # Feature-shared components (reusable across pages)
│   │   ├── routes/              # <Feature>Routes.tsx — route definitions
│   │   ├── store/
│   │   │   ├── reducers/        # Page slice + entity slice + barrel index.ts
│   │   │   ├── sagas/           # One file per operation + watcher + barrel index.ts
│   │   │   └── selectors/       # Memoized selectors (<feature>Selectors.ts)
│   │   ├── validators/          # Yup schemas
│   │   └── constants/
│   └── ui/                      # Global UI state
│       ├── store/uiSlice.ts     # Modal stack, drawer, notifications
│       ├── ModalManager.tsx     # Renders active modal by type
│       └── DrawerManager.tsx    # Renders active drawer by type
│
├── components/                  # Shared/reusable components
│   ├── form-fields/             # Formik-coupled form field components
│   │   ├── BaseFieldWrapper/    # Label + error display wrapper (all fields compose this)
│   │   ├── TextField/
│   │   ├── SelectField/
│   │   ├── EmailField/
│   │   ├── PasswordField/
│   │   ├── DateTimePickerField/
│   │   ├── ImageUploadField/
│   │   ├── RichTextEditorField/
│   │   ├── SubmitButton/
│   │   └── ...                  # Each field in its own folder with index.tsx + tests
│   ├── DataGrid/                # AG Grid wrapper + ActionsCell
│   ├── ErrorBoundary/           # React class error boundary with fallback UI
│   ├── PageWrapper/             # Loading/error/empty wrapper + ErrorBoundary
│   ├── PageHeader/              # Title + subtitle + back button + header actions
│   ├── MainCard/                # Standard content card container
│   ├── ProtectedRoute/          # PersistLogin + AuthGuard
│   ├── FormDialog/              # MUI Dialog wrapper for form modals
│   ├── SkeletonLoader/          # Loading skeleton variants
│   └── layout/                  # App layouts (MainLayout, CommonLayout, etc.)
│
├── hooks/                       # Shared custom hooks (barrel-exported via index.ts)
├── utils/                       # Shared utilities
│   ├── axios.ts                 # Axios instance + 401 refresh interceptor
│   ├── api/<domain>/            # API client functions grouped by domain
│   ├── redux/                   # Redux factory utilities (createCrudSlice, createCrudSagas, etc.)
│   └── validation/              # Shared Yup schemas
│
├── types/                       # Shared TypeScript type definitions
│   └── overrides/               # MUI theme augmentation (.d.ts)
│
├── themes/                      # MUI theme configuration
├── contexts/                    # React contexts
├── providers/                   # Provider wrapper components
└── assets/                      # Static assets (images, fonts)
```

### Component Placement

Feature components live in one of two places under `features/<feature>/components/`:

**Page-local components** live in `features/<feature>/components/<Page>/` when:

1. They are only used by that one page.
2. They take the page's local state as props — they do not own data fetching, sagas, or selectors.
3. Their purpose is readability — extracting JSX out of the page file.

**Feature-shared components** live directly in `features/<feature>/components/` (not nested by page) when:

1. They are used by multiple pages within the feature (e.g., drawers, KPI components, shared cell renderers).
2. They are registered in the drawer/modal system.

```
features/carrier/
├── pages/
│   ├── CarrierListPage/
│   │   └── index.tsx              ← page orchestration only
│   └── CarrierDetailPage/
│       └── index.tsx
├── components/
│   ├── CarrierListPage/           ← page-local components
│   │   └── CarrierCellRenderers.tsx
│   ├── CarrierDetailPage/         ← page-local components
│   │   ├── GeneralTab.tsx
│   │   ├── DriversTab.tsx
│   │   └── ...
│   ├── CarrierKPI/                ← feature-shared
│   │   └── index.tsx
│   └── CarrierNoteDrawer/         ← feature-shared (registered in modal system)
│       └── index.tsx
```

When usage transitions from one page to two, move the component up from `components/<Page>/` to `components/` directly.

**Tab panels** live in `features/<feature>/components/<Page>/` with a `Tab` suffix (e.g., `GeneralTab.tsx`, `OverviewTab.tsx`). Do not create a separate `tabs/` folder.

**The `pages/` folder contains ONLY page index.tsx files.** No `components/` or `tabs/` subfolders under pages. If a section is large enough to deserve its own name and prop interface, give it its own file in `features/<feature>/components/<Page>/`.

---

## Naming Conventions

Extends global `~/.claude/CLAUDE.md` naming. Frontend-specific additions:

| Element | Convention | Example |
|---------|-----------|---------|
| Component folders | PascalCase | `BaseFieldWrapper/`, `MainCard/` |
| Page components | PascalCase | `PostIndex.tsx`, `CreatePost.tsx`, `EditPost.tsx` |
| Route files | PascalCase + `Routes` suffix | `BlogRoutes.tsx`, `DashboardRoutes.tsx` |
| Saga files | camelCase + `Saga` suffix | `createPostSaga.ts`, `fetchAllSaga.ts` |
| Slice files | camelCase + `Slice` suffix | `postPageSlice.ts`, `uiSlice.ts` |
| Selector files | camelCase + `Selectors` suffix | `postSelectors.ts` |
| Hook files | camelCase with `use` prefix | `useAuth.ts`, `useFormRef.ts` |
| API client files | camelCase by resource | `posts.ts`, `authors.ts`, `organization.ts` |
| Redux actions | camelCase, `Request`/`Success`/`Failure` | `fetchPostsRequest`, `createPostSuccess` |
| Selectors | camelCase + `Selector` suffix | `formattedPostsSelector`, `isLoadingSelector` |
| Env vars | `VITE_` prefix + UPPER_SNAKE | `VITE_API_URL`, `VITE_PORT` |

### Export Conventions
- **Default exports** for page components and layouts
- **Named exports** for utilities, types, selectors, hooks, shared components

---

## Code Style

Extends global `~/.claude/CLAUDE.md`. Frontend-specific additions:

### Component Typing
```typescript
// Shared components — React.FC with named export
export const TextField: React.FC<TextFieldProps> = ({ name, label, formik }) => { ... };

// Page components — arrow function with default export
const FeaturePage = () => { ... };
export default FeaturePage;
```

### Import Order
```typescript
// 1. React
import { useState, useEffect, useCallback, useMemo } from 'react';

// 2. External packages (MUI, router, icons, libraries)
import { Button, Grid, Stack } from '@mui/material';
import { useNavigate } from 'react-router';
import { EditOutlined } from '@ant-design/icons';

// 3. Internal aliases (cross-module)
import { useSelector, useDispatch } from 'store';
import MainCard from 'components/MainCard';
import { PageWrapper } from 'components/PageWrapper';
import { Post } from 'types/blog';

// 4. Relative imports (within same feature)
import { dataSelector } from '../store/selectors/featureSelectors';
import { fetchRequest } from '../store/reducers';
```

Blank line between each group.

### MUI Styling

**Primary — `sx` prop:**
- All one-off styles, spacing, layout, responsive adjustments
- Used directly on MUI components
- Extract to a const when the object is large or reused within the same file

**Secondary — `styled()` from `@mui/material/styles`:**
- Reusable styled components used across multiple files
- Complex selectors (pseudo-elements, media queries, nested selectors)
- When you need `shouldForwardProp` for custom prop filtering

**Banned:**
- `styled-components` package — do not use. Existing files are legacy; migrate when touching them.
- Inline `style={{}}` prop — use `sx` instead
- `makeStyles` / `createStyles` — MUI v4 API, not used

**`useTheme()` hook** — allowed only for accessing theme values in JS logic (conditional rendering, calculations). Not a styling approach itself.

---

## React Patterns

### Event Handler Naming
- `handle*` for callbacks defined in the component (`handleSubmit`, `handleSelectionChanged`)
- `on*` for callback props received from parent (`onSubmit`, `onCancel`, `onError`)

### Conditional Rendering
- 3+ branches (loading/error/empty/content): assign to a variable with if/else, render variable once
- Single optional element: `{condition && <Component />}`
- Simple two-way toggle: ternary (use sparingly)
- Never nest ternaries (enforced by `no-nested-ternary`)

### Memoization Rules
- `useCallback` — handlers passed as props to child components, AG Grid event handlers
- `useMemo` — AG Grid `gridOptions` and `columns` (required), expensive data transformations
- Do NOT memoize: inline handlers not passed to children, simple selectors, primitive values

### Hook Conventions
- Custom hooks return objects `{ value, handler }`, not tuples
- Compose `useSelector` calls — never use `store.getState()`
- Include cleanup in `useEffect` when tracking selection/UI state (dispatch clear on unmount)

### Accessibility
- `aria-label` on `IconButton` components
- `htmlFor` linking `InputLabel` to input `id` (already in BaseFieldWrapper)
- Wrap disabled elements in `<span>` inside `<Tooltip>` (disabled elements don't fire hover)
- Error containers use `role="alert"`

### Null/Undefined Handling
- `?.` for optional nested properties
- `??` (nullish coalescing) over `||` when `0` or `''` are valid values
- Tables/lists: display missing data as `''`
- Detail views: explicit fallback UI or `'—'`

### Date Handling
- Use `date-fns` for all date formatting and manipulation
- Do not use `moment` (legacy dependency, do not import)
- Do not use native `new Date().toLocaleDateString()` — use date-fns `format()` for consistency

---

## Architecture

### Bootstrapping Sequence
1. `index.tsx` — `ReduxProvider` wraps `RouterProvider` (createBrowserRouter)
2. `App.tsx` — Root `<Outlet />` wrapped in ThemeCustomization → Locales → Notistack, plus ModalManager + DrawerManager
3. Feature routes wrapped in `PersistLogin` → `AuthGuard` → layout component

### State Architecture — Dual Slice Pattern

Every CRUD entity gets TWO slices:

**Page Slice** — UI state (loading, errors, selections):
```typescript
// Created via createCrudSlice() factory or manually
{
  query: string;
  loading: { getAll: 'Idle' | 'Pending', 'update:<id>': 'Pending', ... };
  errors: { getAll: '', 'delete:<id>': 'Not found', ... };
  selectedIds: string[];
}
```
Uses composite keys (`"operation:entityId"`) for entity-level loading/error tracking.

**Entity Slice** — normalized data via createEntityAdapter:
```typescript
// Created via createEntityModule() factory
{
  ids: string[];
  entities: Record<string, Entity>;
  loading: boolean;
  error: string | null;
}
```

Register both in `store/reducers/index.ts`:
```typescript
const pages = combineReducers({ featurePage: featurePageReducer, ... });
const entities = combineReducers({ features: featuresReducer, ... });
```

### Redux Saga Flow

**Data flow:** Component dispatches action → Saga intercepts → API call → Update entity slice → Update page slice → Toast notification → Optional navigation.

**Saga structure — one file per operation:**
```typescript
export function* createFeatureSaga(action: ReturnType<typeof createFeatureRequest>) {
  try {
    const { data } = action.payload;

    // 1. API call
    const response: { feature: Feature } = yield call(createFeature, data);

    // 2. Update normalized entity store
    yield put(featureActions.addOne(response.feature));

    // 3. Update page state
    yield put(createFeatureSuccess({ feature: response.feature }));

    // 4. Success notification
    yield call(enqueueSnackbar, 'Feature created successfully', { variant: 'success' });

    // 5. Navigate
    const navigate = yield call(getNavigate);
    yield call(navigate, '/features');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create feature';
    yield put(createFeatureFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
```

**Watcher pattern — takeLatest:**
```typescript
export function* featureSagaWatcher() {
  yield takeLatest(fetchAllRequest.type, fetchAllSaga);
  yield takeLatest(createRequest.type, createSaga);
  yield takeLatest(updateRequest.type, updateSaga);
  yield takeLatest(deleteRequest.type, deleteSaga);
}
```

### CRUD Factory System

For standard CRUD entities, use the factory utilities in `utils/redux/`:
- `createCrudSlice()` — page slice with typed actions + selectors
- `createEntityModule()` — entity adapter slice with normalized state
- `createCrudSagas()` — saga generators with lifecycle hooks (beforeCreate, afterDelete, onError, etc.)

Write sagas manually only when the entity requires custom logic (e.g., image uploads, multi-step workflows).

### Selector Pattern

```typescript
// Memoized derived data
export const formattedDataSelector = createSelector(
  [(state: RootState) => entitySelectors.selectAll(state)],
  (items) => items.map((item) => ({
    ...item,
    displayDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
  }))
);

// Simple state access (no memoization needed)
export const pageLoadingSelector = (state: RootState) => state.pages.featurePage?.loading;

// Composed selectors
export const indexPageLoadingSelector = createSelector(
  [pageLoadingSelector],
  (loading) => loading.getAll === 'Pending'
);

// Parameterized selectors
export const selectById = (id: string | undefined) => (state: RootState) =>
  id ? entitySelectors.selectById(state, id) : undefined;
```

### Modal/Drawer Management

Centralized through `pages/ui/store/uiSlice.ts`:
```typescript
// Open
dispatch(openDrawer({ drawerType: 'BulkActions', drawerProps: { selectedIds } }));
dispatch(openModal({ modalType: 'ConfirmDelete', modalProps: { entityName } }));

// Close
dispatch(closeDrawer());
dispatch(closeModal());
```
`ModalManager` and `DrawerManager` in `App.tsx` render the active modal/drawer by type.

---

## API Layer

### Axios Setup
- Single instance at `utils/axios.ts` with `baseURL` from `VITE_API_URL`
- `withCredentials: true` for cookie-based auth
- Response interceptor: 401 → refresh token → retry queue → on failure, logout + redirect

### API Client Functions
```typescript
// utils/api/<domain>/<resource>.ts
import axios from 'utils/axios';

export const getAll = async () => {
  const response = await axios.get('/admin/features');
  return response.data;                                    // Returns array or { docs: [] }
};

export const getById = async (id: string): Promise<{ feature: Feature }> => {
  const response = await axios.get<Feature>(`/admin/features/${id}`);
  return { feature: response.data };                       // Wrapped for saga consumption
};

export const create = async (data: CreateInput): Promise<{ feature: Feature }> => {
  const response = await axios.post<Feature>('/admin/features', data);
  return { feature: response.data };
};

export const update = async (id: string, data: Partial<CreateInput>): Promise<{ feature: Feature }> => {
  const response = await axios.put<Feature>(`/admin/features/${id}`, data);
  return { feature: response.data };
};

export const remove = async (id: string) => {
  const response = await axios.delete(`/admin/features/${id}`);
  return response.data;
};
```

**Conventions:**
- Async arrow functions with explicit return types
- GET list returns `response.data` directly
- GET/POST/PUT single entity wraps in `{ entity: response.data }`
- Bulk operations: PATCH/DELETE with `{ ids: string[] }` body

---

## Form Patterns

### Stack: Formik + Yup + Mocho Form Fields

**Always use form-field components from `@mocho/ui`** when building forms. Import them via:
```typescript
import { TextField, SelectField, EmailField, SubmitButton } from '@mocho/ui/components/form-fields';
```

Available fields: `TextField`, `EmailField`, `PasswordField`, `PasswordFieldWithStrength`, `PasswordFieldWithChecklist`, `ConfirmPasswordField`, `OTPField`, `CheckboxField`, `SelectField`, `TypeaheadField`, `DateField`, `TimeField`, `CharCounterField`, `MultiSelectChipField`, `DateTimePickerField`, `ImageUploadField`, `DocumentImageUploadField`, `DeferredImageUploadField`, `RichTextEditorField`, `SubmitButton`, `SecondaryButton`, `FormLink`, `TermsNotice`, `FormError`, `HelperText`, `BaseFieldWrapper`.

Before creating a new form field component, check if one already exists in this library. Only create a new field if none of the existing ones can handle the use case.

**1. Define schema + derive types:**
```typescript
// validators/<entity>.ts
export const featureSchema = Yup.object({
  name: Yup.string().required('Name is required').min(3).max(100).trim(),
  description: Yup.string().required('Description is required'),
  status: Yup.mixed<FeatureStatus>().oneOf(Object.values(FeatureStatus)),
}).required();

export type FeatureFormValues = InferType<typeof featureSchema>;
```

**2. Form fields receive `formik` as prop:**
```typescript
<TextField name="name" label="Name" formik={formik} required />
<SelectField name="status" label="Status" options={statusOptions} formik={formik} />
```

**3. All fields compose BaseFieldWrapper:**
```typescript
export const TextField: React.FC<TextFieldProps> = ({ name, label, formik, ...rest }) => {
  const error = formik.errors[name] as string | undefined;
  const touched = formik.touched[name] as boolean | undefined;

  return (
    <BaseFieldWrapper name={name} label={label} error={error} touched={touched}>
      <OutlinedInput
        id={name}
        name={name}
        value={formik.values[name] || ''}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(touched && error)}
        fullWidth
      />
    </BaseFieldWrapper>
  );
};
```

Form fields are Formik-coupled. Do not create standalone controlled components.

---

## Error Handling

Three layers, each catches what the layer below doesn't:

| Layer | Handles | Mechanism |
|-------|---------|-----------|
| Axios interceptor | 401 auth expiry | Refresh token → retry queue → on failure: logout + redirect |
| Saga try/catch | API errors, business logic errors | Dispatch failure action + notistack toast |
| ErrorBoundary (via PageWrapper) | Render crashes | Fallback UI with retry |

**Saga error pattern:**
```typescript
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Operation failed';
  yield put(operationFailure({ error: errorMessage }));
  yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
}
```

**Notifications:** `notistack` with variants `success | error | warning | info`. Always called from sagas via `yield call(enqueueSnackbar, message, { variant })`.

---

## Testing

### Setup
- **Jest** + **React Testing Library** + **@testing-library/user-event**
- **redux-saga-test-plan** for saga testing
- Config: `jest.config.ts`, setup: `jest.setup.ts`

### Organization
- Component tests co-located: `ComponentName/ComponentName.test.tsx`
- Store tests in `store/__tests__/` or `store/reducers/__test__/`
- Utility tests in `utils/__tests__/`

### Patterns

**Component tests — mock formik factory:**
```typescript
const createMockFormik = (overrides = {}) => ({
  values: {},
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

describe('MyField', () => {
  it('renders with label', () => {
    render(<MyField name="field" label="Label" formik={createMockFormik()} />);
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('displays error when touched and has error', () => {
    const formik = createMockFormik({
      errors: { field: 'Required' },
      touched: { field: true },
    });
    render(<MyField name="field" label="Label" formik={formik} />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
```

**Accessibility-first queries:** `getByRole` > `getByText` > `getByLabelText` > `getByTestId` (last resort only).

**User interactions:**
```typescript
const user = userEvent.setup();
await user.type(screen.getByRole('textbox'), 'test@example.com');
await user.click(screen.getByRole('button', { name: /submit/i }));
```

---

## Templates

### Adding a New Feature Module

1. Create the feature folder structure:
```
pages/<feature>/
├── pages/                          # FeatureIndex.tsx, CreateFeature.tsx, EditFeature.tsx
├── components/                     # Feature-specific form/display components
├── routes/<Feature>Routes.tsx      # Route definitions
├── store/
│   ├── reducers/
│   │   ├── <feature>PageSlice.ts   # Page slice
│   │   ├── <feature>EntitySlice.ts # Entity slice
│   │   └── index.ts                # Barrel exports
│   ├── sagas/
│   │   ├── <feature>Sagas.ts       # Watcher
│   │   ├── fetch<Feature>sSaga.ts  # Individual operation sagas
│   │   ├── create<Feature>Saga.ts
│   │   └── index.ts
│   └── selectors/
│       └── <feature>Selectors.ts
├── validators/                     # Yup schemas
└── constants/
```

2. Register in global store:
   - Add page reducer to `store/reducers/index.ts` → `pages` combiner
   - Add entity reducer to `store/reducers/index.ts` → `entities` combiner
   - Add saga watcher to `store/sagas/rootsaga.ts`

3. Register routes in `routes/index.tsx`

### New Page Component
```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'store';
import { PageWrapper } from 'components/PageWrapper';
import { PageHeader } from 'components/PageHeader';
import MainCard from 'components/MainCard';

const FeatureIndexPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const data = useSelector(featureDataSelector);
  const isLoading = useSelector(featureLoadingSelector);

  useEffect(() => {
    dispatch(fetchFeaturesRequest());
  }, [dispatch]);

  return (
    <PageWrapper isLoading={isLoading} errorContext="FeatureIndexPage">
      <PageHeader
        title="Features"
        headerActions={<Button onClick={() => navigate('/features/new')}>Create</Button>}
      />
      <MainCard>
        {/* AG Grid table or content */}
      </MainCard>
    </PageWrapper>
  );
};

export default FeatureIndexPage;
```

---

## Do NOT

- **Use thunks** — sagas only (thunks disabled in store config)
- **Import `useDispatch`/`useSelector` from `react-redux`** — use typed exports from `store`
- **Store auth tokens in state or localStorage** — cookies only
- **Use `React.useState` for server data** — server state belongs in Redux entity slices
- **Put side effects in components** — dispatch actions, let sagas orchestrate
- **Write saga logic in watcher files** — one operation per saga file
- **Skip `PageWrapper`** — all pages need ErrorBoundary + loading states
- **Add a second UI component library** — MUI v5 + Ant Design icons only
- **Create standalone form inputs** — all form fields compose `BaseFieldWrapper` and receive `formik` prop
- **Create new form field components without checking `@mocho/ui/components/form-fields` first** — use existing mocho form fields
- **Use `getByTestId` in tests** — prefer accessibility queries
- **Use React Hook Form, Zustand, or Jotai** — Formik + Yup for forms, Redux for state
- **Use `moment`** — legacy dependency. Use `date-fns` for all date operations.
- **Use inline `style={{}}`** — use the `sx` prop on MUI components instead
- **Use `styled-components`** — use MUI's `styled()` from `@mui/material/styles` for reusable styled components
- **Declare components inside `pages/<Page>/index.tsx`** — extract them to `features/<feature>/components/<Page>/`. The page file orchestrates state and composes components, it does not declare them.
- **Create a `tabs/` or `components/` folder under a page** — page-local components live in `features/<feature>/components/<Page>/`, not under the pages directory. The `pages/` folder contains only page index.tsx files.
- **Put page-local components directly in `features/<feature>/components/`** — if it's only used by one page, nest it under `components/<Page>/`. Only promote to `components/` directly when shared across pages.

---

## Component Selection Rules

When building or refactoring a page, use these shared components. Do not build equivalent functionality from raw MUI primitives.

| Need | Use This | NOT This |
|------|----------|----------|
| Table wrapper on list pages | `MainCard` | Raw `Card` or `Paper` |
| Content sections on detail pages | `SectionCard` | `MainCard` (reserve for list page table wrappers) |
| Section title with edit action | `SectionHeader` | Custom header JSX |
| Filter bar on list pages | `FilterBar` (from `components/FilterBar`) | Inline `Stack` + `Select` + `TextField` |
| Search input | `DebouncedInput` (from `mocho/components`) | Custom `useState` + `setTimeout` debounce |
| Empty table/list state | `EmptyState` (from `mocho/components`) | Inline `<Typography>No X found</Typography>` |
| Row actions in tables | `ActionsCell` (from `mocho/components/DataGrid`) | Inline buttons in cell renderers |
| Key-value display on detail pages | `DetailRow` (from `components/Typography`) | Custom `Grid` + `Typography` pairs |
| KPI summary on list pages | `ListKpiBar` (from `components/ListKpiBar`) | Inline `Grid` + `MainCard` KPI construction |
| KPI summary on detail pages | `<Feature>KPI` component (feature-shared, column-grouped layout) | Inline KPI cells or flat grid of KpiCells |
| Documents tab | `DocumentsTab` (from `components/DocumentsTab`) | Inline `Box` + `Button` + `DocumentTable` |
| Data tables | `NewDataGrid` (from `mocho/components`) | Custom table implementations |

---

## List Page Standard Structure

Every list page follows this composition:

```
PageWrapper (errorContext only — NO isLoading prop)
  └─ ListLayout (title bar + Export + Create buttons)
       ├─ ListKpiBar (sx={{ mb: 4, px: { xs: 2, sm: 3 }, pt: 2 }})
       └─ Box (px: { xs: 2, sm: 3 }, pb: 3, flex column)
            └─ MainCard (content={false}, flex column)
                 ├─ Box (px: 2, py: 1.5)
                 │    └─ FilterBar (declarative filter config + search)
                 └─ Box (flex: 1, minHeight: 0)
                      └─ Box (minHeight: { xs: 300, md: 420 }, flex: 1)
                           └─ NewDataGrid (loading={isLoading}, rowHeight: 56, pagination: true)
```

### List page rules

- **No `isLoading` on PageWrapper.** PageWrapper unmounts children when loading, which destroys DebouncedInput and causes an infinite fetch loop. Use the grid's own `loading` prop instead.
- **Loading selectors treat `undefined` as loading.** The `loading['getAll']` key starts as `undefined` (empty object). Selectors must return `true` for both `undefined` and `LoadingState.Pending`:
  ```typescript
  export const selectFeatureListLoading = (state: RootState) => {
    const status = state.pages.feature.loading['getAll'];
    return status === undefined || status === LoadingState.Pending;
  };
  ```
- **DebouncedInput `value` must be `''` (initial only).** Never pass a state variable back as the search config `value`. DebouncedInput manages its own internal state. Feeding state back creates an infinite loop (`onChange` → setState → value prop changes → DebouncedInput syncs → onChange` fires again).
- Cell renderers live in `pages/<Page>/components/<Feature>CellRenderers.tsx` — never inline in the page file.
- All tables must have `ActionsCell` with at minimum a view action.
- Empty state uses `noDataComponent` with `<EmptyState variant="no-results" entityName="Feature" compact />`.
- Footer uses `showRowCountFooter={true}` with `totalRowCount` and `rowCountLabel`.

---

## Detail Page Standard Structure

Every detail page follows this composition:

```
PageWrapper
  └─ DataGuard (loading/error/not-found handling)
       └─ DetailLayout (back button + entity name + status badge + action buttons)
            ├─ summary={<FeatureKPI ... />} — rendered inside SummaryBar by DetailLayout
            ├─ DetailTabBar (tab navigation)
            └─ Tab panels (in pages/<Page>/components/ with Tab suffix)
                 └─ SectionCard + DetailRow for content sections
```

- Tab components live in `pages/<Page>/components/` with a `Tab` suffix (e.g., `OverviewTab.tsx`). No separate `tabs/` folder.
- Summary KPIs are extracted to a `<Feature>KPI` component in `features/<feature>/components/` — never inline in the page file.
- Sidebar layout (when used): `Grid md={8}` (main) + `Grid md={4}` (sidebar).

### Detail page KPI bar pattern

The `summary` prop passed to `DetailLayout` is wrapped in `SummaryBar`, which provides the container styling (white background, padding, bottom border). **Do not add your own border/background container** — just return the Grid content.

Every KPI component uses the **column-grouped label:value** layout:

```typescript
// FeatureKPI component structure
<Grid container spacing={2}>
  <Grid item sm={6} md={3}>
    <KpiLabel>COLUMN TITLE</KpiLabel>
    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
      <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Label:</BodyMuted>
      <BodyStrong sx={{ lineHeight: 1.3 }}>value</BodyStrong>
    </Box>
    {/* more rows... */}
  </Grid>
  {/* more columns... */}
</Grid>
```

- **Column headers:** `<KpiLabel>` (uppercase overline style)
- **Row labels:** `<BodyMuted>` with `minWidth: 80, flexShrink: 0` for alignment
- **Row values:** `<BodyStrong>` for text, `<LinkText>` for clickable values
- **Grid columns:** `sm={6} md={3}` for 4-column, `md={4}` for 3-column
- Group related data into named columns (e.g., "Company Info", "Contact", "Fleet", "Financials")

---

## Drawer vs Modal Decision Framework

```
Does the user need to see the parent page while doing this?
  YES → DRAWER (slide-in panel, page stays visible)
  NO →
    Is this a complex, multi-section primary task?
      YES → FULL PAGE (own route, bookmarkable)
      NO → MODAL (focused overlay, blocks page)
```

> **Drawers maintain flow. Modals demand a decision. Pages commit to a task.**

### Sizing Conventions

- **Drawers:** 480px width (standard), 640px (wide — route editing, cargo forms), always right-anchored
- **Modals:** `sm` (400px) for confirmations, `md` (600px) for forms with 2-4 fields
- **Full pages:** Standard app layout with back navigation

### Examples

| Use Case | Type | Why |
|----------|------|-----|
| Edit entity info/preferences | Drawer | User references detail page while editing |
| Upload documents | Drawer | User sees document list for context |
| Confirm delete | Modal | Self-contained yes/no decision |
| Status transition with warning | Modal | Read warning, decide |
| Send invoice (enter email) | Modal | Quick input, no page context needed |
| Add a note | Modal | Quick text entry |
| Mark as paid (confirm amount) | Modal | Self-contained confirmation |
| Generate settlement | Modal | Trigger + params, self-contained |
| Create load | Full page | Complex multi-section primary task |

---

## Drawer/Modal Opening Checklist

When adding a new drawer or modal to any feature:

1. **Decide type:** Use the decision tree above — drawer, modal, or full page?
2. **Create the component** in `features/<feature>/components/<ComponentName>/index.tsx`
3. **Add the type** to `DrawerType` or `ModalType` union in `features/ui/types/popupTypes.ts`
4. **Add the prop shape** to `DrawerTypeMap` or `ModalTypeMap` in the same file
5. **Register** the component in `features/ui/drawerRegistry.ts` or `features/ui/modalRegistry.ts`
6. **Open** via `useDrawerActions().openDrawer(type, { entityId })` or `useModalActions().openModal(type, props)` — **never `useState`**
7. **Close** via the `onClose` prop provided by DrawerManager/ModalManager — **never local state**
8. **Test** that opening a second drawer/modal replaces the first cleanly (no orphaned state)

**Pass IDs, not objects** — drawers/modals receive entity IDs and read data from Redux store via selectors. This ensures always-current data and avoids stale prop issues.

**Dirty form protection** — drawers with forms use `EditDrawer` which handles dirty state internally with a nested `ConfirmDialog`. This is a local concern of the drawer, not a Redux modal.

---

## Table Standards

All data tables MUST use `NewDataGrid` (AG Grid wrapper from `mocho/components`). No custom table implementations.

| Setting | Value | Required |
|---------|-------|----------|
| `rowHeight` | `56` | Yes — all tables |
| `pagination` | `true` | Yes — all tables |
| `paginationPageSize` | `25` | Yes — all tables |
| `headerHeight` | `44` | Yes — all tables |
| `ActionsCell` | At minimum a view action | Yes — all tables |
| `domLayout` | `'normal'` | Yes — all tables |

- Cell renderers are extracted to `pages/<Page>/components/<Feature>CellRenderers.tsx` — never defined inline in page files.
- Row click navigates to detail page. ActionsCell provides visible action discoverability.
- Empty state uses `noDataComponent` prop with `EmptyState` component.
- Footer uses `showRowCountFooter={true}` with `totalRowCount` and `rowCountLabel`.

---

## Typography Standards

All text MUST use semantic Typography helpers from `components/Typography/`. **Never use raw `<Typography variant="...">`** in new or refactored code.

| Context | Component | Example |
|---------|-----------|---------|
| Page titles | `PageTitle` | "Carriers", "Driver Detail" |
| Section/card titles | `SectionTitle` | "Company Information", "Dispatch Terms" |
| Entity IDs and reference numbers | `EntityId` | "MC-123456", "LOAD-789" |
| Large monetary values (KPIs, summaries) | `AmountDisplay` | "$45,230.00" |
| Inline monetary values (table cells) | `Amount` | "$1,500" |
| Standard body text | `Body` | Table cells, descriptions, labels |
| Emphasized/bold text | `BodyStrong` | KPI values, important fields |
| Medium-weight text | `BodyMedium` | Sub-headers, field values |
| Secondary/muted text | `BodyMuted` | Subtitles, helper text, timestamps |
| Drawer headers | `DrawerTitle` | "Edit Company Info" |
| Modal headers | `ModalTitle` | "Confirm Delete" |
| KPI labels (overline style) | `KpiLabel` | "Total Revenue", "Active Drivers" |
| Field labels in forms/details | `FieldLabel` | "Email", "Phone Number" |
| Table column headers | `TableHeaderLabel` | Custom header renderers |
| Timestamps | `Timestamp` | "Updated 2 hours ago" |
| Warning/error/success text | `WarningText` / `ErrorText` / `SuccessText` | Inline status messages |

### Composite Typography Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `KpiCell` | Label + value + optional subtitle for KPI displays | `{ label, value, sub? }` |
| `TwoLineCell` | Two-line table cell (primary + secondary) | `{ primary, secondary }` |
| `DetailRow` | Key-value row for detail pages | `{ label, value }` |
