# Upload Pipeline Unification Tasks
_Last updated: 2026-05-25 04:55_
_Plan: .planning/upload-pipeline-unification/plan.md_
_Patterns: .planning/upload-pipeline-unification/PATTERNS.md_

---

## US-01: Portal documents service delegates to dispatcher service (Phase 1)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

must_haves:
  truths:
    - "Portal presign with expiresAt persists Document.expiresAt at row creation (asserted via documentRepository.create call args)"
    - "Portal confirm publishes document.confirmed on the event bus (asserted via eventBus.publish spy)"
    - "Portal HTTP contract unchanged: v2 client still receives { documentId, uploadUrl, fields } from presign"
    - "carrierComplianceSubscriber updates Carrier.insuranceCertOnFile / insuranceExpiry when a portal-uploaded INSURANCE_CERT is confirmed"
  artifacts:
    - path: hussle-app-dispatch-api/src/carrier-portal/services/portalDocumentsService.ts
      provides: "Adapter that translates v2 input/output shape and delegates to createDocumentService"
    - path: hussle-app-dispatch-api/src/carrier-portal/validators/documentsValidator.ts
      provides: "presign accepts optional expiresAt; confirm accepts expiresAt (no more insuranceExpiry)"
    - path: hussle-app-dispatch-api/src/carrier-portal/controllers/mappers/documentsMapper.ts
      provides: "Maps req.body.expiresAt into service input on both presign and confirm"
    - path: hussle-app-dispatch-api/src/carrier-portal/compositionRoot.ts
      provides: "Wires createDocumentService as a dependency of portalDocumentsService"
  key_links:
    - from: portalDocumentsService.presign
      to: createDocumentService.presign
      via: "direct function call with translated input; result re-shaped to { documentId, uploadUrl, fields }"
    - from: portalDocumentsService.confirm
      to: createDocumentService.confirm
      via: "direct function call; documentType resolved from Document row by id (matches dispatcher pattern)"
    - from: portalDocumentsService.confirm
      to: eventBus
      via: "createDocumentService.confirm publishes document.confirmed → carrierComplianceSubscriber"

**Acceptance Criteria:**
- [x] AC-B1: portalDocumentsService is an adapter delegating to createDocumentService; no own presign/confirm/COMPLIANCE_FLAG_MAP logic; passes uploadedByUserId: null
- [x] AC-B2: presignDocumentValidator accepts optional `expiresAt: Yup.string().optional()`; mapper reads req.body.expiresAt
- [x] AC-B3: confirmDocumentValidator accepts `expiresAt: Yup.string().optional()`, no longer accepts `insuranceExpiry`; mapper reads req.body.expiresAt
- [x] AC-B4: portal presign writes Document.expiresAt when supplied
- [x] AC-B5: portal confirm publishes document.confirmed
- [x] AC-B6: carrierComplianceSubscriber updates insuranceCertOnFile/insuranceExpiry on portal-triggered confirmation
- [x] AC-B7: dispatcher document flow unaffected (loadTimestamp/notification/documentArchive/invoiceReadiness still fire for dispatcher uploads)
- [x] AC-B8: carrier-portal/compositionRoot.ts wires createDocumentService into portalDocumentsService

**Tasks:**
[x] T-01 [API] Update portal validators for expiresAt rename
         └─ Detail: In `presignDocumentValidator`, add `expiresAt: Yup.string().optional()` to the body schema. In `confirmDocumentValidator`, replace any `insuranceExpiry` field with `expiresAt: Yup.string().optional()`. Keep all other fields untouched.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/validators/documentsValidator.ts]
         └─ Depends on: —
         └─ Output:

[x] T-02 [API] Update documents mapper to read expiresAt from req.body
         └─ Detail: In `documentsMapper.ts`, on the presign mapper add `expiresAt: req.body.expiresAt` to the service input. On the confirm mapper, replace any `insuranceExpiry` mapping with `expiresAt: req.body.expiresAt`. Drop the legacy `key` mapping per D8 (confirm body shape is `{ expiresAt?, metadata? }`).
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/controllers/mappers/documentsMapper.ts]
         └─ Depends on: —
         └─ Output:

[x] T-03 [API] Rewrite portalDocumentsService as adapter delegating to createDocumentService
         └─ Detail: Per AC-B1 + D5: replace the bespoke presign/confirm/COMPLIANCE_FLAG_MAP with two thin functions that (a) translate the carrier-portal mapper input shape → dispatcher `createDocumentService` input (passing `uploadedByUserId: null` per MI4), (b) call the injected dispatcher service, (c) translate the dispatcher result back to the v2 client's expected shape `{ documentId, uploadUrl, fields }` on presign. Confirm just returns void/dispatcher result. Service factory must accept `createDocumentService` as a dep (e.g., `createPortalDocumentsService({ documentService })`). Do not duplicate event publishing — let the dispatcher service publish.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/portalDocumentsService.ts]
         └─ Depends on: T-01, T-02
         └─ Output:

[x] T-04 [API] Wire createDocumentService into carrier-portal compositionRoot
         └─ Detail: In `carrier-portal/compositionRoot.ts`, import the dispatcher `createDocumentService` (or accept it as a cross-module dep from the API composition root if that's the project's convention — check `documents/compositionRoot.ts` and how other portal services receive cross-module deps), construct it (or receive it), and pass it into `createPortalDocumentsService({ documentService })`. If the controller is constructed downstream of this service, no controller signature change needed.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/compositionRoot.ts]
         └─ Depends on: T-03
         └─ Output:

[x] T-05 [API] Verify controller still passes through correctly
         └─ Detail: Open `carrier-portal/controllers/documentsController.ts`; confirm it just calls the injected service with mapped input and shapes response from service output. If the existing controller manipulates fields that no longer exist on the new service result, fix it. Do not rewrite — minimal adjustment only.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/controllers/documentsController.ts]
         └─ Depends on: T-03
         └─ Output:

---

## US-02: Add portalDocumentsService unit tests (Phase 2)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01_

must_haves:
  truths:
    - "portalDocumentsService.test.ts exists, covers presign+confirm, and passes against the refactored service"
    - "Test asserts that confirm path triggers eventBus.publish('document.confirmed', ...)"
    - "Test asserts presign passes expiresAt through to the delegated documentService"
  artifacts:
    - path: hussle-app-dispatch-api/src/carrier-portal/services/__tests__/portalDocumentsService.test.ts
      provides: "Unit tests modeled on portalEquipmentService.test.ts covering presign + confirm + event publish"
  key_links:
    - from: portalDocumentsService.test.ts
      to: portalDocumentsService factory
      via: "constructs service with a stubbed documentService and asserts call shape + return translation"

**Acceptance Criteria:**
- [x] AC-B9: new test file exists, modeled on portalEquipmentService.test.ts, covers presign expiresAt pass-through, confirm publishes event, and compliance subscriber-side update is asserted at boundary
- [x] AC-B10: `(cd hussle-app-dispatch-api && npm run validate)` passes (1 pre-existing docusealProvider failure permitted)

**Tasks:**
[x] T-06 [TEST] Create portalDocumentsService.test.ts
         └─ Detail: Model on `hussle-app-dispatch-api/src/carrier-portal/services/__tests__/portalEquipmentService.test.ts`. Construct portalDocumentsService with a stubbed `documentService` (mock the presign + confirm calls and an event bus spy). Test cases: (1) presign called with expiresAt forwards it; (2) presign translates dispatcher result `{ documentId, presignedUrl, ... }` into v2 shape `{ documentId, uploadUrl, fields }`; (3) confirm calls the dispatcher service and the dispatcher's event publish happens (verify via spy on the injected event bus); (4) uploadedByUserId is `null` for portal context.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/__tests__/portalDocumentsService.test.ts]
         └─ Depends on: T-03
         └─ Output:

[x] T-07 [VERIFY] Run dispatch-api validate
         └─ Detail: `(cd hussle-app-dispatch-api && npm run validate) > /tmp/build-us02-validate.log 2>&1`. Tolerate one pre-existing failure in `docusealProvider`; no new failures. Report pass/fail summary only.
         └─ Files: []
         └─ Depends on: T-06
         └─ Output:

---

## US-03: Add `requiresExpiry` flag to DOC_TYPE_CONFIG
_Priority: P0 | Services: dispatch-ui | Agent: trivial | Status: done_

must_haves:
  truths:
    - "DOC_TYPE_CONFIG[DocumentType.INSURANCE_CERT].requiresExpiry === true is importable and present in the type"
    - "All other DOC_TYPE_CONFIG entries leave requiresExpiry unset (treated as false)"

**Acceptance Criteria:**
- [x] AC-F5: optional `requiresExpiry: boolean` added to config type; INSURANCE_CERT.requiresExpiry = true; other entries unchanged

**Tasks:**
[x] T-08 [TYPES] Add optional `requiresExpiry?: boolean` to the DocTypeConfig type; set `requiresExpiry: true` on INSURANCE_CERT
         └─ Detail: Open `features/documents/constants.ts`. Locate the DocTypeConfig type/interface (the value type of DOC_TYPE_CONFIG entries). Add `requiresExpiry?: boolean`. On the `DocumentType.INSURANCE_CERT` entry, add `requiresExpiry: true`. Do not modify any other entry.
         └─ Files: [hussle-app-dispatch-ui/src/features/documents/constants.ts]
         └─ Depends on: —
         └─ Output:

---

## US-04: Extract ComplianceForm to shared component
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-03_

