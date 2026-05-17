# carrier-portal-v2 Tasks
_Last updated: 2026-05-17 02:40_
_Plan: .planning/carrier-portal-v2/plan.md_
_Delta: .planning/carrier-portal-v2/PLAN-DELTA.md_
_Patterns: .planning/carrier-portal-v2/PATTERNS.md_
_File matrix: .planning/carrier-portal-v2/file-matrix.md_

---

## US-01: Prisma migrations — session step ids + Carrier column promotions + lane prefs + drop compliance flags
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

must_haves:
  truths:
    - "`npx prisma migrate deploy` applies all 4 migrations cleanly against the dev DB."
    - "After backfill, every existing `OnboardingSession` row has `currentStepId` populated and `completedStepIds` contains the correct phase-derived ids."
    - "After backfill, `Carrier.legalName` is non-null for every row that had a non-null `Carrier.name`."
    - "`Carrier.w9OnFile` and `Carrier.carrierPacketOnFile` columns no longer exist in `\\d Carrier` output."
  artifacts:
    - path: hussle-app-dispatch-api/prisma/schema.prisma
      provides: "OnboardingSession + Carrier + Driver model changes for v2"
    - path: hussle-app-dispatch-api/prisma/migrations/<ts>_add_onboarding_step_ids_to_session/migration.sql
      provides: "currentStepId + completedStepIds + backfill"
    - path: hussle-app-dispatch-api/prisma/migrations/<ts>_promote_company_fields_to_carrier_columns/migration.sql
      provides: "legalName/dbaName/taxClassification/tin/tinType columns + legalName backfill from name"
    - path: hussle-app-dispatch-api/prisma/migrations/<ts>_add_lane_preference_columns/migration.sql
      provides: "Carrier fleet-default + Driver per-override columns"
    - path: hussle-app-dispatch-api/prisma/migrations/<ts>_drop_legacy_compliance_flags/migration.sql
      provides: "DROP COLUMN w9OnFile, carrierPacketOnFile"
  key_links:
    - from: prisma/schema.prisma
      to: migrations
      via: "schema.prisma model edits produced via prisma migrate dev with explicit migration names"

**Acceptance Criteria:**
- [ ] AC-10 partial: all 4 migrations land via `prisma migrate deploy`.
- [ ] AC-22 partial: `legalName` backfilled from existing `Carrier.name`.

**Tasks:**
[x] T-01 [DB] Edit schema.prisma: OnboardingSession + Carrier + Driver
         └─ Detail: In `hussle-app-dispatch-api/prisma/schema.prisma`:
            - `OnboardingSession` (line 1228): add `currentStepId String?` and `completedStepIds String[] @default([])`. Keep `currentPhase` + `currentQuestionIndex` for now.
            - `Carrier` (line 567): add `legalName String?`, `dbaName String?`, `taxClassification String?`, `tin String?`, `tinType String?`, `signatoryName String?`, `signatoryTitle String?`, `signedAgreementId String?`, `homeBaseCity String?`, `homeBaseState String?`, `preferredLanes Json?`, `weeklySchedule Json?`, `freightPreferences Json?`, `maxDaysOut Int?`. Remove `w9OnFile` and `carrierPacketOnFile`.
            - `Driver` (line 665): add `weeklySchedule Json?`, `freightPreferences Json?`. Confirm existing `preferredLanes Json?`, `maxDaysOut Int?`, `homeBaseCity/State String?` are present.
         └─ Files: [hussle-app-dispatch-api/prisma/schema.prisma]
         └─ Depends on: —
         └─ Output:

[x] T-02 [DB] Create migration AddOnboardingStepIdsToSession
         └─ Detail: Run `npx prisma migrate dev --create-only --name add_onboarding_step_ids_to_session`. Edit SQL: add `currentStepId TEXT NULL`, `completedStepIds TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`. Backfill: `UPDATE "OnboardingSession" SET "currentStepId" = CASE "currentPhase" WHEN 1 THEN 'welcome-segmentation' WHEN 2 THEN 'company-authority-question' WHEN 3 THEN 'equipment-entry' WHEN 4 THEN 'drivers-has-employees' WHEN 5 THEN 'cost-analysis' WHEN 6 THEN 'lane-preferences' WHEN 7 THEN 'documents-upload' WHEN 8 THEN 'complete' END WHERE "currentStepId" IS NULL`. For `completedStepIds` write inline mapping per phase rank.
         └─ Files: [hussle-app-dispatch-api/prisma/migrations/<ts>_add_onboarding_step_ids_to_session/migration.sql]
         └─ Depends on: T-01
         └─ Output:

[x] T-03 [DB] Create migration PromoteCompanyFieldsToCarrierColumns
         └─ Detail: `prisma migrate dev --create-only --name promote_company_fields_to_carrier_columns`. SQL adds 8 columns: `legalName, dbaName, taxClassification, tin, tinType, signatoryName, signatoryTitle, signedAgreementId` (all `TEXT NULL`). Backfill `UPDATE "Carrier" SET "legalName" = "name" WHERE "legalName" IS NULL AND "name" IS NOT NULL`. Leave the others NULL.
         └─ Files: [hussle-app-dispatch-api/prisma/migrations/<ts>_promote_company_fields_to_carrier_columns/migration.sql]
         └─ Depends on: T-01
         └─ Output:

[x] T-04 [DB] Create migration AddLanePreferenceColumns
         └─ Detail: `prisma migrate dev --create-only --name add_lane_preference_columns`. SQL adds Carrier fleet columns (`homeBaseCity/State`, `preferredLanes`/`weeklySchedule`/`freightPreferences` Jsonb, `maxDaysOut`) and Driver columns (`weeklySchedule`, `freightPreferences` Jsonb). No backfill — NULL = inherit.
         └─ Files: [hussle-app-dispatch-api/prisma/migrations/<ts>_add_lane_preference_columns/migration.sql]
         └─ Depends on: T-01
         └─ Output:

[x] T-05 [DB] Create migration DropLegacyComplianceFlags
         └─ Detail: `prisma migrate dev --create-only --name drop_legacy_compliance_flags`. SQL `ALTER TABLE "Carrier" DROP COLUMN "w9OnFile", DROP COLUMN "carrierPacketOnFile";`. Migration body includes a comment: "Readers migrated in US-10; this migration runs after reader migration in deployment order via filename timestamp."
         └─ Files: [hussle-app-dispatch-api/prisma/migrations/<ts>_drop_legacy_compliance_flags/migration.sql]
         └─ Depends on: T-01
         └─ Output:

[x] T-06 [TEST] Verify migrations apply + Prisma client typecheck
         └─ Detail: `npm --prefix hussle-app-dispatch-api run check-ts`. Run `npx prisma generate` then `npx prisma migrate deploy` against the local Postgres (redirect to `/tmp/build-us01-migrate.log`). Confirm `\\d "Carrier"` no longer lists `w9OnFile`.
         └─ Files: []
         └─ Depends on: T-02, T-03, T-04, T-05
         └─ Output:

---

## US-02: Reader migration `w9OnFile`/`carrierPacketOnFile` → `tin IS NOT NULL`
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01_

must_haves:
  truths:
    - "Grep for `w9OnFile|carrierPacketOnFile` in `hussle-app-dispatch-api/src/` returns zero hits outside the drop migration."
    - "`onboardingGate.checkCarrierOnboarding` blocks a carrier with `tin IS NULL` and passes a carrier with `tin` set."
    - "`portalDocumentsService.COMPLIANCE_FLAG_MAP` no longer references `CARRIER_PACKET`; `W9` entry is a no-op."
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/onboardingGate.ts
      provides: "Reads Carrier.tin IS NOT NULL instead of w9OnFile"
    - path: hussle-app-dispatch-api/src/carrier-portal/services/portalDocumentsService.ts
      provides: "COMPLIANCE_FLAG_MAP without CARRIER_PACKET; W9 no-op"
  key_links:
    - from: loadService
      to: Carrier.tin
      via: "compliance check uses tin presence instead of w9OnFile boolean"

**Acceptance Criteria:**
- [ ] AC-10 (CI grep clean)
- [ ] AC-21 (gate reads `Carrier.tin`)

