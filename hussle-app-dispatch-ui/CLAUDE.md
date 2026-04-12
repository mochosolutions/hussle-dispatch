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

Feature components live in one of two places. The choice is governed by a strict rule, not by intuition.

**A component lives in `pages/<feature>/pages/<Page>/components/` (page-local) when ALL of the following are true:**

1. It is only used by this one page.
2. It takes the page's local state as props — it does not own data fetching, sagas, or selectors.
3. Its purpose is readability — extracting a chunk of JSX out of the page file.
4. It is not a candidate for reuse even hypothetically (not a generic card, drawer, dialog, table, or form field).

**Otherwise it lives in `pages/<feature>/components/` (feature-shared).**

When usage transitions from one page to two, move the component up to the feature-shared bucket. Default to page-local when current usage is single-page — promote on demand, not on speculation.

**Tab panels are page-local components.** A tabbed detail page's tabs (e.g., `OverviewTab.tsx`, `FinancialsTab.tsx`) live in `pages/<Page>/components/` alongside any other page-local components. Do not create a separate `tabs/` folder — the `Tab` filename suffix already conveys the role.

**Defining components inside `pages/<Page>/index.tsx` is not allowed.** If a section is large enough to deserve its own name and prop interface, give it its own file in `components/`. The page `index.tsx` should orchestrate state and compose components, not declare them.

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
- **Declare components inside `pages/<Page>/index.tsx`** — extract them to `pages/<Page>/components/`. The page file orchestrates state and composes components, it does not declare them.
- **Create a `tabs/` folder under a page** — tab panels are page-local components. They live in `pages/<Page>/components/` like everything else; the `Tab` filename suffix conveys the role.
- **Put page-local components in the feature-shared `components/` bucket** — if it's only used by one page, takes that page's state as props, and exists for readability, it belongs in `pages/<Page>/components/`. See the Component Placement rule.
