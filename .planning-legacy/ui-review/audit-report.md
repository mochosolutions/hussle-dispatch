# UI & Architecture Consistency Audit

> Generated 2026-04-15 | Auditor: Principal Frontend Engineer Review
> Reference pattern: `features/load/` (the "gold standard")

---

## Executive Summary

The load feature establishes an excellent pattern: dual-slice Redux architecture, centralized drawer/modal management via registries, one-saga-per-file, composite-key loading states, and clean page/tab/card separation of concerns. **Most features partially follow this pattern but deviate in two critical, recurring ways:**

1. **Drawer/modal state is managed with local `useState` instead of Redux** (driver, vehicle, contact, invoices, accounting, settings)
2. **Modal/drawer components are not registered in the centralized registry** (invoices, accounting, settings)

These two issues are the root cause of the inconsistency you're feeling. They make it hard to spin up new pages because there's no single pattern to copy — some features use Redux drawers, others use local state, and the decision feels arbitrary.

---

## Part 1: Feature-by-Feature Compliance Scorecard

| Feature | Dual Slices | Composite Loading | Sagas (1/file) | Drawer via Redux | Registered in Registry | PageWrapper | Score |
|---------|:-----------:|:-----------------:|:--------------:|:----------------:|:---------------------:|:-----------:|:-----:|
| **Load** | Y | Y | Y | Y | Y | Y | 6/6 |
| **Carrier** | Y | Y | Y | Y | Y | Y | 6/6 |
| **Customer** | Y | Y | Y | Y | Y | Y | 6/6 |
| **Place** | Y | Y | Y | Y | Y | Y | 6/6 |
| **Driver** | Y | Y | Y | **N** (5 useStates) | Partial | Y | 4/6 |
| **Vehicle** | Y | Y | Y | **N** (3 useStates) | Partial | Y | 4/6 |
| **Contact** | Y | Y | Y | **N** (2 useStates) | **N** | Y | 3/6 |
| **Invoices** | Y (+extra slice) | Y | Y | **N** (3 useStates) | **N** | Y | 3/6 |
| **Accounting** | Y | Y | Partial (4-in-1) | **N** (3 useStates) | **N** | Y | 2/6 |
| **Settings** | **N** (no entity) | Partial | Y | **N** (1 useState) | **N** | Y | 2/6 |
| **Dashboard** | **N** (monolithic) | **N** | Partial (bundled) | N/A | N/A | Y | 1/6 |

---

## Part 2: Gap Analysis

### GAP 1: Drawer/Modal State Fragmentation (CRITICAL)

**The problem:** 6 out of 11 features use `useState` to manage drawer/modal visibility instead of dispatching `openDrawer()` / `openModal()` to the centralized Redux UI slice.

**Where it happens:**

| Feature | File | Local State Hooks |
|---------|------|-------------------|
| Driver | `DriverDetailPage/index.tsx` | `infoDrawerOpen`, `preferencesDrawerOpen`, `locationDrawerOpen`, `weeklyScheduleDrawerOpen`, `overrideDrawerOpen` |
| Vehicle | `VehicleDetailPage/index.tsx` | `infoDrawerOpen`, `expenseDrawerOpen`, `targetsDrawerOpen` |
| Contact | `ContactListPage/index.tsx`, `ContactDetailPage/index.tsx` | `drawerOpen` in both pages |
| Invoices | `InvoiceDetailPage.tsx` | `deleteDialogOpen`, `sendDialogOpen`, `markPaidDialogOpen` |
| Accounting | `SettlementListPage/index.tsx`, `SettlementDetailPage/index.tsx` | `dialogOpen`, `payDrawerOpen`, `disputeDrawerOpen` |
| Settings | `SettingsPage/index.tsx` | `inviteDialogOpen` (via team tab) |

**What the load/carrier/customer/place features do correctly:**
```typescript
// CORRECT: Redux-managed (load, carrier, customer, place)
const { openDrawer } = useDrawerActions();
openDrawer('loadRoute', { load });
// DrawerManager in App.tsx renders it centrally

// WRONG: Local state (driver, vehicle, contact, invoices, accounting)
const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
// Drawer rendered inline at bottom of page component
```

**Why this matters:**
- No single source of truth for "what drawer is open"
- Can't coordinate drawers across features (e.g., open a contact drawer from within a load drawer)
- Can't implement drawer stacking, history, or deep-linking
- New developers see two patterns and don't know which to follow
- Dirty form blocking can't work consistently

---

### GAP 2: Missing Registry Entries

**The problem:** 12+ drawer/modal components exist but are NOT registered in `drawerRegistry.ts` or `modalRegistry.ts`.

**Unregistered components:**

| Component | Feature | Should be in |
|-----------|---------|-------------|
| `PaymentDrawer` | Invoices | drawerRegistry |
| `PaySettlementDrawer` | Accounting | drawerRegistry |
| `DisputeSettlementDrawer` | Accounting | drawerRegistry |
| `AddAdjustmentDrawer` | Accounting | drawerRegistry |
| `ExpenseQuickAddDrawer` | Accounting | drawerRegistry |
| `GenerateSettlementDialog` | Accounting | modalRegistry |
| `InviteMemberDialog` | Settings | modalRegistry |
| Delete/Send/MarkPaid dialogs | Invoices | modalRegistry |

**Currently registered:** 27 drawers + 4 modals (mostly from load, carrier, driver, vehicle, place, customer)

---

### GAP 3: Inconsistent Store Architecture

**Settings feature:** No entity slices. OrgSettings data and TeamMember arrays live directly in page slices. Should have `settingsEntitySlice` + `teamEntitySlice` for normalized storage.

**Dashboard feature:** Single monolithic slice with `kpis`, `weeklyGross[]`, `attentionItems[]` all in flat state. No composite-key loading. Action defined inside watcher file instead of slice.