**Tasks:**
[x] T-07 [API] Migrate all `w9OnFile` + `carrierPacketOnFile` readers
         └─ Detail: Replace every reader in: `src/shared/onboardingGate.ts`, `src/shared/__tests__/onboardingGate.test.ts`, `src/loads/types/loadTypes.ts`, `src/loads/repositories/loadRepositoryPrisma.ts`, `src/loads/services/loadService.ts` and its test files, `src/loads/__tests__/loadStatusService.test.ts`, `src/settlements/services/__tests__/settlementService.test.ts`, `src/carrier-portal/__tests__/onboardingSessionComplete.test.ts`, `src/carrier-portal/services/portalDocumentsService.ts`, `src/carrier-portal/services/onboardingSessionService.ts`, `src/carriers/types/suspendTypes.ts`, `src/carriers/types/carrierTypes.ts`, `src/carriers/jobs/documentCheckJob.ts` and its test, `src/carriers/compositionRoot.ts`, `src/carriers/validators/carrierValidators.ts`, `src/carriers/__tests__/dispatchOverride.test.ts`. Strategy: where the gate logic checked `carrier.w9OnFile`, swap to `carrier.tin != null`. In `portalDocumentsService.COMPLIANCE_FLAG_MAP`, keep `W9` as a no-op (return early), drop `CARRIER_PACKET` entry entirely. Update tests in lockstep (rename `w9OnFile: true` fixtures to `tin: 'XX-XXXXXXX'`).
         └─ Files: [hussle-app-dispatch-api/src/shared/onboardingGate.ts, hussle-app-dispatch-api/src/shared/__tests__/onboardingGate.test.ts, hussle-app-dispatch-api/src/loads/types/loadTypes.ts, hussle-app-dispatch-api/src/loads/repositories/loadRepositoryPrisma.ts, hussle-app-dispatch-api/src/loads/services/loadService.ts, hussle-app-dispatch-api/src/loads/services/__tests__/loadService.test.ts, hussle-app-dispatch-api/src/loads/services/__tests__/calculateFinancials.test.ts, hussle-app-dispatch-api/src/loads/services/__tests__/financialRecalcSubscriber.test.ts, hussle-app-dispatch-api/src/loads/__tests__/loadStatusService.test.ts, hussle-app-dispatch-api/src/settlements/services/__tests__/settlementService.test.ts, hussle-app-dispatch-api/src/carrier-portal/__tests__/onboardingSessionComplete.test.ts, hussle-app-dispatch-api/src/carrier-portal/services/portalDocumentsService.ts, hussle-app-dispatch-api/src/carrier-portal/services/onboardingSessionService.ts, hussle-app-dispatch-api/src/carriers/types/suspendTypes.ts, hussle-app-dispatch-api/src/carriers/types/carrierTypes.ts, hussle-app-dispatch-api/src/carriers/jobs/documentCheckJob.ts, hussle-app-dispatch-api/src/carriers/jobs/__tests__/documentCheckJob.test.ts, hussle-app-dispatch-api/src/carriers/compositionRoot.ts, hussle-app-dispatch-api/src/carriers/validators/carrierValidators.ts, hussle-app-dispatch-api/src/carriers/__tests__/dispatchOverride.test.ts, hussle-app-dispatch-api/src/carriers/services/__tests__/carrierService.test.ts]
         └─ Depends on: US-01 (column drops must follow reader edits in chronological commit order — but the migration timestamp ensures it runs after this commit)
         └─ Output:

[x] T-08 [TEST] Verify suite passes after reader migration
         └─ Detail: `npm --prefix hussle-app-dispatch-api test` (redirect `/tmp/build-us02-test.log`). Then `grep -RIn "w9OnFile\\|carrierPacketOnFile" hussle-app-dispatch-api/src/` — expect zero hits.
         └─ Files: []
         └─ Depends on: T-07
         └─ Output:

---

## US-03: Carrier invite token hardening + cascade revocation
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

must_haves:
  truths:
    - "`carrierInviteTokenRepoPrisma.findByToken` returns null when the parent Organization has `deleted: true`."
    - "`carrierInviteTokenRepoPrisma.findByToken` returns null when the related Carrier has `deletedAt IS NOT NULL`."
    - "Soft-deleting an Organization triggers revocation (revokedAt set) on every related CarrierInviteToken row."
    - "Soft-deleting a Carrier triggers revocation via the existing `revokeByCarrierId` helper."
  artifacts:
    - path: hussle-app-dispatch-api/src/carrier-portal/repositories/carrierInviteTokenRepoPrisma.ts
      provides: "findByToken filters + new revokeByOrganizationId helper"
  key_links:
    - from: Organization soft-delete code path
      to: carrierInviteTokenRepo.revokeByOrganizationId
      via: "subscriber/middleware invokes the cascade helper"

**Acceptance Criteria:**
- [ ] AC-24 (token validation rejects deleted org/carrier; cascade fires)

**Tasks:**
[x] T-09 [API] Harden findByToken + add revokeByOrganizationId
         └─ Detail: Extend `findByToken` `where` with `organization: { is: { deleted: false } }` and `carrier: { is: { deletedAt: null } }`. Add `revokeByOrganizationId(organizationId: string)` helper that runs `updateMany({ where: { organizationId, revokedAt: null }, data: { revokedAt: new Date() } })`. Confirm port interface at `carrier-portal/types/carrierInviteTokenRepoPort.ts` (or wherever it lives) exposes the new method.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/repositories/carrierInviteTokenRepoPrisma.ts, hussle-app-dispatch-api/src/carrier-portal/types/carrierInviteTokenRepoPort.ts]
         └─ Depends on: —
         └─ Output:

[x] T-10 [API] Wire cascade on Organization soft-delete + Carrier soft-delete
         └─ Detail: Find Organization soft-delete site (likely in `src/organizations/services/` or wherever `Organization.update({ deleted: true })` happens). Inject `carrierInviteTokenRepo` into that service and call `revokeByOrganizationId` after the update. For Carrier soft-delete, find the existing pathway and add a `revokeByCarrierId` call if not already present.
         └─ Files: [hussle-app-dispatch-api/src/organizations/services/<file>.ts, hussle-app-dispatch-api/src/organizations/compositionRoot.ts, hussle-app-dispatch-api/src/carriers/services/<soft-delete-site>.ts, hussle-app-dispatch-api/src/carriers/compositionRoot.ts]
         └─ Depends on: T-09
         └─ Output:

[x] T-11 [TEST] Token validation + cascade tests
         └─ Detail: Add `carrierInviteTokenRepoPrisma.test.ts` (or extend existing): asserts (a) deleted org → null; (b) deleted carrier → null; (c) valid org+carrier → row returned. Add cascade tests for both pathways.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/repositories/__tests__/carrierInviteTokenRepoPrisma.test.ts]
         └─ Depends on: T-10
         └─ Output:

---

## US-04: portalCompanyService rewrite — column writes + name compute + server-side lock + shared LOCKS_FIELDS
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01_

must_haves:
  truths:
    - "Saving company answers writes to `Carrier.legalName`, `Carrier.dbaName`, `Carrier.taxClassification`, `Carrier.tin`, `Carrier.tinType`, `Carrier.signatoryName`, `Carrier.signatoryTitle`."
    - "On every write, `Carrier.name = dbaName ?? legalName`."
    - "When `Carrier.dispatchAgreementSignedAt IS NOT NULL`, POSTs that mutate any path in `LOCKS_FIELDS` return HTTP 422 `{ code: 'FIELD_LOCKED', field }`."
    - "Unit test asserts client and server import the same 8-path `LOCKS_FIELDS` constant."
  artifacts:
    - path: hussle-app-dispatch-api/src/carrier-portal/services/portalCompanyService.ts
      provides: "Rewritten service writing to columns + lock enforcement"
    - path: hussle-app-dispatch-api/src/carrier-portal/constants/locksFields.ts
      provides: "LOCKS_FIELDS constant (single source of truth, server side)"
  key_links:
    - from: portalCompanyService
      to: LOCKS_FIELDS
      via: "imports from constants/locksFields.ts; rejects matching paths when signed"

