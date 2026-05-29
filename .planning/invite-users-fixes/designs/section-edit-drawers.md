# Design Spec — Section Edit Drawers (General tab)

> Screens: 5 right-anchored edit drawers, one per General-tab section
> New files: `src/features/settings/components/Settings{Financial,Operations,Communication,DriverComms,Headquarters}Drawer/index.tsx`
> Analog: carrier `CompanyInfoDrawer` (`src/features/carrier/components/CompanyInfoDrawer/index.tsx`)

## Purpose

Each section's Edit pencil opens a focused drawer holding just that section's fields,
pre-filled from current settings, saving the full merged settings object via
`updateSettingsRequest`. The parent settings page stays visible behind the drawer
(drawer is the correct affordance — user references the page while editing).

## Pattern correction (important for /build)

The plan/PATTERNS.md name the analog as "`EditDrawer` + Formik." The **actual**
`CompanyInfoDrawer` uses **`FormDrawer`** (`mocho/components/FormDrawer`) — a render-prop
drawer that owns Formik internally and has dirty-form blocking built in:

```tsx
<FormDrawer
  open
  onClose={onClose}
  title="Edit Financial Settings"
  subtitle="Organization settings"
  initialValues={initialValues}
  validationSchema={settingsSchema /* or a section-scoped subset */}
  onSubmit={(values) => dispatch(updateSettingsRequest({ values: mergedPayload }))}
>
  {(formik) => (
    <Stack spacing={2.5} sx={{ p: 3 }}>
      {/* this section's fields, receiving formik */}
    </Stack>
  )}
</FormDrawer>
```

Mirror **`FormDrawer`** (the real pattern), not the literal `EditDrawer` name. `FormDrawer`
already satisfies the CLAUDE.md dirty-form-blocking requirement.

## Common drawer contract

- Props: `{ onClose: () => void }`. No entity id — there is one settings object per org;
  the drawer reads it via `useSelector(selectSettings)`.
- `initialValues`: built from current settings for **this section's fields only** (reuse the
  relevant slice of the existing `buildInitialValues` logic, incl. the margin `×100` and
  coord-normalization transforms).
- `onSubmit`: overlay the section's edited fields onto the **current full settings object**
  and dispatch `updateSettingsRequest({ values: <merged full object> })` — the `PUT /settings`
  endpoint is a full-object update (`updateSettingsSchema`). (If /build finds the validator
  accepts partials, simplify to a per-section payload — confirm against the schema.)
- On success the saga closes the flow / the drawer's `onClose` fires; the General tab's
  display rows reflect the new values from the store. Reuse existing
  `selectSettingsSaving` for the submit button's loading state if `FormDrawer` exposes it;
  otherwise rely on `FormDrawer`'s own submit handling.
- Width: **480px** standard right-anchored drawer.
- Fields: reuse the existing mocho form fields already used by the old inline form
  (`TextField`, `EmailField`, the `Switch`, the prohibited-commodities chip input, and the
  `DriverCommunicationsSettings` fields). No new field components.

## The five drawers

### 1. `SettingsFinancialDrawer` — "Edit Financial Settings"
Fields (all `type="number"`, required):
`defaultTonuFee`, `defaultDetentionRate`, `detentionFreeHours`,
`minBookRateProfitMargin` (shown as %, ÷100 on submit), `weeklyGrossTarget`.
Layout: two-up `Grid` rows like the current Financial section.

### 2. `SettingsOperationsDrawer` — "Edit Operations Settings"
Fields: `defaultMaxDaysOut`, `chainDepthThresholdMiles`, `backhaulSearchRadiusMiles`
(numbers, required); `autoScrapingEnabled` (`Switch` + `FormControlLabel`);
`prohibitedCommodities` (the existing chip-input: type + Enter to add, chip `onDelete`
to remove). Reuse the `handleAddCommodity` / `handleRemoveCommodity` logic verbatim.

### 3. `SettingsCommunicationDrawer` — "Edit Communication"
Fields: `loadIntelEmailAddress` (`EmailField`), `sesFromEmail` (`EmailField`),
`companyLogoUrl` (`TextField`).

### 4. `SettingsDriverCommsDrawer` — "Edit Driver Communications"
Renders the existing `DriverCommunicationsSettings` component inside the drawer
(`formikProps` + no `disabled`) — it already wraps the four SMS-timing fields
(`smsPrePickupLeadMinutes`, `smsTransitIntervalMinutes`,
`smsPostPickupEscalationMinutes`, `smsCooldownMinutes`).

### 5. `SettingsHeadquartersDrawer` — "Edit Headquarters Location"
Fields: `headquartersLatitude`, `headquartersLongitude` (`type="number"`, optional;
placeholders "-90 to 90" / "-180 to 180"). Keep the helper copy: "Set both latitude and
longitude to enable headquarters-based deadhead calculations. Leave both empty to disable."
Coord normalization (`'' → null`) applied on submit. **Admin-only** (its pencil only shows
for admins; section hidden for dispatchers).

## Visible Data Fields

Same field set as `general-tab.md`, grouped by drawer above — these are the editable inputs.
No new API fields; the merged payload is the existing `SettingsFormValues` shape.

## States

- **Open:** pre-filled from current settings.
- **Dirty close:** `FormDrawer`'s built-in dirty-form confirmation prompts before discarding.
- **Submitting:** submit button shows loading; fields disabled briefly during submit
  (handled by `FormDrawer` / `SubmitButton`).
- **Validation:** Yup (`settingsSchema` / section subset) — inline field errors on blur,
  cross-field on submit. Same messages as the current schema.
- **Save failure:** the settings saga dispatches the failure toast (existing behavior); the
  drawer stays open so the user can retry.

## Registration (per CLAUDE.md drawer checklist)

- Add 5 `DrawerType` literals + `DrawerTypeMap` entries in
  `src/features/ui/types/popupTypes.ts` (near `carrierCompanyInfo`). Prop shape: `{}` /
  `{ onClose }` only — no ids.
- Register all 5 in `src/features/ui/drawerRegistry.ts`.
- Open via `useDrawerActions().openDrawer('settingsFinancial')` (etc.); close via the
  `onClose` from `DrawerManager` — never `useState`.

## Interaction flow

1. Admin clicks a section's Edit pencil → `openDrawer('<section>')`.
2. Drawer slides in (480px, right), fields pre-filled.
3. Edit → Save → `updateSettingsRequest` (full merged object) → drawer closes → display rows update.
4. Closing with unsaved edits → dirty-form confirmation dialog.

## Responsive

Standard 480px drawer; below `sm` the drawer is full-width (FormDrawer default). Two-up
field grids collapse to single column on narrow widths.