must_haves:
  truths:
    - "ComplianceForm is importable from src/components/ComplianceForm and renders the same form previously inlined in DocumentUploadDrawer"
    - "Upload button is disabled until expiry is non-empty when DOC_TYPE_CONFIG[documentType].requiresExpiry === true"
    - "DocumentUploadDrawer renders identically (existing DocumentUploadDrawer.test.tsx still passes)"
  artifacts:
    - path: hussle-app-dispatch-ui/src/components/ComplianceForm/index.tsx
      provides: "Shared ComplianceForm with props { documentType, onSubmit, onCancel }"
    - path: hussle-app-dispatch-ui/src/components/ComplianceForm/ComplianceForm.test.tsx
      provides: "Component test covering submit/cancel + requiresExpiry gating"
  key_links:
    - from: DocumentUploadDrawer
      to: ComplianceForm
      via: "import from src/components/ComplianceForm; replaces previously-inlined JSX (L103-161)"

**Acceptance Criteria:**
- [x] AC-F1: ComplianceForm exists at src/components/ComplianceForm/index.tsx with the documented prop shape; respects DOC_TYPE_CONFIG[documentType].requiresExpiry
- [x] AC-F2: DocumentUploadDrawer imports the shared component; existing DocumentUploadDrawer.test.tsx passes unchanged