**Acceptance Criteria:**
- [ ] AC-7 server side (422 FIELD_LOCKED)
- [ ] AC-22 (Carrier.name = dbaName ?? legalName)

**Tasks:**
[x] T-12 [API] Add shared LOCKS_FIELDS constant
         └─ Detail: New file `hussle-app-dispatch-api/src/carrier-portal/constants/locksFields.ts` exporting `export const LOCKS_FIELDS = ['company.legalName','company.mcNumber','company.dotNumber','company.signatoryName','company.signatoryTitle','company.taxClassification','company.tinType','company.tin'] as const;`. Add a barrel re-export if convention requires.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/constants/locksFields.ts]
         └─ Depends on: —
         └─ Output:

[x] T-13 [API] Rewrite portalCompanyService
         └─ Detail: Update `portalCompanyService.ts` saveCompanyAnswers function:
            - Persist incoming `legalName, dbaName, taxClassification, tin, tinType, signatoryName, signatoryTitle` to the new Carrier columns.
            - Compute `name = dbaName?.trim() || legalName?.trim() || existing.name` and write to `Carrier.name`.
            - Before writing, fetch the Carrier; if `dispatchAgreementSignedAt IS NOT NULL`, iterate over incoming answer dot-paths and throw `new BadRequestError({ code: 'FIELD_LOCKED', field })` (or use ConflictError 422 via the existing typed error class) for any path in `LOCKS_FIELDS` that has changed. Confirm `BadRequestError` mapping; if no 422 typed class exists, use the existing `ValidationError` extended with `code: 'FIELD_LOCKED'`.
            - Keep existing answers-JSON merge as a fallback (`answers.company`).
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/portalCompanyService.ts]
         └─ Depends on: T-12
         └─ Output:

[x] T-14 [TEST] portalCompanyService tests
         └─ Detail: Extend or add `portalCompanyService.test.ts`: (a) dba+legal yields name=dba; (b) no dba yields name=legal; (c) toggling hasDba=false clears dbaName + recomputes name; (d) writing a locked field after dispatchAgreementSignedAt is set → throws with code='FIELD_LOCKED' and field name. Mock prisma + clock.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/__tests__/portalCompanyService.test.ts]
         └─ Depends on: T-13
         └─ Output:

---

## US-05: portalEquipmentService — upsert-by-id refactor
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

must_haves:
  truths:
    - "Saving the same equipment list twice keeps Vehicle.id values stable."
    - "Removing one row + editing one row + adding one row produces: removed gone, edited keeps id, added has fresh id."
    - "Response payload includes `id` for every row so the UI can round-trip."
  artifacts:
    - path: hussle-app-dispatch-api/src/carrier-portal/services/portalEquipmentService.ts
      provides: "Diff-based upsert replacing wipe-and-recreate"
  key_links:
    - from: portalEquipmentService.saveEquipment
    - to: Vehicle (prisma)
      via: "upsert by id when provided; create when absent; delete missing ids"

**Acceptance Criteria:**
- [ ] AC-17 partial (equipment side)

**Tasks:**
[x] T-15 [API] Refactor saveEquipment to upsert-by-id
         └─ Detail: In `portalEquipmentService.ts`: replace `deleteVehiclesByCarrierId` + create-from-scratch with diff. Compute three sets: `toUpdate` (incoming with id matching existing), `toCreate` (incoming without id), `toDelete` (existing ids missing from incoming). Run inside `prisma.$transaction`. Type input: extend `SaveEquipmentInput.vehicles[]` with optional `id`. Validator at `equipmentValidator.ts` accepts optional `id`. Return shape includes id per row.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/portalEquipmentService.ts, hussle-app-dispatch-api/src/carrier-portal/types/equipmentTypes.ts, hussle-app-dispatch-api/src/carrier-portal/validators/equipmentValidator.ts]
         └─ Depends on: —
         └─ Output:

[x] T-16 [TEST] Equipment upsert matrix test
         └─ Detail: Test `portalEquipmentService.test.ts`: matrix (edit/add/remove/unchanged). Assert unchanged row keeps id; edited row keeps id; removed id is gone; added row has fresh id.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/__tests__/portalEquipmentService.test.ts]
         └─ Depends on: T-15
         └─ Output:

---

## US-06: portalDriversService — upsert-by-id refactor
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

must_haves:
  truths:
    - "Driver.id values are stable across re-saves of the same drivers list."
    - "Add/edit/remove matrix behaves identically to US-05 for Drivers."

**Acceptance Criteria:**
- [ ] AC-17 partial (drivers side)

**Tasks:**
[x] T-17 [API] Refactor saveDrivers to upsert-by-id
         └─ Detail: Same shape change as Equipment. `SaveDriversInput.drivers[]` gains optional `id`. Diff + transaction; response carries id. Update validator.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/portalDriversService.ts, hussle-app-dispatch-api/src/carrier-portal/types/driversTypes.ts, hussle-app-dispatch-api/src/carrier-portal/validators/driversValidator.ts]
         └─ Depends on: —
         └─ Output:

[x] T-18 [TEST] Drivers upsert matrix test
         └─ Detail: Mirror equipment matrix test.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/__tests__/portalDriversService.test.ts]
         └─ Depends on: T-17
         └─ Output:

---

## US-07: stepId-keyed submit-step endpoint + locked-field rejection
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01, US-04_

must_haves:
  truths:
    - "POST `/api/v1/carrier-portal/session/submit-step` accepts `{ stepId, answers }` and persists answers under `session.answers[stepId]`."
    - "Response advances `currentStepId` and appends to `completedStepIds`."
    - "Mutations to any LOCKS_FIELDS path while `Carrier.dispatchAgreementSignedAt` is set return HTTP 422 `{ code: 'FIELD_LOCKED', field }`."
    - "`GET /session` response includes `currentStepId`, `completedStepIds`, `agreement: { id, status, embedUrl, signedFieldsLocked }`, and `invitation.organizationName`."
  artifacts:
    - path: hussle-app-dispatch-api/src/carrier-portal/services/onboardingSessionService.ts
      provides: "submitStep + getSession response shape"
    - path: hussle-app-dispatch-api/src/carrier-portal/controllers/onboardingSessionController.ts
      provides: "submit-step controller"
    - path: hussle-app-dispatch-api/src/carrier-portal/routes/index.ts
      provides: "POST /session/submit-step route"
  key_links:
    - from: onboardingSessionController.submitStep
      to: portalCompanyService.LOCKS_FIELDS enforcement
      via: "service-layer reject before write"

**Acceptance Criteria:**
- [ ] AC-7 server side (covered by US-04 + this story's endpoint exposure)
- [ ] Session response carries new fields

**Tasks:**
[x] T-19 [API] Add submit-step service action + controller + route
         └─ Detail: New service action `submitStep({ sessionId, stepId, answers })` in `onboardingSessionService.ts`. Persist `session.answers[stepId] = answers`; recompute `currentStepId` (advance by inspecting completed phases — start with a server-side phase-of-step lookup; engine-side advance lives in UI). Append `stepId` to `completedStepIds`. Reject locked-field mutations by inspecting `answers` against `LOCKS_FIELDS`. Add controller method + route POST `/session/submit-step` in `routes/index.ts`. Old phase-keyed endpoints continue to work — leave untouched.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/onboardingSessionService.ts, hussle-app-dispatch-api/src/carrier-portal/controllers/onboardingSessionController.ts, hussle-app-dispatch-api/src/carrier-portal/routes/index.ts, hussle-app-dispatch-api/src/carrier-portal/validators/sessionValidators.ts]
         └─ Depends on: US-04 T-12
         └─ Output:

[x] T-20 [API] Extend GET /session response
         └─ Detail: `getSessionResponse` includes: `currentStepId`, `completedStepIds`, `agreement` snapshot (most-recent DISPATCH_AGREEMENT — null when none), `invitation: { email, phone, organizationName }` resolved from `CarrierInviteToken.organizationId → Organization.name`. The `agreement.signedFieldsLocked` derives from `Carrier.dispatchAgreementSignedAt`.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/onboardingSessionService.ts, hussle-app-dispatch-api/src/carrier-portal/controllers/onboardingSessionController.ts, hussle-app-dispatch-api/src/carrier-portal/types/sessionTypes.ts]
         └─ Depends on: T-19
         └─ Output:

[x] T-21 [TEST] submit-step + getSession tests
         └─ Detail: Test happy path advance, locked-field rejection (422), organizationName resolution, and signedFieldsLocked flag.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/__tests__/onboardingSessionService.test.ts]
         └─ Depends on: T-20
         └─ Output:

---

## US-08: portalCostAnalysisService — hybrid storage rewrite
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01, US-05_

must_haves:
  truths:
    - "Saving cost analysis writes per-asset `loanPayment`, `ownership`, `insuranceMonthlyCost` to each Vehicle row keyed by `equipmentPayments[].assetId`."
    - "`OnboardingSession.answers.costAnalysis` contains policies[], subscriptions[], overhead, ownerPay, fuel, wearOps, operating."
    - "`Carrier.minimumRatePerMile` is set on save."
    - "Save runs in a single Prisma transaction; failure of any sub-write leaves the session in a recoverable state (no partial Vehicle updates)."

**Acceptance Criteria:**
- [ ] AC-18

**Tasks:**
[x] T-22 [API] Rewrite saveCostAnalysis with hybrid storage + transaction
         └─ Detail: Restructure request body shape per plan. Service uses `prisma.$transaction([ ...vehicleUpdates, sessionUpdate, carrierUpdate ])`. Read Vehicle ids from `equipmentPayments[].assetId`. Write `loanPayment`/`ownership`/`insuranceMonthlyCost`. Update `OnboardingSession.answers.costAnalysis` (merge under that key). Update `Carrier.minimumRatePerMile`. Break-even CPM is **not** persisted.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/portalCostAnalysisService.ts, hussle-app-dispatch-api/src/carrier-portal/types/costAnalysisTypes.ts, hussle-app-dispatch-api/src/carrier-portal/validators/costAnalysisValidator.ts]
         └─ Depends on: US-05 T-15
         └─ Output:

[x] T-23 [TEST] Cost analysis transactional save test
         └─ Detail: Assert column writes, answers merge, minRate write. Simulate one Vehicle update failure (e.g. id not found) and assert rollback (no partial state).
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/__tests__/portalCostAnalysisService.test.ts]
         └─ Depends on: T-22
         └─ Output:

---

## US-09: portalLanePreferencesService — hybrid storage rewrite
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01, US-06_

must_haves:
  truths:
    - "Fleet defaults write to `Carrier.preferredLanes`, `Carrier.weeklySchedule`, `Carrier.homeBaseCity/State`, `Carrier.freightPreferences`, `Carrier.maxDaysOut`."
    - "Per-driver overrides write to corresponding `Driver` columns keyed by driverId."
    - "Sections not in overrides remain NULL on Driver (inherit fleet)."
    - "Everything mirrored in `answers.lanePreferences` JSON during transition."

**Acceptance Criteria:**
- [ ] AC-19

**Tasks:**
[x] T-24 [API] Rewrite saveLanePreferences with hybrid storage
         └─ Detail: Request body per Delta 2 shape (`fleet` + `overrides: Record<driverId, Partial<FleetLanePreferences>>`). Write fleet keys to Carrier; for each driver in overrides, write the matching Driver columns. Mirror everything in `answers.lanePreferences`. All in one `$transaction`.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/portalLanePreferencesService.ts, hussle-app-dispatch-api/src/carrier-portal/types/lanePreferencesTypes.ts, hussle-app-dispatch-api/src/carrier-portal/validators/lanePreferencesValidator.ts]
         └─ Depends on: US-06 T-17
         └─ Output:

[x] T-25 [TEST] Lane preferences fleet vs override split test
         └─ Detail: Assert Carrier columns hold fleet; one driver has overrides; other drivers have NULL on overridden sections.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/services/__tests__/portalLanePreferencesService.test.ts]
         └─ Depends on: T-24
         └─ Output:

---

## US-10: GET /agreements query extension + signedAgreementId projection
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

must_haves:
  truths:
    - "`GET /api/v1/agreements?carrierId=&templateKey=DISPATCH_AGREEMENT` returns the most recent matching agreement, or `null`."
    - "Endpoint auths via dispatcher session OR carrier invite token."
    - "`agreement.signed` event handler writes `signedAgreementId` to the Carrier row."

**Acceptance Criteria:**
- [ ] AC-11

**Tasks:**
[x] T-26 [API] Extend GET /agreements with portal query
         └─ Detail: In `src/agreements/routes/`, add handling for `?carrierId=&templateKey=` — most recent agreement (`orderBy: { createdAt: desc }`, `take: 1`). Authorize via `sessionOrApiKeyAuth` extended to also accept the invite-token middleware (re-use `requireAuthOrInviteToken` if it exists). Update controller/query and tests.
         └─ Files: [hussle-app-dispatch-api/src/agreements/routes/agreementRoutes.ts, hussle-app-dispatch-api/src/agreements/controllers/agreementController.ts, hussle-app-dispatch-api/src/agreements/queries/agreementQueries.ts, hussle-app-dispatch-api/src/agreements/validators/agreementValidators.ts]
         └─ Depends on: —
         └─ Output:

[x] T-27 [API] Extend agreementSignedSubscriber to write signedAgreementId
         └─ Detail: In existing `agreementSignedSubscriber`, on signed event, write `Carrier.signedAgreementId = agreement.id` (and `dispatchAgreementSignedAt = now` if not already set). Idempotent: skip if already set.
         └─ Files: [hussle-app-dispatch-api/src/agreements/subscribers/agreementSignedSubscriber.ts, hussle-app-dispatch-api/src/agreements/subscribers/__tests__/agreementSignedSubscriber.test.ts]
         └─ Depends on: —
         └─ Output:

---

## US-11: APP_NAME constant + PDF template sweep
_Priority: P1 | Services: dispatch-api | Agent: backend | Status: done_

must_haves:
  truths:
    - "Grep for hardcoded `\"FleetCommand\"` under `hussle-app-dispatch-api/src/` returns zero hits."
    - "`InvoicePdfTemplate` + `SettlementPdfTemplate` read brand name from a shared constant."

**Tasks:**
[x] T-28 [API] Add APP_NAME constant + replace hardcodes
         └─ Detail: New file `src/shared/constants/app.ts` exporting `export const APP_NAME = process.env.APP_NAME ?? 'FleetCommand';`. Replace hardcoded `"FleetCommand"` in `src/invoices/templates/InvoicePdfTemplate.tsx` and `src/settlements/templates/SettlementPdfTemplate.tsx` with `APP_NAME` import.
         └─ Files: [hussle-app-dispatch-api/src/shared/constants/app.ts, hussle-app-dispatch-api/src/invoices/templates/InvoicePdfTemplate.tsx, hussle-app-dispatch-api/src/settlements/templates/SettlementPdfTemplate.tsx]
         └─ Depends on: —
         └─ Output:

---

## US-12: Engine module — types + 6 pure functions + dependency-cruiser rule
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: in-progress_

