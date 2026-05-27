# UI Consistency & Component Standardization Tasks
_Last updated: 2026-04-15 10:30_
_Audit report: .planning/ui-review/audit-report.md_

---

## US-01: Create FilterBar shared component
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] FilterBar renders select, multi-chip, date-range, toggle, and search filter types
- [ ] Each filter type is independently importable as a sub-component
- [ ] FilterBar accepts a declarative `filters[]` config and renders them in order
- [ ] Search uses DebouncedInput with 300ms debounce
- [ ] All filter labels are positioned consistently (above the input)
- [ ] All text uses semantic Typography helpers — no raw `<Typography variant="...">`
- [ ] FilterBar has no feature-specific logic — purely presentational
- [ ] Component has unit tests for each filter type
- [ ] Storybook story demonstrating all filter types

**Tasks:**
[ ] T-01 [TYPES] Define FilterBar types and props interface
         └─ Detail: Create `src/components/FilterBar/filterBarTypes.ts`.
            Define `FilterType = 'select' | 'multiSelectChip' | 'dateRange' | 'toggle'`.
            Define `FilterConfig` discriminated union: `SelectFilterConfig` (name, label, options[], value, onChange),
            `MultiChipFilterConfig` (name, label, options[], value: string[], onChange),
            `DateRangeFilterConfig` (name, label, from, to, onChange),
            `ToggleFilterConfig` (name, label, checked, onChange).
            Define `FilterBarProps` = { filters: FilterConfig[], search?: { placeholder: string, value: string, onChange: (v: string) => void, debounce?: number }, className?: string }.
            All text props are `string` — the component is purely presentational.
         └─ Depends on: —
         └─ Output:

[ ] T-02 [UI] Build FilterBar sub-components
         └─ Detail: Create 5 sub-components in `src/components/FilterBar/`:
            - `FilterBarSelect.tsx` — MUI `Select` with label above using `BodyMuted` from `components/Typography`. Props: `SelectFilterConfig`.
            - `FilterBarMultiChip.tsx` — MUI `Chip`-based multi-select (reference invoices status filter pattern at `features/invoices/pages/index.tsx`). Label uses `BodyMuted`.
            - `FilterBarDateRange.tsx` — two MUI `DatePicker` inputs (From/To) with `BodyMuted` labels.
            - `FilterBarToggle.tsx` — MUI `Switch` with `Body` label.
            - `FilterBarSearch.tsx` — wraps existing `DebouncedInput` from `mocho/components`. Pass 300ms default debounce. Label uses `BodyMuted`.
            Each sub-component is independently exported from `src/components/FilterBar/index.ts`.
         └─ Depends on: T-01
         └─ Output:

[ ] T-03 [UI] Build FilterBar orchestrator component
         └─ Detail: Create `src/components/FilterBar/FilterBar.tsx`.
            Accepts `FilterBarProps`. Renders filters in a horizontal MUI `Stack` with `spacing={2}`.
            Maps each `FilterConfig` to the correct sub-component via `filter.type` discriminant.
            Search is always rendered last and right-aligned (`ml: 'auto'`).
            Responsive: use `flexWrap: 'wrap'` so filters wrap on small screens.
            Export `FilterBar` as default from `src/components/FilterBar/index.ts` alongside sub-components.
            All text uses Typography helpers from `components/Typography/` — zero raw `<Typography>`.
         └─ Depends on: T-02
         └─ Output:

[ ] T-04 [TEST] Write FilterBar unit tests
         └─ Detail: Create `src/components/FilterBar/__tests__/FilterBar.test.tsx`.
            Test: renders a select filter with options, renders multi-chip filter with chips,
            renders date-range with from/to, renders toggle, renders search with DebouncedInput,
            renders all filter types together, search fires onChange after debounce,
            select onChange fires with new value.
            Use `renderWithTheme()` pattern from test-utils if available, otherwise `render()` + `ThemeProvider`.
         └─ Depends on: T-03
         └─ Output:

[ ] T-05 [DOCS] Write FilterBar Storybook story
         └─ Detail: Create `src/components/FilterBar/FilterBar.stories.tsx`.
            Stories: AllFilterTypes (all 5 types), SelectOnly, MultiChipOnly, DateRangeOnly,
            SearchOnly, WithoutSearch. Use Storybook controls for interactive props.
         └─ Depends on: T-03
         └─ Output:

---

## US-02: Create ListKpiBar shared component
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] Accepts `items[]` array of `{ label: string, value: string | number, subtitle?: string }`
- [ ] Renders items in a responsive horizontal row using MainCard wrappers
- [ ] Labels use `BodyMuted`, values use `AmountDisplay` or `BodyStrong`, subtitles use `Body`
- [ ] No raw `<Typography>` — all text uses semantic Typography helpers
- [ ] Consistent spacing and sizing across all items
- [ ] Handles 3-6 items gracefully (responsive wrapping)
- [ ] Component has unit tests
- [ ] Storybook story with 3, 4, 5, and 6 item variants

**Tasks:**
[ ] T-06 [UI] Build ListKpiBar component
         └─ Detail: Create `src/components/ListKpiBar/index.tsx`.
            Props: `{ items: Array<{ label: string; value: string | number; subtitle?: string }> }`.
            Renders a horizontal `Grid` row. Each item is a `MainCard` (from `components/MainCard`)
            containing: `BodyMuted` for label, `BodyStrong` for value (use `AmountDisplay` if value
            starts with `$`), `Body` for optional subtitle.
            All Typography helpers from `components/Typography/`.
            Grid uses `xs={12} sm={6} md={auto}` so items wrap responsively.
            Reference existing inline KPI pattern in `features/carrier/pages/CarrierListPage/index.tsx` for visual style.
         └─ Depends on: —
         └─ Output:

[ ] T-07 [TEST] Write ListKpiBar unit tests
         └─ Detail: Create `src/components/ListKpiBar/__tests__/ListKpiBar.test.tsx`.
            Test: renders correct number of items, renders labels/values/subtitles,
            handles missing subtitle gracefully, renders 3 items, renders 6 items.
         └─ Depends on: T-06
         └─ Output:

[ ] T-08 [DOCS] Write ListKpiBar Storybook story
         └─ Detail: Create `src/components/ListKpiBar/ListKpiBar.stories.tsx`.
            Stories: ThreeItems, FourItems, FiveItems, SixItems, WithSubtitles, WithoutSubtitles.
         └─ Depends on: T-06
         └─ Output:

---

## US-03: Create DocumentsTab shared component
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] Accepts `entityType`, `entityId`, and optional `canUpload` props
- [ ] Renders upload button (opens document upload drawer via `openDrawer('documentUpload', ...)`)
- [ ] Renders DocumentTable for the given entity
- [ ] Dispatches `fetchDocumentsRequest` on mount
- [ ] Component has unit tests

**Tasks:**
[ ] T-09 [UI] Build DocumentsTab component
         └─ Detail: Create `src/components/DocumentsTab/index.tsx`.
            Props: `{ entityType: string; entityId: string; canUpload?: boolean }`.
            On mount, dispatch `fetchDocumentsRequest({ entityType, entityId })`.
            Render: MUI `Box` with upload `Button` (if canUpload) that calls
            `useDrawerActions().openDrawer('documentUpload', { entityType, entityId })`.
            Below button, render `DocumentTable` component (find existing usage in
            `features/driver/pages/DriverDetailPage/` — it renders documents inline with
            `<Box>` + `<Button>` + `<DocumentTable>`). Extract that same pattern.
            All text uses Typography helpers. Upload button label: "Upload Document".
         └─ Depends on: —
         └─ Output:

[ ] T-10 [TEST] Write DocumentsTab unit tests
         └─ Detail: Create `src/components/DocumentsTab/__tests__/DocumentsTab.test.tsx`.
            Test: dispatches fetchDocumentsRequest on mount, renders upload button when canUpload=true,
            hides upload button when canUpload=false, renders DocumentTable.
            Mock Redux dispatch and DocumentTable.
         └─ Depends on: T-09
         └─ Output:

---

## US-04: Update CLAUDE.md with component standards
_Priority: P0 | Services: dispatch-ui | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [ ] All 7 sections added to CLAUDE.md (component selection rules, list page structure, detail page structure, drawer vs modal framework, opening checklist, table standards, typography standards)
- [ ] Decision framework includes the decision tree and sizing conventions
- [ ] Opening checklist includes all 8 steps
- [ ] Component selection rules cover: MainCard vs SectionCard, FilterBar vs inline, DebouncedInput vs custom, EmptyState vs inline text
- [ ] Typography standards include the full mapping table — no raw `<Typography>` allowed

**Tasks:**
[ ] T-11 [DOCS] Add component standards sections to dispatch-ui CLAUDE.md
         └─ Detail: Read `hussle-app-dispatch-ui/CLAUDE.md` and append 7 new sections:
            1. **Component Selection Rules** — MainCard (list page table wrapper) vs SectionCard (detail page content), FilterBar (never inline filter JSX), DebouncedInput (never custom debounce), EmptyState (never inline "No X found"), ActionsCell (all tables), DetailRow (key-value in detail pages).
            2. **List Page Standard Structure** — `PageWrapper → ListLayout → [ListKpiBar] → MainCard → FilterBar → NewDataGrid`
            3. **Detail Page Standard Structure** — `PageWrapper → DataGuard → DetailLayout → [FeatureSummaryBar] → Tab panels in pages/<Page>/components/ with Tab suffix`
            4. **Drawer vs Modal Decision Framework** — decision tree from audit-report.md Part 3 (Does user need to see parent page? YES→Drawer, NO→complex?→Full Page, else→Modal). Sizing: Drawers 480px/640px, Modals sm/md.
            5. **Drawer/Modal Opening Checklist** — 8 steps: decide type, create component, add type to popupTypes.ts, add prop shape to DrawerTypeMap/ModalTypeMap, register in registry, open via hook, close via onClose prop, test.
            6. **Table Standards** — all tables MUST use NewDataGrid, rowHeight: 56, pagination: true, paginationPageSize: 25, ActionsCell on all tables. No custom table implementations.
            7. **Typography Standards** — full mapping table: PageTitle, SectionTitle, EntityId, AmountDisplay, Amount, Body, BodyStrong, BodyMedium, BodyMuted, DrawerTitle, ModalTitle. Never use raw `<Typography variant="...">`.
            Content sourced from plan.md Stories 4 AC and audit-report.md Parts 3, 3b, 6.
         └─ Depends on: —
         └─ Output:

---

## US-05: Fix carrier saga watcher + register missing drawers/modals
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] `carrierSagasWatcher.ts` — uncomment `updateCarrierSaga` and `deleteCarrierSaga` registrations
- [ ] All unregistered drawers added to `drawerRegistry.ts`: DisputeSettlementDrawer, AddAdjustmentDrawer, ExpenseQuickAddDrawer
- [ ] All unregistered modals added to `modalRegistry.ts`: InviteMemberDialog, GenerateSettlementDialog, CarrierNoteDrawer (reclassified as modal), PaySettlementDrawer (reclassified as modal), invoice Send/MarkPaid/Delete dialogs
- [ ] Type entries for each new registration in `popupTypes.ts` (DrawerType union + DrawerTypeMap + ModalType union + ModalTypeMap)
- [ ] All registered components render correctly when opened via hooks

**Tasks:**
[ ] T-12 [FIX] Uncomment carrier saga watcher registrations
         └─ Detail: Read `features/carrier/store/sagas/carrierSagasWatcher.ts`.
            Find commented-out `takeLatest` or `takeEvery` calls for `updateCarrierSaga` and `deleteCarrierSaga`.
            Uncomment them. Verify the imported saga functions exist and match the action types.
            Also verify the action types are exported from the carrier page slice.
         └─ Depends on: —
         └─ Output:

[ ] T-13 [TYPES] Add all missing drawer/modal types to popupTypes.ts
         └─ Detail: Read `features/ui/types/popupTypes.ts`.
            Add to `DrawerType` union: `'disputeSettlement'`, `'addAdjustment'`, `'expenseQuickAdd'`.
            Add to `DrawerTypeMap`: prop shapes for each (e.g., `{ settlementId: string }` for disputeSettlement).
            Add to `ModalType` union: `'inviteMember'`, `'generateSettlement'`, `'carrierNote'`, `'paySettlement'`, `'confirmDeleteInvoice'`, `'sendInvoice'`, `'markInvoicePaid'`.
            Add to `ModalTypeMap`: prop shapes for each (e.g., `{ carrierId: string }` for carrierNote, `{ invoiceId: string }` for invoice modals, `{ onConfirm: () => void }` for confirmDeleteInvoice).
            Read existing drawer/modal component files to determine correct prop shapes.
         └─ Depends on: —
         └─ Output:

[ ] T-14 [WIRE] Register all missing drawers in drawerRegistry.ts
         └─ Detail: Read `features/ui/drawerRegistry.ts`.
            Add lazy imports and registry entries for:
            - `disputeSettlement` → `DisputeSettlementDrawer` (find in `features/accounting/` or `features/settlement/`)
            - `addAdjustment` → `AddAdjustmentDrawer` (find in same area)
            - `expenseQuickAdd` → `ExpenseQuickAddDrawer` (find in `features/accounting/` or `features/expenses/`)
            Follow the existing lazy-import pattern used by other entries in the registry.
         └─ Depends on: T-13
         └─ Output:

[ ] T-15 [WIRE] Register all missing modals in modalRegistry.ts
         └─ Detail: Read `features/ui/modalRegistry.ts`.
            Add lazy imports and registry entries for:
            - `inviteMember` → `InviteMemberDialog` (find in `features/settings/`)
            - `generateSettlement` → `GenerateSettlementDialog` (find in `features/accounting/`)
            - `carrierNote` → reclassified from drawer. Find `CarrierNoteDrawer` in `features/carrier/`, wrap or adapt it as a modal component.
            - `paySettlement` → reclassified from drawer. Find `PaySettlementDrawer` in `features/accounting/`, wrap or adapt as modal.
            - `confirmDeleteInvoice` → use `ConfirmDialog` from `mocho/components` with delete-specific props.
            - `sendInvoice` → find send dialog in `features/invoices/`, register as modal.
            - `markInvoicePaid` → find mark-paid dialog in `features/invoices/`, register as modal.
            Follow existing lazy-import pattern.
         └─ Depends on: T-13
         └─ Output:

[ ] T-16 [TEST] Verify registrations compile and render
         └─ Detail: Run `npx tsc --noEmit -p tsconfig.app.json` from `hussle-app-dispatch-ui/` to verify
            type safety of all new registrations. Run `npx jest --findRelatedTests` on popupTypes.ts,
            drawerRegistry.ts, modalRegistry.ts if tests exist.
         └─ Depends on: T-14, T-15
         └─ Output:

---

## US-06: Refactor Contact feature
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] ContactListPage uses FilterBar component (role select + search)
- [ ] ContactListPage uses ListKpiBar for summary metrics
- [ ] Cell renderers extracted to `ContactCellRenderers.tsx`
- [ ] ActionsCell with view action replaces inline Edit button
- [ ] Row height 56px, pagination enabled (25 per page)
- [ ] EmptyState component for no-data state
- [ ] ContactDetailPage summary KPIs extracted to `ContactSummaryBar` component
- [ ] Tab content extracted to `OverviewTab.tsx` and `LoadsTab.tsx` (fix duplicate loads list)
- [ ] SectionCard + DetailRow used consistently
- [ ] Sidebar layout standardized to Grid md={8} / md={4}
- [ ] Bug fixed: Customer field shows customer name instead of raw UUID
- [ ] All raw `<Typography>` replaced with semantic Typography helpers
- [ ] Drawer state removed from useState — uses `useDrawerActions().openDrawer('contactInfo', { contactId })`
- [ ] Inline drawer rendering removed — DrawerManager handles it

**Tasks:**
[ ] T-17 [LIST] Refactor ContactListPage
         └─ Detail: Read `features/contact/pages/ContactListPage/index.tsx`.
            1. Replace inline filter JSX with `<FilterBar>` — config: role select (from existing options) + search.
            2. Replace inline KPI cards with `<ListKpiBar>` — items from existing KPI data (Total Contacts, By Role breakdown).
            3. Extract inline cell renderers to `features/contact/pages/ContactListPage/components/ContactCellRenderers.tsx`.
            4. Replace inline Edit button column with `ActionsCell` (import from `mocho/components/DataGrid`) with view action that navigates to detail.
            5. Set `rowHeight={56}` and `pagination={true} paginationPageSize={25}` on NewDataGrid.
            6. Replace inline "No contacts" text with `EmptyState` component from `mocho/components`.
            7. Replace "Showing X" footer with grid's built-in row count.
            8. Replace all raw `<Typography>` with Typography helpers (Body, BodyMuted, BodyStrong, etc.).
         └─ Depends on: T-03 (FilterBar), T-06 (ListKpiBar)
         └─ Output:

[ ] T-18 [DETAIL] Refactor ContactDetailPage
         └─ Detail: Read `features/contact/pages/ContactDetailPage/index.tsx`.
            1. Extract inline summary KPIs to `features/contact/pages/ContactDetailPage/components/ContactSummaryBar.tsx`. Use Typography helpers for all text.
            2. Extract inline Overview tab content to `features/contact/pages/ContactDetailPage/components/OverviewTab.tsx`.
            3. Extract inline Loads tab content to `features/contact/pages/ContactDetailPage/components/LoadsTab.tsx`. Fix code duplication — loads list is rendered twice in the current code.
            4. Use `SectionCard` (from `components/SectionCard`) + `DetailRow` (from `components/DetailRow`) consistently for content sections.
            5. Standardize sidebar layout to `Grid md={8}` (main) / `md={4}` (sidebar) — replace current `grid-template-columns: 1fr 1fr`.
            6. Fix bug: Customer field shows raw UUID — resolve the customer name by reading from the customers entity slice or from the contact's populated customer field.
            7. Replace all raw `<Typography>` with semantic Typography helpers.
         └─ Depends on: —
         └─ Output:

[ ] T-19 [DRAWER] Migrate Contact drawer state to Redux
         └─ Detail: In `ContactListPage/index.tsx` and `ContactDetailPage/index.tsx`:
            1. Remove `useState` hooks for `drawerOpen` / drawer open state.
            2. Import `useDrawerActions` from `features/ui/hooks/useDrawerActions`.
            3. Replace `setDrawerOpen(true)` with `openDrawer('contactInfo', { contactId })`.
            4. Remove inline `<ContactInfoDrawer>` rendering from both pages — DrawerManager handles it.
            5. Verify `contactInfo` is already registered in `drawerRegistry.ts` and `popupTypes.ts`. If not, add it.
            6. Verify the ContactInfoDrawer reads contact data from Redux store by ID (not from stale props).
         └─ Depends on: T-13 (popupTypes)
         └─ Output:

---

## US-07: Refactor Driver feature
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] DriverListPage uses FilterBar (status tab select + carrier select + search)
- [ ] DriverListPage uses ListKpiBar for summary metrics
- [ ] Row height 56px, pagination enabled
- [ ] Documents tab uses shared DocumentsTab component
- [ ] Tab components in `pages/DriverDetailPage/components/` with Tab suffix
- [ ] Sidebar layout standardized to Grid md={8} / md={4}
- [ ] All raw `<Typography>` replaced with semantic Typography helpers
- [ ] All 5 useState drawer hooks removed — uses `useDrawerActions` for all
- [ ] Inline drawer rendering removed — DrawerManager handles it
- [ ] All 5 drawer types verified registered in `drawerRegistry.ts` and `popupTypes.ts`

**Tasks:**
[ ] T-20 [LIST] Refactor DriverListPage
         └─ Detail: Read `features/driver/pages/DriverListPage/index.tsx`.
            1. Replace inline filter JSX with `<FilterBar>` — config: status select, carrier select, search.
            2. Replace inline KPI cards with `<ListKpiBar>`.
            3. Set `rowHeight={56}`, `pagination={true}`, `paginationPageSize={25}` on NewDataGrid.
            4. Replace all raw `<Typography>` with Typography helpers.
         └─ Depends on: T-03 (FilterBar), T-06 (ListKpiBar)
         └─ Output:

[ ] T-21 [DETAIL] Refactor DriverDetailPage
         └─ Detail: Read `features/driver/pages/DriverDetailPage/index.tsx`.
            1. Replace inline Documents tab with shared `<DocumentsTab entityType="driver" entityId={id} canUpload />` from `components/DocumentsTab`.
            2. Ensure all tab components live in `pages/DriverDetailPage/components/` with `Tab` suffix naming.
            3. Standardize sidebar layout to `Grid md={8}` / `md={4}` (verify current layout matches).
            4. Replace all raw `<Typography>` with semantic Typography helpers.
            5. KPI cards and tab content must also use Typography helpers.
         └─ Depends on: T-09 (DocumentsTab)
         └─ Output:

[ ] T-22 [DRAWER] Migrate Driver drawer state to Redux
         └─ Detail: In `features/driver/pages/DriverDetailPage/index.tsx`:
            1. Remove 5 `useState` hooks: `infoDrawerOpen`, `preferencesDrawerOpen`, `locationDrawerOpen`, `weeklyScheduleDrawerOpen`, `overrideDrawerOpen`.
            2. Import `useDrawerActions` from `features/ui/hooks/useDrawerActions`.
            3. Replace each `setState(true)` with `openDrawer('driverInfo', { driverId })`, `openDrawer('driverPreferences', { driverId })`, etc.
            4. Remove ALL inline drawer component rendering from the page — DrawerManager handles it.
            5. Verify all 5 drawer types are registered in `drawerRegistry.ts` and have entries in `popupTypes.ts`. Add any missing ones.
            6. Each drawer should read driver data from Redux store by driverId, not from props.
         └─ Depends on: T-13 (popupTypes)
         └─ Output:

---

## US-08: Refactor Vehicle feature
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] VehicleListPage uses FilterBar (tab select + search)
- [ ] VehicleListPage uses ListKpiBar for summary metrics
- [ ] Row height 56px, pagination enabled
- [ ] Bug fixed: Carrier column shows carrier names instead of truncated UUIDs
- [ ] Documents tab uses shared DocumentsTab component
- [ ] Tab components in `pages/VehicleDetailPage/components/`
- [ ] Sidebar layout standardized to Grid md={8} / md={4}
- [ ] All raw `<Typography>` replaced with semantic Typography helpers
- [ ] All 3 useState drawer hooks removed — uses `useDrawerActions`
- [ ] All 3 drawer types verified registered