**Tasks:**
[x] T-09 [UI] Extract ComplianceForm from DocumentUploadDrawer to src/components/ComplianceForm
         └─ Detail: Copy the inlined ComplianceForm at `features/documents/components/DocumentUploadDrawer/index.tsx:103-161` to a new file `src/components/ComplianceForm/index.tsx`. Props: `{ documentType: DocumentType, onSubmit: (expiresAt: string, metadata: Record<string, string>) => void, onCancel: () => void }`. Read `requiresExpiry` from `DOC_TYPE_CONFIG[documentType]` and disable the Submit/Upload button when `requiresExpiry === true` AND expiry is empty. Submit button labeled "Upload" per C2. Use existing MUI components and patterns; do not change visual output.
         └─ Files: [hussle-app-dispatch-ui/src/components/ComplianceForm/index.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-10 [UI] Swap DocumentUploadDrawer to import shared ComplianceForm
         └─ Detail: Replace the inline ComplianceForm declaration at L103-161 with `import { ComplianceForm } from 'components/ComplianceForm';`. Ensure the consuming JSX call sites pass the same props as before.
         └─ Files: [hussle-app-dispatch-ui/src/features/documents/components/DocumentUploadDrawer/index.tsx]
         └─ Depends on: T-09
         └─ Output:

[x] T-11 [TEST] Add ComplianceForm.test.tsx
         └─ Detail: Model on `src/components/DocumentsTab/__tests__/DocumentsTab.test.tsx` for Provider/theme wrapper pattern. Cover: (1) renders expiry input for compliance type; (2) Submit disabled until expiry filled when requiresExpiry === true (use INSURANCE_CERT); (3) Submit enabled without expiry when requiresExpiry is unset (use a non-INSURANCE_CERT compliance type like W9); (4) Cancel invokes onCancel; (5) Submit invokes onSubmit with (expiry, metadata).
         └─ Files: [hussle-app-dispatch-ui/src/components/ComplianceForm/ComplianceForm.test.tsx]
         └─ Depends on: T-09
         └─ Output:

---

## US-05: Create SingleDocumentUpload dumb component
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-03, US-04_

must_haves:
  truths:
    - "SingleDocumentUpload renders idle / awaiting-compliance / uploading / success / error UI driven by the `status` prop"
    - "Component validates picked files against accept + maxFileSize BEFORE invoking onUpload; invalid files trigger an internal error state (local state, not via status prop) and onUpload is never called"
    - "For compliance types, ComplianceForm is rendered after file pick and gates the onUpload call; for non-compliance types, onUpload fires immediately after a valid file pick"
  artifacts:
    - path: hussle-app-dispatch-ui/src/components/SingleDocumentUpload/index.tsx
      provides: "Dumb component with D2 props; defaults accept='.pdf,.jpg,.jpeg,.png,.webp' and maxFileSize=10MB"
    - path: hussle-app-dispatch-ui/src/components/SingleDocumentUpload/SingleDocumentUpload.test.tsx
      provides: "Component test covering all status states + file validation + compliance gating"
  key_links:
    - from: SingleDocumentUpload
      to: ComplianceForm
      via: "imported and rendered between file pick and onUpload when DOC_TYPE_CONFIG[documentType].compliance === true"

**Acceptance Criteria:**
- [x] AC-F3: component exists with the D2 prop shape; defaults applied; renders the right UI per status; internal validation via local state (NOT status prop) for invalid files; onUpload never called with invalid file
- [x] AC-F4: ComplianceForm shown between file-pick and onUpload for compliance types; Submit calls onUpload(file, expiresAt, metadata); Cancel calls onReset and returns to idle; non-compliance types skip the form

**Tasks:**
[x] T-12 [UI] Build SingleDocumentUpload component
         └─ Detail: Create `src/components/SingleDocumentUpload/index.tsx`. Props: `{ documentType: DocumentType, accept?: string, maxFileSize?: number, status: 'idle' | 'uploading' | 'success' | 'error', errorMessage?: string, fileName?: string, onUpload: (file: File, expiresAt: string, metadata: Record<string, string>) => void, onReset: () => void }`. Defaults: `accept = '.pdf,.jpg,.jpeg,.png,.webp'`, `maxFileSize = 10 * 1024 * 1024`. Visual states (idle button / awaiting-compliance ComplianceForm panel / uploading LinearProgress + filename / success check + filename / error icon + errorMessage + delete-to-retry). Pattern source: `features/load/components/LoadDetailPage/BolUploadAlert/index.tsx:1-156` (UI states copied; dispatch/selector logic stripped — parent owns those). Internal validation per D7: validate accept + maxFileSize on file pick BEFORE invoking onUpload; invalid → set local error state with a generated message ("File exceeds NMB" / "File type not allowed"). Render this internal-error state separately from the status='error' branch (they look the same but are driven by local state vs prop). On compliance types (`DOC_TYPE_CONFIG[documentType].compliance === true`), after a valid file pick render ComplianceForm; ComplianceForm Submit invokes onUpload; ComplianceForm Cancel invokes onReset AND clears local file state. Non-compliance types: file pick immediately invokes `onUpload(file, '', {})`.
         └─ Files: [hussle-app-dispatch-ui/src/components/SingleDocumentUpload/index.tsx]
         └─ Depends on: T-09
         └─ Output:

[x] T-13 [TEST] Add SingleDocumentUpload.test.tsx
         └─ Detail: Cover: (1) idle renders button; (2) status='uploading' renders LinearProgress + fileName; (3) status='success' renders check + fileName; (4) status='error' renders errorMessage + delete-to-retry; (5) file pick of an oversized file shows internal error message AND onUpload not called; (6) file pick of disallowed type shows internal error message AND onUpload not called; (7) compliance type (INSURANCE_CERT) shows ComplianceForm after valid file pick; Submit invokes onUpload(file, expiresAt, metadata); (8) Cancel invokes onReset and returns to idle (verify by re-picking and seeing fresh state); (9) non-compliance type (e.g. BOL_SIGNED) — file pick directly invokes onUpload with empty expiresAt + metadata.
         └─ Files: [hussle-app-dispatch-ui/src/components/SingleDocumentUpload/SingleDocumentUpload.test.tsx]
         └─ Depends on: T-12
         └─ Output:

---

## US-06: Extract uploadFileViaPresign helper + refactor both sagas + v2 API client
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

must_haves:
  truths:
    - "uploadFileViaPresign helper is the single source of presign → S3 PUT → confirm orchestration; both sagas call it"
    - "Helper has NO try/catch — errors propagate to caller (D6)"
    - "Dispatcher uploadDocumentSaga still dispatches documentActions.addOne, uploadDocumentSuccess, notify, and uploadDocumentFailure on error"
    - "Portal uploadDocumentSaga still dispatches carrierPortalV2Actions.uploadDocumentSuccess/Failure and reads token via selectToken"
    - "v2 API client's PresignBodyV2 carries expiresAt + metadata; confirmDocumentV2 body shape is { expiresAt?, metadata? } — no legacy `key` or `insuranceExpiry` remains"
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/documents/store/sagas/uploadFileViaPresign.ts
      provides: "Shared saga helper accepting (input, deps: { presignFn, confirmFn }) → presign → S3 → confirm"
    - path: hussle-app-dispatch-ui/src/features/documents/store/sagas/uploadDocumentSaga.ts
      provides: "Dispatcher saga calling helper with adapters wrapping presignDocument/confirmDocument"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/uploadDocumentSaga.ts
      provides: "Portal saga calling helper with adapters wrapping presignDocumentV2/confirmDocumentV2 + token"
    - path: hussle-app-dispatch-ui/src/utils/api/carrierPortal/v2.ts
      provides: "PresignBodyV2 + presignDocumentV2 carry expiresAt + metadata; confirmDocumentV2 body is { expiresAt?, metadata? }"
  key_links:
    - from: features/documents/store/sagas/uploadDocumentSaga.ts
      to: uploadFileViaPresign
      via: "yield call(uploadFileViaPresign, input, { presignFn, confirmFn }) with adapters unwrapping result.presign.{documentId, presignedUrl}"
    - from: features/carrier-portal/store/sagas/uploadDocumentSaga.ts
      to: uploadFileViaPresign
      via: "yield call(uploadFileViaPresign, input, { presignFn, confirmFn }) with adapters wrapping V2 calls + token from selectToken"
    - from: portal saga
      to: features/carrier-portal/store/selectors/carrierPortalSelectors.ts (selectToken)
      via: "yield select(selectToken)"

**Acceptance Criteria:**
- [x] AC-F6: uploadFileViaPresign exists at the documented path with the documented signature (input + deps with presignFn/confirmFn returning normalized `{ documentId, presignedUrl }`); no try/catch
- [x] AC-F7: dispatcher saga calls helper with adapters wrapping presignDocument/confirmDocument; preserves all existing dispatches; retains try/catch
- [x] AC-F8: portal saga calls helper with adapters wrapping presignDocumentV2/confirmDocumentV2; token via selectToken; preserves all existing dispatches; retains try/catch
- [x] AC-F12: v2 client: PresignBodyV2 adds expiresAt+metadata; presignDocumentV2 sends them; confirmDocumentV2 body shape is { expiresAt?, metadata? } (no key, no insuranceExpiry); grep clean for `insuranceExpiry`/legacy `key` in portal client + callers
- [x] AC-F13: existing dispatcher + portal saga tests refactored to mock uploadFileViaPresign or the underlying adapters; both pass

**Tasks:**
[x] T-14 [SAGA] Create uploadFileViaPresign helper
         └─ Detail: New file `features/documents/store/sagas/uploadFileViaPresign.ts`. Export a saga generator function with the signature documented in the plan (input fields: file, documentType, entityType, entityId, expiresAt?, metadata?; deps: presignFn(presignInput) → Promise<NormalizedPresign>, confirmFn(documentId, confirmInput?) → Promise<unknown>). Steps: (1) call deps.presignFn(...) to get `{ documentId, presignedUrl }`; (2) PUT the file to presignedUrl (use `yield call(fetch, presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': input.file.type } })` — match dispatcher saga's existing PUT call exactly; check existing `uploadDocumentSaga.ts:32-59` for the precise call); (3) call deps.confirmFn(documentId, { expiresAt, metadata }). NO try/catch — errors propagate. Export both the generator and the `NormalizedPresign` interface.
         └─ Files: [hussle-app-dispatch-ui/src/features/documents/store/sagas/uploadFileViaPresign.ts]
         └─ Depends on: —
         └─ Output:

[x] T-15 [API] Update v2 API client for expiresAt + new confirm body shape
         └─ Detail: In `utils/api/carrierPortal/v2.ts`: (a) Add `expiresAt?: string` and `metadata?: Record<string, string>` to `PresignBodyV2`; update `presignDocumentV2` to send them. (b) Change `ConfirmBodyV2` from `{ key: string }` (or current shape) to `{ expiresAt?: string; metadata?: Record<string, string> }`; update `confirmDocumentV2` function signature accordingly. (c) Drop any legacy `insuranceExpiry` field. (d) Grep `utils/api/carrierPortal/` and `features/carrier-portal/` for `insuranceExpiry` and legacy `key` references in confirm-call sites; update or remove. Do not change presign response shape — sagas adapt to it.
         └─ Files: [hussle-app-dispatch-ui/src/utils/api/carrierPortal/v2.ts]
         └─ Depends on: —
         └─ Output:

[x] T-16 [SAGA] Refactor dispatcher uploadDocumentSaga to use helper
         └─ Detail: In `features/documents/store/sagas/uploadDocumentSaga.ts`: replace the inline presign → S3 → confirm logic (L32-59) with `yield call(uploadFileViaPresign, input, { presignFn: <adapter>, confirmFn: <adapter> })`. Adapters: presignFn wraps `presignDocument` from `utils/api/documents/documentApi.ts` and unwraps `result.presign.{documentId, presignedUrl}` to normalized shape; confirmFn wraps `confirmDocument(documentId, body?)`. Keep saga's existing try/catch, slice updates (`documentActions.addOne`), `uploadDocumentSuccess({ clientId })`, `notify(...)`, and `uploadDocumentFailure` on error. Forward expiresAt + metadata to the helper input.
         └─ Files: [hussle-app-dispatch-ui/src/features/documents/store/sagas/uploadDocumentSaga.ts]
         └─ Depends on: T-14
         └─ Output:

[x] T-17 [SAGA] Refactor portal uploadDocumentSaga to use helper
         └─ Detail: In `features/carrier-portal/store/sagas/uploadDocumentSaga.ts`: replace inline orchestration with `yield call(uploadFileViaPresign, input, { presignFn, confirmFn })`. Get token via `const token = yield select(selectToken)` (selector from `features/carrier-portal/store/selectors/carrierPortalSelectors.ts` per MI1). Adapters wrap `presignDocumentV2(token, body)` and `confirmDocumentV2(token, documentId, body)`. Map V2 presign response into normalized `{ documentId, presignedUrl }`. Forward expiresAt + metadata. Preserve existing try/catch + all portal dispatches (`carrierPortalV2Actions.uploadDocumentSuccess({ documentType })`, `uploadDocumentFailure(error)`, etc.).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/uploadDocumentSaga.ts]
         └─ Depends on: T-14, T-15
         └─ Output:

[x] T-18 [TEST] Refactor dispatcher uploadDocumentSaga test
         └─ Detail: Open the dispatcher saga test (likely `features/documents/store/sagas/__tests__/uploadDocumentSaga.test.ts` — verify presence; if absent, skip this task and note in output). Refactor to mock `uploadFileViaPresign` directly OR keep mocking the underlying `presignDocument`/`confirmDocument`/fetch — whichever yields the cleanest test. Cover happy path + failure path. All existing assertions on dispatched actions remain.
         └─ Files: [hussle-app-dispatch-ui/src/features/documents/store/sagas/__tests__/uploadDocumentSaga.test.ts]
         └─ Depends on: T-16
         └─ Output:

[x] T-19 [TEST] Refactor portal uploadDocumentSaga test
         └─ Detail: Open the portal saga test (likely `features/carrier-portal/store/sagas/__tests__/sagas.test.ts` per PATTERNS; verify). Refactor `uploadDocumentSaga` cases the same way as T-18 — mock the helper or underlying V2 calls. Mock `selectToken`. Preserve existing assertions on portal dispatches.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/__tests__/sagas.test.ts]
         └─ Depends on: T-17
         └─ Output:

---

## US-07: Refactor BolUploadAlert to use SingleDocumentUpload
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-05, US-06_

must_haves:
  truths:
    - "BolUploadAlert dispatches uploadDocumentRequest on file pick (or after ComplianceForm submit if applicable — BOL_SIGNED is non-compliance, so file-pick is the trigger)"
    - "BolUploadAlert reads status/error via selectUploadStatus(clientId) / selectUploadError(clientId)"
    - "On upload success, the load detail refetches"
    - "BolUploadAlert passes maxFileSize={10 * 1024 * 1024} (matches MAX_BOL_SIZE_BYTES)"
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/load/components/LoadDetailPage/BolUploadAlert/index.tsx
      provides: "Refactored to use <SingleDocumentUpload>; owns clientId + dispatch + selectors"
    - path: hussle-app-dispatch-ui/src/features/load/components/LoadDetailPage/BolUploadAlert/BolUploadAlert.test.tsx
      provides: "NEW test covering file pick → progress → success → load refetch"
  key_links:
    - from: BolUploadAlert
      to: SingleDocumentUpload
      via: "rendered as the upload surface; onUpload dispatches uploadDocumentRequest"

**Acceptance Criteria:**
- [x] AC-F9: BolUploadAlert uses SingleDocumentUpload with status/errorMessage from selectors; onUpload dispatches uploadDocumentRequest; passes explicit maxFileSize={10*1024*1024}; new BolUploadAlert.test.tsx exists covering file pick → progress → success → load refetch fired

