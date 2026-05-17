# Document Management Tasks
_Last updated: 2026-04-26 11:30_
_Plan: .planning/document-management/plan.md_
_Contract: .planning/document-management/contract.yaml_
_Shared types: .planning/document-management/types.ts_
_Designs: .planning/document-management/designs/_

---

## US-01: Expand DocumentType enum (schema migration)
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] All 25 new `DocumentType` enum values present in `prisma/schema.prisma`.
- [x] A new migration file under `hussle-app-dispatch-api/prisma/migrations/` adds the values via `ALTER TYPE "DocumentType" ADD VALUE` (one per value).
- [x] Migration applies cleanly on a scratch DB (`npx prisma migrate dev` with no errors). _Verified: ran `npx prisma migrate deploy` inside the `fleet-command-dispatch-api-1` container against the live Docker Postgres. All 46 migrations (including the new one) applied. Confirmed via `SELECT unnest(enum_range(NULL::"DocumentType"))` — 43 values present (18 original + 25 new)._
- [x] Existing rows are unaffected (additive only — no column changes).

**Tasks:**
[x] T-01 [DB] Extend `DocumentType` enum in Prisma schema
         └─ Detail: Edit `hussle-app-dispatch-api/prisma/schema.prisma` lines 417–436. After `OTHER`, append the 25 new values grouped by entity pack (driver, carrier, vehicle, load) per plan.md §"Schema migration":
            - Driver: MEDICAL_CARD, MVR, DRUG_TEST, ROAD_TEST_CERT, DRIVER_APPLICATION, PSP_REPORT, BACKGROUND_CHECK, ANNUAL_REVIEW, HAZMAT_ENDORSEMENT, TWIC_CARD
            - Carrier: MC_AUTHORITY, VOIDED_CHECK, NOTICE_OF_ASSIGNMENT, BOC3, IFTA_LICENSE
            - Vehicle: TITLE, IFTA_DECAL, IRP_CAB_CARD, MAINTENANCE_RECORD, LEASE_AGREEMENT, BIT_INSPECTION
            - Load: TEMPERATURE_LOG, TONU_DOC, FUEL_RECEIPT, LOAD_PHOTO
         └─ Depends on: —
         └─ Output: Edited `prisma/schema.prisma` lines 417-461 — appended 25 enum values grouped by Driver / Carrier / Vehicle / Load packs. Existing values untouched. Status: DONE.

[x] T-02 [DB] Generate Prisma migration for enum additions
         └─ Detail: From `hussle-app-dispatch-api/`, run `npx prisma migrate dev --name expand_document_type_enum --create-only` (then apply with `prisma migrate dev`). Postgres requires one `ALTER TYPE ... ADD VALUE` statement per value, each in its own transaction — Prisma generates this automatically. Verify migration SQL contains 25 ALTER TYPE statements. Run `npx prisma generate` so the TS Prisma client picks up the new enum values.
         └─ Depends on: T-01
         └─ Output: Created `prisma/migrations/20260426010000_expand_document_type_enum/migration.sql` with 25 `ALTER TYPE "DocumentType" ADD VALUE` statements. Hand-wrote the SQL because `prisma migrate dev` couldn't reach `hussle-app-postgres:5432` (Docker postgres not running locally). Format matches Prisma's standard enum-extension migration. Ran `npx prisma generate` — succeeded; verified new enum values are present in the generated client (`grep -c` of MEDICAL_CARD/HAZMAT_ENDORSEMENT/LOAD_PHOTO/MC_AUTHORITY/TITLE in `node_modules/.prisma/client/index.d.ts` → 5 matches). Migration will apply on next `prisma migrate deploy` against a real DB. Status: DONE.

---

## US-02: Backend audit, admin guard, and uploader embed
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Architectural decision (logged 2026-04-26):** Audit emission follows the existing event-subscriber pattern in `src/audit/services/auditSubscriber.ts`. Business modules publish domain events; the audit module subscribes and writes audit rows. The documents module does NOT import `auditLogRepo`. Existing precedents: `organization.created` → CREATE, `invitation.created` → INVITE_SENT.

A second wrinkle: the plan's claim that "`confirm` already archives prior docs of the same type for `onePer` types" is not accurate. Today, `archiveByEntityAndType` is only called from `loadTimestampSubscriber` and only for `BROKER_RATE_CON`. Generic `onePer` archiving must be built — a new subscriber on `document.confirmed` handles it.

**Acceptance Criteria:**
- [x] `PATCH /documents/:id/archive` returns 403 for non-ADMIN users.
- [x] `documentService.archive` publishes a `document.archived` event with `{ documentId, organizationId, fileName, type, entityType, entityId, requestingUserId }`.
- [x] A new generic `documentArchiveSubscriber` listens to `document.confirmed`, archives prior docs of the same type for `onePer` types (any entity), and publishes one `document.replaced` event per superseded doc with `{ priorDocumentId, priorS3Key, replacedBy, entityType, entityId, organizationId, requestingUserId }`.
- [x] `loadTimestampSubscriber` no longer calls `archiveByEntityAndType` for `BROKER_RATE_CON` (moved to the generic subscriber); it still updates load timestamps.
- [x] `auditSubscriber` subscribes to `document.archived` (writes `action: 'DOCUMENT_ARCHIVED'`, `metadata: { fileName, type, entityType, entityId }`) and `document.replaced` (writes `action: 'DOCUMENT_REPLACED'`, `metadata: { replacedBy, priorS3Key, entityType, entityId }`).
- [x] `DocumentResponse` includes `uploadedBy: { firstName, lastName } | null`.
- [x] Repo `findById`, `findManyByIds`, `findMany` use Prisma `include: { uploadedByUser: { select: { firstName, lastName } } }`.
- [x] `archiveByEntityAndType` returns the archived rows (not just a count) so the subscriber can publish `document.replaced` per row.
- [x] Existing `documentService.test.ts` still passes; new unit tests cover the archive subscriber's onePer logic and the audit subscriber's two new subscriptions. _40/40 tests across 5 related suites pass._
- [~] `npm run validate` in `hussle-app-dispatch-api` passes. _Related-tests + typecheck clean (29 pre-existing hussle-emails rootDir errors unchanged); full validate (lint + lint:deps + check-ts + test) not run._