**Invoices feature:** Has an extra `invoiceCountsSlice` that should be folded into the page slice as derived state or a simple field.

---

### GAP 4: Saga Organization Issues

| Feature | Issue |
|---------|-------|
| Accounting | `settlementActionSagas.ts` bundles 4 sagas (approve, pay, dispute, addAdjustment) in one file |
| Dashboard | Single saga handles all data fetching; action defined in watcher file |
| Carrier | `updateCarrierSaga` and `deleteCarrierSaga` exist but are **commented out** in watcher — updates may silently fail |

---

### GAP 5: When to Use Drawer vs Modal vs Dialog

**Current state:** No documented decision framework. The codebase mixes:
- **Drawers** for edit forms (load route, carrier info, driver preferences)
- **Modals** for confirmations (delete load, status change)
- **Inline dialogs** for quick actions (invoice send, settlement generate)

The inconsistency makes the UX feel ad-hoc. Some edit forms are drawers, others are full pages. Some confirmations are modals, others are inline dialogs.

---

## Part 3: Drawer vs Modal vs Full Page — Decision Framework

The decision axis is **how much context does the user need from the page behind them** — not the action type itself.

### Decision Tree

```
Does the user need to see the parent page while doing this?
  YES → DRAWER (slide-in panel, page stays visible)
  NO →
    Is this a complex, multi-section primary task?
      YES → FULL PAGE (own route, bookmarkable)
      NO → MODAL (focused overlay, blocks page)
```

### Use a **Drawer** when:
- The user needs to **reference the parent page** while working (e.g., see current route while editing stops, see carrier details while editing terms)
- Editing a **subset of fields** on an existing entity where the surrounding context aids decision-making
- The form has **moderate complexity** (2-10 fields) but benefits from side-by-side context
- Examples: Edit load route, edit carrier info, edit driver preferences, upload documents, edit assignment

### Use a **Modal** when:
- The action is **self-contained** — the user doesn't need to look at anything behind the overlay
- **Confirmations:** "Delete this load?" "Void this invoice?" — a decision, not an edit
- **Status transitions with warnings** — read the warning, decide
- **Quick inputs** that don't need page context — enter email to send, add a note, enter payment amount
- **Workflow triggers** with a few parameters — generate settlement, mark as paid
- Examples: Confirm delete, status change, dirty form warning, send invoice, mark paid, add note, generate settlement

### Use a **Full Page** when:
- The task is the user's **primary activity** — they navigated here to do this, it's not a side-task
- The form has **9+ fields** or **multiple sections/tabs** that need full screen real estate
- The workflow benefits from its **own URL** (bookmarkable, shareable, back-button navigable)
- Examples: Create load, invoice builder, create carrier (if complex)

### What This Changes in the Current App

| Component | Current Type | Should Be | Reason |
|-----------|-------------|-----------|--------|
| Driver/Vehicle Info Edit | Drawer | **Drawer** | Need to see entity detail while editing |
| Load Route/Assignment Edit | Drawer | **Drawer** | Need to see load context |
| Invoice Send | Local dialog | **Modal** | Self-contained (enter email, send) |
| Invoice Mark Paid | Local dialog | **Modal** | Confirming an amount — no page context needed |
| Invoice Delete | Local dialog | **Modal** | Confirmation |
| Generate Settlement | Local dialog | **Modal** | Trigger + params, self-contained |
| Pay Settlement | Drawer | **Modal** | Confirming payment — self-contained decision |
| Add Adjustment | Drawer | **Drawer** | Need to see settlement line items |
| Carrier Note | Drawer | **Modal** | Quick text entry, no page reference needed |
| Create Load | Full page | **Full page** | Complex multi-section primary task |

### Sizing Conventions

- **Drawers:** 480px width (standard), 640px (wide — route editing, cargo forms), always right-anchored
- **Modals:** `sm` (400px) for confirmations, `md` (600px) for forms with 2-4 fields
- **Full pages:** Standard app layout with back navigation

### The UX Principle

> **Drawers maintain flow. Modals demand a decision. Pages commit to a task.**
>
> If the popup feels "too heavy" for the action → it should be a modal, not a drawer.
> If the modal feels "too cramped" for the fields → it should be a drawer.
> If the drawer feels "too constrained" for the workflow → it should be a full page.

---

## Part 3b: Drawer & Modal Opening/Closing Mechanics

### Current Architecture

The app has a centralized system (used by load, carrier, customer, place) that should be the **only** pattern:

```
Component calls useDrawerActions() / useModalActions()
    ↓
Hook dispatches openDrawer(type, props) / openModal(type, props)
    ↓
Redux uiSlice stores: { drawer: { drawerType, drawerProps } | null, modal: { ... } | null }
    ↓
DrawerManager / ModalManager in App.tsx reads state
    ↓
Looks up component in drawerRegistry / modalRegistry
    ↓
Renders Component with {...props, onClose}
    ↓
Component calls onClose() when done
    ↓
Redux state → null → component unmounts
```

### Key Design Decisions

**1. Pass IDs, not objects**
Drawers should receive entity IDs and read data from the Redux store themselves, not receive full entity objects as props. This ensures the drawer always shows current data and avoids stale prop issues when the entity is updated while the drawer is open.

```typescript
// PREFER: Pass ID, drawer reads from store
openDrawer('carrierCompanyInfo', { carrierId: '123' });
// Inside drawer: const carrier = useSelector(selectCarrierById(carrierId));

// AVOID: Pass full object (can go stale)
openDrawer('carrierCompanyInfo', { carrier: carrierObject });
```

**Exception:** When creating a new entity (no ID yet), pass initial form values directly.

