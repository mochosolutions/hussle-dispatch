# Design Spec — General Tab (read-only sections)

> Screen: General settings tab — read-only display sections + per-section edit pencils
> New file: `src/features/settings/components/SettingsPage/GeneralTab.tsx`
> Replaces: the always-editable inline Formik form + single "Save Settings" button.

## Purpose

Show the org's current settings as scannable read-only sections, mirroring every other
detail surface in the app (`SectionCard` + `SectionHeader` + `DetailRow`). Editing moves
into per-section drawers opened from an Edit pencil (admin only). No page-level Save button.

## Layout

A single `Stack spacing={3}` of `SectionCard`s, `maxWidth: 800` (matches TeamTab's column),
left-aligned in the content zone:

```
[error banner — only when settings fetch failed]

SectionCard
  SectionHeader "FINANCIAL SETTINGS"            ✎ Edit  (admin only)
  DetailRow  Default TONU Fee          $250
  DetailRow  Default Detention Rate    $75/hr
  DetailRow  Detention Free Hours      2
  DetailRow  Min Book Rate Margin      15%
  DetailRow  Weekly Gross Target       $5,000

SectionCard
  SectionHeader "OPERATIONS SETTINGS"           ✎ Edit
  DetailRow  Default Max Days Out      14
  DetailRow  Chain Depth Threshold     250 mi
  DetailRow  Backhaul Search Radius    150 mi
  DetailRow  Auto Scraping             Enabled
  DetailRow  Prohibited Commodities    [chip][chip][chip]   (or "None")

SectionCard
  SectionHeader "COMMUNICATION"                 ✎ Edit
  DetailRow  Load Intel Email          intel@acme.com   (or —)
  DetailRow  SES From Email            no-reply@acme.com (or —)
  DetailRow  Company Logo URL          https://…        (or —)

SectionCard
  SectionHeader "DRIVER COMMUNICATIONS"         ✎ Edit
  DetailRow  Pre-Pickup Lead           60 min
  DetailRow  Transit Interval          180 min
  DetailRow  Post-Pickup Escalation    30 min
  DetailRow  Cooldown                  15 min

SectionCard   (admin-only section — hidden entirely for non-admins)
  SectionHeader "HEADQUARTERS LOCATION"         ✎ Edit
  DetailRow  Latitude                  34.0522    (or "Not set")
  DetailRow  Longitude                 -118.2437  (or "Not set")
```

## Components (reused vs new)

| Component | Source | Reuse / New |
|-----------|--------|-------------|
| `SectionCard` | `components/SectionCard` | reuse |
| `SectionHeader` | `components/SectionHeader` | reuse — `title` + optional `onEdit` pencil |
| `DetailRow` | `components/Typography` | reuse — `{ label, value }` key-value rows |
| `Chip` (commodities) | `@mui/material` | reuse — small, outlined |
| error banner (`MainCard` + `ErrorText`) | existing | reuse |

> **Section title casing:** `SectionHeader` already uppercases + tracks the title via its
> own styles — pass plain title strings ("Financial Settings"); it renders them uppercase.

## Value formatting (decided: formatted with units)

| Field | Source key | Display | Empty/Null |
|-------|-----------|---------|-----------|
| Default TONU Fee | `defaultTonuFee` | `$250` (currency, no decimals) | — |
| Default Detention Rate | `defaultDetentionRate` | `$75/hr` | — |
| Detention Free Hours | `detentionFreeHours` | `2` | — |
| Min Book Rate Margin | `minBookRateProfitMargin` | `15%` (stored 0.15 → ×100, round) | — |
| Weekly Gross Target | `weeklyGrossTarget` | `$5,000` (thousands separator) | — |
| Default Max Days Out | `defaultMaxDaysOut` | `14` | — |
| Chain Depth Threshold | `chainDepthThresholdMiles` | `250 mi` | — |
| Backhaul Search Radius | `backhaulSearchRadiusMiles` | `150 mi` | — |
| Auto Scraping | `autoScrapingEnabled` | `Enabled` / `Disabled` | — |
| Prohibited Commodities | `prohibitedCommodities` | row of outlined `Chip`s | `None` |
| Load Intel Email | `loadIntelEmailAddress` | the email string | `—` |
| SES From Email | `sesFromEmail` | the email string | `—` |
| Company Logo URL | `companyLogoUrl` | the URL string (plain text) | `—` |
| Pre-Pickup Lead | `smsPrePickupLeadMinutes` | `60 min` | — |
| Transit Interval | `smsTransitIntervalMinutes` | `180 min` | — |
| Post-Pickup Escalation | `smsPostPickupEscalationMinutes` | `30 min` | — |
| Cooldown | `smsCooldownMinutes` | `15 min` | — |
| HQ Latitude | `headquartersLatitude` | number as-is | `Not set` |
| HQ Longitude | `headquartersLongitude` | number as-is | `Not set` |

- Currency: `$` + `toLocaleString` thousands grouping, no cents.
- Margin: the stored decimal is multiplied by 100 for display (and divided back in the
  drawer payload) — same transform the old inline form used.
- Use existing currency/number helpers from `utils/` if present; do **not** add a new
  formatter inside this feature file (per utility-discovery rule).

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|--------------------|--------|
| Default TONU Fee | `defaultTonuFee` | currency `$n` |
| Default Detention Rate | `defaultDetentionRate` | currency `$n/hr` |
| Detention Free Hours | `detentionFreeHours` | integer |
| Min Book Rate Margin | `minBookRateProfitMargin` | percent (`×100`) |
| Weekly Gross Target | `weeklyGrossTarget` | currency `$n` |
| Default Max Days Out | `defaultMaxDaysOut` | integer |
| Chain Depth Threshold | `chainDepthThresholdMiles` | `n mi` |
| Backhaul Search Radius | `backhaulSearchRadiusMiles` | `n mi` |
| Auto Scraping | `autoScrapingEnabled` | Enabled/Disabled |
| Prohibited Commodities | `prohibitedCommodities` | chips / "None" |
| Load Intel Email | `loadIntelEmailAddress` | string / "—" |
| SES From Email | `sesFromEmail` | string / "—" |
| Company Logo URL | `companyLogoUrl` | string / "—" |
| Pre-Pickup Lead | `smsPrePickupLeadMinutes` | `n min` |
| Transit Interval | `smsTransitIntervalMinutes` | `n min` |
| Post-Pickup Escalation | `smsPostPickupEscalationMinutes` | `n min` |
| Cooldown | `smsCooldownMinutes` | `n min` |
| HQ Latitude | `headquartersLatitude` | number / "Not set" |
| HQ Longitude | `headquartersLongitude` | number / "Not set" |

(No API changes — these are the existing `OrgSettings` fields read from the store.)

## Role behavior

- **Admin:** every `SectionHeader` receives `onEdit` → the Edit pencil renders → opens that
  section's drawer (`section-edit-drawers.md`).
- **Dispatcher:** `onEdit` is **omitted** (`SectionHeader` hides the pencil when `onEdit`
  is undefined) → sections are display-only, no drawer is reachable. The **Headquarters
  Location** section is hidden entirely for non-admins (it was already admin-gated).
- This replaces the prior "disabled fields + hidden Save" model — that code is removed.

## States

- **Loading (settings not yet fetched):** render skeleton section cards (e.g. 3–5 `Skeleton`
  rows per card) rather than an empty page or a full-page spinner — preserves layout
  stability. Drive off `selectSettingsLoading`.
- **Error:** the existing `selectSettingsError` banner (`MainCard` `error.lighter` +
  `ErrorText role="alert"`) renders at the top of the tab, above the sections.
- **Empty:** settings always exist for an org once loaded; no dedicated empty state.

## Interactions

- Click **Edit** pencil → `useDrawerActions().openDrawer('<sectionDrawer>')` (IDs/no args
  needed — drawers read current settings from the store). One drawer per section.
- After a successful save the section's `DetailRow` values update reactively from the store
  (the drawer dispatches `updateSettingsRequest`; the entity updates; this tab re-renders).

## Responsive

`maxWidth: 800` single column. `DetailRow` is already label/value responsive. Chips wrap.
No bespoke breakpoints.
