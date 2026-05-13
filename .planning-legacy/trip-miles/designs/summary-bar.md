# Summary Bar — Grouped KPIs

## Screen Purpose

The summary bar is the persistent header on the CreateLoadPage (and EditLoadPage). It gives dispatchers an at-a-glance financial and operational snapshot as they build the load. Currently 7 flat KPI cells — redesigned as 3 logical groups with progressive disclosure of deadhead/total miles.

## Layout

Three KPI groups separated by subtle vertical dividers (MUI `Divider orientation="vertical"`). Each group is a `Stack direction="row"` of `KpiCell` components. The three groups sit inside the existing `summary` slot of `DetailLayout`.

```
┌─── Revenue ────────┬─── Route ──────────┬─── Carrier ────────┐
│ Cust Rate   $3,200 │ Trip Mi    847      │ Carrier Pay $2,560 │
│ Margin      $640   │ RPM        $3.78/mi │ Cost/Mi     $0.58  │
│ Min Book    $2,800 │                     │                    │
└────────────────────┴─────────────────────┴────────────────────┘
```

When a driver is selected and deadhead miles are known, the Route group expands:

```
┌─── Revenue ────────┬─── Route ──────────┬─── Carrier ────────┐
│ Cust Rate   $3,200 │ Trip Mi    847      │ Carrier Pay $2,560 │
│ Margin      $640   │ RPM        $3.78/mi │ Cost/Mi     $0.58  │
│ Min Book    $2,800 │ +112 DH  (959 tot) │                    │
│                    │ Tot RPM    $3.34/mi │                    │
└────────────────────┴─────────────────────┴────────────────────┘
```

## Component Choices

- **Existing:** `KpiCell` from `components/Typography` — used for individual label/value pairs
- **Existing:** `DetailLayout` `summary` prop — already renders the bar
- **New:** `KpiGroup` — lightweight wrapper: `Stack direction="row" spacing={2}` with an optional group label (tiny, uppercase, tertiary text above the cluster). Separated by `Divider orientation="vertical" flexItem`.
- No new shared components needed beyond `KpiGroup` (which is specific to this page, defined inline or in the page's `components/` folder).

## Groups

### Group 1: Revenue

Always visible once `loadType` is selected.

| UI Label | API Field / Source | Format | Visibility |
|----------|-------------------|--------|------------|
| Cust Rate | `financials.customerRate` | `$X,XXX` (compact currency, no decimals) | Always |
| Margin | `financials.grossMargin` | `$X,XXX` — color-coded by margin threshold (green >= 20%, amber >= 10%, red < 10%) | Always |
| Min Book | `financials.minBookRate` | `$X,XXX.XX` or `—` if null | Always |

### Group 2: Route

Trip Miles always visible once route is calculated. Deadhead row appears only when `deadheadMiles > 0`.

| UI Label | API Field / Source | Format | Visibility |
|----------|-------------------|--------|------------|
| Trip Mi | `financials.tripMiles` (was `totalMiles`) | `X,XXX` (integer, no unit suffix) | Always (once stops have coordinates) |
| RPM | `financials.ratePerMile` | `$X.XX/mi` | Always (when tripMiles > 0 and customerRate > 0) |
| +DH (total) | `financials.deadheadMiles` / `financials.totalMiles` | `+XXX DH (X,XXX tot)` — tertiary text style | Only when deadheadMiles > 0 |
| Tot RPM | `financials.ratePerTotalMile` | `$X.XX/mi` — tertiary text style | Only when deadheadMiles > 0 |

**Deadhead row styling:** Tertiary text (smaller font, grey-400). The `+112 DH` prefix distinguishes it from trip miles. Parenthetical `(959 tot)` gives the combined total. `Tot RPM` uses the same tertiary style to signal it's a secondary metric.

### Group 3: Carrier

Always visible once `loadType` is selected.

| UI Label | API Field / Source | Format | Visibility |
|----------|-------------------|--------|------------|
| Carrier Pay | `financials.carrierPay` | `$X,XXX.XX` | Always |
| Cost/Mi | `financials.avgCostPerMile` | `$X.XX/mi` or `—` if null | Always |

## Information Hierarchy

- **Primary** (semibold, text.primary): Values — `$3,200`, `847`, `$3.78/mi`
- **Secondary** (normal weight, text.secondary): Labels — `Cust Rate`, `Trip Mi`, `RPM`
- **Tertiary** (caption size, grey.400): Deadhead annotation — `+112 DH (959 tot)`, `Tot RPM $3.34/mi`

## States

- **No load type selected:** Summary bar not rendered (existing behavior)
- **Load type selected, no stops:** Trip Mi shows `—`, RPM shows `—`
- **Stops entered, route calculated:** Trip Mi and RPM populate
- **Driver selected, no location:** No deadhead row (trip miles only)
- **Driver selected, location known:** Deadhead row appears with animation (fade-in, 200ms)
- **Driver removed:** Deadhead row fades out, reverts to trip-only display

## Responsive Behavior

- **>1200px:** Three groups side-by-side with vertical dividers
- **768-1200px:** Three groups, tighter spacing, labels abbreviated if needed
- **<768px:** Groups stack vertically (Revenue, Route, Carrier), horizontal dividers between groups

## FinancialSummary Type Changes

The `FinancialSummary` interface needs updating to support the grouped display:

```typescript
interface FinancialSummary {
  customerRate: number;
  grossMargin: number;
  marginPct: number;
  ratePerMile: number;        // Trip RPM (customerRate / tripMiles)
  tripMiles: number;          // renamed from totalMiles
  deadheadMiles: number;      // new — 0 when unknown
  totalMiles: number;         // new — tripMiles + deadheadMiles
  ratePerTotalMile: number;   // new — customerRate / totalMiles
  minBookRate: number | null;
  avgCostPerMile: number | null;
  carrierPay: number;
}
```