**2. One drawer + one modal simultaneously (not stacking)**
The system supports exactly one drawer and one modal at the same time. This is intentional and correct:
- A drawer can open a confirmation modal on top of it (e.g., dirty form warning)
- Opening a new drawer replaces the current one (no stack)
- Opening a new modal replaces the current one (no stack)

This is the right constraint — stacking drawers creates confusing UX. If you need a multi-step flow, use a full page or wizard steps within a single drawer.

**3. Callbacks for result handling**
Redux state is untyped at the store level. Callbacks (onConfirm, onCancel, onSuccess) are passed as props and executed by the component before closing.

```typescript
// Modal with callbacks
openModal('dirtyFormConfirm', {
  onConfirm: () => blocker.proceed?.(),
  onCancel: () => blocker.reset?.(),
});

// Inside the modal component:
const handleConfirm = () => {
  onConfirm();   // Execute callback
  onClose();     // Clear Redux state
};
```

**4. Type safety lives in hooks, not Redux**
The hooks `useDrawerActions()` and `useModalActions()` enforce type-safe props via `DrawerTypeMap` and `ModalTypeMap` in `features/ui/types/popupTypes.ts`. Always use hooks — never dispatch `openDrawer` directly.

### Opening Pattern (Standard)

Every page that opens a drawer or modal should follow this exact pattern:

```typescript
const MyDetailPage = () => {
  const { openDrawer } = useDrawerActions();
  const { openModal } = useModalActions();

  // Open a drawer — pass entity ID, not the full object
  const handleEditInfo = () => {
    openDrawer('myEntityInfo', { entityId: id });
  };

  // Open a confirmation modal
  const handleDelete = () => {
    openModal('confirmDelete', {
      entityName: 'this record',
      onConfirm: () => dispatch(deleteEntityRequest({ id })),
    });
  };

  return (
    <DetailLayout>
      <Button onClick={handleEditInfo}>Edit</Button>
      <Button onClick={handleDelete}>Delete</Button>
      {/* NO inline drawer/modal rendering here — DrawerManager/ModalManager handle it */}
    </DetailLayout>
  );
};
```

### Closing Pattern (Standard)

**Simple close (no dirty form):**
```typescript
// Component receives onClose from DrawerManager/ModalManager
const MyDrawer: React.FC<Props> = ({ entityId, onClose }) => {
  const handleSubmit = (values) => {
    dispatch(updateEntityRequest({ id: entityId, data: values }));
    onClose(); // Clears Redux state, unmounts component
  };
  return <FormDrawer onSubmit={handleSubmit} onClose={onClose} />;
};
```

**Close with dirty form protection:**
Drawers that contain forms should use `EditDrawer` or `FormDrawer` which handle dirty state internally:
```typescript
// EditDrawer internally:
// 1. Tracks isDirty via Formik
// 2. On close attempt, if dirty → shows nested ConfirmDialog (local state, not Redux modal)
// 3. User confirms → calls onClose() → Redux clears
// 4. User cancels → stays in drawer
```

This is correct — the dirty confirmation inside a drawer is a **local concern** of the drawer component, not a global modal. It uses a nested `ConfirmDialog` rendered inside the drawer itself.

**Close with side effects (saga-driven):**
For operations where closing should trigger a data refresh:
```typescript
// Option A: Saga handles the refresh after success
// In updateEntitySaga.ts:
yield put(updateEntitySuccess({ id }));
yield put(closeDrawer()); // Saga closes the drawer
yield put(fetchEntityDetailsRequest({ id })); // Saga refreshes

// Option B: Drawer dispatches update, saga closes on success
// The saga calls closeDrawer() after the API succeeds
```

Prefer Option A — let the saga own the full lifecycle (API call → entity update → close drawer → refresh → toast). The drawer's `onSubmit` just dispatches the request action.

### Adding a New Drawer or Modal (Checklist)

When adding a new drawer or modal to any feature:

1. **Decide:** Use the decision tree above — is this a drawer, modal, or full page?
2. **Create the component** in `features/<feature>/components/<ComponentName>/index.tsx`
3. **Add the type** to `DrawerType` or `ModalType` union in `features/ui/types/popupTypes.ts`
4. **Add the prop shape** to `DrawerTypeMap` or `ModalTypeMap` in the same file
5. **Register** in `features/ui/drawerRegistry.ts` or `features/ui/modalRegistry.ts`
6. **Open** via `useDrawerActions()` or `useModalActions()` — never `useState`
7. **Close** via the `onClose` prop provided by the manager — never local state
8. **Test** that opening a second drawer replaces the first cleanly (no orphaned state)

---

## Part 4: Holistic Solution Plan

### Phase 1: Establish the Foundation (Do First)

**1.1 — Document the drawer/modal decision framework**
Add the framework from Part 3 to `CLAUDE.md` so all future work follows it.

**1.2 — Audit and categorize every popup interaction**
For each existing drawer/modal/dialog, classify it using the framework. Flag any that are the wrong type (e.g., a complex create form in a drawer should be a full page).

### Phase 2: Centralize All UI State (High Priority)

**2.1 — Register all unregistered drawers/modals**
Add the 12+ missing components to `drawerRegistry.ts` and `modalRegistry.ts`.

**2.2 — Migrate local useState drawer management to Redux**
For each feature with local drawer state:
1. Remove `useState` hooks for drawer/modal open state
2. Use `useDrawerActions()` / `useModalActions()` hooks
3. Dispatch `openDrawer(type, props)` / `openModal(type, props)`
4. Remove inline drawer rendering from pages — `DrawerManager` in `App.tsx` handles it

**Migration order** (by complexity, simplest first):
1. Contact (2 pages, 1 drawer type)
2. Settings (1 dialog)
3. Vehicle (1 page, 3 drawer types)
4. Driver (1 page, 5 drawer types)
5. Invoices (1 page, 3 dialog types)
6. Accounting (2 pages, 5 drawer/dialog types)

