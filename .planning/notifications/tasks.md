# Track 11 · Notifications Tasks
_Last updated: 2026-04-25 11:10_
_Plan: .planning/notifications/plan.md_

---

## US-01: Tenant-scoped notification history and overrides
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `GET /notifications/loads/:loadId/history` scoped by `organizationId` — cross-org request returns empty array
- [x] `GET /notifications/loads/:loadId/overrides` scoped by `organizationId` — cross-org request returns empty array
- [x] Regression tests prove cross-org reads return empty for both endpoints

**Tasks:**
[x] T-01 [TYPES] Update repo port signatures to require `organizationId`
         └─ Detail: In `src/notifications/types/notificationRepoPort.ts`:
            - `NotificationLogRepoPort.findByLoadId(loadId: string)` → `findByLoadId(loadId: string, organizationId: string)`
            - `LoadNotificationOverrideRepoPort.findByLoadId(loadId: string)` → `findByLoadId(loadId: string, organizationId: string)`
         └─ Depends on: —
         └─ Output: Port signatures updated. Both interfaces now require organizationId.

[x] T-02 [DB] Update repo implementations to scope via load join
         └─ Detail: In `src/notifications/repositories/notificationLogRepositoryPrisma.ts`:
            - `findByLoadId` add `where: { loadId, load: { organizationId } }` (Prisma relation filter)
            In `src/notifications/repositories/loadNotificationOverrideRepositoryPrisma.ts`:
            - `findByLoadId` add `where: { loadId, load: { organizationId } }` (same pattern)
         └─ Depends on: T-01
         └─ Output: Both repos now filter via `load: { organizationId }` relation join.

[x] T-03 [API] Update controller + service to pass `organizationId`
         └─ Detail: Controller and service updated.
         └─ Depends on: T-02
         └─ Output: Controller uses `req.organizationId` (not `req.scope.organizationId` — matches codebase convention). Service interface + implementation updated. Also fixed 2 call sites in notificationSubscriber.ts that needed organizationId.

[x] T-04 [TEST] Regression tests for cross-org tenant isolation
         └─ Detail: Created `src/notifications/services/__tests__/tenantScoping.test.ts`
         └─ Depends on: T-03
         └─ Output: 5 tests: repo log scoping, repo override scoping, service forwarding, controller getHistory, controller getOverrides. All pass.

---

## US-02: Document upload email template
_Priority: P0 | Services: emails | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] `renderDocumentUploadedEmail` exported from `@hussle/emails` index
- [x] Email shows load number, document type, and tracking link (when available)
- [x] SMS template returns body with load number and document type

**Tasks:**
[x] T-05 [EMAIL] Create DocumentUploadedEmail React Email template + SMS template
         └─ Depends on: —
         └─ Output: Created:
            - `hussle-emails/src/documentUploaded/DocumentUploadedEmail.tsx` (React component)
            - `hussle-emails/src/documentUploaded/renderDocumentUploadedEmail.ts` (render fn + types)
            - `hussle-emails/emails/DocumentUploadedEmail.tsx` (preview)
            - `hussle-emails/src/index.ts` updated with exports
            - `hussle-app-dispatch-api/src/notifications/templates/documentUploadedSms.ts` (SMS template)
            - `hussle-app-dispatch-api/src/notifications/types/notificationTypes.ts` updated with `DocumentUploadedContext`
            hussle-emails tsc build clean. Exports: `renderDocumentUploadedEmail`, `DocumentUploadedEmailData`, `DocumentUploadedContext`, `documentUploadedSmsBody`.

---

## US-03: Document upload notification pipeline
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `document.confirmed` event enriched with load context (loadId, customerId, loadNumber, contact info)
- [x] Notification subscriber handles `document.confirmed` → sends email + SMS to customer
- [x] Non-load entity types (carrier, driver, vehicle documents) do NOT trigger customer notifications
- [x] Customer preferences respected — disabled channel does not fire
- [x] Notification log entry created for each sent notification

