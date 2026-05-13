# Trip Miles Tasks
_Last updated: 2026-04-06 12:45_

---

## US-01: Schema changes + dual RPM financial calculations
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Prisma schema has `currentLatitude Decimal(9,6)?` and `currentLongitude Decimal(9,6)?` on Driver model
- [x] Prisma schema has `ratePerTotalMile Decimal(6,2)?` on Load model
- [x] Prisma schema has `totalTripMiles Int` on Settlement model
- [x] `calculateLoadFinancials` returns both `ratePerMile` (trip) and `ratePerTotalMile` (total)
- [x] Load create/update ignores client-submitted `totalMiles`; always computes server-side as `loadedMiles + (deadheadMiles ?? 0)`
- [x] Load API responses include both `ratePerMile` and `ratePerTotalMile`
- [x] Existing financials tests updated to cover both RPM outputs
- [x] `npm run validate` passes in dispatch-api (820/820 tests pass, typecheck clean)

**Tasks:**
[x] T-01 [DB] Prisma migration — add Driver lat/lng, Load ratePerTotalMile, Settlement totalTripMiles
         └─ Detail: In `hussle-app-dispatch-api/prisma/schema.prisma`:
            - Driver model (line ~604): add `currentLatitude Decimal @db.Decimal(9,6)?` and `currentLongitude Decimal @db.Decimal(9,6)?` after `currentState` (line 618)
            - Load model (line ~701): add `ratePerTotalMile Decimal? @db.Decimal(6,2)` after `ratePerMile` (line 725)
            - Settlement model (line ~1270): add `totalTripMiles Int` alongside existing `totalMiles Int` (line 1280)
            Run `npx prisma migrate dev --name add-trip-miles-fields` to generate migration.
         └─ Depends on: —
         └─ Output:

[x] T-02 [API] Update calculateLoadFinancials to produce ratePerTotalMile
         └─ Detail: In `hussle-app-dispatch-api/src/shared/financials.ts`:
            - Add `ratePerTotalMile` to `LoadFinancialsResult` interface (line ~44)
            - After the existing `ratePerMile` calculation (lines 196-199), add:
              `ratePerTotalMile = totalMiles !== null && totalMiles !== 0 ? round2(rate.dividedBy(totalMiles)) : null`
              where `rate` is already computed as `customerRate + accessorials` (line 156)
            - `LoadFinancialsInput` already has `totalMiles: number | null` (line ~33) — no change needed
         └─ Depends on: T-01
         └─ Output:

[x] T-03 [API] Enforce server-side totalMiles computation in load service
         └─ Detail: In `hussle-app-dispatch-api/src/loads/services/loadService.ts`:
            - **createLoad** (line ~574): After line 601 (`const loadedMiles = input.loadedMiles ?? input.totalMiles`), compute `const computedTotalMiles = (loadedMiles ?? 0) + (input.deadheadMiles ?? 0)`. Pass `computedTotalMiles` to repository instead of `input.totalMiles`. If both loadedMiles and deadheadMiles are null/0, set totalMiles to null (don't write 0).
            - **updateLoad** (line ~660): Same pattern — after merging loadedMiles (line 685), recompute totalMiles server-side. Ignore `input.totalMiles` from client.
            - **assignLoad** already does this correctly (lines 764-767) — verify and leave as-is.
            - Also update the `calculateAndPersistFinancials` call in `hussle-app-dispatch-api/src/loads/services/calculateFinancials.ts` (line ~126) to pass `ratePerTotalMile` through to the DB update at line ~144 (`loadStatusRepo.updateFinancials()`).
         └─ Depends on: T-02
         └─ Output:

[x] T-04 [API] Include ratePerTotalMile in load API response mappers
         └─ Detail: Find the load response mapper/transformer (look for `toLoadDetailResponse` referenced in REGISTRY-dispatch-api.md controller pattern). Add `ratePerTotalMile` to the response shape for:
            - Load detail response (GET /loads/:id)
            - Load list response (GET /loads) — add to list item shape
            - Any other endpoint returning load data (check load list mapper, load detail mapper)
            The field should be `ratePerTotalMile: string | null` (Decimal serialized as string, matching `ratePerMile` format).
         └─ Depends on: T-03
         └─ Output:

[x] T-05 [TEST] Update financials tests for dual RPM
         └─ Detail: In `hussle-app-dispatch-api/src/shared/__tests__/` (or wherever `calculateLoadFinancials` tests live — search for test files importing from `financials.ts`):
            - Add test: `it('returns ratePerTotalMile when totalMiles is provided')` — pass loadedMiles=800, totalMiles=900, customerRate=3200 → expect ratePerMile=$4.00, ratePerTotalMile=$3.56
            - Add test: `it('returns null ratePerTotalMile when totalMiles is null')`
            - Add test: `it('returns null ratePerTotalMile when totalMiles is 0')`
            - Update existing test assertions that check the result shape to include `ratePerTotalMile`
            Also verify load service tests cover server-side totalMiles computation (search for loadService tests).
         └─ Depends on: T-02
         └─ Output:

---

## US-02: Deadhead distance endpoint
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `GET /drivers/:id/deadhead-to?lat=X&lng=Y` returns `{ deadheadMiles, isEstimated, source }`
- [x] If driver has `currentLatitude`/`currentLongitude` → uses coordinates directly, `source: 'coordinates'`
- [x] If driver has only `currentCity`/`currentState` → geocodes via `getCityCoords` from `geoLookup.ts`, `source: 'geocoded'`
- [x] If driver has no location data → returns `{ deadheadMiles: null, isEstimated: false, source: null }`
- [x] Route distance calculated via haversine * 1.3 road factor (matches deadheadFeasibility.ts pattern)

**Tasks:**
[x] T-06 [API] Create deadhead-to endpoint on driver routes
         └─ Detail: In `hussle-app-dispatch-api/src/drivers/routes/driverRoutes.ts` (after existing GET /:id route):
            - Add `GET /:id/deadhead-to` with query params `lat` (number), `lng` (number)
            - Validate: lat/lng are required numbers (Yup schema via `validateRequest` middleware)
            - Controller logic:
              1. Fetch driver by id (reuse `driverService.getDriverById`)
              2. Resolve driver coordinates: check `currentLatitude`/`currentLongitude` first; if null, call `getCityCoords(redis, driver.currentState, driver.currentCity)` from `hussle-app-dispatch-api/src/shared/geoLookup.ts`
              3. If no coordinates resolved → return `sendSingle(res, { deadheadMiles: null, isEstimated: false, source: null, message: 'Driver has no location data' })`
              4. Calculate distance: use `calculateDeadheadFeasibility` from `hussle-app-dispatch-api/src/shared/utils/deadheadFeasibility.ts` (it accepts driverCoords + pickupCoords, returns deadheadMiles with road factor), OR use route distance service if available. The feasibility function applies a 1.3x road factor to haversine — mark `isEstimated: true` when using this. If route distance service is available (AWS Location), use it for accuracy and set `isEstimated: false`.
              5. Return: `sendSingle(res, { deadheadMiles: number, isEstimated: boolean, source: 'coordinates' | 'geocoded' })`
            - Wire through composition root: add redis dependency for getCityCoords
            - Follow existing controller/mapper pattern from REGISTRY-dispatch-api.md
         └─ Depends on: T-01 (needs Driver lat/lng fields)
         └─ Output:

[x] T-07 [TEST] Test deadhead-to endpoint
         └─ Detail: Create test file at `hussle-app-dispatch-api/src/drivers/controllers/__tests__/` or service-level test:
            - Test: driver with lat/lng → returns deadheadMiles from coordinates, source='coordinates'
            - Test: driver with city/state only → geocodes, returns deadheadMiles, source='geocoded'
            - Test: driver with no location → returns null deadheadMiles
            - Test: missing lat/lng query params → 400 validation error
            Mock: driverService.getDriverById, getCityCoords, distance calculation
         └─ Depends on: T-06
         └─ Output:

---

## US-03: Frontend types + LoadDetailsSection field remapping
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] `FinancialSummary` type has `tripMiles`, `deadheadMiles`, `totalMiles`, `ratePerTotalMile`
- [x] LoadDetailsSection shows "Trip Miles" as the single editable miles field
- [x] Form field maps to `loadedMiles` (not `totalMiles`)
- [x] `useRouteDistance` sets `loadedMiles` / `calculatedTripMiles` (not `calculatedTotalMiles`)
- [x] Load schema validator updated

