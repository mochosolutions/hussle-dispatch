# Financial Model — Phase 9: UI Updates Tasks
_Last updated: 2026-04-05 19:30_
_Plan: .planning/financial-model-ui/plan.md_

---

## US-01: Field Renames & Type Updates
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

Rename financial fields across all UI types, API types, constants, and validators. This is the foundation — all subsequent stories depend on it.

**Acceptance Criteria:**
- [ ] `carrierRate` renamed to `carrierPayout` in all UI types (LoadDetail, LoadListItem, CreateLoadInput, UpdateLoadInput)
- [ ] `dispatchFee` renamed to `companyMargin` in all UI types
- [ ] `partnerSplit` removed from all UI types
- [ ] `companyNet`, `driverPay`, `dispatcherComm`, `estimatedNetEarnings`, `marginPercent` added to LoadDetail type
- [ ] `companyMargin`, `companyNet` added to LoadListItem type
- [ ] `FUEL_PPG` and `COMPANY_DRIVER_MPG` constants removed from `constants.ts`
- [ ] Load API types updated (loadApi.ts response types)
- [ ] Dashboard API types updated (dashboardApi.ts KPI field names)
- [ ] Load form schema updated (loadSchema.ts)

**Tasks:**
[x] T-01 [TYPES] Rename financial fields in load types, API types, constants, validators, and dashboard types
         └─ Detail: Update these files:
            - `src/features/load/types.ts`: In LoadDetail rename carrierRate→carrierPayout, dispatchFee→companyMargin, remove partnerSplit, add companyNet/driverPay/dispatcherComm/estimatedNetEarnings/marginPercent (all string). In LoadListItem rename carrierRate→carrierPayout, add companyMargin/companyNet. In CreateLoadInput/UpdateLoadInput rename carrierRate→carrierPayout, dispatchFee→companyMargin, remove partnerSplit.
            - `src/utils/api/loads/loadApi.ts`: Update any response type interfaces to match new field names.
            - `src/features/load/constants.ts`: Remove FUEL_PPG and COMPANY_DRIVER_MPG constants. Keep MARGIN_THRESHOLDS, MARKET_RPM, MIN_BOOK.
            - `src/features/load/validators/loadSchema.ts`: Rename carrierRate→carrierPayout, dispatchFee→companyMargin, remove partnerSplit validation.
            - `src/utils/api/dashboard/dashboardApi.ts`: Rename dispatchFeesThisMonth→companyMarginThisMonth, remove partnerSplitThisMonth in DashboardKpis type.
            After renaming types, do a project-wide search for remaining references to the old field names (carrierRate, dispatchFee, partnerSplit, FUEL_PPG, COMPANY_DRIVER_MPG) and update them. There will be many — load table columns, form fields, transformers, etc.
         └─ Depends on: —
         └─ Output:

---

## US-02: Update Existing Load Components
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

Update all existing load-related components to use the new field names and API-computed values.

**Acceptance Criteria:**
- [ ] FinancialsCard shows carrierPayout, companyMargin, driverPay, dispatcherComm, companyNet, estimatedNetEarnings, marginPercent
- [ ] DriverEconomicsSection uses API-computed driverPay, not client-side calculation
- [ ] LoadRateDrawer uses new field names (carrierPayout, companyMargin)
- [ ] Load list table shows carrierPayout, companyMargin, companyNet columns
- [ ] LoadSummaryBar updated with financial metrics
- [ ] CreateLoadForm sections use new field names
- [ ] Dashboard KPIs use new field names

**Tasks:**
[x] T-02 [UI] Update FinancialsCard, DriverEconomicsSection, LoadRateDrawer, LoadSummaryBar, CreateLoadForm, load table columns, and dashboard
         └─ Detail: Update these components:
            1. `src/features/load/components/FinancialsCard/index.tsx`: Replace current display (customerRate, dispatchFee, partnerSplit, companyShare=computed) with new fields from API: carrierPayout, companyMargin, driverPay, dispatcherComm, companyNet (from API not computed), estimatedNetEarnings, marginPercent. Remove client-side companyShare calculation.
            2. `src/features/load/components/CreateLoadForm/sections/DriverEconomicsSection/index.tsx`: Remove all client-side driver pay calculations (Carrier Pay, RPM, Fuel Cost, Net, CPM, Earnings, Take-Home). Replace with display of API-computed driverPay value. Remove references to FUEL_PPG and COMPANY_DRIVER_MPG.
            3. `src/features/load/components/LoadRateDrawer/index.tsx`: Rename carrierRate field→carrierPayout, dispatchFee field→companyMargin. Remove partnerSplit field.
            4. `src/features/load/components/LoadSummaryBar/index.tsx` (and Columns.tsx if exists): Add financial summary metrics if not present.
            5. `src/features/load/components/CreateLoadForm/sections/LoadDetailsSection/index.tsx` and `NotesSection/index.tsx`: Update any financial field references.
            6. Load table columns (in DispatchBoardPage or LoadTable): Rename carrierRate column→carrierPayout, add companyMargin and companyNet columns.
            7. `src/features/dashboard/pages/index.tsx`: Update KPI display to use companyMarginThisMonth instead of dispatchFeesThisMonth, remove partnerSplitThisMonth.
            8. Any load saga/selector/reducer referencing old field names.
            Search project-wide for any remaining old field name references and fix them.
         └─ Depends on: T-01
         └─ Output:

---

## US-03: Accounting Types, API Clients & Navigation
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

Create the foundation for Part B: types, API clients, routes, sidebar nav, and Redux store for settlements.

**Acceptance Criteria:**
- [ ] Settlement, IFTA, and expense types defined
- [ ] API clients created for settlements, IFTA, and expenses
- [ ] Accounting routes configured with PersistLogin/AuthGuard/AppLayout wrapper
- [ ] "Accounting" collapse section in sidebar with Settlements, IFTA, Expenses items
- [ ] Settlement Redux store (entity slice + page slice + saga watcher) registered

**Tasks:**
[x] T-03 [TYPES] Create accounting types, API clients, routes, sidebar nav, and settlement Redux store
         └─ Detail: Create these files:
            1. `src/features/accounting/types.ts`:
               - SettlementListItem { id, settlementNumber, status, periodStart, periodEnd, grossRevenue, netEarnings, carrierName, driverName, totalMiles }
               - SettlementDetail { ...all fields + lineItems: SettlementLineItem[], carrier, driver, vehicle }
               - SettlementLineItem { id, type, description, loadNumber?, amount, date }
               - GenerateSettlementInput { carrierId, driverId?, vehicleId?, periodStart, periodEnd }
               - PaySettlementInput { paymentMethod, paymentReference? }
               - DisputeSettlementInput { disputeReason }
               - CreateAdjustmentInput { description, amount, date }
               - IftaReportResponse { year, quarter, periodStart, periodEnd, vehicles: IftaVehicleEntry[], fleetTotals }
               - IftaVehicleEntry { vehicleId, unitNumber, states: IftaStateEntry[], totals }
               - IftaStateEntry { state, milesDriven, fuelGallons, fuelCost }
               - ExpenseListItem { id, category, description, amount, date, vehicleUnitNumber, state?, gallons? }
               - CreateExpenseInput { category, amount, date, vehicleId, description?, gallons?, state?, pricePerGallon?, fuelType? }
            2. `src/utils/api/accounting/settlementApi.ts`: getSettlements, getSettlement, generateSettlement, approveSettlement, paySettlement, disputeSettlement, addAdjustment — follow loadApi.ts pattern with axiosInstance.
            3. `src/utils/api/accounting/iftaApi.ts`: getIftaReport(params) — single GET.
            4. `src/utils/api/accounting/expenseApi.ts`: getExpenses(params), createExpense(input).
            5. `src/features/accounting/routes/accountingRoutes.tsx`: Route config matching loadRoutes.tsx pattern — PersistLogin > AuthGuard > AppLayout wrapper, path '/accounting', children: index→Navigate to settlements, 'settlements'→SettlementListPage, 'settlements/:id'→SettlementDetailPage, 'ifta'→IftaReportPage, 'expenses'→ExpenseListPage. Use Loadable(lazy(import(...))).
            6. `src/routes/index.tsx`: Import and add AccountingRoutes to children array.
            7. `src/components/AppLayout/menuItem.tsx`: Add 'accounting' collapse section with Calculator icon (from lucide-react), children: Settlements (/accounting/settlements), IFTA (/accounting/ifta), Expenses (/accounting/expenses).
            8. Settlement Redux store:
               - `src/features/accounting/store/reducers/settlementEntitySlice.ts`: createEntityModule<SettlementListItem>('settlements')
               - `src/features/accounting/store/reducers/settlementPageSlice.ts`: createCrudSlice + status/carrier filters
               - `src/features/accounting/store/reducers/index.ts`: combine reducers
               - `src/features/accounting/store/sagas/settlementSagaWatcher.ts`: takeLatest for fetch, generate, approve, pay, dispute
               - `src/features/accounting/store/sagas/fetchSettlementsSaga.ts`
               - `src/features/accounting/store/sagas/fetchSettlementDetailSaga.ts`
               - `src/features/accounting/store/sagas/generateSettlementSaga.ts`
               - `src/features/accounting/store/sagas/settlementActionSagas.ts` (approve, pay, dispute — shared pattern)
               - `src/features/accounting/store/selectors/settlementSelectors.ts`
               - Register in `src/store/reducers/index.ts` (entities.settlements + pages.settlements)
               - Register saga in `src/store/sagas/rootSaga.ts`
         └─ Depends on: —
         └─ Output:

---

## US-04: Settlement List & Detail Pages
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

Build the settlement list page with generate dialog and the settlement detail page with action drawers.

**Acceptance Criteria:**
- [ ] Settlement list page at `/accounting/settlements` with status filter, carrier filter, pagination
- [ ] Settlement detail page shows header (number + status), totals card, line items table
- [ ] Generate settlement dialog creates DRAFT via API and navigates to detail
- [ ] Approve, Pay, Dispute actions work on settlement detail page
- [ ] Add adjustment form on settlement detail page
- [ ] StatusBadge supports SETTLEMENT_STATUS colors (DRAFT, APPROVED, PAID, DISPUTED)

**Tasks:**
[x] T-04 [UI] Build SettlementListPage with GenerateSettlementDialog
         └─ Detail: Create `src/features/accounting/pages/SettlementListPage/index.tsx`:
            - Use ListLayout with title "Settlements", primaryAction = "Generate Settlement" button
            - Toolbar: StatusFilter (Select: DRAFT, APPROVED, PAID, DISPUTED), CarrierFilter (CarrierAutocomplete)
            - Content: MainCard(content=false) > NewDataGrid with columns: settlementNumber (pinned left), status (StatusCell), carrierName, driverName, periodStart (dateFormat), periodEnd (dateFormat), grossRevenue (currencyFormat), netEarnings (currencyFormat)
            - onRowClicked → navigate('/accounting/settlements/:id')
            - Pagination: true, pageSize: 25
            - Dispatch fetchSettlementsRequest on mount with filters
            Create `src/features/accounting/components/GenerateSettlementDialog/index.tsx`:
            - Dialog with form: carrierId (CarrierAutocomplete required), driverId (optional), vehicleId (optional), periodStart (DatePicker), periodEnd (DatePicker)
            - onSubmit: dispatch generateSettlementRequest → on success navigate to detail
            - Error handling: show snackbar on API error
            Add SETTLEMENT_STATUS colors to StatusBadge config (src/components/Statusbadge/index.tsx): DRAFT=blue, APPROVED=green, PAID=purple, DISPUTED=red.
         └─ Depends on: T-03
         └─ Output:

[x] T-05 [UI] Build SettlementDetailPage with tabs and action drawers
         └─ Detail: Create `src/features/accounting/pages/SettlementDetailPage/index.tsx`:
            - Use DetailLayout with: id=settlementNumber, status=settlement.status (StatusBadge), breadcrumb={label:'Settlements', href:'/accounting/settlements'}
            - Actions: DRAFT→Approve button, APPROVED→Mark Paid button, non-PAID→Dispute button
            - Summary bar: carrier name, driver name, period range, total miles
            - Tabs: Overview, Line Items
            Create `src/features/accounting/pages/SettlementDetailPage/tabs/OverviewTab.tsx`:
            - Grid 2 columns: TotalsCard (MainCard) with grossRevenue, dispatchFeeTotal, expensesTotal, adjustments sum, netEarnings (bold). InfoCard (MainCard) with settlement number, status, created date, payment method/reference (if paid), dispute reason (if disputed).
            Create `src/features/accounting/pages/SettlementDetailPage/tabs/LineItemsTab.tsx`:
            - MainCard(content=false) with "Add Adjustment" button, NewDataGrid: type (chip by type), description (flex:2), loadNumber, amount (currencyFormat), date (dateFormat).
            Create action drawers:
            - `src/features/accounting/components/PaySettlementDrawer/index.tsx`: EditDrawer with paymentMethod (Select: CHECK, ACH, WIRE, OTHER), paymentReference (TextField optional). onSubmit: dispatch paySettlementRequest.
            - `src/features/accounting/components/DisputeSettlementDrawer/index.tsx`: EditDrawer with disputeReason (TextField multiline required). onSubmit: dispatch disputeSettlementRequest.
            - `src/features/accounting/components/AddAdjustmentDrawer/index.tsx`: EditDrawer with description (TextField), amount (number), date (DatePicker). onSubmit: call addAdjustment API → refresh detail.
            Create `src/features/accounting/components/SettlementTotalsCard/index.tsx`: Reusable card showing grossRevenue, dispatchFeeTotal, expensesTotal, adjustments, netEarnings.
            Dispatch fetchSettlementDetailRequest on mount using :id param.
         └─ Depends on: T-03, T-04
         └─ Output:

---

## US-05: IFTA Report Page
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

Build the IFTA quarterly report page.

**Acceptance Criteria:**
- [ ] IFTA report page at `/accounting/ifta` with quarter/year selector
- [ ] Vehicle filter dropdown (single vehicle or all)
- [ ] State-by-state table with miles, gallons, cost
- [ ] Per-vehicle and fleet-wide totals displayed
- [ ] Empty state shown when no data