**Tasks:**
[x] T-06 [TYPES] Update event map for enriched `document.confirmed`
         └─ Depends on: —
         └─ Output: `eventMap.ts` updated with optional enriched fields: loadId, customerId, loadNumber, contactEmail, contactPhone, contactCcEmails.

[x] T-07 [API] Enrich `document.confirmed` event in `documentService.confirm()`
         └─ Depends on: T-06
         └─ Output: Added `LoadContactQueryPort` to documentTypes.ts. documentService.confirm() now looks up load contact via the port when entityType === 'load'. Wired in compositionRoot.ts and index.ts. Note: Load model uses `contact` relation (not flat contactEmail/contactPhone fields) — implementation maps through `contact: { select: { email, phone, ccEmails } }`.

[x] T-08 [API] Add content builder for document uploaded
         └─ Depends on: T-05, T-06
         └─ Output: `buildDocumentUploadedContent` added to notificationContentBuilder.ts. Imports renderDocumentUploadedEmail from @hussle/emails and documentUploadedSmsBody from templates.

[x] T-09 [API] Subscribe to `document.confirmed` in notification subscriber
         └─ Depends on: T-07, T-08
         └─ Output: New subscription in notificationSubscriber.ts. Guards on entityType !== 'load' and null customerId. Resolves settings with 'DOCUMENT_UPLOADED' trigger, builds content, sends via sendNotification helper.

[x] T-10 [TEST] Unit tests for document upload notification flow
         └─ Depends on: T-09
         └─ Output: 6 new subscriber tests (email send, SMS send, disabled skip, non-load skip, null customer skip, log creation) + 2 SMS template tests. All pass. 46/46 total across 6 suites.

---

## INT-01: Wire check — notification subscriber integration
_Auto-generated | Services: dispatch-api, emails_

**Verification Checklist:**
- [x] `renderDocumentUploadedEmail` import in content builder matches the exported signature from `@hussle/emails`
- [x] `DocumentUploadedEmailData` shape matches `DocumentUploadedContext` fields passed by content builder
- [x] `document.confirmed` event map type includes all enriched fields used by subscriber
- [x] `DOCUMENT_UPLOADED` string literal in subscriber matches `NotificationTrigger` Prisma enum value
- [x] Tenant-scoped `findByLoadId` signature matches all call sites (controller, service, subscriber internal calls)
- [x] `organizationId` flows from `req.organizationId` through controller → service → repo for both history and overrides

**Tasks:**
[x] T-11 [WIRE] Verify full notification wiring against types and event map
         └─ Agent: review
         └─ Depends on: T-04, T-10
         └─ Output: 6/6 checklist items verified. One issue found and fixed: subscriber used `data.entityId` instead of `data.loadId` for override lookup + tracking URL + sendNotification — functionally equivalent (guarded by entityType === 'load') but semantically incorrect. Fixed: extracted `const loadId = data.loadId ?? data.entityId` and used throughout. Tests still pass 17/17.

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-12 [VERIFY] Trace complete notification flow
         └─ Agent: review
         └─ Depends on: T-11
         └─ Output: All flows traced. STATUS_CHANGE: PASS. CHECK_CALL: PASS. DOCUMENT_UPLOADED: PASS (after T-11 fix). Tenant scoping: PASS — organizationId flows controller → service → repo for both history and overrides. Opt-out: PASS — resolveNotificationSettings returns empty configs → no send. Non-load guard: PASS — early return before settings lookup.

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 4     | 4    | 0       | 3/3    |
| US-02 | 1     | 1    | 0       | 3/3    |
| US-03 | 5     | 5    | 0       | 5/5    |
| INT-01| 1     | 1    | 0       | 6/6 ✓  |
| VER-01| 1     | 1    | 0       | 6/6 ✓  |
| **All** | **12** | **12** | **0** | **11/11** |
