# Derived Values Removal — Tasks
_Last updated: 2026-05-25 (full rebuild for /build compliance)_
_Plan: .planning/derived-values-removal/plan.md_
_File matrix: .planning/derived-values-removal/file-matrix.md_

## Refinement notes (2026-05-25)
- ~~Side-effect ownership: **US-13 owns port + delete** of invoiceReadinessSubscriber. US-08 = investigation only. US-11 = column-read swap only.~~ **REVISED post-US-08 discovery (2026-05-25):** Subscriber is misnamed and NEVER wrote Load.invoiceReadiness column. Subscriber STAYS (handles real work: auto-invoice creation, load.status flips, TONU). Only the dead no-op `updateLoadStatus(loadId, load.status)` call at subscriber.ts:160 goes. US-11 T-32 collapses to "remove invoiceReadiness: field from loadTransformer.ts" (no reads to replace). See `.planning/derived-values-removal/invoice-readiness-port-plan.md`.
- **US-12 deps**: `US-09, US-11` (prevents stale-cache test confusion).
- **Dispatcher backfill**: SQL includes `DispatcherProfile → Load` UPDATE block.
- **Audit truth** added to US-12 (PATCH /loads/:id/dispatch-terms must audit).
- **Enums locked**: `Load.dispatchFeeType` = `DispatchFeeType` (from `Carrier.dispatchFeeType`); `Load.dispatcherCommissionType` = `DispatcherCommType`. `Carrier.feeType` confirmed vestigial.
- **NULL semantics** on 9 new input columns codified as US-10 truths.
- **US-01 truths** expanded: multi-unvoided-SIGNED ordering + explicit warning-threshold definition.

---

# Phase 1 — Carrier compliance refactor

## US-01: Build derivedCompliance utilities (single + batch)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo_

must_haves:
  truths:
    - "computeInsuranceStatus returns { onFile: true, expiresAt, warning } when carrier has a non-archived confirmed INSURANCE_CERT"
    - "computeInsuranceStatus returns { onFile: false, expiresAt: null, warning: null } when all are archived or none exist"
    - "computeInsuranceStatus selects latest by createdAt when multiple INSURANCE_CERT rows exist"
    - "computeInsuranceStatus.warning is 'EXPIRED' when expiresAt < now, '7_DAY' when expiresAt < now + 7d, '30_DAY' when expiresAt < now + 30d (and not within 7d window), null otherwise or when expiresAt is null"
    - "computeAgreementStatus returns onFile=true only when Agreement.status=SIGNED AND voidedAt IS NULL"
    - "computeAgreementStatus selects latest by signedAt DESC when multiple SIGNED + voidedAt=null rows exist (re-sign without void)"
    - "computeCompliancesForCarriers issues exactly 2 batch queries (Document.findMany + Agreement.findMany) regardless of carrierIds count"
  artifacts:
    - path: hussle-app-dispatch-api/src/carriers/services/derivedCompliance.ts
      provides: "computeInsuranceStatus, computeW9Status, computeCarrierPacketStatus, computeAgreementStatus (single-carrier)"
    - path: hussle-app-dispatch-api/src/carriers/services/derivedComplianceBatch.ts
      provides: "computeCompliancesForCarriers — N=2-queries batch variant for list endpoints"
    - path: hussle-app-dispatch-api/src/carriers/services/__tests__/derivedCompliance.test.ts
      provides: "Unit tests covering all single-carrier truths"
    - path: hussle-app-dispatch-api/src/carriers/services/__tests__/derivedComplianceBatch.test.ts
      provides: "Batch tests asserting exactly 2 queries regardless of carrier count"
  key_links:
    - from: derivedComplianceBatch
      to: DocumentRepoPort + AgreementRepoPort
      via: "port-injected repo functions (no direct Prisma)"

**Tasks:**
[x] T-01 [API] Build derivedCompliance.ts (4 single-carrier functions, port-injected) — commit f6de279d9
         └─ Files: [hussle-app-dispatch-api/src/carriers/services/derivedCompliance.ts]
         └─ Depends on: —
         └─ Output: Exports computeInsuranceStatus/W9Status/CarrierPacketStatus/AgreementStatus + deriveInsuranceWarning. Extended DocumentRepoPort with findManyForCompliance and AgreementRepoPort with findManySigned (+ Prisma impls). Patched 10 jest.Mocked test fixtures for new port methods. Zero @prisma/client imports in derivedCompliance.ts.
[x] T-02 [API] Build derivedComplianceBatch.ts (computeCompliancesForCarriers, 2-query batch) — commit 82be2846f
         └─ Files: [hussle-app-dispatch-api/src/carriers/services/derivedComplianceBatch.ts]
         └─ Depends on: T-01
         └─ Output: Exports computeCompliancesForCarriers using Pick<DocumentRepoPort,'findManyForCompliance'> + Pick<AgreementRepoPort,'findManySigned'>. Returns Map<carrierId, { insurance, w9, carrierPacket, agreement }>. EXACTLY 2 queries regardless of carrierIds.length.
[x] T-03 [TEST] Unit tests for both — commit 41f3de9fe
         └─ Files: [hussle-app-dispatch-api/src/carriers/services/__tests__/derivedCompliance.test.ts, hussle-app-dispatch-api/src/carriers/services/__tests__/derivedComplianceBatch.test.ts]
         └─ Depends on: T-02
         └─ Output: 24/24 new tests passing (16 single-carrier + 8 batch). 72/72 related tests passing. check-ts clean. All 7 truths verified.

---

## US-02: Swap Carrier compliance readers + transformers
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo | Depends on: US-01_

must_haves:
  truths:
    - "Every reader of the 7 Carrier compliance columns now calls a derivedCompliance function instead"
    - "Carrier list endpoint response keeps identical field names (insuranceCertOnFile, insuranceExpiry, w9OnFile, carrierPacketOnFile, dispatchAgreementOnFile, signedAgreementId, dispatchAgreementSignedAt) but values come from compute*"
    - "Single-carrier endpoints inject computed compliance via per-row compute; list endpoint uses lookup map from computeCompliancesForCarriers"
    - "onboardingGate.ts gate decisions match prior behavior given identical underlying Document/Agreement state"
  artifacts:
    - path: hussle-app-dispatch-api/src/carriers/controllers/transformers/carrierTransformer.ts
      provides: "Modified to accept computed compliance map and inject into response payload"
  key_links:
    - from: carrierTransformer (list)
      to: computeCompliancesForCarriers
      via: "import + batch call before per-row transform"
    - from: onboardingGate
      to: computeInsuranceStatus / computeAgreementStatus
      via: "replace persisted-column read with compute call"

**Tasks:**
[x] T-04 [API] Replace reads of the 7 Carrier compliance columns — commit b742c23c6
         └─ Files: [shared/onboardingGate.ts, loads/services/loadService.ts, loads/repositories/loadRepositoryPrisma.ts, loads/compositionRoot.ts, carrier-portal/services/onboardingSessionService.ts, carrier-portal/controllers/sessionController.ts, carrier-portal/compositionRoot.ts, carriers/jobs/documentCheckJob.ts, loads/types/loadTypes.ts]
         └─ Depends on: —
         └─ Output: All 7 columns no longer read by consumers. Composition roots updated to inject documentRepo + agreementRepo into onboardingGate, loadService, onboardingSessionService, documentCheckJob.
