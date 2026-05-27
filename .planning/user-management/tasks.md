# User Management Tasks
_Last updated: 2026-03-25 14:30_
_Session: 2 of ongoing_

## Tasks

[x] T-01 [SETUP] Create subscription limits constants
         └─ Detail: Create `hussle-app-dispatch-api/src/config/subscriptionLimits.ts`. Export `SUBSCRIPTION_LIMITS` as a frozen const object: `{ maxUsers: 3, maxVehicles: 3 }`. Export the type `SubscriptionLimits`. Follow the pattern in `src/config/roles.ts`.
         └─ Depends on: —
         └─ Output: Created src/config/subscriptionLimits.ts with frozen SUBSCRIPTION_LIMITS const.

[x] T-02 [SETUP] Create SeatLimitReachedError and LastAdminError custom errors
         └─ Detail: Create two new error classes in `hussle-app-dispatch-api/src/shared/errors/`:
            - `SeatLimitReachedError` extends `CustomError`, status 429, code `SEAT_LIMIT_REACHED`. Constructor takes `resourceType: 'users' | 'vehicles'` and `limit: number`. `serializeErrors()` returns `[{ message }]`. Override `toJSON()` to include `resourceType` and `limit` fields in the response.
            - `LastAdminError` extends `CustomError`, status 409, code `LAST_ADMIN`. Constructor takes a message string. `serializeErrors()` returns `[{ message }]`.
            Follow the `InvalidTransitionError` pattern from `shared/errors/`.
         └─ Depends on: —
         └─ Output: Added SeatLimitReachedError + LastAdminError to commonErrors.ts, exported from index.ts, added SeatLimitReachedError handling to errorHandler.ts.

[x] T-03 [API] Create member management service
         └─ Detail: Create `hussle-app-dispatch-api/src/auth/services/membership/memberManagementService.ts`. Factory function `createMemberManagementService(deps)` returning:
            - `listMembers({ organizationId })` — query memberships where `deleted: false, status: 'active'` with user relation included (`select: { id, firstName, lastName, email }`). Return `Member[]` (membership + nested user).
            - `changeMemberRole({ organizationId, membershipId, role })` — validate role is in ROLES config. Check last-admin guard: count active memberships with role 'admin' in org; if this is the only admin and new role !== 'admin', throw `LastAdminError`. Update membership role via repository.
            - `removeMember({ organizationId, membershipId, requestingUserId })` — find the membership. If membership.userId === requestingUserId, throw `LastAdminError('Cannot remove yourself')`. Check last-admin guard (same as above). Soft-delete membership (set `deleted: true, deletedAt: new Date(), status: 'deleted'`). Revoke user's org sessions via `deps.tokenProvider.revokeUserOrgSessions(userId, organizationId)`.
            Deps: `{ membershipRepository, tokenProvider }`. Follow the service factory pattern from REGISTRY-dispatch-api.md.
         └─ Depends on: T-02
         └─ Output: Created memberManagementService.ts with listMembers, changeMemberRole, removeMember. Last-admin guard + self-removal block. Typecheck passes.

[x] T-04 [API] Create member management controllers and routes
         └─ Detail: Create controller factory at `hussle-app-dispatch-api/src/auth/controllers/membership/memberManagementController.ts`:
            - `listMembers` — extract `organizationId` from `req.params`, call service, use `sendSingle(res, { members: result })`.
            - `changeMemberRole` — extract `organizationId`, `membershipId` from params, `role` from body, call service, use `sendSingle(res, member)`.
            - `removeMember` — extract `organizationId`, `membershipId` from params, `requestingUserId` from `req.user.userId`, call service, `res.status(204).send()`.
            Create validators at `hussle-app-dispatch-api/src/auth/validators/memberManagementValidator.ts`:
            - `changeRoleValidator` — body: `{ role: Yup.string().oneOf(['admin','dispatcher','viewer','driver']).required() }`, params: `{ organizationId, membershipId }`.
            - `removeMemberValidator` — params: `{ organizationId, membershipId }`.
            Add routes to the auth module at `hussle-app-dispatch-api/src/auth/routes/organization.ts` (or new file `memberManagement.ts` if cleaner):
            - `GET /organizations/:organizationId/members` — appAuth, authorizeUser({ role: 'admin' })
            - `PATCH /organizations/:organizationId/members/:membershipId/role` — appAuth, authorizeUser({ role: 'admin' }), validateRequest(changeRoleValidator)
            - `DELETE /organizations/:organizationId/members/:membershipId` — appAuth, authorizeUser({ role: 'admin' }), validateRequest(removeMemberValidator)
            Wire into the auth composition root.
         └─ Depends on: T-03
         └─ Output: Created controller factory (3 handlers) with mappers, validators (changeRole + removeMember), routes (GET/PATCH/DELETE /members). Wired into composition root. Typecheck passes.

