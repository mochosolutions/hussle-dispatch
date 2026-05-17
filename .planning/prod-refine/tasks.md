# Production Refinement Tasks
_Last updated: 2026-03-25 14:00_
_Contract: .planning/prod-refine/contract.yaml_
_Shared types: .planning/prod-refine/types.ts_

---

## US-01: Fix mobile appbar — toggle visibility + logo
_Priority: P0 | Services: dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] Toggle button is visible (white icon) on dark appbar background at viewport < 1266px
- [x] App name renders next to toggle on mobile appbar (matching drawer branding)
- [x] Toggle button has no light background color on mobile (inherits appbar styling)

**Tasks:**
[x] T-01 [UI] Fix mobile appbar toggle contrast and add logo
         └─ Detail: Edit `hussle-app-dispatch-ui/src/mocho/components/layout/MainLayout/Header/index.tsx`.
         └─ Agent: frontend
         └─ Depends on: —
         └─ Output:
           Files: hussle-app-dispatch-ui/src/mocho/components/layout/MainLayout/Header/index.tsx (modified)
           Changes: Toggle button uses white color + transparent bg on mobile. "Hussle Dispatch" Typography added next to toggle (matches drawer branding). Desktop unchanged.
           Issues: 1 pre-existing test failure in MainLayout.test.tsx (unrelated to change)

---

## US-02: Handle 403 responses with toast notifications
_Priority: P0 | Services: dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] 403 response with role/permission message shows toast notification with API error text
- [x] 403 response with "Organization is suspended or inactive" clears auth tokens and redirects to `/login`
- [x] User stays on current page after permission-denied toast

**Tasks:**
[x] T-02 [UI] Add 403 handling to Axios interceptor
         └─ Agent: frontend
         └─ Depends on: —
         └─ Output:
           Files: hussle-app-dispatch-ui/src/utils/axios.ts (modified)
           Changes: Added 403 interceptor before 401 logic. Permission errors show toast via enqueueSnackbar. Org-suspended triggers handleAuthFailure(). Added extractErrorMessage helper.
           Issues: None

---

## US-03: LoadTable shows pickup date instead of created date
_Priority: P0 | Services: dispatch-api, dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] LoadTable column shows "Pickup" header with `pickupDate` value
- [x] No "Created" column exists in LoadTable
- [x] `pickupDate` is derived from first stop's `appointmentDate` in API response

**Tasks:**
[x] T-03 [API] Add pickupDate to load list transformer
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:
           Files: hussle-app-dispatch-api/src/loads/controllers/transformers/loadTransformer.ts (modified)
           Changes: Extended getOriginStop to return appointmentDate. Added pickupDate to LoadListItemResponse type and toLoadListItemResponse output.
           Issues: None

[x] T-04 [UI] Replace LoadTable createdAt column with pickupDate
         └─ Agent: frontend
         └─ Depends on: T-03
         └─ Output:
           Files: hussle-app-dispatch-ui/src/features/load/components/LoadTable/index.tsx (modified), hussle-app-dispatch-ui/src/features/load/types.ts (modified)
           Changes: New PickupDateCellRenderer showing date (MMM d, yyyy), time (h:mm a), and days-until label with color coding (Today=warning, Tomorrow=info, past=disabled). Replaced createdAt column with pickupDate. Added pickupDate to LoadListItem type.
           Issues: None

---

## US-04: Carrier KPI displays real metrics
_Priority: P0 | Services: dispatch-api, dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] CarrierKPI displays real `driverCount` from carrier detail response
- [x] `GET /carriers/:id/stats` returns `lifetimeRevenue` and `loadCount`
- [x] CarrierKPI fetches and displays lifetimeRevenue and loadCount (no "—" placeholders)

**Tasks:**
[x] T-05 [API] Create carrier stats endpoint
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:
           Files: src/carriers/repositories/carrierStatsQueryPrisma.ts (created), src/carriers/controllers/carrierController.ts (modified), src/carriers/compositionRoot.ts (modified), src/carriers/routes/carrierRoutes.ts (modified)
           Exports: CarrierStatsResult, CarrierStatsQueryPort, carrierStatsQueryPrisma, getCarrierStats controller
           Issues: None

