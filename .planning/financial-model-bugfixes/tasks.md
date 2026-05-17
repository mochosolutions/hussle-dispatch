# Financial Model Bug Fixes — Tasks
_Last updated: 2026-04-04 13:15_

---

## US-01: updateLoad recalculates financials when financial fields change
_Priority: P0 | Services: dispatch-api | Status: complete_

**Acceptance Criteria:**
- [x] Updating `customerRate` on a BOOKED load recalculates `dispatchFee`, `partnerSplit`, `ratePerMile`
- [x] Updating `carrierId` on a BOOKED load recalculates financials
- [x] Updating `loadedMiles` on a BOOKED load recalculates `ratePerMile`
- [x] Updating financials on a DISPATCHED load is still rejected (existing behavior preserved)
- [x] Updating non-financial fields does not trigger recalculation
- [x] Load with no carrier assigned does not trigger recalculation

**Tasks:**
[x] T-01 [API] Add financial recalculation to updateLoad in loadService.ts
         └─ Agent: backend
         └─ Output:
           Files: src/loads/services/loadService.ts (modified)
           Exports: None new (hasFinancialRelevantFieldChanged is module-private)
           Wiring: updateLoad now calls calculateAndPersistFinancials matching assignLoad pattern
           Issues: None. Typecheck passes.

[x] T-02 [TEST] Add unit tests for updateLoad financial recalculation
         └─ Agent: backend
         └─ Output:
           Files: src/loads/services/__tests__/loadService.test.ts (modified)
           Tests: 12 passed (7 existing + 5 new)
           Cases: customerRate change recalc, loadedMiles change recalc, non-financial no recalc, null carrier no recalc, DISPATCHED rejection
           Issues: None

---

## US-02: Driver/vehicle performance metrics show correct revenue
_Priority: P0 | Services: dispatch-api | Status: complete_

**Acceptance Criteria:**
- [x] `computeMetrics` returns `totalGross` (sum of `customerRate` for all loads)
- [x] `computeMetrics` returns `totalRevenue` (carrier-type-aware: `customerRate` for COMPANY_ASSET, `dispatchFee` for EXTERNAL_CARRIER)
- [x] Loads with null carrier use `customerRate` for both metrics
- [x] `LoadPerformanceMetrics` interface includes both `totalGross` and `totalRevenue`

**Tasks:**
[x] T-03 [API] Fix computeMetrics in loadQueries.ts to return both gross and revenue
         └─ Agent: backend
         └─ Output:
           Files: src/shared/loadQueries.ts, src/drivers/controllers/transformers/loadHistoryTransformer.ts, src/vehicles/controllers/transformers/loadHistoryTransformer.ts
           Exports: computeMetrics (now exported), LoadPerformanceMetrics (added totalGross)
           Issues: None. Typecheck passes.

[x] T-04 [TEST] Add unit tests for computeMetrics
         └─ Agent: backend
         └─ Output:
           Files: src/shared/__tests__/loadQueries.test.ts (created)
           Tests: 6 passed
           Cases: totalGross all carriers, totalRevenue mixed fleet, null carrier fallback, null fields zero, avgRatePerMile, onTimePercent
           Issues: None

---

## US-03: Weekly gross calculates revenue correctly per carrier type
_Priority: P0 | Services: dispatch-api | Status: complete_

**Acceptance Criteria:**
- [x] Weekly gross for COMPANY_ASSET vehicle sums `customerRate`
- [x] Weekly gross for EXTERNAL_CARRIER vehicle sums `dispatchFee`
- [x] Edge case: vehicle with no carrier defaults to `customerRate`

**Tasks:**
[x] T-05 [API] Fix getWeeklyRevenue in weeklyGrossQueryPrisma.ts to use carrier type
         └─ Agent: backend
         └─ Output:
           Files: src/loads/repositories/weeklyGrossQueryPrisma.ts (modified)
           Exports: None new. Added toDecimal internal helper.
           Changes: Carrier type lookup + if/else for EXTERNAL_CARRIER (dispatchFee) vs default (customerRate). Clean Prisma typing, no `as` casts.
           Issues: None. Typecheck passes.

[x] T-06 [TEST] Add unit tests for weekly gross carrier-type-aware revenue
         └─ Agent: backend
         └─ Output:
           Files: src/loads/repositories/__tests__/weeklyGrossQueryPrisma.test.ts (created)
           Tests: 4 passed
           Cases: COMPANY_ASSET sums customerRate, EXTERNAL_CARRIER sums dispatchFee, null carrier defaults customerRate, zero revenue
           Issues: None

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-07 [VERIFY] Review all bug fixes for correctness and completeness
         └─ Agent: review
         └─ Output:
           Verdict: SHIP
           All AC met. 22 tests pass. No MUST_FIX issues.
           SHOULD_FIX: (1) Missing test for carrierId change in updateLoad, (2) OWNER_OPERATOR silently excluded from totalRevenue — add comment.
           NICE_TO_HAVE: Duplicated loadHistoryTransformer (pre-existing), comment on totalMiles fallback, Decimal comparison could use .equals().

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 2     | 2    | 0       | 6/6    |
| US-02 | 2     | 2    | 0       | 4/4    |
| US-03 | 2     | 2    | 0       | 3/3    |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **7** | **7** | **0** | **13/13** |