**Tasks:**
[x] T-20 [UI] Refactor BolUploadAlert to use SingleDocumentUpload
         └─ Detail: In `features/load/components/LoadDetailPage/BolUploadAlert/index.tsx`: keep the Alert wrapper, clientId state (e.g. `useMemo(() => crypto.randomUUID(), [])`), dispatch, and `selectUploadStatus(clientId)` / `selectUploadError(clientId)` reads. Replace inline JSX/state-machine at ~L75-152 with `<SingleDocumentUpload documentType={DocumentType.BOL_SIGNED} maxFileSize={10*1024*1024} status={status} errorMessage={error} onUpload={...} onReset={...} />`. `onUpload` dispatches `uploadDocumentRequest({ clientId, file, documentType: BOL_SIGNED, entityType, entityId, expiresAt, metadata })`. On success (subscribe to status transition to 'success'), refetch load detail (preserve existing behavior — check the existing useEffect for the refetch trigger).
         └─ Files: [hussle-app-dispatch-ui/src/features/load/components/LoadDetailPage/BolUploadAlert/index.tsx]
         └─ Depends on: T-12
         └─ Output:

[x] T-21 [TEST] Add BolUploadAlert.test.tsx
         └─ Detail: Model on `DocumentUploadDrawer.test.tsx` for Provider/theme wrapper pattern. Cover: file pick → uploading state → success → load refetch fired (mock the load API or saga effect). One unhappy path covers error rendering.
         └─ Files: [hussle-app-dispatch-ui/src/features/load/components/LoadDetailPage/BolUploadAlert/BolUploadAlert.test.tsx]
         └─ Depends on: T-20
         └─ Output:

---

## US-08: Refactor StatusChangeDialog to use SingleDocumentUpload
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-05, US-06_

must_haves:
  truths:
    - "StatusChangeDialog renders two <SingleDocumentUpload> instances (rate-con + BOL)"
    - "No inline upload state machine remains in the file"
    - "Modal Confirm enables only when both uploads succeed (preserve current behavior)"
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/load/components/StatusChangeDialog/index.tsx
      provides: "Refactored to use two <SingleDocumentUpload> instances; owns two clientIds + dispatches + selectors"
  key_links:
    - from: StatusChangeDialog
      to: SingleDocumentUpload (x2)
      via: "rate-con and BOL upload surfaces; each onUpload dispatches uploadDocumentRequest with its own clientId"

