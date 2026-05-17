# LoadDetailsSection — Trip Miles Field

## Screen Purpose

The LoadDetailsSection is the first form section in CreateLoadForm. It collects rate, equipment, customer, and route information. The miles field change: rename "Total Miles (auto from route)" to "Trip Miles", make it the only miles-related form field. Deadhead and total miles are not form fields — they're displayed in the summary bar header only.

## Layout Change

Current last row of the grid (4-column):

```
┌────────────┬────────────┬────────────┬────────────┐
│ Pay Terms  │ Equip Type │ Total Miles│            │
│            │            │ (auto from │            │
│            │            │  route)    │            │
└────────────┴────────────┴────────────┴────────────┘
```

New last row:

```
┌────────────┬────────────┬────────────┬────────────┐
│ Pay Terms  │ Equip Type │ Trip Miles │            │
│            │            │ 847        │            │
└────────────┴────────────┴────────────┴────────────┘
```

The field stays in the same grid position (`xs={12} md={3}`). Only the label and underlying formik field change.

## Component Choice

- **Existing:** `TextField` from `@mocho/ui/components` — same component, new label and field name
- No new components needed

## Field Specification

| Attribute | Value |
|-----------|-------|
| Form field name | `loadedMiles` (was `totalMiles`) |
| Label | `Trip Miles` |
| Helper text | `Auto-calculated from route` (shown when value came from route API) |
| Type | number, integer, min 0 |
| Auto-population | `useRouteDistance` hook sets `calculatedTotalMiles` → useEffect copies to `loadedMiles` |
| Editable | Yes — dispatcher can override the route API value |
| Required | No (optional field) |

## Interaction Behavior

1. **Before stops entered:** Field is empty, placeholder `—`
2. **Stops entered, route calculated:** Field auto-populates with route distance (e.g., `847`). Helper text shows "Auto-calculated from route"
3. **User manually edits:** Value changes, helper text changes to "Manual override" (subtle indicator that route value was overridden)
4. **Route recalculated (stops change):** If user hasn't manually edited, field updates. If user has overridden, field does NOT update (preserve manual value). A small "Reset to route" link appears in helper text.

## Formik Schema Changes

In `loadSchema.ts`:
- `loadedMiles` validation stays as-is: `Yup.number().min(0)`
- `totalMiles` removed from form schema (no longer a form field — computed server-side)
- `calculatedTotalMiles` renamed to `calculatedTripMiles` for clarity (internal UI-only field)

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|--------------------|--------|
| Trip Miles | `loadedMiles` | integer |

## States

- **Empty:** No stops with coordinates yet. Field shows `—` placeholder.
- **Auto-populated:** Route API returned distance. Shows value with helper text.
- **Manual override:** User typed a value. Helper text indicates override.
- **Loading:** Route API is calculating. Field shows current value (or empty) with a subtle loading indicator on the helper text ("Calculating route...").
- **Error:** Route API failed. Field stays empty or keeps last value. No error shown (graceful degradation — user can enter manually).
