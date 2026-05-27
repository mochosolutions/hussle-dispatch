# Financial Model Redesign — Phase 1: Bug Fixes

> Design doc: `hussle-app-dispatch-api/docs/designs/financial-model-redesign.md`
> Phase: 1 of 10 (bug fixes only — no schema changes)
> Refined: 2026-04-04

## Problem

The load financial model has calculation bugs and reporting errors that produce incorrect data for dispatchers. These can be fixed without any schema migrations.

## Solution Overview

Fix 3 bugs in the existing financial calculation flow:

1. **`updateLoad` never recalculates financials** — changing `customerRate`, `carrierId`, or `loadedMiles` on a pre-dispatch load leaves `dispatchFee`, `partnerSplit`, and `ratePerMile` stale.
2. **`computeMetrics` uses `carrierRate` as revenue** — the function incorrectly uses `carrierRate` (a cost/payout) instead of `customerRate` for gross billing, and has no carrier-type-aware revenue metric at all.
3. **Weekly gross ignores carrier type** — `weeklyGrossQueryPrisma.ts` sums `customerRate` for all loads regardless of carrier type. For external carriers, the company's revenue is only `dispatchFee`, not the full `customerRate`.

## Scope

Bug fixes only. No field renames, no new columns, no schema changes. All changes are in application logic using existing field names.

---

## Capabilities

### Must Fix (P0)

**Bug 1: `updateLoad` financial staleness**
- When a dispatcher changes `customerRate`, `carrierId`, or `loadedMiles` on a pre-dispatch load, financial fields (`dispatchFee`, `partnerSplit`, `ratePerMile`) must recalculate automatically
- The recalculation must use the same `calculateAndPersistFinancials` function used by `createLoad` and `assignLoad`
- Follow the `assignLoad` pattern: update the load first via repository, then call `calculateAndPersistFinancials` with the returned `LoadWithRelations`
- Financial fields must NOT recalculate if the load is DISPATCHED or beyond (existing `assertFinancialsNotChanged` guard handles this)
- If no carrier is assigned, financial fields should not be calculated (existing guard in `calculateAndPersistFinancials`)
- If `customerRate` is null, financial fields should not be calculated (existing guard)

**Bug 2: `computeMetrics` revenue metrics**
- `computeMetrics` in `src/shared/loadQueries.ts` must return two revenue metrics:
  - `totalGross`: sum of `customerRate` for all loads (gross billing volume, carrier-type-agnostic)
  - `totalRevenue`: carrier-type-aware company revenue — `customerRate` for COMPANY_ASSET, `dispatchFee` for EXTERNAL_CARRIER
- The `LoadPerformanceMetrics` interface must add `totalGross` alongside `totalRevenue`
- The metrics query must join carrier type to compute `totalRevenue`
- If carrier is null (unassigned load), use `customerRate` as fallback for both metrics
- Driver load history and vehicle load history pages must display both metrics

**Bug 3: Weekly gross for mixed fleets**
- `getWeeklyRevenue` in `weeklyGrossQueryPrisma.ts` must calculate revenue correctly per carrier type
- Look up the vehicle's carrier type, then sum the appropriate field:
  - COMPANY_ASSET carrier → sum `customerRate`
  - EXTERNAL_CARRIER carrier → sum `dispatchFee`
- Single query approach: determine the vehicle's carrier type first, then aggregate the correct field
- If carrier is null (edge case), default to `customerRate`

---

## Technical Details

### Bug 1 — Files to modify

**Primary:** `src/loads/services/loadService.ts` — `updateLoad` method (line ~614)

The `updateLoad` method currently:
1. Fetches existing load
2. Validates stops and prohibited commodities
3. Checks financial freeze via `assertFinancialsNotChanged` (existing — keep this)
4. Updates the load via repository
5. Returns the updated load

**Missing step:** After the repository update returns `LoadWithRelations`, check if financial-relevant fields changed AND the load has a carrier + customerRate, then call `calculateAndPersistFinancials`.

**Detection of financial-relevant changes:**
- Compare `input.customerRate` against `existing.customerRate`
- Compare `input.loadedMiles` (or the resolved `loadedMiles`) against `existing.loadedMiles`
- Check if assignment changed (carrierId differs)
- If any differ, and the returned load has `carrierId !== null` and `customerRate !== null`, trigger recalculation

**Pattern to follow:** Match the `assignLoad` pattern (lines 699-710):
```
const load = await deps.loadRepository.update(id, { ... });

if (
  load.carrierId !== null &&
  load.customerRate !== null &&
  deps.loadStatusRepo !== undefined &&
  deps.logger !== undefined
) {
  await calculateAndPersistFinancials(id, {
    load,
    loadStatusRepo: deps.loadStatusRepo,
    logger: deps.logger,
  });
}
```

The `updateLoad` method already has access to `deps.loadStatusRepo` and `deps.logger` through the `LoadServiceDeps` interface.

**Test file:** `src/loads/services/__tests__/loadService.test.ts` — add test cases for:
- Update customerRate on BOOKED load → financials recalculate
- Update carrierId on BOOKED load → financials recalculate
- Update loadedMiles on BOOKED load → financials recalculate
- Update customerRate on DISPATCHED load → rejected (frozen, existing behavior)
- Update non-financial field (e.g., dispatcherNotes) → no recalculation
- Update load with no carrier assigned → no recalculation (guard)

### Bug 2 — Files to modify

**Primary:** `src/shared/loadQueries.ts`

