# Carrier Onboarding — Task List

> Generated from plan.md + contract.yaml + types.ts on 2026-03-30
>
> **Phase 1 only (Stories 1-18).** Phase 2 (Self-Registration + FMCSA, Stories 19-24) and
> Phase 3 (Post-Activation Workflows, Stories 25-30) will be added after Phase 1 ships.

## Summary

| Metric | Count |
|--------|-------|
| Stories | 18 + INT-01 + VER-01 = 20 |
| Tasks | 40 |
| Backend tasks | 22 |
| Frontend tasks | 14 |
| Review tasks | 2 |
| None (manual) | 2 |

---

## US-01: Schema Migration (Story 1)

**AC:** `npx prisma migrate dev` succeeds; existing queries unaffected.

- [x] **T-01** `[SCHEMA]` Add OnboardingSession, CarrierInviteToken models and extend Carrier, Vehicle, Document

  **Detail:**
  File: `hussle-app-dispatch-api/prisma/schema.prisma`

  New models:
  - `OnboardingSession` — fields: `id` (UUID, default cuid), `carrierId` (String, unique, relation to Carrier), `currentPhase` (Int, default 1), `currentQuestionIndex` (Int, default 0), `answers` (Json?, default `{}`), `completedPhases` (Int[], default `[]`), `lastActiveAt` (DateTime, default now), `completedAt` (DateTime?), `createdAt` (DateTime), `updatedAt` (DateTime)
  - `CarrierInviteToken` — fields: `id` (UUID), `carrierId` (String, relation to Carrier), `organizationId` (String, relation to Organization), `token` (String, unique), `expiresAt` (DateTime), `revokedAt` (DateTime?), `createdAt` (DateTime)

  New enums:
  - `VehicleCategory`: `SEMI_TRUCK`, `BOX_TRUCK`, `CARGO_VAN`, `PERSONAL_VEHICLE` (matches `VehicleCategory` in `types.ts`)
  - `OnboardingStatus`: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `APPROVED`, `REJECTED` (matches `OnboardingStatus` in `types.ts`)

  Extend `Carrier` model:
  - `onboardingStatus` (OnboardingStatus, default `NOT_STARTED`)
  - `minimumRatePerMile` (Decimal?, precision 6 scale 2)
  - `inviteSentAt` (DateTime?)
  - `entryMethod` (String?, default `'INVITE'`)
  - `dispatchAgreementConsentIp` (String?)
  - `dispatchAgreementConsentUserAgent` (String?)
  - `dispatchAgreementSignedAt` (DateTime?)
  - `costProfileVersion` (Int, default 0)
  - `costProfileSource` (String?)
  - `howFoundUs` (String?)
  - `fuelCardProviders` (String[], default `[]`)

  Extend `Vehicle` model:
  - `category` (VehicleCategory?)
  - `gvwr` (Int?)
  - `lenderName` (String?)
  - `loanPayment` (Decimal?, precision 10 scale 2)
  - `loanInterestRate` (Decimal?, precision 5 scale 2)
  - `insuranceMonthlyCost` (Decimal?, precision 10 scale 2)
  - `deliveryTypes` (String[], default `[]`)

  Extend `Document` model:
  - `reviewStatus` (String?, default `'pending_review'`)
  - `reviewedAt` (DateTime?)
  - `reviewedByUserId` (String?)
  - `rejectionReason` (String?)
  - `signatureData` (String? @db.Text)
  - `signedAt` (DateTime?)

  All new fields nullable or have defaults so existing queries are unaffected.

  **Agent:** `backend`
  **Depends on:** none
  **Output:** Updated `schema.prisma` — new models: OnboardingSession, CarrierInviteToken; new enums: VehicleCategory (SEMI_TRUCK|BOX_TRUCK|CARGO_VAN|PERSONAL_VEHICLE), OnboardingStatus (NOT_STARTED|IN_PROGRESS|COMPLETED|APPROVED|REJECTED); extended: Carrier (11 new fields + 2 relations), Vehicle (7 new fields), Document (6 new fields), Organization (1 relation). Prisma generate succeeded ✓

---

## US-02: Carrier Portal Auth (Story 2)

**AC:** Token auth works; invalid/expired/revoked tokens return 401.

- [x] **T-02** `[AUTH]` Create `authenticateCarrierToken` middleware

  **Detail:**
  File: `hussle-app-dispatch-api/src/carrier-portal/middleware/authenticateCarrierToken.ts`

  Follow the pattern in `hussle-app-dispatch-api/src/driver-portal/middleware/`. Accept token from `Authorization: Bearer <token>` header OR `?token=<token>` query param.

  Steps:
  1. Extract token from header or query
  2. Look up `CarrierInviteToken` where `token` matches, `revokedAt` is null, `expiresAt > now()`
  3. If not found or expired: throw `UnauthorizedError` (from `hussle-app-dispatch-api/src/shared/errors/`)
  4. Attach `req.carrierPortal = { carrierId, organizationId, tokenId }` to request

  Add Express.d.ts augmentation in `hussle-app-dispatch-api/src/carrier-portal/types/express.d.ts`:
  ```
  interface CarrierPortalContext { carrierId: string; organizationId: string; tokenId: string; }
  ```
  Extend `Request` with `carrierPortal?: CarrierPortalContext`.

  **Agent:** `backend`
  **Depends on:** T-01, T-03
  **Output:** Middleware: `carrier-portal/middleware/authenticateCarrierToken.ts` (createAuthenticateCarrierToken factory). Types: `carrier-portal/types/carrierPortalTypes.ts` (CarrierPortalContext), `carrier-portal/types/express.d.ts` (Request augmentation). TypeCheck ✓

- [x] **T-03** `[AUTH]` Create `CarrierInviteTokenRepoPort` + Prisma implementation

  **Detail:**
  Port: `hussle-app-dispatch-api/src/carrier-portal/repositories/carrierInviteTokenRepoPort.ts`
  Impl: `hussle-app-dispatch-api/src/carrier-portal/repositories/carrierInviteTokenRepoPrisma.ts`

  Methods:
  - `findByToken(token: string): Promise<CarrierInviteToken | null>` — WHERE token AND revokedAt IS NULL AND expiresAt > NOW()
  - `create(data: { carrierId: string; organizationId: string; token: string; expiresAt: Date }): Promise<CarrierInviteToken>`
  - `revokeByCarrierId(carrierId: string): Promise<void>` — SET revokedAt = NOW() WHERE carrierId AND revokedAt IS NULL

  Follow `repositoryFactoryPrisma` pattern from `hussle-app-dispatch-api/src/shared/prisma/`.

  **Agent:** `backend`
  **Depends on:** T-01
  **Output:** Port: `carrier-portal/types/carrierInviteTokenRepoPort.ts` (CarrierInviteTokenRepoPort, CreateCarrierInviteTokenInput). Impl: `carrier-portal/repositories/carrierInviteTokenRepoPrisma.ts` (carrierInviteTokenRepoPrisma factory). Methods: findByToken, create, revokeByCarrierId. TypeCheck ✓

