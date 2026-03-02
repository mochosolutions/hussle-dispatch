# REGISTRY-dispatch-ui

**Scan Timestamp:** 2026-03-01
**Package:** hussle-app-dispatch-ui (dispatch-ui)
**Type:** Frontend (React + MUI + Redux + Vite)
**Stack:** React 18, Vite, TypeScript, MUI v5, Redux Toolkit + Redux Saga, Formik + Yup, Axios, notistack, React Router v7

---

## Pages & Routes

| Page Component | Path | Key Props | Status |
|---|---|---|---|
| HomePage | `/` | N/A | Scaffold — uses shared PageWrapper, PageHeader, MainCard from @mocho/ui |

| Routes File | Location | Purpose |
|---|---|---|
| HomeRoutes | `src/pages/home/routes/HomeRoutes.tsx` | Defines home feature routes as RouteObject[] |
| Router Setup | `src/routes/index.tsx` | Root router creation via createBrowserRouter, merges HomeRoutes |

---

## Shared Components

| Component | Location | Props | Purpose |
|---|---|---|---|
| PageWrapper | `src/components/PageWrapper/index.tsx` | `{ children: ReactNode; isLoading?: boolean; error?: string \| null; errorContext?: string; }` | Wraps pages with loading spinner, error display, ErrorBoundary |
| ErrorBoundary | `src/components/ErrorBoundary/index.tsx` | `{ children: ReactNode; fallback?: ReactNode; }` | Class component for render error capture; displays error message + retry button |
| PageHeader | `src/components/PageHeader/index.tsx` | `{ title: string; subtitle?: string; headerActions?: ReactNode; }` | Page title, optional subtitle, action buttons row |
| MainCard | `src/components/MainCard/index.tsx` | `{ children: ReactNode; sx?: SxProps<Theme>; }` | Standard MUI Card container with CardContent |

---

## Data Fetching & API Layer

| Function | Location | Parameters | Returns | Endpoint |
|---|---|---|---|---|
| axiosInstance | `src/utils/axios.ts` | N/A | Configured axios client | — |

**Axios Setup:**
- baseURL: `config.apiUrl` (VITE_API_URL env var, default: http://localhost:3000)
- withCredentials: `true` (cookie-based auth)
- 401 Response Interceptor: Attempts POST `/auth/refresh` → retries original request or redirects to `/login`

**Note:** No feature-level API client functions exist yet. Ready for addition per architecture.

---

## State Management

### Redux Store Architecture

| Slice | Location | Type | Reducers | Purpose |
|---|---|---|---|---|
| ui | `src/pages/ui/store/uiSlice.ts` | Page slice | `openModal`, `closeModal`, `openDrawer`, `closeDrawer` | Global modal/drawer stack |

**UI Slice State Shape:**
```typescript
{
  modal: { modalType: string; modalProps: Record<string, unknown> } | null;
  drawer: { drawerType: string; drawerProps: Record<string, unknown> } | null;
}
```

**Root Reducer Structure:**
```typescript
{
  pages: { ui: UiState },
  entities: { _placeholder: {} }  // Ready for entity slices
}
```

**Sagas:** `rootSaga` (src/store/sagas/rootsaga.ts) is configured but empty; watchers will be added per feature.

### Redux Hooks & Types

| Export | Location | Type | Usage |
|---|---|---|---|
| useDispatch | `src/store/index.ts` | Typed hook | `const dispatch = useDispatch()` → AppDispatch type |
| useSelector | `src/store/index.ts` | Typed hook | `const value = useSelector(selector)` → RootState type |
| RootState | `src/store/index.ts` | Type | State shape; auto-generated from store.getState() |
| AppDispatch | `src/store/index.ts` | Type | Dispatch signature |

**Import:** Always `import { useDispatch, useSelector } from 'store'` (typed, not from react-redux)

---

## Configuration & Theme

| Config | Location | Value | Purpose |
|---|---|---|---|
| appConfig | `src/config.ts` | `{ apiUrl: string; appName: 'Hussle Dispatch'; }` | App-wide constants |
| theme | `src/themes/index.tsx` | MUI createTheme object | Primary: #1976d2, Secondary: #9c27b0, Font: Inter/Roboto |

---

## Application Bootstrap

| File | Location | Role |
|---|---|---|
| index.tsx | `src/index.tsx` | Entry point — ReduxProvider → RouterProvider |
| App.tsx | `src/App.tsx` | Root layout — ThemeProvider → CssBaseline → SnackbarProvider (notistack) → Outlet |

---

## Shared Hooks & Utilities

| Export | Location | Type | Exports |
|---|---|---|---|
| hooks/index.ts | `src/hooks/index.ts` | Barrel export | Empty (ready for custom hooks) |

---

## Key Patterns & Conventions

### Store Registration Pattern (Future)
1. Create feature folder: `pages/<feature>/store/`
2. Define page slice + entity slice
3. Add to `store/reducers/index.ts`: `{ pages, entities }`
4. Add watcher to `store/sagas/rootsaga.ts`: `yield all([...watchers])`
5. Register routes in `routes/index.tsx`

### Component Typing
- Shared components: `React.FC<Props>` with named export
- Page components: Arrow function with default export
- All components use MUI `sx` prop for styling, never inline `style={}`

### Error Handling
- Axios 401 interceptor: Refresh token → retry or redirect to /login
- Saga try/catch (future): Dispatch failure action + notistack toast
- ErrorBoundary: Catches render crashes, displays error + retry button

### Responsive MUI
- Use `sx` prop with theme breakpoints: `sx={{ md: { width: '50%' } }}`
- Responsive layout via Box/Grid with sx prop
- No CSS modules, no styled-components (legacy only)

---

## Representative Patterns

### Page Component Pattern
```typescript
// src/pages/home/pages/HomePage.tsx
import { Typography } from '@mui/material';
import { PageWrapper, PageHeader, MainCard } from '@mocho/ui/components';

const HomePage = () => {
  return (
    <PageWrapper errorContext="HomePage">
      <PageHeader title="Hello Hussle" subtitle="Fleet Command Dispatch" />
      <MainCard>
        <Typography variant="body1">
          Welcome to the Hussle App Dispatch UI. This is your fleet
        </Typography>
      </MainCard>
    </PageWrapper>
  );
};

export default HomePage;
```

### Shared Component Pattern (PageWrapper with Loading/Error)
```typescript
// src/components/PageWrapper/index.tsx
interface PageWrapperProps {
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  errorContext?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  isLoading = false,
  error = null,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box role="alert" sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </Box>
    );
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};
```

### Redux Store Setup Pattern
```typescript
// src/store/index.ts
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
      serializableCheck: false,
    }).concat(sagaMiddleware as Middleware),
});

sagaMiddleware.run(rootSaga);

export const useDispatch: () => AppDispatch = useReduxDispatch;
export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;
```

### Axios Interceptor Pattern (Auth Refresh)
```typescript
// src/utils/axios.ts
const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(`${config.apiUrl}/auth/refresh`, {}, { withCredentials: true });
        return axiosInstance(originalRequest);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
```