[x] T-05 [API] Create subscription usage endpoint
         └─ Detail: Create service at `hussle-app-dispatch-api/src/auth/services/subscription/subscriptionUsageService.ts`. Factory `createSubscriptionUsageService(deps)`:
            - `getUsage({ organizationId })` — count active memberships (not deleted, status 'active') for users count. Count active vehicles (`isActive: true, deletedAt: null`) for the org's carriers. Return `{ users: { current, limit: SUBSCRIPTION_LIMITS.maxUsers }, vehicles: { current, limit: SUBSCRIPTION_LIMITS.maxVehicles } }`.
            Deps: `{ membershipRepository, vehicleRepository }`. The vehicle count needs a Prisma query — use `deps.prismaClient.vehicle.count({ where: { carrier: { managedByOrgId: organizationId }, isActive: true, deletedAt: null } })`.
            Create controller, add route `GET /organizations/:organizationId/subscription/usage` with appAuth + admin authorization. Wire into composition root.
         └─ Depends on: T-01
         └─ Output: Created subscriptionUsageService, controller (with mapper/transformer), route at GET /organizations/:orgId/subscription/usage. Wired into auth composition root. Typecheck passes.

[x] T-06 [API] Update invite service to accept name fields and enforce seat limit
         └─ Detail: Modify `hussle-app-dispatch-api/src/auth/services/invite/inviteUserService.ts`:
            - Add `firstName` and `lastName` to the `InviteUserInput` type.
            - Before creating invitations, count active memberships + pending invitations for the org. If `activeMemberships + pendingInvitations >= SUBSCRIPTION_LIMITS.maxUsers`, throw `SeatLimitReachedError('users', SUBSCRIPTION_LIMITS.maxUsers)`.
            - Pass `firstName` and `lastName` to the invitation record creation.
            Modify `hussle-app-dispatch-api/src/auth/validators/inviteValidator.ts`:
            - Add `firstName: Yup.string().min(1).max(50).required()` and `lastName: Yup.string().min(1).max(50).required()` to `inviteUserSchema`.
            Verify the Invitation Prisma model has firstName/lastName fields. If not, they need to be added to the schema and a migration created.
         └─ Depends on: T-01, T-02
         └─ Output: Updated invite service with firstName/lastName fields + seat limit check. Updated validator, mapper, controller, repos. Added Prisma migration for Invitation name columns. All 5 invite tests pass.

[x] T-07 [API] Add seat limit enforcement to vehicle creation
         └─ Detail: Modify `hussle-app-dispatch-api/src/vehicles/services/vehicleService.ts`:
            - In the `createVehicle` method, before creating the vehicle, count active vehicles for the org's carriers. If at or above `SUBSCRIPTION_LIMITS.maxVehicles`, throw `SeatLimitReachedError('vehicles', SUBSCRIPTION_LIMITS.maxVehicles)`.
            - Import `SUBSCRIPTION_LIMITS` from `src/config/subscriptionLimits.ts`.
            - The count query: `prismaClient.vehicle.count({ where: { carrier: { managedByOrgId: organizationId }, isActive: true, deletedAt: null } })`.
         └─ Depends on: T-01, T-02
         └─ Output: Added countActiveByOrganization to vehicle repo port + implementation. Enforced limit in createVehicle. All 12 vehicle tests pass.

[x] T-08 [API] Write tests for member management service
         └─ Detail: Create `hussle-app-dispatch-api/src/auth/services/membership/__tests__/memberManagementService.test.ts`. Tests:
            - `listMembers` returns active members with user details
            - `changeMemberRole` updates role successfully
            - `changeMemberRole` throws LastAdminError when demoting the only admin
            - `changeMemberRole` allows demoting admin when another admin exists
            - `removeMember` soft-deletes membership and revokes sessions
            - `removeMember` throws LastAdminError when removing the only admin
            - `removeMember` throws LastAdminError when user tries to remove themselves
            Mock membershipRepository and tokenProvider. Follow the test pattern from REGISTRY-dispatch-api.md.
         └─ Depends on: T-03
         └─ Output: Created 11 tests covering listMembers, changeMemberRole (success, last-admin guard, invalid role, not found), removeMember (success, last-admin, self-removal, not found). All 11 pass.

