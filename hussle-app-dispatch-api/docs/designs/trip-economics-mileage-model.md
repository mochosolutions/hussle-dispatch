# Trip Economics & Mileage Model

> Design document — captures the full model for future implementation.
> Status: **Draft**

---

## Problem Statement

- `loadedMiles` is never auto-calculated, making `ratePerMile` permanently null.
- Deadhead calculation only considers the driver's last delivery, not home base.
- No distinction between local and OTR driver cost attribution.
- `totalMiles` does not include deadhead — it only reflects route distance.

---

## Mileage Field Definitions

| Field | Definition | Category |
|-------|-----------|----------|
| `loadedMiles` | Route distance from first pickup to last delivery | Revenue miles |
| `deadheadMiles` | Empty miles to reach the first pickup | Cost miles (varies by context) |
| `totalMiles` | `loadedMiles + deadheadMiles` | Total truck miles for this load |

---

## Driver Profiles and Cost Attribution

Driver profile is determined by `maxDaysOut` on the Driver model.

### Local Driver (`maxDaysOut` <= 1)

Trip cost includes the full round trip:
- Deadhead TO first pickup
- Loaded miles (pickup to delivery)
- Deadhead FROM last delivery BACK to home base

All three segments are attributed to the single load.

### OTR Driver (`maxDaysOut` > 1)

Trip cost for an individual load:
- Deadhead TO first pickup (from last delivery or home base)
- Loaded miles (pickup to delivery)

Return deadhead is only attributed when:
- No backhaul is found within the search radius
- Driver has reached `maxDaysOut` and must return home

Otherwise, return deadhead is attributed to the chain (next outbound load absorbs it as its own deadhead).

---

## Deadhead Origin Logic

Priority order for determining where deadhead starts:

1. **Recent completed load**: Driver has a completed load with delivery coordinates — deadhead from last delivery location.
2. **Home base geocode**: No recent load — geocode the driver's `homeBaseCity`/`homeBaseState` to get coordinates — deadhead from home base.
3. **Neither available**: `deadheadMiles = null` — cannot calculate.

For **local drivers**, also calculate `deadheadFromDelivery`: distance from last delivery back to home base (return cost).

---

## Schema Changes Needed (Future)

```
Load:
  + deadheadFromDelivery  Int?       // Return deadhead for local drivers

Driver:
  + homeBaseLatitude      Decimal?   // Or resolve via Place/geocoding
  + homeBaseLongitude     Decimal?

Load (consider):
  + tripType  enum: LOCAL_ROUND_TRIP | OTR_OUTBOUND | OTR_CHAIN
```

---

## Chain Integration

Existing utilities that model multi-load chains:

- **`calculateChainScore.ts`** — already models outbound + return as a pair
- **`deadheadFeasibility.ts`** — calculates deadhead with drive time and feasibility status
- **`calculateMinBookRate.ts`** — uses `vehicleCpm * totalMiles`; should use correct `totalMiles` inclusive of deadhead

Load-intel scoring should factor in driver profile when ranking loads:
- Local driver: penalize loads far from home (round-trip cost is high)
- OTR driver: penalize loads far from current position, but reward loads heading toward home when near `maxDaysOut`

---

## Financial Impact

### Rate Per Mile
```
ratePerMile = customerRate / loadedMiles
```
Works correctly once `loadedMiles` is auto-populated from route calculation.

### True Profitability
```
trueCost = totalMiles * vehicleCpm
profit = customerRate - trueCost
```
Requires `totalMiles` to include deadhead for accuracy.

### Local Driver Cost
```
totalTripMiles = deadheadToPickup + loadedMiles + deadheadFromDelivery
trueCost = totalTripMiles * vehicleCpm
```
Must include return deadhead in cost calculation.

### OTR Driver Cost
```
loadCost = (deadheadToPickup + loadedMiles) * vehicleCpm
```
Return deadhead attributed to chain, not individual load.

---

## Open Questions

1. Should `deadheadMiles` recalculate when the driver's position updates (live tracking)?
2. How to attribute return-home cost when the driver runs out of days with no backhaul?
3. Should the system suggest "head home" when no profitable backhaul exists within the search radius?
4. Should `tripType` be inferred from driver profile + assignment, or explicitly set by the dispatcher?
