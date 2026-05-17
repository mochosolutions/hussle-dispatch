# Driver Management (Cleanup) Tasks
_Last updated: 2026-04-23 10:25_

---

## US-01: Validate driver pay type and rate on update
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `PATCH /drivers/:id` with `payType: 'INVALID'` returns 400 validation error
- [x] `PATCH /drivers/:id` with `payType: 'FLAT_RATE'` and no `payRate` returns 400
- [x] `PATCH /drivers/:id` with `payType: 'PER_MILE'` and `payRate: 0.55` succeeds
- [x] `PATCH /drivers/:id` with `payType: null` and `payRate: null` succeeds (clearing pay config)
- [x] All 4 pay types accepted: PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE

**Tasks:**
[x] T-01 [TYPES] Add payType and payRate to driver input types
         └─ Detail: In `src/drivers/types/driverTypes.ts`, add `payType` and `payRate` to
            `UpdateDriverInput` (and `CreateDriverInput` if missing). `payType` should be
            `DriverPayType | null` (from Prisma enum: PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE).
            `payRate` should be `number | null`. Both optional on update.
         └─ Depends on: —
         └─ Output: Added DriverPayType import + payType/payRate fields to both input types

[x] T-02 [API] Add payType/payRate validation to driverValidators.ts
         └─ Detail: In `src/drivers/validators/driverValidators.ts`, add to both
            `createDriverSchema` and `updateDriverSchema`:
            - `payType`: `yup.string().nullable().oneOf([null, 'PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE'])`
            - `payRate`: `yup.number().nullable().min(0)` with conditional via `.when('payType', ...)`
         └─ Depends on: T-01
         └─ Output: Conditional validation: payRate required when payType set, must be null when payType null

[x] T-03 [TEST] Add unit tests for pay type/rate validation
         └─ Detail: Created `src/drivers/validators/__tests__/driverValidators.test.ts`
         └─ Depends on: T-02
         └─ Output: 13 tests pass (all 7 test cases + enum coverage)

---

## US-02: Auto-geocode driver location on city/state update
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Updating `currentCity`/`currentState` auto-populates `currentLatitude`/`currentLongitude`
- [x] Geocoding failure doesn't block the update (warning logged, city/state still saved)
- [x] Updating only unrelated fields (e.g., `notes`) does not trigger geocoding
- [x] Clearing city/state clears coordinates too

**Tasks:**
[x] T-04 [API] Add geocoding logic to driverService.updateDriver
         └─ Detail: Modified updateDriver to capture existingDriver, detect city/state changes,
            geocode via getCityCoords, merge lat/lng into update. Best-effort with console.warn.
            Wired redis + getCityCoords into DriverServiceDeps and compositionRoot.
         └─ Depends on: —
         └─ Output: Files: driverService.ts, driverTypes.ts (added lat/lng to UpdateDriverInput), compositionRoot.ts

[x] T-05 [TEST] Add unit tests for geocoding in driverService
         └─ Detail: Added 5 test cases to driverService.test.ts
         └─ Depends on: T-04
         └─ Output: 12 tests pass (7 existing + 5 new geocoding tests)

---

## US-03: Allow PER_HOUR in carrier portal driver validator
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] Carrier portal accepts `PER_HOUR` as a valid pay type (alongside PERCENTAGE, PER_MILE, FLAT_RATE)

**Tasks:**
[x] T-06 [FIX] Add PER_HOUR to carrier portal PAY_TYPES array
         └─ Detail: In `src/carrier-portal/validators/driversValidator.ts` (line 3), change
            `const PAY_TYPES = ['PERCENTAGE', 'PER_MILE', 'FLAT_RATE']` to
            `const PAY_TYPES = ['PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE']`
         └─ Depends on: —
         └─ Output: Added PER_HOUR to PAY_TYPES array + updated error message

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-07 [VERIFY] Verify all 3 fixes against acceptance criteria
         └─ Detail: Read the modified files and verify:
            1. driverValidators.ts — payType enum check with all 4 values, payRate conditional
            2. driverService.ts — geocoding on city/state change, best-effort, clear-on-null
            3. carrier-portal driversValidator.ts — PER_HOUR in PAY_TYPES
            4. All tests pass and cover the acceptance criteria
            5. No regressions in existing driver CRUD flow
         └─ Agent: review
         └─ Depends on: T-03, T-05, T-06
         └─ Output: ALL PASS. 1 minor note: console.warn in geocoding (no logger injected in service currently)

---

## Summary
| Story  | Tasks | Done | Blocked | AC Met |
|--------|-------|------|---------|--------|
| US-01  | 3     | 3    | 0       | 5/5    |
| US-02  | 2     | 2    | 0       | 4/4    |
| US-03  | 1     | 1    | 0       | 1/1    |
| VER-01 | 1     | 1    | 0       | —      |
| **All** | **7** | **7** | **0** | **10/10** |