- [x] **T-04** `[AUTH]` Create carrier-portal composition root and mount routes

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carrier-portal/compositionRoot.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/routes/index.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/index.ts`

  Follow the pattern in `hussle-app-dispatch-api/src/driver-portal/compositionRoot.ts`. Wire:
  - `carrierInviteTokenRepo` (from T-03)
  - `authenticateCarrierToken` middleware (from T-02)
  - All portal controllers (placeholder stubs for now, filled by T-09 through T-16)

  Mount at `/api/v1/carrier-portal` in `hussle-app-dispatch-api/src/app.ts`. All portal routes use `authenticateCarrierToken` middleware.

  **Agent:** `backend`
  **Depends on:** T-02, T-03
  **Output:** compositionRoot.ts (createCarrierPortalModule), routes/index.ts (createCarrierPortalRouter with publicRateLimiter + authenticateCarrierToken), index.ts (carrierPortalRouter export), app.ts mounted at `/api/v1/carrier-portal`. TypeCheck ✓

---

## US-03: Invite Flow (Story 3)

**AC:** Dispatcher can invite carrier; token persists; resend revokes old token.

- [x] **T-05** `[API]` Create invite endpoint `POST /api/v1/carriers/:id/invite`

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carriers/controllers/inviteController.ts`
  - `hussle-app-dispatch-api/src/carriers/services/carrierInviteService.ts`
  - `hussle-app-dispatch-api/src/carriers/routes/` (add route)

  Controller: `createInviteControllers(deps) => { sendInvite, resendInvite }`
  Middleware: `requireAuth`, `requireRole(['ADMIN', 'DISPATCHER'])`
  Request body: `SendInviteRequest` from `types.ts` (optional `message` field)

  Service logic:
  1. Validate carrier exists in org, has email, is not ACTIVE, onboardingStatus is not COMPLETED
  2. Generate 32-byte crypto-random token (`crypto.randomBytes(32).toString('hex')`)
  3. Create `CarrierInviteToken` with 7-day expiry via repo
  4. Update carrier: `onboardingStatus: OnboardingStatus.NOT_STARTED`, `inviteSentAt: new Date()`, `entryMethod: 'INVITE'`
  5. Publish `carrier.invited` event with `CarrierInvitedEvent` payload (from `types.ts`)
  6. Return `{ inviteSentAt, tokenExpiresAt }` via `sendSingle(res, data)`

  Error cases: 400 (no email), 404 (carrier not found), 409 (already ACTIVE or COMPLETED)

  **Agent:** `backend`
  **Depends on:** T-01, T-03, T-08 (event map)
  **Output:** inviteController.ts (createInviteControllers, sendInvite), carrierInviteService.ts (createCarrierInviteService). Route: POST /:id/invite. Wired in compositionRoot + carrierRoutes. Validator: sendInviteValidator. Publishes carrier.invited event. TypeCheck ✓

- [x] **T-06** `[API]` Create resend-invite endpoint `POST /api/v1/carriers/:id/resend-invite`

  **Detail:**
  File: Same controller file as T-05 (`inviteController.ts`), add `resendInvite` handler.

  Service logic:
  1. Call `carrierInviteTokenRepo.revokeByCarrierId(carrierId)` to revoke all existing tokens
  2. Generate new token (same as T-05)
  3. Create new `CarrierInviteToken`
  4. Update carrier `inviteSentAt`
  5. Publish `carrier.invited` event

  Middleware: `requireAuth`, `requireRole(['ADMIN', 'DISPATCHER'])`

  **Agent:** `backend`
  **Depends on:** T-05
  **Output:** Added resendInvite to inviteController + carrierInviteService. Route: POST /:id/resend-invite. Shared issueInvite helper extracted. Relaxed validation (no onboarding status check). TypeCheck ✓

---

## US-04: Invite Notifications (Story 4)

**AC:** Email + SMS sent on invite; email contains portal link with token.

- [x] **T-07** `[EMAIL]` Create `CarrierInviteEmail` template + render function

  **Detail:**
  Files:
  - `hussle-emails/src/emails/CarrierInviteEmail.tsx`
  - `hussle-emails/src/emails/renderCarrierInviteEmail.ts`
  - Update `hussle-emails/src/index.ts` to export

  Follow the two-file pattern (e.g., `InvitationEmail.tsx` + render function). Use shared components: `EmailLayout`, `CtaButton`, `emailStyles` from `hussle-emails/src/components/`.

  Data interface:
  ```
  { carrierName: string; organizationName: string; portalUrl: string; message?: string; }
  ```

  CTA button text: "Start Onboarding". Portal URL format: `{baseUrl}/carrier-portal/{token}`.

  **Agent:** `backend`
  **Depends on:** none
  **Output:** carrierInvite/CarrierInviteEmail.tsx + renderCarrierInviteEmail.ts. Exports: renderCarrierInviteEmail, CarrierInviteEmailData. Updated index.ts. TypeCheck ✓

- [x] **T-08** `[EVENT]` Create `carrier.invited` subscriber wiring email + SMS

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/notifications/services/carrierOnboardingSubscriber.ts`
  - Update `hussle-app-dispatch-api/src/shared/messaging/eventMap.ts` — add all 4 Phase 1 events to `EventMap` interface:
    - `'carrier.invited'`: `CarrierInvitedEvent`
    - `'carrier.onboarding.completed'`: `CarrierOnboardingCompletedEvent`
    - `'carrier.onboarding.approved'`: `CarrierOnboardingApprovedEvent`
    - `'carrier.onboarding.rejected'`: `CarrierOnboardingRejectedEvent`
  - Update `hussle-app-dispatch-api/src/notifications/compositionRoot.ts` to wire subscriber

  Subscriber for `carrier.invited`:
  1. Call `renderCarrierInviteEmail()` with data from event payload
  2. Send email via `emailService.send()`
  3. Send SMS via `smsService.send()` with portal link
  4. Portal URL: `${config.appUrl}/carrier-portal/${event.inviteToken}`

  Follow pattern in `hussle-app-dispatch-api/src/notifications/services/` (existing subscriber files).

  **Agent:** `backend`
  **Depends on:** T-07
  **Output:** eventMap.ts: added carrier.invited, carrier.onboarding.completed, carrier.onboarding.approved, carrier.onboarding.rejected. Subscriber: notifications/services/carrierOnboardingSubscriber.ts (initializeCarrierOnboardingSubscriber). Wired in notifications/compositionRoot.ts. TypeCheck ✓

---

## US-05: Onboarding Session CRUD (Story 5)

**AC:** Partial progress persists; closing browser and returning loads saved state.

- [x] **T-09** `[API]` Create `onboardingSessionRepo` + `onboardingSessionService`

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carrier-portal/repositories/onboardingSessionRepoPort.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/repositories/onboardingSessionRepoPrisma.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/services/onboardingSessionService.ts`

  Repo methods:
  - `findByCarrierId(carrierId: string): Promise<OnboardingSession | null>`
  - `create(data: { carrierId: string }): Promise<OnboardingSession>`
  - `update(id: string, data: Partial<OnboardingSession>): Promise<OnboardingSession>`

  Service: `createOnboardingSessionService(deps) => { getOrCreate, saveAnswer, complete }`
  - `getOrCreate(carrierId: string)`: find or create session, update `lastActiveAt`, also update carrier `onboardingStatus: IN_PROGRESS` if `NOT_STARTED`
  - `saveAnswer(carrierId: string, input: SaveAnswerRequest)`: upsert `answers[questionId] = value`, update `currentPhase`, `currentQuestionIndex`, `lastActiveAt`. Uses `SaveAnswerRequest` from `types.ts`.
  - `complete(carrierId: string)`: validate all 6 phases in `completedPhases`, set `completedAt`, update carrier `onboardingStatus: COMPLETED`, publish `carrier.onboarding.completed` event with `CarrierOnboardingCompletedEvent` payload

  **Agent:** `backend`
  **Depends on:** T-01, T-04
  **Output:** Port: onboardingSessionRepoPort.ts (OnboardingSessionRepoPort). Impl: onboardingSessionRepoPrisma.ts. Service: onboardingSessionService.ts (getOrCreate, saveAnswer, complete). Wired in compositionRoot (exports services.onboardingSessionService). TypeCheck ✓

