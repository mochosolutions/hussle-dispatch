# ExpiryBadge

## Purpose

A small reusable chip that surfaces a document's `expiresAt` date as a colored, icon-paired status indicator. Rendered inside `DocumentTable` rows (Expires column) and in the `DocumentDetailDrawer` metadata section. Designed to be used anywhere a doc with an expiry surfaces in the future (carrier insurance overview, driver compliance summary, etc.) without modification.

## Layout

A single MUI `Chip`, `size="small"`, `variant="filled"`, with an icon on the left and a text label.

```
[icon]  Expired                ← red    (past expiresAt)
[icon]  Expires in 5 days      ← red    (1–7 days remaining)
[icon]  Expires in 22 days     ← amber  (8–30 days remaining)
                                ← (no badge)   (> 30 days OR null/undefined)
```

## Component

### Props

```typescript
interface ExpiryBadgeProps {
  expiresAt: Date | string | null | undefined;
}
```

### Returns

- `null` when `expiresAt` is null/undefined or the threshold > 30 days from "now".
- Otherwise an MUI `Chip` with:
  - `size="small"`
  - `variant="filled"`
  - `color`:
    - `error` for expired (`< now`) or 1–7 days
    - `warning` for 8–30 days
  - `icon`:
    - `<ErrorOutlineIcon />` for `error` color (expired or 1–7 days)
    - `<WarningAmberOutlinedIcon />` for `warning` color (8–30 days)
  - `label`:
    - `"Expired"` when past
    - `"Expires today"` when 0 days (clamped)
    - `"Expires in 1 day"` (singular) when 1 day
    - `"Expires in N days"` otherwise
- `aria-label` is identical to the visible label so screen readers don't repeat the icon.

## Threshold Logic

| Days remaining (now → expiresAt) | Result                       | Color    |
|----------------------------------|------------------------------|----------|
| `< 0`                            | "Expired"                    | error    |
| `0`                              | "Expires today"              | error    |
| `1`                              | "Expires in 1 day"           | error    |
| `2 – 7`                          | "Expires in N days"          | error    |
| `8 – 30`                         | "Expires in N days"          | warning  |
| `> 30`                           | _(null — no badge)_          | _n/a_    |

Days are computed as `differenceInCalendarDays(expiresAt, new Date())` from `date-fns` so DST and time-of-day quirks don't move the boundary.

## Usage

```tsx
import { ExpiryBadge } from 'features/documents/components/ExpiryBadge';

// In DocumentTable expires cell renderer:
<Stack direction="row" spacing={1} alignItems="center">
  <Body>{value ? format(new Date(value), 'MMM d, yyyy') : '—'}</Body>
  <ExpiryBadge expiresAt={value} />
</Stack>

// In DocumentDetailDrawer metadata DetailRow:
<DetailRow label="Expires" value={
  <Stack direction="row" spacing={1} alignItems="center">
    <Body>{format(new Date(doc.expiresAt), 'MMM d, yyyy')}</Body>
    <ExpiryBadge expiresAt={doc.expiresAt} />
  </Stack>
} />
```

## Visible Data Fields

| UI Label                  | Expected API Field | Format / Notes                                                     |
|---------------------------|--------------------|--------------------------------------------------------------------|
| Expired / Expires in N days | `expiresAt`        | ISO date or `Date`. Null = no badge. Computed via `differenceInCalendarDays`. |

## Accessibility

- Both color **and** icon **and** text are present — never relies on color alone.
- Icon is decorative (`aria-hidden="true"` via the MUI Chip default for `icon` prop).
- `aria-label` on the `Chip` matches the label text for unambiguous screen-reader output.

## States

- **No expiry** (`null`/`undefined`) — component returns `null`. Parent layout should handle the absence (e.g., render an em-dash in the date cell, no chip beside it).
- **Far future** (`> 30 days`) — also `null`. Same parent behavior.
- **All other states** — single chip variant per the table above. No transitions, no loading state.

## Out of Scope

- A `DurationBadge` variant for non-expiry durations (e.g., "Created 5 days ago"). If needed later, factor common formatting into a shared util.
- Configurable thresholds via props. The 30/7/0-day boundaries are intentionally hard-coded to keep the visual language consistent across the app. If a future feature needs different thresholds, fork or parametrize then.
