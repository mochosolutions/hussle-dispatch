# Registry — hussle-app-dispatch-ui

React 18 + MUI v5 + Redux Toolkit + Redux Saga + Formik/Yup frontend.

---

## 1. Inventory

### Pages & Routes

| Name | Path | Route |
|------|------|-------|
| DashboardPage | `features/dashboard/pages/index.tsx` | `/` |
| DispatchBoardPage | `features/load/pages/DispatchBoardPage/` | `/loads` |
| CreateLoadPage | `features/load/pages/CreateLoadPage/` | `/loads/create` |
| LoadDetailPage | `features/load/pages/LoadDetailPage/` | `/loads/:id` |
| CarrierListPage | `features/carrier/pages/CarrierListPage/` | `/carriers` |
| CreateCarrierPage | `features/carrier/pages/CreateCarrierPage/` | `/carriers/create` |
| CarrierDetailPage | `features/carrier/pages/CarrierDetailPage/` | `/carriers/:id` |
| DriverListPage | `features/driver/pages/DriverListPage/` | `/drivers` |
| DriverDetailPage | `features/driver/pages/DriverDetailPage/` | `/drivers/:id` |
| VehicleListPage | `features/vehicle/pages/VehicleListPage/` | `/vehicles` |
| VehicleDetailPage | `features/vehicle/pages/VehicleDetailPage/` | `/vehicles/:id` |
| CustomerListPage | `features/customer/pages/CustomerListPage/` | `/customers` |
| CreateCustomerPage | `features/customer/pages/CreateCustomerPage/` | `/customers/create` |
| CustomerDetailPage | `features/customer/pages/CustomerDetailPage/` | `/customers/:id` |
| ContactListPage | `features/contact/pages/ContactListPage/` | `/contacts` |
| ContactDetailPage | `features/contact/pages/ContactDetailPage/` | `/contacts/:id` |
| PlaceListPage | `features/place/pages/PlaceListPage/` | `/places` |
| PlaceDetailPage | `features/place/pages/PlaceDetailPage/` | `/places/:id` |
| InvoicesPage | `features/invoices/pages/index.tsx` | `/invoices` |
| InvoiceDetailPage | `features/invoices/pages/InvoiceDetailPage.tsx` | `/invoices/:id` |
| InvoiceBuilderPage | `features/invoices/pages/InvoiceBuilderPage/` | `/invoices/:id/build` |
| LoadIntelligencePage | `features/loadintelligence/pages/index.tsx` | `/intelligence` |
| SettingsPage | `features/settings/pages/SettingsPage/` | `/settings` |
| DriverPortalPage | `features/driver-portal/pages/DriverPortalPage/` | `/driver-portal` |
| Login/Register/etc. | `features/auth/pages/` | `/login`, `/register`, `/forgot-password`, etc. |

### Shared Components

| Name | Path | Purpose |
|------|------|---------|
| AppLayout | `components/AppLayout/` | Main app shell (sidebar + top bar + `<Outlet />`) |
| PageWrapper | `components/PageWrapper/` | Loading/error/empty wrapper + ErrorBoundary |
| ListLayout | `components/ListLayout/` | Standard list page layout (title + actions + content) |
| DetailLayout | `components/DetailLayout/` | Standard detail page layout |
| DetailTabBar | `components/DetailTabBar/` | Tab navigation for detail pages |
| MainCard | `components/MainCard/` | Content card container |
| SectionCard | `components/SectionCard/` | Grouped section within a page |
| PageHeader | `components/PageHeader/` | Title + subtitle + back button + actions |
| InnerPageHeader | `components/InnerPageHeader/` | Secondary-level page header |
| SectionHeader | `components/SectionHeader/` | Section title within a card |
| EditDrawer | `components/EditDrawer/` | Side drawer with dirty-form guard + confirm dialog |
| SummaryBar | `components/SummaryBar/` | KPI/summary metrics bar |
| SplitButton | `components/SplitButton/` | Dropdown action button |
| ActionMenu | `components/ActionMenu/` | Context menu for row actions |
| AvatarChip | `components/AvatarChip/` | Avatar + label chip |
| StatusBadge | `components/Statusbadge/` | Colored status indicator |
| ContextualAlert | `components/ContextualAlert/` | Inline alert banner |
| FileUploadRow | `components/FileUploadRow/` | File upload with progress |
| Typography | `components/Typography/` | Custom typography variants (SectionLabel, etc.) |
| ErrorBoundary | `components/ErrorBoundary/` | React class error boundary |
| ErrorPage | `components/ErrorPage/` | 404/error fallback page |
| ProtectedRoute | `components/ProtectedRoute/` | PersistLogin + AuthGuard wrappers |
| Loader | `components/Loader/` | Full-screen loading spinner |
| AddressTypeahead | `components/AddressTypeahead/` | Place/address autocomplete input |