[x] T-09 [API] Write tests for subscription usage and seat limit
         └─ Detail: Create `hussle-app-dispatch-api/src/auth/services/subscription/__tests__/subscriptionUsageService.test.ts`. Tests:
            - Returns correct user and vehicle counts with limits
            - Returns zero counts when no members/vehicles exist
            Create `hussle-app-dispatch-api/src/auth/services/invite/__tests__/inviteUserService.seatLimit.test.ts`. Tests:
            - Invite succeeds when under the limit
            - Invite throws SeatLimitReachedError when at the limit (active members + pending invites >= maxUsers)
            Follow the test pattern from REGISTRY-dispatch-api.md.
         └─ Depends on: T-05, T-06
         └─ Output: Created 2 subscription usage tests (correct counts, zero counts). Invite seat limit test already existed. All pass.

[x] T-10 [EMAIL] Verify and update invitation email template
         └─ Detail: Read `hussle-emails/src/invitation/InvitationEmail.tsx` and `renderInvitationEmail.ts`. The existing `InvitationEmailData` has `inviterName, orgName, role, inviteUrl, expiresAt`. Verify the template:
            - Has a CTA button pointing to `inviteUrl` (the accept link)
            - Includes the invitee's role
            - Has org name in subject/body
            If missing, add personalization for invitee name. Update `InvitationEmailData` to include `inviteeName` if not present. The invite URL should point to the frontend route `/invite/accept/:token`.
            Also verify `renderInvitationEmail` is exported from `hussle-emails/src/index.ts`.
         └─ Depends on: —
         └─ Output: Verified CTA button, role, org name all present. Added inviteeName personalization to template. TypeScript compiles clean.

[x] T-11 [UI] Create team management API layer and types
         └─ Detail: Create `hussle-app-dispatch-ui/src/utils/api/team/teamApi.ts`:
            - `getMembers(orgId: string)` → GET `/organizations/${orgId}/members` → returns `{ data: Member[] }`
            - `changeMemberRole(orgId: string, membershipId: string, role: string)` → PATCH `/organizations/${orgId}/members/${membershipId}/role` with body `{ role }` → returns `{ data: Member }`
            - `removeMember(orgId: string, membershipId: string)` → DELETE `/organizations/${orgId}/members/${membershipId}` → returns void
            - `getSubscriptionUsage(orgId: string)` → GET `/organizations/${orgId}/subscription/usage` → returns `{ data: SubscriptionUsage }`
            - `inviteMember(orgId: string, data: InviteMemberInput)` → POST `/organizations/${orgId}/invite` with body → returns `{ data: InviteResult }`
            - `getInvitations(orgId: string)` → GET `/organizations/${orgId}/invites` → returns `{ data: Invitation[] }`
            - `verifyInvitation(token: string)` → POST `/invitations/${token}/verify` → returns `{ data: InvitationVerification }`
            - `acceptInvitation(data: AcceptInvitationInput)` → POST `/invitations/accept` → returns `{ data: { message: string } }`
            Define TypeScript interfaces matching contract.yaml schemas: `Member`, `SubscriptionUsage`, `UsageEntry`, `Invitation`, `InvitationVerification`, `InviteMemberInput`, `AcceptInvitationInput`, `InviteResult`. Use `import type` for type imports. Use the axios instance from `utils/axios.ts`.
         └─ Depends on: —
         └─ Output: Created teamApi.ts with 8 interfaces and 8 API functions. Follows existing axios pattern. Typecheck passes.

