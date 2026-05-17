# DriverEconomicsSection — RPM Label Fixes

## Screen Purpose

The DriverEconomicsSection shows estimated driver earnings below the Driver assignment section. It currently calculates RPM using `totalMiles` but labels it "Rate/Mile" — misleading when deadhead exists. This spec fixes the labels and adds trip RPM context where appropriate.

## Layout Changes

### Owner Operator View

Current:
```
┌─────────────────────────────────────────────────────┐
│ Owner Operator Economics                            │
│ Estimated driver earnings for this load             │
├─────────────────────────────────────────────────────┤
│ Carrier Payout  Rate/Mile   Their Minimum           │
│ $2,560          $3.02       $3.20/mi                │
│                                                     │
│ Est. Fuel Cost   Owner Op Net                       │
│ -$548            $2,012                             │
│─────────────────────────────────────────────────────│
│ [✗ Below owner op minimum] [⚠ High fuel burden]    │
└─────────────────────────────────────────────────────┘
```

New (when deadhead is known):
```
┌─────────────────────────────────────────────────────┐
│ Owner Operator Economics                            │
│ Estimated driver earnings for this load             │
├─────────────────────────────────────────────────────┤
│ Carrier Payout  Rate/Mile     Their Minimum         │
│ $2,560          $3.02/tot mi  $3.20/mi              │
│                 $3.78/trip mi                        │
│                                                     │
│ Est. Fuel Cost   Owner Op Net                       │
│ -$548            $2,012                             │
│─────────────────────────────────────────────────────│
│ [✗ Below owner op minimum] [⚠ High fuel burden]    │
└─────────────────────────────────────────────────────┘
```

**Key changes:**
- Primary RPM: `carrierPayout / totalMiles` labeled "Rate/Mile" with suffix `/tot mi`
- Secondary RPM: `carrierPayout / loadedMiles` labeled as a smaller subtitle line `/trip mi` — only shown when deadheadMiles > 0
- "Below minimum" check compares against the **total RPM** (worst case for the driver — includes deadhead cost)

When NO deadhead is known (no driver location, or deadhead = 0):
```
│ Carrier Payout  Rate/Mile   Their Minimum           │
│ $2,560          $3.02/mi    $3.20/mi                │
```
No `/tot mi` or `/trip mi` suffix — just `/mi` since trip = total when no deadhead.

### Company Driver View

No RPM changes. Company drivers see earnings, not rate analysis. The section stays as-is except the internal calculation uses `totalMiles` (which it already does).

## Component Changes

- **Existing:** `MetricItem` (local to DriverEconomicsSection) — add optional `subtitle` prop for the secondary RPM line
- No new shared components

## Visible Data Fields

| UI Label | Source | Format | Visibility |
|----------|--------|--------|------------|
| Carrier Payout | `carrierPayout` | `$X,XXX` | Always (OO only) |
| Rate/Mile | `carrierPayout / totalMiles` | `$X.XX/tot mi` or `$X.XX/mi` | Always (OO only) |
| Rate/Trip Mile | `carrierPayout / loadedMiles` | `$X.XX/trip mi` (tertiary) | Only when deadheadMiles > 0 (OO only) |
| Their Minimum | `selectedDriver.minRpm` | `$X.XX/mi` | Always (OO only) |
| Est. Fuel Cost | `totalMiles * (FUEL_PPG / mpg)` | `-$XXX` (red) | Always (OO only) |
| Owner Op Net | `carrierPayout - fuelCost` | `$X,XXX` (green/red) | Always (OO only) |
| Driver Pay Rate | `selectedDriver.cpm` | `$X.XX/mi` | Always (company only) |
| Gross Earnings | `totalMiles * cpm` | `$XXX` | Always (company only) |
| Est. Fuel | `totalMiles * (FUEL_PPG / 7.5)` | `-$XXX` (red) | Always (company only) |
| Take-Home | `earnings - fuel` | `$XXX` (green/red) | Always (company only) |

## Calculation Fix

The current code uses `totalMiles` from the form (`values.totalMiles ?? calculatedTotalMiles`). After this change:
- `totalMiles` = `loadedMiles + deadheadMiles` (computed in the component or received from `FinancialSummary`)
- `loadedMiles` = form field value (`values.loadedMiles`)
- `deadheadMiles` = from the `useDeadheadDistance` hook result (passed as prop or via context)

The `belowMin` check compares `carrierPayout / totalMiles` against `selectedDriver.minRpm` — this is correct because the driver cares about their all-in rate including deadhead.

## States

- **No driver selected:** Section not rendered (existing behavior)
- **Driver selected, no deadhead:** Single RPM line, no suffix
- **Driver selected, deadhead known:** Dual RPM display with `/tot mi` and `/trip mi`
- **Miles = 0:** Section not rendered (existing behavior)