### Hooks

| Name | Path | Purpose |
|------|------|---------|
| useAuth | `hooks/useAuth.ts` | Auth state access |
| useConfig | `mocho/hooks/useConfig.ts` | App config access |
| useDocumentUpload | `mocho/hooks/useDocumentUpload.ts` | Document upload flow |
| useLayoutState | `mocho/hooks/useLayoutState.ts` | Sidebar/layout state |
| useLocalStorage | `mocho/hooks/useLocalStorage.ts` | localStorage wrapper |
| usePagination | `mocho/hooks/usePagination.ts` | Pagination state |
| useDirtyFormBlocker | `mocho/hooks/useDirtyFormBlocker.ts` | Blocks navigation on dirty forms |
| useFormRef | `mocho/hooks/useFormRef.ts` | Imperative Formik ref |
| useFormHandle | `mocho/hooks/useFormHandle.ts` | External form submit handle |
| useAutoFocus | `mocho/hooks/useAutoFocus.ts` | Auto-focus first input |
| useUserInteractionDirty | `mocho/hooks/useUserInteractionDirty.ts` | Tracks user-initiated changes |
| useDrawerActions | `features/ui/hooks/useDrawerActions.ts` | Open/close drawer helpers |
| useModalActions | `features/ui/hooks/useModalActions.ts` | Open/close modal helpers |
| useRouteDistance | `features/load/components/CreateLoadForm/sections/StopsSection/useRouteDistance.ts` | Calculates route mileage between stops |

### API Layer (`utils/api/`)

| Name | Path | Key Functions |
|------|------|---------------|
| carrierApi | `fleet/carrierApi.ts` | getCarriers, getCarrier, createCarrier, updateCarrier, deleteCarrier |
| driverApi | `fleet/driverApi.ts` | getDrivers, getDriver, createDriver, updateDriver, deleteDriver |
| vehicleApi | `fleet/vehicleApi.ts` | getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle |
| customerApi | `fleet/customerApi.ts` | getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer |
| contactApi | `fleet/contactApi.ts` | getContacts, getContact, createContact, updateContact, deleteContact |
| loadApi | `loads/loadApi.ts` | getLoads, getLoad, createLoad, updateLoad, deleteLoad, transitionStatus |
| stopApi | `loads/stopApi.ts` | createStop, updateStop, deleteStop, reorderStops |
| accessorialApi | `loads/accessorialApi.ts` | createAccessorial, updateAccessorial, deleteAccessorial |
| placeApi | `places/placeApi.ts` | getPlaces, getPlace, createPlace, updatePlace, deletePlace, searchAddresses |
| documentApi | `documents/documentApi.ts` | getDocuments, uploadDocument, deleteDocument |
| invoiceApi | `invoices/invoiceApi.ts` | getInvoices, getInvoice, createFromLoad, approve, send, markPaid, void, downloadPacket |
| dashboardApi | `dashboard/dashboardApi.ts` | getDashboard |
| loadIntelApi | `intel/loadIntelApi.ts` | getFeed, getChains, bookLoad, bookChain, dismissLoad, submitManualEntry |
| settingsApi | `fleet/settingsApi.ts` | getSettings, updateSettings |
| notificationApi | `notifications/notificationApi.ts` | getNotifications, updateNotificationSettings |
| driverPortalApi | `driver-portal/driverPortalApi.ts` | Driver-facing portal endpoints |

### Redux Slices

**Entity slices** (normalized via `createEntityModule`):