- [x] **T-10** `[API]` Create session endpoints (GET, PUT answer, POST complete)

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carrier-portal/controllers/sessionController.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/validators/sessionValidators.ts`
  - Update `hussle-app-dispatch-api/src/carrier-portal/routes/index.ts`

  Endpoints (all use `authenticateCarrierToken` middleware):
  - `GET /carrier-portal/session` — calls `sessionService.getOrCreate(req.carrierPortal.carrierId)`, returns `PortalSessionResponse` (session + carrier summary) via `sendSingle()`
  - `PUT /carrier-portal/session/answer` — body: `SaveAnswerRequest` (`{ questionId, value, phase? }`), calls `sessionService.saveAnswer()`, returns updated `OnboardingSession`
  - `POST /carrier-portal/session/complete` — calls `sessionService.complete()`, returns updated `OnboardingSession`. 400 if incomplete, 409 if already completed.

  Yup validators per contract: `questionId` required string max 100, `value` required, `phase` optional int 1-6.

  **Agent:** `backend`
  **Depends on:** T-09, T-04
  **Output:** sessionController.ts (getSession, saveAnswer, completeSession). sessionValidators.ts (saveAnswerValidator). Routes: GET /session, PUT /session/answer, POST /session/complete. Wired in compositionRoot. TypeCheck ✓

---

## US-06: Phase 1-3 Portal Endpoints (Story 6)

**AC:** Data persists to Carrier/Vehicle/Driver tables; compliance branching validated per vehicle category.

- [x] **T-11** `[API]` Create `POST /carrier-portal/company` endpoint + validator

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carrier-portal/controllers/companyController.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/services/portalCompanyService.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/validators/companyValidator.ts`

  Request body: `SaveCompanyRequest` from `types.ts`. Yup validation per contract:
  - `name` required string max 255
  - `mcNumber` optional, pattern `^[0-9]{1,8}$`
  - `dotNumber` optional, pattern `^[0-9]{1,8}$`
  - `ein` optional, pattern `^[0-9]{2}-?[0-9]{7}$`
  - `zip` optional, pattern `^[0-9]{5}(-[0-9]{4})?$`
  - `state` optional, exactly 2 chars
  - All other fields optional strings with max lengths per contract

  Service: writes fields to Carrier record via `prismaClient.carrier.update()`.
  Response: `CarrierPortalSummary` via `sendSingle()`.

  **Agent:** `backend`
  **Depends on:** T-04
  **Output:** companyController.ts (saveCompany), portalCompanyService.ts (saveCompany), companyValidator.ts. Route: POST /company. TypeCheck ✓

- [x] **T-12** `[API]` Create `POST /carrier-portal/equipment` endpoint + validator

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carrier-portal/controllers/equipmentController.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/services/portalEquipmentService.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/validators/equipmentValidator.ts`

  Request body: `SaveEquipmentRequest` from `types.ts`. Vehicles array (min 1, max 50) of `VehicleEntry`.

  Compliance validation per `VEHICLE_COMPLIANCE` from `types.ts`:
  - `SEMI_TRUCK`: carrier must have `mcNumber` on record (400 if missing)
  - `BOX_TRUCK`: `gvwr` required; if `gvwr > 26000`, carrier must have `dotNumber` (400 if missing)
  - `PERSONAL_VEHICLE`: `deliveryTypes` required (at least 1)
  - `insuranceAttested` should be true for each vehicle entry

  Service logic:
  1. Delete existing vehicles for carrier (`prismaClient.vehicle.deleteMany({ where: { carrierId } })`)
  2. Create new vehicles from request (`prismaClient.vehicle.createMany()`)
  3. If `medicalCourierCompliance` provided, store on session answers
  4. Return created vehicles

  Response: array of `{ id, category, make, model, year }` via `sendSingle()`.

  **Agent:** `backend`
  **Depends on:** T-04, T-01
  **Output:** equipmentController.ts (saveEquipment), portalEquipmentService.ts (saveEquipment + compliance validation), equipmentValidator.ts. Route: POST /equipment. TypeCheck ✓

- [x] **T-13** `[API]` Create `POST /carrier-portal/drivers` endpoint + validator

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carrier-portal/controllers/driversController.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/services/portalDriversService.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/validators/driversValidator.ts`

  Request body: `SaveDriversRequest` from `types.ts`.
  - `hasAdditionalDrivers` required boolean
  - `drivers` optional array of `DriverEntry` (max 50), each with `firstName` required, `lastName` required, `phone` optional, `email` optional, `payType` optional (enum `PayType`), `payRate` optional (0-100)

  Service logic:
  1. If `hasAdditionalDrivers === false`, skip driver creation
  2. Delete existing drivers for carrier, create new from array
  3. Return created drivers

  Response: array of `{ id, firstName, lastName }` via `sendSingle()`.

  **Agent:** `backend`
  **Depends on:** T-04, T-01
  **Output:** driversController.ts (saveDrivers), portalDriversService.ts (saveDrivers), driversValidator.ts. Route: POST /drivers. PayType stored in driver notes as JSON. TypeCheck ✓

---

## US-07: Cost Analysis Engine (Story 7)

**AC:** Cost profile saved; `minimumRatePerMile` available for Load Intel; result values mathematically correct.

- [x] **T-14** `[API]` Create `POST /carrier-portal/cost-analysis` endpoint

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carrier-portal/controllers/costAnalysisController.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/services/portalCostAnalysisService.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/validators/costAnalysisValidator.ts`

  Request body: `SaveCostAnalysisRequest` from `types.ts` — all 6 fields required:
  - `truckPayment` (min 0), `insuranceCost` (min 0), `fuelCostPerGallon` (min 0, max 20), `milesPerGallon` (min 1, max 30), `maintenanceMonthlyCost` (min 0), `otherMonthlyCosts` (min 0)

  Service logic:
  1. Compute `fuelCostPerMile = fuelCostPerGallon / milesPerGallon`
  2. Compute `totalMonthlyExpenses = truckPayment + insuranceCost + maintenanceMonthlyCost + otherMonthlyCosts + (fuelCostPerMile * estimatedMonthlyMiles)`
  3. Call `calculateCpm()` from `hussle-app-dispatch-api/src/shared/scoring/calculateCpm.ts`
  4. Call `calculateMinBookRate()` from `hussle-app-dispatch-api/src/shared/scoring/calculateMinBookRate.ts`
  5. Update carrier: `minimumRatePerMile`, `costProfileVersion: 1`, `costProfileSource: 'onboarding_estimate'`

  Response: `CostAnalysisResult` from `types.ts` via `sendSingle()`.

  **Agent:** `backend`
  **Depends on:** T-04, T-01
  **Output:** Controller, service, validator, route registration, unit tests for math

---

## US-08: Lane Preferences (Story 8)

**AC:** Lane data persists; skipped fields default to neutral.

- [x] **T-15** `[API]` Create `POST /carrier-portal/lane-preferences` endpoint

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carrier-portal/controllers/lanePreferencesController.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/services/portalLanePreferencesService.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/validators/lanePreferencesValidator.ts`

  Request body: `SaveLanePreferencesRequest` from `types.ts` — all fields optional:
  - `homeBaseCity` (max 100), `homeBaseState` (exactly 2 chars), `maxDaysOut` (int 1-30)
  - `preferredLanes` (array max 20 of `LanePreferenceEntry`)
  - `statePreferences` (array max 50 of `StatePreferenceEntry` with `state` 2-char + `preference` enum `StatePreference`)
  - `freightPreferences` (array of `FreightPreference` enum values)

  Service: store lane preferences as JSON on session answers and/or persist to Driver record fields. Return `{ saved: true }`.

  **Agent:** `backend`
  **Depends on:** T-04, T-01
  **Output:** Controller, service, validator, route registration