[x] T-05 [API] Carrier list transformer uses computeCompliancesForCarriers + lookup map — commit a2769317d
         └─ Files: [carriers/controllers/carrierController.ts, carriers/controllers/transformers/carrierTransformer.ts, carriers/compositionRoot.ts]
         └─ Depends on: T-04
         └─ Output: 5 callsites in carrierController batch-compute compliance. carrierTransformer.overlayCompliance injects 7 legacy fields + insuranceWarning (D3 new field).
[x] T-06 [API] Carrier detail/single-write transformers — commit e3940b5a4
         └─ Files: [carriers/controllers/onboardingDetailController.ts, carriers/controllers/transformers/onboardingDetailTransformer.ts]
         └─ Depends on: T-05
         └─ Output: Per-row compute on single-carrier paths. approvalTransformer + dispatchOverrideTransformer confirmed out-of-scope (neither surfaces compliance fields). 117/117 related tests pass; check-ts clean.

---

## US-03: UI form cleanup (Carrier compliance fields)
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: todo | Depends on: US-02_

must_haves:
  truths:
    - "5 compliance Formik fields removed from CarrierFormDialog, CreateCarrierForm, DispatchTermsDrawer"
    - "carrierSchema + fleetSchema no longer validate the dropped fields"
    - "API CreateCarrierInput + UpdateCarrierInput validators reject the dropped fields"
    - "Display code that READS the response field names (e.g., insuranceCertOnFile in list grid) is unchanged — names preserved on response"
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier/validators/carrierSchema.ts
      provides: "Schema without 5 dropped compliance fields"
  key_links:
    - from: CarrierFormDialog
      to: carrierSchema
      via: "Formik validationSchema"

**Tasks:**
[x] T-07 [UI] Remove 5 compliance Formik fields from form components — commit 65a18a589
         └─ Files: [CarrierFormDialog/index.tsx, CreateCarrierForm/index.tsx, DispatchTermsDrawer/index.tsx]
         └─ Output: 5 fields removed from initialValues + JSX. Onboarding sections removed; unused DateField imports cleaned.
[x] T-08 [UI] Remove dropped fields from carrierSchema + fleetSchema — commit 65a18a589
         └─ Files: [carrierSchema.ts, fleetSchema.ts]
         └─ Output: carrierEditSchema + dispatchTermsSchema purged of compliance fields. 8/8 carrierSchema tests pass.
[x] T-09 [API] Remove dropped fields from validators + input types — commit e80ff95f9
         └─ Files: [carrierValidators.ts, carrierTypes.ts]
         └─ Output: createBodySchema purged. CreateCarrierInput/UpdateCarrierInput types purged. 7/7 related tests pass.
[x] T-10 [UI] Response types unchanged + client request types purged — commit cbf054e93
         └─ Files: [features/carrier/types.ts]
         └─ Output: Response shape preserves 7 fields + insuranceWarning. Client CreateCarrierInput/UpdateCarrierInput purged. CarrierKPI (8 hits) + GeneralTab (14 hits) display intact.

---

## US-04: Writer + subscriber deletions (Phase 1)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo | Depends on: US-02_

must_haves:
  truths:
    - "carrierComplianceSubscriber.ts is deleted and its registration removed from carriers/compositionRoot.ts"
    - "setSignedAgreementId + clearSignedAgreement methods deleted from carrierAgreementWriteRepositoryPrisma.ts"
    - "agreementSignedSubscriber.ts retains DocuSeal finalize logic but no longer calls any Carrier-write method"
    - "COMPLIANCE_FLAG_MAP remnants removed from portalDocumentsService.ts (verify after upload-pipeline-unification cleanup)"
  artifacts:
    - path: hussle-app-dispatch-api/src/carriers/compositionRoot.ts
      provides: "No longer registers carrierComplianceSubscriber"
  key_links:
    - from: agreementSignedSubscriber
      to: finalizeAgreement (DocuSeal PDF handler)
      via: "still calls — only Carrier-write call removed"

**Tasks:**
[x] T-11 [API] Delete carrierComplianceSubscriber + registration — commit 08829aefc
         └─ Files: [carrierComplianceSubscriber.ts (deleted), carriers/compositionRoot.ts, carriers/index.ts]
         └─ Output: Subscriber + test deleted, factory + bootstrap call removed.
[x] T-12 [API] Delete signedAgreement carrier-write methods — commit 553e28630
         └─ Files: [CarrierAgreementWritePort (deleted), carrierAgreementWriteRepositoryPrisma.ts (deleted), agreementSignedSubscriber.ts, mockSignAgreement.ts, voidForReSign.ts, agreements/compositionRoot.ts, 3 test files]
         └─ Output: Port + Prisma impl entirely deleted. carrier-write calls removed from 4 callsites. DocuSeal finalizeAgreement chain preserved.
[x] T-13 [API] Clean COMPLIANCE_FLAG_MAP remnants — NO-OP
         └─ Files: []
         └─ Output: Map was already removed by upload-pipeline-unification. Zero grep hits across API.

---

## US-05: Phase 1 test fixture audit
_Priority: P0 | Services: dispatch-api,dispatch-ui | Agent: backend | Status: todo | Depends on: US-04_
_Sizing (2026-05-25 grep): 44 API files + 15 UI files = 59 files reference the 7 Carrier columns. Multi-day story._

must_haves:
  truths:
    - "No test file references any of the 7 dropped Carrier columns by name (insuranceCertOnFile, insuranceExpiry, w9OnFile, carrierPacketOnFile, dispatchAgreementOnFile, signedAgreementId, dispatchAgreementSignedAt)"
    - "Assertions that previously read persisted columns now read the computed response payload (same field name) — semantics preserved"
    - "Fixture rows that USED to set the dropped columns no longer reference them (Prisma create will reject them after migration)"
    - "npm run check-ts clean for hussle-app-dispatch-api BEFORE schema migration runs"
  artifacts:
    - path: /tmp/phase1-fixture-inventory.txt
      provides: "Grep inventory of all affected test files (transient, but generated as audit trail)"
  key_links:
    - from: dispatch-api tests
      to: derivedCompliance functions (assertions of computed values)
      via: "import + assert on response payload field"

**Tasks:**
[x] T-14 [TEST] Grep all test files for the 7 dropped Carrier columns; produce inventory
         └─ Files: [/tmp/phase1-fixture-inventory.txt]
         └─ Output: 17 files affected (16 API + 1 UI). 8 FIXTURE_ONLY (Prisma Carrier shape); 9 LEAVE-alone (DTO/port/response/pure-function input shapes).
