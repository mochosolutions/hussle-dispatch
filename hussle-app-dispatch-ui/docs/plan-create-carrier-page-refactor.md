# Plan: Refactor CreateCarrierPage with useFormRef/useFormHandle

## Context
`CreateCarrierPage` wraps the entire page (sticky header + all form sections) inside a single `<Formik>` render prop. The header save button uses `type="submit"`. The `handleFormSubmit` only does `console.log` — it never dispatches to Redux. `createCarrierSaga` exists but is commented out in the watcher.

The mocho hooks (`useFormRef`, `useFormHandle`) exist for exactly this decoupling: page header button triggers form submission via a forwarded ref, and the form component owns its own Formik instance.

`VehicleDetailPage` and `CreateCarrierPage` share the same sticky header structure (back nav + title + right-side actions). That pattern needs to become a reusable composable component.

Goal: wire the header Save button → `submitForm()` ref → Formik submit → `dispatch(createCarrierRequest(...))` → saga, wrapped in `PageWrapper`, using a shared header component.

---

## Files to Create
- `src/components/InnerPageHeader/index.tsx` — reusable sticky sub-header (back + title + actions)
- `src/features/carrier/components/CarrierCreateForm/index.tsx` — extracted form component

## Files to Modify
- `src/features/carrier/pages/CreateCarrierPage/index.tsx`
- `src/features/carrier/store/sagas/carrierSagasWatcher.ts`
- `src/features/carrier/store/sagas/createCarrierSaga.ts`

---

## Step 1 — Create `InnerPageHeader`

Reusable sticky header bar shared across detail/create pages (currently hand-coded in both `CreateCarrierPage` and `VehicleDetailPage`).

**Location:** `src/components/InnerPageHeader/index.tsx`

```ts
interface InnerPageHeaderProps {
  onBack: () => void;
  backLabel: string;
  title: ReactNode;       // string or complex node (e.g. title + Chip badges)
  subtitle?: ReactNode;
  actions?: ReactNode;    // right-side buttons (Save/Cancel, Edit/More, etc.)
}
```

**Renders:**
```tsx
<Box
  sx={{
    backgroundColor: 'background.paper',
    borderBottom: 1,
    borderColor: 'divider',
    px: { xs: 2, sm: 3 },
    py: 1.75,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }}
>
  <Stack
    direction={{ xs: 'column', md: 'row' }}
    justifyContent="space-between"
    alignItems={{ xs: 'flex-start', md: 'center' }}
    spacing={1.5}
  >
    <Stack spacing={0.75}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Button
          variant="text"
          color="inherit"
          onClick={onBack}
          sx={{ minWidth: 0, px: 0, color: 'text.secondary' }}
        >
          ← {backLabel}
        </Button>
        {/* title slot — string or ReactNode (allows chips inline) */}
        {typeof title === 'string' ? (
          <Typography variant="h4" color="text.primary">{title}</Typography>
        ) : title}
      </Stack>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      )}
    </Stack>
    {actions && (
      <Stack
        direction="row"
        spacing={1}
        sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
      >
        {actions}
      </Stack>
    )}
  </Stack>
</Box>
```

**Composability:** `title` and `actions` accept `ReactNode` so callers can pass chips, icon buttons, dynamic labels, etc. without any additional props. `VehicleDetailPage` can adopt this component later.

---

## Step 2 — Create `CarrierCreateForm`

Extract all form content from `CreateCarrierPage` into a new `forwardRef` component.

**Location:** `src/features/carrier/components/CarrierCreateForm/index.tsx`

**Props interface:**
```ts
interface CarrierCreateFormProps {
  onSubmit: (values: CarrierFormValues) => void;
  onStateChange?: FormStateChangeCallback;
}
```