[x] T-06 [UI] Wire CarrierKPI to real driverCount and stats endpoint
         └─ Agent: frontend
         └─ Depends on: T-05
         └─ Output:
           Files: src/features/carrier/components/CarrierKPI/index.tsx (modified), src/features/carrier/pages/CarrierDetailPage/index.tsx (modified), src/utils/api/fleet/carrierApi.ts (modified)
           Exports: getCarrierStats API fn, CarrierStats type
           Changes: KPI shows real driverCount/vehicleCount, fetches lifetimeRevenue/loadCount from stats endpoint. Revenue formatted as $XK/$XM.
           Issues: None

---

## US-05: Non-CDL driver support
_Priority: P0 | Services: dispatch-api, dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] `DriverLicenseType` enum exists in Prisma schema with `CLASS_D`, `CLASS_M`, `CDL_A`, `CDL_B`, `CDL_C`
- [x] CDL fields renamed to license fields (`licenseNumber`, `licenseState`, `licenseExpiry`) — always visible
- [x] Create/edit driver forms show licenseType selector and endorsements multi-select (CDL types only)
- [x] Endorsements field (`Json?`) added for searchable `["H","N","T"]` tracking

**Tasks:**
[x] T-07 [DB] Add DriverLicenseType enum, rename CDL fields, add endorsements
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:
           Files: prisma/schema.prisma, migration SQL, driverTypes.ts, driverValidators.ts, driverService.ts, driverService.test.ts, seed.ts (all modified)
           Exports: DriverLicenseType enum (CLASS_D, CLASS_M, CDL_A, CDL_B, CDL_C), endorsements Json field
           Changes: Renamed cdlNumber→licenseNumber, cdlState→licenseState, cdlExpiry→licenseExpiry. Default CLASS_D. Added endorsements JSONB field.
           Issues: None

[x] T-08 [UI] Add licenseType selector, rename CDL fields, add endorsements
         └─ Agent: frontend
         └─ Depends on: T-07
         └─ Output:
           Files: 17 files modified across types, validators, forms, display, selectors, sagas, mock data
           Exports: DriverLicenseType, EndorsementCode, DRIVER_LICENSE_TYPE_OPTIONS (with shortLabel), ENDORSEMENT_OPTIONS
           Changes: License type dropdown (5 options), endorsements Autocomplete multi-select with chips (CDL types only), all field renames applied, detail/list display shows "CDL-A · TX-CDL-8831" format
           Issues: None — zero stale cdl references remain

---

## US-06: Skeleton loading states on key pages
_Priority: P0 | Services: dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] DispatchBoard, Carrier List, Driver List, Vehicle List show skeleton loaders during data fetch
- [x] No full-screen `PageLoader` spinner on these pages

**Tasks:**
[x] T-09 [UI] Replace full-screen spinners with skeleton loaders on list pages
         └─ Agent: frontend
         └─ Depends on: —
         └─ Output:
           Files: DispatchBoardPage, CarrierListPage, DriverListPage, VehicleListPage (all modified)
           Changes: Added `loadingComponent={<ListSkeleton rows={8} />}` to PageWrapper on all 4 pages. Carrier/Driver/Vehicle pages were passing isLoading={false} — now wired to actual loading selectors.
           Issues: None

---

## US-07: Save unsaved contact after load creation
_Priority: P0 | Services: dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] After successful load creation with a new (non-autocomplete) contact, contacts are auto-saved
- [x] Saved contacts are linked to the load's customer
- [x] Info toast shows count of saved contacts

**Tasks:**
[x] T-10 [UI] Auto-save new contacts after load creation
         └─ Agent: frontend
         └─ Depends on: —
         └─ Output:
           Files: hussle-app-dispatch-ui/src/features/load/store/sagas/createLoadSaga.ts (modified)
           Changes: After load creation, detects stops with contactName but no contactId, deduplicates by name, splits into firstName/lastName, calls createContact with customerId. Shows info toast "X new contact(s) saved". Failures silently skipped.
           Issues: None

---

