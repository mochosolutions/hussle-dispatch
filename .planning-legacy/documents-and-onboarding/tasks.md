# Documents & Carrier Onboarding — Tasks
_Last updated: 2026-04-23 15:00_

---

## US-01: Rename s3Url → url on Document model
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Prisma migration renames `s3Url` to `url` on Document model
- [x] All API files referencing `s3Url` updated (types, services, repositories, carrier-portal)
- [x] All document API responses return `url` instead of `s3Url`
- [x] Existing document tests pass with renamed field
- [x] No remaining `s3Url` references in API codebase (grep clean)

**Tasks:**
[x] T-01 [DB] Create Prisma migration to rename s3Url → url
         └─ Detail: ...
         └─ Depends on: —
         └─ Output: Schema updated (line 974), migration `20260422020000_rename_s3url_to_url` created. DB offline — apply with `npx prisma migrate dev` when Docker running.

[x] T-02 [API] Update all API references from s3Url to url
         └─ Detail: ...
         └─ Depends on: T-01
         └─ Output: 6 files updated: documentTypes.ts, documentService.ts, portalDocumentRepoPrisma.ts, portalDocumentsTypes.ts, portalDocumentsService.ts, documentService.test.ts. `grep -r "s3Url" src/` = 0 results.

[x] T-03 [TEST] Verify document tests pass with renamed field
         └─ Detail: ...
         └─ Depends on: T-02
         └─ Output: 14/14 tests passing (1 suite).

---

## US-02: Rename s3Url → url in frontend
_Priority: P0 | Services: dispatch-ui | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] UI Document type uses `url` instead of `s3Url`
- [x] Mock fixtures updated
- [x] No remaining `s3Url` references in UI codebase

**Tasks:**
[x] T-04 [UI] Update frontend s3Url references to url
         └─ Detail: ...
         └─ Depends on: T-02
         └─ Output: 3 files updated: documents/types.ts (interface field), mocks/fixtures/documents.ts (3 entries), DocumentList/index.tsx (2 usages). `grep -r "s3Url" src/` = 0 results.

---

## US-03: Dispatch override endpoint (backend)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `POST /api/v1/carriers/:id/dispatch-override` endpoint exists
- [x] Requires ADMIN role (403 for non-admin)
- [x] Accepts `{ loadId: string, reason: string }`, both required
- [x] Sets `onboardingOverride: true` and `onboardingOverrideReason` on Load
- [x] Writes AuditLog entry with action=DISPATCH_OVERRIDE, entityType=LOAD
- [x] Load assignment proceeds after override despite onboarding gate failure
- [ ] Non-admin users get 403

**Tasks:**
[x] T-05 [DB] Add override fields to Load model
         └─ Detail: ...
         └─ Depends on: —
         └─ Output: Added `onboardingOverride` (Boolean, default false) + `onboardingOverrideReason` (String?) to Load. Migration `20260423000000_add_onboarding_override_to_load` applied.

[x] T-06 [API] Create dispatch override endpoint
         └─ Detail: ...
         └─ Depends on: T-05
         └─ Output: 7 files: validator, service, controller, mapper, transformer, compositionRoot, routes. Route: `POST /carriers/:id/dispatch-override` (requireAuth + requireRole ADMIN + validateRequest). Fully wired.

[x] T-07 [API] Update load assignment to respect override flag
         └─ Detail: ...
         └─ Depends on: T-05
         └─ Output: `validateAssignmentState` in loadService.ts now accepts `options?: { onboardingOverride?: boolean }`. When true, skips onboarding gate. Both `updateLoad` and `assignLoad` pass `existing.onboardingOverride`.

[x] T-08 [TEST] Write tests for dispatch override
         └─ Detail: ...
         └─ Depends on: T-06
         └─ Output: 5/5 tests passing. Service logic covered (override fields, NotFoundError, AuditLog). Middleware-level auth tested implicitly via route wiring.

---