**Tasks:**
[x] T-03 [AUTH] Add `requireRole(['ADMIN'])` to archive route
         └─ Detail: In `hussle-app-dispatch-api/src/documents/routes/documentRoutes.ts`, import `requireRole` from `@/middleware/auth` and insert it between `requireAuth` and `validateRequest(documentIdValidator)` on the `PATCH /:id/archive` route (line 51–56). Same pattern as auth module routes.
         └─ Depends on: —
         └─ Output:

[x] T-04 [DB] Wire `uploadedByUser` relation in Prisma schema
         └─ Detail: Inspect `hussle-app-dispatch-api/prisma/schema.prisma` at the `Document` model (lines 976–1007) and the `User` model. If a relation between `Document.uploadedByUserId` and `User.id` does not yet exist, add a named relation field (e.g. `uploadedByUser User? @relation("DocumentUploader", fields: [uploadedByUserId], references: [id])`) plus the inverse on User. If a relation already exists, skip schema edits and only add the `include` in the repository in T-05. Generate a migration only if a relation field was added.
         └─ Depends on: T-02
         └─ Output:

[x] T-05 [DB] Include uploader in repository queries
         └─ Detail: In `hussle-app-dispatch-api/src/documents/repositories/documentRepositoryPrisma.ts`, define a constant `const DOCUMENT_INCLUDES = { uploadedByUser: { select: { firstName: true, lastName: true } } } as const;` and pass it as `include` to `findById`, `findManyByIds`, and `findMany`. Update the repo port `DocumentRepoPort` types in `hussle-app-dispatch-api/src/documents/types/documentTypes.ts` so return types reflect the included relation (use `Prisma.DocumentGetPayload<{ include: typeof DOCUMENT_INCLUDES }>` exported as `DocumentWithUploader`).
         └─ Depends on: T-04
         └─ Output:

[x] T-06 [API] Update `toDocumentResponse` to include `uploadedBy`
         └─ Detail: In `hussle-app-dispatch-api/src/documents/controllers/transformers/documentTransformer.ts`, extend `DocumentResponse` with `uploadedBy: { firstName: string; lastName: string } | null;`. Update `DocumentListItem` (in documentTypes.ts) to include `uploadedByUser` and update `toDocumentResponse` to map `item.uploadedByUser ? { firstName, lastName } : null`. Match the `DocumentUploader` shape from `.planning/document-management/types.ts:91-94` exactly.
         └─ Depends on: T-05
         └─ Output:

[x] T-07 [REPO] Have `archiveByEntityAndType` return superseded rows
         └─ Detail: In `hussle-app-dispatch-api/src/documents/repositories/documentRepositoryPrisma.ts`, change `archiveByEntityAndType` from `Promise<number>` to `Promise<Document[]>`. Implementation: first `findMany` the matching candidates (same `entityType`, `entityId`, `type`, `id: { not: excludeId }`, `isArchived: false`), then `updateMany` to flip `isArchived: true`, then return the candidate rows (you already have them — no second select). Update the `DocumentRepoPort` signature in `hussle-app-dispatch-api/src/documents/types/documentTypes.ts` to match. Search for callers of `archiveByEntityAndType` and update them: today only `loadTimestampSubscriber.ts:28-33` calls it (drop the result there — handled in T-09).
         └─ Depends on: —
         └─ Output:

[x] T-08 [API] documentService.archive publishes `document.archived` event
         └─ Detail: In `hussle-app-dispatch-api/src/documents/services/documentService.ts`, add `requestingUserId?: string` to `ArchiveDocumentInput` (in documentTypes.ts) and populate it from `req.user.id` in `documentIdMapper.ts`. In `archive()` (line 168), after the repo archive succeeds, publish:
            ```
            await deps.eventBus.publish('document.archived', {
              documentId: document.id,
              organizationId: document.organizationId,
              fileName: document.fileName,
              type: document.type,
              entityType: document.entityType,
              entityId: document.entityId,
              requestingUserId: input.requestingUserId ?? null,
            });
            ```
            Do NOT inject `auditLogRepo` into the documents module — audit writes happen in the audit subscriber (T-10). Service tests should assert the event is published (not that audit was written).
         └─ Depends on: —
         └─ Output:

[x] T-09 [SUB] Build generic onePer archive subscriber + publish `document.replaced`
         └─ Detail: Create `hussle-app-dispatch-api/src/documents/services/documentArchiveSubscriber.ts`. Subscribes to `document.confirmed` under group `'document-archive-service'`. For each event:
            (1) Mirror `DOC_TYPE_CONFIG`'s `onePer` flag server-side. Add a server constant `ONE_PER_DOCUMENT_TYPES: ReadonlySet<DocumentType>` in `documents/types/documentTypes.ts` (or a new `documentTypeConfig.ts`) covering: `BROKER_RATE_CON`, `BOL_UNSIGNED`, `BOL_SIGNED`, `POD`, `DISPATCH_AGREEMENT`, `W9`, `CARRIER_PACKET`, `LICENSE`, `REGISTRATION`, `INSPECTION_CERT`, `LOA`, `MEDICAL_CARD`, `HAZMAT_ENDORSEMENT`, `TWIC_CARD`, `IFTA_LICENSE`, `IFTA_DECAL`, `IRP_CAB_CARD`, `BIT_INSPECTION`, `MC_AUTHORITY`, `BOC3`, `TITLE`, `LEASE_AGREEMENT`. (Keep this list in sync with the UI's `DOC_TYPE_CONFIG`; add a unit test that fails if the two drift.)
            (2) If `documentType` is in `ONE_PER_DOCUMENT_TYPES`, call `archiveByEntityAndType(entityType, entityId, documentType, newDocumentId)` (now returns `Document[]`).
            (3) For each superseded row, publish:
               ```
               await deps.eventBus.publish('document.replaced', {
                 priorDocumentId: row.id,
                 priorS3Key: row.s3Key,
                 replacedBy: data.documentId,
                 entityType: data.entityType,
                 entityId: data.entityId,
                 organizationId: data.organizationId,
                 documentType: data.documentType,
                 requestingUserId: data.requestingUserId ?? null,
               });
               ```
            (4) Wire into `documents/compositionRoot.ts` next to `loadTimestampSubscriber` — both subscribe to the same event independently. Initialize from `documents/index.ts` like the existing one.
            (5) Modify `loadTimestampSubscriber.ts:27-33`: remove the `archiveByEntityAndType` call from the `BROKER_RATE_CON` branch (this generic subscriber owns it now). Keep the `loadTimestampPort.updateTimestamp` call.
            (6) Add `requestingUserId?: string | null` to the `document.confirmed` event payload (published by `documentService.confirm()` line 124–131) so the subscriber can forward it. Pull from `ConfirmInput` (mapper populates from `req.user.id`).
         └─ Depends on: T-07
         └─ Output:

[x] T-10 [SUB] Extend auditSubscriber with document.archived + document.replaced
         └─ Detail: In `hussle-app-dispatch-api/src/audit/services/auditSubscriber.ts`, add two new subscriptions following the existing pattern (lines 22-48, 50-70):
            ```
            await deps.eventBus.subscribe('document.archived', 'audit-service', async (data) => {
              try {
                await deps.auditLogRepo.create(data.organizationId, {
                  userId: data.requestingUserId ?? null,
                  action: 'DOCUMENT_ARCHIVED',
                  entityType: 'Document',
                  entityId: data.documentId,
                  changes: null,
                  metadata: { fileName: data.fileName, type: data.type, entityType: data.entityType, entityId: data.entityId },
                });
              } catch (error: unknown) {
                deps.logger.error('Failed to create audit log for document.archived', { documentId: data.documentId, error: ... });
              }
            });

            await deps.eventBus.subscribe('document.replaced', 'audit-service', async (data) => {
              try {
                await deps.auditLogRepo.create(data.organizationId, {
                  userId: data.requestingUserId ?? null,
                  action: 'DOCUMENT_REPLACED',
                  entityType: 'Document',
                  entityId: data.priorDocumentId,
                  changes: null,
                  metadata: { replacedBy: data.replacedBy, priorS3Key: data.priorS3Key, type: data.documentType, entityType: data.entityType, entityId: data.entityId },
                });
              } catch (error: unknown) {
                deps.logger.error('Failed to create audit log for document.replaced', { priorDocumentId: data.priorDocumentId, error: ... });
              }
            });
            ```
            Update the EventBus payload typings if they're typed (search `'organization.created'` in the eventBus module to find the type registry — extend it with the two new event payloads). Update `auditSubscriber.test.ts` with two new test cases mirroring the existing ones.
         └─ Depends on: T-08, T-09
         └─ Output:

[x] T-11 [TEST] Unit tests for archive subscriber + service event publishing
         └─ Detail: Add `hussle-app-dispatch-api/src/documents/services/__tests__/documentArchiveSubscriber.test.ts` covering:
            (a) onePer type with prior docs → `archiveByEntityAndType` called, one `document.replaced` published per superseded row;
            (b) non-onePer type → `archiveByEntityAndType` NOT called, no `document.replaced` published;
            (c) onePer type with no priors → `archiveByEntityAndType` returns `[]`, no `document.replaced` published.
            Mock the `eventBus` with a fake subscribe that captures the handler, then invoke the handler with simulated payloads. Mirror the structure of `audit/services/__tests__/auditSubscriber.test.ts`.
            Also extend `documentService.test.ts` `archive` block: assert `eventBus.publish` is called with `'document.archived'` and the expected payload after the archive write succeeds.
         └─ Depends on: T-08, T-09
         └─ Output:

[x] T-12 [TEST] Integration test for ADMIN-only archive route
         └─ Detail: Add a new file `hussle-app-dispatch-api/src/documents/__tests__/integration/archiveRoute.integration.test.ts` (create the dir if needed). Two cases: (a) authenticated DISPATCHER → `PATCH /documents/:id/archive` returns 403; (b) authenticated ADMIN → returns 200. Follow the integration test pattern from any existing `*.integration.test.ts` in this repo (use Grep `*.integration.test.ts` to find one). If no integration test infrastructure exists, write the test as a unit test against the controller wired with the real `requireRole` middleware.
         └─ Depends on: T-03
         └─ Output:

---

## US-03: Frontend type + config expansion
_Priority: P0 | Services: dispatch-ui | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] `DocumentType` enum in `hussle-app-dispatch-ui/src/features/documents/types.ts` matches `.planning/document-management/types.ts` (all 25 new values + existing).
- [x] `DOC_TYPE_CONFIG` in `hussle-app-dispatch-ui/src/features/documents/constants.ts` has entries for all 25 new types with proper `label`, `onePer`, `compliance`, and `metadataFields` per plan.md.
- [x] `DOCUMENT_CONTEXTS` exposes:
      - driver-profile: existing + 10 new driver types
      - carrier-detail: existing + 5 new carrier types
      - vehicle-detail: existing + 6 new vehicle types
      - load-detail: existing + 4 new load types + `BROKER_RATE_CON` + `LOA` + `OTHER`
      - create-load: existing + `OTHER`
- [x] `DOC_TYPE_SHORT_LABELS` has shortLabel + description for all 25 new types.
- [x] Compliance flag is `true` for: MEDICAL_CARD, HAZMAT_ENDORSEMENT, TWIC_CARD, IFTA_LICENSE, IFTA_DECAL, IRP_CAB_CARD, BIT_INSPECTION (compliance docs with expiry per plan AC).
- [x] `Document` type extended with `uploadedBy?: { firstName: string; lastName: string } | null` to match contract.

**Tasks:**
[x] T-13 [TYPES] Update DocumentType enum and Document type on UI side
         └─ Detail: In `hussle-app-dispatch-ui/src/features/documents/types.ts`, add the 25 new enum values matching `.planning/document-management/types.ts:7-56` exactly. Also add `uploadedBy?: { firstName: string; lastName: string } | null;` to the `Document` interface. Re-run check-ts after.
         └─ Depends on: —
         └─ Output:

[x] T-14 [TYPES] Expand DOC_TYPE_CONFIG, DOC_TYPE_SHORT_LABELS, DOCUMENT_CONTEXTS
         └─ Detail: Edit `hussle-app-dispatch-ui/src/features/documents/constants.ts`:
            (1) Add 25 entries to `DOC_TYPE_CONFIG`. Set `onePer: true` and `compliance: true` for: MEDICAL_CARD, HAZMAT_ENDORSEMENT, TWIC_CARD, IFTA_LICENSE, IFTA_DECAL, IRP_CAB_CARD, BIT_INSPECTION, MC_AUTHORITY, BOC3, TITLE, LEASE_AGREEMENT. Set `onePer: false, compliance: false` for: MVR, DRUG_TEST, ANNUAL_REVIEW, MAINTENANCE_RECORD, BIT_INSPECTION (note BIT is compliance), PSP_REPORT, BACKGROUND_CHECK, ROAD_TEST_CERT, DRIVER_APPLICATION, VOIDED_CHECK, NOTICE_OF_ASSIGNMENT, TEMPERATURE_LOG, TONU_DOC, FUEL_RECEIPT, LOAD_PHOTO. Use the display names from contract.yaml lines 416–459 verbatim as `label`.
            (2) Add the same 25 keys to `DOC_TYPE_SHORT_LABELS` with concise shortLabels (≤14 chars) and one-line descriptions.
            (3) Update `DOCUMENT_CONTEXTS`:
               - 'create-load': append `DocumentType.OTHER`
               - 'load-detail': append `DocumentType.BROKER_RATE_CON, DocumentType.LOA, DocumentType.TEMPERATURE_LOG, DocumentType.TONU_DOC, DocumentType.FUEL_RECEIPT, DocumentType.LOAD_PHOTO, DocumentType.OTHER`
               - 'carrier-detail': append the 5 carrier types
               - 'driver-profile': append the 10 driver types
               - 'vehicle-detail': append the 6 vehicle types
         └─ Depends on: T-13
         └─ Output:

---

## US-04: ExpiryBadge component
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] Component at `hussle-app-dispatch-ui/src/features/documents/components/ExpiryBadge/index.tsx` exporting `ExpiryBadge: React.FC<ExpiryBadgeProps>`.
- [x] Returns `null` when `expiresAt` is null/undefined or > 30 days away.
- [x] Renders a `Chip` with correct color (`error`/`warning`), icon, and label per the threshold table in `designs/ExpiryBadge.md`.
- [x] `aria-label` matches the visible label.
- [x] Co-located test file `ExpiryBadge.test.tsx` covers: null, > 30 days (no chip), 22 days (warning), 5 days (error), 1 day (singular), today (0 days), expired (< 0 days). _9/9 tests pass._

**Tasks:**
[x] T-15 [UI] Build ExpiryBadge component
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/documents/components/ExpiryBadge/index.tsx`. Use `differenceInCalendarDays` from `date-fns`. MUI `Chip` (`size="small"`, `variant="filled"`). Icons: `ErrorOutlineOutlined` and `WarningAmberOutlined` from `@ant-design/icons` (check existing usage — if these icons don't exist there, fall back to MUI icons from `@mui/icons-material`). Export `ExpiryBadgeProps` interface. Threshold logic per `designs/ExpiryBadge.md` §Threshold Logic table. No styled() — use `sx` if needed.
         └─ Depends on: —
         └─ Output:

[x] T-16 [TEST] Unit tests for ExpiryBadge
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/documents/components/ExpiryBadge/ExpiryBadge.test.tsx`. Use jest fake timers / mock `Date` to fix "now" at a known instant. Cases per AC. Use `screen.queryByRole('img')` for the chip. Use `getByText` to assert label. Use `screen.queryByRole(...)` to assert null cases render nothing.
         └─ Depends on: T-15
         └─ Output:

---

## US-05: Archive + download URL sagas + actions
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] New API client functions `archiveDocument(id)` and `getDocumentDownloadUrl(id)` in `hussle-app-dispatch-ui/src/utils/api/documents/documentApi.ts`.
- [x] New actions in `documentPageSlice`: `archiveDocumentRequest`, `archiveDocumentSuccess`, `archiveDocumentFailure`, `getDownloadUrlRequest`, `getDownloadUrlSuccess`, `getDownloadUrlFailure` + `downloadUrls` map in state.
- [x] New saga files `archiveDocumentSaga.ts` and `getDownloadUrlSaga.ts` under `features/documents/store/sagas/`.
- [x] `documentSagaWatcher.ts` registers both with `takeEvery`.
- [x] On archive success, the document is removed from the entity slice via `documentActions.removeOne(id)`; success snackbar via `notistack`.
- [x] On archive failure (e.g. 403), an error snackbar surfaces the message and the entity slice is NOT modified.
- [x] `getDownloadUrlSaga` returns the URL via the `getDownloadUrlSuccess` action payload `{ documentId, url }`. The saga itself does not call `window.open` — that is the consumer's responsibility (kebab handler, drawer footer).

**Tasks:**
[x] T-17 [API] Add archive + download URL API client functions
         └─ Detail: Edit `hussle-app-dispatch-ui/src/utils/api/documents/documentApi.ts`. Add:
            ```
            export const archiveDocument = async (documentId: string): Promise<{ document: Document }> => {
              const response = await axiosInstance.patch<{ data: Document }>(`/documents/${documentId}/archive`);
              return { document: response.data.data };
            };

            export const getDocumentDownloadUrl = async (documentId: string): Promise<{ url: string }> => {
              const response = await axiosInstance.get<{ data: { url: string } }>(`/documents/${documentId}/download`);
              return { url: response.data.data.url };
            };
            ```
            Match the existing wrapping pattern (server returns `{ data: ... }` envelope).
         └─ Depends on: —
         └─ Output:

[x] T-18 [STATE] Add saga actions to documentPageSlice
         └─ Detail: In `hussle-app-dispatch-ui/src/features/documents/store/reducers/documentPageSlice.ts`, add reducers for `archiveDocumentRequest({ documentId })`, `archiveDocumentSuccess({ documentId })`, `archiveDocumentFailure({ documentId, error })` keyed `archive:<id>` in loading/errors. Same for `getDownloadUrlRequest({ documentId })` / `getDownloadUrlSuccess({ documentId, url })` / `getDownloadUrlFailure({ documentId, error })` keyed `download:<id>`. Export the actions.
         └─ Depends on: —
         └─ Output:

[x] T-19 [SAGA] archiveDocumentSaga
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/documents/store/sagas/archiveDocumentSaga.ts`. Pattern matches `uploadDocumentSaga.ts`: call `archiveDocument(documentId)`, on success `yield put(documentActions.removeOne(documentId))` then `archiveDocumentSuccess({ documentId })`, snackbar success "Document deleted". On error, dispatch `archiveDocumentFailure` with parsed message and snackbar error.
         └─ Depends on: T-17, T-18
         └─ Output:

[x] T-20 [SAGA] getDownloadUrlSaga
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/documents/store/sagas/getDownloadUrlSaga.ts`. Calls `getDocumentDownloadUrl(documentId)` and dispatches `getDownloadUrlSuccess({ documentId, url })`. Failure path identical pattern to other sagas. The saga does NOT call `window.open` — the consumer (kebab menu / drawer) listens for success and opens the URL.
         └─ Depends on: T-17, T-18
         └─ Output:

[x] T-21 [SAGA] Register both sagas in watcher
         └─ Detail: In `hussle-app-dispatch-ui/src/features/documents/store/sagas/documentSagaWatcher.ts`, import and register: `yield takeEvery(archiveDocumentRequest.type, archiveDocumentSaga);` and `yield takeEvery(getDownloadUrlRequest.type, getDownloadUrlSaga);`.
         └─ Depends on: T-19, T-20
         └─ Output:

---

## US-06: DocumentDetailDrawer
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] New drawer at `hussle-app-dispatch-ui/src/features/documents/components/DocumentDetailDrawer/index.tsx`.
- [x] Registered as `documentDetail` in `drawerRegistry.ts` and added to `DrawerType` + `DrawerTypeMap` (`{ documentId: string }`).
- [x] Opens via `useDrawerActions().openDrawer('documentDetail', { documentId })`.
- [x] Header shows file name (or `metadata.customLabel` when type is OTHER and customLabel is set).
- [x] Body has two `SectionCard`s: "Document Details" (DetailRows for Type/File/Uploaded By/Uploaded/Expires + ExpiryBadge inline/Notes/conditional metadata fields) and "Preview" (iframe for PDF, img for image, fallback message otherwise).
- [x] Width: 640px on desktop, 100% on `< 768px`. _Used a custom MUI `Drawer` (not `EditDrawer`) because EditDrawer hardcodes a 480px width and the read-only drawer doesn't need dirty-form blocking._
- [x] Footer: Download · Replace on left, Delete on right (admin-only via `formattedCurrentUserSelector.role === 'ADMIN'` — the actual auth selector; `userSession.user.role` doesn't exist).
- [x] Download dispatches `getDownloadUrlRequest`; on success, calls `window.open(url, '_blank', 'noopener,noreferrer')`. The drawer reuses the cached URL it fetched for preview if available.
- [x] Replace closes the detail drawer and opens `documentUpload` drawer with `preselectedDocType` + `lockDocType: true`.
- [~] Delete opens `confirmDeleteDocument` modal. _Deferred wiring: handler is a no-op (`/* wired in US-07 */`) until T-26 extends `ModalType` + `ModalTypeMap` with `'confirmDeleteDocument'`. Re-wire in US-07._
- [x] Loading state shows skeletons for metadata + preview area; footer buttons disabled while URL is being fetched.
- [x] Error state shows "Couldn't load preview" + Retry button when URL fetch fails.

**Tasks:**
[x] T-22 [TYPES] Extend DrawerType + DrawerTypeMap for documentDetail
         └─ Detail: Edit `hussle-app-dispatch-ui/src/features/ui/types/popupTypes.ts`. Add `'documentDetail'` to `DrawerType` union. Add `documentDetail: { documentId: string };` to `DrawerTypeMap`.
         └─ Depends on: —
         └─ Output:

[x] T-23 [UI] Build DocumentDetailDrawer component
         └─ Detail: Create the file per `designs/DocumentDetailDrawer.md`. Use `EditDrawer` from `components/EditDrawer` (640px width prop if it accepts; otherwise inline `sx={{ width: { xs: '100vw', md: 640 } }}`), `SectionCard` from `components/SectionCard`, `DetailRow` + `BodyMuted` from `components/Typography`. Consume document via `useSelector(selectDocumentById(documentId))`. On mount, dispatch `getDownloadUrlRequest({ documentId })` and read URL from a new `selectDownloadUrlByDocId` selector (add it to `documentSelectors.ts`). Internal `DocumentPreviewArea` subcomponent switches on `mimeType` (`application/pdf` → `<iframe>`, `image/*` → `<img>`, else fallback). Footer uses MUI `Button`s. Replace handler: `dispatch(closeDrawer()); dispatch(openDrawer('documentUpload', { context, entityType, entityId, preselectedDocType: doc.type, lockDocType: true }))` — derive `context` from `entityType` (load+entityId on a load-detail page → 'load-detail', etc. — add a small mapping helper at the top of the file). Use `useAuth()` to check `userSession?.user?.role === 'ADMIN'` to gate the Delete button.
         └─ Depends on: T-13, T-14, T-15, T-18, T-22
         └─ Output:

[x] T-24 [UI] Register DocumentDetailDrawer in drawerRegistry
         └─ Detail: In `hussle-app-dispatch-ui/src/features/ui/drawerRegistry.ts`, import the new drawer and add `documentDetail: DocumentDetailDrawer` to the `drawerRegistry` object.
         └─ Depends on: T-23
         └─ Output:

[x] T-25 [SELECTOR] Add document selectors
         └─ Detail: In `hussle-app-dispatch-ui/src/features/documents/store/selectors/documentSelectors.ts`, add `selectDocumentById(id: string)` (parameterized — `(state) => documentEntityAdapter selectors.selectById(state, id)`) and `selectDownloadUrlByDocId(id: string)` (reads from a new `downloadUrls: Record<string, string>` map on documentPageSlice — add this to T-18 if not already there). Update T-18 if needed.
         └─ Depends on: T-18
         └─ Output:

---

## US-07: ConfirmDeleteDocumentModal + DocumentTable kebab actions
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] New modal at `hussle-app-dispatch-ui/src/features/documents/components/ConfirmDeleteDocumentModal/index.tsx`.
- [x] Registered as `confirmDeleteDocument` in `modalRegistry.ts`, with `ModalType` + `ModalTypeMap` updated to include `confirmDeleteDocument: { documentId: string; fileName: string; type: DocumentType }`.
- [x] On confirm, dispatches `archiveDocumentRequest({ documentId })` and `closeModal()`. Optimistic — row disappears on saga success (already wired in US-05).
- [x] `DocumentTable` adds an Actions column (kebab) `pinned: 'right'`, width 56, no header label.
- [x] Kebab menu items: View, Download, Replace, and Delete (admin-only).
- [x] Row click opens `documentDetail` drawer; clicking the kebab does NOT also open the drawer (event.stopPropagation).
- [x] Type cell renders `metadata.customLabel` when `type === 'OTHER'` and `customLabel` is non-empty; falls back to `DOC_TYPE_CONFIG[type].label`.
- [x] Expires cell renders date + inline `ExpiryBadge`.
- [x] All existing DocumentTable behavior (multi-select, bulk download) preserved. _11/11 tests pass; DocumentDetailDrawer Delete handler also re-wired now that ModalType includes 'confirmDeleteDocument'._