**Tasks:**
[x] T-06 [UI] Build IftaReportPage with quarter selector, vehicle filter, state table, and totals
         └─ Detail: Create `src/features/accounting/pages/IftaReportPage/index.tsx`:
            - Use ListLayout with title "IFTA Report", no primaryAction
            - Toolbar: QuarterSelector (Select: Q1/Q2/Q3/Q4, default current quarter), YearSelector (Select: years, default current year), VehicleFilter (VehicleAutocomplete, optional, placeholder "All Vehicles")
            - Use local state (useState + useEffect) — NOT Redux. Fetch on mount and on filter change.
            - Call getIftaReport({ year, quarter, vehicleId }) from iftaApi.ts
            - Content: MainCard(content=false) > NewDataGrid (client-side, no server pagination):
              columns: state (width:80), milesDriven (numberFormat), fuelGallons (decimalFormat), fuelCost (currencyFormat)
              pinnedBottomRowData: totals row (bold) — totalMiles, totalGallons, totalFuelCost
            - If fleet-wide (no vehicleId): show per-vehicle summary cards below the grid.
              Each card: unitNumber, totalMiles, totalGallons, totalFuelCost, averageMpg
            - Empty state: "No IFTA data for Q{quarter} {year}" with subtext "State mileage is calculated automatically when loads have stops with coordinates."
            - Loading state: skeleton or spinner while API call in flight
         └─ Depends on: T-03
         └─ Output:

---

## US-06: Expense List & Quick Add
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

Build the expense list page and quick-add drawer.

**Acceptance Criteria:**
- [ ] Expense list page at `/accounting/expenses` with category and date filters
- [ ] Expense quick-add drawer with category, amount, date, vehicle
- [ ] Fuel category expands to show gallons, state, price-per-gallon
- [ ] List refreshes after adding expense

**Tasks:**
[x] T-07 [UI] Build ExpenseListPage with filters and ExpenseQuickAddDrawer
         └─ Detail: Create `src/features/accounting/pages/ExpenseListPage/index.tsx`:
            - Use ListLayout with title "Expenses", primaryAction = "Add Expense" button
            - Toolbar: SearchInput (by description), CategoryFilter (Select: FUEL, MAINTENANCE, TOLLS, PARKING, MEALS, INSURANCE, etc.), VehicleFilter (VehicleAutocomplete), DateRange (two DatePickers for start/end)
            - Use local state + useEffect for data fetching (not Redux). Call getExpenses(params) from expenseApi.ts.
            - Content: MainCard(content=false) > NewDataGrid:
              columns: date (dateFormat, sort desc), category (chip), description (flex:2), amount (currencyFormat), vehicleUnitNumber, state (width:80), gallons
              pagination: true, pageSize: 25
            Create `src/features/accounting/components/ExpenseQuickAddDrawer/index.tsx`:
            - EditDrawer with Formik form:
              Fields: category (Select, required), amount (TextField number, required), date (DatePicker, default today, required), vehicleId (VehicleAutocomplete, required), description (TextField)
              Conditional (category === 'FUEL'): gallons (TextField number), state (Select: US state codes), pricePerGallon (TextField number, auto-calc: amount/gallons), fuelType (Select: DIESEL, DEF)
            - Yup validation schema
            - onSubmit: call createExpense API → close drawer → trigger list refresh via state setter
            - Error: snackbar on failure
         └─ Depends on: T-03
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Agent: review | Read-only_

**Tasks:**
[x] T-08 [VERIFY] Verify all pages render, routes work, field renames complete, build succeeds
         └─ Detail: Read-only verification:
            (1) Search for ANY remaining references to old field names (carrierRate, dispatchFee, partnerSplit, FUEL_PPG, COMPANY_DRIVER_MPG) in dispatch-ui src/ — should find zero.
            (2) Verify accounting routes registered in src/routes/index.tsx.
            (3) Verify sidebar menuItem.tsx has Accounting section.
            (4) Verify settlement Redux store registered in root reducer and root saga.
            (5) Verify all 4 accounting pages import and use correct layout components (ListLayout, DetailLayout).
            (6) Verify API clients call correct endpoints matching backend routes.
            (7) Run `cd hussle-app-dispatch-ui && npx tsc --noEmit` to verify no type errors.
            (8) Run `cd hussle-app-dispatch-ui && npx vite build` to verify build succeeds.
         └─ Depends on: T-01 through T-07
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 1     | 1    | 0       | 9/9    |
| US-02 | 1     | 1    | 0       | 7/7    |
| US-03 | 1     | 1    | 0       | 5/5    |
| US-04 | 2     | 2    | 0       | 6/6    |
| US-05 | 1     | 1    | 0       | 5/5    |
| US-06 | 1     | 1    | 0       | 4/4    |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **8** | **0** | **0** | **0/36** |