---

## US-09: Document Signing (Story 9)

**AC:** Signature stored; consent recorded; compliance flags updated.

- [x] **T-16** `[API]` Create portal document endpoints (GET list, POST presign, POST confirm, POST sign)

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carrier-portal/controllers/portalDocumentController.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/services/portalDocumentService.ts`
  - `hussle-app-dispatch-api/src/carrier-portal/validators/documentValidators.ts`

  Reuse `s3Presign` from `hussle-app-dispatch-api/src/shared/s3Presign.ts` and patterns from `hussle-app-dispatch-api/src/documents/`.

  Endpoints (all portal-token auth, scoped to `req.carrierPortal.carrierId`):

  1. `GET /carrier-portal/documents` — list documents where `carrierId` matches, return `PortalDocument[]`
  2. `POST /carrier-portal/documents/presign` — body: `PresignRequest` (`fileName`, `contentType`, `documentType` from `DocumentType` enum). Create Document record, call `s3Presign()`, return `PresignResponse` (201).
  3. `POST /carrier-portal/documents/:id/confirm` — body: `ConfirmUploadRequest` (`documentType`, optional `insuranceExpiry` + `coverageConfirmed` for `INSURANCE_CERT`). Validate doc belongs to carrier (404 if not). Update doc status. Update carrier compliance flags: `dispatchAgreementOnFile`, `insuranceCertOnFile`, `w9OnFile`, `carrierPacketOnFile` based on `documentType`.
  4. `POST /carrier-portal/documents/:id/sign` — body: `SignDocumentRequest` (`signatureData` base64, `consentGiven` must be true, optional `signerName`, `signerTitle`). Store `signatureData` + `signedAt` on document. Store E-SIGN consent on carrier: `dispatchAgreementConsentIp` (from `req.ip`), `dispatchAgreementConsentUserAgent` (from `req.headers['user-agent']`), `dispatchAgreementSignedAt`. Set `dispatchAgreementOnFile = true`.

  **Agent:** `backend`
  **Depends on:** T-04, T-01
  **Output:** Controller, service, validators, route registrations

---

## US-10: Approval Gate API (Story 10)

**AC:** Approve/reject transitions status; events fire; pending queue returns correct carriers.

- [x] **T-17** `[API]` Create `POST /carriers/:id/approve` and `POST /carriers/:id/reject`

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carriers/controllers/approvalController.ts`
  - `hussle-app-dispatch-api/src/carriers/services/carrierApprovalService.ts`
  - `hussle-app-dispatch-api/src/carriers/validators/approvalValidators.ts`
  - Update `hussle-app-dispatch-api/src/carriers/routes/` to add routes

  Middleware: `requireAuth`, `requireRole(['ADMIN', 'DISPATCHER'])`

  Approve (`POST /carriers/:id/approve`):
  1. Validate carrier exists in org, `onboardingStatus === COMPLETED` (409 if not)
  2. Update carrier: `status: 'ACTIVE'`, `onboardingStatus: OnboardingStatus.APPROVED`
  3. Publish `carrier.onboarding.approved` event with `CarrierOnboardingApprovedEvent` payload (includes `minimumRatePerMile`, `approvedByUserId`)
  4. Return `{ id, status, onboardingStatus, minimumRatePerMile }` via `sendSingle()`

  Reject (`POST /carriers/:id/reject`):
  1. Body: `RejectCarrierRequest` — `reason` required string max 1000
  2. Validate carrier exists in org, `onboardingStatus === COMPLETED` (409 if not)
  3. Update carrier: `onboardingStatus: OnboardingStatus.REJECTED`
  4. Publish `carrier.onboarding.rejected` event with `CarrierOnboardingRejectedEvent` payload (includes `rejectionReason`, `rejectedByUserId`)
  5. Return `{ id, onboardingStatus }` via `sendSingle()`

  **Agent:** `backend`
  **Depends on:** T-01, T-08 (events in eventMap)
  **Output:** Controller, service, validators, route registrations

- [x] **T-18** `[API]` Create `GET /carriers/:id/onboarding` and `GET /dashboard/pending-carriers`

  **Detail:**
  Files:
  - `hussle-app-dispatch-api/src/carriers/controllers/onboardingDetailController.ts`
  - `hussle-app-dispatch-api/src/carriers/services/carrierOnboardingDetailService.ts`
  - `hussle-app-dispatch-api/src/dashboard/controllers/pendingCarriersController.ts`
  - Update routes in carriers + dashboard modules

  `GET /carriers/:id/onboarding` (auth: `requireAuth`, `requireRole(['ADMIN', 'DISPATCHER'])`):
  - Return `CarrierOnboardingDetail` from `types.ts`: carrier record, session, vehicles, drivers, documents, costAnalysis, lanePreferences
  - Join all related data for the approval gate view
  - 404 if carrier not found or no onboarding session

  `GET /dashboard/pending-carriers` (auth: `requireAuth`, `requireRole(['ADMIN', 'DISPATCHER'])`):
  - Query carriers WHERE `onboardingStatus = 'COMPLETED'` AND `organizationId` matches, ORDER BY `completedAt` DESC
  - Paginated: `page` + `limit` query params (defaults: page=1, limit=25)
  - Return `PendingCarrierListResponse` from `types.ts` with `PendingCarrier[]` + `PaginationMeta`
  - Include counts: `driverCount`, `vehicleCount` via relation aggregation

  **Agent:** `backend`
  **Depends on:** T-01, T-09
  **Output:** Controllers, services, route registrations

---

## US-11: Approval/Completion Notifications (Story 11)

**AC:** All notification paths fire correctly.

- [x] **T-19** `[EMAIL]` Create 3 email templates (OnboardingComplete, Approved, Rejected)

  **Detail:**
  Files (follow two-file pattern like `hussle-emails/src/emails/CheckCallEmail.tsx`):
  - `hussle-emails/src/emails/CarrierOnboardingCompleteEmail.tsx` + `renderCarrierOnboardingCompleteEmail.ts`
    - Data: `{ carrierName: string; organizationName: string; reviewUrl: string; }`
    - Sent TO dispatcher when carrier finishes onboarding
  - `hussle-emails/src/emails/CarrierApprovedEmail.tsx` + `renderCarrierApprovedEmail.ts`
    - Data: `{ carrierName: string; organizationName: string; }`
    - Sent TO carrier on approval
  - `hussle-emails/src/emails/CarrierRejectedEmail.tsx` + `renderCarrierRejectedEmail.ts`
    - Data: `{ carrierName: string; organizationName: string; rejectionReason: string; }`
    - Sent TO carrier on rejection

  Use shared `EmailLayout`, `CtaButton`, `DataTable`, `emailStyles`. Export all from `hussle-emails/src/index.ts`.

  **Agent:** `backend`
  **Depends on:** none
  **Output:** 6 files (3 component + 3 render), updated index.ts