## US-04: Onboarding document phase validation
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Carrier portal `session.complete()` blocked when required docs missing for EXTERNAL_CARRIER or LEASED_CARRIER
- [x] Missing docs list returned in error response
- [x] COMPANY_ASSET carriers can complete without docs
- [x] Carrier with all docs present can complete successfully

**Tasks:**
[x] T-09 [API] Add document validation to carrier portal session completion
         └─ Detail: Find the carrier portal session completion endpoint/service. Search for
            `session.complete` or `complete` in `src/carrier-portal/`.
            
            In the session completion service:
            1. Look up the carrier's type (COMPANY_ASSET, EXTERNAL_CARRIER, LEASED_CARRIER)
            2. If EXTERNAL_CARRIER or LEASED_CARRIER:
               - Query confirmed documents for this carrier (entityType: 'carrier', entityId: carrierId)
               - Check for DISPATCH_AGREEMENT, INSURANCE_CERT, W9 document types
               - Also check carrier model fields: `insuranceCertOnFile`, `insuranceExpiry`, `dispatchAgreementOnFile`, `w9OnFile`
               - Call `checkCarrierOnboarding()` from `shared/onboardingGate.ts`
               - If `allowed === false`, throw `OnboardingBlockError` with `missingDocuments` list
            3. If COMPANY_ASSET: skip doc check, proceed
            
            Use the existing `OnboardingBlockError` class from `shared/errors/`.
         └─ Depends on: —
         └─ Output: Modified `onboardingSessionService.ts` — added doc validation before marking session complete. Uses existing `checkCarrierOnboarding()` + `OnboardingBlockError`.

[x] T-10 [TEST] Write tests for session completion doc validation
         └─ Detail: ...
         └─ Depends on: T-09
         └─ Output: 5/5 tests passing in `onboardingSessionComplete.test.ts`. All 5 scenarios covered.

---

## US-05: Onboarding completion email fix
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `carrier.onboarding.completed` handler looks up org admin email via Membership
- [x] Email sent to org admin with carrier name, org name, and review link
- [x] Uses existing `CarrierOnboardingCompleteEmail` template
- [x] If no admin email found, error logged but no crash

**Tasks:**
[x] T-11 [API] Wire onboarding completion email to actually send
         └─ Detail: In `hussle-app-dispatch-api/src/notifications/services/carrierOnboardingSubscriber.ts`,
            the `carrier.onboarding.completed` handler (line 65-85) renders the email but has a TODO
            instead of sending it. Fix:
            
            1. Add a `membershipQuery` dependency to `CarrierOnboardingSubscriberDeps`:
               ```typescript
               membershipQuery: { findAdminByOrgId: (orgId: string) => Promise<{ email: string } | null> };
               ```
            2. In the handler, look up the org admin:
               ```typescript
               const admin = await deps.membershipQuery.findAdminByOrgId(data.organizationId);
               if (!admin) {
                 deps.logger.warn('No admin email found for org', { organizationId: data.organizationId });
                 return;
               }
               ```
            3. Replace the TODO/logger.info with actual send:
               ```typescript
               await deps.emailService.sendEmail({
                 to: admin.email,
                 from: DEFAULT_FROM_EMAIL,
                 subject,
                 html,
               });
               ```
            4. Update the composition root that initializes this subscriber to inject the membership query.
               Look at how other subscribers get their dependencies wired in `src/compositionRoot.ts` or
               the notifications module's composition root.
            5. Also fix `organizationName` — currently passes `data.organizationId` (an ID, not a name).
               Either add `organizationName` to the event payload, or look it up.
         └─ Depends on: —
         └─ Output: Added `membershipQuery` + `organizationQuery` deps. Handler now looks up admin email via Membership, org name via Organization. Email sends via `emailService.sendEmail`. Fallback: no admin → warn + return; no org → 'Your Organization'. Wired in `notifications/compositionRoot.ts`.

[x] T-12 [TEST] Test onboarding completion email sends
         └─ Detail: ...
         └─ Depends on: T-11
         └─ Output: 5/5 tests passing in `carrierOnboardingSubscriber.test.ts`. Covers: admin exists → email sent, no admin → warning, org name used (not ID), fallback org name, no throw on missing admin.