must_haves:
  truths:
    - "`evaluatePredicate` supports `eq`, `in`, `and`, `or`, `not` operators against dot-paths."
    - "`resolveContext` resolves answers / fmcsa / invitation / agreement dot-paths; undefined-safe."
    - "`getVisibleSteps`, `getNextStepId`, `getPrevStepId` walk the flattened phase × step list respecting visibility predicates."
    - "`computeInvalidations` throws `LockViolationError` from `engine/errors.ts` when a locked field is touched."
    - "`dependency-cruiser` rule `no-impure-engine-imports` rejects any import from outside `engine/` (except `engine/types.ts`)."
    - "Engine unit tests achieve 100% line coverage."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/types.ts
      provides: "Schema/Phase/Step/Question/Predicate/Session types + StepType union + LOCKS_FIELDS shared constant"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/evaluatePredicate.ts
      provides: "Predicate evaluator"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/resolveContext.ts
      provides: "Dot-path resolver"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/getVisibleSteps.ts
      provides: "Visible-step flattening"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/getNextStepId.ts
      provides: "Forward walk"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/getPrevStepId.ts
      provides: "Backward walk"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/computeInvalidations.ts
      provides: "Invalidation + lock-violation logic"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/errors.ts
      provides: "LockViolationError class"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/__tests__/engine.test.ts
      provides: "100% coverage unit tests"
    - path: hussle-app-dispatch-ui/.dependency-cruiser.cjs
      provides: "no-impure-engine-imports rule"
  key_links:
    - from: engine/*.ts
      to: engine/types.ts
      via: "imports only types.ts within engine; enforced by dependency-cruiser"

**Acceptance Criteria:**
- [ ] AC-3 (engine 100% coverage)
- [ ] AC-4 (dependency-cruiser rule enforces purity)

**Tasks:**
[x] T-29 [UI] Engine types + LOCKS_FIELDS shared constant
         └─ Detail: Write `engine/types.ts` matching plan §"Engine types". Re-export `LOCKS_FIELDS` from a path the server-side equivalent imports (the constant itself lives in a non-engine path like `features/carrier-portal-v2/schema/locksFields.ts` since servers can't import engine — duplicate the literal and add a CI grep test). Define `Predicate` discriminated union by `op` for type-safety.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/types.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/errors.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/locksFields.ts]
         └─ Depends on: —
         └─ Output:

[x] T-30 [UI] Implement evaluatePredicate + resolveContext
         └─ Detail: Port from prototype `docs/onboarding-example-tech-spec/CarrierOnboardingPrototype.jsx:221-246`. `resolveContext(session, dotPath)` resolves `answers.<stepId>.<questionId>`, `fmcsa.<field>`, `invitation.<field>`, `agreement.<field>`. `evaluatePredicate(predicate, session)` recursively walks composite operators.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/resolveContext.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/evaluatePredicate.ts]
         └─ Depends on: T-29
         └─ Output:

[x] T-31 [UI] Implement getVisibleSteps / getNextStepId / getPrevStepId / computeInvalidations
         └─ Detail: Port the three traversal functions. `computeInvalidations(schema, session, trialAnswers)` returns ids of completed steps that flip to hidden under the trial state; for each invalidated step, if its `questions[]` overlap with `LOCKS_FIELDS` and the agreement is signed, throw `LockViolationError`.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/getVisibleSteps.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/getNextStepId.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/getPrevStepId.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/computeInvalidations.ts]
         └─ Depends on: T-30
         └─ Output:

[x] T-32 [UI] Engine unit tests (100% coverage)
         └─ Detail: `__tests__/engine.test.ts` covering every operator, every context source, every traversal branch, computeInvalidations both throw-and-return paths.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/engine/__tests__/engine.test.ts]
         └─ Depends on: T-31
         └─ Output:

[x] T-33 [UI] Add dependency-cruiser rule `no-impure-engine-imports`
         └─ Detail: Confirm `.dependency-cruiser.cjs` exists in dispatch-ui; if not, scaffold it (devDep present per assumption A4 — verify; if missing, install). Add forbidden rule preventing `features/carrier-portal-v2/engine/**` imports from anything other than `features/carrier-portal-v2/engine/**` + `engine/types.ts` itself. Add `lint:deps` if missing to package.json.
         └─ Files: [hussle-app-dispatch-ui/.dependency-cruiser.cjs, hussle-app-dispatch-ui/package.json]
         └─ Depends on: T-31
         └─ Output:

---

## US-13: Schema module — 9 phase files + composer + LOCKS_FIELDS share
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-12_

must_haves:
  truths:
    - "Each of the 9 phases is declared in its own file under `schema/`, composed by `onboardingSchema.ts`."
    - "Engine `getVisibleSteps(onboardingSchema, emptySession)` traverses without errors and returns the expected first step (`welcome-segmentation`)."
    - "`signingPhase.ts` exports the 8-path `locksFields` list."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/onboardingSchema.ts
      provides: "Schema composer"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/welcomePhase.ts
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/companyPhase.ts
      provides: "MC-authority gating + No-path progressive disclosure form"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/equipmentPhase.ts
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/driversPhase.ts
      provides: "hasEmployeeDrivers gate"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/costAnalysisPhase.ts
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/lanePreferencesPhase.ts
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/signingPhase.ts
      provides: "locksFields + DISPATCH_AGREEMENT template"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/documentsPhase.ts
      provides: "COI-only document list"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/completePhase.ts
  key_links:
    - from: onboardingSchema
    - to: phase files
      via: "imports + spreads into Schema.phases array"

**Acceptance Criteria:**
- [x] AC-5 (9 phases declared, composer traverses)

**Tasks:**
[x] T-34 [UI] Author 9 phase files + composer
         └─ Detail: One file per phase. Question content reused from existing `features/carrier-portal/questions/*Questions.ts` where applicable. Encode predicates per plan: `companyPhase` has `company-authority-question` with MC-Yes path (mc-entry → company-fmcsa-verification → company-confirm) and No-path (business-details form via disclosure → equipment). `driversPhase` has `drivers-has-employees` gate. `signingPhase` exports `locksFields` (8 dot-paths) + step `type: 'signing'` + `template: 'dispatch_v1'`. `documentsPhase` lists one doc (`{ id: 'coi', label: 'Certificate of Insurance', required: true }`). `onboardingSchema.ts` composes all 9 with `version: 1`, `metadata: { name: 'carrier-onboarding-v2', estimatedMinutes: 15 }`.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/onboardingSchema.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/welcomePhase.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/companyPhase.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/equipmentPhase.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/driversPhase.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/costAnalysisPhase.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/lanePreferencesPhase.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/signingPhase.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/documentsPhase.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/completePhase.ts]
         └─ Depends on: US-12 T-29
         └─ Output:

[x] T-35 [TEST] Schema composer smoke test
         └─ Detail: Test asserts `onboardingSchema.phases.length === 9`, `getVisibleSteps(onboardingSchema, emptySession).length > 0`, first step id is `welcome-segmentation`, `signingPhase.locksFields.length === 8`.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/schema/__tests__/onboardingSchema.test.ts]
         └─ Depends on: T-34
         └─ Output:

---

## US-14: Bug-fix components — AddressTypeaheadField + TinField
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

must_haves:
  truths:
    - "AddressTypeaheadField surfaces AWS Location errors visibly with a Retry button; after 3 consecutive failures or click of 'Skip lookup', renders manual-entry fields (line1/line2/city/state/zip/country)."
    - "TinField accepts EIN (`XX-XXXXXXX`) and SSN (`XXX-XX-XXXX`); normalizes on blur; validates at field level via Yup fragment."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/AddressTypeaheadField/index.tsx
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/TinField/index.tsx

**Acceptance Criteria:**
- [ ] AC-8 (typeahead degraded mode)
- [ ] AC-9 (TIN field accepts EIN+SSN)

**Tasks:**
[x] T-36 [UI] AddressTypeaheadField
         └─ Detail: Extend the existing typeahead at `hussle-app-dispatch-ui/src/components/AddressTypeahead/` pattern. Visible inline error + Retry button on API failure. Failure counter; at 3 failures or explicit "Skip lookup", swap to manual-entry mode (line1/line2/city/state/zip/country plain inputs). Error logged via `enqueueSnackbar` deduped by session (use a `useRef` flag).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/AddressTypeaheadField/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/AddressTypeaheadField/index.test.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-37 [UI] TinField
         └─ Detail: New field at `components/TinField/`. Strips non-digits on blur; reinserts hyphens by length (9 digits → `XX-XXXXXXX`; if user toggled "individual" → `XXX-XX-XXXX`). Yup fragment: `Yup.string().matches(/^(\\d{2}-\\d{7}|\\d{3}-\\d{2}-\\d{4})$/, 'Must be EIN or SSN format')`. Exposes `tinType` derived from format.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/TinField/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/TinField/index.test.tsx]
         └─ Depends on: —
         └─ Output:

---

## US-15: Redux slice + sagas + selectors for carrier-portal-v2
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-12, US-13_

must_haves:
  truths:
    - "`carrierPortalSlice` exposes `session`, `loading` map, `errors`, `lastSavedAt`."
    - "`loadSessionSaga`, `submitStepSaga`, `fetchAgreementSaga`, `uploadDocumentSaga`, `saveCostAnalysisSaga`, `saveLanePreferencesSaga`, `saveAndExitSaga` exist and dispatch enqueueSnackbar on failure."
    - "Selector `selectCurrentStep(state) → Step | null` resolves `currentStepId` through the schema."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/reducers/carrierPortalSlice.ts
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/sagas/index.ts
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/selectors/carrierPortalSelectors.ts
  key_links:
    - from: submitStepSaga
    - to: api.carrierPortal.submitStep
      via: "axios POST /api/v1/carrier-portal/session/submit-step"

**Tasks:**
[x] T-38 [UI] Page slice
         └─ Detail: Use `createCrudSlice` pattern from existing `features/carrier-portal/store/slices/carrierPortalSlice.ts` as template. State: `{ session: Session | null, loading: Record<string, LoadingState>, errors: Record<string, string>, lastSavedAt: string | null }`. Actions: `loadSession`, `loadSessionSuccess`, `submitStep`, `submitStepSuccess`, `fetchAgreement`, `fetchAgreementSuccess`, `uploadDocument`, `saveAndExit`, `setLastSavedAt`, etc.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/reducers/carrierPortalSlice.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/reducers/index.ts]
         └─ Depends on: US-13 T-34
         └─ Output:

[x] T-39 [UI] Sagas (one per operation)
         └─ Detail: `loadSessionSaga`, `submitStepSaga`, `fetchAgreementSaga`, `uploadDocumentSaga`, `saveCostAnalysisSaga`, `saveLanePreferencesSaga`, `saveAndExitSaga`. Each `takeLatest`; try/catch dispatches success or failure + `enqueueSnackbar` on error. Use axios client `utils/axios.ts` and API helpers under `utils/api/carrierPortal/`.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/sagas/index.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/sagas/loadSessionSaga.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/sagas/submitStepSaga.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/sagas/fetchAgreementSaga.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/sagas/uploadDocumentSaga.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/sagas/saveCostAnalysisSaga.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/sagas/saveLanePreferencesSaga.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/sagas/saveAndExitSaga.ts, hussle-app-dispatch-ui/src/utils/api/carrierPortal/v2.ts]
         └─ Depends on: T-38
         └─ Output:

[x] T-40 [UI] Selectors + wire into root saga + root reducer
         └─ Detail: `selectSession`, `selectCurrentStep` (resolves via schema), `selectIsLocked` (`agreement.signedFieldsLocked === true`), `selectLoading(key)`, `selectError(key)`, `selectLastSavedAt`. Register the page slice in `store/reducers/index.ts` under `pages.carrierPortalV2`. Register the root saga.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/selectors/carrierPortalSelectors.ts, hussle-app-dispatch-ui/src/store/reducers/index.ts, hussle-app-dispatch-ui/src/store/sagas/rootsaga.ts]
         └─ Depends on: T-39
         └─ Output:

[x] T-41 [TEST] Saga tests via redux-saga-test-plan
         └─ Detail: Cover happy + error path for submitStepSaga, fetchAgreementSaga, saveCostAnalysisSaga (transaction failure), saveLanePreferencesSaga.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/store/sagas/__tests__/sagas.test.ts]
         └─ Depends on: T-40
         └─ Output:

---

## US-16: SegmentationStep finalization (welcome eyebrow)
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-13, US-15_

must_haves:
  truths:
    - "When `session.invitation.organizationName` is non-null, eyebrow renders `Invited by {Organization.name}`; otherwise `Invited to {config.appName}`."
    - "Submitting the segmentation choice dispatches `submitStep` with `{ stepId: 'welcome-segmentation', answers: { carrier_type } }`."

**Acceptance Criteria:**
- [x] AC-23 (welcome eyebrow resolution)

**Tasks:**
[x] T-42 [UI] Finalize SegmentationStep
         └─ Detail: Build on existing preview at `components/steps/SegmentationStep`. Wire to redux: read `session.invitation.organizationName`; read `config.appName` from `src/config.ts`. Submit dispatches `submitStep` action. Card-grid via `SelectionCardGrid` with three options (owner-operator / small-fleet / dispatcher-carrier).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/SegmentationStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/SegmentationStep/index.test.tsx]
         └─ Depends on: US-15 T-40
         └─ Output:

---

## US-17: InputStep — generic Formik+Yup step renderer
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-13, US-15, US-14_

must_haves:
  truths:
    - "Renders each `step.questions[]` via the right `@mocho/ui/components/form-fields` component by `fieldType`."
    - "Builds Yup schema from question definitions inside the renderer (no buildPhaseSchema reuse)."
    - "Supports `prefillFrom` bindings via `resolveContext`."
    - "Wraps any locked field in `<LockableField />` when its dot-path matches `LOCKS_FIELDS` and the session is locked."

**Acceptance Criteria:**
- [x] AC-7 UI side (locked-field rendering covered here)

**Tasks:**
[x] T-43 [UI] InputStep renderer
         └─ Detail: At `components/steps/InputStep/`. Build Yup schema by mapping `question.fieldType` → fragment (text/email/select/number/date/address/mc/tin). Use `TinField` for `fieldType: 'tin'`; use `AddressTypeaheadField` for `'address'`. Prefill via `resolveContext(session, question.prefillFrom)`. Locked-field wrapping: derive `isLocked` from selector; if step is in `companyPhase` and the question dot-path is in `LOCKS_FIELDS`, wrap in `LockableField`. Disclosure (RevealSection) for conditional sub-forms.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/InputStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/InputStep/buildYupFromQuestions.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/InputStep/index.test.tsx]
         └─ Depends on: US-14 T-37, US-15 T-40
         └─ Output:

---

## US-18: VerificationStep (FMCSA waiting + 3 degraded states)
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-15_

must_haves:
  truths:
    - "Renders 'Looking up your authority…' loading UI by default."
    - "Renders distinct UI for found / not-found / service-problem states."
    - "Found state auto-advances; not-found and service-problem expose primary CTA + a 'Skip and enter manually' fallback."

**Tasks:**
[x] T-44 [UI] VerificationStep renderer
         └─ Detail: At `components/steps/VerificationStep/`. Subscribes to `session.fmcsaSnapshot` via selector. On mount, dispatch FMCSA lookup if not present. State machine: idle/loading → found | not-found | service-problem. Use `OnboardingCard` + `Callout` (amber for not-found, red for service-problem) + appropriate CTAs.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/VerificationStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/VerificationStep/index.test.tsx]
         └─ Depends on: US-15 T-40
         └─ Output:

---

## US-19: AgreementSigningStep + @docuseal/react integration
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-15, US-10_

> Known gap (deferred): portal cannot self-create agreement — `POST /api/v1/agreements` requires dispatcher org auth. Helper exists at `utils/api/agreements/index.ts` but is not wired. Follow-on: add `POST /carrier-portal/agreements` with invite-token auth.

must_haves:
  truths:
    - "On mount, fetches the carrier's DISPATCH_AGREEMENT via the extended `GET /api/v1/agreements`."
    - "No agreement → POSTs `/api/v1/agreements { carrierId, templateKey }` then renders `<DocusealForm src={embedUrl} onComplete={...} />`."
    - "PENDING → renders embed."
    - "SIGNED → auto-advances via `getNextStepId` without rendering the embed."
    - "`onComplete` dispatches navigation only; no API write."

**Acceptance Criteria:**
- [x] AC-6 (a/b/c/d)
- [x] AC-15 (`@docuseal/react` installed and pinned)

**Tasks:**
[x] T-45 [UI] Install + pin @docuseal/react
         └─ Detail: `cd hussle-app-dispatch-ui && npm install @docuseal/react@<verified-compatible>` — start with latest, smoke-test the embed; if version mismatch with OSS DocuSeal, downgrade per Risks. Pin exact version (no `^`). Commit lockfile.
         └─ Files: [hussle-app-dispatch-ui/package.json, hussle-app-dispatch-ui/package-lock.json]
         └─ Depends on: —
         └─ Output:

[x] T-46 [UI] AgreementSigningStep renderer
         └─ Detail: At `components/steps/AgreementSigningStep/`. Compose shipped focus-mode primitives (`FocusHeader`, `DocuSealStage`, `FocusFooter`, `DocumentRow`, `DotTrail`). State: fetch agreement → branch on status. SIGNED → call `advanceToNextStep` via redux. PENDING/missing → render `<DocusealForm src={embedUrl} onComplete={handleSigned} />`. `handleSigned` dispatches navigation only.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/AgreementSigningStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/AgreementSigningStep/index.test.tsx, hussle-app-dispatch-ui/src/utils/api/agreements/index.ts]
         └─ Depends on: T-45, US-15 T-40
         └─ Output:

---

## US-20: UploadStep (COI-only) + ReviewStep + CheckpointStep + CompleteStep
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-13, US-15_

> Slice extension: `navigateToStep({ stepId })` reducer added in this story (client-only; saga server-persist deferred). File upload payload triggers serializable-state warning in tests (informational; production store middleware concern).

must_haves:
  truths:
    - "UploadStep renders one upload zone (COI) and auto-advances when status reaches Pending or Verified."
    - "ReviewStep renders a read-only summary with inline edit links that dispatch back-nav (respecting locks)."
    - "CheckpointStep renders a celebratory milestone screen with Continue."
    - "CompleteStep renders personalized headline + 'WHAT YOU COMPLETED' summary card from `completedStepIds` per the PNG reference."

**Acceptance Criteria:**
- [x] AC-20 (COI-only)

**Tasks:**
[x] T-47 [UI] UploadStep
         └─ Detail: At `components/steps/UploadStep/`. Reads `step.documents[]` from schema; composes shipped `UploadZone` per entry. Wires to `uploadDocumentSaga`. Auto-advances when COI hits Pending/Verified.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/UploadStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/UploadStep/index.test.tsx]
         └─ Depends on: US-15 T-40
         └─ Output:

[x] T-48 [UI] ReviewStep
         └─ Detail: At `components/steps/ReviewStep/`. Read-only summary; inline "Edit" link dispatches back-nav to the originating step.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/ReviewStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/ReviewStep/index.test.tsx]
         └─ Depends on: US-15 T-40
         └─ Output:

[x] T-49 [UI] CheckpointStep
         └─ Detail: At `components/steps/CheckpointStep/`. Reads `phase.checkpoint`; renders celebratory card; Continue dispatches advance.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/CheckpointStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/CheckpointStep/index.test.tsx]
         └─ Depends on: US-15 T-40
         └─ Output:

[x] T-50 [UI] CompleteStep
         └─ Detail: At `components/steps/CompleteStep/`. Layout per `docs/screenshots/onboarding/carrier_complete.png`: all-green stepper, big green check, personalized headline (`You're submitted, {firstName(signatoryName)}.`), summary card (rows pulled from `phase.steps[].completeSummary?.(answers)`), info callout, no CTA. Resolves dispatcher name from `session.invitation.dispatcher`.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/CompleteStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/CompleteStep/index.test.tsx]
         └─ Depends on: US-15 T-40
         └─ Output:

---

## US-21: CostAnalysisStep — dedicated step renderer composing shipped primitives
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-13, US-15, US-08_

must_haves:
  truths:
    - "Renders three `LedgerSection`s; per-asset `AssetPaymentRow`s keyed by `Vehicle.id` from the equipment phase."
    - "Dynamic policies + subscriptions arrays via `EditableExpenseRow`."
    - "Live `RateCard` shows break-even CPM + min book rate; empty-state disables Continue."
    - "Submit dispatches `saveCostAnalysisSaga` with the transactional payload shape."

**Acceptance Criteria:**
- [x] AC-18 UI side

**Tasks:**
[x] T-51 [UI] CostAnalysisStep renderer
         └─ Detail: At `components/steps/CostAnalysisStep/`. Compose shipped primitives. Formik for state; derived values via `useMemo` for `fuelPerMile`, `ownerPayMonthly`, `breakEvenCpm`, `minBookRate`. Empty-state via `RateCard` `emptyState` prop. On submit, build the payload matching the backend service contract and dispatch.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/CostAnalysisStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/CostAnalysisStep/computations.ts, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/CostAnalysisStep/index.test.tsx]
         └─ Depends on: US-15 T-40
         └─ Output:

---

## US-22: LanePreferencesStep — dedicated step renderer with two scopes + per-driver inheritance
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-13, US-15, US-09_

must_haves:
  truths:
    - "Renders `Fleet default` scope by default with three sections (lanes / schedule / freight)."
    - "Switching to `Per-driver overrides` shows driver chip bar with filter + edge-fade scroll."
    - "Per-driver sections render at opacity 0.65 when inherited; show `OverrideBadge` + reset link when overridden."
    - "Submit dispatches `saveLanePreferencesSaga` with `{ fleet, overrides }`."

**Acceptance Criteria:**
- [x] AC-19 UI side

**Tasks:**
[x] T-52 [UI] LanePreferencesStep renderer
         └─ Detail: At `components/steps/LanePreferencesStep/`. Compose shipped primitives (`ScopeBar`, `DriverChip`, `EditingCallout`, `LaneStateMap`, `ScheduleGrid`, `SchedulePresetGroup`, `OptCard`, `FreightChip`, `SectionHead`, `OverrideBadge`). Internal state machine tracks `scope` and `selectedDriverId`. Effective-section lookup: `overrides[driverId]?.[section] ?? fleet[section]`. On submit, dispatch.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/LanePreferencesStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/steps/LanePreferencesStep/index.test.tsx]
         └─ Depends on: US-15 T-40
         └─ Output:

---

## US-23: CarrierPortalPage + routes wiring + step dispatcher + PortalAuthGuard port
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-15, US-16, US-17, US-18, US-19, US-20, US-21, US-22_

must_haves:
  truths:
    - "`/carrier-portal/*` route resolves to `CarrierPortalPage` from `features/carrier-portal-v2/`."
    - "CarrierPortalPage reads `session.currentStepId`, resolves the step via schema, and dispatches to the right step renderer inside `PortalShell`."
    - "`PortalAuthGuard` validates invite token via existing endpoint before mounting the page."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/pages/CarrierPortalPage/index.tsx
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/routes/CarrierPortalRoutes.tsx
    - path: hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/PortalAuthGuard/index.tsx

**Acceptance Criteria:**
- [x] AC-12 (9-stage flow walkable)

**Tasks:**
[x] T-53 [UI] Port PortalAuthGuard from old portal
         └─ Detail: Copy `features/carrier-portal/components/PortalAuthGuard/` → v2 path. Confirm it still uses `utils/axios.ts` + the existing invite-token validation endpoint.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/PortalAuthGuard/index.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-54 [UI] CarrierPortalPage + step dispatcher
         └─ Detail: At `pages/CarrierPortalPage/index.tsx`. On mount dispatch `loadSession`. Wrap in `PortalShell` + `PortalAuthGuard`. Read `selectCurrentStep`; switch on `step.type` to mount the right renderer. Loading skeleton via existing primitives.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/pages/CarrierPortalPage/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/pages/CarrierPortalPage/StepDispatcher.tsx]
         └─ Depends on: T-53, US-21 T-51, US-22 T-52, US-20 T-50
         └─ Output:

[x] T-55 [UI] CarrierPortalRoutes + register in app routes
         └─ Detail: `routes/CarrierPortalRoutes.tsx` lazy-loads CarrierPortalPage. Update `src/routes/index.tsx` to import the v2 routes module under the existing `/carrier-portal/*` mount.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/routes/CarrierPortalRoutes.tsx, hussle-app-dispatch-ui/src/routes/index.tsx]
         └─ Depends on: T-54
         └─ Output:

---

## US-24: App-name + color-blind safety cross-cutting sweep (UI)
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

must_haves:
  truths:
    - "Grep for hardcoded `\"FleetCommand\"` in `hussle-app-dispatch-ui/src/` (excluding `dev/` previews) returns zero hits."
    - "Every shipped primitive that uses color to convey state pairs it with a shape glyph and encodes state in `aria-label`."
    - "Color-blind rule appended to `.claude/skills/design-principles/SKILL.md`."

**Tasks:**
[x] T-56 [UI] Replace hardcoded "FleetCommand" with config.appName
         └─ Detail: Replace in `features/carrier-portal-v2/components/PortalHeader/index.tsx` and `components/Statusbadge/index.tsx` (header comment). Leave `dev/OnboardingPreview/previews/*` as preview-only demo content but spot-check.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/PortalHeader/index.tsx, hussle-app-dispatch-ui/src/components/Statusbadge/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/dev/OnboardingPreview/previews/DocumentsUploadPreview.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/dev/OnboardingPreview/previews/SignAgreementPreview.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/dev/OnboardingPreview/previews/WelcomeSegmentationPreview.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-57 [UI] Color-blind safety audit fixes + append rule to design-principles
         └─ Detail: Audit `LaneStateMap`, `DriverChip`, `FreightChip`, `ScheduleGrid`, `OverrideBadge`, `Callout`, etc. Confirm shape glyphs + aria-label state. Fix any gaps inline. Append the rule paragraph to `.claude/skills/design-principles/SKILL.md`.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/LaneStateMap/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/DriverChip/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal-v2/components/FreightChip/index.tsx, .claude/skills/design-principles/SKILL.md]
         └─ Depends on: —
         └─ Output:

---

## US-25: Delete legacy carrier-portal + rename v2 → carrier-portal
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: in-progress | Depends on: US-23_

must_haves:
  truths:
    - "After merge, `features/carrier-portal/` exists and contains only v2 code."
    - "`grep -r \"carrier-portal-v2\" hussle-app-dispatch-ui/src` returns zero hits."
    - "`npm run check-ts` + `npm run lint` pass post-rename."

**Acceptance Criteria:**
- [ ] AC-14

**Tasks:**
[~] T-58 [UI] Delete old portal directory
         └─ Detail: `git rm -r hussle-app-dispatch-ui/src/features/carrier-portal`. Confirm nothing outside the old portal imports from it (`grep -rn "from 'features/carrier-portal'" hussle-app-dispatch-ui/src` returns zero hits before delete).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/**]
         └─ Depends on: US-23 T-55
         └─ Output:

[~] T-59 [UI] Rename carrier-portal-v2 → carrier-portal + fix imports
         └─ Detail: `git mv features/carrier-portal-v2 features/carrier-portal`. Sed-replace `carrier-portal-v2` → `carrier-portal` across all moved files + routes/index.tsx. Run `npm run check-ts && npm run lint`.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/**, hussle-app-dispatch-ui/src/routes/index.tsx, hussle-app-dispatch-ui/.dependency-cruiser.cjs]
         └─ Depends on: T-58
         └─ Output:

---

## US-26: Playwright e2e — full 9-stage flow + resume-after-close
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: todo | Depends on: US-25_

must_haves:
  truths:
    - "`e2e/carrier-portal-v2.spec.ts` walks Welcome → Company → Equipment → Drivers → Cost Analysis → Lane Preferences → Sign (mock auto-sign) → Documents (one PDF) → Complete in a single run."
    - "Resume-after-close test sets the mock agreement to SIGNED while the carrier is at the Sign step, reloads, and asserts auto-advance to Documents."
    - "Locked-field back-nav test asserts read-only render."
    - "Address typeahead error test asserts retry + manual-fallback."
    - "No console errors during the happy-path run (via `page.on('console')`)."

**Acceptance Criteria:**
- [ ] AC-12, AC-13, AC-16

**Tasks:**
[ ] T-60 [TEST] Playwright e2e suite
         └─ Detail: Extend existing `e2e/carrier-portal-full.spec.ts` patterns (per PATTERNS.md). New spec at `e2e/carrier-portal-v2.spec.ts`. Use mock FMCSA + mock signature provider. Three tests: happy-path, resume-after-close, lock-back-nav, typeahead-error.
         └─ Files: [hussle-app-dispatch-ui/e2e/carrier-portal-v2.spec.ts]
         └─ Depends on: US-25 T-59
         └─ Output:

---

## INT-01: Wire dispatch-api ↔ dispatch-ui — contract verification
_Auto-generated | Services: api, dispatch-ui_

**Verification Checklist:**
- [ ] Frontend submit-step saga calls POST `/api/v1/carrier-portal/session/submit-step` with `{ stepId, answers }` shape.
- [ ] Frontend agreement saga calls `GET /api/v1/agreements?carrierId=&templateKey=DISPATCH_AGREEMENT` and `POST /api/v1/agreements`.
- [ ] Locked-field 422 response is surfaced to the user via `enqueueSnackbar`.
- [ ] Session response shape (`currentStepId`, `completedStepIds`, `agreement`, `invitation.organizationName`) matches engine `Session` type.
- [ ] Cost analysis + lane preferences payload shapes match backend services.
- [ ] Auth: invite-token middleware applied to all portal routes; dispatcher session on agreement query.

**Tasks:**
[ ] T-61 [WIRE] Verify dispatch-ui ↔ dispatch-api contract
         └─ Detail: Diff backend route handlers against frontend axios callers. Compare shapes against engine `Session` type. Confirm 422 `{ code: 'FIELD_LOCKED', field }` payload is parsed and toasted in `submitStepSaga`. Confirm `invitation.organizationName` populates the Welcome eyebrow.
         └─ Files: []
         └─ Agent: review
         └─ Depends on: US-07, US-15, US-19, US-21, US-22
         └─ Output:

---

## VER-01: Goal-backward verification
_Auto-generated | Read-only | Services: api, dispatch-ui_

**Tasks:**
[ ] T-62 [VERIFY] Trace every AC + every Flow against the implementation
         └─ Detail: For every AC (1–26) and every Flow (1–4) in plan.md, trace the supporting code. Confirm `npm run validate` on both packages. Confirm Playwright e2e passes. Spot-check the 8-path lock list parity between client and server. Confirm `git grep w9OnFile hussle-app-dispatch-api/src` returns zero.
         └─ Files: []
         └─ Agent: review
         └─ Depends on: US-26, INT-01
         └─ Output:

---

## Summary

| Story | Tasks | Done | Blocked | AC Met |
|---|---|---|---|---|
| US-01 Prisma migrations | 6 | 6 | 0 | 2/2 |
| US-02 w9OnFile readers | 2 | 2 | 0 | 2/2 |
| US-03 Token hardening | 3 | 3 | 0 | 1/1 |
| US-04 portalCompanyService | 3 | 3 | 0 | 2/2 |
| US-05 Equipment upsert | 2 | 2 | 0 | 1/1 |
| US-06 Drivers upsert | 2 | 2 | 0 | 1/1 |
| US-07 submit-step endpoint | 3 | 3 | 0 | 2/2 |
| US-08 Cost analysis service | 2 | 2 | 0 | 1/1 |
| US-09 Lane prefs service | 2 | 2 | 0 | 1/1 |
| US-10 Agreements query | 2 | 2 | 0 | 1/1 |
| US-11 APP_NAME (api) | 1 | 1 | 0 | — |
| US-12 Engine module | 5 | 5 | 0 | 2/2 |
| US-13 Schema module | 2 | 2 | 0 | 1/1 |
| US-14 Bug-fix components | 2 | 2 | 0 | 2/2 |
| US-15 Slice + sagas | 4 | 4 | 0 | — |
| US-16 SegmentationStep | 1 | 1 | 0 | 1/1 |
| US-17 InputStep | 1 | 1 | 0 | 1/1 |
| US-18 VerificationStep | 1 | 1 | 0 | — |
| US-19 AgreementSigningStep | 2 | 2 | 0 | 2/2 |
| US-20 Upload/Review/Checkpoint/Complete | 4 | 4 | 0 | 1/1 |
| US-21 CostAnalysisStep | 1 | 1 | 0 | 1/1 |
| US-22 LanePreferencesStep | 1 | 1 | 0 | 1/1 |
| US-23 Page + routes wiring | 3 | 3 | 0 | 1/1 |
| US-24 Cross-cutting sweep (UI) | 2 | 2 | 0 | — |
| US-25 Delete legacy + rename | 2 | 0 | 0 | 0/1 |
| US-26 Playwright e2e | 1 | 0 | 0 | 0/3 |
| INT-01 Wire verification | 1 | 0 | 0 | — |
| VER-01 Goal-backward verify | 1 | 0 | 0 | — |
| **All** | **62** | **57** | **0** | **27/29** |