### Phase 3: Normalize Store Architecture (Medium Priority)

**3.1 — Settings feature**
- Create `settingsEntitySlice.ts` for OrgSettings
- Create `teamEntitySlice.ts` for TeamMember normalization
- Move entity data out of page slices

**3.2 — Dashboard feature**
- Split into `dashboardPageSlice.ts` + separate concerns
- Move action definitions out of watcher file into slice
- Consider splitting monolithic fetch into per-section sagas

**3.3 — Invoices feature**
- Fold `invoiceCountsSlice` into `invoicePageSlice` as a field

### Phase 4: Fix Saga Organization (Medium Priority)

**4.1 — Split multi-saga files**
- `accounting/settlementActionSagas.ts` → 4 separate files
- `dashboard/fetchDashboardSaga` → separate per-section sagas

**4.2 — Fix carrier watcher**
- Uncomment `updateCarrierSaga` and `deleteCarrierSaga` in `carrierSagasWatcher.ts`
- Verify update operations actually persist

### Phase 5: Visual Consistency (Do Alongside Phases 2-4)

**5.1 — Standardize list pages**
Every list page should follow this structure:
```
PageWrapper → PageHeader (title + create button) → Filter bar → AG Grid table
```
Ensure consistent: search debounce, filter chips, empty states, loading skeletons.

**5.2 — Standardize detail pages**
Every detail page should follow this structure:
```
PageWrapper → DataGuard → DetailLayout (header + tabs) → Tab panels
```
Ensure consistent: back button, edit actions in header, tab names, section cards.

**5.3 — Standardize drawer UX**
All drawers should:
- Use `FormDrawer` or `EditDrawer` wrapper (not raw MUI Drawer)
- Have consistent header (title + close button)
- Have consistent footer (Save + Cancel buttons)
- Use `useDirtyFormBlocker` for unsaved changes warning
- Use consistent width (480px standard, 640px wide)

**5.4 — Standardize modal UX**
All modals should:
- Use `FormDialog` or `ConfirmDialog` wrapper
- Have consistent action button placement (Cancel left, Confirm right)
- Use consistent sizing (sm for confirms, md for forms)
- Destructive actions use error-colored confirm button

### Phase 6: Create Reusable Page Templates (Long-term)

**6.1 — `ListPage` template component**
Encapsulates: PageWrapper + PageHeader + search + filters + AG Grid + create button behavior. Each feature just provides: columns, selectors, actions, filter config.

**6.2 — `DetailPage` template component**
Encapsulates: PageWrapper + DataGuard + DetailLayout + tab routing. Each feature just provides: tab config, header actions, selectors.

**6.3 — Feature scaffolding script**
A CLI command or template that generates a new feature with:
- Correct folder structure
- Dual slices (page + entity) via factories
- Watcher + CRUD sagas
- List page + Detail page using templates
- Route registration
- Drawer/modal registration

---

## Part 5: Priority Matrix

| Action | Impact | Effort | Priority |
|--------|--------|--------|----------|
| Document drawer/modal framework in CLAUDE.md | High | Low | **P0** |
| Register missing drawers/modals in registries | High | Low | **P0** |
| Fix carrier saga watcher (uncomment update/delete) | High | Low | **P0** |
| Migrate contact drawer state to Redux | High | Low | **P1** |
| Migrate settings dialog state to Redux | Medium | Low | **P1** |
| Migrate vehicle drawer state to Redux | High | Medium | **P1** |
| Migrate driver drawer state to Redux | High | Medium | **P1** |
| Migrate invoices dialog state to Redux | High | Medium | **P1** |
| Migrate accounting drawer state to Redux | High | Medium | **P1** |
| Split accounting multi-saga file | Medium | Low | **P2** |
| Normalize settings store (entity slices) | Medium | Medium | **P2** |
| Normalize dashboard store | Medium | Medium | **P2** |
| Fold invoice counts into page slice | Low | Low | **P2** |
| Standardize list page layout/UX | High | Medium | **P3** |
| Standardize detail page layout/UX | High | Medium | **P3** |
| Create ListPage template component | High | High | **P4** |
| Create DetailPage template component | High | High | **P4** |
| Create feature scaffolding script | High | High | **P4** |

---

## Part 6: Component Usage Audit & Refactoring Plan

### Available Shared Components (Inventory)

The app has a solid shared component library. These are the key reusable components:

| Component | Location | Purpose | Used Consistently? |
|-----------|----------|---------|-------------------|
| `PageWrapper` | mocho/components | Loading/error/empty states + ErrorBoundary | Yes — all pages |
| `ListLayout` | components/ | List page shell (title bar + toolbar + content) | Yes — all list pages |
| `DetailLayout` | components/ | Detail page shell (header + summary + tabs + content) | Yes — all detail pages |
| `MainCard` | mocho/components | Content card container | Yes — all list pages for table wrapper |
| `SectionCard` | components/ | Card with grey header + actions | Partial — only Place, Contact |
| `NewDataGrid` | mocho/components | AG Grid wrapper with loading/empty/error states | Yes — all list pages |
| `ActionsCell` | mocho/components/DataGrid | Row actions (view/edit/delete) | Partial — 5 of 9 pages |
| `KpiCell` | feature components | Summary metric card | Inconsistent — some pages use it, others don't |
| `StatusBadge` | components/ | Color-coded status pill | Yes |
| `DetailRow` | components/ | Key-value display row | Partial — Place, Contact only |
| `SectionHeader` | components/ | Uppercase section title with Edit button | Rarely used |
| `EmptyState` | mocho/components | User-friendly empty state with action | Rarely used — most pages use inline text |
| `ConfirmDialog` | mocho/components | Confirmation modal | Available but underused |
| `FormDialog` | mocho/components | Modal with Formik form | Available but underused |
| `DebouncedInput` | mocho/components | Search input with debounce | Available but NOT used — pages build their own |
| `EditableSection` | mocho/components | View/edit toggle card | Available but NOT used |
| `ContextualAlert` | components/ | Inline alert with severity | Partial |
| `ActionMenu` | components/ | Three-dot dropdown menu | Available but underused |
| Typography helpers | components/Typography | Semantic text components | Available but NOT used |