**Structure:**
```ts
const CarrierCreateForm = forwardRef<FormHandle, CarrierCreateFormProps>(
  ({ onSubmit, onStateChange }, ref) => {

    // All local state from CreateCarrierPage moves here:
    const [mode, setMode] = useState<CreateMode>('full');
    const [mcLookup, setMcLookup] = useState<LookupStatus>('idle');
    const [sendInvite, setSendInvite] = useState(true);
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('active');
    const [vehicles, setVehicles] = useState<VehicleFormEntry[]>([]);
    const [drivers, setDrivers] = useState<DriverFormEntry[]>([]);
    const [showVehicleForm, setShowVehicleForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<VehicleFormEntry | null>(null);
    const [showDriverForm, setShowDriverForm] = useState(false);
    const [editingDriver, setEditingDriver] = useState<DriverFormEntry | null>(null);
    // No showSuccess/successData — post-submit handled by saga (snackbar + navigate)

    const formik = useFormik<CarrierFormValues>({
      initialValues: carrierInitialValues,
      validationSchema: carrierSchema,
      validateOnBlur: true,
      validateOnChange: true,
      onSubmit: (values) => {
        onSubmit(values);
      },
    });

    useFormHandle({ ref, formik, onStateChange });

    // handleMcLookup, handleSaveVehicle, handleSaveDriver — unchanged from current page

    return (
      <form onSubmit={formik.handleSubmit}>
        <Box sx={{ maxWidth: 720, mx: 'auto', px: 4, py: 3 }}>
          {/* ToggleButtonGroup (mode) */}
          {/* SectionCard: Company Information + MCLookupIndicator */}
          {/* SectionCard: Primary Contact */}
          {/* SectionCard: Equipment & Fleet */}
          {/* mode === 'full': SectionCard Vehicles */}
          {/* mode === 'full': SectionCard Drivers */}
          {/* mode === 'quick': Invite toggle + warning */}
          {/* mode === 'full': Status toggle card */}
          {/* Bottom action row with dynamic submitLabel + cancel */}
        </Box>
      </form>
    );
  }
);
```

**Key details:**
- `SuccessView` is removed — post-submit handled entirely by the saga (snackbar + navigate)
- All existing MC lookup, vehicle/driver inline form logic is preserved unchanged
- Bottom submit button keeps its dynamic label (`"Create Carrier + 3 Assets"` etc.)

---

## Step 3 — Refactor `CreateCarrierPage`

**Location:** `src/features/carrier/pages/CreateCarrierPage/index.tsx`

```ts
const CreateCarrierPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formRef, formState, handleFormStateChange, submitForm } = useFormRef();

  // Dispatches to Redux — saga handles the snackbar + navigate('/carriers')
  const handleSubmit = useCallback(
    (values: CarrierFormValues) => {
      dispatch(createCarrierRequest({ data: values }));
    },
    [dispatch],
  );

  return (
    <PageWrapper errorContext="CreateCarrierPage">
      <InnerPageHeader
        onBack={() => navigate('/carriers')}
        backLabel="Carriers"
        title="Add New Carrier"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/carriers')}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={submitForm}
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? 'Creating...' : 'Create Carrier'}
            </Button>
          </Stack>
        }
      />
      <CarrierCreateForm
        ref={formRef}
        onSubmit={handleSubmit}
        onStateChange={handleFormStateChange}
      />
    </PageWrapper>
  );
};
```

**Key changes from current page:**
- `<Formik>` wrapper removed entirely
- `PageWrapper` wraps everything (ErrorBoundary + loading/error states)
- `InnerPageHeader` replaces the hand-coded sticky `<Box>` header
- Save button: `onClick={submitForm}`, `disabled={formState.isSubmitting}`
- `handleSubmit` dispatches `createCarrierRequest` (no more `console.log`)
- `showSuccess`/`successData`/`SuccessView` removed — saga handles navigation

---

## Step 4 — Wire up the Saga

**`carrierSagasWatcher.ts`:**
```ts
import { createCarrierSaga } from './createCarrierSaga';
// ...
yield takeLatest(carrierPageActions.createRequest.type, createCarrierSaga);
```

**`createCarrierSaga.ts`:** Two changes:

1. Fix slice import — currently uses `carrierPageSlice`, watcher uses `carrierNewPageSlice`:
```ts
import { createCarrierRequest, createCarrierSuccess, createCarrierFailure, fetchCarriersRequest }
  from '../reducers/carrierNewPageSlice';
```

2. Add navigation after the success snackbar:
```ts
yield call(enqueueSnackbar, 'Carrier created', { variant: 'success' });
const navigate = yield call(getNavigate);
yield call(navigate, '/carriers');
```
Uses the same `getNavigate` pattern already established across the project (`src/utils/getNavigate.ts`).

---

## PageWrapper note

`src/components/PageWrapper/index.tsx` is the local version (no `sx` prop). Use it as-is — `CreateCarrierPage` doesn't need custom layout overrides on the wrapper itself.

`VehicleDetailPage` imports from `@mocho/ui/components` (the shared mocho package with `sx` support). That page can adopt `InnerPageHeader` independently in a separate pass.

---

## Verification

1. `npm run lint && npm run check-ts` — no errors
2. Navigate to `/carriers/new`
3. Page renders inside `PageWrapper` (ErrorBoundary active)
4. Sticky header shows "← Carriers", "Add New Carrier", Save + Cancel buttons
5. Fill required fields → Save button in header is clickable (not disabled)
6. Click **Save** in header → Redux DevTools shows `carrier/createRequest` action dispatched
7. Snackbar "Carrier created" appears
8. App navigates to `/carriers` (carrier list)
9. New carrier appears in the list (saga triggers `fetchCarriersRequest` refetch)