**Acceptance Criteria:**
- [x] AC-F10: two SingleDocumentUpload instances; no leftover inline state machines or crypto.randomUUID() / uploadDocumentRequest dispatch beyond parent-level wiring

**Tasks:**
[x] T-22 [UI] Refactor StatusChangeDialog
         └─ Detail: In `features/load/components/StatusChangeDialog/index.tsx`: replace the two inline upload state machines (~L227-271) with two `<SingleDocumentUpload>` instances. Maintain two independent clientId values (e.g., `useMemo(() => crypto.randomUUID(), [])` each), two selector reads, and two dispatches. Keep Confirm-button gating logic; status of both must be 'success' before Confirm is enabled. Pick appropriate documentTypes (rate-con type + BOL_SIGNED) — preserve current behavior.
         └─ Files: [hussle-app-dispatch-ui/src/features/load/components/StatusChangeDialog/index.tsx]
         └─ Depends on: T-12
         └─ Output:

---

## US-09: Refactor AgreementListView (carrier portal) to use SingleDocumentUpload
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-05, US-06_

must_haves:
  truths:
    - "AgreementListView renders <SingleDocumentUpload> per slot; per-row <input type=file> is gone"
    - "onUpload dispatches carrierPortalV2Actions.uploadDocument with the slot's documentType, file, expiresAt, metadata"
    - "Status derives from existing portal state (uploadingType, isUploaded, uploadErrorType)"
    - "Per-slot uploadingFileName tracked locally; cleared on success/error; after session refresh sourced from session.documents.find(d => d.documentType === slot.documentType)?.fileName"
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.tsx
      provides: "Refactored to use <SingleDocumentUpload> per slot with per-slot fileName state"
  key_links:
    - from: AgreementListView
      to: SingleDocumentUpload (per slot)
      via: "rendered per slot; onUpload dispatches carrierPortalV2Actions.uploadDocument(...)"
    - from: AgreementListView
      to: portal uploadDocumentSaga (via carrierPortalV2Actions.uploadDocument)
      via: "Redux action dispatch with { file, documentType, expiresAt, metadata }"

**Acceptance Criteria:**
- [x] AC-F11: AgreementListView uses SingleDocumentUpload per slot; per-row <input type="file"> removed; per-slot uploadingFileName in local state; fileName falls back to session.documents on refresh

**Tasks:**
[x] T-23 [UI] Refactor AgreementListView
         └─ Detail: In `features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.tsx`: replace the bespoke per-row file inputs (~L184-340) with `<SingleDocumentUpload>` per slot. Derive status: `'uploading'` when `uploadingType === slot.documentType`, `'success'` when `isUploaded(slot.documentType)`, `'error'` when `uploadErrorType === slot.documentType`, else `'idle'`. Add per-slot `uploadingFileName: Record<string, string | undefined>` to local state — set in `onUpload` before dispatch; clear on transition to success/error. Pass `fileName` prop from `uploadingFileName[slot.documentType] ?? session.documents.find(d => d.documentType === slot.documentType)?.fileName`. `onUpload` dispatches `carrierPortalV2Actions.uploadDocument({ file, documentType: slot.documentType, expiresAt, metadata, ... })`. Per AC-F4 + portal flow Step 5: insurance certificate slot is a compliance type, so ComplianceForm renders inside SingleDocumentUpload automatically (driven by `DOC_TYPE_CONFIG[type].compliance`).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.tsx]
         └─ Depends on: T-12, T-17
         └─ Output:

---

## INT-01: Wire portal upload pipeline end-to-end (UI saga → V2 API → portal service → dispatcher service → event bus)
_Auto-generated | Services: dispatch-ui, dispatch-api | Agent: review | Status: done_

**Verification Checklist:**
- [ ] AgreementListView dispatches carrierPortalV2Actions.uploadDocument with expiresAt+metadata
- [ ] Portal saga calls uploadFileViaPresign with V2 adapters; token sourced via selectToken
- [ ] presignDocumentV2 sends expiresAt+metadata; payload shape matches portal `presignDocumentValidator`
- [ ] confirmDocumentV2 body is { expiresAt?, metadata? }; shape matches portal `confirmDocumentValidator`
- [ ] portalDocumentsService delegates to createDocumentService; uploadedByUserId: null; output translated back to { documentId, uploadUrl, fields }
- [ ] createDocumentService.confirm publishes document.confirmed → carrierComplianceSubscriber fires
- [ ] No `insuranceExpiry` or legacy `key` references remain anywhere in portal client / callers / validators / mappers

**Tasks:**
[x] T-24 [WIRE] Verify portal upload pipeline integration
         └─ Detail: Read end-to-end: AgreementListView.tsx → carrierPortalV2Actions.uploadDocument → portal uploadDocumentSaga → uploadFileViaPresign → presignDocumentV2/confirmDocumentV2 (v2.ts) → portal validators → mappers → portalDocumentsService → createDocumentService → eventBus → carrierComplianceSubscriber. For each hop, confirm field names and shapes match. Grep the entire portal slice + utils/api/carrierPortal for `insuranceExpiry` and `'key':` confirm-body references — must come back clean. Report any drift as Issues.
         └─ Files: []
         └─ Depends on: T-04, T-05, T-15, T-17, T-23
         └─ Output:

---

## INT-02: Wire dispatcher upload pipeline end-to-end
_Auto-generated | Services: dispatch-ui, dispatch-api | Agent: review | Status: done_

**Verification Checklist:**
- [ ] BolUploadAlert + StatusChangeDialog dispatch uploadDocumentRequest with correct payloads
- [ ] Dispatcher saga calls uploadFileViaPresign with dispatcher adapters; preserves documentActions.addOne + notify + success/failure dispatches
- [ ] presignDocument / confirmDocument continue returning their existing shapes; adapter unwraps `result.presign.{documentId, presignedUrl}` correctly
- [ ] Existing dispatcher subscribers (loadTimestamp, notification, documentArchive, invoiceReadiness) still fire — no regression

**Tasks:**
[x] T-25 [WIRE] Verify dispatcher upload pipeline integration
         └─ Detail: Read end-to-end: BolUploadAlert + StatusChangeDialog → uploadDocumentRequest → dispatcher uploadDocumentSaga → uploadFileViaPresign → presignDocument/confirmDocument → dispatcher documentsController → createDocumentService → eventBus → subscribers. Confirm no field-name drift. Verify the saga's try/catch still dispatches `uploadDocumentFailure({ clientId, error })` and `notify` correctly. Report any drift as Issues.
         └─ Files: []
         └─ Depends on: T-16, T-20, T-22
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Agent: review | Status: done (with WARNINGs — 3 stale AgreementListView tests)_

**Tasks:**
[x] T-26 [VERIFY] Trace flows + check all AC + run final UI validate
         └─ Detail: (1) Walk the three user flows in the plan (portal insurance upload; dispatcher BOL; status-change dialog) reading the actual code path and confirming each step executes the expected handler. (2) Check every AC from US-01..US-09 against the implemented files; mark any unmet. (3) Run `(cd hussle-app-dispatch-ui && npm run validate) > /tmp/build-ver01-validate.log 2>&1` and report pass/fail summary only. (4) Produce a punch list of any remaining issues for a follow-up fix loop.
         └─ Files: []
         └─ Depends on: T-24, T-25
         └─ Output:

---

## FIX-01: Rewrite stale AgreementListView tests against SingleDocumentUpload DOM
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-09_

bug_introducing_story: US-09

must_haves:
  truths:
    - "The 3 previously-failing AgreementListView.test.tsx cases pass against the SingleDocumentUpload-based DOM"
    - "Same intents are still exercised: doc-row-before-agreement-row ordering; COI shown as next-up when no docs uploaded; uploaded indicator shown when session.documents contains COI"
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.test.tsx
      provides: "Refreshed test cases querying the new SingleDocumentUpload-rendered DOM"
  key_links:
    - from: AgreementListView.test.tsx
      to: SingleDocumentUpload visual states
      via: "queries idle Upload button / uploading progress / success fileName per slot"

**Tasks:**
[x] T-27 [FIX] Rewrite 3 stale AgreementListView test cases
         └─ Detail: In hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.test.tsx lines 144-170, update three tests to assert against the new SingleDocumentUpload DOM. (1) 'renders document row BEFORE agreement row in the DOM' — query the Upload button differently (SingleDocumentUpload renders an Upload button when status=idle — find it by role and proximity to the slot label "Certificate of Insurance", e.g., scope to the document row). (2) 'shows COI as next when no docs uploaded yet' — assert the Upload button exists when no COI doc in session.documents. (3) 'shows uploaded badge when COI is in session.documents' — when session.documents contains an uploadedCOI, SingleDocumentUpload renders status='success' with fileName + check icon — assert by querying for the fileName text (e.g., the COI doc's fileName from the fixture) within the row. Tip: scope queries with within(row) where row is the container that holds the COI slot. Use accessibility queries.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.test.tsx]
         └─ Depends on: —
         └─ Output:

---

## Summary

| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 5     | 5    | 0       | 8/8    |
| US-02 | 2     | 2    | 0       | 2/2    |
| US-03 | 1     | 1    | 0       | 1/1    |
| US-04 | 3     | 3    | 0       | 2/2    |
| US-05 | 2     | 2    | 0       | 2/2    |
| US-06 | 6     | 6    | 0       | 5/5    |
| US-07 | 2     | 2    | 0       | 1/1    |
| US-08 | 1     | 1    | 0       | 1/1    |
| US-09 | 1     | 1    | 0       | 1/1    |
| INT-01| 1     | 1    | 0       | —      |
| INT-02| 1     | 1    | 0       | —      |
| VER-01| 1     | 1    | 0       | —      |
| FIX-01| 1     | 1    | 0       | —      |
| **All** | **27** | **27** | **0** | **23/23** |