### The Core Problem: Building the Same Things Differently

Every list page and detail page builds the same structural elements from scratch using raw MUI primitives instead of composing from shared components. The shared components exist but are underused.

---

### LIST PAGE COMPARISON MATRIX

#### Structure: What Each Page Builds

| Element | Carrier | Vehicle | Driver | Contact | Customer | Place | Invoices | Settlement | Expenses |
|---------|---------|---------|--------|---------|----------|-------|----------|------------|---------|
| **KPI summary row** | 4 cards (inline) | 4 cards (inline) | 4 cards (inline) | 3 cards (inline) | None | None | None | None | None |
| **Filter bar** | Inline JSX | Inline JSX | Inline JSX | Inline JSX | Inline JSX | Inline JSX | Inline JSX | Inline JSX | Inline JSX |
| **Search input** | Raw OutlinedInput | Raw TextField | Raw TextField | Raw TextField | Raw TextField | Raw OutlinedInput | Raw TextField | None | Raw OutlinedInput |
| **Table** | NewDataGrid | NewDataGrid | NewDataGrid | NewDataGrid | NewDataGrid | NewDataGrid | NewDataGrid | NewDataGrid | NewDataGrid |
| **Actions column** | ActionsCell | ActionsCell | ActionsCell | Inline Button | ActionsCell | ActionsCell | None | None | None |
| **Cell renderers** | Imported files | Imported files | Imported files | **Inline in page** | **Inline in page** | Imported files | **Inline in page** | **Inline in page** | **Inline in page** |
| **Row height** | 62 | 62 | 62 | **52** | 62 | 62 | **52** | **52** | **52** |
| **Pagination** | Off | Off | Off | Off | Off | **On** | **On** | **On** | **On** |
| **Row click** | Navigate | Navigate | Navigate | Navigate | Navigate | Navigate | Navigate | Navigate | **None** |

#### Inconsistencies Found

**1. KPI summary cards — 3 different approaches:**
- Carrier/Vehicle/Driver: Build 4 KPI cards using `MainCard` + `Grid` inline in the page
- Contact: Builds 3 KPI cards with slightly different styling
- Customer/Place/Invoices/Settlement/Expenses: No KPIs at all

**Recommendation:** Create a `ListKpiBar` component that takes an array of `{ label, value, subtitle? }` and renders them consistently. Pages that don't need KPIs just don't render it.