| Slice Key | Path | Entity Type |
|-----------|------|-------------|
| entities.carriers | `features/carrier/store/reducers/carrierEntitySlice.ts` | CarrierListItem |
| entities.vehicles | `features/vehicle/store/reducers/vehicleEntitySlice.ts` | Vehicle |
| entities.drivers | `features/driver/store/reducers/driverEntitySlice.ts` | Driver |
| entities.loads | `features/load/store/reducers/loadEntitySlice.ts` | Load |
| entities.places | `features/place/store/reducers/placeEntitySlice.ts` | Place |
| entities.contacts | `features/contact/store/reducers/contactEntitySlice.ts` | Contact |
| entities.customers | `features/customer/store/reducers/customerEntitySlice.ts` | Customer |
| entities.invoices | `features/invoices/store/reducers/invoiceEntitySlice.ts` | Invoice |

**Page slices** (UI state via `createCrudSlice`):

| Slice Key | Path |
|-----------|------|
| pages.carriers | `features/carrier/store/reducers/carrierNewPageSlice.ts` |
| pages.vehicles | `features/vehicle/store/reducers/vehiclePageSlice.ts` |
| pages.drivers | `features/driver/store/reducers/driverPageSlice.ts` |
| pages.loads | `features/load/store/reducers/loadPageSlice.ts` |
| pages.places | `features/place/store/reducers/placePageSlice.ts` |
| pages.contacts | `features/contact/store/reducers/contactPageSlice.ts` |
| pages.customers | `features/customer/store/reducers/customerPageSlice.ts` |
| pages.invoices | `features/invoices/store/reducers/invoicePageSlice.ts` |
| pages.invoiceCounts | `features/invoices/store/reducers/invoiceCountsSlice.ts` |
| pages.intel | `features/loadintelligence/store/reducers/intelPageSlice.ts` |
| pages.dashboard | `features/dashboard/store/reducers/dashboardSlice.ts` |
| pages.settings | `features/settings/store/reducers/settingsSlice.ts` |
| pages.ui | `features/ui/store/reducers/uiSlice.ts` |
| pages.carrierNotes | `features/carrier/store/reducers/carrierNotesSlice.ts` |
| pages.vehicleLoadHistory | `features/vehicle/store/reducers/vehicleLoadHistorySlice.ts` |

**Standalone slices:**

| Slice Key | Path |
|-----------|------|
| auth | `features/auth/store/authSlice.ts` |

### Utilities (`utils/`)

| Name | Path | Purpose |
|------|------|---------|
| axios | `axios.ts` | Axios instance with cookie auth + 401 refresh interceptor |
| authSliceHelpers | `authSliceHelpers.ts` | Auth reducer helper functions |
| createCrudReducers | `createCrudReducers.ts` | CRUD reducer factory |
| createEntityModule | `createEntityModule.ts` | Entity adapter factory |
| formatLocation | `formatLocation.ts` | Location string formatting |
| getDriverDisplayName | `getDriverDisplayName.ts` | Driver name display |
| getNavigate | `getNavigate.ts` | Imperative navigation for sagas |
| imageUploadErrors | `imageUploadErrors.ts` | Typed image upload errors |
| imageStateManager | `imageStateManager.ts` | Image upload state tracking |
| obfuscateEmail | `obfuscateEmail.ts` | Email masking for display |
| password-strength | `password-strength.ts` | Password strength calculator |
| password-validation | `password-validation.ts` | Password validation rules |
| redirectUtils | `redirectUtils.ts` | Post-auth redirect logic |
| slugify | `slugify.ts` | URL slug generation |
| updateHelpers | `updateHelpers.ts` | Immutable update utilities |
| validators | `validators.ts` | Shared validation functions |
| dirtyFormSlice | `redux/dirtyFormSlice.ts` | Global dirty-form tracking state |
| paginationSlice | `pagnationSlice.ts` | Shared pagination state |

---

## 2. State & Data Shapes