[x] T-15 [TEST] Bulk-update test fixtures — commit e0a6d0f54
         └─ Files: [8 API test files: carrierService, onboardingSessionComplete, onboardingSessionService, loadStatusService, calculateFinancials, financialRecalcSubscriber, loadService, settlementService]
         └─ Output: 8 files, +5/-35. carrierService.test.ts keeps 4 fields under FIXME(US-06) due to enrichCarrier still reading them.
[x] T-16 [VERIFY] check-ts clean BEFORE migration
         └─ Files: []
         └─ Output: API check-ts exit 0. UI check-ts exit 2 (pre-existing unrelated errors in src/templates/, src/utils/, src/mocho-ui/types). API tests 1687/1688 (1 pre-existing docusealProvider failure). UI tests 1349/1349.

**⚠ DISCOVERED BLOCKERS for US-06 (not previously known):**
1. `carriers/services/carrierService.ts:88-127` enrichCarrier reads `dispatchAgreementOnFile`, `insuranceCertOnFile`, `insuranceExpiry` directly.
2. `carriers/services/carrierSuspendService.ts:88-90` reads same 3 fields.
3. `carrier-portal/services/portalCompanyService.ts:94` reads `dispatchAgreementSignedAt` for lock enforcement.
4. `carriers/services/dispatchOverrideService.ts` — `CarrierForOverride` DTO carries 4 compliance fields; port query likely reads Carrier columns.
5. `dashboard/services/dashboardService.ts:148` `getCarriersWithExpiringInsurance` queries `Carrier.insuranceExpiry`.
**These must be swapped to compute-on-read before US-06 schema drop. Will require a new US-04b (or extending US-02 scope).**

---

## US-06: Phase 1 schema migration
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo | Depends on: US-05_