**Tasks:**
[x] T-08 [TYPES] Update frontend load types and FinancialSummary
         └─ Detail: In `hussle-app-dispatch-ui/src/features/load/types.ts`:
            - `FinancialSummary` interface (lines 528-537): rename `totalMiles` → `tripMiles`, add `deadheadMiles: number`, add `totalMiles: number` (computed), add `ratePerTotalMile: number`
            - `LoadDetail` interface (lines 150-204): add `ratePerTotalMile: string | null` after `ratePerMile` (line 179)
            - `LoadListItem` interface (lines 115-144): add `ratePerTotalMile: string | null` after `ratePerMile` (line 126)
            - Update `CreateLoadInput` (lines 210-233): ensure `loadedMiles` is primary, `totalMiles` is optional (backend ignores it anyway)
            - Find all usages of `FinancialSummary.totalMiles` and update to `.tripMiles` where appropriate
         └─ Depends on: —
         └─ Output:

[x] T-09 [UI] Rename miles field in LoadDetailsSection to "Trip Miles"
         └─ Detail: Find `LoadDetailsSection` component in `hussle-app-dispatch-ui/src/features/load/components/CreateLoadForm/sections/LoadDetailsSection/`. Per the design spec:
            - Change field label from "Total Miles (auto from route)" → "Trip Miles"
            - Change formik field name from `totalMiles` → `loadedMiles`
            - Helper text: "Auto-calculated from route" when value came from route API
            - Helper text: "Manual override" when user has edited the value
            - Add "Reset to route" link in helper text when user has overridden and route value differs
            - Field stays in same grid position (xs=12, md=3)
            - Track whether user has manually edited via a local ref or formik meta (touched + value !== calculatedTripMiles)
         └─ Depends on: T-08
         └─ Output:

[x] T-10 [TYPES] Update loadSchema validator
         └─ Detail: In `hussle-app-dispatch-ui/src/features/load/validators/loadSchema.ts`:
            - Keep `loadedMiles: Yup.number().min(0)` validation as-is (already exists per exploration)
            - Remove `totalMiles` from the schema (no longer a form field)
            - Rename `calculatedTotalMiles` → `calculatedTripMiles` (internal UI-only field used by useRouteDistance)
            - Add `isMilesOverridden: Yup.boolean()` if needed to track manual override state
            - Update `LoadFormValues` type (inferred from schema)
         └─ Depends on: T-08
         └─ Output:

[x] T-11 [HOOK] Update useRouteDistance to set loadedMiles
         └─ Detail: In `hussle-app-dispatch-ui/src/features/load/components/CreateLoadForm/sections/StopsSection/useRouteDistance.ts`:
            - Line 93: Change `formik.setFieldValue('calculatedTotalMiles', miles)` → `formik.setFieldValue('calculatedTripMiles', miles)`
            - The hook's `totalMiles` return field represents trip miles (route distance) — rename internal state or add comment for clarity
            - Ensure `LoadDetailsSection` reads `calculatedTripMiles` to auto-populate `loadedMiles` field
            - Find all consumers of `calculatedTotalMiles` and update references
         └─ Depends on: T-10
         └─ Output:

---

## US-04: Summary bar grouped KPIs
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Summary bar KPIs grouped into 3 clusters: Revenue | Route | Carrier (with vertical dividers)
- [x] Route KPI group shows Trip Miles and RPM as primary metrics
- [x] When driver with location selected: Route group expands with `+DH (total)` line and `Tot RPM`
- [x] When no deadhead: Route group shows Trip Miles and RPM only (no suffixes)
- [x] Responsive: 3-column > 1200px, stacked < 768px

**Tasks:**
[x] T-12 [UI] Create KpiGroup component and restructure summary bar
         └─ Detail: The summary bar is populated in `CreateLoadPage` (lines ~184-220 per exploration) via `onFinancialsChange` from `CreateLoadForm`. Per the `designs/summary-bar.md` spec:
            - Create `KpiGroup` component in `hussle-app-dispatch-ui/src/features/load/pages/CreateLoadPage/components/` — lightweight wrapper: `Stack direction="row" spacing={2}` with optional group label (tiny uppercase tertiary text). Groups separated by `Divider orientation="vertical" flexItem`.
            - Restructure existing flat KPI cells into 3 groups:
              **Revenue:** Cust Rate ($X,XXX), Margin ($X,XXX, color-coded: green >=20%, amber >=10%, red <10%), Min Book ($X,XXX.XX or `—`)
              **Route:** Trip Mi (X,XXX), RPM ($X.XX/mi)
              **Carrier:** Carrier Pay ($X,XXX.XX), Cost/Mi ($X.XX/mi or `—`)
            - Use existing `KpiCell` from `components/Typography`
            - Use existing `DetailLayout` `summary` prop
            - Responsive: Stack direction="row" for >1200px, stack vertically for <768px (use MUI `useMediaQuery` or `sx` responsive breakpoints)
         └─ Depends on: T-08 (needs updated FinancialSummary type)
         └─ Output:

[x] T-13 [UI] Add deadhead/total progressive disclosure to Route group
         └─ Detail: In the Route KPI group created in T-12:
            - When `financials.deadheadMiles > 0`, add a tertiary-styled line below the primary metrics:
              `+{deadheadMiles} DH ({totalMiles} tot)` — caption size, grey.400 color
              `Tot RPM ${ratePerTotalMile}/mi` — same tertiary style
            - When `deadheadMiles === 0` or not available, show only Trip Mi and RPM (no suffixes on labels)
            - Deadhead row appears with fade-in animation (200ms) when driver with location is selected
            - Deadhead row fades out when driver is removed
            - Use MUI `Fade` or `Collapse` transition component
            - The FinancialSummary passed to the summary bar must include `deadheadMiles`, `totalMiles`, `ratePerTotalMile` (from updated type in T-08)
         └─ Depends on: T-12
         └─ Output:

---

## US-05: useDeadheadDistance hook + driver integration
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Deadhead auto-calculated via `GET /drivers/:id/deadhead-to` when driver is selected and first stop has coordinates
- [x] Hook returns `{ deadheadMiles, isEstimated, source, isLoading }`
- [x] Deadhead data flows to summary bar Route group and DriverEconomicsSection (via formik.values.deadheadMiles → financial summary)
- [x] When driver is removed, deadhead resets to 0

