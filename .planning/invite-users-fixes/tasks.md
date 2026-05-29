# Invite Users — Settings Layout / Table / Editing-Flow Alignment Tasks
_Last updated: 2026-05-29 05:10_
_Plan: .planning/invite-users-fixes/plan.md_
_Designs: .planning/invite-users-fixes/designs/_
_Contract: none (frontend-only, no API changes)_

> Scope: dispatch-ui only. Pure presentational/layout refactor — no model, saga, action,
> or API changes. All stories use the **frontend** agent. No INT story (single package).

---

## US-01: General tab — read-only sections + per-section edit drawers
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: —_

Replaces the always-editable inline General form with read-only `SectionCard` +
`SectionHeader` (admin-only Edit pencil) + `DetailRow` sections, plus five per-section
`FormDrawer`-based edit drawers. Design: `designs/general-tab.md`, `designs/section-edit-drawers.md`.

must_haves:
  truths:
    - "An admin viewing the General tab sees 5 read-only sections (Financial, Operations, Communication, Driver Communications, Headquarters) with current values formatted with units ($250, 15%, 250 mi, Enabled, 60 min), each with an Edit pencil."
    - "A dispatcher viewing the General tab sees the same sections read-only with NO Edit pencils, and the Headquarters section is absent; no edit drawer can be opened."
    - "Clicking a section's Edit pencil opens a right-anchored FormDrawer pre-filled from current settings; saving dispatches updateSettingsRequest with the full merged settings object and the section's display rows reflect the new values."
    - "Closing a drawer with unsaved edits prompts the dirty-form confirmation (inherited from FormDrawer/EditDrawer)."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/settings/components/SettingsPage/GeneralTab.tsx
      provides: "Read-only General tab: 5 SectionCard sections with DetailRow rows + admin-only Edit pencils; dispatches fetchSettingsRequest on mount; renders settings error banner + skeleton loading."
    - path: hussle-app-dispatch-ui/src/features/settings/utils/settingsFormValues.ts
      provides: "buildSettingsFormValues(settings) + toUpdateSettingsPayload(values) — shared field defaults + margin(×/÷100) & coord-normalization transforms reused by all drawers."
    - path: hussle-app-dispatch-ui/src/features/settings/components/SettingsFinancialDrawer/index.tsx
      provides: "FormDrawer editing defaultTonuFee, defaultDetentionRate, detentionFreeHours, minBookRateProfitMargin (%), weeklyGrossTarget."
    - path: hussle-app-dispatch-ui/src/features/settings/components/SettingsOperationsDrawer/index.tsx
      provides: "FormDrawer editing defaultMaxDaysOut, chainDepthThresholdMiles, backhaulSearchRadiusMiles, autoScrapingEnabled (Switch), prohibitedCommodities (chip input)."
    - path: hussle-app-dispatch-ui/src/features/settings/components/SettingsCommunicationDrawer/index.tsx
      provides: "FormDrawer editing loadIntelEmailAddress, sesFromEmail, companyLogoUrl."
    - path: hussle-app-dispatch-ui/src/features/settings/components/SettingsDriverCommsDrawer/index.tsx
      provides: "FormDrawer editing the 4 SMS-timing fields by reusing DriverCommunicationsSettings."
    - path: hussle-app-dispatch-ui/src/features/settings/components/SettingsHeadquartersDrawer/index.tsx
      provides: "FormDrawer editing headquartersLatitude/Longitude (admin-only)."
  key_links:
    - from: GeneralTab
      to: useDrawerActions().openDrawer
      via: "SectionHeader onEdit (admin only) → openDrawer('settingsFinancial' | 'settingsOperations' | 'settingsCommunication' | 'settingsDriverComms' | 'settingsHeadquarters')"
    - from: Settings*Drawer
      to: updateSettingsRequest
      via: "FormDrawer onSubmit → dispatch(updateSettingsRequest({ values: toUpdateSettingsPayload(merged) }))"
    - from: Settings*Drawer
      to: selectSettings
      via: "useSelector(selectSettings) → buildSettingsFormValues for initialValues"
    - from: GeneralTab
      to: isAdminSelector
      via: "useSelector → gates whether SectionHeader.onEdit is passed and whether Headquarters section renders"