**Tasks:**
[x] T-26 [TYPES] Extend ModalType + ModalTypeMap for confirmDeleteDocument
         └─ Detail: Edit `hussle-app-dispatch-ui/src/features/ui/types/popupTypes.ts`. Add `'confirmDeleteDocument'` to `ModalType`. Add `confirmDeleteDocument: { documentId: string; fileName: string; type: DocumentType };` to `ModalTypeMap`. Import `DocumentType` from `'../../documents/types'` (already imported at top of file).
         └─ Depends on: —
         └─ Output:

[x] T-27 [UI] Build ConfirmDeleteDocumentModal
         └─ Detail: Create `.../ConfirmDeleteDocumentModal/index.tsx`. Use MUI `Dialog` with `maxWidth="sm"` (or the project's standard `ConfirmDialog`/`FormDialog` if one exists — Grep first). Title via `ModalTitle`. Body uses `Body` + `BodyStrong` (for type label) + `BodyMuted` (fileName + recovery hint). Footer: Cancel (text) + Delete (`variant="contained" color="error"`). Read close handler from `useModalActions().closeModal`. On Delete click: `dispatch(archiveDocumentRequest({ documentId })); closeModal();`. Type label: `DOC_TYPE_CONFIG[type].label` — for OTHER, fall back to fileName since the modal does not receive the customLabel as a prop (acceptable per design — the row that opens the modal already shows the customLabel).
         └─ Depends on: T-14, T-18, T-26
         └─ Output:

[x] T-28 [UI] Register modal in modalRegistry
         └─ Detail: In `hussle-app-dispatch-ui/src/features/ui/modalRegistry.ts`, import `ConfirmDeleteDocumentModal` and add `confirmDeleteDocument: ConfirmDeleteDocumentModal,` to the registry object.
         └─ Depends on: T-27
         └─ Output:

[x] T-29 [UI] Add kebab Actions column + ExpiryBadge + custom-label rendering to DocumentTable
         └─ Detail: Modify `hussle-app-dispatch-ui/src/features/documents/components/DocumentTable/index.tsx`:
            (1) Import `ExpiryBadge`, `useAuth`, `useDrawerActions`, `useModalActions`, `MoreOutlined` icon, MUI `IconButton`, `Menu`, `MenuItem`, `Divider`, `Stack`, plus `archiveDocumentRequest`/`getDownloadUrlRequest`. Also import `DOC_TYPE_CONFIG`.
            (2) Update `DocTypeCellRenderer` to branch on `data.type === 'OTHER' && data.metadata?.customLabel`.
            (3) Replace `DateCellRenderer` for the Expires column with a new `ExpiresCellRenderer` that renders `<Stack direction="row" spacing={1} alignItems="center"><Body>{date or em-dash}</Body><ExpiryBadge expiresAt={value} /></Stack>`.
            (4) Add a new `ActionsCellRenderer` (`pinned: 'right'`, width 56, no header) — local IconButton + MUI Menu component with View / Download / Replace / Delete items. Use anchor state via `useState` inside the renderer. View → `openDrawer('documentDetail', { documentId: data.id })`. Download → `dispatch(getDownloadUrlRequest({ documentId: data.id }))` and subscribe to a `useEffect` that watches `selectDownloadUrlByDocId(data.id)` and calls `window.open(url, '_blank', 'noopener,noreferrer')` once. (Simpler alternative: use a one-shot via a dispatched thunk-like action — pick the simplest pattern that works with redux-saga; if cleaner, dispatch a separate `downloadAndOpenRequest` action that the saga handles by calling `window.open` directly. Choose the simpler path; document choice in report.) Replace → `openDrawer('documentUpload', { context: deriveContext(entityType), entityType, entityId, preselectedDocType: data.type, lockDocType: true })`. Delete (admin-only via `useAuth`) → `openModal('confirmDeleteDocument', { documentId: data.id, fileName: data.fileName, type: data.type })`. Use `event.stopPropagation()` on the IconButton click.
            (5) Add `onRowClicked` to gridOptions: `(event) => { if (event.event?.target is inside actions cell) return; openDrawer('documentDetail', { documentId: event.data.id }); }`. Use AG Grid `suppressRowClickSelection: true` if it interferes with the multi-select checkbox.
         └─ Depends on: T-14, T-15, T-22, T-23, T-26, T-27, T-18, T-21, T-25
         └─ Output:

[x] T-30 [TEST] Tests for DocumentTable kebab + admin gating
         └─ Detail: Add a test next to DocumentTable (`DocumentTable.test.tsx`). Cover: (a) kebab is rendered for each row; (b) menu items View/Download/Replace are visible for non-admin; (c) Delete is hidden for non-admin and visible for admin; (d) selecting Delete dispatches `openModal('confirmDeleteDocument', ...)`; (e) clicking the type cell of an OTHER doc with `metadata.customLabel === 'Customer Form'` displays "Customer Form" instead of "Other". Mock `useAuth` and `useDispatch` per the testing patterns in `hussle-app-dispatch-ui/CLAUDE.md` §Testing.
         └─ Depends on: T-29
         └─ Output:

---

## US-08: DocumentUploadDrawer — OTHER label form + Replace mode title
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] When `lockDocType=true && preselectedDocType` is set, drawer title becomes "Replace: {DOC_TYPE_CONFIG[preselectedDocType].label}".
- [x] When user picks the OTHER card, an `OtherLabelForm` subcomponent renders before the file picker activates: a single TextField labeled "Document Name", `maxLength={80}`, required. Submit/Upload button is disabled until trimmed value is non-empty.
- [x] On submit, the `customLabel` is passed via `metadata.customLabel` to `uploadDocumentRequest`.
- [x] Existing compliance form for INSURANCE_CERT/LICENSE/etc. flow is unchanged. _OTHER branch is mutually exclusive with compliance branch (OTHER is `compliance: false`)._
- [x] The drawer keeps its existing dirty-form protection. _Unchanged — EditDrawer still wraps the drawer._
- [x] Test verifies the upload action is dispatched with `metadata: { customLabel: 'Customer Form' }`. _9/9 tests pass._