**2. Filter bar — every page builds its own from scratch:**
Every page constructs its filter bar using raw `Stack`, `Select`, `OutlinedInput`, `TextField` etc. with slightly different:
- Label placement (above input vs floating label vs no label)
- Spacing between filters
- Search input style (some have search icon, some don't)
- Debounce implementation (some useRef + setTimeout, some useEffect)

**Recommendation:** Create a `FilterBar` component that accepts a declarative filter config:
```typescript
<FilterBar
  filters={[
    { type: 'select', name: 'status', label: 'Status', options: statusOptions },
    { type: 'select', name: 'carrier', label: 'Carrier', options: carrierOptions },
  ]}
  search={{ placeholder: 'Search by name, MC#...', debounce: 300 }}
  values={filters}
  onChange={handleFilterChange}
/>
```

**3. Cell renderers — some imported from files, some inline in page:**
- Carrier, Vehicle, Driver, Place: Cell renderers in `components/` folder (e.g., `CarrierNameCellRenderer`)
- Contact, Customer, Invoices, Settlement, Expenses: Cell renderers defined **inline in the page file** as arrow functions

**Recommendation:** All cell renderers should be extracted to `<feature>/components/<Feature>CellRenderers.tsx`. The page file should only compose columns, not define rendering logic.

**4. Row height — two different values with no clear rationale:**
- 62px: Carrier, Vehicle, Driver, Customer, Place
- 52px: Contact, Invoices, Settlement, Expenses

**Recommendation:** Standardize to 56px for all tables. If a table needs more vertical space (avatars, two-line cells), use 64px.

**5. Pagination — inconsistent:**
- Off: Carrier, Vehicle, Driver, Contact, Customer
- On (25 per page): Place, Invoices, Settlement, Expenses

**Recommendation:** All tables should have pagination. Use `paginationPageSize: 25` as the standard. For small datasets the pagination controls just show "Page 1 of 1" — no harm.

**6. Actions column — 3 different patterns:**
- ActionsCell with view icon: Carrier, Vehicle, Driver, Place
- Inline "Edit" text button: Contact
- No actions column: Customer (row click only), Invoices, Settlement, Expenses

**Recommendation:** Use `ActionsCell` consistently. At minimum, all tables should have a view action (eye icon). The row click should also navigate, but the visible action gives discoverability.

**7. Empty states — plain text vs EmptyState component:**
All pages use inline `<Typography>No X found</Typography>` instead of the shared `EmptyState` component which provides an icon, title, message, and optional action button.

**Recommendation:** Use `EmptyState` component with `entityName` prop for auto-generated messages and a "Create" action button.

**8. Search input — shared DebouncedInput exists but isn't used:**
Every page builds its own debounced search using `useState` + `useRef` + `setTimeout` or `useEffect`. The shared `DebouncedInput` component does exactly this.

**Recommendation:** Replace all custom search implementations with `DebouncedInput`.

---

### DETAIL PAGE COMPARISON MATRIX

#### Structure: What Each Page Builds

| Element | Load | Carrier | Driver | Vehicle | Customer | Place | Contact |
|---------|------|---------|--------|---------|----------|-------|---------|
| **Summary bar** | `LoadSummaryBar` component | `CarrierKPI` component | `DriverKPI` component | `VehicleKPI` component | **Inline KpiCells** | **Inline KpiCells** | **Inline KpiCells** |
| **Tab components location** | `./components/` | `./tabs/` | `./components/` | `./components/` | `./tabs/` | **Inline** | **Inline** |
| **Content cards** | Tab-managed | Tab-managed | Tab-managed | Tab-managed | Tab-managed | `SectionCard` + `DetailRow` | `SectionCard` + `DetailRow` |
| **Edit button style** | "Edit" text in card | Pencil icon in card | "Edit" outlined button in header | "Edit" outlined button in header | "Edit" inline button | "Edit Place" button in header | "Edit Contact" button in header |
| **Right sidebar** | Financials + Contact cards | None | Status + Preferences cards | Revenue + Assignment cards | None | Visit Stats card | Recent Loads card |
| **Sidebar layout** | `Grid md={7}` + `md={5}` | Full width | `Grid md={8}` + `md={4}` | `Grid md={8}` + `md={4}` | Full width | `Grid md={8}` + `md={4}` | `grid-template-columns: 1fr 1fr` |
| **Drawer management** | Redux `openDrawer()` | Redux `useDrawerActions()` | **5 local useStates** | **3 local useStates** | Redux `useDrawerActions()` | Redux `useDrawerActions()` | **1 local useState** |
| **Documents tab** | Dedicated tab component | Dedicated tab component | **Inline Box + DocumentTable** | **Inline Box + DocumentTable** | N/A | N/A | N/A |

#### Inconsistencies Found

**1. Summary bar — two different approaches:**
- Load, Carrier, Driver, Vehicle: Wrap KPI cells in a dedicated `<Feature>KPI` or `<Feature>SummaryBar` component
- Customer, Place, Contact: Build KPI cells **inline in the page file** — no wrapper component

**Recommendation:** Every detail page should have a `<Feature>SummaryBar` component in its `components/` folder. The page passes entity data; the component renders KPIs. This keeps page files focused on orchestration.

**2. Edit button placement — 3 different locations:**
- Inside card header (Load: "Edit" text, Carrier: pencil icon)
- In page header actions (Driver, Vehicle, Place, Contact: button passed to DetailLayout)
- The pencil icon vs text button vs outlined button styling varies

**Recommendation:** Standardize on two patterns:
- **Page-level action:** One primary action button in the DetailLayout header (e.g., "Mark Dispatched", "Generate Invoice")
- **Card-level edit:** Use `SectionHeader` component with its built-in Edit button for section-level edits. This already exists and renders a consistent pencil + "Edit" label.

**3. Sidebar layout — 4 different approaches:**
- Load: Grid `md={7}` / `md={5}` (unequal)
- Driver/Vehicle/Place: Grid `md={8}` / `md={4}` (standard)
- Contact: CSS Grid `1fr 1fr` (equal)
- Carrier/Customer: No sidebar (full width)

**Recommendation:** Standardize on `md={8}` / `md={4}` for pages with a sidebar. Carrier and Customer should add a sidebar if they have secondary info to show. If not, full-width is fine.

**4. Tab component organization — 3 different patterns:**
- Carrier, Customer: `./tabs/` subfolder
- Load, Driver, Vehicle: `./components/` folder (tabs mixed with other page-local components)
- Place, Contact: Tab content rendered **inline in the page file** — no extraction at all

**Recommendation:** Per the CLAUDE.md rule, tabs are page-local components that live in `pages/<Page>/components/` with a `Tab` suffix (e.g., `OverviewTab.tsx`). All pages should follow this. No separate `tabs/` folder.

**5. Content cards — MainCard vs SectionCard:**
- Load, Carrier, Driver, Vehicle, Customer: Tab components manage their own cards (usually `MainCard`)
- Place, Contact: Use `SectionCard` (which has a grey header and actions)

**Recommendation:** `SectionCard` is the better component for detail pages — it provides a title header and optional edit action built-in. Standardize on `SectionCard` for all detail page content sections. Use `MainCard` only for the table wrapper on list pages.

**6. Documents tab duplication:**
Driver and Vehicle both render an inline Documents tab pattern: `<Box>` + upload `<Button>` + `<DocumentTable>`. This should be a shared component.

**Recommendation:** Create a `DocumentsTab` component in `components/` (app-level shared) that accepts `entityType` and `entityId` props. Both driver and vehicle (and future features) use it.

---

### Refactoring Plan: Component Standardization

#### Phase A: Create Missing Shared Components (Foundation)

**A.1 — `FilterBar` component**
Declarative filter bar that replaces 9 different inline implementations.
```
Props: filters[] (select, multi-select, date-range), search config, values, onChange
```

**A.2 — `ListKpiBar` component**
Standardized KPI summary row for list pages.
```
Props: items[] ({ label, value, subtitle?, icon? })
```

**A.3 — `DocumentsTab` component**
Shared tab content for document management.
```
Props: entityType, entityId, canUpload?
```

**A.4 — Standardize row heights and pagination**
Update all `NewDataGrid` usages to use consistent `rowHeight: 56` and `pagination: true, paginationPageSize: 25`.

#### Phase B: Refactor List Pages (High Impact)

For each list page, the refactoring is:
1. Replace inline filter JSX with `<FilterBar>` component
2. Replace inline KPI cards with `<ListKpiBar>` (or add it for pages that lack KPIs)
3. Replace inline search with `DebouncedInput` (already exists)
4. Extract inline cell renderers to `<Feature>CellRenderers.tsx`
5. Add `ActionsCell` to pages that lack it
6. Use `EmptyState` component instead of inline "No X found" text
7. Standardize row height to 56px
8. Enable pagination on all tables

**Refactor order** (simplest first):
1. Settlement (simplest — 1 filter, no KPIs, minimal renderers)
2. Expenses (similar — few filters, no KPIs)
3. Contact (3 KPIs, simple filters, inline renderers to extract)
4. Customer (no KPIs to add, inline renderers to extract)
5. Place (already well-structured, just needs FilterBar)
6. Invoices (unique chip-based filter — needs FilterBar to support chips)
7. Vehicle (4 KPIs, inline renderers, needs FilterBar)
8. Driver (4 KPIs, multiple filters, needs FilterBar)
9. Carrier (4 KPIs, well-structured, just needs FilterBar)

#### Phase C: Refactor Detail Pages (Medium Impact)

For each detail page:
1. Extract inline summary KPIs to a `<Feature>SummaryBar` component (Customer, Place, Contact)
2. Extract inline tab content to tab components in `pages/<Page>/components/` (Place, Contact)
3. Replace `MainCard` with `SectionCard` for content sections within tabs
4. Use `SectionHeader` for consistent edit buttons on cards
5. Standardize sidebar to `Grid md={8} / md={4}`
6. Extract Documents tab to shared `DocumentsTab` component (Driver, Vehicle)
7. Fix code duplication in Contact (loads list rendered twice)

**Refactor order:**
1. Contact (most inline content, code duplication, local drawer state)
2. Place (inline tabs, needs extraction)
3. Customer (inline summary, otherwise good)
4. Driver (drawer state migration + documents tab extraction)
5. Vehicle (drawer state migration + documents tab extraction)
6. Load (already good — just card type standardization)
7. Carrier (already good — just card type standardization)

#### Phase D: Update CLAUDE.md Standards

Add to `hussle-app-dispatch-ui/CLAUDE.md`:

```markdown
## List Page Standard Structure
PageWrapper → ListLayout → [ListKpiBar?] → MainCard → FilterBar → NewDataGrid

## Detail Page Standard Structure
PageWrapper → DataGuard → DetailLayout → [FeatureSummaryBar] → Tab panels

## Component Selection Rules
- Tables: Always NewDataGrid with ActionsCell, rowHeight: 56, pagination: true
- Content cards on detail pages: SectionCard (not MainCard)
- Content cards on list pages: MainCard (table wrapper)
- Section headers with edit: SectionHeader component
- Filters: FilterBar component (never inline JSX)
- Search: DebouncedInput (never custom debounce)
- Empty states: EmptyState component (never inline Typography)
- Cell renderers: Extracted to <Feature>CellRenderers.tsx (never inline in page)
```

---

### Updated Priority Matrix (Including Component Refactoring)

| Action | Impact | Effort | Priority |
|--------|--------|--------|----------|
| Create `FilterBar` shared component | High | Medium | **P1** |
| Create `ListKpiBar` shared component | Medium | Low | **P1** |
| Create shared `DocumentsTab` component | Medium | Low | **P1** |
| Replace inline search with `DebouncedInput` | Medium | Low | **P2** |
| Extract inline cell renderers to files | Medium | Low | **P2** |
| Standardize row height (56px) + pagination | Medium | Low | **P2** |
| Add `ActionsCell` to all tables | Medium | Low | **P2** |
| Replace inline empty states with `EmptyState` | Low | Low | **P2** |
| Extract summary bars for Customer/Place/Contact | Medium | Medium | **P3** |
| Extract tab components for Place/Contact | Medium | Medium | **P3** |
| Standardize SectionCard usage on detail pages | Medium | Medium | **P3** |
| Fix Contact code duplication | Low | Low | **P3** |
| Update CLAUDE.md with component standards | High | Low | **P1** |

---

## Part 7: Visual Consistency Findings (From Screenshots)

22 screenshots captured at 1440x900. Saved to `.planning/ui-review/screenshots/`.

### What's Consistent (Good)

- **Sidebar navigation** — identical across all pages. Clean dark-blue sidebar with user info at bottom.
- **Page title position** — all pages have `<h2>` title at top-left. Consistent.
- **Primary action button** — top-right corner, filled blue. "Add Carrier", "Create Load", "Add Driver", etc. Consistent placement.
- **Export button** — outlined blue, left of primary action. Present on most list pages.
- **Detail page header** — back arrow + entity name + status badge. Consistent across load, carrier, driver, vehicle, customer, place, contact.
- **Detail page summary bar** — horizontal KPI cards below header. Load, carrier, driver, vehicle, customer, place all have this. Consistent styling.
- **Tab navigation** — horizontal tabs below summary bar on all detail pages. Consistent underline active style.
- **Card containers** — white cards with subtle border. "Company Information", "Driver Information", "Facility Details", etc. Consistent.
- **Edit pencil icons** — top-right of editable cards. Consistent across carrier detail, driver detail, load detail.
- **Status badges** — green "Active", blue "Booked", orange "At Pickup"/"At Delivery", grey "Cancelled". Consistent color language.
- **Avatar initials** — colored circles with initials in tables (AT, MS, JS, MJ). Consistent.
- **Empty states** — centered text "No invoices found", "No settlements found", "No expenses found". Consistent wording pattern.
- **Footer count** — "Showing X of Y items" at bottom of all list pages. Consistent.

### What's Inconsistent (Needs Fix)

#### LIST PAGES — Layout Variations

| Page | KPI Cards | Filter Position | Search Position | Table Type | Pagination |
|------|-----------|-----------------|-----------------|------------|------------|
| Carriers | 4 KPIs above filters | Left (Status dropdown) | Right of filters | AG Grid | None visible |
| Vehicles | 4 KPIs above filters | Left (dropdown) | Far right | AG Grid | None visible |
| Drivers | 4 KPIs above filters | Left (dropdown + carrier) | Far right | AG Grid | None visible |
| Contacts | 3 KPIs above filters | Left (Role dropdown) | Right of filters | AG Grid | None visible |
| Customers | **No KPIs** | Top-left (2 dropdowns) | Far right | AG Grid | Horizontal scrollbar |
| Places | **No KPIs** | Top-left (dropdown) | Right of filters | AG Grid | **Full pagination** (Page 1 of 1) |
| Invoices | **No KPIs**, status pills instead | **No filter dropdowns** | Far right | AG Grid | None visible |
| Settlements | **No KPIs** | Top-left (Status dropdown) | **No search** | AG Grid | None visible |
| Expenses | **No KPIs** | Left (search + category + dates) | Left (integrated) | AG Grid | None visible |
| Dispatch Board | **No KPIs** | Left (search + status + carrier) | Left (integrated) | Custom table | None visible |

**Issues to standardize:**
1. **KPI presence** — Carriers/Vehicles/Drivers/Contacts have summary KPIs above the table. Customers/Places/Invoices/Settlements/Expenses do not. Pick one pattern.
2. **Filter bar layout** — filter controls are positioned differently on every page. Some have labels above, some inline. Search is sometimes left, sometimes far right.
3. **Pagination** — only Places has full pagination controls. All others just show count. Should be consistent.
4. **Customers page** has a horizontal scrollbar — column widths need fixing.

#### DETAIL PAGES — Structure Variations

| Page | Summary Bar Cards | Sidebar Cards | Edit Button Style | Tab Count |
|------|-------------------|---------------|-------------------|-----------|
| Load | Ship From/To + Shipment + References | Financials + Contact (right sidebar) | "Edit" text button in cards | 4 tabs |
| Carrier | MC/DOT + Contact + Margin + Drivers + Revenue + COI | None | Pencil icon in cards | 7 tabs |
| Driver | Location + Vehicle + Hours + Days Out + Gross + Last Delivered | Status & Location + Preferences (right sidebar) | "Edit" text button in sidebar, pencil in main | 5 tabs |
| Vehicle | Make/Model/Year/VIN + Type + Status + Insurance | Revenue Performance + Current Assignment (right sidebar) | Pencil icon | 4 tabs |
| Customer | Contact + Payment Terms + Loads + Revenue + Total Invoiced | None | Pencil icon | 6 tabs |
| Place | Address + Facility Type + Appointment + Dock Type + Visits | Visit Stats (right sidebar) | "Edit Place" button in header | 3 tabs |
| Contact | Customer + Role + Phone + Email + Loads | Recent Loads (right sidebar) | "Edit Contact" button in header | 3 tabs |

**Issues to standardize:**
1. **Edit action style** — Load uses "Edit" text buttons inside cards. Carrier/Vehicle/Customer use pencil icons inside cards. Place/Contact use a top-right header button. Should pick one.
2. **Right sidebar** — Load, Driver, Vehicle, Place, Contact use a right sidebar for secondary info. Carrier and Customer do not. The sidebar pattern is good but should be applied consistently where there's secondary context.
3. **Summary bar cards** — all detail pages have them, but the number varies (4-7). Not a problem per se, but the visual density differs significantly.
4. **Contact detail** shows raw UUID for "Customer" field instead of the customer name. Bug.
5. **Place detail** shows `\u2014` escape character for "Avg Wait Time" instead of rendering the em-dash. Bug.

#### OTHER VISUAL ISSUES

1. **Dashboard** — lots of whitespace below the content. The "Needs Attention" card is small relative to the page. Consider a 2-column layout or more dashboard widgets.
2. **Dispatch Board table** — dates show "07/14/1993 12:00 AM" which looks like placeholder/test data. The stops column shows "—" with an arrow between them — no city names displayed.
3. **Vehicle list** — "Carrier" column shows truncated UUIDs (e8d752b8..., 9145f3fd-...) instead of carrier names. Bug.
4. **Create Load page** — complex form with good section organization. The "Stops" section with pickup/delivery tabs is well-designed.
5. **Map view** — functional but sparse. Load cards at bottom use horizontal scroll — works but could be more scannable.

---

## Appendix: Screenshot Index

All screenshots at 1440x900, saved to `.planning/ui-review/screenshots/`.

| # | File | Page |
|---|------|------|
| 01 | `01-dashboard.png` | Dashboard |
| 02 | `02-dispatch-board-kanban.png` | Dispatch Board (table view) |
| 03 | `03-load-detail.png` | Load Detail (overview tab) |
| 04 | `04-carrier-list.png` | Carrier List |
| 05 | `05-vehicle-list.png` | Vehicle List |
| 06 | `06-driver-list.png` | Driver List |
| 07 | `07-contact-list.png` | Contact List |
| 08 | `08-customer-list.png` | Customer List |
| 09 | `09-place-list.png` | Place List |
| 10 | `10-invoice-list.png` | Invoice List |
| 11 | `11-settlement-list.png` | Settlement List |
| 12 | `12-settings.png` | Settings (General tab) |
| 13 | `13-carrier-detail.png` | Carrier Detail (General tab) |
| 14 | `14-driver-detail.png` | Driver Detail (Overview tab) |
| 15 | `15-vehicle-detail.png` | Vehicle Detail (Overview tab) |
| 16 | `16-customer-detail.png` | Customer Detail (Overview tab) |
| 17 | `17-place-detail.png` | Place Detail (Overview tab) |
| 18 | `18-contact-detail.png` | Contact Detail (Overview tab) |
| 19 | `19-dispatch-map.png` | Dispatch Board (Map view) |
| 20 | `20-create-load.png` | Create Load page |
| 21 | `21-expenses.png` | Expenses List |
| 22 | `22-ifta.png` | IFTA Report |