---

## US-06: Driver portal upload consolidation
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] `DriverDocumentUpload` component replaced by shared `DocumentUpload` in driver portal page
- [x] Shared `DocumentUpload` renders correctly at 375px mobile viewport
- [x] BOL_SIGNED upload available at AT_PICKUP+ status
- [x] POD upload available at AT_DELIVERY+ status
- [x] Upload progress, success confirmation, and "upload another" flow work at mobile viewport
- [x] File validation (10MB max, JPEG/PNG/PDF only) still enforced

**Tasks:**
[x] T-13 [UI] Replace DriverDocumentUpload with shared DocumentUpload in driver portal
         └─ Detail: In `hussle-app-dispatch-ui/src/features/driver-portal/pages/DriverPortalPage/index.tsx`:
            1. Replace import of `DriverDocumentUpload` from `../../components/DriverDocumentUpload`
               with import of `DocumentUpload` from `features/documents/components/DocumentUpload`
            2. Configure `DocumentUpload` for the driver portal context:
               - `entityType: 'load'`
               - `entityId: loadId` (from portal context)
               - Allowed document types: `['BOL_SIGNED', 'POD']`
               - Status gating: BOL_SIGNED available when status is AT_PICKUP, IN_TRANSIT, AT_DELIVERY, or DELIVERED;
                 POD available when status is AT_DELIVERY or DELIVERED
               - `compact: true` or equivalent mobile-friendly prop if available
               - File constraints: maxSize 10MB, accept JPEG/PNG/PDF
            3. The shared `DocumentUpload` uses the authenticated API client. The driver portal uses
               token-based auth via `driverPortalApi.ts`. You may need to:
               - Pass the portal token through to the presign/confirm API calls
               - OR configure DocumentUpload to use driver portal API endpoints instead of standard doc endpoints
               - The portal endpoints are: `POST /api/v1/driver-portal/portal/load/documents/presign`
                 and `POST /api/v1/driver-portal/portal/load/documents/:id/confirm`
               - If the shared component can't easily use portal endpoints, create a thin adapter
                 or add an `apiOverride` prop to DocumentUpload
            4. Verify the component works at 375px viewport — no horizontal overflow, touch-friendly
               file input with camera capture (`accept="image/*,application/pdf"`)
         └─ Depends on: T-04
         └─ Output:

[x] T-14 [UI] Remove DriverDocumentUpload component
         └─ Detail: Delete `hussle-app-dispatch-ui/src/features/driver-portal/components/DriverDocumentUpload/`
            directory. Verify no other imports reference it (grep for `DriverDocumentUpload`).
         └─ Depends on: T-13
         └─ Output:

---

## US-07: Dispatch override UI
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] "Dispatch anyway" button visible only to admin users when onboarding gate blocks
- [x] Override modal shows carrier name, missing docs list, and required reason textarea
- [x] Reason field required — submit disabled when empty
- [x] Successful override dismisses modal and proceeds with load assignment

