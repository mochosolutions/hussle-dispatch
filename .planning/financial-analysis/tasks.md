# Financial Analysis Tasks
_Last updated: 2026-03-28 12:45_

---

## US-01: Fix partnerSplit formula to use total revenue
_Priority: P0 | Services: dispatch-api | Status: complete_

**Acceptance Criteria:**
- [x] partnerSplit = (customerRate + accessorials) x partnerSplitPercent / 100 (not dispatchFee x partnerSplitPercent)
- [x] companyShare = dispatchFee - partnerSplit still holds
- [x] dispatchFee calculation is unchanged
- [x] All existing unit tests updated and passing with new formula

**Tasks:**
[x] T-01 [API] Update calculateLoadFinancials to compute partnerSplit from total revenue
         └─ Agent: backend
         └─ Output: Changed line 65 in financials.ts. 4 tests now expect new values.

[x] T-02 [TEST] Update financials unit tests for new partnerSplit formula
         └─ Agent: backend
         └─ Output: Updated 4 test cases. 14/14 tests pass.

---

## US-02: Calculate financials at load creation time
_Priority: P0 | Services: dispatch-api | Status: complete_

**Acceptance Criteria:**
- [x] When a load is created with carrierId and customerRate present, dispatchFee is persisted as non-null
- [x] When a load is created with carrierId and customerRate present, partnerSplit is persisted as non-null
- [x] ratePerMile = customerRate / loadedMiles when loadedMiles > 0; null otherwise
- [x] Existing assignLoad financial calculation continues to work unchanged

**Tasks:**
[x] T-03 [API] Call calculateAndPersistFinancials in createLoad service
         └─ Agent: backend
         └─ Output: Added financial calc after loadRepository.create in loadService.ts. Same pattern as assignLoad. No new type errors.

---

## US-03: Frontend uses carrier's actual dispatch fee percent
_Priority: P0 | Services: dispatch-ui | Status: complete_

**Acceptance Criteria:**
- [x] When a carrier is selected on the create load form, carrierRate updates based on the carrier's actual dispatchFeePercent
- [x] Read-only "Driver Fee" field is visible on the create load form showing the computed partnerSplit
- [x] Driver Fee updates reactively when carrier selection or customer rate changes
- [x] Financial summary bar (onFinancialsChange) uses actual carrier config

**Tasks:**
[x] T-04 [UI] Update CreateLoadForm to use carrier's actual dispatchFeePercent for carrierRate
         └─ Agent: frontend
         └─ Output: Removed DEFAULT_CARRIER_PERCENT. Added useEffect to update carrierRate from carrier config. No new type errors.

[x] T-05 [UI] Add read-only Driver Fee display to CreateLoadForm
         └─ Agent: frontend
         └─ Output: Added driverFee computation and display to DriverEconomicsSection. Shows standalone when no driver selected, also embedded in both driver type sections.

---

## INT-01: Verify backend formula matches frontend preview
_Auto-generated | Services: dispatch-api, dispatch-ui | Status: complete_

**Verification Checklist:**
- [x] Frontend driverFee preview matches backend partnerSplit formula: (customerRate + accessorials) x partnerSplitPercent / 100
- [x] Frontend carrierRate preview uses same dispatchFeePercent the backend uses for dispatchFee calculation
- [x] Backend createLoad response includes calculated financial fields (dispatchFee, partnerSplit, ratePerMile)

**Tasks:**
[x] T-06 [WIRE] Verify frontend financial preview matches backend calculation
         └─ Agent: review
         └─ Output: ALL MATCH. No discrepancies found between backend and frontend formulas.

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Status: complete_

**Tasks:**
[x] T-07 [VERIFY] Trace complete financial calculation flow
         └─ Agent: review
         └─ Output: Full flow verified: carrier selection → dispatchFeePercent → carrierRate → Driver Fee preview → POST /loads → calculateAndPersistFinancials → DB persistence. All 12 AC satisfied. assignLoad unchanged.

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 2     | 2    | 0       | 4/4    |
| US-02 | 1     | 1    | 0       | 4/4    |
| US-03 | 2     | 2    | 0       | 4/4    |
| INT-01| 1     | 1    | 0       | 3/3    |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **7** | **7** | **0** | **12/12** |