must_haves:
  truths:
    - "schema.prisma Carrier model has zero compliance columns (7 dropped)"
    - "Prisma migration named drop_carrier_compliance_caches applies cleanly via prisma migrate dev"
    - "Prisma client regenerates; npm run check-ts has zero residual errors after regen"
    - "\\d \"Carrier\" in psql confirms columns are gone"
  artifacts:
    - path: hussle-app-dispatch-api/prisma/migrations/*_drop_carrier_compliance_caches/migration.sql
      provides: "DROP COLUMN ALTER TABLE statements for 7 columns"
  key_links:
    - from: prisma schema.prisma Carrier model
      to: migration.sql
      via: "prisma migrate dev generation"

**Tasks:**
[x] T-17 [DB] Remove Carrier compliance columns from schema.prisma — commit 9faa994be
         └─ Files: [hussle-app-dispatch-api/prisma/schema.prisma]
         └─ Output: 5 columns dropped (insuranceCertOnFile, insuranceExpiry, dispatchAgreementOnFile, dispatchAgreementSignedAt, signedAgreementId). NOTE: w9OnFile and carrierPacketOnFile never existed in schema — plan was wrong about 7-column count.
[x] T-18 [DB] Generate + apply migration — commit 9faa994be
         └─ Files: [prisma/migrations/20260525200825_drop_carrier_compliance_caches/migration.sql]
         └─ Output: Used `prisma migrate diff` + `migrate deploy` (harness has no TTY for `migrate dev`). Migration applied; recorded in _prisma_migrations. \d "Carrier" confirms columns gone.
[x] T-19 [API] Regenerate Prisma client; resolve residual type errors — commit 38d46ba00
         └─ Files: [src/carriers/controllers/transformers/carrierTransformer.ts]
         └─ Output: Removed 5 dead field projections from overlayCompliance (kept insuranceWarning). API check-ts exit 0. 1687/1688 tests pass (1 pre-existing docusealProvider baseline).

---

## US-07: Phase 1 live verification
_Priority: P0 | Read-only | Agent: review | Status: todo | Depends on: US-06_

must_haves:
  truths:
    - "npm run validate passes (1672 baseline; pre-existing docusealProvider failure permitted)"
    - "UI npm test passes (1349 baseline) + check-ts clean"
    - "Carrier list at /carriers renders with computed compliance badges (visual check)"
    - "Drift-elimination proof: upload INSURANCE_CERT via portal → carrier shows 'On file' + expiry; archive document → carrier IMMEDIATELY shows 'Missing' with no cache-invalidation step"
  artifacts:
    - path: /tmp/build-phase1-validation.log
      provides: "Captured validate output"
  key_links:
    - from: Document.isArchived mutation
      to: Carrier list compliance display
      via: "compute-on-read (no cached column to invalidate)"

**Tasks:**
[x] T-20 [VERIFY] API test + check-ts — captured to /tmp/us-07-api-test.log + /tmp/us-07-api-ts.log
         └─ Output: 1687/1688 pass (1 pre-existing docusealProvider baseline failure). check-ts exit 0.
[x] T-21 [VERIFY] UI test + check-ts — captured to /tmp/us-07-ui-test.log + /tmp/us-07-ui-ts.log
         └─ Output: 1349/1349 pass + 1 todo. check-ts has pre-existing baseline errors in src/utils/uploadInlineImages.ts + src/utils/validation/blogPost.ts (unrelated).
[x] T-22 [VERIFY] Live Playwright drift-elimination proof — commit facb60436 (bug fix)
         └─ Output: BUG DISCOVERED during verification — US-06 T-19 (commit 38d46ba00) over-deleted 5 compliance projections from carrierTransformer.overlayCompliance, dropping insuranceCertOnFile/insuranceExpiry/dispatchAgreementOnFile/dispatchAgreementSignedAt/signedAgreementId from the response entirely. Fixed in commit facb60436 by re-adding the 5 fields to CarrierResponse and sourcing them from ComplianceForCarrier in toCarrierResponse.
            Proof passed end-to-end:
            (1) Inserted Document {type: INSURANCE_CERT, isArchived: false, uploadStatus: confirmed, expiresAt: +90d} → API returned insuranceCertOnFile=true, insuranceExpiry=2026-08-23; UI showed "COI Expires: Aug 23, 2026".
            (2) Set Document.isArchived=true → API immediately returned insuranceCertOnFile=false, insuranceExpiry=null; UI showed "COI Expires: —".
            ZERO cache invalidation steps. Screenshots at .planning/derived-values-removal/us-07-proof-{on-file,archived}.png.

---

## US-04b: Plug 5 leftover Carrier compliance readers (discovered during US-05)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01_

must_haves:
  truths:
    - "carriers/services/carrierService.ts enrichCarrier no longer reads dispatchAgreementOnFile/insuranceCertOnFile/insuranceExpiry from the Carrier row; uses computeCompliancesForCarriers or per-function compute"
    - "carriers/services/carrierSuspendService.ts no longer reads those 3 fields from the Carrier row"
    - "carrier-portal/services/portalCompanyService.ts lock enforcement uses computeAgreementStatus instead of carrier.dispatchAgreementSignedAt"
    - "carriers/services/dispatchOverrideService.ts CarrierForOverride port DTO no longer carries the 4 compliance fields; service builds them via compute"
    - "dashboard/services/dashboardService.ts getCarriersWithExpiringInsurance migrates to compute-on-read (queries Documents WHERE type=INSURANCE_CERT, expiresAt within window) instead of Carrier.insuranceExpiry column"
    - "Final grep across hussle-app-dispatch-api/src (excluding tests + schema.prisma) for the 7 Carrier compliance columns returns ZERO production-code reads"
  artifacts:
    - path: hussle-app-dispatch-api/src/carriers/services/carrierService.ts
      provides: "enrichCarrier modified to use compute"
    - path: hussle-app-dispatch-api/src/dashboard/repositories/dashboardRepositoryPrisma.ts (likely)
      provides: "Expiring-insurance query refactored to Document table"
  key_links:
    - from: enrichCarrier
      to: computeCompliancesForCarriers / computeAgreementStatus / computeInsuranceStatus
      via: "import + call, replacing direct carrier-column read"
    - from: dashboardService.getCarriersWithExpiringInsurance
      to: documentRepo.findMany (or new repo method)
      via: "query Document.expiresAt + carrier join instead of Carrier.insuranceExpiry"

**Tasks:**
[x] T-15b [API] Swap carrierService.enrichCarrier + carrierSuspendService to compute
         └─ Files: [hussle-app-dispatch-api/src/carriers/services/carrierService.ts, hussle-app-dispatch-api/src/carriers/services/carrierSuspendService.ts, hussle-app-dispatch-api/src/carriers/compositionRoot.ts]
         └─ Depends on: —
         └─ Output:
[x] T-15c [API] Swap portalCompanyService lock to computeAgreementStatus
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/portalCompanyService.ts, hussle-app-dispatch-api/src/carrier-portal/compositionRoot.ts]
         └─ Depends on: —
         └─ Output:
[x] T-15d [API] Refactor dispatchOverrideService CarrierForOverride DTO + repo path
         └─ Files: [hussle-app-dispatch-api/src/carriers/services/dispatchOverrideService.ts, port + repo files touching CarrierForOverride]
         └─ Depends on: —
         └─ Output:
[x] T-15e [API] Migrate dashboardService.getCarriersWithExpiringInsurance to Document-table query
         └─ Files: [hussle-app-dispatch-api/src/dashboard/services/dashboardService.ts, hussle-app-dispatch-api/src/dashboard/repositories/* (likely dashboardRepositoryPrisma.ts), possibly hussle-app-dispatch-api/src/documents/repositories/documentRepositoryPrisma.ts]
         └─ Depends on: —
         └─ Output:
[x] T-15f [TEST] Restore carrierService.test.ts FIXME block (remove the 4 compliance fields from buildCarrier fixture)
         └─ Files: [hussle-app-dispatch-api/src/carriers/services/__tests__/carrierService.test.ts]
         └─ Depends on: T-15b
         └─ Output:

---

# Phase 2 — Load financials refactor (input-snapshot pattern)

## US-08: Investigate invoiceReadinessSubscriber side effects
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo_

must_haves:
  truths:
    - "Discovery report documents EVERY action invoiceReadinessSubscriber performs beyond writing Load.invoiceReadiness column (notifications, audit log entries, event publishes, etc.)"
    - "Report produces a port-plan: for each side effect, which trigger should it move to in US-13 (document.confirmed, load.statusChanged, or new event)"
  artifacts:
    - path: .planning/derived-values-removal/invoice-readiness-port-plan.md
      provides: "Itemized side-effect inventory + port destinations"
  key_links:
    - from: discovery report
      to: US-13 port + delete task
      via: "execution input for T-38"

**Tasks:**
[x] T-23 [DISCOVERY] invoiceReadinessSubscriber side-effect inventory + port-plan
         └─ Files: [.planning/derived-values-removal/invoice-readiness-port-plan.md]
         └─ Output: MAJOR FINDING — subscriber is misnamed. It NEVER writes Load.invoiceReadiness column (full grep confirms zero writes; column sat at NOT_READY default since creation). Actual subscriber jobs: auto-creates CUSTOMER + DISPATCH_FEE invoices on delivery, flips load.status → INVOICE_PENDING when invoice exists, handles TONU. 14 effects inventoried (11 KEEP / 2 DROP / 1 REPLACE). US-13 T-38 collapses to: drop column from Prisma, remove 2 invoiceReadiness field references in loadTransformer.ts, delete dead no-op updateLoadStatus call. No new subscribers needed, no event re-wiring.

---

## US-09: Schema additions + booking-flow snapshot capture
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo | Depends on: US-08_

**Decisions locked during /prd-refine (2026-05-25):**
- Load.dispatchFeeType uses enum `DispatchFeeType` (PERCENTAGE/FLAT); snapshot from `Carrier.dispatchFeeType` (NOT `Carrier.feeType` — vestigial; see plan Out of Scope).
- Load.dispatcherCommissionType uses enum `DispatcherCommType`; snapshot from `DispatcherProfile.commissionType` via `Load.dispatcherUserId → DispatcherProfile.userId` (confirm relation during execution).

must_haves:
  truths:
    - "Load model gains 7 new input columns + dispatchFeeOverride{Type,Amount} renamed to dispatchFee{Type,Amount}"
    - "Backfill SQL populates dispatchFeeType/Amount from Carrier; driverPayType/Rate from Driver; dispatcherCommissionType/Rate from DispatcherProfile via dispatcherUserId join; partnerSplitPercent, feeIncludesAccessorials, payFromNet from Carrier"
    - "loadService.create snapshots all 9 rate inputs at booking from Carrier/Driver/DispatcherProfile onto the new Load row"
    - "Other Load mutation paths that change carrierId/driverId/dispatcherUserId re-snapshot the relevant inputs"
    - "Existing rows post-backfill: zero NULL in dispatchFeeType for loads with carrierId set; zero NULL in driverPayType for loads with driverId set"
  artifacts:
    - path: hussle-app-dispatch-api/prisma/migrations/*_add_load_input_snapshots/migration.sql
      provides: "ALTER TABLE Load + backfill UPDATEs + rename statements per plan"
  key_links:
    - from: loadService.create
      to: Carrier + Driver + DispatcherProfile rows
      via: "Prisma find at create time → copy fields onto Load.create input"

**Tasks:**
[x] T-24 [DB] Schema + migration + rename — commit a5deeac50
         └─ Files: [prisma/schema.prisma, prisma/migrations/20260525164216_add_load_input_snapshots/migration.sql, 11 production files + 6 test files renamed]
         └─ Output: 9 columns added (7 new + 2 renamed). Backfill via 2-table Membership join for dispatcher; CASE WHEN for fee amount. Counts: missing_fee=0, missing_driver=0, missing_dispatcher=0.
[x] T-25 [API] loadService.create snapshot — commit 4fa8d5b83
         └─ Files: [loadService.ts (+buildRateSnapshot helper), carrierAssignmentQueryPrisma + port, driverAssignmentQueryPrisma + port, dispatcherProfileQueryPort, test fixtures]
         └─ Output: 9 inputs snapshotted at create. COALESCE for dispatchFeeType/Amount (input wins, carrier fallback). dispatcherUserId not currently in CreateLoadInput — only backfill + reassignment paths populate dispatcher.
[x] T-26 [API] Re-snapshot on reassignment — commit 4a1b3476a
         └─ Files: [loadService.ts (updateLoad + assignLoad paths)]
         └─ Output: When carrierId/driverId changes vs existing, calls buildRateSnapshot for the changed side only (driver change doesn't refresh carrier-sourced fields). check-ts clean. 1687/1688 tests pass (1 pre-existing docusealProvider baseline).

**Open flags carried forward to follow-up:**
- dispatcherUserId is in schema but not in CreateLoadInput/UpdateLoadInput/LoadAssignmentInput. Dispatcher commission snapshot only populated via backfill + future reassignment paths. Recommend adding dispatcherUserId to LoadAssignmentInput in a follow-up.
- resolveDispatchFee carrier-fallback branches are now dead code post-snapshot (every load has populated dispatchFeeType/Amount) but harmless. Cleanup is a follow-up.

---

## US-09b: Snapshot carrierType on Load (mini, discovered during US-10)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: in-progress | Depends on: US-09_

must_haves:
  truths:
    - "Load model has new column `carrierType: CarrierType?` (nullable for loads created before the rollout)"
    - "Backfill UPDATE populates Load.carrierType from Carrier.type for all existing rows with carrierId set"
    - "loadService.create snapshots carrierType at booking from the resolved Carrier row"
    - "Carrier reassignment paths (updateLoad, assignLoad) re-snapshot carrierType when carrierId changes"
    - "derivedFinancials.computeLoadFinancials reads carrierType from the Load row (drops the extras.carrierType param)"
    - "After backfill, zero NULL in Load.carrierType for rows with carrierId set"
  artifacts:
    - path: hussle-app-dispatch-api/prisma/schema.prisma
      provides: "Load.carrierType column"
    - path: hussle-app-dispatch-api/prisma/migrations/*_snapshot_load_carrier_type/migration.sql
      provides: "ADD COLUMN + backfill UPDATE"
  key_links:
    - from: derivedFinancials.computeLoadFinancials
      to: Load.carrierType (snapshot column, not Carrier.type via extras)
      via: "destructure off the Load row instead of accepting via extras param"

**Tasks:**
[x] T-29b1 [DB] Add Load.carrierType column + backfill from Carrier.type
         └─ Files: [hussle-app-dispatch-api/prisma/schema.prisma, hussle-app-dispatch-api/prisma/migrations/*_snapshot_load_carrier_type/migration.sql]
         └─ Output:
[x] T-29b2 [API] Wire carrierType snapshot into loadService.buildRateSnapshot + reassignment paths
         └─ Files: [hussle-app-dispatch-api/src/loads/services/loadService.ts, carrierAssignmentQueryPort + Prisma adapter]
         └─ Output:
[x] T-29b3 [API] Refactor computeLoadFinancials to read carrierType from Load (drop extras.carrierType)
         └─ Files: [hussle-app-dispatch-api/src/loads/services/derivedFinancials.ts, src/loads/services/__tests__/derivedFinancials.test.ts]
         └─ Output:

---

## US-10: Refactor calculateLoadFinancials to consume per-load inputs
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo | Depends on: US-09_

must_haves:
  truths:
    - "calculateLoadFinancials signature takes Load row + accessorials sum (no Carrier/Driver/Dispatcher refs)"
    - "computeLoadFinancials returns driverPay=0 when driverPayRate is NULL (driver unassigned at booking)"
    - "computeLoadFinancials returns dispatcherComm=0 when dispatcherCommissionRate is NULL"
    - "computeLoadFinancials returns dispatchFee=0 when dispatchFeeType is NULL"
    - "computeLoadFinancials returns partnerSplit=0 when partnerSplitPercent is NULL"
    - "computeLoadFinancials respects feeIncludesAccessorials flag from Load row (not Carrier)"
    - "computeLoadFinancials respects payFromNet flag from Load row (not Carrier)"
    - "computeInvoiceReadiness reproduces prior invoiceReadinessSubscriber column-write logic as pure function"
  artifacts:
    - path: hussle-app-dispatch-api/src/loads/services/derivedFinancials.ts
      provides: "computeLoadFinancials wrapper + computeInvoiceReadiness pure function"
    - path: hussle-app-dispatch-api/src/shared/financials.ts
      provides: "Refactored calculateLoadFinancials with new signature"
  key_links:
    - from: derivedFinancials.computeLoadFinancials
      to: shared/financials.calculateLoadFinancials
      via: "wrapper call with Load row destructured into the pure function"

**Tasks:**
[x] T-27 [API] Refactor calculateLoadFinancials signature — commit 80a1a4a13
         └─ Files: [src/shared/financials.ts, src/loads/services/calculateFinancials.ts]
         └─ Output: New signature (input: LoadFinancialsInput, accessorialsSum: Decimal) → LoadFinancialsResult. Flat snapshot shape (no nested carrier). Orchestrator calculateAndPersistFinancials retains transitional fallback to Carrier/Driver/Dispatcher refs until US-15.
[x] T-28 [API] Tests for new signature + NULL semantics — commit 226f50978
         └─ Files: [src/shared/__tests__/financials.test.ts, src/loads/__tests__/calculateFinancials.test.ts]
         └─ Output: 41 + 24 tests pass. All 6 NULL truths covered. driverPay/dispatcherComm return null (not "0.00") — pre-existing semantic preserved.
[x] T-29 [API] computeLoadFinancials + computeInvoiceReadiness — commit 2aaa2d13f
         └─ Files: [src/loads/services/derivedFinancials.ts, src/loads/services/__tests__/derivedFinancials.test.ts]
         └─ Output: 11 new tests pass. computeInvoiceReadiness rule extracted from invoiceReadinessSubscriber.ts:140-157 (BROKER_RATE_CON + BOL_SIGNED + POD all required; status DELIVERED or INVOICE_PENDING). computeLoadFinancials takes (load, accessorialsSum, extras) where extras.carrierType is needed because carrierType is NOT a Load snapshot column.

**Open flags carried to US-11/US-15:**
1. **carrierType not snapshotted on Load.** totalRevenue branches on COMPANY_ASSET vs others — carrier type changes propagate retroactively. Either (a) add Load.carrierType to US-15 schema, or (b) accept the drift (type changes are rare classification flips).
2. **dispatchFeeAmount semantics differ by type.** When dispatchFeeType=PERCENTAGE, dispatchFeeAmount holds a percent value (e.g., "10" for 10%) — matches US-09 snapshot write. Document in US-11 transformer code.
3. **InvoiceReadiness.INVOICE_CREATED** requires knowing an invoice exists — caller responsibility, not in computeInvoiceReadiness. Document for US-11.
4. **Orchestrator fallback is transitional.** calculateAndPersistFinancials still reads Carrier/Driver/Dispatcher as fallback when snapshots are null. Remove after US-15 confirms full backfill.

---

## US-11: Swap Load financial readers + transformers
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo | Depends on: US-10_

must_haves:
  truths:
    - "Every reader of the 10 Load output cache columns is replaced with computeLoadFinancials"
    - "Load response transformers inject 10 computed outputs (dispatchFee, carrierPayout, companyMargin, driverPay, partnerSplit, ratePerMile, ratePerTotalMile, estimatedCost, dispatcherComm, invoiceReadiness) into payload under same field names"
    - "Load.invoiceReadiness reads call computeInvoiceReadiness (column-read swap ONLY; side-effect port owned by US-13)"
    - "Response field names unchanged — UI consumers see identical shape"
  artifacts:
    - path: hussle-app-dispatch-api/src/loads/controllers/transformers/loadTransformer.ts
      provides: "Calls computeLoadFinancials per row and injects 10 outputs"
  key_links:
    - from: loadTransformer
      to: derivedFinancials.computeLoadFinancials
      via: "per-row call during transform"

**Tasks:**
[x] T-30 [API] Replace persisted-column reads in loadService, loadRepositoryPrisma, loadStatusService with computeLoadFinancials per row
         └─ Files: [hussle-app-dispatch-api/src/loads/services/loadService.ts, hussle-app-dispatch-api/src/loads/repositories/loadRepositoryPrisma.ts, hussle-app-dispatch-api/src/loads/services/loadStatusService.ts]
         └─ Depends on: —
         └─ Output:
[x] T-31 [API] Update Load response transformers to inject 10 computed outputs
         └─ Files: [hussle-app-dispatch-api/src/loads/controllers/transformers/loadTransformer.ts, hussle-app-dispatch-api/src/loads/controllers/transformers/weeklyGrossTransformer.ts, hussle-app-dispatch-api/src/loads/controllers/transformers/vehicleWeeklyRevenueTransformer.ts]
         └─ Depends on: T-30
         └─ Output:
[x] T-32 [API] Remove invoiceReadiness field from loadTransformer.ts; inject computeInvoiceReadiness result instead
         **Note (post-US-08):** No `Load.invoiceReadiness` reads exist to swap (column was never written; always default NOT_READY). Task collapses to: remove the 2 `invoiceReadiness:` field reads from loadTransformer.ts and inject the value computed via `computeInvoiceReadiness(load, documents)` into the response under the same key.
         └─ Files: [hussle-app-dispatch-api/src/invoices/services/*.ts (callsites), hussle-app-dispatch-api/src/loads/services/loadService.ts]
         └─ Depends on: T-30
         └─ Output:

---

## US-11b: Swap remaining cache-column readers across modules (discovered during US-11)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: in-progress | Depends on: US-11_

must_haves:
  truths:
    - "invoiceGenerationService no longer reads load.dispatchFee for invoice subtotal — uses computeLoadFinancials per row"
    - "settlementService + settlementLoadQueryPrisma no longer read load.dispatchFee / load.carrierPayout — use compute"
    - "drivers/loadHistoryTransformer, vehicles/loadHistoryTransformer, places/loadAtFacilityTransformer no longer read load.ratePerMile — use compute"
    - "loadQueries.ts computeMetrics consumes computed values instead of persisted dispatchFee/ratePerMile (already iterates per row — just swap the read)"
    - "weeklyGrossQueryPrisma replaces prisma.aggregate({ _sum: dispatchFee }) with findMany + per-row compute + JS sum (scoped to ONE vehicle × ONE week)"
    - "dashboardQueryPrisma replaces _sum aggregates of dispatchFee + partnerSplit with findMany + per-row compute + JS sum (scoped to ONE org × date range)"
    - "Final grep across hussle-app-dispatch-api/src (excluding tests + schema + writers) for the 10 Load output cache columns returns ZERO production-code reads"
  artifacts:
    - path: hussle-app-dispatch-api/src/invoices/services/invoiceGenerationService.ts
      provides: "Consumes computeLoadFinancials for subtotal"
    - path: hussle-app-dispatch-api/src/shared/loadQueries.ts
      provides: "computeMetrics fed by per-row compute"
    - path: hussle-app-dispatch-api/src/loads/repositories/weeklyGrossQueryPrisma.ts
      provides: "Aggregate replaced with findMany + JS reduce"
    - path: hussle-app-dispatch-api/src/dashboard/repositories/dashboardQueryPrisma.ts
      provides: "Two _sum aggregates replaced with findMany + JS reduce"
  key_links:
    - from: invoiceGenerationService / settlementService / *LoadHistoryTransformer / loadQueries / weeklyGrossQuery / dashboardQuery
      to: computeLoadFinancials (per row)
      via: "import + per-row call replacing persisted column read"

**Tasks:**
[x] T-32b1 [API] Swap per-row readers (invoices, settlements, place/driver/vehicle history)
         └─ Files: [invoiceGenerationService.ts, invoiceRepositoryPrisma.ts, settlementService.ts, settlementLoadQueryPrisma.ts, drivers/loadHistoryTransformer.ts, vehicles/loadHistoryTransformer.ts, places/loadAtFacilityTransformer.ts]
         └─ Output:
[x] T-32b2 [API] Swap loadQueries.computeMetrics to consume per-row compute
         └─ Files: [src/shared/loadQueries.ts]
         └─ Output:
[x] T-32b3 [API] Replace 3 Prisma _sum aggregates with findMany + JS reduce
         └─ Files: [src/loads/repositories/weeklyGrossQueryPrisma.ts, src/dashboard/repositories/dashboardQueryPrisma.ts]
         └─ Output:

---

## US-12: Per-load DispatchTermsEditor UI + API endpoint
_Priority: P0 | Services: dispatch-api,dispatch-ui | Agent: frontend | Status: todo | Depends on: US-09, US-11_
_Dep rationale: US-11 must land first so saved input changes immediately reflect in the computed outputs the editor displays; otherwise testing surfaces stale cache values._

must_haves:
  truths:
    - "PATCH /loads/:id/dispatch-terms exists; accepts the 9 per-load input fields; validates via Yup; rejects unauthorized roles"
    - "PATCH /loads/:id/dispatch-terms writes an audit log entry (actor, timestamp, old→new values per changed field) matching the audit pattern used by other money-mutating endpoints"
    - "DispatchTermsEditor drawer opens from load detail page via drawer registry"
    - "After saving terms, the load's computed financial outputs (dispatchFee, driverPay, dispatcherComm, etc.) reflect the new inputs on next fetch"
  artifacts:
    - path: hussle-app-dispatch-api/src/loads/routes/loadRoutes.ts
      provides: "Route entry for PATCH /loads/:id/dispatch-terms"
    - path: hussle-app-dispatch-api/src/loads/validators/dispatchTermsValidator.ts
      provides: "Yup validator for 9 per-load input fields"
    - path: hussle-app-dispatch-api/src/loads/services/updateDispatchTermsService.ts
      provides: "Service that updates Load row + emits audit event"
    - path: hussle-app-dispatch-ui/src/features/load/components/DispatchTermsEditor/index.tsx
      provides: "Drawer component with Formik form for 9 fields"
  key_links:
    - from: DispatchTermsEditor (UI)
      to: PATCH /loads/:id/dispatch-terms (API)
      via: "axios PATCH via utils/api/loads/"
    - from: updateDispatchTermsService
      to: auditSubscriber
      via: "dispatch domain event captured by audit module"

**Tasks:**
[x] T-33 [API] New endpoint PATCH /loads/:id/dispatch-terms (validator + mapper + controller + service); emit audit entry per truth
         └─ Files: [hussle-app-dispatch-api/src/loads/routes/loadRoutes.ts, hussle-app-dispatch-api/src/loads/controllers/loadController.ts, hussle-app-dispatch-api/src/loads/services/updateDispatchTermsService.ts, hussle-app-dispatch-api/src/loads/validators/dispatchTermsValidator.ts, hussle-app-dispatch-api/src/loads/compositionRoot.ts]
         └─ Depends on: —
         └─ Output:
[x] T-34 [UI] Build DispatchTermsEditor drawer — Formik fields for fee type/amount, partner split, driver pay, dispatcher commission, fee-includes-accessorials, pay-from-net
         └─ Files: [hussle-app-dispatch-ui/src/features/load/components/DispatchTermsEditor/index.tsx, hussle-app-dispatch-ui/src/features/load/components/DispatchTermsEditor/dispatchTermsSchema.ts, hussle-app-dispatch-ui/src/utils/api/loads/index.ts]
         └─ Depends on: T-33
         └─ Output:
[x] T-35 [UI] Wire DispatchTermsEditor into load detail page (entry button + drawer registration)
         └─ Files: [hussle-app-dispatch-ui/src/features/ui/drawerRegistry.ts, hussle-app-dispatch-ui/src/features/load/pages/LoadDetailPage/index.tsx]
         └─ Depends on: T-34
         └─ Output:

---

## US-13: Writer + subscriber deletions (Phase 2)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo | Depends on: US-11_

must_haves:
  truths:
    - "financialRecalcSubscriber.ts is deleted and its registration removed"
    - "calculateAndPersistFinancials function deleted from calculateFinancials.ts (deriveEstimatedHours + helpers retained)"
    - "All 4 persist call sites removed (1 in loadStatusService, 3 in loadService)"
    - "Dead no-op `updateLoadStatus(loadId, load.status)` call removed from invoiceReadinessSubscriber.ts (around L160). Subscriber otherwise UNTOUCHED — it stays to handle real work (auto-invoice creation, status flips, TONU)."
    - "No subscriber/writer ever sets the 10 Load output cache columns post-deletion"
  artifacts:
    - path: (deletions — see Files)
      provides: "Dead writer code removed"
  key_links:
    - from: invoiceReadinessSubscriber (preserved)
      to: invoice auto-creation flow
      via: "still listens to load.delivered / etc., creates CUSTOMER + DISPATCH_FEE invoices"

**Tasks:**
[x] T-36 [API] Delete financialRecalcSubscriber + registration
         └─ Files: [hussle-app-dispatch-api/src/loads/services/financialRecalcSubscriber.ts, hussle-app-dispatch-api/src/loads/compositionRoot.ts]
         └─ Depends on: —
         └─ Output:
[x] T-37 [API] Delete calculateAndPersistFinancials; remove persist call sites (1 in loadStatusService, 3 in loadService)
         └─ Files: [hussle-app-dispatch-api/src/loads/services/calculateFinancials.ts, hussle-app-dispatch-api/src/loads/services/loadStatusService.ts, hussle-app-dispatch-api/src/loads/services/loadService.ts]
         └─ Depends on: —
         └─ Output:
[x] T-38 [API] Remove dead no-op updateLoadStatus call from invoiceReadinessSubscriber.ts (per US-08 port-plan)
         **REVISED (post-US-08):** Subscriber STAYS. Only the dead `updateLoadStatus(loadId, load.status)` call at subscriber.ts:160 (writes status back to itself) goes. No port work; no deletion.
         └─ Files: [hussle-app-dispatch-api/src/invoices/services/invoiceReadinessSubscriber.ts]
         └─ Depends on: —
         └─ Output:

---

## US-14: Phase 2 test fixture audit
_Priority: P0 | Services: dispatch-api,dispatch-ui | Agent: backend | Status: todo | Depends on: US-13_
_Sizing (2026-05-25 grep): 14 API files + 3 UI files = 17 files reference the 10 Load output columns. ~1-day story._

must_haves:
  truths:
    - "No test file references any of the 10 dropped Load columns (dispatchFee, carrierPayout, companyMargin, driverPay, partnerSplit, ratePerMile, ratePerTotalMile, estimatedCost, dispatcherComm, invoiceReadiness) AS PERSISTED COLUMNS (response-field reads are fine)"
    - "npm run check-ts clean for hussle-app-dispatch-api BEFORE schema migration"
  artifacts:
    - path: /tmp/phase2-fixture-inventory.txt
      provides: "Grep inventory of all affected test files"
  key_links:
    - from: dispatch-api/ui tests
      to: computeLoadFinancials outputs
      via: "assertions on response payload field names (unchanged)"

**Tasks:**
[x] T-39 [TEST] Grep all test files for the 10 dropped Load columns; bulk-update fixtures and assertions
         └─ Files: [hussle-app-dispatch-api/src/**/*.test.ts (14 files), hussle-app-dispatch-ui/src/**/*.test.ts(x) (3 files)]
         └─ Depends on: —
         └─ Output:
[x] T-40 [VERIFY] npm run check-ts clean BEFORE schema migration
         └─ Files: []
         └─ Depends on: T-39
         └─ Output:

---

## US-15: Phase 2 schema migration
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo | Depends on: US-14_

must_haves:
  truths:
    - "schema.prisma Load model has zero output cache columns (10 dropped)"
    - "InvoiceReadiness enum dropped if no other model references it (verify first)"
    - "Migration applies cleanly via prisma migrate dev"
    - "Prisma client regenerates; npm run check-ts has zero residual errors after regen"
  artifacts:
    - path: hussle-app-dispatch-api/prisma/migrations/*_drop_load_financial_caches/migration.sql
      provides: "DROP COLUMN + optional DROP TYPE statements"
  key_links:
    - from: schema.prisma Load model
      to: migration.sql
      via: "prisma migrate dev generation"

**Tasks:**
[x] T-41 [DB] Drop 10 Load output cache columns; drop InvoiceReadiness enum if unreferenced (verify); apply via prisma migrate dev
         └─ Files: [hussle-app-dispatch-api/prisma/schema.prisma, hussle-app-dispatch-api/prisma/migrations/*_drop_load_financial_caches/migration.sql]
         └─ Depends on: —
         └─ Output:
[x] T-42 [API] Regenerate Prisma client; resolve type errors
         └─ Files: [hussle-app-dispatch-api/src/**/*.ts (residual errors)]
         └─ Depends on: T-41
         └─ Output:

---

## US-16: Phase 2 live verification
_Priority: P0 | Read-only | Agent: review | Status: todo | Depends on: US-15_

must_haves:
  truths:
    - "npm run validate + UI npm test + check-ts all pass against baselines"
    - "Drift-elimination proof part 1: change carrier-level dispatchFeePercent → load detail UNCHANGED (per-load snapshot intact)"
    - "Drift-elimination proof part 2: edit load's dispatchFeeAmount via DispatchTermsEditor → load.dispatchFee in next response reflects new value"
    - "Invoice totals for the load UNCHANGED across both edits (Invoice snapshots independent)"
    - "Settlement immutability negative test: editing terms on a load whose settlement is PAID does NOT mutate the PAID settlement totals"
  artifacts:
    - path: /tmp/build-phase2-validation.log
      provides: "Captured validate + test output"
  key_links:
    - from: Carrier mutation
      to: Load financial outputs
      via: "MUST NOT propagate (per-load snapshot insulates)"

**Tasks:**
[x] T-43 [VERIFY] npm run validate + UI npm test + check-ts — capture to /tmp/
         └─ Files: []
         └─ Depends on: —
         └─ Output:
[x] T-44 [VERIFY] Live Playwright: carrier-level dispatchFeePercent change → load unchanged; DispatchTermsEditor edit → load.dispatchFee updates; invoice totals unchanged across both
         └─ Files: []
         └─ Depends on: T-43
         └─ Output:
[x] T-45 [VERIFY] Settlement immutability negative test on PAID settlement
         └─ Files: []
         └─ Depends on: T-43
         └─ Output:

---

# Auto-generated integration + verification stories

## INT-01: Carrier compliance API ↔ UI contract check
_Auto-generated | Services: dispatch-api, dispatch-ui | Status: todo | Depends on: US-03, US-06_

**Verification Checklist:**
- [ ] API responses for GET /carriers, GET /carriers/:id, onboarding-related endpoints expose `insuranceCertOnFile, insuranceExpiry, w9OnFile, carrierPacketOnFile, dispatchAgreementOnFile, signedAgreementId, dispatchAgreementSignedAt` as computed values (NOT from dropped columns)
- [ ] UI types for Carrier and CarrierOnboarding still declare those fields with identical types as before
- [ ] No UI code writes those fields back to the API (they are read-only computed properties)
- [ ] Warning state (`EXPIRED` / `7_DAY` / `30_DAY`) surfaces through response into UI displays correctly

**Tasks:**
[x] T-46 [WIRE] Verify carrier compliance contract — API computes, UI displays, field names match
         └─ Files: [hussle-app-dispatch-api/src/carriers/controllers/transformers/*.ts, hussle-app-dispatch-ui/src/features/carrier/types.ts, hussle-app-dispatch-ui/src/features/carrier/onboardingTypes.ts]
         └─ Agent: review
         └─ Depends on: US-03, US-06
         └─ Output:

---

## INT-02: Load financials API ↔ UI contract check
_Auto-generated | Services: dispatch-api, dispatch-ui | Status: todo | Depends on: US-12, US-15_

**Verification Checklist:**
- [ ] API responses for GET /loads, GET /loads/:id, weeklyGross, vehicleWeeklyRevenue endpoints expose 10 financial fields as computed values
- [ ] PATCH /loads/:id/dispatch-terms request shape matches UI form payload (9 fields)
- [ ] Enum values for dispatchFeeType (DispatchFeeType: PERCENTAGE/FLAT) and dispatcherCommissionType (DispatcherCommType) match character-for-character in UI types
- [ ] DispatchFeeType + DispatcherCommType enums exposed in UI types or via shared types module
- [ ] Auth: PATCH /loads/:id/dispatch-terms enforces correct roles (dispatcher/admin)
- [ ] Audit event fired matches the format consumed by audit subscriber

**Tasks:**
[x] T-47 [WIRE] Verify load financials contract — API computes, UI consumes, PATCH endpoint shapes match
         └─ Files: [hussle-app-dispatch-api/src/loads/controllers/transformers/*.ts, hussle-app-dispatch-api/src/loads/validators/dispatchTermsValidator.ts, hussle-app-dispatch-ui/src/features/load/components/DispatchTermsEditor/dispatchTermsSchema.ts, hussle-app-dispatch-ui/src/utils/api/loads/index.ts]
         └─ Agent: review
         └─ Depends on: US-12, US-15
         └─ Output:

---

## VER-01: End-to-end derived-values verification
_Auto-generated | Read-only | Agent: review | Status: todo | Depends on: US-07, US-16, INT-01, INT-02_

**Tasks:**
[x] T-48 [VERIFY] Trace complete drift-elimination outcome
         └─ Detail: For each truth in every story's must_haves block, verify it holds against the
            actual codebase. Confirm: (1) zero Carrier compliance columns remain in schema; (2) zero Load
            output cache columns remain; (3) all readers go through compute functions; (4) all writers
            for dropped columns are deleted; (5) admin override checkboxes gone from UI; (6) audit fires
            on PATCH /loads/:id/dispatch-terms; (7) drift-elimination proofs from US-07 + US-16 hold.
         └─ Files: []
         └─ Agent: review
         └─ Depends on: US-07, US-16, INT-01, INT-02
         └─ Output:

---

## Summary

| Phase | Story | Tasks | Done | AC Met |
|-------|-------|-------|------|--------|
| 1 | US-01 Build compliance utilities | 3 | 0 | 0/7 |
| 1 | US-02 Swap compliance readers | 3 | 0 | 0/4 |
| 1 | US-03 UI form cleanup | 4 | 0 | 0/4 |
| 1 | US-04 Writer deletions | 3 | 0 | 0/4 |
| 1 | US-05 Test fixture audit | 3 | 0 | 0/4 |
| 1 | US-06 Schema migration | 3 | 0 | 0/4 |
| 1 | US-07 Live verification | 3 | 0 | 0/4 |
| **Phase 1 total** | | **22** | **0** | |
| 2 | US-08 invoiceReadinessSub investigation | 1 | 0 | 0/2 |
| 2 | US-09 Schema additions + snapshot capture | 3 | 0 | 0/5 |
| 2 | US-10 Refactor calculateLoadFinancials | 3 | 0 | 0/8 |
| 2 | US-11 Swap financial readers | 3 | 0 | 0/4 |
| 2 | US-12 DispatchTermsEditor UI + API | 3 | 0 | 0/4 |
| 2 | US-13 Writer deletions | 3 | 0 | 0/5 |
| 2 | US-14 Test fixture audit | 2 | 0 | 0/2 |
| 2 | US-15 Schema migration | 2 | 0 | 0/4 |
| 2 | US-16 Live verification | 3 | 0 | 0/5 |
| **Phase 2 total** | | **23** | **0** | |
| Auto | INT-01 Carrier API↔UI | 1 | 0 | — |
| Auto | INT-02 Load API↔UI | 1 | 0 | — |
| Auto | VER-01 End-to-end | 1 | 0 | — |
| **Auto total** | | **3** | **0** | |
| **All** | | **48** | **0** | **0/70** |