**Acceptance Criteria:**
- [x] General tab shows read-only `DetailRow` sections (no inline form, no page-level Save button).
- [x] Each section (admin only) has an Edit pencil that opens its `FormDrawer`.
- [x] Each drawer pre-fills from current settings, saves via `updateSettingsRequest` (full merged object), closes on success, and prompts on dirty-close.
- [x] Saved values appear immediately in the section's display rows.
- [x] A dispatcher sees sections read-only with no Edit pencils and the Headquarters section hidden.
- [x] Values render formatted with units per `designs/general-tab.md` (currency, %, mi, min, Enabled/Disabled, chips, "—"/"Not set").

**Tasks:**
[x] T-01 [UI] Build GeneralTab read-only sections + shared form-values util
         └─ Detail: Create `features/settings/components/SettingsPage/GeneralTab.tsx`.
            Dispatch `fetchSettingsRequest()` on mount (move it off SettingsPage). Read
            `selectSettings`, `selectSettingsLoading`, `selectSettingsError`, `isAdminSelector`.
            Render a `Stack spacing={3}` (maxWidth 800) of `SectionCard`s, each with
            `SectionHeader` (title + `onEdit` pencil passed ONLY when admin) and `DetailRow`
            rows. Sections + fields + formatting per `designs/general-tab.md` Visible Data
            Fields table: Financial, Operations (commodities as outlined Chips / "None"),
            Communication ("—" fallback), Driver Communications, Headquarters (admin-only
            section; lat/lng or "Not set"). Format: currency `$n` (toLocaleString, no cents),
            `$n/hr`, `n%` (margin ×100), `n mi`, `n min`, Enabled/Disabled. Loading → skeleton
            section rows (Skeleton); error → existing MainCard error.lighter + ErrorText banner
            at top. Also create `features/settings/utils/settingsFormValues.ts` exporting
            `buildSettingsFormValues(settings: OrgSettings | null): SettingsFormValues` (port
            the defaults from the old SettingsPage `buildInitialValues`, margin ×100) and
            `toUpdateSettingsPayload(values: SettingsFormValues): SettingsFormValues` (margin
            ÷100 + coord '' → null normalization). Use existing currency helper from `utils/`
            if one exists (search first); do not inline a new formatter in the feature file.
            Wire Edit pencils to `useDrawerActions().openDrawer(...)` (drawer keys created in T-03).
         └─ Files: [hussle-app-dispatch-ui/src/features/settings/components/SettingsPage/GeneralTab.tsx, hussle-app-dispatch-ui/src/features/settings/utils/settingsFormValues.ts]
         └─ Depends on: —
         └─ Output:

[x] T-02 [UI] Build the 5 section edit drawers (FormDrawer)
         └─ Detail: Create 5 drawer components mirroring the REAL `CompanyInfoDrawer`
            pattern = `FormDrawer` (from `mocho/components/FormDrawer`), NOT a literal
            `EditDrawer`. Each: props `{ onClose }` (DrawerManager injects onClose); read
            `useSelector(selectSettings)` (return null if absent); `initialValues` =
            `buildSettingsFormValues(settings)` (full object, so the merged PUT is complete);
            `validationSchema = settingsSchema`; render-prop child renders ONLY that section's
            fields (reuse existing `TextField`/`EmailField`/`Switch`/chip input from the old
            inline form + `DriverCommunicationsSettings` for the SMS drawer); `onSubmit` →
            `dispatch(updateSettingsRequest({ values: toUpdateSettingsPayload(values) }))`
            then `onClose()`. Width 480. Titles: "Edit Financial Settings" / "Edit Operations
            Settings" / "Edit Communication" / "Edit Driver Communications" / "Edit
            Headquarters Location". Fields per `designs/section-edit-drawers.md` §"The five
            drawers". Operations drawer: port `handleAddCommodity`/`handleRemoveCommodity`
            chip logic + `autoScrapingEnabled` Switch. DriverComms drawer: render
            `<DriverCommunicationsSettings formikProps={formik} />` directly. Headquarters
            drawer keeps the helper copy + placeholders.
         └─ Files: [hussle-app-dispatch-ui/src/features/settings/components/SettingsFinancialDrawer/index.tsx, hussle-app-dispatch-ui/src/features/settings/components/SettingsOperationsDrawer/index.tsx, hussle-app-dispatch-ui/src/features/settings/components/SettingsCommunicationDrawer/index.tsx, hussle-app-dispatch-ui/src/features/settings/components/SettingsDriverCommsDrawer/index.tsx, hussle-app-dispatch-ui/src/features/settings/components/SettingsHeadquartersDrawer/index.tsx]
         └─ Depends on: T-01
         └─ Output:

[x] T-03 [WIRE] Register 5 drawers in drawerRegistry + popupTypes
         └─ Detail: In `features/ui/types/popupTypes.ts` add 5 `DrawerType` literals
            (`settingsFinancial`, `settingsOperations`, `settingsCommunication`,
            `settingsDriverComms`, `settingsHeadquarters`) and 5 `DrawerTypeMap` entries
            each typed `Record<string, never>` (no id needed — drawers read settings from
            store; onClose injected by DrawerManager — mirror `expenseQuickAdd`). In
            `features/ui/drawerRegistry.ts` import the 5 drawer components and add 5 registry
            entries. Verify `openDrawer('settingsFinancial', {})` type-checks.
         └─ Files: [hussle-app-dispatch-ui/src/features/ui/types/popupTypes.ts, hussle-app-dispatch-ui/src/features/ui/drawerRegistry.ts]
         └─ Depends on: T-02
         └─ Output:

[x] T-04 [TEST] GeneralTab smoke test
         └─ Detail: Add `features/settings/components/SettingsPage/__tests__/GeneralTab.test.tsx`.
            Render with a mock store (admin) → asserts section titles render and at least one
            Edit pencil (button name /edit/i) is present + a formatted value (e.g. "$250").
            Render as dispatcher → asserts NO Edit pencils and Headquarters section absent.
            Use `renderWithTheme`/test-utils + a mock redux store per testing conventions.
         └─ Files: [hussle-app-dispatch-ui/src/features/settings/components/SettingsPage/__tests__/GeneralTab.test.tsx]
         └─ Depends on: T-01
         └─ Output:

---

## US-02: Team tab — Members & Invitations on NewDataGrid
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: —_

Migrate `MemberTable` + `InvitationTable` from raw MUI `<Table>` to `NewDataGrid` with
co-located cell renderers, keeping all existing Redux actions. Remove the inner Invite
button from `TeamTab` (it moves to the topbar in US-03). Design: `designs/team-tab.md`.

must_haves:
  truths:
    - "Members and Pending Invitations render as NewDataGrid grids (rowHeight 56, headerHeight 44, pagination true, pageSize 25, domLayout normal) visually consistent with the Contacts grid."
    - "Changing a member's role dispatches changeMemberRoleRequest; Remove opens the existing ConfirmDialog then dispatches removeMemberRequest; the current user's own row has no Remove."
    - "Resend/Revoke dispatch resendInvitationRequest/revokeInvitationRequest and disable while that row's op is Pending; expiry shows 'Expired' (error) or 'in N day(s)'."
    - "Row actions render as TEXT buttons (Resend/Revoke/Remove), not icon ActionsCell."
    - "The TeamTab no longer renders its own Invite Member button; the 'N of M seats used' line remains."
    - "Empty members grid shows EmptyState; the Pending Invitations card is hidden when there are no invitations."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/settings/components/MemberCellRenderers.tsx
      provides: "Cell renderers: name+email two-line, inline role Select (changeMemberRoleRequest), joined date, text Remove action (hidden for self)."
    - path: hussle-app-dispatch-ui/src/features/settings/components/MemberTable/index.tsx
      provides: "NewDataGrid members grid using MemberCellRenderers + ConfirmDialog for remove."
    - path: hussle-app-dispatch-ui/src/features/settings/components/InvitationCellRenderers.tsx
      provides: "Cell renderers: role chip, expiry text, text Resend/Revoke actions disabled while pending."
    - path: hussle-app-dispatch-ui/src/features/settings/components/InvitationTable/index.tsx
      provides: "NewDataGrid invitations grid using InvitationCellRenderers."
    - path: hussle-app-dispatch-ui/src/features/settings/components/TeamTab/index.tsx
      provides: "Team tab wrapping both grids in MainCard(content={false}); seat-usage line kept; inner Invite button removed."
  key_links:
    - from: MemberCellRenderers role Select
      to: changeMemberRoleRequest
      via: "onChange → dispatch"
    - from: MemberTable Remove
      to: removeMemberRequest
      via: "ConfirmDialog confirm → dispatch"
    - from: InvitationCellRenderers
      to: resendInvitationRequest / revokeInvitationRequest
      via: "text button onClick → dispatch; disabled from loading[resend:id]/[revoke:id]"
    - from: TeamTab
      to: NewDataGrid
      via: "renders MemberTable + InvitationTable grids inside MainCard"