**Tasks:**
[x] T-14 [HOOK] Create useDeadheadDistance hook
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/load/components/CreateLoadForm/hooks/useDeadheadDistance.ts`:
            - Follow the pattern of `useRouteDistance` hook (`hussle-app-dispatch-ui/src/features/load/components/CreateLoadForm/sections/StopsSection/useRouteDistance.ts`)
            - Inputs: `driverId: string | null`, `firstStopCoords: { lat: number; lng: number } | null`
            - When both inputs are non-null, call `GET /drivers/${driverId}/deadhead-to?lat=${coords.lat}&lng=${coords.lng}`
            - Add API function in `hussle-app-dispatch-ui/src/utils/api/fleet/driverApi.ts`: `getDeadheadDistance(driverId: string, lat: number, lng: number): Promise<DeadheadResult>`
            - Return type: `{ deadheadMiles: number | null; isEstimated: boolean; source: 'coordinates' | 'geocoded' | null; isLoading: boolean }`
            - Debounce: not needed (only fires on driver change, not continuous)
            - Reset: when driverId becomes null, reset to `{ deadheadMiles: null, isEstimated: false, source: null, isLoading: false }`
            - Add `DeadheadResult` type to `hussle-app-dispatch-ui/src/features/load/types.ts`
         └─ Depends on: T-08 (types)
         └─ Output:

[x] T-15 [WIRE] Integrate useDeadheadDistance into CreateLoadForm
         └─ Detail: In `hussle-app-dispatch-ui/src/features/load/components/CreateLoadForm/index.tsx`:
            - Import and call `useDeadheadDistance(selectedDriverId, firstStopCoords)`
            - Extract `firstStopCoords` from formik `values.stops[0]` — first PICKUP stop's lat/lng (find the stop with type='PICKUP' and lowest sequence)
            - When deadhead result arrives, compute `totalMiles = (values.loadedMiles ?? 0) + (deadheadMiles ?? 0)` and `ratePerTotalMile = customerRate / totalMiles`
            - Pass deadhead data into the `onFinancialsChange` callback so summary bar receives it
            - Pass deadhead data as props to `DriverEconomicsSection`
            - When driver changes or is removed, the hook automatically resets
         └─ Depends on: T-14, T-11 (useRouteDistance renamed fields), T-12 (summary bar expects deadhead data)
         └─ Output:

---

## US-06: DriverEconomicsSection dual RPM display
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] OO view: RPM labeled `/tot mi` when deadhead > 0, with secondary `/trip mi` line
- [x] OO view: no suffix when deadhead = 0 (just `/mi`)
- [x] "Below minimum" check uses total RPM (carrierPayout / totalMiles)
- [x] Company driver view: uses totalMiles for earnings/fuel (includes deadhead)

**Tasks:**
[x] T-16 [UI] Add subtitle prop to MetricItem and implement dual RPM
         └─ Detail: In `DriverEconomicsSection` (find in `hussle-app-dispatch-ui/src/features/load/components/CreateLoadForm/sections/DriverEconomicsSection/`):
            - Find `MetricItem` local component — add optional `subtitle?: string` prop. Render below main value in caption/tertiary style (Typography variant="caption", color="text.secondary").
            - Owner Operator view — Rate/Mile metric:
              - When `deadheadMiles > 0`:
                - Primary value: `$X.XX/tot mi` (carrierPayout / totalMiles)
                - Subtitle: `$X.XX/trip mi` (carrierPayout / loadedMiles)
              - When `deadheadMiles === 0` or null:
                - Primary value: `$X.XX/mi` (no suffix change — trip = total)
                - No subtitle
            - `belowMin` check (existing): must compare against **total RPM** (`carrierPayout / totalMiles`) per design spec. Currently uses `totalMiles` from form — update to use computed totalMiles (loadedMiles + deadheadMiles).
            - Receive `deadheadMiles` and `loadedMiles` as props (passed from CreateLoadForm in T-15)
            - Company driver view: NO changes (earnings-based, not RPM)
         └─ Depends on: T-15 (deadhead data flowing as props)
         └─ Output:

---

## INT-01: Wire dispatch-api ↔ dispatch-ui integration
_Auto-generated | Services: dispatch-api, dispatch-ui | Status: done_

**Verification Checklist:**
- [x] Frontend `DeadheadDistanceResult` type matches backend `GET /drivers/:id/deadhead-to` response shape — field names, types, source enum all match
- [x] Frontend `LoadDetail.ratePerTotalMile` field matches backend load response mapper — `string | null` on both sides
- [x] Frontend `LoadListItem.ratePerTotalMile` field matches backend list response
- [x] `FinancialSummary.tripMiles` correctly maps from `loadedMiles` form field
- [x] Frontend sends `totalMiles` but backend recomputes server-side (ignores client value)
- [x] Error handling: deadhead endpoint failure degrades gracefully — state resets to null, no error toast

**Tasks:**
[x] T-17 [WIRE] Verify API integration against contract
         └─ Detail: Read the following source files and compare:
            - Backend load response mapper vs frontend LoadDetail/LoadListItem types — field names, types, nullability
            - Backend deadhead-to response vs frontend DeadheadResult type
            - Backend financials output vs frontend FinancialSummary mapping
            - Frontend create/update load payloads vs backend expected input
            - Check that driverApi.getDeadheadDistance URL matches backend route path
            - Verify error handling: what happens if deadhead endpoint returns 404 (no location)?
            Report any mismatches as issues.
         └─ Agent: review
         └─ Depends on: T-04, T-06, T-08, T-14
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Status: done_

**Tasks:**
[x] T-18 [VERIFY] Trace complete feature flow
         └─ Detail: For each flow, trace from trigger through API through DB and back to UI:
            1. **Create load flow:** Dispatcher enters stops → route API → Trip Miles populates `loadedMiles` → save → backend computes `totalMiles`, `ratePerMile`, `ratePerTotalMile` → response → summary bar
            2. **Driver assignment flow:** Select driver with lat/lng → useDeadheadDistance fires → deadhead-to endpoint → deadhead response → summary bar Route group shows `+DH (total)` + `Tot RPM` → DriverEconomics shows dual RPM
            3. **Geocode fallback flow:** Driver has city/state only → endpoint geocodes → estimated deadhead → `isEstimated: true`
            4. **No location flow:** Driver has no location → endpoint returns null → no deadhead row
            5. **Manual override flow:** User edits Trip Miles → "Manual override" helper text → stops recalculate doesn't overwrite → "Reset to route" available
            Check every AC from every story is satisfied.
         └─ Agent: review
         └─ Depends on: T-17
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 5     | 5    | 0       | 8/8    |
| US-02 | 2     | 2    | 0       | 5/5    |
| US-03 | 4     | 4    | 0       | 5/5    |
| US-04 | 2     | 2    | 0       | 5/5    |
| US-05 | 2     | 2    | 0       | 4/4    |
| US-06 | 1     | 1    | 0       | 4/4    |
| INT-01| 1     | 1    | 0       | 6/6    |
| VER-01| 1     | 1    | 0       | 4/5    |
| **All** | **18** | **18** | **0** | **41/42** |