**Tasks:**
[ ] T-23 [LIST] Refactor VehicleListPage
         └─ Detail: Read `features/vehicle/pages/VehicleListPage/index.tsx`.
            1. Replace inline filter JSX with `<FilterBar>` — config: tab/status select + search.
            2. Replace inline KPI cards with `<ListKpiBar>`.
            3. Set `rowHeight={56}`, `pagination={true}`, `paginationPageSize={25}`.
            4. Fix bug: Carrier column shows truncated UUIDs. Find the cell renderer for carrier column — it's likely rendering `vehicle.carrierId` directly. Replace with a lookup: read carrier name from carriers entity slice using `selectCarrierById(vehicle.carrierId)` or use the populated carrier name field if the API returns it.
            5. Replace all raw `<Typography>` with Typography helpers.
         └─ Depends on: T-03 (FilterBar), T-06 (ListKpiBar)
         └─ Output:

[ ] T-24 [DETAIL] Refactor VehicleDetailPage
         └─ Detail: Read `features/vehicle/pages/VehicleDetailPage/index.tsx`.
            1. Replace inline Documents tab with shared `<DocumentsTab entityType="vehicle" entityId={id} canUpload />`.
            2. Ensure tab components in `pages/VehicleDetailPage/components/`.
            3. Verify sidebar layout is `Grid md={8}` / `md={4}`.
            4. Replace all raw `<Typography>` with Typography helpers.
         └─ Depends on: T-09 (DocumentsTab)
         └─ Output:

[ ] T-25 [DRAWER] Migrate Vehicle drawer state to Redux
         └─ Detail: In `features/vehicle/pages/VehicleDetailPage/index.tsx`:
            1. Remove 3 `useState` hooks: `infoDrawerOpen`, `expenseDrawerOpen`, `targetsDrawerOpen`.
            2. Import `useDrawerActions`.
            3. Replace with `openDrawer('vehicleInfo', { vehicleId })`, `openDrawer('vehicleExpense', { vehicleId })`, `openDrawer('vehicleTargets', { vehicleId })`.
            4. Remove inline drawer rendering — DrawerManager handles it.
            5. Verify all 3 drawer types registered in registries. Add missing ones.
         └─ Depends on: T-13 (popupTypes)
         └─ Output:

---

## US-09: Refactor Carrier feature
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] CarrierListPage uses FilterBar (status select + search)
- [ ] CarrierListPage uses ListKpiBar for summary metrics
- [ ] Row height 56px, pagination enabled
- [ ] `isLoading={false}` hardcode fixed — uses `isLoading` selector
- [ ] All raw `<Typography>` replaced with semantic Typography helpers
- [ ] CarrierNoteDrawer reclassified as modal — registration moved to modalRegistry, call sites use `openModal`

**Tasks:**
[ ] T-26 [LIST] Refactor CarrierListPage
         └─ Detail: Read `features/carrier/pages/CarrierListPage/index.tsx`.
            1. Replace inline filter JSX with `<FilterBar>` — config: status select + search.
            2. Replace inline KPI cards with `<ListKpiBar>`.
            3. Set `rowHeight={56}`, `pagination={true}`, `paginationPageSize={25}`.
            4. Fix `isLoading={false}` hardcoded in PageWrapper — replace with `useSelector(selectCarrierLoading('getAll'))` or equivalent loading selector from carrier page slice.
            5. Replace all raw `<Typography>` with Typography helpers.
         └─ Depends on: T-03 (FilterBar), T-06 (ListKpiBar)
         └─ Output:

[ ] T-27 [DETAIL] Refactor CarrierDetailPage + reclassify CarrierNote
         └─ Detail: Read `features/carrier/pages/CarrierDetailPage/index.tsx`.
            1. Replace all raw `<Typography>` with semantic Typography helpers.
            2. Evaluate if sidebar is needed — dispatch terms + COI status are sidebar candidates. If adding, use Grid md={8}/md={4}.
            3. Ensure tab components are in consistent location (`pages/CarrierDetailPage/components/` or `tabs/`).
            4. Reclassify CarrierNoteDrawer as a modal: find all `openDrawer('carrierNote', ...)` call sites and change to `openModal('carrierNote', ...)`. The component was already registered as a modal in T-15.
         └─ Depends on: T-15 (modal registration)
         └─ Output:

---

## US-10: Refactor Customer feature
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] CustomerListPage uses FilterBar (type select + status select + search)
- [ ] CustomerListPage has ListKpiBar (Total Customers, Active, Total Loads, Total Revenue)
- [ ] Cell renderers extracted to `CustomerCellRenderers.tsx`
- [ ] ActionsCell with view action added
- [ ] Row height 56px, pagination enabled
- [ ] Horizontal scrollbar fixed — column widths adjusted
- [ ] CustomerDetailPage summary KPIs extracted to `CustomerSummaryBar` component
- [ ] All raw `<Typography>` replaced with semantic Typography helpers

**Tasks:**
[ ] T-28 [LIST] Refactor CustomerListPage
         └─ Detail: Read `features/customer/pages/CustomerListPage/index.tsx`.
            1. Replace inline filter JSX with `<FilterBar>` — config: type select, status select, search.
            2. Add `<ListKpiBar>` with items: Total Customers, Active, Total Loads, Total Revenue (derive from existing data or selectors).
            3. Extract inline cell renderers to `features/customer/pages/CustomerListPage/components/CustomerCellRenderers.tsx`.
            4. Add `ActionsCell` with view action (navigate to customer detail).
            5. Set `rowHeight={56}`, `pagination={true}`, `paginationPageSize={25}`.
            6. Fix horizontal scrollbar — adjust column `flex` or `width` values so content fits without overflow.
            7. Replace all raw `<Typography>` with Typography helpers.
         └─ Depends on: T-03 (FilterBar), T-06 (ListKpiBar)
         └─ Output:

[ ] T-29 [DETAIL] Refactor CustomerDetailPage
         └─ Detail: Read `features/customer/pages/CustomerDetailPage/index.tsx`.
            1. Extract inline summary KPIs to `features/customer/pages/CustomerDetailPage/components/CustomerSummaryBar.tsx`.
            2. Evaluate sidebar — billing/payment info could be sidebar. If adding, use Grid md={8}/md={4}.
            3. Replace all raw `<Typography>` with semantic Typography helpers.
         └─ Depends on: —
         └─ Output:

---

## US-11: Refactor Place feature
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] PlaceListPage uses FilterBar (facility type select + search)
- [ ] PlaceListPage has ListKpiBar (Total Places, Facility Types breakdown)
- [ ] Row height standardized to 56px
- [ ] Tab content extracted to `OverviewTab.tsx`, `LoadHistoryTab.tsx`, `NotesTab.tsx`
- [ ] Bug fixed: "Avg Wait Time" shows rendered em-dash instead of `\u2014` escape character
- [ ] Sidebar layout standardized to Grid md={8} / md={4}
- [ ] All raw `<Typography>` replaced with semantic Typography helpers

**Tasks:**
[ ] T-30 [LIST] Refactor PlaceListPage
         └─ Detail: Read `features/place/pages/PlaceListPage/index.tsx`.
            1. Replace inline filter JSX with `<FilterBar>` — config: facility type select + search.
            2. Add `<ListKpiBar>` with items: Total Places, facility type breakdown counts.
            3. Set `rowHeight={56}` (pagination already on — verify `paginationPageSize: 25`).
            4. Replace all raw `<Typography>` with Typography helpers.
         └─ Depends on: T-03 (FilterBar), T-06 (ListKpiBar)
         └─ Output:

[ ] T-31 [DETAIL] Refactor PlaceDetailPage
         └─ Detail: Read `features/place/pages/PlaceDetailPage/index.tsx`.
            1. Extract inline tab content to:
               - `features/place/pages/PlaceDetailPage/components/OverviewTab.tsx`
               - `features/place/pages/PlaceDetailPage/components/LoadHistoryTab.tsx`
               - `features/place/pages/PlaceDetailPage/components/NotesTab.tsx`
            2. Fix bug: "Avg Wait Time" shows `\u2014` escape character. Find where this string is rendered and replace with the actual em-dash character `—` or use a proper null/empty display.
            3. Verify sidebar layout is `Grid md={8}` / `md={4}`.
            4. Use `SectionCard` + `DetailRow` for content sections. Verify `SectionTitle` for card titles, `Body`/`BodyMuted` for detail rows.
            5. Replace all raw `<Typography>` with semantic Typography helpers.
         └─ Depends on: —
         └─ Output:

---

## US-12: Refactor Invoices feature
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] InvoiceListPage uses FilterBar (multi-chip status + overdue toggle + missing BOL toggle + search)
- [ ] Cell renderers extracted to `InvoiceCellRenderers.tsx`
- [ ] ActionsCell with view action added
- [ ] Row height standardized to 56px
- [ ] All 3 useState dialog hooks removed — uses `useModalActions`
- [ ] All 3 invoice dialogs registered as modals and opened via hooks
- [ ] Inline dialog rendering removed — ModalManager handles it
- [ ] All raw `<Typography>` replaced with semantic Typography helpers

**Tasks:**
[ ] T-32 [LIST] Refactor InvoiceListPage
         └─ Detail: Read `features/invoices/pages/index.tsx`.
            1. Replace inline filter JSX with `<FilterBar>` — config: multiSelectChip for status (uses chip-style filter already), toggle for overdue, toggle for missing BOL, search.
            2. Extract inline cell renderers to `features/invoices/pages/components/InvoiceCellRenderers.tsx`.
            3. Add `ActionsCell` with view action.
            4. Set `rowHeight={56}` (pagination already on — verify).
            5. Replace all raw `<Typography>` with Typography helpers.
         └─ Depends on: T-03 (FilterBar)
         └─ Output:

[ ] T-33 [DRAWER] Migrate Invoice dialog state to Redux modals
         └─ Detail: In `features/invoices/pages/InvoiceDetailPage.tsx`:
            1. Remove 3 `useState` hooks: `deleteDialogOpen`, `sendDialogOpen`, `markPaidDialogOpen`.
            2. Import `useModalActions` from `features/ui/hooks/useModalActions`.
            3. Replace setState calls with:
               - `openModal('confirmDeleteInvoice', { invoiceId, onConfirm: () => dispatch(deleteInvoiceRequest({ id })) })`
               - `openModal('sendInvoice', { invoiceId })`
               - `openModal('markInvoicePaid', { invoiceId })`
            4. Remove inline dialog rendering — ModalManager handles it.
            5. Verify all 3 modal types registered (done in T-15).
            6. Replace all raw `<Typography>` in InvoiceDetailPage with Typography helpers.
         └─ Depends on: T-15 (modal registration)
         └─ Output:

---

## US-13: Refactor Accounting feature
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] SettlementListPage uses FilterBar (status select + search)
- [ ] SettlementListPage has ListKpiBar
- [ ] ActionsCell added to settlement table
- [ ] Row height 56px on both settlement and expense tables
- [ ] ExpenseListPage uses FilterBar (search + category select + date range)
- [ ] Expense cell renderers extracted to `ExpenseCellRenderers.tsx`
- [ ] ActionsCell with edit/delete added to expense table
- [ ] All useState hooks for dialog/drawer state removed — uses hooks
- [ ] PaySettlementDrawer reclassified as modal
- [ ] DisputeSettlementDrawer, AddAdjustmentDrawer, ExpenseQuickAddDrawer registered as drawers
- [ ] GenerateSettlementDialog registered as modal
- [ ] `settlementActionSagas.ts` split into 4 separate files
- [ ] All raw `<Typography>` replaced with semantic Typography helpers