**Acceptance Criteria:**
- [x] `MemberTable` + `InvitationTable` render via `NewDataGrid` with the standard grid options + `EmptyState`.
- [x] Member role change, member remove, invitation resend, invitation revoke all still work; per-row actions disable while their op is pending.
- [x] Cell-rendering logic lives in `MemberCellRenderers.tsx` / `InvitationCellRenderers.tsx`, not inline.
- [x] Row actions are text buttons (deliberate deviation from icon ActionsCell — documented).
- [x] Current user's own member row has no Remove; the Invite button is gone from TeamTab.

**Tasks:**
[x] T-05 [UI] MemberTable → NewDataGrid + MemberCellRenderers
         └─ Detail: Create `features/settings/components/MemberCellRenderers.tsx` with:
            (a) name+email two-line renderer (use `TwoLineCell` or Body/BodyMuted),
            (b) inline role `Select` renderer (keep `ROLE_OPTIONS` admin/dispatcher/viewer/driver)
            dispatching `changeMemberRoleRequest({ membershipId, role })`,
            (c) joined date via `format(new Date(createdAt), 'MMM d, yyyy')`,
            (d) actions renderer: text `Button` "Remove" → calls a callback opening the existing
            `ConfirmDialog`; hidden when `member.userId === currentUserId`.
            Rewrite `MemberTable/index.tsx` to use `NewDataGrid` (import from `@mocho/ui/components`)
            with memoized `columnDefs` (Name 30 / Role 25 / Joined 20 / Actions 25) +
            `gridOptions` (rowHeight 56, headerHeight 44, pagination true, paginationPageSize 25,
            domLayout 'normal', suppressCellFocus true), `loading` prop (drive from existing
            `loading` prop), `noDataComponent={<EmptyState variant="no-results" entityName="Member" compact />}`,
            `showRowCountFooter` + totalRowCount + rowCountLabel="members". Keep the
            `ConfirmDialog` remove flow + `currentUserSelector`. Pass current-user id +
            handlers to renderers via `context`/closure per the ContactListPage pattern.
         └─ Files: [hussle-app-dispatch-ui/src/features/settings/components/MemberCellRenderers.tsx, hussle-app-dispatch-ui/src/features/settings/components/MemberTable/index.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-06 [UI] InvitationTable → NewDataGrid + InvitationCellRenderers
         └─ Detail: Create `features/settings/components/InvitationCellRenderers.tsx` with:
            (a) role `Chip` (outlined, `capitalizeFirst`), (b) expiry renderer using
            `getExpiryText` → `ErrorText` "Expired" or `Meta` "in N day(s)", (c) actions
            renderer: text `Button` "Resend" + error-color "Revoke" dispatching
            `resendInvitationRequest`/`revokeInvitationRequest`, each disabled while
            `loading[resend:id]`/`loading[revoke:id]` === 'Pending'. Rewrite
            `InvitationTable/index.tsx` to `NewDataGrid` columns Name / Email / Role / Sent
            (`MMM d, yyyy`) / Expires / Actions with the standard `gridOptions` +
            `EmptyState` (entityName="Invitation"). Keep reading `state.pages.team.loading`.
            Move `getExpiryText`/`capitalizeFirst` into the renderers file.
         └─ Files: [hussle-app-dispatch-ui/src/features/settings/components/InvitationCellRenderers.tsx, hussle-app-dispatch-ui/src/features/settings/components/InvitationTable/index.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-07 [UI] TeamTab: wrap grids in MainCard, remove inner Invite button
         └─ Detail: In `TeamTab/index.tsx` keep the "Team Members" `SectionTitle` + seat-usage
            `BodyMuted` ("N of M seats used"), but REMOVE the inner `Invite Member` `Button`
            and its `handleInviteClick`/`useModalActions`/`openModal` usage (that logic moves
            to the topbar in US-03 — delete it here, do not just hide it). Wrap `MemberTable`
            in `MainCard(content={false})`; keep the conditional `MainCard title="Pending
            Invitations"` around `InvitationTable` (rendered only when `invitations.length > 0`).
            Keep `fetchTeamRequest` dispatch on mount and the existing members/invitations/usage
            selectors. Constrain width maxWidth 800.
         └─ Files: [hussle-app-dispatch-ui/src/features/settings/components/TeamTab/index.tsx]
         └─ Depends on: T-05, T-06
         └─ Output:

[x] T-08 [TEST] Team grids smoke tests
         └─ Detail: Add `features/settings/components/TeamTab/__tests__/teamGrids.test.tsx`.
            With a mock store: members grid renders a member's name + role Select and changing
            it dispatches `changeMemberRoleRequest`; invitations grid renders Resend/Revoke
            text buttons and clicking them dispatches the matching actions; an expired
            invitation shows "Expired". Use test-utils + mock redux store. Keep assertions
            behavior-level (queries by role/text), not implementation detail.
         └─ Files: [hussle-app-dispatch-ui/src/features/settings/components/TeamTab/__tests__/teamGrids.test.tsx]
         └─ Depends on: T-05, T-06
         └─ Output:

---

## US-03: SettingsPage chrome (ListLayout) + Invite-in-topbar
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-01, US-02_

Re-chrome `SettingsPage` with the app-standard `ListLayout`, render `<GeneralTab/>` and
`<TeamTab/>` inside it, and lift the Invite Member action into the topbar (Team tab only).
Design: `designs/settings-page-chrome.md`.

must_haves:
  truths:
    - "SettingsPage renders PageWrapper(errorContext only, no isLoading) → ListLayout title='Settings' with the standard 56px topbar; no PageHeader, no bare header Box, no inline Formik form, no page-level Save button."
    - "General and Team tabs render via DetailTabBar inside the ListLayout content zone (grey.100, px {xs:2,sm:3}) and switch correctly; dispatcher sees only General."
    - "When the Team tab is active (admin), an 'Invite Member' button appears in the ListLayout topbar primaryAction; on the General tab the slot is empty. Clicking it applies the seat-limit check → opens upgradePlan modal at/over limit else inviteMember modal."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/settings/pages/SettingsPage/index.tsx
      provides: "Thin page: PageWrapper → ListLayout(title='Settings', primaryAction=team-only Invite) → DetailTabBar → GeneralTab/TeamTab. All inline form/formik/buildInitialValues removed."
  key_links:
    - from: SettingsPage
      to: ListLayout
      via: "renders ListLayout title='Settings' with primaryAction"
    - from: SettingsPage
      to: GeneralTab / TeamTab
      via: "renders by activeTab from DetailTabBar"
    - from: SettingsPage Invite button
      to: useModalActions().openModal
      via: "seat-limit check on selectSubscriptionUsage → openModal('upgradePlan'|'inviteMember')"

**Acceptance Criteria:**
- [x] `SettingsPage` renders inside `PageWrapper` → `ListLayout title="Settings"` (no `PageHeader`, no bare header Box, no `isLoading` on PageWrapper).
- [x] Topbar is visually identical to other pages (56px, white, `PageTitle`, border/shadow).
- [x] General/Team tabs render + switch under the new chrome; content in `grey.100` with `px: { xs: 2, sm: 3 }`.
- [x] Dispatcher sees only the General tab; admin sees both.
- [x] Invite Member appears in the topbar only on the Team tab and runs the seat-limit logic.
- [x] The inline General form, formik, and Save button are gone (now in GeneralTab + drawers).

**Tasks:**
[x] T-09 [UI] Re-chrome SettingsPage with ListLayout
         └─ Detail: Rewrite `features/settings/pages/SettingsPage/index.tsx` to:
            `PageWrapper errorContext="SettingsPage"` (NO isLoading) → `ListLayout title="Settings"`.
            Keep `activeTab` state + `visibleTabs` (isAdmin gate) + `DetailTabBar` rendered in
            the content zone, wrapped so panels sit in a `Box px={{ xs: 2, sm: 3 }} py: 3`
            (grey.100 comes from ListLayout). Render `<GeneralTab/>` when activeTab==='general'
            and `<TeamTab/>` when 'team' && isAdmin. DELETE all inline form code: the Formik
            instance, `buildInitialValues`, `formikProps`, `handleAddCommodity`/`handleRemoveCommodity`,
            the SectionCards form, the Save button, and the `fetchSettingsRequest` effect (moved
            to GeneralTab). Remove now-unused imports.
         └─ Files: [hussle-app-dispatch-ui/src/features/settings/pages/SettingsPage/index.tsx]
         └─ Depends on: T-01, T-07
         └─ Output:

[x] T-10 [UI] Lift Invite Member into ListLayout topbar (Team tab only)
         └─ Detail: In the same `SettingsPage/index.tsx`, build a `primaryAction` for
            `ListLayout` that renders the `Invite Member` contained `Button` ONLY when
            `activeTab === 'team'` (admin-only by construction). Re-implement the seat-limit
            handler here: read `selectSubscriptionUsage` + `organizationIdSelector`, use
            `useModalActions().openModal` — if `usage && usage.users.current >= usage.users.limit`
            → `openModal('upgradePlan', { resourceType: 'team members', limit: usage.users.limit })`
            else `openModal('inviteMember', { organizationId: organizationId ?? '' })`. Matches
            the logic removed from TeamTab in T-07. Pass `primaryAction={activeTab === 'team' ? <InviteBtn/> : undefined}`.
         └─ Files: [hussle-app-dispatch-ui/src/features/settings/pages/SettingsPage/index.tsx]
         └─ Depends on: T-09
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Services: dispatch-ui | Agent: review | Status: done | Depends on: US-01, US-02, US-03_

**Verification Checklist:**
- [x] Every AC across US-01/US-02/US-03 is satisfied in code.
- [x] No file overlap regressions; SettingsPage is thin and inline form fully removed.
- [x] Drawers registered + typed; openDrawer keys match registry keys.
- [x] Grids use the standard NewDataGrid options; renderers co-located; existing Redux actions unchanged.
- [x] Dispatcher read-only path: no Edit pencils, Headquarters hidden, Team tab hidden.
- [x] `npm run lint` + `npm run check-ts` introduce no new errors in changed files.

**Tasks:**
[x] T-11 [VERIFY] Trace settings flows + check all ACs
         └─ Detail: Read the final source for all changed files. Trace: (1) admin opens
            Settings → ListLayout chrome → General read-only sections → Edit pencil → drawer
            → save → updateSettingsRequest → display updates; (2) dispatcher → only General,
            read-only, no pencils, no HQ; (3) Team tab → grids + role/remove/resend/revoke
            dispatch correct actions, per-row pending disables; (4) Invite in topbar on Team
            tab → seat-limit → correct modal. Confirm each story's must_haves truths hold.
            Report any gaps as FIX candidates. Read-only — no edits.
         └─ Files: []
         └─ Depends on: T-01..T-10
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 4     | 4    | 0       | 6/6    |
| US-02 | 4     | 4    | 0       | 5/5    |
| US-03 | 2     | 2    | 0       | 6/6    |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **11** | **11** | **0** | **17/17** |
