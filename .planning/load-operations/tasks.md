# Load Operations Tasks
_Last updated: 2026-04-12 02:00_
_Contract: .planning/load-operations/contract.yaml_
_Shared types: .planning/load-operations/types.ts_

---

## US-01: Prisma migration — add stopId FK to AccessorialCharge
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] AccessorialCharge model has `stopId String?` field with FK to Stop
- [x] Index exists on `stopId`
- [x] Existing charges have `stopId: null` (no backfill)
- [x] Prisma client regenerated

**Tasks:**
[x] T-01 [DB] Add stopId field and relation to AccessorialCharge in schema.prisma
         └─ Detail: In `hussle-app-dispatch-api/prisma/schema.prisma`, add to the AccessorialCharge model:
            - `stopId String?`
            - `stop Stop? @relation(fields: [stopId], references: [id])`
            - `@@index([stopId])` 
            Also add `accessorialCharges AccessorialCharge[]` to the Stop model's relations.
            Run `npx prisma migrate dev --name add-stop-id-to-accessorial-charge`.
            Run `npx prisma generate`.
         └─ Depends on: —
         └─ Output: schema.prisma updated, migration SQL created at prisma/migrations/20260412000000_add_stop_id_to_accessorial_charge/migration.sql, Prisma client regenerated. Types pass.

---

## US-02: Scheduling type field enforcement
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] APPOINTMENT stops require `appointmentStart` — returns 400 if missing
- [x] NOTIFICATION stops require `notificationHours` — returns 400 if missing
- [x] FCFS stops require `targetDate` — returns 400 if missing
- [x] OPEN and DROP_HOOK stops have no additional requirements
- [x] Error message identifies the stop by sequence and the missing field
- [x] Enforcement applies to load create, load update (when stops provided), individual stop create, and individual stop update

**Tasks:**
[x] T-02 [API] Extend validateStops() in loadService.ts with FCFS targetDate check
         └─ Detail: (see plan)
         └─ Depends on: —
         └─ Output: Added FCFS check to validateStops(). Exported validateStops for testing.

[x] T-03 [API] Extend validateSchedulingFields() in stopService.ts with FCFS check
         └─ Detail: (see plan)
         └─ Depends on: —
         └─ Output: Added targetDate param and FCFS check. Updated both call sites (createStop, updateStop).

[x] T-04 [TEST] Add unit tests for scheduling type enforcement
         └─ Detail: In `hussle-app-dispatch-api/src/loads/__tests__/` or `services/__tests__/`, add tests:
            - `validateStops` throws for APPOINTMENT without appointmentStart
            - `validateStops` throws for NOTIFICATION without notificationHours
            - `validateStops` throws for FCFS without targetDate
            - `validateStops` passes for OPEN with no date fields
            - `validateStops` passes for DROP_HOOK with no date fields
            - Error message includes stop sequence number
            Also test `validateSchedulingFields` in stopService for the FCFS case.
            Run `npx jest --findRelatedTests` on changed files.
         └─ Depends on: T-02, T-03
         └─ Output:

---

## US-03: Dispatch gate — warn on missing appointmentNumber
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Transitioning to DISPATCHED with an APPOINTMENT stop missing appointmentNumber returns 422 with warning
- [x] Warning code is `APPOINTMENT_NUMBER_MISSING`
- [x] Warning message identifies the stop by sequence
- [x] Retrying with `overrideWarnings: true` succeeds
- [x] Non-APPOINTMENT stops don't trigger the warning
- [x] Transitions to other statuses don't check appointmentNumber

**Tasks:**
[x] T-05 [API] Add appointmentNumber warning to validateTransition in stateMachine.ts
         └─ Detail: In `hussle-app-dispatch-api/src/shared/stateMachine.ts`, function `validateTransition()` (line ~105).
            The `LoadSnapshot` interface (line ~57) needs a new field: `stops?: { sequence: number; schedulingType: string; appointmentNumber: string | null }[]`.
            In the warnings section (line ~162), add: when `toStatus === 'DISPATCHED'`, iterate `context.load.stops`,
            for each stop where `schedulingType === 'APPOINTMENT'` and `appointmentNumber` is null/empty, 
            push warning: `'Stop ${stop.sequence}: APPOINTMENT stop is missing appointment number'`.
            The existing loadStatusService already passes the load to `validateTransition` — check that 
            `transitionStatus()` passes stops in the LoadSnapshot. If not, update the mapper in 
            `loadStatusService.ts` where it builds the LoadSnapshot (look for where it calls `validateTransition`).
         └─ Depends on: —
         └─ Output:

[x] T-06 [TEST] Add unit tests for dispatch gate warning
         └─ Detail: In `hussle-app-dispatch-api/src/shared/__tests__/stateMachine.test.ts`, add tests:
            - DISPATCHED with APPOINTMENT stop missing appointmentNumber → warnings include APPOINTMENT_NUMBER_MISSING-style message
            - DISPATCHED with all APPOINTMENT stops having appointmentNumber → no warnings
            - DISPATCHED with FCFS stops (no appointmentNumber) → no warnings
            - Transition to non-DISPATCHED status → no appointmentNumber check
            Also in `hussle-app-dispatch-api/src/loads/__tests__/loadStatusService.test.ts`, verify the 
            integration: loadStatusService returns 422 with warnings when overrideWarnings is false.
            Run `npx jest --findRelatedTests` on changed files.
         └─ Depends on: T-05
         └─ Output:

---

## US-04: Detention auto-detection
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Setting departureTime on a stop where arrivalTime exists and wait > freeHours creates DETENTION accessorial
- [x] Charge has approvalStatus=PENDING, isAutoGenerated=true, stopId set
- [x] Amount = ceil(excessHours) * defaultDetentionRate
- [x] Description includes wait time and facility info
- [x] DROP_HOOK stops exempt from detention
- [x] Status transitions AT_PICKUP→IN_TRANSIT and AT_DELIVERY→DELIVERED trigger detention safety net
- [x] Safety net does not create duplicate charges (checks existing by stopId + isAutoGenerated)
- [x] Domain event `load.detention.detected` is emitted

**Tasks:**
[x] T-07 [TYPES] Add load.detention.detected event to EventMap
         └─ Detail: In `hussle-app-dispatch-api/src/shared/messaging/eventMap.ts`, add to the EventMap interface:
            ```
            'load.detention.detected': {
              loadId: string;
              organizationId: string;
              loadNumber: string;
              stopId: string;
              stopSequence: number;
              facilityName: string | null;
              city: string | null;
              state: string | null;
              waitHours: number;
              billableHours: number;
              rate: number;
              amount: number;
            };
            ```
         └─ Depends on: —
         └─ Output:

[x] T-08 [TYPES] Add CHECK_DETENTION side effect tag to stateMachine.ts
         └─ Detail: In `hussle-app-dispatch-api/src/shared/stateMachine.ts`:
            1. Add `'CHECK_DETENTION'` to the `SideEffectTag` union type (line ~38).
            2. Add to `TRANSITION_SIDE_EFFECTS` map:
               - `IN_TRANSIT: ['CHECK_DETENTION']`
               - `DELIVERED: ['AUTO_GENERATE_INVOICE', 'CHECK_DETENTION']` (append to existing)
         └─ Depends on: —
         └─ Output:

[x] T-09 [API] Create detention detection service function
         └─ Detail: Create `hussle-app-dispatch-api/src/loads/services/detentionDetector.ts`.
            Export `checkDetentionForStop()` — a pure-ish function that:
            1. Takes: `stop` (with arrivalTime, departureTime, type, facilityName, city, state, sequence, id),
               `orgSettings` (detentionFreeHours, defaultDetentionRate), `existingCharges` (for dupe check)
            2. Returns: `{ detected: false }` or `{ detected: true, billableHours, amount, description }`
            3. Logic:
               - If stop.type === 'DROP_HOOK', return not detected
               - If arrivalTime or departureTime is null, return not detected
               - waitHours = (departureTime - arrivalTime) / 3600000
               - If waitHours <= freeHours, return not detected
               - If existingCharges has an entry with stopId === stop.id and type === 'DETENTION' and isAutoGenerated, return not detected
               - billableHours = Math.ceil(waitHours - freeHours)
               - amount = billableHours * defaultDetentionRate
               - description = `Auto-detected: ${waitHours.toFixed(1)}hr wait at ${facilityName || `${city}, ${state}`}`
            Also export `DetentionResult` type.
            Keep this function side-effect-free for testability.
         └─ Depends on: US-01 (stopId FK)
         └─ Output:

[x] T-10 [API] Wire detention into stopService.updateStop
         └─ Detail: In `hussle-app-dispatch-api/src/loads/services/stopService.ts`, modify `updateStop` (line ~115):
            After `deps.stopRepository.update(input)`, if `input.departureTime` is defined:
            1. Fetch the full stop (result already has it from the update)
            2. Fetch org settings via new dep: `settingsQuery: { findByOrganizationId(orgId): Promise<OrgSettings | null> }`
            3. Fetch existing accessorial charges for this load via new dep: `accessorialQuery: { findByLoadId(loadId): Promise<AccessorialCharge[]> }`
            4. Call `checkDetentionForStop(result, orgSettings, existingCharges)`
            5. If detected: create AccessorialCharge via new dep `accessorialRepo.create({ loadId, type: 'DETENTION', amount, description, billTo: 'customer', approvalStatus: 'PENDING', isAutoGenerated: true, stopId: result.id })`
            6. Publish `load.detention.detected` event via `deps.eventBus`
            Update the StopServiceDeps interface with the new ports.
            Update the stop compositionRoot to wire the new deps.
         └─ Depends on: T-09
         └─ Output:

[x] T-11 [API] Wire detention safety net into loadStatusService side effects
         └─ Detail: In `hussle-app-dispatch-api/src/loads/services/loadStatusService.ts`, add the
            `CHECK_DETENTION` case to `executeSideEffects` (line ~50):
            1. When `CHECK_DETENTION`:
               - `deps.load.stops` is already available (LoadWithRelations includes stops)
               - Filter stops by type: if target is IN_TRANSIT → PICKUP stops; if DELIVERED → DELIVERY stops
               - For each qualifying stop, fetch org settings and existing charges, call `checkDetentionForStop`
               - If detected, create the charge and publish the event
            The `SideEffectDeps` interface needs: `settingsQuery`, `accessorialQuery`, `accessorialRepo`.
            Wire these in the loads compositionRoot where loadStatusService is created.
         └─ Depends on: T-09, T-08
         └─ Output:

[x] T-12 [TEST] Add unit tests for detention detection
         └─ Detail: Create `hussle-app-dispatch-api/src/loads/services/__tests__/detentionDetector.test.ts`.
            Test cases for `checkDetentionForStop`:
            - Returns detected when wait > freeHours (e.g., 4hr wait with 2hr free = 2hr billed)
            - Rounds up: 2hr 10min wait with 2hr free = 1hr billed (not 0.17)
            - Returns not detected when wait <= freeHours
            - Returns not detected for DROP_HOOK stops
            - Returns not detected when arrivalTime is null
            - Returns not detected when departureTime is null
            - Returns not detected when duplicate charge exists (matching stopId + isAutoGenerated)
            - Amount = billableHours * rate
            - Description includes facility name or city/state fallback
            Run `npx jest --findRelatedTests` on changed files.
         └─ Depends on: T-09
         └─ Output:

---

## US-05: Detention notification subscriber
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] Dispatcher is notified when detention is auto-detected
- [x] Notification includes load number, facility, wait time, billed amount

**Tasks:**
[x] T-13 [API] Add detention notification handler
         └─ Detail: (see plan)
         └─ Depends on: T-07
         └─ Output: Created detentionSubscriber.ts — subscribes to load.detention.detected, logs structured detention alert with all details (loadNumber, facility, waitHours, billableHours, rate, amount). Wired in compositionRoot. NOT YET WIRED to full email/in-app notification pipeline — existing notification system is customer-facing (email/SMS). Detention alerts are internal dispatcher alerts. Logger.info serves as the notification until in-app notifications are built.

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Status: done_

**Tasks:**
[x] T-14 [VERIFY] Trace complete feature flow against contract and acceptance criteria
         └─ Detail: For each flow in contract.yaml x-data-flow, trace every step from trigger 
            through service through DB and back to response. Verify:
            1. validateStops() in loadService.ts checks APPOINTMENT/NOTIFICATION/FCFS
            2. validateSchedulingFields() in stopService.ts checks APPOINTMENT/NOTIFICATION/FCFS
            3. validateTransition() in stateMachine.ts warns on missing appointmentNumber for DISPATCHED
            4. stopService.updateStop() triggers detention check on departureTime
            5. loadStatusService executeSideEffects CHECK_DETENTION runs on IN_TRANSIT and DELIVERED
            6. checkDetentionForStop() creates PENDING charge with stopId FK
            7. load.detention.detected event is published and subscriber handles it
            8. All AC from US-01 through US-05 are satisfied
            Check every AC from every story. Report gaps.
         └─ Agent: review
         └─ Depends on: T-01 through T-13
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 1     | 1    | 0       | 4/4    |
| US-02 | 3     | 3    | 0       | 6/6    |
| US-03 | 2     | 2    | 0       | 6/6    |
| US-04 | 6     | 6    | 0       | 8/8    |
| US-05 | 1     | 1    | 0       | 2/2    |
| VER-01| 1     | 1    | 0       | 30/30  |
| **All** | **14** | **14** | **0** | **26/26** |