**Tasks:**
[ ] T-34 [LIST] Refactor SettlementListPage
         └─ Detail: Read the settlement list page (find in `features/accounting/` or `features/settlement/`).
            1. Replace inline filter JSX with `<FilterBar>` — config: status select + search (add search if missing).
            2. Add `<ListKpiBar>` with items: Total Settlements, Pending, Approved, Total Amount.
            3. Add `ActionsCell` with view action.
            4. Set `rowHeight={56}` (pagination likely already on — verify).
            5. Replace all raw `<Typography>` with Typography helpers.
         └─ Depends on: T-03 (FilterBar), T-06 (ListKpiBar)
         └─ Output:

[ ] T-35 [LIST] Refactor ExpenseListPage
         └─ Detail: Read the expense list page (find in `features/accounting/` or `features/expenses/`).
            1. Replace inline filter JSX with `<FilterBar>` — config: search, category select, dateRange.
            2. Extract inline cell renderers to `ExpenseCellRenderers.tsx` in components folder.
            3. Add `ActionsCell` with edit/delete actions.
            4. Set `rowHeight={56}`.
            5. Replace all raw `<Typography>` with Typography helpers.
         └─ Depends on: T-03 (FilterBar)
         └─ Output:

[ ] T-36 [DRAWER] Migrate Accounting drawer/dialog state to Redux
         └─ Detail: In settlement list/detail pages and expense list page:
            1. Remove all `useState` hooks for drawer/dialog open state (`dialogOpen`, `payDrawerOpen`, `disputeDrawerOpen`, etc.).
            2. Import `useDrawerActions` and `useModalActions`.
            3. Replace with hook calls:
               - `openModal('paySettlement', { settlementId })` (reclassified from drawer)
               - `openDrawer('disputeSettlement', { settlementId })`
               - `openDrawer('addAdjustment', { settlementId })`
               - `openDrawer('expenseQuickAdd', {})`
               - `openModal('generateSettlement', { ... })`
            4. Remove inline drawer/dialog rendering — managers handle it.
            5. Verify all registrations done in T-14 and T-15.
         └─ Depends on: T-14, T-15
         └─ Output:

[ ] T-37 [SAGA] Split settlementActionSagas into separate files
         └─ Detail: Find `settlementActionSagas.ts` (in `features/accounting/store/sagas/` or similar).
            Split into 4 files:
            - `approveSettlementSaga.ts`
            - `paySettlementSaga.ts`
            - `disputeSettlementSaga.ts`
            - `addAdjustmentSaga.ts`
            Each file exports a single saga function. Update the watcher file to import from the new locations.
            Delete the original bundled file.
         └─ Depends on: —
         └─ Output:

[ ] T-38 [TYPO] Typography migration for all Accounting pages
         └─ Detail: Replace all remaining raw `<Typography>` in SettlementDetailPage and any other
            accounting pages not covered by T-34/T-35/T-36. Cell renderers use `Amount` for currency,
            `Body` for text, `BodyMuted` for secondary.
         └─ Depends on: T-34, T-35
         └─ Output:

---

## US-14: Refactor Settings feature
_Priority: P2 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] SectionCard used for form cards
- [ ] InviteMemberDialog useState removed — uses `useModalActions`
- [ ] InviteMemberDialog registered and opened via hooks
- [ ] All raw `<Typography>` replaced with semantic Typography helpers
- [ ] `settingsEntitySlice.ts` created for OrgSettings normalized data (P1)
- [ ] `teamEntitySlice.ts` created for TeamMember normalized data (P1)

**Tasks:**
[ ] T-39 [UI] Refactor SettingsPage
         └─ Detail: Read `features/settings/pages/SettingsPage/index.tsx`.
            1. Standardize form card styling to use `SectionCard` (from `components/SectionCard`).
            2. Replace all raw `<Typography>` with Typography helpers. Form labels use `BodyMuted`, section headers use `SectionTitle`.
         └─ Depends on: —
         └─ Output:

[ ] T-40 [DRAWER] Migrate InviteMemberDialog to Redux modal
         └─ Detail: In SettingsPage (or its team tab component):
            1. Remove `useState` for `inviteDialogOpen`.
            2. Import `useModalActions`.
            3. Replace with `openModal('inviteMember', {})`.
            4. Remove inline dialog rendering — ModalManager handles it.
            5. Verify `inviteMember` registered in T-15.
         └─ Depends on: T-15
         └─ Output:

[ ] T-41 [STORE] Create entity slices for Settings
         └─ Detail: 1. Create `features/settings/store/reducers/settingsEntitySlice.ts` using `createEntityModule<OrgSettings>('settings')`.
            2. Create `features/settings/store/reducers/teamEntitySlice.ts` using `createEntityModule<TeamMember>('team')`.
            3. Move entity data out of the settings page slice into these entity slices.
            4. Update selectors to read from entity slices.
            5. Update sagas to dispatch entity actions (setAll, addOne, etc.) instead of page-slice data storage.
            6. Register both in the root reducer under `entities.settings` and `entities.team`.
         └─ Depends on: —
         └─ Output:

---

## US-15: Refactor Dashboard feature
_Priority: P2 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] Dashboard widgets use SectionCard
- [ ] Card sizing and spacing standardized
- [ ] All raw `<Typography>` replaced with semantic Typography helpers
- [ ] Action definitions moved out of watcher into dashboardSlice

**Tasks:**
[ ] T-42 [UI] Refactor DashboardPage
         └─ Detail: Read `features/dashboard/pages/index.tsx`.
            1. Use `SectionCard` for dashboard widgets (Weekly Gross Tracker, Needs Attention, Pending Carriers).
            2. Standardize card sizing and spacing. Consider 2-column layout for widgets to reduce whitespace.
            3. Replace all raw `<Typography>` with Typography helpers. KPI values use `AmountDisplay`, labels use `BodyMuted`, card titles use `SectionTitle`.
         └─ Depends on: —
         └─ Output:

[ ] T-43 [STORE] Normalize Dashboard store
         └─ Detail: Read `features/dashboard/store/reducers/dashboardSlice.ts` and the dashboard watcher.
            1. Move action definitions out of watcher file into `dashboardSlice.ts`.
            2. Ensure all actions are exported from the slice.
            3. Update watcher to import actions from slice.
         └─ Depends on: —
         └─ Output:

---

## US-16: Refactor Dispatch Board
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [ ] Custom LoadTable replaced with NewDataGrid — only page not using AG Grid wrapper
- [ ] Column definitions use standard pattern (useMemo, imported cell renderers)
- [ ] ActionsCell with view action added
- [ ] Row height 56px, pagination enabled
- [ ] Cell renderers extracted to `LoadCellRenderers.tsx`
- [ ] Inline filter bar replaced with FilterBar (search + status select + carrier select)
- [ ] Bug fixed: stops column shows city names instead of "—"
- [ ] Bug fixed: dates show real data instead of placeholder "07/14/1993"
- [ ] All raw `<Typography>` replaced with semantic Typography helpers

**Tasks:**
[ ] T-44 [UI] Migrate LoadTable to NewDataGrid
         └─ Detail: Read `features/load/pages/DispatchBoardPage/` and find the custom `LoadTable` component.
            1. Replace `LoadTable` with `NewDataGrid` (from `mocho/components`).
            2. Define column definitions in the page using `useMemo` — same pattern as all other list pages.
            3. Extract cell renderers to `features/load/pages/DispatchBoardPage/components/LoadCellRenderers.tsx`.
            4. Add `ActionsCell` with view action (navigate to load detail).
            5. Set `rowHeight={56}`, `pagination={true}`, `paginationPageSize={25}`.
            6. Fix bug: stops column shows "—" instead of city names. Check the stops data shape — likely need to render `stop.city` or `stop.location.city` from the pickup/delivery stops.
            7. Fix bug: dates show "07/14/1993" placeholder. Check the date field mapping — likely the column is referencing a wrong field or the data is actually placeholder. Map to correct date fields (pickupDate, deliveryDate from the load/stops).
         └─ Depends on: —
         └─ Output:

[ ] T-45 [UI] Refactor DispatchBoardToolbar filter bar
         └─ Detail: Read the DispatchBoardToolbar or equivalent toolbar component.
            1. Replace inline filter bar with `<FilterBar>` — config: search, status select, carrier select.
            2. Replace all raw `<Typography>` with Typography helpers.
         └─ Depends on: T-03 (FilterBar)
         └─ Output:

[ ] T-46 [TYPO] Typography migration for Dispatch Board
         └─ Detail: Replace all remaining raw `<Typography>` in DispatchBoardPage and related components
            not already covered by T-44 and T-45.
         └─ Depends on: T-44, T-45
         └─ Output:

---

## FIX-01: Consistency fixes — list pages, detail KPI bars, flicker
_Priority: P0 | Services: dispatch-ui | Status: in-progress_

**Tasks:**
[ ] T-48 [FIX] Standardize Driver + Vehicle list page layout to match Carrier
[ ] T-49 [FIX] Fix initial load flicker on all list pages
[ ] T-50 [FIX] Rewrite Vehicle detail KPI bar (horizontal, 4 items, Typography helpers)
[ ] T-51 [FIX] Migrate Carrier detail KPI bar to Typography helpers
[ ] T-52 [FIX] Verify Driver detail KPI bar consistency
[ ] T-53 [FIX] Migrate Load detail summary bar to Typography helpers

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[ ] T-47 [VERIFY] Verify all global acceptance criteria are met
         └─ Detail: Read every refactored file and verify:
            1. All list pages use `FilterBar` — no inline filter JSX remains.
            2. All list pages with KPI metrics use `ListKpiBar`.
            3. All list pages use `NewDataGrid` — no custom table implementations (including LoadTable).
            4. All tables: `rowHeight: 56`, `pagination: true`, `paginationPageSize: 25`.
            5. All tables have `ActionsCell` with at minimum a view action.
            6. All cell renderers extracted to `<Feature>CellRenderers.tsx` — none inline in page files.
            7. All search inputs use `DebouncedInput` — no custom debounce.
            8. All empty states use `EmptyState` — no inline "No X found" text.
            9. All text uses semantic Typography helpers — zero raw `<Typography variant="...">`.
            10. All detail page content sections use `SectionCard`.
            11. All detail page summary KPIs extracted to `<Feature>SummaryBar` components.
            12. All tab content extracted to component files — none inline.
            13. Zero `useState` hooks for drawer/modal open state.
            14. All drawers/modals registered with type-safe entries.
            15. 3 bugs fixed: vehicle carrier UUID, contact customer UUID, place escape char.
            16. CLAUDE.md has all 7 component standard sections.
            17. `npm run lint && npm run check-ts && npm test` passes for dispatch-ui.
         └─ Agent: review
         └─ Depends on: all previous tasks
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 5     | 5    | 0       | 9/9    |
| US-02 | 3     | 3    | 0       | 8/8    |
| US-03 | 2     | 2    | 0       | 5/5    |
| US-04 | 1     | 1    | 0       | 5/5    |
| US-05 | 5     | 5    | 0       | 5/5    |
| US-06 | 3     | 3    | 0       | 14/14  |
| US-07 | 3     | 3    | 0       | 10/10  |
| US-08 | 3     | 3    | 0       | 10/10  |
| US-09 | 2     | 2    | 0       | 6/6    |
| US-10 | 2     | 2    | 0       | 8/8    |
| US-11 | 2     | 2    | 0       | 7/7    |
| US-12 | 2     | 2    | 0       | 8/8    |
| US-13 | 5     | 0    | 0       | 0/13   |
| US-14 | 3     | 0    | 0       | 0/6    |
| US-15 | 2     | 0    | 0       | 0/4    |
| US-16 | 3     | 0    | 0       | 0/9    |
| VER-01| 1     | 0    | 0       | —      |
| **All** | **47** | **33** | **0** | **95/127** |