## US-08: Drawer theme + component consolidation
_Priority: P0 | Services: dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] MUI theme palette includes a `drawer` entry with configurable colors
- [x] EditDrawer uses theme token instead of hardcoded `primary.dark`
- [x] `EditDrawer`, `FieldRow`, `EditableSectionHeader` exist in `src/components/` (not in carrier feature)
- [x] No duplicate `EditDrawer` exists
- [x] All imports across carrier, vehicle, driver features point to `src/components/`

**Tasks:**
[x] T-11 [UI] Add drawer palette entry to MUI theme
         └─ Detail: Edit `hussle-app-dispatch-ui/src/mocho/theme/palette.ts` (or the theme index file).
            Add a `drawer` entry to the theme palette:
            ```
            drawer: {
              headerBg: '#002159',    // primary.dark
              headerText: '#ffffff',  // common.white
            }
            ```
            Also extend the MUI Palette type declaration (in theme types or a `d.ts` file) so TypeScript recognizes `theme.palette.drawer`.
            Then update `src/components/EditDrawer/index.tsx` to use `theme.palette.drawer.headerBg` instead of `'primary.dark'`.
         └─ Agent: frontend
         └─ Depends on: —
         └─ Output:

[x] T-12 [UI] Consolidate shared components from carrier feature
         └─ Agent: frontend
         └─ Depends on: T-11
         └─ Output:
           Files: Moved FieldRow + EditableSectionHeader to src/components/. Deleted carrier EditDrawer duplicate. Updated 4 import sites (GeneralTab, DriverOverviewTab, DriverPreferencesTab, VehicleOverviewTab).
           Issues: None — zero stale carrier path references remain

---

## US-09: Entity stats endpoints (contact, customer, place)
_Priority: P0 | Services: dispatch-api, dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] `GET /contacts/:id/stats` returns `{ loadCount, recentLoads[] }`
- [x] `GET /customers/:id/stats` returns `{ totalRevenue, avgDaysToPay, outstandingAR, loadCount }`
- [x] `GET /places/:id/stats` returns `{ visitCount, lastVisitDate }`
- [x] Contact detail page displays load count and recent loads from stats endpoint
- [x] Customer detail page displays all four metrics from stats endpoint
- [x] Place detail page displays visit count and last visit date from stats endpoint

**Tasks:**
[x] T-13 [API] Create contact stats endpoint
         └─ Detail: Create `GET /api/v1/contacts/:id/stats`.
            Files:
            - `src/contacts/repositories/contactStatsQueryPrisma.ts` — query port:
              1. `prisma.load.count({ where: { contactId: id, organizationId, deletedAt: null } })` for loadCount
              2. `prisma.load.findMany({ where: { contactId: id, organizationId, deletedAt: null }, take: 5, orderBy: { createdAt: 'desc' }, select: { id, loadNumber, status, stops: { where: { type: 'PICKUP' }, take: 1, orderBy: { sequence: 'asc' }, select: { appointmentDate } } } })` for recentLoads
              Transform recentLoads to include `pickupDate` from first stop.
            - `src/contacts/controllers/contactStatsController.ts` — controller
            - Add route to `src/contacts/routes/contactRoutes.ts`: `router.get('/:id/stats', requireAuth, validateRequest(idParamSchema), controllers.getContactStats)`
            - Wire in `src/contacts/compositionRoot.ts` (or equivalent — contacts may use inline wiring)
            Auth: requireAuth only. Contract ref: ContactStats in contract.yaml.
            Return: `sendSingle(res, { loadCount, recentLoads })`
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-14 [API] Create customer stats endpoint
         └─ Detail: Create `GET /api/v1/customers/:id/stats`.
            Files:
            - `src/customers/repositories/customerStatsQueryPrisma.ts` — query port:
              1. `prisma.load.count(...)` for loadCount (by customerId)
              2. `prisma.load.aggregate({ _sum: { customerRate } })` for totalRevenue
              3. `prisma.invoice.aggregate({ where: { customerId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } }, _sum: { totalAmount } })` for outstandingAR
              4. For avgDaysToPay: `prisma.invoice.findMany({ where: { customerId, status: 'PAID', paidAt: { not: null }, sentAt: { not: null } }, select: { sentAt, paidAt } })` then compute AVG(paidAt - sentAt) in days
            - Controller, mapper, route (same pattern as T-13)
            Auth: requireAuth only. Contract ref: CustomerStats in contract.yaml.
            Return: `sendSingle(res, { totalRevenue: sum.toFixed(2), avgDaysToPay, outstandingAR: arSum.toFixed(2), loadCount })`
            Note: avgDaysToPay is `number | null` — null when no paid invoices exist.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-15 [API] Create place stats endpoint
         └─ Detail: Create `GET /api/v1/places/:id/stats`.
            Files:
            - `src/places/repositories/placeStatsQueryPrisma.ts` — query port:
              1. `prisma.stop.count({ where: { placeId: id } })` for visitCount (stops at this facility)
              2. `prisma.stop.aggregate({ where: { placeId: id }, _max: { appointmentDate: true } })` for lastVisitDate
            - Controller, mapper, route (same pattern)
            Auth: requireAuth only. Contract ref: PlaceStats in contract.yaml.
            Return: `sendSingle(res, { visitCount, lastVisitDate: max?.toISOString() ?? null })`
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-16 [UI] Wire contact detail page to stats endpoint
         └─ Detail: Edit `hussle-app-dispatch-ui/src/features/contact/pages/ContactDetailPage/`.
            1. Add `getContactStats` to `utils/api/fleet/contactApi.ts`: `export const getContactStats = (id: string) => axios.get(`/contacts/${id}/stats`).then(r => r.data.data);`
            2. In ContactDetailPage, fetch stats on mount (useEffect + local state or add to existing saga)
            3. Display `loadCount` in a KPI/stat card
            4. Display `recentLoads` as a small table or list (loadNumber, status, pickupDate)
            Contract ref: types.ts ContactStats, ContactRecentLoad
         └─ Agent: frontend
         └─ Depends on: T-13
         └─ Output:

[x] T-17 [UI] Wire customer detail page to stats endpoint
         └─ Detail: Edit `hussle-app-dispatch-ui/src/features/customer/pages/CustomerDetailPage/`.
            1. Add `getCustomerStats` to `utils/api/fleet/customerApi.ts`
            2. Fetch stats on mount
            3. Display four KPI cards: totalRevenue (format as currency), avgDaysToPay (format as "X days"), outstandingAR (format as currency), loadCount
            Use `SummaryBar` or `SectionCard` from shared components for layout.
            Contract ref: types.ts CustomerStats
         └─ Agent: frontend
         └─ Depends on: T-14
         └─ Output:

[x] T-18 [UI] Wire place detail page to stats endpoint
         └─ Detail: Edit `hussle-app-dispatch-ui/src/features/place/pages/PlaceDetailPage/`.
            1. Add `getPlaceStats` to `utils/api/places/placeApi.ts`
            2. Fetch stats on mount
            3. Display `visitCount` and `lastVisitDate` (format as relative date or absolute) in detail header or KPI section
            Contract ref: types.ts PlaceStats
         └─ Agent: frontend
         └─ Depends on: T-15
         └─ Output:

---

## US-10: Invoice detail expanded includes
_Priority: P0 | Services: dispatch-api, dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] Invoice detail response includes load stop data (origin/destination city, state, appointment dates)
- [x] Invoice detail response includes carrier mcNumber and phone
- [x] Invoice detail UI renders stop and carrier information

**Tasks:**
[x] T-19 [API] Expand invoice detail Prisma includes
         └─ Detail: Edit `hussle-app-dispatch-api/src/invoices/`.
            1. In the invoice repository (find INVOICE_DETAIL_INCLUDE or equivalent), expand the `load` include to add:
               ```
               stops: { orderBy: { sequence: 'asc' }, select: { id, type, sequence, facilityName, city, state, appointmentDate } }
               ```
            2. Expand the `carrier` include to add: `mcNumber, phone` (check if carrier include already exists — may need to select additional fields)
            3. Update the invoice detail transformer to include `load.stops` array and `carrier.mcNumber`, `carrier.phone` in the response
            Contract ref: InvoiceDetailModification, InvoiceLoadStop in contract.yaml
            Note: The PDF builder (`invoicePdfDataBuilder`) already fetches stops and carrier details via `InvoiceLoadQueryPort.findLoadWithStops` — check that code for the exact include pattern to reuse.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output:

[x] T-20 [UI] Display route and carrier info on invoice detail page
         └─ Detail: Edit `hussle-app-dispatch-ui/src/features/invoices/pages/InvoiceDetailPage.tsx`.
            1. The invoice detail response will now include `load.stops[]` and `carrier.mcNumber`, `carrier.phone`
            2. Display route info: origin city/state → destination city/state (derived from first PICKUP and last DELIVERY stop)
            3. Display carrier contact: mcNumber and phone alongside existing carrier name
            4. Update the Invoice type in frontend to include the new nested fields
            Contract ref: types.ts InvoiceLoadStop, InvoiceExpandedCarrier
         └─ Agent: frontend
         └─ Depends on: T-19
         └─ Output:

---

## INT-01: Wire dispatch-api ↔ dispatch-ui integration
_Auto-generated | Services: dispatch-api, dispatch-ui_

**Verification Checklist:**
- [x] Frontend API client calls correct endpoint paths (from contract)
- [x] Request/response shapes match types.ts
- [x] Decimal values handled correctly (string in API, displayed as currency in UI)
- [x] Auth: all stats endpoints use requireAuth only (no role restriction)
- [x] Error handling: 404 for missing entities, 401 for unauthenticated (fixed — all 4 stats now verify entity exists)
- [x] Data flow: every step in x-data-flow is connected
- [x] Org scoping: place stats + customer invoice queries now scoped (fixed)

**Tasks:**
[x] T-21 [WIRE] Verify all stats endpoints match contract
         └─ Detail: Read contract.yaml, types.ts, and the actual implementation files.
            For each new endpoint (carrier stats, contact stats, customer stats, place stats):
            1. Verify endpoint path matches contract (`/api/v1/{entity}/{id}/stats`)
            2. Verify response shape matches types.ts interface
            3. Verify frontend API client function calls correct path
            4. Verify decimal fields returned as strings (lifetimeRevenue, totalRevenue, outstandingAR)
            5. Verify auth middleware chain: `requireAuth` only, no `requireRole`
            For modified endpoints (load list pickupDate, invoice detail):
            6. Verify pickupDate field exists in load list response
            7. Verify invoice detail includes stops and carrier mcNumber/phone
            Report any mismatches.
         └─ Agent: review
         └─ Depends on: T-03, T-04, T-05, T-06, T-13, T-14, T-15, T-16, T-17, T-18, T-19, T-20
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-22 [VERIFY] Trace complete feature flows and verify all AC
         └─ Detail: For each flow in contract x-data-flow, trace every step from trigger through API through DB and back to UI response.
            Flows to trace:
            1. View Carrier KPI Stats — carrier detail + stats fetch + KPI render
            2. View Contact Stats — contact detail + stats fetch + display
            3. View Customer Financial Stats — customer detail + stats fetch + KPI cards
            4. View Place Visit Stats — place detail + stats fetch + display
            5. View Load Dispatch Board — load list with pickupDate + LoadTable column
            6. View Invoice Detail — expanded includes + route/carrier display
            Also verify non-API stories:
            7. Mobile appbar — toggle visibility + logo (code review)
            8. 403 handling — interceptor logic (code review)
            9. Skeleton loaders — pages use skeletons not spinners (code review)
            10. Drawer theme + component consolidation (code review)
            11. Non-CDL driver — schema + forms (code review)
            12. Save contact after load creation — prompt flow (code review)
            Check every AC from every US story is satisfied.
         └─ Agent: review
         └─ Depends on: T-21
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 1     | 0    | 0       | 0/3    |
| US-02 | 1     | 0    | 0       | 0/3    |
| US-03 | 2     | 0    | 0       | 0/3    |
| US-04 | 2     | 0    | 0       | 0/3    |
| US-05 | 2     | 0    | 0       | 0/4    |
| US-06 | 1     | 0    | 0       | 0/2    |
| US-07 | 1     | 0    | 0       | 0/3    |
| US-08 | 2     | 0    | 0       | 0/5    |
| US-09 | 6     | 0    | 0       | 0/6    |
| US-10 | 2     | 0    | 0       | 0/3    |
| INT-01| 1     | 0    | 0       | —      |
| VER-01| 1     | 0    | 0       | —      |
| **All** | **22** | **0** | **0** | **0/35** |