- [x] **T-20** `[EVENT]` Create subscribers for completed/approved/rejected events

  **Detail:**
  File: `hussle-app-dispatch-api/src/notifications/services/carrierOnboardingSubscriber.ts` (extend file from T-08)

  Subscribers:
  - `carrier.onboarding.completed` -> call `renderCarrierOnboardingCompleteEmail()`, send to dispatcher (look up org admin email)
  - `carrier.onboarding.approved` -> call `renderCarrierApprovedEmail()`, send to carrier email; send approval SMS via `smsService`
  - `carrier.onboarding.rejected` -> call `renderCarrierRejectedEmail()`, send to carrier email with reason; send rejection SMS via `smsService`

  Wire in `hussle-app-dispatch-api/src/notifications/compositionRoot.ts`.

  **Agent:** `backend`
  **Depends on:** T-08, T-19
  **Output:** Updated subscriber file, updated composition root

---

## US-12: ConversationalForm Component System (Story 12)

**AC:** Questions render one at a time; answers collapse; edit re-expands; sub-questions appear/disappear based on parent; border colors correct.

- [x] **T-21** `[UI]` Create ConversationalFormProvider, QuestionThread, QuestionCard, AnsweredCard

  **Detail:**
  Directory: `hussle-app-dispatch-ui/src/components/ConversationalForm/`

  Files:
  - `ConversationalFormProvider.tsx` — React context providing: `currentQuestionIndex`, `answers` (Record<string, unknown>), `setAnswer(questionId, value)`, `goToQuestion(index)`, `editQuestion(index)`, `activePhase`, `phases`
  - `QuestionThread.tsx` — renders list of `AnsweredCard` components for completed questions + one `QuestionCard` for active question. Auto-scrolls to active question using `useRef` + `scrollIntoView({ behavior: 'smooth' })`.
  - `QuestionCard.tsx` — props: `{ question: QuestionDefinition; onAnswer: (value: unknown) => void; }`. Renders: large bold label (`Typography variant="h5"`), grey hint text (`Typography color="text.secondary"`), input component (delegated to schema engine), "Next" button (`Button variant="contained"`). MUI `Card` with `sx` styling.
  - `AnsweredCard.tsx` — props: `{ question: QuestionDefinition; value: unknown; onEdit: () => void; }`. Compact card: label, formatted value summary, "Edit" link. Clicking Edit calls `editQuestion(index)` which re-expands inline.
  - `index.ts` — barrel exports

  **Agent:** `frontend`
  **Depends on:** none
  **Output:** Component files in `ConversationalForm/`

- [x] **T-22** `[UI]` Create SubQuestion and SubAnswer components with colored left borders

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/components/ConversationalForm/SubQuestion.tsx`
  - `hussle-app-dispatch-ui/src/components/ConversationalForm/SubAnswer.tsx`

  `SubQuestion` — wraps a `QuestionCard` with:
  - Left border (4px) using `borderLeft` via `sx` prop
  - Border color from `borderColor` prop: `'blue'` (required compliance) = `theme.palette.info.main`, `'green'` (optional) = `theme.palette.success.main`, `'red'` (compliance flag) = `theme.palette.error.main`, `'grey'` (neutral) = `theme.palette.grey[400]`
  - Indented via `ml: 4`
  - Smaller timeline dot on the left

  `SubAnswer` — wraps an `AnsweredCard` with:
  - Same colored left border + indentation
  - Lighter background tint matching border color

  Behavior: when parent answer changes, all sub-questions/answers clear (managed by `ConversationalFormProvider`).

  **Agent:** `frontend`
  **Depends on:** T-21
  **Output:** Component files

---

## US-13: Question Schema Engine + Input Types (Story 13)

**AC:** All input types render correctly; validation fires on Next; auto-save persists each answer.

- [x] **T-23** `[UI]` Create declarative question schema format and all input type renderers

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/components/ConversationalForm/questionSchema.ts` — type definitions:
    ```
    interface QuestionDefinition {
      id: string;
      phase: number;
      label: string;
      hint?: string;
      inputType: 'text' | 'currency' | 'number' | 'select' | 'multiSelect' | 'yesNo' | 'presetTiles' | 'stateGrid' | 'slider' | 'tagInput';
      options?: { value: string; label: string; }[];
      validation?: Yup.Schema;
      subQuestions?: SubQuestionDefinition[];
      condition?: (answers: Record<string, unknown>) => boolean;
      required?: boolean;
    }
    ```
  - `hussle-app-dispatch-ui/src/components/ConversationalForm/InputRenderer.tsx` — switch on `inputType`, delegate to:
    - `text` -> MUI `TextField`
    - `currency` -> MUI `TextField` with `InputAdornment` ($), `type="number"`
    - `number` -> MUI `TextField` with `type="number"`
    - `select` -> MUI `Select` with `MenuItem` list
    - `multiSelect` -> MUI `Autocomplete` with `multiple`
    - `yesNo` -> two MUI `Button` toggles (Yes/No)
    - `presetTiles` -> grid of `Chip` components + "Custom" input (built in T-31)
    - `stateGrid` -> 50 state grid (built in T-32)
    - `slider` -> MUI `Slider`
    - `tagInput` -> MUI `Autocomplete` with `freeSolo` + chips

  Reuse existing form-field components from `hussle-app-dispatch-ui/src/mocho/components/form-fields/` where possible.

  **Agent:** `frontend`
  **Depends on:** T-21
  **Output:** Schema type file, InputRenderer component

- [x] **T-24** `[UI]` Create per-answer auto-save saga (debounced 500ms PUT to session/answer)

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/autoSaveSaga.ts`

  Saga watches for `carrierPortal/answerChanged` action. Uses `debounce(500, ...)` effect from `redux-saga`. On trigger:
  1. Read `questionId`, `value`, `phase` from action payload
  2. Call `carrierPortalApi.saveAnswer({ questionId, value, phase })` (PUT `/carrier-portal/session/answer`)
  3. On success: dispatch `carrierPortal/answerSaved`
  4. On failure: dispatch `carrierPortal/answerSaveFailed` (show subtle error indicator, do NOT block user)

  Wire into carrier-portal root saga (created in T-26).

  **Agent:** `frontend`
  **Depends on:** T-26, T-27
  **Output:** Saga file

---

## US-14: Portal Shell & Auth (Story 14)

**AC:** Portal loads, authenticates, shows conversational interview; invalid token shows error page; phase progress updates.

- [x] **T-25** `[UI]` Create carrier-portal feature module, route, PortalLayout, token auth context

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx` — main page component
  - `hussle-app-dispatch-ui/src/features/carrier-portal/components/PortalLayout/index.tsx` — minimal header (org logo, no sidebar), phase progress indicator (6 phases: Company, Equipment, Drivers, Cost Analysis, Lane Preferences, Documents), main content area
  - `hussle-app-dispatch-ui/src/features/carrier-portal/components/PortalAuthGuard/index.tsx` — reads `:token` from route params, validates via API (`GET /carrier-portal/session`), shows error page for invalid/expired tokens
  - `hussle-app-dispatch-ui/src/features/carrier-portal/routes/index.tsx` — route at `/carrier-portal/:token`, lazy-loaded with `Loadable`. No AppLayout wrapper (follows driver-portal pattern from `hussle-app-dispatch-ui/src/features/`)

  Mount in app router alongside driver-portal routes (outside AuthGuard/AppLayout).

  **Agent:** `frontend`
  **Depends on:** T-21
  **Output:** Page, layout, auth guard, route files