**Tasks:**
[x] T-31 [UI] Add OtherLabelForm + replace-mode title to DocumentUploadDrawer
         └─ Detail: Modify `hussle-app-dispatch-ui/src/features/documents/components/DocumentUploadDrawer/index.tsx`. (1) Compute drawer title: `const title = lockDocType && preselectedDocType ? \`Replace: ${DOC_TYPE_CONFIG[preselectedDocType].label}\` : 'Upload Documents';` — pass to `EditDrawer`. (2) Add an `OtherLabelForm` internal subcomponent (sibling to existing `ComplianceForm`, or wherever in the file the upload state machine lives). Single TextField (id="other-document-name", maxLength={80}, required, aria-required="true"), helper text "Required. Max 80 characters. Will appear as the document name in lists.", char counter `(N/80)`. Submit button disabled until `value.trim().length > 0`. On submit, calls `onSubmit(customLabel)`. Cancel calls `onCancel()`. (3) In the drawer's existing onAdd flow (where compliance form is gated), branch when `documentType === 'OTHER'`: show `OtherLabelForm` instead. On submit, dispatch `uploadDocumentRequest({ ..., metadata: { customLabel } })` instead of the standard path.
         └─ Depends on: T-14
         └─ Output:

[x] T-32 [TEST] Tests for OTHER label form gating
         └─ Detail: Add a test in `hussle-app-dispatch-ui/src/features/documents/components/DocumentUploadDrawer/DocumentUploadDrawer.test.tsx` (or extend an existing test file). Cases: (a) selecting OTHER renders the Document Name field; (b) Upload button disabled when label empty; (c) entering a label and uploading dispatches `uploadDocumentRequest` with `metadata.customLabel === 'Customer Form'`; (d) when opened with `lockDocType + preselectedDocType=INSURANCE_CERT`, the title shows "Replace: Insurance Certificate".
         └─ Depends on: T-31
         └─ Output:

---

## INT-01: Wire dispatch-api ↔ dispatch-ui contract integration
_Auto-generated | Services: dispatch-api, dispatch-ui_

**Verification Checklist:**
- [x] `Document` UI type in `features/documents/types.ts` matches `DocumentResponse` shape from contract.
- [x] `DocumentType` enum on UI side matches all 43 values from `.planning/document-management/types.ts` character-for-character.
- [x] `archiveDocument` API client uses `PATCH /documents/:id/archive`; saga handles failures via snackbar.
- [x] `getDocumentDownloadUrl` uses `GET /documents/:id/download` and extracts `data.url`.
- [x] `confirmDocument` payload supports `metadata: { customLabel }` for OTHER docs.
- [x] DocumentDetailDrawer renders `uploadedBy.firstName + ' ' + lastName` only when `uploadedBy !== null`.
- [x] Auth: archive route requires ADMIN; UI hides Delete for non-ADMIN. Both layers enforce.

**Drift fixes applied during this review (FIX-on-the-fly):**
- Added `notes` field to backend `DocumentListItem` Pick + `DocumentResponse` interface + `toDocumentResponse` mapping. Detail drawer's Notes row was always showing `—` because `notes` was never in the response. 26 related tests pass after the fix.

**Drift NOT fixed (out of scope, follow-up suggested):**
- Detail drawer width is 640px on desktop vs design spec's "~720px" — minor; PM should confirm.
- ExpiryBadge in detail drawer is in body Details row, not header — likely a better UX choice anyway.
- UI `ListDocumentsResponse.meta` type is missing `hasMore` field (type-only drift, no runtime impact).

**Tasks:**
[x] T-33 [WIRE] Verify API/UI integration against contract
         └─ Detail: Read `.planning/document-management/contract.yaml`, `.planning/document-management/types.ts`, the implemented backend (after US-01/02), and the implemented frontend (after US-03–08). Compare endpoint paths, request/response shapes, enum values, auth rules, and error-handling. Produce a checklist report. Flag any drift. If drift exists and is fixable as a small change, apply the fix; otherwise note it for a follow-up FIX story.
         └─ Agent: review
         └─ Depends on: T-02, T-06, T-08, T-09, T-10, T-13, T-14, T-17, T-23, T-27, T-29, T-31
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Status: done_

**Verdict:** PASS WITH NOTES. All 6 contract data flows traced cleanly through the implementation. All plan ACs met or partially-met (see notes below).

**Manual QA list (human verification required):**
- Mobile drawer width at xs viewport (full-width — implemented)
- iframe rendering of PDF on Chrome / Safari / Firefox
- Image preview rendering across mime variants (image/png, image/jpeg, image/jpg)
- "Preview unavailable" fallback for unsupported mime types
- Replace flow end-to-end: upload, verify prior is archived, verify audit log row appears
- Delete as DISPATCHER role: confirm 403 surfaces snackbar
- Expiry badge thresholds at 5/15/35 day boundaries
- OTHER custom label persisting and rendering in table after upload
- Notes field rendering (verified in code — was previously broken; fixed during T-33)

**Tasks:**
[x] T-34 [VERIFY] Trace data flows and re-check every AC
         └─ Detail: For each flow in contract.yaml `x-data-flow` (View, Download, Replace, Delete, Upload OTHER, Expiry badge), trace every step from trigger through API through DB and back to UI response in the implemented code. Confirm: each acceptance criterion in every US-NN above is satisfied by the actual code. Re-check the global plan AC checklist (plan.md §Acceptance Criteria) item by item. Note any items that require manual QA (e.g., mobile drawer width) and list them as a manual checklist.
         └─ Agent: review
         └─ Depends on: T-33
         └─ Output:

---

---

## US-09: Secure document downloads via 302 redirect
_Priority: P1 | Services: dispatch-api, dispatch-ui | Status: done_

**Problem:** `GET /documents/:id/download` returns `{ url: "https://s3.amazonaws.com/...?X-Amz-Signature=..." }` to the client. The signed S3 URL lands in Redux state, browser history, proxy logs, and referrer headers. Anyone who captures the URL can access the file for up to 15 minutes without authentication.

**New pattern:** The endpoint issues a `302 Location` redirect to the presigned URL. The S3 URL never leaves the server. Auth is enforced on every access at the API layer.

**Acceptance Criteria:**
- [x] `GET /documents/:id/download` responds with `302 Location: <presignedUrl>` instead of `200 { data: { url } }`
- [x] Response includes `Cache-Control: no-store` to prevent browser caching of the redirect
- [x] Unauthenticated requests still return 401 (auth middleware fires before redirect)
- [x] Frontend: `getDocumentDownloadUrl` API client removed — callers construct the API path directly and `window.open` it
- [x] `getDownloadUrlSaga` deleted — URL constructed synchronously, no Redux state needed
- [x] `DocumentDetailDrawer` iframe/img `src` uses constructed API endpoint
- [x] Bulk download unchanged (returns multiple URLs — redirect pattern doesn't apply to batch)

**Tasks:**
[x] T-35 [API] Change download controller to return 302 redirect
[x] T-36 [API] Add Cache-Control: no-store to redirect response
[x] T-37 [UI] Remove getDocumentDownloadUrl saga + Redux state, construct URL directly
[x] T-38 [UI] Update DocumentDetailDrawer iframe src to use API endpoint
[x] T-39 [TEST] Update integration tests — assert 302 + Location header

---

## US-10: Per-type presigned URL TTL reduction
_Priority: P1 | Services: dispatch-api | Status: done_

**Problem:** All documents use a flat 900s (15 min) TTL for presigned GET URLs. Sensitive compliance documents (W9, driver license, medical card, insurance certs) warrant much shorter windows. Operational documents (BOL, POD) are less sensitive and can tolerate longer windows.

**Acceptance Criteria:**
- [x] `SENSITIVE_DOCUMENT_TYPES` set + `SENSITIVE_DOWNLOAD_TTL_SECONDS = 60` + `STANDARD_DOWNLOAD_TTL_SECONDS = 300` + `getDownloadTtl(type)` helper added to `documentTypes.ts`
- [x] `documentService.getDownloadUrl` uses `getDownloadTtl(document.type)` per document
- [x] `bulkDownload` uses `getDownloadTtl(doc.type)` per document
- [x] Unit tests updated to assert correct TTL

**Tasks:**
[x] T-40 [API] Add SENSITIVE_DOCUMENT_TYPES set + TTL constants + getDownloadTtl helper to documentTypes.ts
[x] T-41 [API] Pass per-type TTL to getPresignedGetUrl in getDownloadUrl + bulkDownload
[x] T-42 [TEST] Unit tests assert TTL values per sensitivity tier

---

## US-11: Meaningful download filenames via Content-Disposition
_Priority: P2 | Services: dispatch-api | Status: done_

**Problem:** Users download files with their original upload names (e.g. `Confirmation1188244.pdf`, `scan.jpg`). The file provides no context once saved to disk. The storage key should stay stable (original filename preserves idempotency), but the download filename presented to the browser should be meaningful.

**New pattern:** When generating presigned GET URLs, pass `ResponseContentDisposition: attachment; filename="<TYPE>-<entityRef>-<date>.<ext>"` as a query parameter override on the S3 presigned URL.

Example output: `bol-signed-load-cec8aba4-2024-01-15.pdf`

_Note: T-46 (entity name query ports for human-readable names like load numbers) deferred — current implementation uses entity type + short UUID + date, which requires no cross-module DB lookup._

**Acceptance Criteria:**
- [x] `storageProvider.getPresignedGetUrl` accepts optional `displayName` parameter
- [x] S3 implementation passes `ResponseContentDisposition: 'attachment; filename="<displayName>"'`
- [x] Local storage appends `?filename=<encoded>` to URL; GET route reads it and sets `Content-Disposition` header
- [x] `documentService.getDownloadUrl` builds display name: `{type}-{entityType}-{entityId[0..8]}-{YYYY-MM-DD}.{ext}`
- [x] `bulkDownload` applies same display name logic per document
- [x] Unit tests updated

**Tasks:**
[x] T-43 [API] Add optional displayName param to StorageProvider.getPresignedGetUrl interface
[x] T-44 [API] Implement ResponseContentDisposition in S3StorageProvider
[x] T-45 [API] Implement Content-Disposition header in LocalStorageProvider GET route
[ ] T-46 [API] Add entity display name query ports for human-readable names — deferred post-MVP
[x] T-47 [API] Build buildDisplayName() utility in documentService
[x] T-48 [API] Apply display name in getDownloadUrl + bulkDownload
[x] T-49 [TEST] Unit tests updated for new service call signatures

---

## Summary
| Story  | Tasks | Done | Blocked | AC Met |
|--------|-------|------|---------|--------|
| US-01  | 2     | 2    | 0       | 4/4    |
| US-02  | 10    | 10   | 0       | 9/10   |
| US-03  | 2     | 2    | 0       | 6/6    |
| US-04  | 2     | 2    | 0       | 5/5    |
| US-05  | 5     | 5    | 0       | 7/7    |
| US-06  | 4     | 4    | 0       | 11/12  |
| US-07  | 5     | 5    | 0       | 9/9    |
| US-08  | 2     | 2    | 0       | 6/6    |
| INT-01 | 1     | 1    | 0       | 7/7    |
| VER-01 | 1     | 1    | 0       | —      |
| US-09  | 5     | 5    | 0       | 7/7    |
| US-10  | 3     | 3    | 0       | 4/4    |
| US-11  | 7     | 6    | 0       | 6/7    |
| **All**| **49**| **48**| **0** | **81/83** |

_Last updated: 2026-04-29_