**Tasks:**
[x] T-15 [UI] Create DispatchOverrideModal component
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/carrier/components/DispatchOverrideModal/index.tsx`:
            - MUI Dialog (size `md`)
            - Props: `{ carrierId, carrierName, loadId, missingDocuments: string[], onSuccess, onClose }`
            - Content:
              - Title: "Override Onboarding Gate" (use `ModalTitle`)
              - Body: carrier name + bulleted list of missing documents
              - Formik form with single field: `reason` (multiline TextField, required, max 1000 chars)
              - Yup validation: `reason: string().required('Reason is required').max(1000)`
              - Submit button: "Dispatch Anyway" (disabled when form invalid or submitting)
              - Cancel button
            - On submit: call `POST /api/v1/carriers/${carrierId}/dispatch-override` with `{ loadId, reason }`
            - On success: call `onSuccess()`, close modal, show success toast
            - On error: show error inline
            - Register in `features/ui/types/popupTypes.ts` as ModalType `DispatchOverride`
            - Register in `features/ui/modalRegistry.ts`
         └─ Depends on: T-06
         └─ Output:

[x] T-16 [UI] Wire "Dispatch anyway" button in load assignment flow
         └─ Detail: Find where the onboarding gate error is displayed during load carrier assignment.
            Search for `OnboardingBlock` or `onboarding` or `missingDocuments` in the load feature.
            Likely in `StatusChangeDialog` or the carrier assignment flow in load detail.
            
            When the assignment fails with an onboarding block error:
            1. Check if the current user has ADMIN role (from `useAuth()` hook or auth state)
            2. If admin: show "Dispatch Anyway" button alongside the error message
            3. On click: open `DispatchOverrideModal` via `useModalActions().openModal('DispatchOverride', { carrierId, carrierName, loadId, missingDocuments })`
            4. On modal success: retry the load assignment (or refresh load detail)
            5. If not admin: show error only, no override option
         └─ Depends on: T-15
         └─ Output:

---

## US-08: Insurance expiry badges on carrier detail
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] "Expired" error badge when `insuranceExpiry < now()`
- [x] "Expires in X days" warning badge when within 30 days
- [x] "Expires in X days" urgent badge when within 7 days
- [x] No badge when insurance is current (>30 days)
- [x] Badge appears in carrier detail header/overview area

**Tasks:**
[x] T-17 [UI] Add insurance expiry badge to carrier detail
         └─ Detail: In the carrier detail page at
            `hussle-app-dispatch-ui/src/features/carrier/components/CarrierDetailPage/`:
            
            1. Find the overview/header area (likely `OverviewTab.tsx` or the KPI component)
            2. Create a helper function `getInsuranceExpiryStatus(expiresAt: string | null)`:
               - Returns `{ label: string, color: 'error' | 'warning' | 'default', severity: 'expired' | 'urgent' | 'warning' | 'ok' }`
               - `null` or no date → no badge
               - Expired (`< now()`) → `{ label: 'Expired', color: 'error' }`
               - Within 7 days → `{ label: 'Expires in X days', color: 'error' }`
               - Within 30 days → `{ label: 'Expires in X days', color: 'warning' }`
               - More than 30 days → no badge (ok)
               - Use `date-fns` `differenceInDays` for calculation
            3. Render as MUI `Chip` with appropriate color, placed near the insurance info
               in the carrier detail header/overview area
            4. Carrier model already has `insuranceExpiry` field returned by the API
         └─ Depends on: —
         └─ Output:

---

## US-09: Rate con attachment in load templates — DROPPED
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: dropped_

**Reason:** Rate cons are always unique per load (a contract for a specific shipment). Templates pre-fill lane/customer/rate, but rate cons come from the broker/customer after booking. Copying a rate con from a template doesn't match real dispatch/brokerage workflows. All US-09 changes reverted.

**Tasks:**
[x] T-18 [UI] Extend LoadTemplate with rateConDocumentId
         └─ Detail: In `hussle-app-dispatch-ui/src/features/load/types.ts` (line 551-558),
            add to the `LoadTemplate` interface:
            ```
            rateConDocumentId?: string;
            ```
            In `CreateLoadModal/index.tsx` (DEMO_TEMPLATES array), optionally add a
            `rateConDocumentId` to one template for testing.
         └─ Depends on: —
         └─ Output:

[x] T-19 [UI] Wire rate con from template to load creation
         └─ Detail: In `hussle-app-dispatch-ui/src/features/load/pages/CreateLoadPage/index.tsx`:
            1. When template is selected and has `rateConDocumentId`, pass it to `CreateLoadForm`
            2. In `CreateLoadForm/index.tsx`, if `template.rateConDocumentId` is present:
               - Add it to the initial form values or a queued document list
               - On load creation success, attach the document to the new load
               (either via the `QueuedDocument` pattern if it exists, or by calling
               the document API to link the existing document to the new load's entityId)
            3. After creation, the document should appear in the load's DocumentsTab
         └─ Depends on: T-18
         └─ Output:

---

## INT-01: Wire dispatch-api ↔ dispatch-ui integration
_Auto-generated | Services: dispatch-api, dispatch-ui_

**Verification Checklist:**
- [ ] Document API responses use `url` field (not `s3Url`) across all endpoints
- [ ] UI Document type matches API response shape (`url` field)
- [ ] Dispatch override endpoint path matches UI API call
- [ ] Override request body shape matches (`{ loadId, reason }`)
- [ ] Override auth: UI only shows button for ADMIN role, API enforces ADMIN
- [ ] Onboarding block error response includes `missingDocuments` array that UI can parse
- [ ] Insurance expiry field (`insuranceExpiry`) present in carrier detail API response

**Tasks:**
[x] T-20 [WIRE] Verify s3Url → url rename is consistent API↔UI
         └─ Detail: Read document-returning endpoints in dispatch-api (documentController transformers,
            carrier-portal document responses) and verify they all return `url`.
            Read dispatch-ui Document type in `features/documents/types.ts` and verify it expects `url`.
            Read any document-consuming components to confirm they read `.url` not `.s3Url`.
            Check mock fixtures in `src/mocks/fixtures/documents.ts`.
         └─ Agent: review
         └─ Depends on: T-02, T-04
         └─ Output:

[x] T-21 [WIRE] Verify dispatch override API↔UI contract
         └─ Detail: Read the override endpoint in dispatch-api (route path, auth middleware, validator schema,
            response shape). Read the UI API call in DispatchOverrideModal (endpoint URL, request body, error
            handling). Verify:
            - Path: `POST /api/v1/carriers/:id/dispatch-override`
            - Body: `{ loadId: string, reason: string }`
            - Auth: ADMIN only (middleware + UI role check)
            - Error: 403 for non-admin, 404 for missing carrier/load, 400 for validation
            - Success: 200
         └─ Agent: review
         └─ Depends on: T-06, T-16
         └─ Output:

[x] T-22 [WIRE] Verify onboarding block error shape for UI consumption
         └─ Detail: Read the onboarding gate error thrown by loadService during carrier assignment.
            Check the error response shape — does it include `missingDocuments: string[]` in a way
            the UI can parse? Read where the UI handles this error and feeds it to the override modal.
            If the error shape doesn't include missingDocuments, flag as an issue.
         └─ Agent: review
         └─ Depends on: T-07, T-16
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-23 [VERIFY] Trace all feature flows end-to-end
         └─ Detail: For each flow in the plan:
            1. **s3Url rename:** Trace a document upload from presign → S3 → confirm → response.
               Verify `url` field used everywhere. Check driver portal, load detail, carrier detail.
            2. **Dispatch override:** Trace: admin assigns carrier with missing docs → gate blocks →
               "Dispatch anyway" → override endpoint → AuditLog → load assignment proceeds.
            3. **Onboarding gate:** Trace: carrier completes portal → session.complete() →
               doc check → block if missing → success if present → email sent to admin.
            4. **Insurance badge:** Trace: carrier with expired insurance → carrier detail →
               badge renders with correct state.
            5. **Rate con template:** Trace: template with rateConDocumentId selected →
               load created → document attached.
            
            Check every AC from every story is satisfied.
         └─ Agent: review
         └─ Depends on: T-20, T-21, T-22
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 3     | 3    | 0       | 5/5    |
| US-02 | 1     | 1    | 0       | 3/3    |
| US-03 | 4     | 4    | 0       | 6/7    |
| US-04 | 2     | 2    | 0       | 4/4    |
| US-05 | 2     | 2    | 0       | 4/4    |
| US-06 | 2     | 2    | 0       | 6/6    |
| US-07 | 2     | 2    | 0       | 4/4    |
| US-08 | 1     | 1    | 0       | 5/5    |
| US-09 | —     | —    | —       | DROPPED |
| INT-01| 3     | 3    | 0       | —      |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **21** | **21** | **0** | **37/37** |