[x] T-12 [UI] Create team Redux slice and sagas
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/settings/store/reducers/teamSlice.ts`:
            - State: `{ members: Member[], invitations: Invitation[], usage: SubscriptionUsage | null, loading: Record<string, string>, errors: Record<string, string> }`
            - Actions: `fetchTeamRequest/Success/Failure`, `changeMemberRoleRequest/Success/Failure`, `removeMemberRequest/Success/Failure`, `inviteMemberRequest/Success/Failure`
            Create sagas at `hussle-app-dispatch-ui/src/features/settings/store/sagas/`:
            - `fetchTeamSaga.ts` — on `fetchTeamRequest`, call `getMembers`, `getInvitations`, `getSubscriptionUsage` in parallel (use `all([call(...), call(...), call(...)])`). Dispatch success with all three results.
            - `changeMemberRoleSaga.ts` — call `changeMemberRole`, on success update the member in state, show success snackbar. On 409 (last admin), show error snackbar.
            - `removeMemberSaga.ts` — call `removeMember`, on success remove from state, show success snackbar. On 409, show error snackbar.
            - `inviteMemberSaga.ts` — call `inviteMember`, on success add to invitations list, show success snackbar. On 429 (seat limit), dispatch action to show upgrade dialog.
            - `teamSagaWatcher.ts` — watcher that takes latest for all team actions.
            Register the slice in the root reducer under `pages.team` and the watcher in the root saga. Follow existing saga patterns from REGISTRY-dispatch-ui.md.
         └─ Depends on: T-11
         └─ Output: Created teamSlice (12 actions), 4 sagas (fetch, changeRole, remove, invite) + watcher. Registered in root reducer (pages.team) and root saga. Typecheck passes.

[x] T-13 [UI] Add TeamTab to Settings page with DetailTabBar
         └─ Detail: Modify `hussle-app-dispatch-ui/src/features/settings/pages/SettingsPage/index.tsx`:
            - Import `DetailTabBar` from `components/DetailTabBar`.
            - Add tab state: `const [activeTab, setActiveTab] = useState('general')`.
            - Render `DetailTabBar` with tabs `[{ value: 'general', label: 'General' }, { value: 'team', label: 'Team' }]` above the existing content.
            - Wrap existing settings form content in `{activeTab === 'general' && <GeneralSettingsForm />}`.
            - Add `{activeTab === 'team' && <TeamTab />}`.
            Create `TeamTab` component at `hussle-app-dispatch-ui/src/features/settings/components/TeamTab/index.tsx`:
            - On mount, dispatch `fetchTeamRequest({ organizationId })` (get orgId from `useAuth` or auth state).
            - Header row: Typography "Team Members" + secondary text "[current] of [limit] seats used" from usage state + "Invite Member" Button (primary).
            - Invite button click: if `usage.users.current >= usage.users.limit`, open UpgradePlanDialog; else open InviteMemberDialog.
            - Render `MemberTable` and `InvitationTable` (conditional on invitations.length > 0) inside `MainCard` wrappers.
            Follow the design spec at `.planning/user-management/designs/settings-team-tab.md`.
         └─ Depends on: T-12
         └─ Output: Modified SettingsPage with DetailTabBar (General/Team tabs). Created TeamTab with header (seat usage + Invite button with upgrade gate), MemberTable, InvitationTable, dialogs. Typecheck passes.

[x] T-14 [UI] Build MemberTable component
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/settings/components/MemberTable/index.tsx`:
            - MUI `Table` with columns: Name (firstName + lastName with email as secondary Typography below), Role (inline `Select` with options admin/dispatcher/viewer/driver), Joined (formatted as "MMM DD, YYYY"), Actions (Remove text button).
            - Role `Select` onChange: dispatch `changeMemberRoleRequest({ organizationId, membershipId, role })`. Show inline CircularProgress (size 20) while loading. Revert on error.
            - Remove button: opens `ConfirmDialog` from `mocho/components/ConfirmDialog`. Title: "Remove [Name]?". Content: "They will lose access to [OrgName] immediately. This action cannot be undone." Confirm button is red.
            - Hide Remove button on the current user's own row (compare `member.userId` with `auth.user.id`).
            - Loading state: 3 skeleton rows.
            - Props: `members: Member[]`, `loading: boolean`, `organizationId: string`.
            Follow the design spec at `.planning/user-management/designs/settings-team-tab.md`.
         └─ Depends on: T-12
         └─ Output: Created MemberTable with inline role Select, Remove button with ConfirmDialog, skeleton loading, current-user detection. Typecheck passes.