**Step 1 — Update `LoadPerformanceMetrics` interface:**
```typescript
export interface LoadPerformanceMetrics {
  totalLoads: number;
  totalGross: string;     // sum of customerRate (gross billing volume)
  totalRevenue: string;   // carrier-type-aware company revenue
  avgRatePerMile: string;
  onTimePercent: string;
}
```

**Step 2 — Update `computeMetrics` function:**

The function signature must accept carrier type and dispatchFee alongside existing fields:
```typescript
const computeMetrics = (
  allLoads: {
    customerRate: Decimal | null;
    carrierRate: Decimal | null;
    dispatchFee: Decimal | null;
    ratePerMile: Decimal | null;
    status: string;
    carrier: { type: string } | null;
  }[],
): LoadPerformanceMetrics => { ... }
```

Computation:
- `totalGross`: sum of `customerRate` for all loads (fallback 0 if null)
- `totalRevenue`: for each load, if carrier is COMPANY_ASSET (or null), add `customerRate`; if EXTERNAL_CARRIER, add `dispatchFee`

**Step 3 — Update the metrics select in both queries:**

The `allLoadsForMetrics` query (lines 126-133 and 168-175) must include:
```typescript
select: {
  customerRate: true,
  carrierRate: true,
  dispatchFee: true,
  ratePerMile: true,
  status: true,
  carrier: { select: { type: true } },
},
```

**Test:** Unit test for `computeMetrics` that verifies:
- All COMPANY_ASSET loads → totalGross === totalRevenue === sum of customerRate
- Mixed fleet (COMPANY_ASSET + EXTERNAL_CARRIER) → totalGross = sum of all customerRate, totalRevenue = sum of customerRate (company) + dispatchFee (external)
- Loads with null carrier → customerRate used for both metrics

**UI impact:** `LoadPerformanceMetrics` is consumed by the driver and vehicle detail pages in dispatch-ui. Adding `totalGross` is additive — existing `totalRevenue` consumers continue to work, but the value will change to be carrier-type-aware.

### Bug 3 — Files to modify

**Primary:** `src/loads/repositories/weeklyGrossQueryPrisma.ts` — `getWeeklyRevenue` method

**Approach:** Single query with carrier type lookup.

1. Query the vehicle's carrier type (can be derived from the `getActiveVehiclesWithCarrier` query already in this file, or by joining carrier on the load)
2. Based on carrier type, aggregate the appropriate field:
   - COMPANY_ASSET → `_sum: { customerRate: true }`
   - EXTERNAL_CARRIER → `_sum: { dispatchFee: true }`
3. If no carrier found (edge case), default to `customerRate`

**Simplest approach:** Add a carrier type parameter to the method, or look it up from the load's carrier relation within the query:

```typescript
getWeeklyRevenue: async (
  vehicleId: string,
  weekStart: Date,
  weekEnd: Date,
): Promise<{ revenue: Decimal; loadCount: number }> => {
  // Look up the vehicle's carrier type
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { carrier: { select: { type: true } } },
  });

  const isExternal = vehicle?.carrier?.type === 'EXTERNAL_CARRIER';
  const sumField = isExternal ? 'dispatchFee' : 'customerRate';

  const whereClause = { ... };

  const [aggregateResult, loadCount] = await Promise.all([
    prisma.load.aggregate({
      where: whereClause,
      _sum: { [sumField]: true },
    }),
    prisma.load.count({ where: whereClause }),
  ]);

  const sum = aggregateResult._sum[sumField];
  // ...
};
```

**Alternative:** Since `getActiveVehiclesWithCarrier` already fetches carrier data, the service could pass carrier type into `getWeeklyRevenue`. This avoids the extra query. Check `weeklyGrossService` to see if this is cleaner.

**Test:** Unit test for `getWeeklyRevenue` that verifies:
- Vehicle with COMPANY_ASSET carrier → sums `customerRate`
- Vehicle with EXTERNAL_CARRIER carrier → sums `dispatchFee`

---

## Affected Services

| Service | Changes |
|---------|---------|
| dispatch-api | `loadService.ts`, `loadQueries.ts`, `weeklyGrossQueryPrisma.ts`, tests |
| dispatch-ui | Consume new `totalGross` metric on driver/vehicle detail pages (additive) |

## Acceptance Criteria

- [ ] Updating `customerRate` on a BOOKED load recalculates `dispatchFee`, `partnerSplit`, `ratePerMile`
- [ ] Updating `carrierId` on a BOOKED load recalculates financials
- [ ] Updating `loadedMiles` on a BOOKED load recalculates `ratePerMile`
- [ ] Updating financials on a DISPATCHED load is still rejected
- [ ] Updating non-financial fields does not trigger recalculation
- [ ] Driver/vehicle performance metrics show `totalGross` (sum of `customerRate`)
- [ ] Driver/vehicle performance metrics show `totalRevenue` (carrier-type-aware: `customerRate` for COMPANY_ASSET, `dispatchFee` for EXTERNAL_CARRIER)
- [ ] Weekly gross for COMPANY_ASSET vehicle sums `customerRate`
- [ ] Weekly gross for EXTERNAL_CARRIER vehicle sums `dispatchFee`
- [ ] All existing tests continue to pass
- [ ] `npm run validate` passes (lint + deps + types + tests)

## Out of Scope

- Field renames (`carrierRate` → `carrierPayout`, `dispatchFee` → `companyMargin`) — Phase 2
- Schema migrations
- New database columns
- UI redesign of financial displays (beyond consuming the new `totalGross` metric)

## Verification

After all fixes:
1. `npm run check-ts` — no type errors
2. `npm test` — all existing + new tests pass
3. `npm run validate` — full validation green