- [x] **T-26** `[UI]` Create carrier-portal Redux slices (entity + page) and root saga wiring

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/features/carrier-portal/store/slices/carrierPortalSlice.ts` — page slice using `createSlice`. State: `{ session: OnboardingSession | null; carrier: CarrierPortalSummary | null; answers: Record<string, unknown>; loading: boolean; error: string | null; savingAnswer: boolean; }`
  - `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/portalRootSaga.ts` — root saga forking: `fetchSessionSaga`, `autoSaveSaga`, `savePhaseDataSaga`
  - `hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/fetchSessionSaga.ts` — on `carrierPortal/fetchSession`, call `carrierPortalApi.getSession()`, dispatch loaded/error
  - `hussle-app-dispatch-ui/src/features/carrier-portal/store/selectors/portalSelectors.ts` — `selectSession`, `selectCarrier`, `selectAnswers`, `selectCurrentPhase`, `selectIsLoading`

  Register slice in `hussle-app-dispatch-ui/src/store/reducers/index.ts`.
  Register root saga in `hussle-app-dispatch-ui/src/store/sagas/rootsaga.ts`.

  Types: import `OnboardingSession`, `CarrierPortalSummary` from shared types (copy relevant interfaces from `types.ts` to `hussle-app-dispatch-ui/src/features/carrier-portal/types.ts`).

  **Agent:** `frontend`
  **Depends on:** none
  **Output:** Slice, sagas, selectors, store registration

- [x] **T-27** `[UI]` Create `carrierPortalApi` (API layer for all portal endpoints)

  **Detail:**
  File: `hussle-app-dispatch-ui/src/utils/api/fleet/carrierPortalApi.ts`

  Follow pattern in `hussle-app-dispatch-ui/src/utils/api/fleet/contactApi.ts`. All calls use Axios with `Authorization: Bearer <token>` header (token stored in Redux state or URL param).

  Functions:
  - `getSession(token: string): Promise<PortalSessionResponse>` — GET `/carrier-portal/session`
  - `saveAnswer(token: string, data: SaveAnswerRequest): Promise<OnboardingSession>` — PUT `/carrier-portal/session/answer`
  - `completeSession(token: string): Promise<OnboardingSession>` — POST `/carrier-portal/session/complete`
  - `saveCompany(token: string, data: SaveCompanyRequest): Promise<CarrierPortalSummary>` — POST `/carrier-portal/company`
  - `saveEquipment(token: string, data: SaveEquipmentRequest): Promise<VehicleEntry[]>` — POST `/carrier-portal/equipment`
  - `saveDrivers(token: string, data: SaveDriversRequest): Promise<DriverEntry[]>` — POST `/carrier-portal/drivers`
  - `saveCostAnalysis(token: string, data: SaveCostAnalysisRequest): Promise<CostAnalysisResult>` — POST `/carrier-portal/cost-analysis`
  - `saveLanePreferences(token: string, data: SaveLanePreferencesRequest): Promise<{ saved: boolean }>` — POST `/carrier-portal/lane-preferences`
  - `listDocuments(token: string): Promise<PortalDocument[]>` — GET `/carrier-portal/documents`
  - `presignDocument(token: string, data: PresignRequest): Promise<PresignResponse>` — POST `/carrier-portal/documents/presign`
  - `confirmDocument(token: string, id: string, data: ConfirmUploadRequest): Promise<PortalDocument>` — POST `/carrier-portal/documents/${id}/confirm`
  - `signDocument(token: string, id: string, data: SignDocumentRequest): Promise<PortalDocument>` — POST `/carrier-portal/documents/${id}/sign`

  All request/response types from `types.ts`.

  **Agent:** `frontend`
  **Depends on:** none
  **Output:** API layer file

---

## US-15: Phase 1-3 Question Definitions (Story 15)

**AC:** Vehicle type branching works; GVWR indicator reactive; insurance attestation per type; non-CDL callout for cargo van/personal vehicle; medical courier questions for personal vehicle.

- [x] **T-28** `[UI]` Create Company phase questions

  **Detail:**
  File: `hussle-app-dispatch-ui/src/features/carrier-portal/questions/companyQuestions.ts`

  Declarative `QuestionDefinition[]` for Phase 1 (Company):
  - `company.name` — text, required, "What is your company name?"
  - `company.mcNumber` — text, optional, "What is your MC number?", hint: "Leave blank if you don't have one", pattern validation `^[0-9]{1,8}$`
  - `company.dotNumber` — text, optional, "What is your DOT number?"
  - `company.ein` — text, optional, "What is your EIN?", pattern `^[0-9]{2}-?[0-9]{7}$`
  - `company.phone` — text, optional, "Company phone number?"
  - `company.email` — text, optional, "Company email address?"
  - `company.address` — text, optional, "Company address?" (address, city, state, zip as sub-questions)
  - `company.primaryContact` — text group, "Who is your primary contact?" (name, phone, email sub-questions)
  - `company.factoring` — yesNo, "Do you use a factoring company?" Sub-questions if yes: company name, email, submission method, advance rate, fee %
  - `company.fuelCards` — multiSelect, "Which fuel card providers do you use?" (optional)
  - `company.howFoundUs` — text, optional, "How did you find us?"

  **Agent:** `frontend`
  **Depends on:** T-23
  **Output:** Question definition file

- [x] **T-29** `[UI]` Create Equipment phase questions with vehicle type branching

  **Detail:**
  File: `hussle-app-dispatch-ui/src/features/carrier-portal/questions/equipmentQuestions.ts`

  Declarative `QuestionDefinition[]` for Phase 2 (Equipment):
  - `equipment.vehicleTypes` — multiSelect of `VehicleCategory` enum values (`SEMI_TRUCK`, `BOX_TRUCK`, `CARGO_VAN`, `PERSONAL_VEHICLE` from `types.ts`)
  - For EACH selected type, sub-questions appear with compliance rules from `VEHICLE_COMPLIANCE` in `types.ts`:
    - **SEMI_TRUCK** sub-questions (border: blue = required):
      - MC# confirmation (if not provided in Phase 1)
      - DOT# confirmation
      - Insurance attestation: badge showing "$1,000,000 commercial auto, $100,000 cargo", monthly cost input, checkbox "I confirm my policy meets these minimums"
    - **BOX_TRUCK** sub-questions:
      - GVWR input (number) with live indicator component: green (<10,000 "No DOT needed"), amber (10,001-26,000 "DOT optional"), red (>26,001 "DOT REQUIRED" + DOT# sub-question fades in, border: red)
      - Insurance attestation: "$300,000 commercial auto, $100,000 cargo"
    - **CARGO_VAN** sub-questions:
      - Non-CDL regulatory callout card (grey border, informational): items from `NON_CDL_REQUIREMENTS` in `types.ts`, color-coded REQUIRED (red) vs RECOMMENDED (amber)
      - Insurance attestation: "$300,000 commercial auto"
    - **PERSONAL_VEHICLE** sub-questions:
      - Delivery type selection (multiSelect of `DeliveryType` enum, required)
      - Non-CDL regulatory callout card
      - If `MEDICAL_COURIER` selected: "Do you transport pharmaceuticals?" (yesNo), if yes: "Controlled substances?" (yesNo), flag callout "Your dispatcher will schedule a compliance verification call"
      - Insurance attestation: "$300,000 commercial auto" + "commercial auto rider required" note
  - `equipment.vehicles` — repeatable vehicle entry cards: category (pre-selected), year, make, model, VIN, license plate, GVWR (for BOX_TRUCK), lender name, loan payment, loan interest rate, insurance monthly cost

  **Agent:** `frontend`
  **Depends on:** T-23, T-22
  **Output:** Question definition file with branching logic

- [x] **T-30** `[UI]` Create Drivers phase questions

  **Detail:**
  File: `hussle-app-dispatch-ui/src/features/carrier-portal/questions/driversQuestions.ts`

  Declarative `QuestionDefinition[]` for Phase 3 (Drivers):
  - `drivers.hasAdditional` — yesNo, "Do you have additional drivers besides yourself?"
  - If yes, repeatable driver entry cards (sub-questions, grey border):
    - `drivers.entries[n].firstName` — text, required
    - `drivers.entries[n].lastName` — text, required
    - `drivers.entries[n].phone` — text, optional
    - `drivers.entries[n].email` — text, optional
    - `drivers.entries[n].payType` — select, options from `PayType` enum (`PERCENTAGE`, `PER_MILE`, `FLAT_RATE`)
    - `drivers.entries[n].payRate` — number, optional (0-100)
    - "Add another driver" button to add more entries

  **Agent:** `frontend`
  **Depends on:** T-23
  **Output:** Question definition file

---

## US-16: Phase 4-5 Question Definitions (Story 16)

**AC:** Cost result card shows correct calculations; state grid works; all Phase 5 fields skippable.

- [x] **T-31** `[UI]` Create Cost Analysis phase (PresetTileSelector, 6 inputs, CostResultCard)

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/features/carrier-portal/questions/costAnalysisQuestions.ts`
  - `hussle-app-dispatch-ui/src/features/carrier-portal/components/PresetTileSelector/index.tsx`
  - `hussle-app-dispatch-ui/src/features/carrier-portal/components/CostResultCard/index.tsx`

  `PresetTileSelector` — reusable component: grid of `Chip` preset values + "Custom" option that reveals a `TextField`. Props: `{ presets: { value: number; label: string; }[]; value: number; onChange: (v: number) => void; }`.

  Cost Analysis questions (Phase 4):
  - `cost.truckPayment` — presetTiles with "I own it" ($0) toggle, presets: $500, $1000, $1500, $2000, Custom
  - `cost.insuranceCost` — presetTiles: $200, $400, $600, $800, Custom
  - `cost.fuelCostPerGallon` — presetTiles: $3.50, $4.00, $4.50, $5.00, Custom
  - `cost.milesPerGallon` — presetTiles: 5, 6, 7, 8, Custom (for semis); 10, 15, 20, 25, Custom (for vans)
  - `cost.maintenanceMonthlyCost` — presetTiles: $200, $400, $600, Custom
  - `cost.otherMonthlyCosts` — presetTiles: $100, $300, $500, Custom

  `CostResultCard` — full-width card, navy background (`theme.palette.primary.dark`), white text. Shows:
  - Break-even RPM (large number)
  - Minimum rate per mile (large, highlighted)
  - Total monthly expenses
  - Fuel cost per mile
  - Projected net per month
  - Revenue per mile
  - Animated number transitions (CSS `transition` on value change)

  Values come from `CostAnalysisResult` type in `types.ts`.

  **Agent:** `frontend`
  **Depends on:** T-23
  **Output:** Question definitions, PresetTileSelector, CostResultCard components