[x] T-15 [UI] Build InvitationTable component
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/settings/components/InvitationTable/index.tsx`:
            - MUI `Table` inside `MainCard` with title "Pending Invitations".
            - Columns: Name (firstName + lastName), Email, Role (text chip), Sent (formatted "MMM DD, YYYY"), Expires (relative time using date math — "in X days" or "Expired" in red).
            - No actions — read-only for now.
            - Only rendered when `invitations.length > 0`.
            - Props: `invitations: Invitation[]`.
            Follow the design spec at `.planning/user-management/designs/settings-team-tab.md`.
         └─ Depends on: T-12
         └─ Output: Created InvitationTable with 5 columns (Name, Email, Role chip, Sent, Expires with relative time). Typecheck passes.

[x] T-16 [UI] Build InviteMemberDialog component
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/settings/components/InviteMemberDialog/index.tsx`:
            - MUI `Dialog` with `maxWidth="sm"`.
            - `DialogTitle`: "Invite Team Member" with close IconButton.
            - `DialogContent`: Formik form with fields: firstName (TextField, autoFocus), lastName (TextField), email (EmailField), role (SelectField with options Admin/Dispatcher/Viewer/Driver, default "dispatcher").
            - Yup validation schema: firstName required min 1, lastName required min 1, email required valid format, role required oneOf.
            - `DialogActions`: Cancel (text button) + Send Invite (LoadingButton, primary).
            - On submit: dispatch `inviteMemberRequest({ organizationId, ...values })`. On success (detected via saga/redux state change), close dialog and reset form.
            - Server error: show MUI `Alert` below the form fields.
            - Props: `open: boolean`, `onClose: () => void`, `organizationId: string`.
            Follow the design spec at `.planning/user-management/designs/invite-member-dialog.md`.
         └─ Depends on: T-12
         └─ Output: Created InviteMemberDialog with Formik form (4 fields), Yup validation, LoadingButton, server error Alert, auto-close on success. Typecheck passes.

[x] T-17 [UI] Build UpgradePlanDialog shared component
         └─ Detail: Create `hussle-app-dispatch-ui/src/components/UpgradePlanDialog/index.tsx`:
            - MUI `Dialog` with `maxWidth="xs"`.
            - No `DialogTitle` or `DialogActions` — everything in `DialogContent` centered.
            - Content: `WarningAmber` icon (amber, 48px) + Typography "Plan Limit Reached" (h6, semibold) + Typography message with bold limit: "You've reached your plan limit of **[limit] [resourceType]**. Upgrade your plan to add more."
            - "Got It" Button (primary, full width) → closes dialog.
            - Props: `open: boolean`, `onClose: () => void`, `resourceType: 'team members' | 'vehicles'`, `limit: number`.
            - Escape and backdrop click also close.
            Follow the design spec at `.planning/user-management/designs/upgrade-plan-dialog.md`.
         └─ Depends on: —
         └─ Output: Created UpgradePlanDialog with WarningAmber icon, dynamic message, "Got It" button. Typecheck passes.