```typescript
// RootState shape
{ pages, entities, auth }

// pages.* — created by createCrudSlice
{ query: string; loading: Record<string, LoadingState>; errors: Record<string, string>; selectedIds: string[] }
// Loading keys use composite format: "getAll" | "getById:<id>" | "update:<id>" | "delete:<id>"

// entities.* — created by createEntityModule (RTK EntityAdapter)
{ ids: string[]; entities: Record<string, Entity> }

// auth
{ isLoggedIn: boolean; user: UserProfile; orgs: Tenant[]; isInitializing: boolean;
  rememberMe: boolean; session: string | null; forceChangePassword: boolean; initAttempted: boolean }

// pages.ui
{ modal: { modalType: string; modalProps: Record<string, unknown> } | null;
  drawer: { drawerType: string; drawerProps: Record<string, unknown>; anchor?: string; width?: number } | null }

// UserProfile
{ id?: string; firstName: string; lastName: string; email: string; role: string; organizationId?: string }

// Tenant
{ role: string; status: string; membershipId: string; userId: string; orgName: string;
  orgSubscriptionTier: string; orgStatus: string; organizationId: string }
```

---

## 3. Representative Patterns

### Route Definition
```typescript
// features/carrier/routes/carrierRoutes.tsx
const CarrierListPage = Loadable(lazy(() => import('../pages/CarrierListPage')));
const CreateCarrierPage = Loadable(lazy(() => import('../pages/CreateCarrierPage')));
const CarrierDetailPage = Loadable(lazy(() => import('features/carrier/pages/CarrierDetailPage')));

const carrierRoutes = {
  element: (<PersistLogin><AuthGuard><AppLayout /></AuthGuard></PersistLogin>),
  path: '/carriers',
  children: [
    { index: true, element: <CarrierListPage /> },
    { path: 'create', element: <CreateCarrierPage /> },
    { path: ':id', element: <CarrierDetailPage /> },
  ],
};
```

### Dual-Slice Entity Pattern
```typescript
// Entity slice — normalized data
export const carrierEntityModule = createEntityModule<CarrierListItem>('carriers');
export const carrierActions = carrierEntityModule.actions;   // setAll, addOne, updateOne, removeOne
export const carrierReducer = carrierEntityModule.reducer;

// Page slice — UI state
export const carrierPageSlice = createCrudSlice({ name: 'carrier', entityName: 'carrier', entityNamePlural: 'carriers' });
export const { fetchAllRequest: fetchCarriersRequest, createRequest: createCarrierRequest, ... } = carrierPageSlice.actions;
```

### Saga Pattern
```typescript
// features/carrier/store/sagas/fetchCarriersSaga.ts
export function* fetchCarriersSaga(action: PayloadAction<FetchCarriersPayload>): Generator {
  try {
    const response = (yield call(getCarriers, action.payload)) as SagaReturnType<typeof getCarriers>;
    yield put(carrierActions.setAll(response.data));
    yield put(fetchCarriersSuccess({ total: response.meta.total, page: response.meta.page, limit: response.meta.limit }));
  } catch (error: unknown) {
    const errorMessage = 'Unable to load carriers. Please try again.';
    yield put(fetchCarriersFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
```

### Form Schema Pattern
```typescript
// features/load/validators/loadSchema.ts
export const loadSchema = Yup.object().shape({
  customerId: Yup.string().required('Customer is required'),
  equipmentType: Yup.string().oneOf(EQUIPMENT_VALUES).required('Equipment type is required'),
  stops: Yup.array().of(stopSchema).required()
    .test('has-pickup', 'At least one pickup stop is required', (stops) =>
      stops ? stops.some((s) => s.type === 'PICKUP') : false),
  customerRate: Yup.number().min(0).required('Customer rate is required'),
  // ... more fields
});
export type LoadFormValues = Yup.InferType<typeof loadSchema>;
```

### Test Pattern
```typescript
// features/carrier/pages/__tests__/CarrierListPage.test.tsx
jest.mock('@mocho/ui/components', () => ({
  MainCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NewDataGrid: () => <div data-testid="data-grid" />,
  PageWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const renderWithProviders = () =>
  render(
    <MemoryRouter><Provider store={store}><ThemeProvider theme={createTheme()}>
      <CarrierListPage />
    </ThemeProvider></Provider></MemoryRouter>
  );

describe('CarrierListPage', () => {
  it('renders the page title', () => {
    renderWithProviders();
    expect(screen.getByRole('heading', { name: /carriers/i })).toBeInTheDocument();
  });
});
```