- [x] **T-32** `[UI]` Create Lane Preferences phase (StateGrid, lane tag input, maxDaysOut slider, freight prefs)

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/features/carrier-portal/questions/lanePreferencesQuestions.ts`
  - `hussle-app-dispatch-ui/src/features/carrier-portal/components/StateGrid/index.tsx`

  `StateGrid` — 50 US states in a grid layout. Each state is a small tile showing 2-letter abbreviation. Click cycles through `StatePreference` enum: `NEUTRAL` (grey) -> `PREFERRED` (green) -> `AVOIDED` (red) -> `NEUTRAL`. Legend at top.

  Lane Preferences questions (Phase 5, all optional/skippable):
  - `lanes.homeBaseCity` — text, "What city is your home base?"
  - `lanes.homeBaseState` — select (50 states), "What state?"
  - `lanes.maxDaysOut` — slider (1-30), "How many days can you be on the road?"
  - `lanes.preferredLanes` — tagInput, "Add preferred lanes (e.g., Dallas to Houston)"
  - `lanes.statePreferences` — stateGrid, "Click states to mark preferred (green) or avoided (red)"
  - `lanes.freightPreferences` — multiSelect of `FreightPreference` enum values from `types.ts` (`DRY_VAN`, `REEFER`, `FLATBED`, `STEP_DECK`, `POWER_ONLY`, `HOTSHOT`, `BOX_TRUCK`, `SPRINTER_VAN`)

  **Agent:** `frontend`
  **Depends on:** T-23
  **Output:** Question definitions, StateGrid component

---

## US-17: Phase 6 + Signature Canvas (Story 17)

**AC:** Signing flow completes; signature captured; COI uploads with attestation.

- [x] **T-33** `[UI]` Create SignatureCanvas component

  **Detail:**
  File: `hussle-app-dispatch-ui/src/features/carrier-portal/components/SignatureCanvas/index.tsx`

  HTML5 Canvas component:
  - Props: `{ onSignatureChange: (base64: string | null) => void; width?: number; height?: number; }`
  - Mouse + touch event support (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onTouchStart`, `onTouchMove`, `onTouchEnd`)
  - Smooth line drawing with `canvas.getContext('2d')`, `lineCap: 'round'`, `lineJoin: 'round'`
  - Clear button to reset canvas
  - On stroke end, convert to base64 via `canvas.toDataURL('image/png')` and call `onSignatureChange`
  - Responsive: fill container width, fixed aspect ratio
  - Border: `1px solid` with `theme.palette.divider`

  **Agent:** `frontend`
  **Depends on:** none
  **Output:** SignatureCanvas component

- [x] **T-34** `[UI]` Create Documents phase (signing flow, COI upload, W-9 upload, carrier packet)

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/features/carrier-portal/questions/documentsQuestions.ts`
  - `hussle-app-dispatch-ui/src/features/carrier-portal/components/DocumentSigningFlow/index.tsx`
  - `hussle-app-dispatch-ui/src/features/carrier-portal/components/DocumentUploadZone/index.tsx`

  `DocumentSigningFlow` — for DISPATCH_AGREEMENT:
  1. Scrollable agreement text (placeholder content)
  2. Signer name + title text fields
  3. `SignatureCanvas` (from T-33)
  4. E-SIGN consent checkbox: "I agree to conduct this transaction electronically under the E-SIGN Act"
  5. Submit button -> calls `carrierPortalApi.signDocument()` with `SignDocumentRequest` from `types.ts`

  `DocumentUploadZone` — reusable drag-and-drop upload component:
  - Props: `{ documentType: DocumentType; onUploadComplete: (doc: PortalDocument) => void; label: string; acceptedTypes?: string; }`
  - Upload flow: presign -> upload to S3 -> confirm
  - Uses `carrierPortalApi.presignDocument()` + `carrierPortalApi.confirmDocument()`

  Documents phase questions (Phase 6):
  - `docs.dispatchAgreement` — custom rendering using `DocumentSigningFlow`
  - `docs.insuranceCert` — `DocumentUploadZone` with `documentType: DocumentType.INSURANCE_CERT`, plus: expiration date input, 3 coverage confirmation checkboxes (meets minimum liability, meets cargo requirements if applicable, commercial auto rider if personal vehicle). `ConfirmUploadRequest` includes `insuranceExpiry` and `coverageConfirmed`.
  - `docs.w9` — `DocumentUploadZone` with `documentType: DocumentType.W_9`
  - `docs.carrierPacket` — `DocumentUploadZone` with `documentType: DocumentType.CARRIER_PACKET`

  **Agent:** `frontend`
  **Depends on:** T-33, T-27, T-23
  **Output:** Question definitions, DocumentSigningFlow, DocumentUploadZone components

---

## US-18: Dispatcher Approval Gate & Invite UI (Story 18)

**AC:** Dispatcher can invite, review all data, approve/reject; pending queue updates.

- [x] **T-35** `[UI]` Create InviteCarrierButton + dialog on carrier detail header

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/features/carrier/components/InviteCarrierButton/index.tsx`
  - `hussle-app-dispatch-ui/src/features/carrier/components/InviteCarrierDialog/index.tsx`
  - Update `hussle-app-dispatch-ui/src/features/carrier/pages/CarrierDetailPage/` to add button to header

  `InviteCarrierButton` — MUI `Button` variant="outlined" with send icon. Only visible when carrier type is `EXTERNAL_CARRIER` and `onboardingStatus` is not `APPROVED` or `ACTIVE`.

  `InviteCarrierDialog` — MUI `Dialog`:
  - Shows carrier name + email
  - Optional message field (textarea, max 500 chars per `SendInviteRequest`)
  - "Send Invite" button -> POST `/carriers/:id/invite` via existing carrier API
  - "Resend Invite" variant when `inviteSentAt` already set -> POST `/carriers/:id/resend-invite`
  - Success toast on send

  **Agent:** `frontend`
  **Depends on:** T-05 (API exists)
  **Output:** Button component, dialog component, detail page update