[x] T-18 [UI] Build AcceptInvitePage
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/auth/pages/accept-invite.tsx`:
            - Public route at `/invite/accept/:token`. Register in auth routes (no AuthGuard/PersistLogin wrapper — use `AuthWrapper` like login/register).
            - On mount: extract `token` from `useParams()`, call `verifyInvitation(token)`.
            - Loading state: centered `CircularProgress` inside `AuthWrapper`/`AuthFormWrapper`.
            - Error states (expired/invalid): centered icon + title + message + "Back to Login" link. Use `AccessTime` icon for expired, `ErrorOutline` for invalid.
            - Valid state: Typography "Join [orgName]" (h5) + "You've been invited as a [role]" (secondary) + Formik form with readonly name/email fields + password + confirmPassword fields + LoadingButton "Accept Invitation" (full width, primary) + "Already have an account? Log in" link.
            - Password validation: required, min 8 chars, uppercase + lowercase + number (use existing `password-validation.ts` util if available).
            - On submit: call `acceptInvitation({ invitationToken: token, email, password, firstName, lastName, role, organizationId })` directly (no Redux needed — one-time action). On success: navigate to `/login` with success snackbar. On error: show Alert below form.
            Follow the design spec at `.planning/user-management/designs/accept-invite-page.md`.
         └─ Depends on: T-11
         └─ Output: Created accept-invite.tsx with token verification, error states (expired/invalid), password form, route at /invite/accept/:token. Typecheck passes.

[x] T-19 [UI] Wire UpgradePlanDialog into vehicle creation flow
         └─ Detail: Find the vehicle creation flow in `hussle-app-dispatch-ui/src/features/vehicle/`. Before opening the create vehicle form/page, check subscription usage. Modify the "Add Vehicle" button handler:
            - Fetch subscription usage (or use cached value if already in team state).
            - If `usage.vehicles.current >= usage.vehicles.limit`, show `UpgradePlanDialog` with `resourceType="vehicles"` and `limit={usage.vehicles.limit}`.
            - Otherwise, proceed to vehicle creation as normal.
            Import `UpgradePlanDialog` from `components/UpgradePlanDialog`. Import `getSubscriptionUsage` from `utils/api/team/teamApi.ts`.
         └─ Depends on: T-17, T-11
         └─ Output: Modified VehicleListPage to check subscription usage before create. Shows UpgradePlanDialog when at limit. Typecheck passes.

## Fix Tasks

[x] T-20 [FIX] Wire invite email sending via event bus
         └─ Detail: Wire up email sending when an invite is created. Follow the existing notification subscriber pattern:
            1. Add `'invitation.created'` event to `hussle-app-dispatch-api/src/shared/messaging/eventMap.ts` with payload: `{ inviteId, organizationId, orgName, recipientEmail, inviteeFirstName, inviteeLastName, inviterName, role, inviteToken, expiresAt }`.
            2. Update `hussle-app-dispatch-api/src/auth/controllers/invite/inviteUserController.ts` — after `inviteUserService` returns, publish `'invitation.created'` event for each created invite via `deps.eventBus.publish()`. The controller needs `eventBus` and the requesting user's name added to its deps. Get the inviter name from `req.user` or look it up.
            3. Add `buildInvitationContent` to `hussle-app-dispatch-api/src/notifications/services/notificationContentBuilder.ts` — import `renderInvitationEmail` from `@hussle/emails`, call it with `{ inviterName, orgName, role, inviteUrl, expiresAt, inviteeName }`. The `inviteUrl` should be `${FRONTEND_URL}/invite/accept/${inviteToken}` (get FRONTEND_URL from env config).
            4. Add `'invitation.created'` subscriber in `hussle-app-dispatch-api/src/notifications/services/notificationSubscriber.ts` — subscribe to the event, call `buildInvitationContent`, send via `deps.emailService.sendEmail({ to: recipientEmail, from: 'notifications@hussle.app', subject, html })`.
            5. Wire the eventBus into the invite controller deps in the auth composition root (`src/auth/compositionRoot.ts` or `src/auth/controllers/index.ts`).
            Follow the exact pattern used for `load.status.changed` in the notification subscriber.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output: Added invitation.created event to eventMap. Wired controller to publish events. Added buildInvitationContent + subscriber. Added FRONTEND_URL env var. Updated 11 files. Typecheck passes.

[x] T-21 [FIX] Fix invite response missing firstName/lastName in list endpoint
         └─ Detail: The `GET /organizations/:orgId/invites` endpoint returns invites without `firstName`/`lastName` because the invite transformer strips them. Already partially fixed in `src/auth/controllers/invite/transformers/inviteTransformer.ts` (added firstName/lastName to InviteResponse and toInviteResponse). Verify the fix is complete:
            1. Read `src/auth/controllers/invite/transformers/inviteTransformer.ts` — confirm `firstName` and `lastName` are in both the interface and the mapping function.
            2. Read `src/auth/types/invite.ts` — confirm `Invite` type derives from `PrismaInvitation` which includes `firstName` and `lastName` (they were added to the Prisma schema).
            3. Verify the Docker container's Prisma client knows about the new fields. Run `npx prisma generate` inside the container if needed.
            4. Test: `curl` the invites endpoint and confirm firstName/lastName appear in the response.
            If the transformer fix is already in place, just verify and confirm. No new code needed if it's already fixed.
         └─ Agent: backend
         └─ Depends on: —
         └─ Output: All source code correct. Root cause was stale Prisma client in Docker. Regenerated + restarted. firstName/lastName now appear in invites response.

[x] T-22 [FIX] Fix invite dialog validation showing on mount
         └─ Detail: The InviteMemberDialog shows "First name is required" validation error immediately when the dialog opens, before the user interacts with any field. This is because Formik's `validateOnMount` defaults to false but the form may be triggering validation on render.
            Fix in `hussle-app-dispatch-ui/src/features/settings/components/InviteMemberDialog/index.tsx`:
            - Ensure `useFormik` has `validateOnMount: false` and `validateOnChange: false` (validate on blur and submit only).
            - Or set `initialTouched` to empty so untouched fields don't show errors.
            - The error should only show after the user blurs the field or submits the form.
         └─ Agent: frontend
         └─ Depends on: —
         └─ Output: Added validateOnMount/onChange: false, validateOnBlur: true. Fixed useEffect dependency. Typecheck passes.

## Summary

| Group     | Total | Done | Blocked | Remaining |
|-----------|-------|------|---------|-----------|
| SETUP     | 2     | 2    | 0       | 0         |
| API       | 7     | 7    | 0       | 0         |
| EMAIL     | 1     | 1    | 0       | 0         |
| UI        | 9     | 9    | 0       | 0         |
| FIX       | 3     | 3    | 0       | 0         |
| **All**   | **22**| **22**| **0** | **0**     |