- [x] **T-36** `[UI]` Create OnboardingTab on CarrierDetailPage

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/features/carrier/pages/CarrierDetailPage/tabs/OnboardingTab.tsx`
  - Update `hussle-app-dispatch-ui/src/features/carrier/pages/CarrierDetailPage/` to add tab

  Fetches `GET /carriers/:id/onboarding` (returns `CarrierOnboardingDetail` from `types.ts`). Tab visible when carrier has an onboarding session.

  Read-only display of all 6 phases:
  - Phase 1 (Company): name, MC#, DOT#, EIN, contact info, factoring, fuel cards
  - Phase 2 (Equipment): vehicles with category, GVWR, insurance, compliance status
  - Phase 3 (Drivers): driver list with pay info
  - Phase 4 (Cost Analysis): result card (break-even RPM, min rate, expenses)
  - Phase 5 (Lane Preferences): home base, lanes, state grid, freight prefs
  - Phase 6 (Documents): document list with status badges, signature preview

  Each phase in a `SectionCard` (from `hussle-app-dispatch-ui/src/components/`) with phase completion status.

  **Agent:** `frontend`
  **Depends on:** T-18 (API exists)
  **Output:** Tab component, detail page tab registration

- [x] **T-37** `[UI]` Create Approve/Reject dialogs + PendingCarriersCard on dashboard

  **Detail:**
  Files:
  - `hussle-app-dispatch-ui/src/features/carrier/components/ApproveCarrierDialog/index.tsx`
  - `hussle-app-dispatch-ui/src/features/carrier/components/RejectCarrierDialog/index.tsx`
  - `hussle-app-dispatch-ui/src/features/carrier/components/PendingCarriersCard/index.tsx`
  - Update dashboard page to include `PendingCarriersCard`

  `ApproveCarrierDialog` — confirmation dialog with carrier name + min rate summary. "Approve" button -> POST `/carriers/:id/approve`. Success navigates to carrier detail.

  `RejectCarrierDialog` — dialog with required reason textarea (min 1, max 1000 per `RejectCarrierRequest`). "Reject" button -> POST `/carriers/:id/reject` with `{ reason }`.

  `PendingCarriersCard` — MUI `Card` on dashboard page:
  - Fetches `GET /dashboard/pending-carriers` (returns `PendingCarrierListResponse`)
  - Shows list of `PendingCarrier` items: name, type, completedAt, driver/vehicle counts
  - Each row clickable -> navigates to carrier detail page (OnboardingTab)
  - Badge showing count of pending carriers
  - Empty state: "No carriers pending review"

  Add approve/reject buttons to OnboardingTab (from T-36) when `onboardingStatus === 'COMPLETED'`.

  **Agent:** `frontend`
  **Depends on:** T-17, T-18 (APIs exist), T-36
  **Output:** Dialog components, PendingCarriersCard, dashboard integration

---

## INT-01: Wire dispatch-api <-> dispatch-ui Integration

- [x] **T-38** `[WIRE]` Verify all carrier-portal API calls match contract endpoints and types

  **Detail:**
  Cross-reference every function in `hussle-app-dispatch-ui/src/utils/api/fleet/carrierPortalApi.ts` against the contract in `.planning/carrier-onboarding/contract.yaml`:
  - HTTP method matches (GET/POST/PUT)
  - URL path matches (including `/api/v1` prefix)
  - Request body shape matches contract schema
  - Response shape matches contract schema
  - Auth header sent correctly (`Authorization: Bearer <token>`)
  - Error status codes handled (400, 401, 404, 409)

  Verify Redux saga calls use correct API functions and dispatch correct actions.

  **Agent:** `review`
  **Depends on:** T-10, T-11, T-12, T-13, T-14, T-15, T-16, T-24, T-25, T-26, T-27
  **Output:** List of mismatches (if any) with fixes applied

- [x] **T-39** `[WIRE]` Verify admin API calls (invite, approve, reject, pending) match contract

  **Detail:**
  Cross-reference:
  - Invite button calls POST `/api/v1/carriers/:id/invite` with `SendInviteRequest`
  - Resend calls POST `/api/v1/carriers/:id/resend-invite`
  - Approve dialog calls POST `/api/v1/carriers/:id/approve`
  - Reject dialog calls POST `/api/v1/carriers/:id/reject` with `RejectCarrierRequest`
  - OnboardingTab calls GET `/api/v1/carriers/:id/onboarding` expects `CarrierOnboardingDetail`
  - PendingCarriersCard calls GET `/api/v1/dashboard/pending-carriers` with `page` + `limit` params

  Verify role guards match auth matrix: all admin endpoints require `ADMIN` or `DISPATCHER`.

  **Agent:** `review`
  **Depends on:** T-05, T-06, T-17, T-18, T-35, T-36, T-37
  **Output:** List of mismatches (if any) with fixes applied

---

## VER-01: End-to-End Verification

- [x] **T-40** `[VERIFY]` Trace all x-data-flow paths, verify all AC from all stories

  **Detail:**
  Walk through every `x-data-flow` entry in `contract.yaml` for Phase 1:
  1. "Send Onboarding Invite" — dispatcher clicks invite -> token created -> email + SMS sent
  2. "Carrier Opens Portal" — token validates -> session loads or creates
  3. "Auto-Save Answer" — answer saved to session via PUT
  4. "Complete Step 1-3" — data persists to Carrier/Vehicle/Driver tables
  5. "Complete Step 4 (Cost Analysis)" — CPM calculated, `minimumRatePerMile` written
  6. "Complete Step 6 (Documents)" — signature stored, consent recorded, COI uploaded
  7. "Submit Onboarding Application" — all phases validated, status -> COMPLETED, event fires
  8. "Dispatcher Approves Carrier" — status -> ACTIVE, event fires, email + SMS sent
  9. "Dispatcher Rejects Carrier" — reason stored, event fires, email + SMS with reason

  Verify each story's AC is met. Run `cd hussle-app-dispatch-api && npm run validate` for backend tests.

  **Agent:** `none`
  **Depends on:** T-38, T-39
  **Output:** Verification report confirming all AC pass
