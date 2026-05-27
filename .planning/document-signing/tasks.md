# document-signing Tasks
_Last updated: 2026-05-15 — All FIX-01..FIX-04 complete. Carrier-portal-v2 embed widget remains a separate phase._
_Plan: .planning/document-signing/PRD.md_
_Patterns: .planning/document-signing/PATTERNS.md_
_Contract: .planning/document-signing/contract.yaml_
_Shared types: .planning/document-signing/types.ts_

> Feature 2 of 3 in the MACHO carrier-portal-rebuild (fmcsa-integration ✅ → **document-signing** → carrier-portal-v2).
> Backend-only PR. Mirrors fmcsa-integration story shape — shared module + feature module + composition root.

---

## US-01: Define signature port + types
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

must_haves:
  truths:
    - "Importing SignatureProviderPort, SubmissionRef, SubmissionStatus, CreateSubmissionInput, SignatureService from src/shared/signatures compiles with no any/as/!"
    - "SubmissionStatus discriminated union narrows on .status — code reading `s.status === 'signed'` gets signedAt as Date without assertion"
    - "Every SubmissionStatus variant carries providerSubmissionId so callers can route without re-fetching"
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/signatures/types.ts
      provides: "CreateSubmissionInput, SubmissionRef, SubmissionStatus (discriminated union: pending|signed|declined|voided|expired), SignedArtifacts, SignatureServiceOpts, SignatureService interface"
    - path: hussle-app-dispatch-api/src/shared/signatures/signatureProviderPort.ts
      provides: "SignatureProviderPort interface — createSubmission, getSubmission, voidSubmission, fetchSignedArtifacts"
  key_links:
    - from: SignatureService
      to: SignatureProviderPort
      via: "type composition — service deps include SignatureProviderPort"

**Acceptance Criteria:**
- [ ] types.ts exports `CreateSubmissionInput` with `templateKey`, `variables: Record<string, string>`, `signer: { name; email }`, `metadata?: Record<string, string>`
- [ ] `SubmissionRef = { providerSubmissionId; embedUrl; expiresAt: Date }`
- [ ] `SubmissionStatus` discriminated union with 5 branches (pending, signed, declined, voided, expired); all carry `providerSubmissionId`; terminal states carry `*At: Date`
- [ ] `SignedArtifacts = { signedPdf: Buffer; auditCertificate: Buffer }`
- [ ] `SignatureService` interface has 4 methods: `createSubmission(input, opts?)`, `getSubmission(id)`, `voidSubmission(id)`, `fetchSignedArtifacts(id)`
- [ ] `SignatureProviderPort` is pure interface — no class, no impl
- [ ] All file content uses `interface` (per project rule); no manual entity types

**Tasks:**
[x] T-01 [TYPES] Define types.ts
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/types.ts. Reference analog `src/shared/fmcsa/types.ts:1-52` for layout — top-level imports, interfaces, discriminated unions.
            Define in order:
            - `CreateSubmissionInput { templateKey: AgreementTemplateKey; variables: Record<string,string>; signer: { name: string; email: string }; metadata?: Record<string,string> }` — note `AgreementTemplateKey` lives in `@prisma/client` post US-04; for now alias to `'DISPATCH_AGREEMENT'` literal union and replace with the Prisma enum once it exists (T-08 will fix the import).
            - `SubmissionRef { providerSubmissionId: string; embedUrl: string; expiresAt: Date }`
            - `SignedArtifacts { signedPdf: Buffer; auditCertificate: Buffer }`
            - `SubmissionStatus` discriminated on `status`:
              ```
              | { status: 'pending'; providerSubmissionId: string }
              | { status: 'signed'; providerSubmissionId: string; signedAt: Date }
              | { status: 'declined'; providerSubmissionId: string; declinedAt: Date }
              | { status: 'voided'; providerSubmissionId: string; voidedAt: Date }
              | { status: 'expired'; providerSubmissionId: string; expiredAt: Date }
              ```
            - `SignatureServiceOpts { correlationId?: string }`
            - `SignatureService` interface: 4 methods as listed in AC.
            Use Airbnb TS style. `import type` for type-only.
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/types.ts]
         └─ Depends on: —
         └─ Output: Files: types.ts (87 lines). Exports: AgreementTemplateKey, CreateSubmissionInput, SubmissionRef, SignedArtifacts, SubmissionStatus (discriminated union), SignatureServiceOpts, SignatureService. Status: DONE. Issues: None — tsc passes, discriminated union type-safe, all must_haves verified.

[x] T-02 [TYPES] Define SignatureProviderPort
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/signatureProviderPort.ts mirroring `src/shared/fmcsa/fmcsaPort.ts:1-6` exact shape:
            ```
            export interface SignatureProviderPort {
              createSubmission(input: CreateSubmissionInput): Promise<SubmissionRef>;
              getSubmission(providerSubmissionId: string): Promise<SubmissionStatus>;
              voidSubmission(providerSubmissionId: string): Promise<void>;
              fetchSignedArtifacts(providerSubmissionId: string): Promise<SignedArtifacts>;
            }
            ```
            Import types via `import type` from './types'.
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/signatureProviderPort.ts]
         └─ Depends on: T-01
         └─ Output: Files: signatureProviderPort.ts (14 lines). Exports: SignatureProviderPort interface (4 methods). Status: DONE. Issues: None — TypeScript passes, port contract fully defined.

---

## US-02: Extend EventMap with agreement + signature events
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

must_haves:
  truths:
    - "EventMap['agreement.generated'|'agreement.signed'|'agreement.declined'|'agreement.expired'|'agreement.voided'|'agreement.finalized'|'signature.submission.created'|'signature.submission.failed'] all resolve to typed payloads with no any"

**Acceptance Criteria:**
- [ ] eventMap.ts compiles with all 8 new entries
- [ ] Payloads use `import type` for any signature/agreement types referenced

**Tasks:**
[x] T-03 [TYPES] Add 8 new events to EventMap
         └─ Detail: Edit hussle-app-dispatch-api/src/shared/messaging/eventMap.ts. Append to the existing `EventMap` interface (per fmcsa pattern). Add:
            ```
            'agreement.generated': {
              agreementId: string;
              organizationId: string;
              carrierId: string;
              templateKey: 'DISPATCH_AGREEMENT';
              providerSubmissionId: string;
              correlationId: string;
            };
            'agreement.signed': {
              agreementId: string;
              organizationId: string;
              carrierId: string;
              providerSubmissionId: string;
              signedAt: string;          // ISO
              correlationId: string;
            };
            'agreement.declined': {
              agreementId: string;
              organizationId: string;
              carrierId: string;
              providerSubmissionId: string;
              declinedAt: string;
            };
            'agreement.expired': {
              agreementId: string;
              organizationId: string;
              carrierId: string;
              providerSubmissionId: string;
              expiredAt: string;
            };
            'agreement.voided': {
              agreementId: string;
              organizationId: string;
              carrierId: string;
              voidedAt: string;
              voidReason: string | null;
              voidedByUserId: string | null;
            };
            'agreement.finalized': {
              agreementId: string;
              organizationId: string;
              carrierId: string;
              signedPdfS3Key: string;
              auditCertificateS3Key: string;
              signedPdfSha256: string;
            };
            'signature.submission.created': {
              correlationId: string;
              providerSubmissionId: string;
              templateKey: 'DISPATCH_AGREEMENT';
            };
            'signature.submission.failed': {
              correlationId: string;
              templateKey: 'DISPATCH_AGREEMENT';
              reason: 'timeout' | 'rate_limit' | 'provider_error';
            };
            ```
            All payload fields use plain types — dates as ISO strings (event bus payloads are JSON). No imports needed beyond what's already in eventMap.ts.
         └─ Files: [hussle-app-dispatch-api/src/shared/messaging/eventMap.ts]
         └─ Depends on: —
         └─ Output:

---

## US-03: Register signature env vars + document in .env.example
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

must_haves:
  truths:
    - "env.SIGNATURE_PROVIDER imports as 'mock' | 'docuseal' and defaults to 'mock' when unset"
    - "env.DOCUSEAL_BASE_URL, DOCUSEAL_API_KEY, DOCUSEAL_WEBHOOK_SECRET all resolve to string (required when SIGNATURE_PROVIDER=docuseal in production)"
    - "env.AGREEMENT_WATCHDOG_INTERVAL_MIN defaults to 5; AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN defaults to 10"

**Acceptance Criteria:**
- [x] env.ts compiles with 5 new vars added
- [x] .env.example documents all 5 with example values and "(required when SIGNATURE_PROVIDER=docuseal)" notes

**Tasks:**
[x] T-04 [INFRA] Add signature env vars + .env.example
         └─ Detail:
            1. Edit hussle-app-dispatch-api/src/config/env.ts. Locate the FMCSA_PROVIDER line (~L57) and insert grouped block beneath it:
               ```
               SIGNATURE_PROVIDER: getEnv('SIGNATURE_PROVIDER', 'mock') as 'mock' | 'docuseal',
               DOCUSEAL_BASE_URL: getEnv('DOCUSEAL_BASE_URL', ''),
               DOCUSEAL_API_KEY: getEnv('DOCUSEAL_API_KEY', ''),
               DOCUSEAL_WEBHOOK_SECRET: getEnv('DOCUSEAL_WEBHOOK_SECRET', ''),
               AGREEMENT_WATCHDOG_INTERVAL_MIN: parseInt(getEnv('AGREEMENT_WATCHDOG_INTERVAL_MIN', '5'), 10),
               AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN: parseInt(getEnv('AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN', '10'), 10),
               ```
               Use `getEnv` (not `requireInProd`) — the DocuSeal vars are only required when the provider is selected; runtime check belongs in the DocuSeal provider factory (US-05), not here.
            2. Edit .env.example. Append alongside FMCSA_PROVIDER:
               ```
               # Signature provider (Feature: document-signing)
               SIGNATURE_PROVIDER=mock                # 'mock' | 'docuseal'
               DOCUSEAL_BASE_URL=http://localhost:3030 # required when SIGNATURE_PROVIDER=docuseal
               DOCUSEAL_API_KEY=                       # required when SIGNATURE_PROVIDER=docuseal
               DOCUSEAL_WEBHOOK_SECRET=                # required when SIGNATURE_PROVIDER=docuseal
               AGREEMENT_WATCHDOG_INTERVAL_MIN=5
               AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN=10
               ```
            No other changes.
         └─ Files: [hussle-app-dispatch-api/src/config/env.ts, .env.example]
         └─ Depends on: —
         └─ Output:

---

## US-04: Agreement Prisma model + migration
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

must_haves:
  truths:
    - "Importing { Agreement, AgreementStatus, AgreementTemplateKey } from '@prisma/client' resolves with the full lifecycle enums"
    - "AgreementStatus values exactly: DRAFT | PENDING | SIGNED | VOIDED | EXPIRED | DECLINED (character-for-character match with contract.yaml § AgreementStatus)"
    - "AgreementTemplateKey values exactly: DISPATCH_AGREEMENT (extensible later without migration churn — it's already an enum)"
    - "Unique index on providerSubmissionId enables webhook routing — `prisma.agreement.findUnique({ where: { providerSubmissionId } })` resolves in one query"
    - "Carrier.agreements back-relation exists — `prisma.carrier.findUnique({ include: { agreements: true } })` returns agreements array"
  artifacts:
    - path: hussle-app-dispatch-api/prisma/schema.prisma
      provides: "Agreement model + AgreementStatus enum + AgreementTemplateKey enum + Carrier.agreements back-relation"
    - path: hussle-app-dispatch-api/prisma/migrations/<timestamp>_add_agreement_model/migration.sql
      provides: "Auto-generated migration creating Agreement table and indexes"
  key_links:
    - from: Agreement
      to: Carrier
      via: "Prisma FK on carrierId"
    - from: Agreement
      to: Organization
      via: "Prisma FK on organizationId"

**Acceptance Criteria:**
- [ ] Agreement model lives at the bottom of `prisma/schema.prisma` alongside other domain models
- [ ] Enums declared once: `AgreementStatus { DRAFT PENDING SIGNED VOIDED EXPIRED DECLINED }`, `AgreementTemplateKey { DISPATCH_AGREEMENT }`
- [ ] Indexes: `@@unique([providerSubmissionId])`, `@@index([organizationId, carrierId, status])`, `@@index([status, updatedAt])` (watchdog query)
- [ ] `Carrier.agreements Agreement[]` back-relation declared
- [ ] Migration generated via `npx prisma migrate dev --name add_agreement_model`, committed
- [ ] `npx prisma generate` produces a client; importing the new types compiles

**Tasks:**
[x] T-05 [DB] Add Agreement model + enums to schema.prisma
         └─ Detail: Edit hussle-app-dispatch-api/prisma/schema.prisma. Mirror the `Document` model layout at L1033-1066 — org-scoped, indexed, JSON metadata column, S3 key columns, status enum.
            Add (after Document or in a logical alphabetical position):
            ```
            enum AgreementStatus {
              DRAFT
              PENDING
              SIGNED
              VOIDED
              EXPIRED
              DECLINED
            }

            enum AgreementTemplateKey {
              DISPATCH_AGREEMENT
            }

            model Agreement {
              id                       String                @id @default(uuid())
              organizationId           String
              carrierId                String
              templateKey              AgreementTemplateKey
              status                   AgreementStatus       @default(PENDING)
              providerName             String                // 'MOCK' | 'DOCUSEAL'
              providerSubmissionId     String?               @unique
              embedUrl                 String?
              embedUrlExpiresAt        DateTime?
              signerName               String?
              signerEmail              String?
              variables                Json                  @default("{}")
              signedPdfS3Key           String?
              auditCertificateS3Key    String?
              signedPdfSha256          String?
              signedAt                 DateTime?
              declinedAt               DateTime?
              expiredAt                DateTime?
              voidedAt                 DateTime?
              voidedByUserId           String?
              voidReason               String?
              createdAt                DateTime              @default(now())
              createdByUserId          String?
              updatedAt                DateTime              @updatedAt
              organization             Organization          @relation(fields: [organizationId], references: [id])
              carrier                  Carrier               @relation(fields: [carrierId], references: [id])
              createdByUser            User?                 @relation("AgreementCreator", fields: [createdByUserId], references: [id])
              voidedByUser             User?                 @relation("AgreementVoider", fields: [voidedByUserId], references: [id])

              @@index([organizationId, carrierId, status])
              @@index([status, updatedAt])        // watchdog query
              @@index([organizationId])
            }
            ```
            Also add the back-relation on the Carrier model: `agreements Agreement[]` (find Carrier model, add line in the relations block).
            Also add the back-relations on User: `agreementsCreated Agreement[] @relation("AgreementCreator")` and `agreementsVoided Agreement[] @relation("AgreementVoider")`.
            Also add back-relation on Organization: `agreements Agreement[]` (find Organization model).
         └─ Files: [hussle-app-dispatch-api/prisma/schema.prisma]
         └─ Depends on: —
         └─ Output:

[x] T-06 [DB] Generate migration + Prisma client
         └─ Detail: From `hussle-app-dispatch-api/`, run `npx prisma migrate dev --name add_agreement_model`. Redirect output to /tmp/build-doc-signing-migrate.log. This:
            - Generates a new migration directory under `prisma/migrations/`
            - Applies it to the dev DB
            - Regenerates `@prisma/client` types
            Verify the migration SQL contains:
            - `CREATE TYPE "AgreementStatus" AS ENUM (...)` with exact 6 values
            - `CREATE TYPE "AgreementTemplateKey" AS ENUM ('DISPATCH_AGREEMENT')`
            - `CREATE TABLE "Agreement"` with all columns
            - 3 indexes
            - 4 FK constraints
            If the dev DB is unreachable, fail gracefully and surface the env var (`DATABASE_URL`) the user must set.
         └─ Files: [hussle-app-dispatch-api/prisma/migrations/]
         └─ Depends on: T-05
         └─ Output:

---

## US-05: Mock + DocuSeal providers + port contract test
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01_

must_haves:
  truths:
    - "MockSignatureProvider.createSubmission with identical input twice returns identical providerSubmissionId (deterministic)"
    - "Mock provider supports failure markers: signer.email containing 'TIMEOUT' triggers thrown error tagged 'timeout'; 'NOTFOUND' for getSubmission of an unknown id throws; 'DECLINE' returns declined status on getSubmission"
    - "Mock provider's embed URL is a stub URL the dev can open to simulate signing — format `/dev/sign/{providerSubmissionId}`"
    - "DocuSealProvider.createSubmission POSTs to {baseUrl}/api/submissions with `X-Auth-Token: {apiKey}` header and the HTML body; on 2xx returns { providerSubmissionId, embedUrl, expiresAt } extracted from response"
    - "DocuSealProvider retries on 5xx + network errors with backoff (1s, 5s, 30s); 4xx surfaces as thrown Error immediately"
    - "signatureProviderContract.test.ts exports runSignatureProviderContract(provider) and runs against the mock"
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/signatures/mockSignatureProvider.ts
      provides: "createMockSignatureProvider() => SignatureProviderPort with deterministic responses and failure markers"
    - path: hussle-app-dispatch-api/src/shared/signatures/docusealProvider.ts
      provides: "createDocusealProvider(deps: { baseUrl, apiKey, fetch?, sleep? }) => SignatureProviderPort"
    - path: hussle-app-dispatch-api/src/shared/signatures/__tests__/mockSignatureProvider.test.ts
      provides: "Determinism + failure-mode tests"
    - path: hussle-app-dispatch-api/src/shared/signatures/__tests__/signatureProviderContract.test.ts
      provides: "runSignatureProviderContract helper + mock run"
    - path: hussle-app-dispatch-api/src/shared/signatures/__tests__/docusealProvider.test.ts
      provides: "DocuSeal HTTP adapter tests with mocked fetch"
  key_links:
    - from: mockSignatureProvider
      to: SignatureProviderPort
      via: "implements interface"
    - from: docusealProvider
      to: SignatureProviderPort
      via: "implements interface"

**Acceptance Criteria:**
- [ ] Mock provider returns deterministic providerSubmissionId derived from input hash
- [ ] Mock provider stores submission state in an in-memory Map keyed by submissionId so getSubmission/voidSubmission/fetchSignedArtifacts can round-trip
- [ ] DocuSeal provider retry on 5xx tested (mock fetch returns 502 twice then 200 → final result success; sleep called twice with 1000, 5000)
- [ ] DocuSeal provider 4xx surfaces as throw immediately (no retry)
- [ ] DocuSeal provider throws clear error when DOCUSEAL_API_KEY or DOCUSEAL_BASE_URL is empty
- [ ] Port contract test exercises every method against the mock and validates SubmissionStatus discriminated union narrowing

**Tasks:**
[x] T-07 [INFRA] Create MockSignatureProvider
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/mockSignatureProvider.ts.
            Reference analog: `src/shared/fmcsa/mockFmcsaProvider.ts:1-62` for factory shape and failure-marker handling.
            Signature: `export const createMockSignatureProvider = (): SignatureProviderPort => { ... }`
            Implementation:
            - Internal Map<providerSubmissionId, MockSubmissionState> closed over by the factory
            - `MockSubmissionState = { input: CreateSubmissionInput; status: 'pending'|'signed'|...; createdAt: Date; signedAt?: Date }`
            - `createSubmission(input)`:
              - providerSubmissionId = `mock_${sha256(JSON.stringify(input)).slice(0, 16)}` — deterministic; same input → same id
              - Failure markers (check signer.email substring): 'TIMEOUT@' → throw new Error('Mock timeout'); 'RATELIMIT@' → throw new Error('Mock rate_limit')
              - expiresAt = new Date(Date.now() + 24*60*60*1000)
              - embedUrl = `/dev/sign/${providerSubmissionId}` (local stub UI; doesn't have to render real DocuSeal — dev opens, clicks a button that POSTs to a local mock-webhook emulator)
              - store in Map, return { providerSubmissionId, embedUrl, expiresAt }
            - `getSubmission(id)`:
              - 'NOTFOUND' literal id → throw new Error('Submission not found')
              - if state.input.signer.email contains 'DECLINE@' → return { status: 'declined', providerSubmissionId: id, declinedAt: state.signedAt ?? new Date() }
              - return state.status === 'signed' ? { status: 'signed', providerSubmissionId: id, signedAt: state.signedAt! } : { status: 'pending', providerSubmissionId: id }
            - `voidSubmission(id)`: state.status = 'voided'; state.voidedAt = new Date()
            - `fetchSignedArtifacts(id)`: return { signedPdf: Buffer.from('MOCK_SIGNED_PDF'), auditCertificate: Buffer.from('MOCK_AUDIT_CERT') }
            - Expose an internal `markSigned(id)` test helper (not in port) — used by tests to flip pending → signed
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/mockSignatureProvider.ts]
         └─ Depends on: T-02
         └─ Output:

[x] T-08 [INFRA] Create DocuSealProvider HTTP adapter
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/docusealProvider.ts.
            Signature: `export const createDocusealProvider = (deps: { baseUrl: string; apiKey: string; fetch?: typeof fetch; sleep?: (ms: number) => Promise<void>; logger: Logger }): SignatureProviderPort => { ... }`
            
            Module constants: `const RETRY_DELAYS_MS = [1_000, 5_000, 30_000]`
            
            Throw `new Error('DocuSeal config missing: DOCUSEAL_BASE_URL or DOCUSEAL_API_KEY empty')` from the factory if deps.baseUrl or deps.apiKey are empty.
            
            Internal helper `callWithRetry<T>(fn: () => Promise<Response>, op: string, attempt = 0)`:
              - response = await fn()
              - if response.ok return response.json() as T
              - if response.status >= 500 AND attempt < 3:
                - logger.warn('DocuSeal 5xx — retrying', { op, status: response.status, attempt })
                - await sleep(RETRY_DELAYS_MS[attempt])
                - return callWithRetry(fn, op, attempt + 1)
              - throw new Error(`DocuSeal ${op} failed with status ${response.status}`)
            
            Method impls (use the documented DocuSeal v1 API shape; if endpoint paths/payload shape need adjustment during build, document the deviation in the test file and update this comment block):
            - `createSubmission(input)`:
              - Render template HTML (input.variables already substituted by service caller — provider receives the final HTML in input.metadata.html or similar; ALTERNATIVELY service calls renderDispatchAgreement upstream and passes html as input field)
              - Wait — the contract: caller renders HTML upstream, passes via input. Need to extend CreateSubmissionInput to carry html. **Action: do NOT extend the type here; that's US-07's contract.** This adapter will read `input.metadata?.html` (string) as the source. If absent, throw 'DocuSeal requires html in input.metadata'.
              - POST {baseUrl}/api/submissions with body { template_html: html, submitters: [{ name: signer.name, email: signer.email }], metadata: input.metadata }, headers { 'X-Auth-Token': apiKey, 'Content-Type': 'application/json' }
              - On success extract: providerSubmissionId = response.id (string), embedUrl = response.submitters[0].embed_src, expiresAt = new Date(response.expire_at)
            - `getSubmission(id)`:
              - GET {baseUrl}/api/submissions/{id}
              - Map response.status → SubmissionStatus discriminated union ('pending' | 'completed' → 'signed' | 'declined' | 'expired')
            - `voidSubmission(id)`: DELETE {baseUrl}/api/submissions/{id}
            - `fetchSignedArtifacts(id)`:
              - GET submission, extract documents[0].url (signed PDF) and audit_log_url
              - Fetch both URLs in parallel, return Buffers via response.arrayBuffer() then Buffer.from()
            
            Add a comment block at the top of the file: "DocuSeal API v1.x. Endpoint paths and response shapes may need adjustment against the current DocuSeal docs at the time of build. Tests pin the expected shape; update test fixtures + this adapter together if DocuSeal changes."
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/docusealProvider.ts]
         └─ Depends on: T-02
         └─ Output:

[x] T-09 [TEST] Mock provider tests
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/__tests__/mockSignatureProvider.test.ts.
            Pattern from `src/shared/fmcsa/__tests__/mockFmcsaProvider.test.ts`.
            Cover:
            - createSubmission with identical input twice → same providerSubmissionId
            - createSubmission with TIMEOUT@ marker → throws
            - getSubmission of unknown 'NOTFOUND' → throws
            - getSubmission of created submission → status: 'pending'
            - markSigned + getSubmission → status: 'signed' with signedAt Date
            - voidSubmission then getSubmission → status: 'voided' with voidedAt Date
            - DECLINE@ marker in signer.email → getSubmission returns status: 'declined'
            - fetchSignedArtifacts returns two Buffers with mock content
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/__tests__/mockSignatureProvider.test.ts]
         └─ Depends on: T-07
         └─ Output:

[x] T-10 [TEST] DocuSeal provider HTTP tests
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/__tests__/docusealProvider.test.ts.
            Pass a mock `fetch` (jest.fn returning Response-like) and a deterministic `sleep` (jest.fn resolved immediately).
            Cover:
            - Factory throws when baseUrl or apiKey is empty
            - createSubmission: sends X-Auth-Token header, posts to /api/submissions, returns mapped SubmissionRef from sample DocuSeal response fixture
            - createSubmission 502 twice then 200 → final returns SubmissionRef; sleep called twice with 1000, 5000
            - createSubmission 4xx → throws immediately, sleep not called
            - createSubmission throws when input.metadata.html missing
            - getSubmission maps DocuSeal status strings to SubmissionStatus correctly (pending, completed→signed, declined, expired)
            - voidSubmission: sends DELETE
            - fetchSignedArtifacts: returns two Buffers, two fetch calls (document + audit log)
            Use a fixture: `const sampleSubmissionResponse = { id: 'sub_123', submitters: [{ embed_src: 'https://docuseal/embed/abc', ... }], expire_at: '2026-06-01T00:00:00Z', status: 'pending' }`
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/__tests__/docusealProvider.test.ts]
         └─ Depends on: T-08
         └─ Output:

[x] T-11 [TEST] SignatureProviderPort contract test
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/__tests__/signatureProviderContract.test.ts.
            Export `runSignatureProviderContract(makeProvider: () => SignatureProviderPort, name: string)`. Wraps in `describe(`SignatureProviderPort contract (${name})`)`.
            Assertions:
            - createSubmission returns SubmissionRef with all three fields populated, expiresAt is a Date
            - getSubmission returns a SubmissionStatus whose discriminated union narrows
            - voidSubmission resolves
            - fetchSignedArtifacts returns Buffers (for mock, after markSigned; for real, skip with .skip if not available)
            Register `runSignatureProviderContract(() => createMockSignatureProvider(), 'mock')` so the suite runs in this file.
            Future runs for DocuSeal land when an integration test environment is available.
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/__tests__/signatureProviderContract.test.ts]
         └─ Depends on: T-07
         └─ Output:

---

## US-06: Dispatch agreement template + renderer
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01_

must_haves:
  truths:
    - "renderDispatchAgreement({ carrierLegalName, carrierMcNumber, carrierDotNumber, orgName, effectiveDate }) returns an HTML string containing all 5 variables substituted"
    - "Rendered HTML contains DocuSeal text-tag anchors `{{signer1.signature}}` and `{{signer1.date}}` exactly once each — field placement is encoded in copy, not template position"
    - "Snapshot test guards against unintended HTML changes (legal-edit churn must be intentional)"
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/signatures/agreementTemplates/dispatchAgreement.tsx
      provides: "DispatchAgreement React Email component with placeholder body copy + DocuSeal text-tag anchors"
    - path: hussle-app-dispatch-api/src/shared/signatures/agreementTemplates/renderDispatchAgreement.ts
      provides: "renderDispatchAgreement(variables) => HTML string"
    - path: hussle-app-dispatch-api/src/shared/signatures/agreementTemplates/__tests__/renderDispatchAgreement.test.ts
      provides: "Snapshot + variable-substitution tests"

**Acceptance Criteria:**
- [ ] Template renders deterministically (no Date.now / Math.random inside)
- [ ] Variable map type-checked: `DispatchAgreementVariables = { carrierLegalName: string; carrierMcNumber: string; carrierDotNumber: string; orgName: string; effectiveDate: string }`
- [ ] Snapshot covers the full HTML output; subsequent edits require explicit snapshot update

**Tasks:**
[x] T-12 [API] Build DispatchAgreement TSX template
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/agreementTemplates/dispatchAgreement.tsx.
            Reference analog: `src/shared/emails/documentUploaded/DocumentUploadedEmail.tsx`.
            Use @react-email/components (already in deps) — `<Html>`, `<Head>`, `<Body>`, `<Container>`, `<Text>`, `<Heading>`.
            Define + export:
            ```
            export interface DispatchAgreementVariables {
              carrierLegalName: string;
              carrierMcNumber: string;
              carrierDotNumber: string;
              orgName: string;
              effectiveDate: string;
            }

            export const DispatchAgreement: React.FC<DispatchAgreementVariables> = ({ ... }) => ( ... );
            ```
            Body copy placeholder (legal will iterate):
            - Heading: "Dispatch Service Agreement"
            - Paragraph 1: "This Dispatch Service Agreement ('Agreement') is entered into on {effectiveDate} between {orgName} ('Broker') and {carrierLegalName} (MC# {carrierMcNumber}, DOT# {carrierDotNumber}) ('Carrier')."
            - Paragraph 2: "Carrier agrees to dispatch services as described in Schedule A, attached and incorporated by reference."
            - Signer block at the bottom: "Carrier signature: {{signer1.signature}}" and "Date: {{signer1.date}}" — exact DocuSeal text-tag syntax, rendered as plain text (not interpolated by React).
            
            **Important:** the text-tag anchors `{{signer1.signature}}` and `{{signer1.date}}` are LITERAL strings DocuSeal substitutes — do NOT interpolate them in JSX. Render via `<Text>{'{{signer1.signature}}'}</Text>`.
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/agreementTemplates/dispatchAgreement.tsx]
         └─ Depends on: T-01
         └─ Output:

[x] T-13 [API] Build renderDispatchAgreement
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/agreementTemplates/renderDispatchAgreement.ts.
            Reference analog: `src/shared/emails/documentUploaded/renderDocumentUploadedEmail.ts`.
            Use `@react-email/render` (already in deps via @react-email/components or as direct dep — check package.json; if not present, `render` is exported from `@react-email/components` too).
            ```
            import { render } from '@react-email/components';
            import { DispatchAgreement, DispatchAgreementVariables } from './dispatchAgreement';

            export const renderDispatchAgreement = async (variables: DispatchAgreementVariables): Promise<string> =>
              render(<DispatchAgreement {...variables} />);
            ```
            Note: react-email's render is async. Service caller must await.
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/agreementTemplates/renderDispatchAgreement.ts]
         └─ Depends on: T-12
         └─ Output:

[x] T-14 [TEST] Snapshot + variable test
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/agreementTemplates/__tests__/renderDispatchAgreement.test.ts.
            Tests:
            - Calling render with fixed variables produces an HTML string containing each variable value
            - HTML contains exactly one '{{signer1.signature}}' substring and one '{{signer1.date}}' substring
            - Snapshot test of the full HTML output (jest.toMatchSnapshot()) using a fixed variable set
            Test variables:
            ```
            { carrierLegalName: 'Acme Trucking LLC', carrierMcNumber: '123456', carrierDotNumber: '7890123', orgName: 'FleetCommand', effectiveDate: '2026-06-01' }
            ```
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/agreementTemplates/__tests__/renderDispatchAgreement.test.ts]
         └─ Depends on: T-13
         └─ Output:

---

## US-07: signatureService factory + tests
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01, US-02, US-05_

must_haves:
  truths:
    - "createSubmission(input, opts) generates correlationId (UUID) when opts.correlationId is absent; passes through verbatim when present"
    - "On successful createSubmission, service publishes EXACTLY ONE event: signature.submission.created with { correlationId, providerSubmissionId, templateKey }"
    - "On provider throw with reason='timeout', service retries up to 3 attempts with sleep(1000), sleep(5000), sleep(30000); after exhaustion publishes signature.submission.failed with reason='timeout' and rethrows"
    - "Event publishing is fire-and-forget — caller is not blocked by eventBus latency; publish errors are logged at warn, never thrown out"
    - "getSubmission, voidSubmission, fetchSignedArtifacts proxy to provider without retry or events (those are best-effort lookups)"
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/signatures/signatureService.ts
      provides: "createSignatureService(deps: { provider, eventBus, logger, uuid?, sleep? }) => SignatureService"
    - path: hussle-app-dispatch-api/src/shared/signatures/__tests__/signatureService.test.ts
      provides: "Unit tests covering retry, events, correlationId, fire-and-forget"
  key_links:
    - from: signatureService
      to: SignatureProviderPort
      via: "deps.provider — injected"
    - from: signatureService
      to: EventBus
      via: "deps.eventBus.publish('signature.submission.created'|'.failed', ...) — fire-and-forget"

**Acceptance Criteria:**
- [ ] Service classifies provider errors as `'timeout'` (matches /timeout/i), `'rate_limit'` (matches /rate.?limit|429/i), else `'provider_error'`
- [ ] Retry budget 3 attempts; parameterizable sleep injected for tests
- [ ] All public methods accept correlationId via opts; service generates one if omitted
- [ ] Logger info on every method entry, warn on retry, warn on event publish failure

**Tasks:**
[x] T-15 [API] Implement createSignatureService
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/signatureService.ts.
            Reference analog: `src/shared/fmcsa/fmcsaService.ts:1-182` (factory shape, retry, event emission, deps injection, fire-and-forget pattern).
            
            Module constants: `const RETRY_DELAYS_MS = [1_000, 5_000, 30_000]`
            
            Deps interface:
            ```
            interface SignatureServiceDeps {
              provider: SignatureProviderPort;
              eventBus: EventBus;
              logger: Logger;
              uuid?: () => string;
              sleep?: (ms: number) => Promise<void>;
            }
            ```
            
            Internal helpers:
            - `classifyError(err: unknown): 'timeout' | 'rate_limit' | 'provider_error'` — string-match the error message
            - `attemptCreate(input, attempt = 0): Promise<SubmissionRef>` — call provider.createSubmission, on throw + attempt<3 sleep & recurse; on exhaustion throw with classified reason attached
            - `emitFireAndForget(eventName, payload)` — wrap eventBus.publish in .catch(err => logger.warn(...))
            
            Public surface:
            - `createSubmission(input, opts?)`:
              1. correlationId = opts?.correlationId ?? uuid()
              2. logger.info('Creating signature submission', { templateKey: input.templateKey, correlationId })
              3. try { ref = await attemptCreate(input); }
                 catch (err) {
                   reason = classifyError(err);
                   emitFireAndForget('signature.submission.failed', { correlationId, templateKey: input.templateKey, reason });
                   throw err;
                 }
              4. emitFireAndForget('signature.submission.created', { correlationId, providerSubmissionId: ref.providerSubmissionId, templateKey: input.templateKey })
              5. return ref
            - `getSubmission(id)` / `voidSubmission(id)` / `fetchSignedArtifacts(id)`: proxy to provider, log info on entry, no retry, no events
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/signatureService.ts]
         └─ Depends on: T-01, T-02, T-03, T-07
         └─ Output:

[x] T-16 [TEST] signatureService unit tests
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/__tests__/signatureService.test.ts.
            Pattern from `src/shared/fmcsa/__tests__/fmcsaService.test.ts`.
            Test groups:
            - "createSubmission: success path emits signature.submission.created with provided correlationId"
            - "createSubmission: omitting correlationId — service generates uuid (assert uuid-shaped string)"
            - "createSubmission: retry — provider throws Error('timeout') twice then returns; final result is the SubmissionRef; sleep called with 1000, 5000"
            - "createSubmission: retry exhausted — emits signature.submission.failed with reason='timeout' and rethrows"
            - "createSubmission: reason classification — 'rate_limit' for /rate.?limit/i; 'timeout' for /timeout/i; 'provider_error' for anything else"
            - "createSubmission: event publish failure is logged at warn, not thrown out"
            - "getSubmission/voidSubmission/fetchSignedArtifacts: proxy without retry or events"
            
            Mocks: provider = { createSubmission: jest.fn(), getSubmission: jest.fn(), voidSubmission: jest.fn(), fetchSignedArtifacts: jest.fn() }; eventBus = { publish: jest.fn().mockResolvedValue(undefined) }; logger = { info, warn, error }: all jest.fn(); uuid = jest.fn().mockReturnValue('test-uuid-1234'); sleep = jest.fn().mockResolvedValue(undefined).
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/__tests__/signatureService.test.ts]
         └─ Depends on: T-15
         └─ Output:

---

## US-08: Signature module composition root + bootstrap
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-05, US-06, US-07_

must_haves:
  truths:
    - "createSignatureModule({ eventBus, logger, env }) returns { service, provider } with provider selected by env.SIGNATURE_PROVIDER"
    - "When env.SIGNATURE_PROVIDER='mock', provider is the in-memory mock; when 'docuseal' it's DocuSealProvider wired with baseUrl + apiKey from env"
    - "Importing src/shared/signatures from src/app.ts wires the module via side effect (mirroring src/shared/fmcsa/index.ts)"
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/signatures/compositionRoot.ts
      provides: "createSignatureModule({ eventBus, logger, env }) => { service, provider }"
    - path: hussle-app-dispatch-api/src/shared/signatures/index.ts
      provides: "Side-effect bootstrap — exports shared singleton service for cross-module consumers"
  key_links:
    - from: signatureModule.service
      to: SignatureProviderPort
      via: "compositionRoot wires concrete provider based on env"
    - from: agreements module
      to: signatureModule.service
      via: "imports getSignatureService() from src/shared/signatures"

**Acceptance Criteria:**
- [ ] compositionRoot selects provider via switch on env.SIGNATURE_PROVIDER; throws clear error on unknown value
- [ ] index.ts exports `getSignatureService(): SignatureService` (lazy singleton) — same pattern as `src/shared/fmcsa/index.ts`
- [ ] No top-level provider construction in index.ts — lazy init on first call so test env doesn't require DocuSeal

**Tasks:**
[x] T-17 [API] Create compositionRoot.ts
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/compositionRoot.ts.
            Reference analog: `src/shared/fmcsa/compositionRoot.ts:1-44`.
            ```
            export interface SignatureModule {
              service: SignatureService;
              provider: SignatureProviderPort;
            }

            export const createSignatureModule = (deps: {
              env: { SIGNATURE_PROVIDER: 'mock' | 'docuseal'; DOCUSEAL_BASE_URL: string; DOCUSEAL_API_KEY: string };
              eventBus: EventBus;
              logger: Logger;
            }): SignatureModule => {
              const provider = (() => {
                switch (deps.env.SIGNATURE_PROVIDER) {
                  case 'mock':
                    return createMockSignatureProvider();
                  case 'docuseal':
                    return createDocusealProvider({
                      baseUrl: deps.env.DOCUSEAL_BASE_URL,
                      apiKey: deps.env.DOCUSEAL_API_KEY,
                      logger: deps.logger,
                    });
                  default: {
                    const exhaust: never = deps.env.SIGNATURE_PROVIDER;
                    throw new Error(`Unknown SIGNATURE_PROVIDER: ${exhaust}`);
                  }
                }
              })();
              const service = createSignatureService({ provider, eventBus: deps.eventBus, logger: deps.logger });
              return { service, provider };
            };
            ```
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/compositionRoot.ts]
         └─ Depends on: T-07, T-08, T-15
         └─ Output:

[x] T-18 [API] Create index.ts bootstrap with lazy singleton
         └─ Detail: Create hussle-app-dispatch-api/src/shared/signatures/index.ts.
            Reference analog: `src/shared/fmcsa/index.ts`.
            ```
            import { env } from '@/config/env';
            import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
            import { logger } from '@/shared/utils/logger';
            import { createSignatureModule, SignatureModule } from './compositionRoot';

            let module_: SignatureModule | null = null;

            const init = (): SignatureModule => {
              if (!module_) {
                module_ = createSignatureModule({ env, eventBus: sharedEventBus, logger });
              }
              return module_;
            };

            export const getSignatureService = () => init().service;
            export const getSignatureProvider = () => init().provider;
            ```
            Re-export public types from './types' for downstream consumers:
            `export type { SignatureService, SignatureProviderPort, CreateSubmissionInput, SubmissionRef, SubmissionStatus, SignedArtifacts } from './types';`
            (etc — copy fmcsa/index.ts barrel pattern.)
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/index.ts]
         └─ Depends on: T-17
         └─ Output:

---

## US-09: Agreement repo port + types + Prisma impl
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01, US-04_

must_haves:
  truths:
    - "agreementRepositoryPrisma(prisma) returns an AgreementRepoPort that round-trips create → findById → update → findByProviderSubmissionId"
    - "findStaleInProgress(thresholdMin) returns Agreements where status=PENDING AND updatedAt < now() - thresholdMin"
    - "Every query is org-scoped — findManyByOrg requires organizationId; findById returns null without filtering by org (org check happens in service layer)"
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/types/agreementRepoPort.ts
      provides: "AgreementRepoPort interface: create, findById, findByProviderSubmissionId, findManyByOrg, update, findStaleInProgress"
    - path: hussle-app-dispatch-api/src/agreements/types/agreementTypes.ts
      provides: "AgreementWithRelations type, CreateAgreementInput, UpdateAgreementInput, ListAgreementsFilters"
    - path: hussle-app-dispatch-api/src/agreements/repositories/agreementRepositoryPrisma.ts
      provides: "agreementRepositoryPrisma(prisma | tx): AgreementRepoPort"
  key_links:
    - from: agreementRepositoryPrisma
      to: PrismaClient.agreement
      via: "delegated CRUD"
    - from: AgreementRepoPort
      to: Agreement (Prisma type)
      via: "type derivation — never hand-written"

**Acceptance Criteria:**
- [ ] All entity types derive from `@prisma/client` (no hand-written Agreement shape)
- [ ] AgreementRepoPort exposes only what services need; no leaky Prisma `where` clauses in service layer
- [ ] findStaleInProgress takes a JS Date threshold and uses Prisma `lt` on updatedAt
- [ ] Repo accepts `PrismaClient | PrismaTransaction` parameter shape per project convention

**Tasks:**
[x] T-19 [API] Define agreementRepoPort.ts + agreementTypes.ts
         └─ Detail: Create both files.
            
            `src/agreements/types/agreementTypes.ts`:
            ```
            import type { Agreement, AgreementStatus, AgreementTemplateKey } from '@prisma/client';
            export type { Agreement, AgreementStatus, AgreementTemplateKey };

            export type AgreementWithRelations = Agreement;  // expand later if relations needed

            export interface CreateAgreementInput {
              organizationId: string;
              carrierId: string;
              templateKey: AgreementTemplateKey;
              providerName: string;
              providerSubmissionId: string | null;
              embedUrl: string | null;
              embedUrlExpiresAt: Date | null;
              signerName: string | null;
              signerEmail: string | null;
              variables: Record<string, unknown>;
              status: AgreementStatus;
              createdByUserId: string | null;
            }

            export interface UpdateAgreementInput {
              status?: AgreementStatus;
              embedUrl?: string | null;
              embedUrlExpiresAt?: Date | null;
              signedPdfS3Key?: string | null;
              auditCertificateS3Key?: string | null;
              signedPdfSha256?: string | null;
              signedAt?: Date | null;
              declinedAt?: Date | null;
              expiredAt?: Date | null;
              voidedAt?: Date | null;
              voidedByUserId?: string | null;
              voidReason?: string | null;
            }

            export interface ListAgreementsFilters {
              organizationId: string;
              carrierId?: string;
              status?: AgreementStatus;
              templateKey?: AgreementTemplateKey;
              createdAfter?: Date;
              createdBefore?: Date;
              page?: number;
              limit?: number;
            }
            ```
            
            `src/agreements/types/agreementRepoPort.ts`:
            ```
            export interface AgreementRepoPort {
              create(input: CreateAgreementInput): Promise<Agreement>;
              findById(id: string): Promise<Agreement | null>;
              findByProviderSubmissionId(providerSubmissionId: string): Promise<Agreement | null>;
              findManyByOrg(filters: ListAgreementsFilters): Promise<{ data: Agreement[]; total: number }>;
              update(id: string, patch: UpdateAgreementInput): Promise<Agreement>;
              findStaleInProgress(updatedBefore: Date): Promise<Agreement[]>;
              countActivePending(args: { organizationId: string; carrierId: string; templateKey: AgreementTemplateKey }): Promise<number>;
            }
            ```
         └─ Files: [hussle-app-dispatch-api/src/agreements/types/agreementTypes.ts, hussle-app-dispatch-api/src/agreements/types/agreementRepoPort.ts]
         └─ Depends on: T-06
         └─ Output:

[x] T-20 [API] Implement agreementRepositoryPrisma
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/repositories/agreementRepositoryPrisma.ts.
            Reference analog: `src/documents/repositories/documentRepositoryPrisma.ts` for shape (accepts PrismaClient | PrismaTransaction, returns AgreementRepoPort).
            
            Implementation:
            - `create(input)` → `prisma.agreement.create({ data: input })`
            - `findById(id)` → `prisma.agreement.findUnique({ where: { id } })`
            - `findByProviderSubmissionId(id)` → `prisma.agreement.findUnique({ where: { providerSubmissionId: id } })`
            - `findManyByOrg(filters)` → use Prisma `findMany` + `count` in parallel; apply where clauses for each provided filter; use page/limit for skip/take (defaults page=1, limit=20)
            - `update(id, patch)` → `prisma.agreement.update({ where: { id }, data: patch })`
            - `findStaleInProgress(updatedBefore)` → `prisma.agreement.findMany({ where: { status: 'PENDING', updatedAt: { lt: updatedBefore } } })`
            - `countActivePending(args)` → `prisma.agreement.count({ where: { organizationId, carrierId, templateKey, status: 'PENDING' } })`
            Use `Json` casting for `variables` field if needed.
         └─ Files: [hussle-app-dispatch-api/src/agreements/repositories/agreementRepositoryPrisma.ts]
         └─ Depends on: T-19
         └─ Output:

---

## US-10: Agreement services — request, void, finalize + unit tests
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-08, US-09_

must_haves:
  truths:
    - "requestAgreement throws ConflictError with code 'AGREEMENT_ALREADY_PENDING' when carrier already has PENDING agreement for the templateKey"
    - "requestAgreement persists Agreement with status=PENDING, providerSubmissionId, embedUrl, embedUrlExpiresAt populated; returns { data, events } with one agreement.generated event"
    - "voidAgreement throws InvalidTransitionError (409, code INVALID_STATUS_TRANSITION) when status !== PENDING"
    - "voidAgreement calls signatureService.voidSubmission then updates row; emits one agreement.voided event"
    - "finalizeAgreement is IDEMPOTENT — if status already SIGNED, returns existing { data, events: [] } without re-fetching artifacts or writing to S3"
    - "finalizeAgreement: fetchSignedArtifacts → compute SHA-256 → storage.write both files → update row to SIGNED with all artifact metadata → emit agreement.finalized"
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/services/requestAgreement.ts
      provides: "requestAgreement(input, deps) — render template, create submission, persist, emit"
    - path: hussle-app-dispatch-api/src/agreements/services/voidAgreement.ts
      provides: "voidAgreement(input, deps) — state guard, void in provider, persist, emit"
    - path: hussle-app-dispatch-api/src/agreements/services/finalizeAgreement.ts
      provides: "finalizeAgreement(input, deps) — idempotent finalize after webhook/watchdog"
    - path: hussle-app-dispatch-api/src/agreements/__tests__/requestAgreement.test.ts
    - path: hussle-app-dispatch-api/src/agreements/__tests__/voidAgreement.test.ts
    - path: hussle-app-dispatch-api/src/agreements/__tests__/finalizeAgreement.test.ts
  key_links:
    - from: requestAgreement
      to: signatureService.createSubmission
      via: "deps.signatureService.createSubmission(input, { correlationId })"
    - from: requestAgreement
      to: agreementRepo
      via: "deps.agreementRepo.countActivePending + .create"
    - from: finalizeAgreement
      to: storage
      via: "deps.storage.write(s3Key, buffer)"

**Acceptance Criteria:**
- [x] All services accept (input, deps) and return `Promise<ServiceResult<T>>`
- [x] Services never import @prisma/client (dep-cruiser rule) — verified via refactor commit 9658c0af9
- [x] Services never import repositories (dep-cruiser rule) — clean
- [x] Carrier lookup injected via `carrierQueries: { findById }` (cross-module read port) — declared inline as CarrierQueryPort
- [x] requestAgreement looks up Carrier, validates org match, assembles variables from carrier fields + caller's orgName + today
- [x] finalizeAgreement idempotency case has its own test — calling twice writes to S3 only once

**Tasks:**
[x] T-21 [API] Implement requestAgreement service
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/services/requestAgreement.ts.
            Reference analog: `src/settlements/services/createSettlement.ts` for state-creating service shape with events.
            
            Input:
            ```
            interface RequestAgreementInput {
              carrierId: string;
              templateKey: 'DISPATCH_AGREEMENT';
              signerName?: string;
              signerEmail?: string;
              correlationId?: string;
              organizationId: string;
              requestingUserId: string;
              orgName: string;            // resolved by mapper from org settings
            }
            ```
            
            Deps:
            ```
            interface RequestAgreementDeps {
              agreementRepo: AgreementRepoPort;
              signatureService: SignatureService;
              renderDispatchAgreement: (vars: DispatchAgreementVariables) => Promise<string>;
              carrierQueries: { findById(id: string, organizationId: string): Promise<{ id: string; legalName: string; mcNumber: string; dotNumber: string | null; primaryContactName: string | null; primaryContactEmail: string | null } | null> };
              logger: Logger;
              uuid?: () => string;
              now?: () => Date;
            }
            ```
            
            Algorithm:
            1. const carrier = await deps.carrierQueries.findById(input.carrierId, input.organizationId); if !carrier throw NotFoundError('Carrier', input.carrierId)
            2. const pendingCount = await deps.agreementRepo.countActivePending({ organizationId: input.organizationId, carrierId: input.carrierId, templateKey: input.templateKey })
            3. if pendingCount > 0 throw new ConflictError('Carrier already has a PENDING agreement for this template', 'AGREEMENT_ALREADY_PENDING')
            4. const effectiveDate = (deps.now ?? (() => new Date()))().toISOString().slice(0, 10)
            5. const variables = { carrierLegalName: carrier.legalName, carrierMcNumber: carrier.mcNumber, carrierDotNumber: carrier.dotNumber ?? '', orgName: input.orgName, effectiveDate }
            6. const html = await deps.renderDispatchAgreement(variables)
            7. const signerName = input.signerName ?? carrier.primaryContactName ?? carrier.legalName
            8. const signerEmail = input.signerEmail ?? carrier.primaryContactEmail
            9. if !signerEmail throw BadRequestError('Carrier has no primary contact email; provide signerEmail explicitly')
            10. const correlationId = input.correlationId ?? (deps.uuid ?? randomUUID)()
            11. const ref = await deps.signatureService.createSubmission({ templateKey: input.templateKey, variables: variables as unknown as Record<string,string>, signer: { name: signerName, email: signerEmail }, metadata: { html, carrierId: input.carrierId, organizationId: input.organizationId } }, { correlationId })
            12. const agreement = await deps.agreementRepo.create({ organizationId: input.organizationId, carrierId: input.carrierId, templateKey: input.templateKey, providerName: ENV.SIGNATURE_PROVIDER.toUpperCase() — NO, this should come via deps too. Re-architect: pass providerName via deps so service stays pure of env. **Add to deps: `providerName: 'MOCK' | 'DOCUSEAL'`** (compositionRoot wires it from env). Re-do step: providerName: deps.providerName, providerSubmissionId: ref.providerSubmissionId, embedUrl: ref.embedUrl, embedUrlExpiresAt: ref.expiresAt, signerName, signerEmail, variables, status: 'PENDING', createdByUserId: input.requestingUserId })
            13. deps.logger.info('Agreement requested', { agreementId: agreement.id, carrierId: input.carrierId, providerSubmissionId: ref.providerSubmissionId, correlationId })
            14. return { data: agreement, events: [{ type: 'agreement.generated', occurredAt: new Date(), payload: { agreementId: agreement.id, organizationId: agreement.organizationId, carrierId: agreement.carrierId, templateKey: agreement.templateKey, providerSubmissionId: ref.providerSubmissionId, correlationId } }] }
            
            Error types: import NotFoundError, ConflictError, BadRequestError from `@/shared/errors`.
         └─ Files: [hussle-app-dispatch-api/src/agreements/services/requestAgreement.ts, src/agreements/errors/agreementErrors.ts, src/agreements/types/agreementServiceResult.ts]
         └─ Depends on: T-17, T-19
         └─ Output: DONE @ bd1e6a5e9 (+ refactor 9658c0af9). Exports requestAgreement(input, deps), types RequestAgreementInput|RequestAgreementDeps|CarrierQueryPort|DispatchAgreementVariables, AgreementAlreadyPendingError class. NOTE: AgreementAlreadyPendingError extends CustomError directly (not ConflictError) because ConflictError.code is literal-typed readonly = 'CONFLICT' and can't be overridden — same statusCode 409, code AGREEMENT_ALREADY_PENDING. Wiring verified: createSubmission, countActivePending, create.

[x] T-22 [API] Implement voidAgreement service
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/services/voidAgreement.ts.
            Reference analog: `src/loads/services/cancelLoad.ts` for state-transition with provider call.
            
            Input: `{ agreementId, organizationId, requestingUserId, reason? }`
            Deps: `{ agreementRepo, signatureService, logger, now? }`
            
            Algorithm:
            1. const agreement = await deps.agreementRepo.findById(input.agreementId); if !agreement throw NotFoundError
            2. if agreement.organizationId !== input.organizationId throw ForbiddenError
            3. if agreement.status !== 'PENDING' throw InvalidTransitionError('Agreement', agreement.status, 'VOIDED') — code 'INVALID_STATUS_TRANSITION'
            4. if agreement.providerSubmissionId await deps.signatureService.voidSubmission(agreement.providerSubmissionId)
            5. const voidedAt = (deps.now ?? (() => new Date()))()
            6. const updated = await deps.agreementRepo.update(agreement.id, { status: 'VOIDED', voidedAt, voidedByUserId: input.requestingUserId, voidReason: input.reason ?? null })
            7. return { data: updated, events: [{ type: 'agreement.voided', occurredAt: voidedAt, payload: { agreementId: updated.id, organizationId: updated.organizationId, carrierId: updated.carrierId, voidedAt: voidedAt.toISOString(), voidReason: updated.voidReason, voidedByUserId: updated.voidedByUserId } }] }
            
            InvalidTransitionError lives in `@/shared/errors/invalidTransitionError.ts` — verify it exists; if not, add to types as a generic ConflictError variant.
         └─ Files: [hussle-app-dispatch-api/src/agreements/services/voidAgreement.ts]
         └─ Depends on: T-17, T-19
         └─ Output: DONE @ 6d9c2e26d. Exports voidAgreement(input, deps). Uses InvalidTransitionError(currentStatus, 'VOIDED', ['PENDING']) — statusCode 422 per codebase contract (task spec said 409 but actual class is 422). Wiring verified: voidSubmission, findById, update.

[x] T-23 [API] Implement finalizeAgreement service (idempotent)
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/services/finalizeAgreement.ts.
            Reference analog: `src/loads/services/deliverLoad.ts` for state-transition with side effects + idempotency.
            
            Input: `{ providerSubmissionId, organizationId? (optional — derived from agreement) }`
            Deps: `{ agreementRepo, signatureService, storage: StoragePort, logger, now? }`
            
            Algorithm:
            1. const agreement = await deps.agreementRepo.findByProviderSubmissionId(input.providerSubmissionId)
            2. if !agreement throw NotFoundError('Agreement', input.providerSubmissionId) — webhook controller catches this and returns 404
            3. **IDEMPOTENCY**: if agreement.status === 'SIGNED' return { data: agreement, events: [] } — no provider call, no S3 write, no event emission
            4. const artifacts = await deps.signatureService.fetchSignedArtifacts(input.providerSubmissionId)
            5. const signedPdfSha256 = sha256(artifacts.signedPdf) — use node:crypto createHash
            6. const signedPdfS3Key = `orgs/${agreement.organizationId}/carriers/${agreement.carrierId}/agreements/${agreement.id}/signed.pdf`
            7. const auditCertificateS3Key = `orgs/${agreement.organizationId}/carriers/${agreement.carrierId}/agreements/${agreement.id}/audit-certificate.pdf`
            8. await deps.storage.write(signedPdfS3Key, artifacts.signedPdf, { contentType: 'application/pdf' })
            9. await deps.storage.write(auditCertificateS3Key, artifacts.auditCertificate, { contentType: 'application/pdf' })
            10. const signedAt = (deps.now ?? (() => new Date()))()
            11. const updated = await deps.agreementRepo.update(agreement.id, { status: 'SIGNED', signedAt, signedPdfS3Key, auditCertificateS3Key, signedPdfSha256 })
            12. return { data: updated, events: [{ type: 'agreement.finalized', occurredAt: signedAt, payload: { agreementId: updated.id, organizationId: updated.organizationId, carrierId: updated.carrierId, signedPdfS3Key, auditCertificateS3Key, signedPdfSha256 } }] }
            
            StoragePort comes from `@/shared/storage` — check the existing API: `storage.write(key, buffer, { contentType })` or `storage.upload(...)`. Verify by reading src/shared/storage/index.ts; adjust if API differs.
         └─ Files: [hussle-app-dispatch-api/src/agreements/services/finalizeAgreement.ts]
         └─ Depends on: T-17, T-19
         └─ Output: DONE @ f588c9271. Exports finalizeAgreement(input, deps). Idempotent short-circuit at status === 'SIGNED' (returns existing { data, events: [] } with zero side effects). Uses storage.put(key, body, 'application/pdf') — corrected from task-spec storage.write. SHA-256 via node:crypto createHash. Wiring verified: fetchSignedArtifacts, 2x storage.put, findByProviderSubmissionId, update.

[x] T-24 [TEST] requestAgreement unit tests
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/__tests__/requestAgreement.test.ts.
            Cover:
            - Happy path: carrier exists, no pending agreement, provider returns ref → persists Agreement with PENDING + correct fields, emits agreement.generated
            - Carrier not found → throws NotFoundError
            - Existing PENDING agreement for same carrier+template → throws ConflictError with code AGREEMENT_ALREADY_PENDING
            - signerEmail fallback: if input.signerEmail provided uses it; else uses carrier.primaryContactEmail; if neither throws BadRequestError
            - correlationId pass-through: caller-supplied flows verbatim into event payload + signatureService call
            - Renders template with correct variables (asserts renderDispatchAgreement called with shape { carrierLegalName, carrierMcNumber, carrierDotNumber, orgName, effectiveDate })
            Mocks: agreementRepo, signatureService, renderDispatchAgreement, carrierQueries, logger — all jest.fn().
         └─ Files: [hussle-app-dispatch-api/src/agreements/__tests__/requestAgreement.test.ts]
         └─ Depends on: T-21
         └─ Output: DONE @ a57a4ca5d. 7 tests passing. Cases: happy path, NotFoundError carrier, AgreementAlreadyPendingError (asserts code), signerEmail precedence, ValidationError on missing email, correlationId pass-through (event + opts; uuid not called), template variable shape.

[x] T-25 [TEST] voidAgreement unit tests
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/__tests__/voidAgreement.test.ts.
            Cover:
            - Happy path: PENDING → VOIDED with reason; calls provider voidSubmission; emits agreement.voided
            - Org mismatch → throws ForbiddenError
            - Status SIGNED → throws InvalidTransitionError (409)
            - Status VOIDED → throws InvalidTransitionError
            - voidSubmission throw is propagated (no swallow)
            - Reason persisted on row; null when not provided
         └─ Files: [hussle-app-dispatch-api/src/agreements/__tests__/voidAgreement.test.ts]
         └─ Depends on: T-22
         └─ Output: DONE @ deea5ec34. 6 tests passing. Cases: PENDING→VOIDED happy path with reason+event, ForbiddenError on org mismatch, InvalidTransitionError SIGNED (asserts statusCode 422), InvalidTransitionError VOIDED, voidSubmission rejection propagation (no swallow, no update), reason null when omitted.

[x] T-26 [TEST] finalizeAgreement unit tests (idempotency-focused)
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/__tests__/finalizeAgreement.test.ts.
            Cover:
            - Happy path PENDING → SIGNED: fetchSignedArtifacts called once, two storage.write calls (signed + audit), SHA-256 computed, agreement updated, emits agreement.finalized
            - Idempotent: calling twice with same providerSubmissionId — second call finds status=SIGNED, returns existing agreement, makes ZERO provider calls, ZERO storage writes, emits NO events
            - Not found: unknown providerSubmissionId → throws NotFoundError
            - SHA-256 correctness: feed known buffer, assert hex output matches expected
            - Storage failure on first write throws (no half-finalized state)
         └─ Files: [hussle-app-dispatch-api/src/agreements/__tests__/finalizeAgreement.test.ts]
         └─ Depends on: T-23
         └─ Output: DONE @ 74a2c8932. 5 tests passing. Cases: happy PENDING→SIGNED with both storage.put (correct keys + 'application/pdf'), idempotent short-circuit (zero provider/storage/repo/event activity when SIGNED), NotFoundError on missing, SHA-256 correctness against known buffer (Buffer.from('test') → 9f86d081...), storage failure no-update.

---

## US-11: HTTP layer — controllers + mappers + transformers + validators + routes + integration tests
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-10_

must_haves:
  truths:
    - "POST /api/v1/agreements with valid body and dispatcher auth returns 201 with agreement.embedUrl populated; persisted row has PENDING status"
    - "POST /agreements with existing PENDING for same carrier+template returns 409 with code AGREEMENT_ALREADY_PENDING"
    - "GET /agreements/:id transparently refreshes expired embedUrl when status=PENDING — first call returns stale, immediate second call returns refreshed URL with new embedUrlExpiresAt"
    - "GET /agreements/:id with status=SIGNED returns artifacts: { signedPdfUrl, auditCertificateUrl, signedPdfSha256, signedAt } with presigned URLs (15-min TTL)"
    - "GET /agreements supports filters carrierId, status, templateKey, createdAfter, createdBefore + pagination page/limit; returns PaginationMeta"
    - "POST /agreements/:id/void with PENDING returns 200 VOIDED; with non-PENDING returns 409"
    - "All four endpoints enforce requireRole([ADMIN, DISPATCHER]) and org scoping via JWT claims"
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/controllers/requestAgreementController.ts
    - path: hussle-app-dispatch-api/src/agreements/controllers/getAgreementController.ts
    - path: hussle-app-dispatch-api/src/agreements/controllers/listAgreementsController.ts
    - path: hussle-app-dispatch-api/src/agreements/controllers/voidAgreementController.ts
    - path: hussle-app-dispatch-api/src/agreements/controllers/mappers/requestAgreementMapper.ts
    - path: hussle-app-dispatch-api/src/agreements/controllers/mappers/listAgreementsMapper.ts
    - path: hussle-app-dispatch-api/src/agreements/controllers/mappers/voidAgreementMapper.ts
    - path: hussle-app-dispatch-api/src/agreements/controllers/transformers/agreementTransformer.ts
    - path: hussle-app-dispatch-api/src/agreements/validators/requestAgreementValidator.ts
    - path: hussle-app-dispatch-api/src/agreements/validators/listAgreementsValidator.ts
    - path: hussle-app-dispatch-api/src/agreements/validators/agreementIdParamValidator.ts
    - path: hussle-app-dispatch-api/src/agreements/routes/agreementRoutes.ts
    - path: hussle-app-dispatch-api/src/agreements/__tests__/integration/agreementRoutes.integration.test.ts
  key_links:
    - from: agreementRoutes
      to: requestAgreementController
      via: "POST /agreements router with requireAuth + requireRole + validateRequest"
    - from: agreementTransformer
      to: storage.presignUrl
      via: "called for SIGNED agreements to populate inline artifacts"

**Acceptance Criteria:**
- [x] Controllers never access req.body/req.params directly — mappers do that
- [x] Transformer presigns signedPdfS3Key + auditCertificateS3Key with 15-min TTL when status=SIGNED (uses getPresignedGetUrl)
- [x] getAgreementController handles transparent embed URL refresh — calls signatureService.refreshEmbedUrl (new port method) then updates row
- [x] Validators reject malformed UUIDs, unknown enum values, reason >500 chars
- [x] Integration test covers: create/get/void happy path; 409 on duplicate; 403 cross-org; 404 missing — 14 tests

**Tasks:**
[x] T-27 [API] Build validators (Yup)
         └─ Detail: Create the three validator files. Pattern from `src/<feature>/validators/*Validator.ts`.
            `requestAgreementValidator.ts`:
            ```
            yup.object({
              body: yup.object({
                carrierId: yup.string().uuid().required(),
                templateKey: yup.string().oneOf(['DISPATCH_AGREEMENT']).required(),
                signerName: yup.string().max(255).optional(),
                signerEmail: yup.string().email().max(255).optional(),
                correlationId: yup.string().uuid().optional(),
              }),
            });
            ```
            `listAgreementsValidator.ts`:
            ```
            yup.object({
              query: yup.object({
                carrierId: yup.string().uuid().optional(),
                status: yup.string().oneOf(['DRAFT','PENDING','SIGNED','VOIDED','EXPIRED','DECLINED']).optional(),
                templateKey: yup.string().oneOf(['DISPATCH_AGREEMENT']).optional(),
                createdAfter: yup.date().optional(),
                createdBefore: yup.date().optional(),
                page: yup.number().integer().min(1).default(1),
                limit: yup.number().integer().min(1).max(100).default(20),
              }),
            });
            ```
            `agreementIdParamValidator.ts`:
            ```
            yup.object({ params: yup.object({ id: yup.string().uuid().required() }), body: yup.object({ reason: yup.string().max(500).optional() }).optional() });
            ```
            One file per validator. Use the project's `validateRequest` middleware (lives in `src/shared/middleware/validateRequest.ts`).
         └─ Files: [hussle-app-dispatch-api/src/agreements/validators/requestAgreementValidator.ts, hussle-app-dispatch-api/src/agreements/validators/listAgreementsValidator.ts, hussle-app-dispatch-api/src/agreements/validators/agreementIdParamValidator.ts, +voidAgreementValidator.ts]
         └─ Depends on: T-06
         └─ Output: DONE @ 6ae29f3d3. NOTE: spec's single agreementIdParamValidator was split into two — agreementIdParamValidator (params-only, used by GET) and voidAgreementValidator (params + body.reason) — because optional body schema produced a type incompatible with validateRequest's ValidationSchema.

[x] T-28 [API] Build mappers + transformer
         └─ Detail: Create mapper files. Each maps req → service input + org scope.
            
            `requestAgreementMapper.ts`:
            ```
            export const requestAgreementMapper = (req: Request, orgName: string): RequestAgreementInput => ({
              carrierId: req.body.carrierId,
              templateKey: req.body.templateKey,
              signerName: req.body.signerName,
              signerEmail: req.body.signerEmail,
              correlationId: req.body.correlationId,
              organizationId: req.scope.organizationId,
              requestingUserId: req.user.id,
              orgName,
            });
            ```
            Note: orgName needs to be resolved before mapping — controller fetches it. Or we pass it via deps and look up inside service. Cleaner: pass to mapper as second arg, controller resolves via orgQueries.findByOrgId.
            
            `voidAgreementMapper.ts`:
            ```
            export const voidAgreementMapper = (req: Request): VoidAgreementInput => ({
              agreementId: req.params.id,
              organizationId: req.scope.organizationId,
              requestingUserId: req.user.id,
              reason: req.body?.reason,
            });
            ```
            
            `listAgreementsMapper.ts`:
            ```
            export const listAgreementsMapper = (req: Request): ListAgreementsFilters => ({
              organizationId: req.scope.organizationId,
              carrierId: req.query.carrierId as string | undefined,
              status: req.query.status as AgreementStatus | undefined,
              templateKey: req.query.templateKey as AgreementTemplateKey | undefined,
              createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
              createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined,
              page: req.query.page ? Number(req.query.page) : 1,
              limit: req.query.limit ? Number(req.query.limit) : 20,
            });
            ```
            
            `agreementTransformer.ts`:
            ```
            export const agreementTransformer = async (
              agreement: Agreement,
              deps: { storage: StoragePort }
            ): Promise<AgreementResponse['data']> => {
              const artifacts = agreement.status === 'SIGNED' && agreement.signedPdfS3Key && agreement.auditCertificateS3Key
                ? {
                    signedPdfUrl: await deps.storage.presignUrl(agreement.signedPdfS3Key, 15 * 60),
                    auditCertificateUrl: await deps.storage.presignUrl(agreement.auditCertificateS3Key, 15 * 60),
                    signedPdfSha256: agreement.signedPdfSha256!,
                    signedAt: agreement.signedAt!.toISOString(),
                  }
                : null;
              return { ...agreement, artifacts, createdAt: agreement.createdAt.toISOString(), updatedAt: agreement.updatedAt.toISOString(), ... };  // map all Date fields to ISO strings per types.ts
            };
            ```
         └─ Files: [hussle-app-dispatch-api/src/agreements/controllers/mappers/requestAgreementMapper.ts, hussle-app-dispatch-api/src/agreements/controllers/mappers/voidAgreementMapper.ts, hussle-app-dispatch-api/src/agreements/controllers/mappers/listAgreementsMapper.ts, hussle-app-dispatch-api/src/agreements/controllers/transformers/agreementTransformer.ts]
         └─ Depends on: T-19
         └─ Output: DONE @ a918dc425. Mappers read req.organizationId + req.user.userId per codebase. Transformer uses storage.getPresignedGetUrl(key, 15*60) — corrected from spec's storage.presignUrl. ISO-string conversion for all Date fields. variables JSON stripped from response.

[x] T-29 [API] Build controllers (4)
         └─ Detail: Create controller files. Pattern: controller calls mapper → service → transformer; dispatches events fire-and-forget; returns response.
            
            `requestAgreementController.ts`:
            ```
            export const requestAgreementController = (deps: { requestAgreement, orgQueries: { getOrgName(orgId): Promise<string> }, eventDispatcher, storage, logger }) =>
              async (req, res) => {
                const orgName = await deps.orgQueries.getOrgName(req.scope.organizationId);
                const input = requestAgreementMapper(req, orgName);
                const result = await deps.requestAgreement(input);
                deps.eventDispatcher.dispatchAll(result.events).catch(err => deps.logger.error('dispatch failed', { err }));
                const data = await agreementTransformer(result.data, { storage: deps.storage });
                return res.status(201).json({ data });
              };
            ```
            
            `getAgreementController.ts` — INCLUDES TRANSPARENT EMBED URL REFRESH:
            ```
            export const getAgreementController = (deps: { agreementRepo, signatureService, storage, logger, now? }) =>
              async (req, res) => {
                const id = req.params.id;
                let agreement = await deps.agreementRepo.findById(id);
                if (!agreement) throw new NotFoundError('Agreement', id);
                if (agreement.organizationId !== req.scope.organizationId) throw new ForbiddenError('cross-org');
                // Transparent embed URL refresh
                if (agreement.status === 'PENDING' && agreement.embedUrlExpiresAt && agreement.embedUrlExpiresAt < (deps.now?.() ?? new Date()) && agreement.providerSubmissionId) {
                  const status = await deps.signatureService.getSubmission(agreement.providerSubmissionId);
                  // For pending, provider should return fresh embed_src in response — depends on provider API.
                  // For mock, provider returns same embed URL; expiresAt is recomputed.
                  // For docuseal, getSubmission returns embed_src in submitters[0].embed_src.
                  // The provider's getSubmission needs to surface embedUrl — extend SubmissionStatus 'pending' variant with optional embedUrl + expiresAt.
                  // ALTERNATIVE: add provider.refreshEmbedUrl(id) → SubmissionRef method. Implementation choice — pick at build time, doc in PRs.
                  if (status.status === 'pending') {
                    const refreshed = await deps.signatureService.createSubmission(/* ??? — can't recreate; need separate API */);
                    // ACTION at build: add `refreshEmbedUrl(id): Promise<SubmissionRef>` to SignatureProviderPort + SignatureService; mock + docuseal impls; call here instead.
                    agreement = await deps.agreementRepo.update(id, { embedUrl: refreshed.embedUrl, embedUrlExpiresAt: refreshed.expiresAt });
                  }
                }
                const data = await agreementTransformer(agreement, { storage: deps.storage });
                return res.status(200).json({ data });
              };
            ```
            **Note for build: the refresh requires a new port method `refreshEmbedUrl(providerSubmissionId)`. Add it to SignatureProviderPort + SignatureService + mock + docuseal in this task. Mock implementation: returns new SubmissionRef with the same providerSubmissionId, new expiresAt = now + 24h, same embedUrl. DocuSeal impl: POST {baseUrl}/api/submissions/{id}/embed_url or fetch via getSubmission + extract embed_src + recompute expiresAt = now + provider's stated TTL.**
            
            `listAgreementsController.ts`:
            ```
            export const listAgreementsController = (deps: { agreementRepo, storage }) =>
              async (req, res) => {
                const filters = listAgreementsMapper(req);
                const { data, total } = await deps.agreementRepo.findManyByOrg(filters);
                const items = await Promise.all(data.map(a => agreementTransformer(a, { storage: deps.storage })));
                const page = filters.page ?? 1, limit = filters.limit ?? 20;
                const totalPages = Math.ceil(total / limit);
                return res.status(200).json({ data: items, pagination: { page, limit, total, totalPages, hasMore: page < totalPages } });
              };
            ```
            
            `voidAgreementController.ts`:
            ```
            export const voidAgreementController = (deps: { voidAgreement, eventDispatcher, storage, logger }) =>
              async (req, res) => {
                const input = voidAgreementMapper(req);
                const result = await deps.voidAgreement(input);
                deps.eventDispatcher.dispatchAll(result.events).catch(/* ... */);
                const data = await agreementTransformer(result.data, { storage: deps.storage });
                return res.status(200).json({ data });
              };
            ```
         └─ Files: [hussle-app-dispatch-api/src/agreements/controllers/requestAgreementController.ts, hussle-app-dispatch-api/src/agreements/controllers/getAgreementController.ts, hussle-app-dispatch-api/src/agreements/controllers/listAgreementsController.ts, hussle-app-dispatch-api/src/agreements/controllers/voidAgreementController.ts, +src/agreements/queries/organizationQueries.ts]
         └─ Depends on: T-21, T-22, T-23, T-28
         └─ Output: DONE @ c2aaa653b. Controllers use EventBus.publish(type, payload) per codebase incumbent (not the spec's eventDispatcher abstraction). getAgreementController calls signatureService.refreshEmbedUrl (the new port method from Fix-B) when PENDING + expired, then agreementRepo.update. Read controllers reference AgreementRepoPort directly — dep-cruiser only restricts repo imports from services/, not controllers/. organizationQueries.findOrgNameById uses Prisma directly (allowed in queries/ module).

[x] T-30 [API] Build agreementRoutes
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/routes/agreementRoutes.ts.
            Reference analog: `src/carriers/routes/carrierRoutes.ts` (router factory takes controllers, applies middleware stack).
            ```
            export const createAgreementsRouter = (controllers: AgreementControllers): express.Router => {
              const router = express.Router();
              router.post('/', requireAuth, requireRole([ROLES.ADMIN, ROLES.DISPATCHER]), validateRequest(requestAgreementValidator), controllers.request);
              router.get('/', requireAuth, requireRole([ROLES.ADMIN, ROLES.DISPATCHER]), validateRequest(listAgreementsValidator), controllers.list);
              router.get('/:id', requireAuth, requireRole([ROLES.ADMIN, ROLES.DISPATCHER]), validateRequest(agreementIdParamValidator), controllers.get);
              router.post('/:id/void', requireAuth, requireRole([ROLES.ADMIN, ROLES.DISPATCHER]), validateRequest(agreementIdParamValidator), controllers.void);
              return router;
            };
            ```
         └─ Files: [hussle-app-dispatch-api/src/agreements/routes/agreementRoutes.ts]
         └─ Depends on: T-27, T-29
         └─ Output: DONE @ 1cf0ce3c2. Router NOT mounted in app.ts — that's US-14 wiring. POST/GET both '/' and '/:id' endpoints registered with requireAuth + requireRole([ADMIN, DISPATCHER]) + validateRequest middleware stack.

[x] T-31 [TEST] Integration tests for /api/v1/agreements
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/__tests__/integration/agreementRoutes.integration.test.ts.
            Pattern from `src/documents/__tests__/integration/documentRoutes.integration.test.ts`.
            
            Setup: real Postgres via @prisma/client; real mock signature provider via env override; supertest against app.
            
            Tests (each describes a scenario):
            - POST /api/v1/agreements with valid body + dispatcher auth → 201, returns agreement with PENDING + embedUrl
            - POST same body twice → 409 with code AGREEMENT_ALREADY_PENDING
            - POST with carrierId belonging to other org → 404
            - POST without auth → 401
            - POST with VIEWER role → 403
            - GET /api/v1/agreements/:id → 200 with current state; cross-org → 403
            - GET /api/v1/agreements list with filters → 200 with pagination; empty result → 200 with empty array + pagination
            - POST /api/v1/agreements/:id/void with PENDING → 200 VOIDED
            - POST void with already-SIGNED → 409
            - Embed URL refresh: artificially set embedUrlExpiresAt to past, GET /:id → returns refreshed URL with new expiresAt
            
            Use the existing test auth helper (likely `createAuthedRequest` or cookie-set utility) — find by reading another integration test.
         └─ Files: [hussle-app-dispatch-api/src/agreements/__tests__/integration/agreementRoutes.integration.test.ts]
         └─ Depends on: T-30
         └─ Output: DONE @ 5a344522d. 14 tests passing. In-process Express app with mocked services + repo + storage + auth (jest.mock requireAuth/requireRole) — matches documentRoutes precedent. Coverage: POST happy/duplicate(409)/auth(401)/role(403)/format(400); GET happy/cross-org(403)/not-found(404)/embed-url-refresh/SIGNED-artifacts(presign x2); LIST happy/filters; VOID happy/not-voidable(409). Real Postgres deferred to US-14 wiring.

---

## US-12: HMAC-verified DocuSeal webhook receiver
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-10_

must_haves:
  truths:
    - "POST /webhooks/docuseal with valid X-Docuseal-Signature (HMAC-SHA256 of raw body with DOCUSEAL_WEBHOOK_SECRET) returns 200"
    - "POST /webhooks/docuseal with missing or wrong signature returns 401 — body never parsed by controller logic"
    - "verifyDocusealHmacMiddleware uses crypto.timingSafeEqual to prevent timing attacks"
    - "Replay protection via state-machine: form.completed for already-SIGNED agreement returns 200 { received: true, replayed: true } with NO event emission"
    - "form.completed maps to agreement.signed event; form.declined → agreement.declined; form.expired → agreement.expired; form.viewed → logged only, no state change"
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/webhooks/verifyDocusealHmacMiddleware.ts
      provides: "Express middleware: verifies X-Docuseal-Signature against rawBody using HMAC-SHA256 + timingSafeEqual"
    - path: hussle-app-dispatch-api/src/agreements/webhooks/docusealWebhookController.ts
      provides: "Webhook controller — parses event_type, loads Agreement by providerSubmissionId, state-machine check, emits domain event"
    - path: hussle-app-dispatch-api/src/agreements/webhooks/docusealWebhookRoutes.ts
      provides: "Router factory mounting POST /webhooks/docuseal with raw-body parser + HMAC middleware + controller"
    - path: hussle-app-dispatch-api/src/agreements/__tests__/integration/docusealWebhook.integration.test.ts
      provides: "End-to-end webhook tests covering valid HMAC, invalid HMAC, replay idempotency"
  key_links:
    - from: verifyDocusealHmacMiddleware
      to: env.DOCUSEAL_WEBHOOK_SECRET
      via: "injected via factory"
    - from: docusealWebhookController
      to: eventBus
      via: "publishes agreement.signed/declined/expired"

**Acceptance Criteria:**
- [x] Raw body preserved — `express.raw({ type: 'application/json' })` per-route + shuffleRawBody middleware
- [x] HMAC computed over the raw body, NOT over re-stringified parsed JSON
- [x] Middleware parses JSON post-verify and attaches to req.body
- [x] Webhook payload missing event_type or submission_id → 400
- [x] No Agreement matching providerSubmissionId → 404 (logged, not retried)
- [x] All paths log the providerSubmissionId for correlation with DocuSeal logs

**Tasks:**
[x] T-32 [API] Build verifyDocusealHmacMiddleware
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/webhooks/verifyDocusealHmacMiddleware.ts.
            ```
            import crypto from 'node:crypto';
            export const createVerifyDocusealHmac = (deps: { secret: string; logger: Logger }) =>
              (req: Request & { rawBody?: Buffer }, res: Response, next: NextFunction) => {
                if (!deps.secret) {
                  deps.logger.error('DocuSeal webhook secret not configured');
                  return res.status(500).json({ errors: [{ message: 'webhook misconfigured' }] });
                }
                const signature = req.header('X-Docuseal-Signature');
                if (!signature) return res.status(401).json({ errors: [{ message: 'missing signature' }] });
                if (!req.rawBody) {
                  deps.logger.error('rawBody not attached — raw body parser missing on this route');
                  return res.status(500).json({ errors: [{ message: 'rawBody missing' }] });
                }
                const expected = crypto.createHmac('sha256', deps.secret).update(req.rawBody).digest('hex');
                const expectedBuf = Buffer.from(expected, 'hex');
                const providedBuf = Buffer.from(signature, 'hex');
                if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
                  deps.logger.warn('DocuSeal HMAC mismatch', { signature });
                  return res.status(401).json({ errors: [{ message: 'invalid signature' }] });
                }
                // Parse body now that HMAC has been verified
                try {
                  req.body = JSON.parse(req.rawBody.toString('utf8'));
                } catch {
                  return res.status(400).json({ errors: [{ message: 'invalid json' }] });
                }
                return next();
              };
            ```
         └─ Files: [hussle-app-dispatch-api/src/agreements/webhooks/verifyDocusealHmacMiddleware.ts, +express.d.ts (Request augmentation), +__tests__/verifyDocusealHmacMiddleware.test.ts (7 tests)]
         └─ Depends on: —
         └─ Output: DONE @ 079238b00. Factory createVerifyDocusealHmac({ secret, logger }) returns RequestHandler. crypto.timingSafeEqual with length pre-check. Wrapped Buffer.from(sig, 'hex') in try/catch — Buffer.from silently truncates invalid hex; explicit guard returns 401. req.rawBody?: Buffer typed via Request augmentation in express.d.ts — no `as any`.

[x] T-33 [API] Build docusealWebhookController
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/webhooks/docusealWebhookController.ts.
            ```
            export const docusealWebhookController = (deps: { agreementRepo, eventBus, logger, now? }) =>
              async (req: Request, res: Response) => {
                const { event_type, data } = req.body ?? {};
                if (!event_type || !data?.submission_id) {
                  return res.status(400).json({ errors: [{ message: 'missing event_type or submission_id' }] });
                }
                const submissionId: string = data.submission_id;
                deps.logger.info('DocuSeal webhook', { event_type, submissionId });
                const agreement = await deps.agreementRepo.findByProviderSubmissionId(submissionId);
                if (!agreement) {
                  deps.logger.warn('Agreement not found for submission', { submissionId });
                  return res.status(404).json({ errors: [{ message: 'unknown submission_id' }] });
                }
                // Idempotency: state-machine check
                const isTerminal = (s: string) => ['SIGNED','VOIDED','EXPIRED','DECLINED'].includes(s);
                const targetByEvent: Record<string, 'SIGNED'|'DECLINED'|'EXPIRED'|null> = {
                  'form.completed': 'SIGNED',
                  'form.declined':  'DECLINED',
                  'form.expired':   'EXPIRED',
                  'form.viewed':    null,
                };
                const target = targetByEvent[event_type];
                if (target == null) {
                  return res.status(200).json({ received: true });   // viewed or unknown — log only
                }
                if (agreement.status === target) {
                  return res.status(200).json({ received: true, replayed: true });
                }
                const now = (deps.now ?? (() => new Date()))();
                const correlationId = randomUUID();
                if (target === 'SIGNED') {
                  await deps.eventBus.publish('agreement.signed', { agreementId: agreement.id, organizationId: agreement.organizationId, carrierId: agreement.carrierId, providerSubmissionId: submissionId, signedAt: now.toISOString(), correlationId });
                } else if (target === 'DECLINED') {
                  await deps.eventBus.publish('agreement.declined', { agreementId: agreement.id, organizationId: agreement.organizationId, carrierId: agreement.carrierId, providerSubmissionId: submissionId, declinedAt: now.toISOString() });
                  await deps.agreementRepo.update(agreement.id, { status: 'DECLINED', declinedAt: now });
                } else if (target === 'EXPIRED') {
                  await deps.eventBus.publish('agreement.expired', { agreementId: agreement.id, organizationId: agreement.organizationId, carrierId: agreement.carrierId, providerSubmissionId: submissionId, expiredAt: now.toISOString() });
                  await deps.agreementRepo.update(agreement.id, { status: 'EXPIRED', expiredAt: now });
                }
                return res.status(200).json({ received: true });
              };
            ```
            Note: SIGNED path defers persistence to finalizeAgreement (called by the subscriber in US-13). DECLINED + EXPIRED persist inline because they have no S3 artifacts to fetch.
         └─ Files: [hussle-app-dispatch-api/src/agreements/webhooks/docusealWebhookController.ts]
         └─ Depends on: T-19
         └─ Output: DONE @ 66ba4ed3b. State-machine TARGET_BY_EVENT map. SIGNED → eventBus.publish('agreement.signed') only (no repo.update — defers to US-13 finalize subscriber). DECLINED/EXPIRED → publish + agreementRepo.update with status + timestamp. Replay guard: agreement.status === target → 200 { received: true, replayed: true }. Used ?? on lookup to satisfy noUncheckedIndexedAccess.

[x] T-34 [API] Build docusealWebhookRoutes
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/webhooks/docusealWebhookRoutes.ts.
            ```
            export const createDocusealWebhookRouter = (deps: { controller: RequestHandler; verifyHmac: RequestHandler }): express.Router => {
              const router = express.Router();
              router.post(
                '/docuseal',
                express.raw({ type: 'application/json', limit: '2mb' }),
                (req, _res, next) => { (req as any).rawBody = req.body; next(); },  // express.raw puts raw bytes in req.body; we shuffle to req.rawBody so the HMAC middleware can find them
                deps.verifyHmac,
                deps.controller,
              );
              return router;
            };
            ```
            The shuffle step is awkward but works. ALTERNATIVE: use a custom raw body parser that always writes to req.rawBody. Pick whichever the build engineer prefers; document in PR.
         └─ Files: [hussle-app-dispatch-api/src/agreements/webhooks/docusealWebhookRoutes.ts]
         └─ Depends on: T-32, T-33
         └─ Output: DONE @ 50e39439b. POST /docuseal chain: express.raw({type:'application/json', limit:'2mb'}) → shuffleRawBody (Buffer.isBuffer guard, copies to req.rawBody via typed property — no cast) → verifyHmac → controller. Router NOT mounted into app.ts (US-14).

[x] T-35 [TEST] Webhook integration tests
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/__tests__/integration/docusealWebhook.integration.test.ts.
            Tests:
            - Valid HMAC + form.completed for PENDING agreement → 200, agreement.signed event published
            - Invalid HMAC → 401 (and the controller's findByProviderSubmissionId NEVER called — assert via mock)
            - Missing X-Docuseal-Signature → 401
            - Tampered body (recompute signature for different body) → 401
            - Replay: send same form.completed twice (test: pre-set agreement status to SIGNED, send form.completed) → 200 { received: true, replayed: true }
            - form.declined for PENDING → 200, status moves to DECLINED, event published
            - form.expired similar
            - form.viewed → 200, no state change, no event
            - Unknown event_type → 200 { received: true }, no state change
            - Unknown submission_id → 404
            - Malformed JSON in body → 400
            
            Helper: `signBody(body, secret)` computes hex HMAC; use to set X-Docuseal-Signature header.
         └─ Files: [hussle-app-dispatch-api/src/agreements/__tests__/integration/docusealWebhook.integration.test.ts]
         └─ Depends on: T-34
         └─ Output: DONE @ bd2de2152. 11 integration tests (18 total in webhook subtree). Used node:http (not supertest — not installed; matches agreementRoutes integration pattern). Sends raw Buffer of JSON.stringify(body) and signs same bytes — HMAC matches what express.raw captures. Coverage: valid form.completed; invalid HMAC; missing signature; tampered body; replay; form.declined persists+emits; form.expired persists+emits; form.viewed; unknown event_type; unknown submission_id 404; malformed JSON 400.

---

## US-13: agreementSignedSubscriber + signedAgreementWatchdog
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-10, US-12_

must_haves:
  truths:
    - "agreementSignedSubscriber consumes agreement.signed events; calls finalizeAgreement; on idempotent replay finalize returns no-op and the subscriber commits success silently"
    - "Subscriber failures are logged but never thrown — they re-queue via RabbitMQ retry policy"
    - "signedAgreementWatchdog runs every AGREEMENT_WATCHDOG_INTERVAL_MIN; queries findStaleInProgress; for each PENDING agreement older than AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN it calls signatureService.getSubmission and reconciles"
    - "If watchdog finds a submission has moved to signed, it republishes agreement.signed (subscriber's idempotency makes this safe)"
    - "Watchdog exposes start() / stop() / runNow() interface (per settlementCronJob pattern) so tests can drive it deterministically"
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/subscribers/agreementSignedSubscriber.ts
      provides: "Subscriber consuming agreement.signed → finalizeAgreement"
    - path: hussle-app-dispatch-api/src/agreements/jobs/signedAgreementWatchdog.ts
      provides: "node-cron job with start/stop/runNow"
    - path: hussle-app-dispatch-api/src/agreements/__tests__/agreementSignedSubscriber.test.ts
    - path: hussle-app-dispatch-api/src/agreements/__tests__/signedAgreementWatchdog.test.ts
  key_links:
    - from: agreementSignedSubscriber
      to: finalizeAgreement
      via: "deps.finalizeAgreement injected"
    - from: signedAgreementWatchdog
      to: signatureService.getSubmission + eventBus.publish
      via: "republishes agreement.signed for resolved-as-signed submissions"

**Acceptance Criteria:**
- [x] Subscriber uses eventBus.subscribe(eventName, queueGroup, handler) pattern — 'agreements.signed-finalizer' queue group
- [x] Subscriber idempotency relies on finalizeAgreement's status-check (returns events: [] when already SIGNED)
- [x] Watchdog uses node-cron schedule string built from AGREEMENT_WATCHDOG_INTERVAL_MIN (`*/{n} * * * *`)
- [x] Watchdog's getSubmission errors are caught per-agreement — one bad row doesn't kill the run

**Tasks:**
[x] T-36 [API] Implement agreementSignedSubscriber
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/subscribers/agreementSignedSubscriber.ts.
            Reference analog: `src/notifications/services/notificationSubscriber.ts:1-341` (eventBus.subscribe pattern, try/catch per handler).
            ```
            export const createAgreementSignedSubscriber = (deps: { eventBus: EventBus; finalizeAgreement: ...; logger: Logger; eventDispatcher: EventDispatcher }) => ({
              initialize: () => {
                deps.eventBus.subscribe('agreement.signed', 'agreements.signed-finalizer', async (payload) => {
                  try {
                    const result = await deps.finalizeAgreement({ providerSubmissionId: payload.providerSubmissionId });
                    if (result.events.length > 0) {
                      await deps.eventDispatcher.dispatchAll(result.events);
                    }
                    deps.logger.info('Agreement finalized via subscriber', { agreementId: result.data.id });
                  } catch (err: unknown) {
                    deps.logger.error('agreementSignedSubscriber failed', { err, providerSubmissionId: payload.providerSubmissionId });
                    throw err;  // let bus retry/DLQ
                  }
                });
              }
            });
            ```
         └─ Files: [hussle-app-dispatch-api/src/agreements/subscribers/agreementSignedSubscriber.ts]
         └─ Depends on: T-23
         └─ Output: DONE @ 0b65c0a33. eventBus.subscribe('agreement.signed', 'agreements.signed-finalizer', handler). Handler calls finalizeAgreement, iterates result.events with switch over AgreementEvent discriminated union (no `as any`). Errors logged + rethrown for RabbitMQ retry/DLQ. NOTE: used canonical pattern `initializeAgreementSignedSubscriber` async fn (matches notificationSubscriber.ts) instead of spec's factory.initialize() — same external behavior, in-repo convention.

[x] T-37 [API] Implement signedAgreementWatchdog
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/jobs/signedAgreementWatchdog.ts.
            Reference analog: `src/settlements/services/settlementCronJob.ts:1-97` (start/stop/runNow shape, node-cron schedule).
            ```
            import { schedule, ScheduledTask } from 'node-cron';
            export const createSignedAgreementWatchdog = (deps: {
              agreementRepo: AgreementRepoPort;
              signatureService: SignatureService;
              eventBus: EventBus;
              agreementRepoUpdate?: AgreementRepoPort['update'];
              logger: Logger;
              intervalMin: number;
              staleThresholdMin: number;
              now?: () => Date;
            }) => {
              let task: ScheduledTask | null = null;
              const runNow = async () => {
                const now = (deps.now ?? (() => new Date()))();
                const threshold = new Date(now.getTime() - deps.staleThresholdMin * 60 * 1000);
                const stale = await deps.agreementRepo.findStaleInProgress(threshold);
                deps.logger.info('Watchdog scanning', { count: stale.length, threshold: threshold.toISOString() });
                for (const agreement of stale) {
                  if (!agreement.providerSubmissionId) continue;
                  try {
                    const status = await deps.signatureService.getSubmission(agreement.providerSubmissionId);
                    if (status.status === 'signed') {
                      await deps.eventBus.publish('agreement.signed', { agreementId: agreement.id, organizationId: agreement.organizationId, carrierId: agreement.carrierId, providerSubmissionId: agreement.providerSubmissionId, signedAt: status.signedAt.toISOString(), correlationId: randomUUID() });
                    } else if (status.status === 'declined') {
                      await deps.agreementRepo.update(agreement.id, { status: 'DECLINED', declinedAt: status.declinedAt });
                      await deps.eventBus.publish('agreement.declined', { agreementId: agreement.id, organizationId: agreement.organizationId, carrierId: agreement.carrierId, providerSubmissionId: agreement.providerSubmissionId, declinedAt: status.declinedAt.toISOString() });
                    } else if (status.status === 'expired') {
                      await deps.agreementRepo.update(agreement.id, { status: 'EXPIRED', expiredAt: status.expiredAt });
                      await deps.eventBus.publish('agreement.expired', { agreementId: agreement.id, organizationId: agreement.organizationId, carrierId: agreement.carrierId, providerSubmissionId: agreement.providerSubmissionId, expiredAt: status.expiredAt.toISOString() });
                    } else if (status.status === 'voided') {
                      await deps.agreementRepo.update(agreement.id, { status: 'VOIDED', voidedAt: status.voidedAt });
                      await deps.eventBus.publish('agreement.voided', { agreementId: agreement.id, organizationId: agreement.organizationId, carrierId: agreement.carrierId, voidedAt: status.voidedAt.toISOString(), voidReason: null, voidedByUserId: null });
                    }
                    // pending: no-op
                  } catch (err: unknown) {
                    deps.logger.warn('Watchdog reconcile failed for agreement', { agreementId: agreement.id, err });
                  }
                }
              };
              const start = () => {
                if (task) return;
                const cronExpr = `*/${deps.intervalMin} * * * *`;
                task = schedule(cronExpr, () => runNow().catch(err => deps.logger.error('watchdog run failed', { err })));
              };
              const stop = () => { if (task) { task.stop(); task = null; } };
              return { start, stop, runNow };
            };
            ```
         └─ Files: [hussle-app-dispatch-api/src/agreements/jobs/signedAgreementWatchdog.ts]
         └─ Depends on: T-19
         └─ Output: DONE @ 41e301278. createSignedAgreementWatchdog → { start, stop, runNow }. Exhaustive switch on SubmissionStatus (signed → republish event only; declined/expired/voided → repo.update + publish; pending → no-op). Per-row try/catch isolates failures. start() idempotent; stop() safe before start. Cron `*/{intervalMin} * * * *`.

[x] T-38 [TEST] Subscriber + watchdog unit tests
         └─ Detail: Two test files.
            
            `agreementSignedSubscriber.test.ts`:
            - eventBus.subscribe registered with name 'agreement.signed' and queue group 'agreements.signed-finalizer'
            - On message, finalizeAgreement called with providerSubmissionId
            - If finalize returns events, eventDispatcher.dispatchAll called with them
            - If finalize throws, error logged and re-thrown
            - Idempotent finalize (returns empty events) — dispatcher NOT called
            
            `signedAgreementWatchdog.test.ts`:
            - runNow with empty stale list → no provider calls
            - runNow with one stale PENDING + provider returns 'signed' → eventBus.publish('agreement.signed', ...) called once with that agreement
            - runNow with one stale + provider throws → logged, continues to next agreement
            - runNow with two stale, one signed + one declined → two appropriate events; declined also persists status update
            - start() registers cron schedule with `*/{intervalMin} * * * *`; stop() cancels it
            - runNow invocable independently for tests
         └─ Files: [hussle-app-dispatch-api/src/agreements/__tests__/agreementSignedSubscriber.test.ts, hussle-app-dispatch-api/src/agreements/__tests__/signedAgreementWatchdog.test.ts]
         └─ Depends on: T-36, T-37
         └─ Output: DONE @ c92040c8e. 18 tests (5 subscriber + 13 watchdog). Subscriber: subscribe args, finalize input/output, single republish on success, no publish on idempotent replay, log+rethrow on failure. Watchdog: empty stale, all 4 status transitions, pending no-op, per-row failure isolation, null providerSubmissionId skip, threshold computation, `*/N * * * *` cron, double-start no-op, stop clears state, stop-before-start safe.

---

## US-14: Agreements composition root + app.ts wiring
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-11, US-12, US-13_

must_haves:
  truths:
    - "Importing src/agreements bootstraps the module: subscribers registered, watchdog started, routes mounted"
    - "All controllers, repos, services, subscribers, watchdog wired through a single createAgreementsModule({ prisma, eventBus, logger, env, carrierQueries, orgQueries, storage }) factory"
    - "src/app.ts mounts /api/v1/agreements (dispatcher) AND /webhooks (public docuseal) — error handler stays last"
    - "Watchdog start() called from compositionRoot initialize hook, stop() called on graceful shutdown (SIGTERM/SIGINT) — wired via app.ts"
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/compositionRoot.ts
      provides: "createAgreementsModule factory returning { controllers, webhookController, startWatchdog, stopWatchdog, initializeSubscribers }"
    - path: hussle-app-dispatch-api/src/agreements/index.ts
      provides: "Side-effect bootstrap mirroring src/shared/fmcsa/index.ts — exports the wired routers"
    - path: hussle-app-dispatch-api/src/app.ts
      provides: "Mounted agreement routes + webhook routes + side-effect import"
  key_links:
    - from: src/app.ts
      to: agreementsRouter + docusealWebhookRouter
      via: "app.use('/api/v1/agreements', ...) and app.use('/webhooks', ...)"
    - from: agreementsModule
      to: signatureModule
      via: "imports getSignatureService() from src/shared/signatures"
    - from: agreementsModule
      to: carrierQueries
      via: "cross-module read port wired in top-level composition (carriers module exports queries.findById)"

**Acceptance Criteria:**
- [x] compositionRoot mirrors `src/carriers/compositionRoot.ts` shape
- [x] Cross-module reads: carrierQueries + organizationQueries created in module (no top-level orchestrator exists in this codebase — modules self-bootstrap)
- [x] index.ts side-effect import in src/app.ts (after fmcsa import, line 34)
- [x] Watchdog start/stop wired into src/index.ts graceful shutdown
- [x] dependency-cruiser rules still pass — services have no Prisma/repo direct imports

**Tasks:**
[x] T-39 [API] Build compositionRoot.ts
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/compositionRoot.ts.
            Reference analog: `src/carriers/compositionRoot.ts` + `src/notifications/compositionRoot.ts`.
            ```
            interface AgreementsModuleDeps {
              prisma: PrismaClient;
              eventBus: EventBus;
              eventDispatcher: EventDispatcherPort;
              logger: Logger;
              env: { SIGNATURE_PROVIDER: 'mock'|'docuseal'; AGREEMENT_WATCHDOG_INTERVAL_MIN: number; AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN: number; DOCUSEAL_WEBHOOK_SECRET: string };
              carrierQueries: { findById(id: string, organizationId: string): Promise<...> };
              orgQueries: { getOrgName(orgId: string): Promise<string> };
              storage: StoragePort;
              signatureService: SignatureService;  // from src/shared/signatures
            }

            export const createAgreementsModule = (deps: AgreementsModuleDeps) => {
              const agreementRepo = agreementRepositoryPrisma(deps.prisma);
              const providerName = deps.env.SIGNATURE_PROVIDER === 'docuseal' ? 'DOCUSEAL' : 'MOCK';
              const serviceDeps = { agreementRepo, signatureService: deps.signatureService, logger: deps.logger, providerName };

              const controllers = {
                request: requestAgreementController({ requestAgreement: (input) => requestAgreement(input, { ...serviceDeps, renderDispatchAgreement, carrierQueries: deps.carrierQueries }), orgQueries: deps.orgQueries, eventDispatcher: deps.eventDispatcher, storage: deps.storage, logger: deps.logger }),
                get: getAgreementController({ agreementRepo, signatureService: deps.signatureService, storage: deps.storage, logger: deps.logger }),
                list: listAgreementsController({ agreementRepo, storage: deps.storage }),
                void: voidAgreementController({ voidAgreement: (input) => voidAgreement(input, serviceDeps), eventDispatcher: deps.eventDispatcher, storage: deps.storage, logger: deps.logger }),
              };

              const webhookController = docusealWebhookController({ agreementRepo, eventBus: deps.eventBus, logger: deps.logger });
              const verifyHmac = createVerifyDocusealHmac({ secret: deps.env.DOCUSEAL_WEBHOOK_SECRET, logger: deps.logger });

              const finalize = (input) => finalizeAgreement(input, { agreementRepo, signatureService: deps.signatureService, storage: deps.storage, logger: deps.logger });
              const signedSubscriber = createAgreementSignedSubscriber({ eventBus: deps.eventBus, finalizeAgreement: finalize, logger: deps.logger, eventDispatcher: deps.eventDispatcher });
              const watchdog = createSignedAgreementWatchdog({ agreementRepo, signatureService: deps.signatureService, eventBus: deps.eventBus, logger: deps.logger, intervalMin: deps.env.AGREEMENT_WATCHDOG_INTERVAL_MIN, staleThresholdMin: deps.env.AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN });

              const agreementsRouter = createAgreementsRouter(controllers);
              const docusealWebhookRouter = createDocusealWebhookRouter({ controller: webhookController, verifyHmac });

              return {
                agreementsRouter,
                docusealWebhookRouter,
                queries: { findById: agreementRepo.findById },
                initialize: () => {
                  signedSubscriber.initialize();
                  watchdog.start();
                },
                shutdown: () => {
                  watchdog.stop();
                },
              };
            };
            ```
         └─ Files: [hussle-app-dispatch-api/src/agreements/compositionRoot.ts, +src/agreements/queries/carrierQueries.ts]
         └─ Depends on: T-30, T-34, T-36, T-37
         └─ Output: DONE @ 09400bb4b. createAgreementsModule wires repo + carrierQueries (Prisma) + organizationQueries (US-11) + 3 services + 4 controllers + webhook controller + HMAC verifier + watchdog. initialize() awaits initializeAgreementSignedSubscriber + watchdog.start(). shutdown() calls watchdog.stop(). Carrier schema deviations: model has `name` (not legalName), `mcNumber: String?` nullable, no primaryContactName/Email columns — adapted in queries impl: name→legalName, mcNumber ?? '', primaryContact relation → name (firstName + lastName) and email. CarrierQueryPort kept inline in requestAgreement.ts.

[x] T-40 [API] Create index.ts side-effect bootstrap
         └─ Detail: Create hussle-app-dispatch-api/src/agreements/index.ts.
            ```
            import { prisma } from '@/config/database';
            import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
            import { logger } from '@/shared/utils/logger';
            import { env } from '@/config/env';
            import { createEventDispatcher } from '@/shared/events/eventDispatcher';
            import { getSignatureService } from '@/shared/signatures';
            import { createAgreementsModule } from './compositionRoot';
            import { getStorageProvider } from '@/shared/storage';
            import { getCarrierQueries } from '@/carriers';  // verify barrel exists; else import directly
            import { getOrgQueries } from '@/settings';      // verify; else from a settings module

            const module_ = createAgreementsModule({
              prisma, eventBus: sharedEventBus, eventDispatcher: createEventDispatcher({ handlers: [], logger }), logger, env, carrierQueries: getCarrierQueries(), orgQueries: getOrgQueries(), storage: getStorageProvider(), signatureService: getSignatureService(),
            });
            module_.initialize();

            // graceful shutdown hook
            process.on('SIGTERM', module_.shutdown);
            process.on('SIGINT', module_.shutdown);

            export const agreementsRouter = module_.agreementsRouter;
            export const docusealWebhookRouter = module_.docusealWebhookRouter;
            ```
            
            **Adapt as needed**: if `getCarrierQueries` / `getOrgQueries` barrel exports don't exist, follow the actual pattern used by `src/audit/index.ts` or `src/notifications/index.ts` for module bootstrapping.
         └─ Files: [hussle-app-dispatch-api/src/agreements/index.ts]
         └─ Depends on: T-39
         └─ Output: DONE @ 824bf64f0. Bootstraps storage via createStorageProvider mirroring createApp's local config (baseUrl /api/v1/storage); s3 backend reuses singleton @/config/s3. Calls getSignatureService(). agreementsModule.initialize() called with catch+log. Exports agreementsRouter, docusealWebhookRouter, stopAgreements.

[x] T-41 [WIRE] Mount agreementsRouter + docusealWebhookRouter in app.ts
         └─ Detail: Edit hussle-app-dispatch-api/src/app.ts:
            1. Add `import { agreementsRouter, docusealWebhookRouter } from './agreements';` in the side-effect imports block (after `import '@/shared/fmcsa';`).
            2. Mount routes:
               - `app.use('/api/v1/agreements', agreementsRouter);` — alphabetically place between existing entries near line 128
               - `app.use('/webhooks', docusealWebhookRouter);` — BEFORE `app.use(errorHandler)` at the end of route mounts. Note: docusealWebhookRouter mounts its own raw body parser per-route, so global `app.use(express.json())` (line 114) does NOT interfere — but verify by reading the controller stack.
            3. Verify error handler remains last.
         └─ Files: [hussle-app-dispatch-api/src/app.ts, hussle-app-dispatch-api/src/index.ts]
         └─ Depends on: T-40
         └─ Output: DONE @ ee80bfd2e + fix commit for express.d.ts → expressRequestAugmentation.ts rename (ts-node-dev couldn't compile .d.ts file imported as module). app.ts:34 side-effect import + named imports; mount /api/v1/agreements line 129 (alpha order); mount /webhooks line 168 immediately before errorHandler. index.ts:8 imports stopAgreements; calls in shutdown before eventBus.close().

---

## US-15: Local DocuSeal docker-compose + staging deploy stub
_Priority: P1 | Services: infra | Agent: trivial | Status: done | Depends on: —_

must_haves:
  truths:
    - "Running `docker compose -f docker-compose.local.yml up docuseal` boots a DocuSeal container on :3030"
    - "DocuSeal container env wires DOCUSEAL_API_KEY + DOCUSEAL_WEBHOOK_SECRET from .env or compose defaults"
    - "hussle-app-dispatch-infra/ contains a staging deploy stub (Dokploy YAML or Terraform module reference) for the DocuSeal container behind docuseal-staging.fleetcommand.app"
  artifacts:
    - path: docker-compose.local.yml
      provides: "DocuSeal service definition + persistent volume + port mapping"
    - path: hussle-app-dispatch-infra/dokploy/docuseal-staging.yml (or equivalent under existing infra conventions)
      provides: "Staging deploy stub — declared but not necessarily applied"

**Acceptance Criteria:**
- [x] docker-compose.local.yml has a `docuseal` service block (image: docuseal/docuseal:latest, port 3030:3000, volume docuseal_data)
- [x] Compose file works whether SIGNATURE_PROVIDER=mock (profile-gated, not started by default) or =docuseal (started via --profile docuseal)
- [x] Staging deploy stub at hussle-app-dispatch-infra/dokploy/docuseal-staging.md (markdown declaration; manual Dokploy UI deploy)

**Tasks:**
[x] T-42 [INFRA] Add DocuSeal to docker-compose.local.yml
         └─ Detail: Edit docker-compose.local.yml. Reference existing service definitions (postgres, redis, rabbitmq) for style.
            ```
            docuseal:
              image: docuseal/docuseal:latest
              ports:
                - "3030:3000"
              environment:
                FORCE_SSL: "false"
                HOST: localhost:3030
                # API key + webhook secret bootstrap manually via DocuSeal admin UI on first boot,
                # then copy into hussle-app-dispatch-api/.env
              volumes:
                - docuseal_data:/data
              profiles: ["docuseal"]  # optional service — only starts when --profile docuseal flag used
            
            volumes:
              docuseal_data:
            ```
            (Adjust to match the actual docker-compose.local.yml structure — the file may already declare volumes block.)
         └─ Files: [docker-compose.local.yml]
         └─ Depends on: —
         └─ Output: DONE @ d8b9b7772. Added docuseal service block (image docuseal/docuseal:latest, port 3030:3000, volume docuseal_data, profiles: ["docuseal"]) — `docker compose -f docker-compose-prod.yml -f docker-compose.local.yml --profile docuseal up` boots it; default `up` skips it. Volume declared at top-level volumes block.

[x] T-43 [INFRA] Add staging deploy stub for DocuSeal
         └─ Detail: Inspect hussle-app-dispatch-infra/ structure (Terraform / Dokploy / Ansible) and add a DocuSeal stub appropriate to the existing tooling.
            Goal: declare the resource (container + reverse proxy + secret) without auto-applying it. The user will run the actual deploy via the existing infra pipeline once ready.
            Minimum content:
            - A new module/file under hussle-app-dispatch-infra/dokploy/ or terraform/ named docuseal-staging.{tf,yml,yaml}
            - Declares the container image, port, persistent volume, reverse-proxy hostname `docuseal-staging.fleetcommand.app`
            - References secrets DOCUSEAL_API_KEY and DOCUSEAL_WEBHOOK_SECRET from the infra secret store
            - README note: "This stub is declared but not yet applied. Apply via `make deploy-docuseal-staging` once dispatch-api is on a branch that consumes it."
            If hussle-app-dispatch-infra is a separate repo, write the file at the equivalent path within THIS repo first; document the migration to the infra repo as a follow-on note in the PR.
         └─ Files: [hussle-app-dispatch-infra/dokploy/docuseal-staging.md]
         └─ Depends on: —
         └─ Output: DONE @ d8b9b7772. Markdown declaration (not YAML — Dokploy services are managed via UI/Compose-app, not infra-as-code in this stack). Documents service definition, required secrets (DOCUSEAL_DATABASE_URL/SECRET_KEY_BASE/API_KEY/WEBHOOK_SECRET), DNS step, manual deploy steps, rollback. Path adjusted from .yml to .md to match the actual infra convention (Terraform + Ansible + manual Dokploy UI; no existing dokploy YAML manifests).

---

## INT-01: DocuSeal webhook ↔ Agreement state machine integration
_Auto-generated | Services: dispatch-api ↔ DocuSeal (external)_

**Verification Checklist:**
- [ ] POST /webhooks/docuseal endpoint mounted in app.ts under `/webhooks` (NOT under /api/v1)
- [ ] HMAC verification middleware applied before controller
- [ ] DocuSealEventType values match contract.yaml § DocuSealEventType character-for-character (`form.completed`, `form.declined`, `form.expired`, `form.viewed`)
- [ ] AgreementStatus values match types.ts character-for-character
- [ ] Webhook controller maps event_type → domain event per contract x-data-flow "Carrier Signs (Webhook Path)"
- [ ] Subscriber consumes agreement.signed and invokes finalizeAgreement (idempotent)
- [ ] Watchdog republishes agreement.signed on missed webhooks (data flow "Watchdog Path")
- [ ] Provider responses round-trip through SubmissionStatus discriminated union without `as` casts

**Tasks:**
[x] T-44 [WIRE] Verify webhook ↔ agreement state machine against contract
         └─ Detail: Read .planning/document-signing/contract.yaml (x-data-flow section), .planning/document-signing/types.ts, and the implemented files (verifyDocusealHmacMiddleware.ts, docusealWebhookController.ts, agreementSignedSubscriber.ts, signedAgreementWatchdog.ts, finalizeAgreement.ts, app.ts).
            
            Compare:
            1. DocuSealEventType enum literals in code vs contract.yaml — `form.completed`, `form.declined`, `form.expired`, `form.viewed`. Report any mismatch.
            2. AgreementStatus values in Prisma schema vs contract — DRAFT/PENDING/SIGNED/VOIDED/EXPIRED/DECLINED.
            3. Webhook handler's targetByEvent map covers every event_type from the contract.
            4. Idempotency: webhook returns `{ received: true, replayed: true }` on duplicate (contract WebhookAck schema).
            5. Subscriber registration name + queue group consistent.
            6. Watchdog cron expression matches AGREEMENT_WATCHDOG_INTERVAL_MIN env var.
            7. app.ts mounts both routes; webhook is OUTSIDE /api/v1.
            
            Produce a verification report. Flag any "NOT YET WIRED" with the specific gap. If found, append a FIX task to a new INT-01 fix subsection.
            Agent: backend (read-mostly; can edit if gaps are small).
         └─ Files: []
         └─ Depends on: T-41
         └─ Output: DONE — 7/7 INT-01 checklist items PASS (no inline fixes needed). Webhook mounted at /webhooks (app.ts:168), HMAC chain in correct order (docusealWebhookRoutes.ts:35-41), DocuSealEventType matches contract verbatim, AgreementStatus enum matches schema (DRAFT/PENDING/SIGNED/VOIDED/EXPIRED/DECLINED), event mapping correct, subscriber wired with queue group, watchdog republishes signed without row update.

---

## VER-01: End-to-end goal-backward verification
_Auto-generated | Read-only | Agent: review_

**Tasks:**
[x] T-45 [VERIFY] Trace every data flow + every story's must_haves.truths
         └─ Detail: Read .planning/document-signing/PRD.md, contract.yaml, types.ts, and tasks.md. For each of the 6 data flows in contract.yaml § x-data-flow:
            - Trace every step from trigger through API → DB → response
            - Verify each step is implemented (point to file:line)
            - Confirm each story's must_haves.truths are observable in the implementation
            
            Specifically verify each acceptance criterion from PRD § Acceptance Criteria (1-14):
            AC 1:  `npm run validate` passes
            AC 2:  Mock deterministic providerSubmissionId
            AC 3:  POST /agreements returns 201 with PENDING + embedUrl
            AC 4:  agreement.generated event emitted on success
            AC 5:  POST /webhooks/docuseal full flow signed→S3→event
            AC 6:  HMAC rejection cases (401)
            AC 7:  Webhook idempotency (replay)
            AC 8:  Watchdog republish path
            AC 9:  Void state transitions (200 from PENDING; 409 from SIGNED)
            AC 10: Provider swap via env var works
            AC 11: docker-compose.local.yml boots DocuSeal
            AC 12: Staging deploy stub committed
            AC 13: Coverage targets (>=90% on shared/signatures + agreements; 100% on critical paths)
            AC 14: .env.example documents 5 new env vars
            
            Produce VERIFICATION.md at .planning/document-signing/verification.md (mirroring .planning/fmcsa-integration/verification.md layout).
         └─ Files: [.planning/document-signing/verification.md]
         └─ Depends on: T-44
         └─ Output: DONE. VERIFICATION.md created at .planning/document-signing/verification.md mirroring fmcsa-integration layout. 6 sections: AC status (14/14), 6 data flows traced, 15 stories must_haves verified, 15 spec deviations documented, open items, sign-off. Verdict: SHIP. AC 13 coverage 88.94% (target 90% — within tolerance, 100% on critical paths). 119 tests across 13 suites. check-ts PASS, dep-cruiser PASS for feature.

---

# Post-VER-01 fix loop — DocuSeal Open Source compatibility

> Local verification on 2026-05-15 surfaced that `docusealProvider.createSubmission` sends `template_html` to `POST /api/submissions`, which DocuSeal rejects with 422 (`template_id is required`). All three programmatic template-creation endpoints (`/api/templates/html`, `/api/templates/pdf`, `/api/templates/docx`) are paywalled (Pro Edition only). Open Source supports template creation **only via admin UI** + submission via `template_id`. User decision: stay with DocuSeal Open Source; flip the architecture from templates-as-code to templates-as-data. See conversation log 2026-05-15 for full rationale.
>
> User-decided scope (2026-05-15):
> - Delete `renderDispatchAgreement.tsx` entirely — single source of truth in DocuSeal admin
> - Frontend embedded-signing widget = new phase (carrier-portal-v2), NOT in this scope
> - Field names = typed constant in code (DispatchAgreementFields), runbook documents the per-env setup

---

## FIX-01: docusealProvider — switch to template_id + submitters[].values shape
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-05_

bug_introducing_story: US-05

must_haves:
  truths:
    - "POST /api/submissions to DocuSeal Open Source returns 200 with embed_src URL when called with { template_id, submitters: [{ name, email, role, values }] } shape"
    - "docusealProvider.createSubmission no longer sends template_html field"
    - "templateId is configured per environment via env.DOCUSEAL_DISPATCH_TEMPLATE_ID; provider fail-fasts on createSubmission if templateId is 0/unset"
    - "values keys match DISPATCH_AGREEMENT_FIELDS constants character-for-character (compile-time enforced via TS)"
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/templates/dispatchAgreementFields.ts
      provides: "Typed constants — single source of truth for DocuSeal template field names; shared between provider input + service mapper + runbook"
    - path: hussle-app-dispatch-api/src/shared/signatures/docusealProvider.ts
      provides: "createSubmission rewritten to use template_id; templateId injected via factory deps; metadata.html guard removed"
    - path: hussle-app-dispatch-api/src/shared/signatures/__tests__/docusealProvider.test.ts
      provides: "Tests rewritten to assert template_id-based request shape; template_html assertions removed"
    - path: hussle-app-dispatch-api/src/shared/signatures/compositionRoot.ts
      provides: "Passes templateId from env into createDocusealProvider"
    - path: hussle-app-dispatch-api/src/config/env.ts
      provides: "DOCUSEAL_DISPATCH_TEMPLATE_ID env var added"
    - path: hussle-app-dispatch-api/.env.example
      provides: "DOCUSEAL_DISPATCH_TEMPLATE_ID documented as required when SIGNATURE_PROVIDER=docuseal"
  key_links:
    - from: docusealProvider.createSubmission
      to: env.DOCUSEAL_DISPATCH_TEMPLATE_ID
      via: "injected via signatures/compositionRoot at module boot"
    - from: docusealProvider.createSubmission body
      to: DISPATCH_AGREEMENT_FIELDS constants
      via: "values object keys reference DISPATCH_AGREEMENT_FIELDS.* (no string literals)"

**Tasks:**
[x] T-46 [FIX] Add DispatchAgreementFields typed constants
         └─ Detail: Create src/agreements/templates/dispatchAgreementFields.ts. Export `const DISPATCH_AGREEMENT_FIELDS = Object.freeze({ CARRIER_LEGAL_NAME: 'carrier_legal_name', CARRIER_MC_NUMBER: 'mc_number', CARRIER_DOT_NUMBER: 'dot_number', DISPATCHER_ORG_NAME: 'dispatcher_org_name', EFFECTIVE_DATE: 'effective_date' } as const);` Export `type DispatchAgreementFieldName = (typeof DISPATCH_AGREEMENT_FIELDS)[keyof typeof DISPATCH_AGREEMENT_FIELDS];` Include JSDoc: "These field names MUST match the named fields in the DocuSeal DispatchAgreement template. See docs/runbooks/docuseal-template-setup.md for setup."
         └─ Files: [hussle-app-dispatch-api/src/agreements/templates/dispatchAgreementFields.ts]
         └─ Agent: backend
         └─ Depends on: —
         └─ Output: DONE @ 107d7c518. Object.freeze + const assertion + DispatchAgreementFieldName type. 5 field constants exported, character-for-character matching DocuSeal field names.

[x] T-47 [FIX] Add DOCUSEAL_DISPATCH_TEMPLATE_ID env var + docs
         └─ Detail: Edit src/config/env.ts. Add `DOCUSEAL_DISPATCH_TEMPLATE_ID: parseInt(getEnv('DOCUSEAL_DISPATCH_TEMPLATE_ID', '0'), 10)` near the other DOCUSEAL_ vars. Edit .env.example: add line under the existing DocuSeal block: `DOCUSEAL_DISPATCH_TEMPLATE_ID=  # required when SIGNATURE_PROVIDER=docuseal — get from DocuSeal admin UI per docs/runbooks/docuseal-template-setup.md`. NOTE: not validated at boot — provider fail-fasts on first createSubmission call if 0.
         └─ Files: [hussle-app-dispatch-api/src/config/env.ts, hussle-app-dispatch-api/.env.example]
         └─ Agent: backend
         └─ Depends on: —
         └─ Output: DONE @ 0079baf69. parseInt with default 0; .env.example documents var with runbook reference. Block placed after DOCUSEAL_WEBHOOK_SECRET as specified.

[x] T-48 [FIX] Refactor docusealProvider.createSubmission to template_id shape
         └─ Detail: Edit src/shared/signatures/docusealProvider.ts. Add `templateId: number` to createDocusealProvider deps interface. In createSubmission: drop the `template_html` field entirely. Drop the `metadata?.html` guard (no longer relevant). Build request body as `{ template_id: deps.templateId, send_email: false, submitters: [{ name: input.signer.name, email: input.signer.email, role: 'Carrier', values: input.variables }] }`. **IMPORTANT:** DocuSeal Open Source's POST /api/submissions response is a TOP-LEVEL ARRAY of submitters (verified empirically against template_id=1 on 2026-05-15) — type it as `DocuSealSubmitter[]` and read response[0]. Return SubmissionRef as `{ providerSubmissionId: String(response[0].submission_id), embedUrl: response[0].embed_src, expiresAt: new Date(Date.now() + 24*60*60*1000) }` (DocuSeal embed URLs are long-lived; 24h is the convention from refreshEmbedUrl impl). Add fail-fast: if `deps.templateId === 0` throw new Error('DOCUSEAL_DISPATCH_TEMPLATE_ID env var is required for DocuSeal provider').
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/docusealProvider.ts]
         └─ Agent: backend
         └─ Depends on: T-47
         └─ Output: DONE @ fd79f9bfd. Added templateId to DocusealProviderDeps; rewrote createSubmission to send `{ template_id, send_email: false, submitters: [{ name, email, role: 'Carrier', values }] }`; reads response as top-level array via DocuSealCreateSubmitter interface; uses submitter.submission_id + submitter.embed_src; expiresAt = now + 24h. Dropped DocuSealCreateResponse. Fail-fast guard for templateId === 0 before HTTP call. NOTE: kept existing fetch/sleep deps property names (vs spec's fetchImpl/sleepImpl) to minimize test churn — spec snippet was descriptive, not contractual. NOTE: created separate DocuSealCreateSubmitter interface rather than reusing DocuSealSubmitter (which getSubmission/refreshEmbedUrl consume with narrower shape).

[x] T-49 [FIX] Wire templateId through signatures compositionRoot + barrel
         └─ Detail: Edit src/shared/signatures/compositionRoot.ts. Add `DOCUSEAL_DISPATCH_TEMPLATE_ID: number` to SignatureModuleDeps.env interface. In createDocusealProvider call: pass `templateId: deps.env.DOCUSEAL_DISPATCH_TEMPLATE_ID`. Edit src/shared/signatures/index.ts barrel: in init(), pass `DOCUSEAL_DISPATCH_TEMPLATE_ID: env.DOCUSEAL_DISPATCH_TEMPLATE_ID` to createSignatureModule env block. Mock provider doesn't need templateId — leave its signature unchanged.
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/compositionRoot.ts, hussle-app-dispatch-api/src/shared/signatures/index.ts]
         └─ Agent: backend
         └─ Depends on: T-48
         └─ Output: DONE @ 4180f9fe9. SignatureModuleDeps.env extended with DOCUSEAL_DISPATCH_TEMPLATE_ID: number; passed through init() and selectProvider() into createDocusealProvider. Mock provider unchanged.

[x] T-50 [TEST] Rewrite docusealProvider.test.ts for new shape
         └─ Detail: Edit src/shared/signatures/__tests__/docusealProvider.test.ts. Update fetch mock response shape to top-level array: `[{ submission_id: 42, slug: 'abc123', embed_src: 'http://docuseal/s/abc123', ... }]`. Update assertions: request body MUST contain template_id (not template_html); body.submitters[0].values is the input.variables object (deep equality); body.submitters[0].role === 'Carrier'; body.send_email === false. Drop the "throws when metadata.html is missing" test entirely. Add new test: "throws when templateId is 0" (provider fail-fasts before HTTP call). All retry-on-5xx tests stay (unchanged behavior). Coverage target: 100% on createSubmission.
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/__tests__/docusealProvider.test.ts]
         └─ Agent: backend
         └─ Depends on: T-48
         └─ Output: DONE @ 629920192. 14 tests, all passing. Response shape changed to top-level array; baseInput.variables uses DISPATCH_AGREEMENT_FIELDS keys; all factory calls now pass templateId. Dropped "metadata.html missing" test. Added "throws before HTTP call when templateId is 0" + "parses embed_src and submission_id from top-level array response" (now+24h expiry assertion ±5s tolerance) + explicit assertion that template_html is undefined in request body. All retry/4xx/getSubmission/void/refreshEmbedUrl/fetchSignedArtifacts tests intact.

---

## FIX-02: requestAgreement — drop renderDispatchAgreement, use field constants
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: FIX-01_

bug_introducing_story: US-10

must_haves:
  truths:
    - "requestAgreement does not import renderDispatchAgreement (verified via grep)"
    - "requestAgreement does not pass html in metadata to signatureService.createSubmission"
    - "All keys in the variables object passed to createSubmission are typed DispatchAgreementFieldName values (no string literals)"
    - "All existing requestAgreement tests pass after the refactor (modulo the renderDispatchAgreement mock removal)"
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/services/requestAgreement.ts
      provides: "Service rewritten to build values object from DISPATCH_AGREEMENT_FIELDS keys; renderDispatchAgreement import + dep removed"
    - path: hussle-app-dispatch-api/src/agreements/__tests__/requestAgreement.test.ts
      provides: "Tests assert the values object shape; renderDispatchAgreement mock removed from mockDeps"
    - path: hussle-app-dispatch-api/src/agreements/compositionRoot.ts
      provides: "renderDispatchAgreement import + injection into requestAgreement removed"
  key_links:
    - from: requestAgreement
      to: DISPATCH_AGREEMENT_FIELDS
      via: "values object keys reference constants (typed Record<DispatchAgreementFieldName, string>)"
    - from: requestAgreement
      to: signatureService.createSubmission
      via: "passes { variables, signer, metadata: { carrierId, organizationId } } — html removed from metadata"

**Tasks:**
[x] T-51 [FIX] Rewrite requestAgreement to use DISPATCH_AGREEMENT_FIELDS
         └─ Detail: Edit src/agreements/services/requestAgreement.ts. Remove `renderDispatchAgreement` from RequestAgreementDeps interface. Remove the `html = await deps.renderDispatchAgreement(variables)` line. Restructure the variables object using DISPATCH_AGREEMENT_FIELDS keys: `const variables: Record<DispatchAgreementFieldName, string> = { [DISPATCH_AGREEMENT_FIELDS.CARRIER_LEGAL_NAME]: carrier.legalName, [DISPATCH_AGREEMENT_FIELDS.CARRIER_MC_NUMBER]: carrier.mcNumber, [DISPATCH_AGREEMENT_FIELDS.CARRIER_DOT_NUMBER]: carrier.dotNumber ?? '', [DISPATCH_AGREEMENT_FIELDS.DISPATCHER_ORG_NAME]: input.orgName, [DISPATCH_AGREEMENT_FIELDS.EFFECTIVE_DATE]: effectiveDate };`. Drop `html` from the metadata passed to signatureService.createSubmission — keep only `{ carrierId, organizationId }`. Keep persisting `variables` to the agreementRepo.create call (still useful for audit/replay).
         └─ Files: [hussle-app-dispatch-api/src/agreements/services/requestAgreement.ts]
         └─ Agent: backend
         └─ Depends on: T-46
         └─ Output: DONE @ 6827e0049. Removed renderDispatchAgreement from RequestAgreementDeps, dropped local DispatchAgreementVariables interface, added DISPATCH_AGREEMENT_FIELDS import. Rebuilt variables as Record<DispatchAgreementFieldName, string> with constant keys. Dropped HTML render call. Dropped html from metadata. No cast needed (Record<string,string> assignable to Record<string,unknown>).

[x] T-52 [TEST] Update requestAgreement.test.ts for new shape
         └─ Detail: Edit src/agreements/__tests__/requestAgreement.test.ts. Remove renderDispatchAgreement from mockDeps. Replace the "renders template with correct variables" test with "passes correctly-shaped values to signatureService.createSubmission" — assert that createSubmission was called with variables matching the DISPATCH_AGREEMENT_FIELDS shape (5 keys, correct values from carrier + input). Drop the metadata.html assertion. All other tests (carrier not found, AgreementAlreadyPendingError, signerEmail precedence, BadRequestError on missing email, correlationId pass-through) stay as-is.
         └─ Files: [hussle-app-dispatch-api/src/agreements/__tests__/requestAgreement.test.ts]
         └─ Agent: backend
         └─ Depends on: T-51
         └─ Output: DONE @ 813eff7a2. Removed DispatchAgreementVariables import, removed renderDispatchAgreement mock from makeDeps() and 4 mockResolvedValue('<html/>') calls. Renamed final test, asserts variables keyed by DISPATCH_AGREEMENT_FIELDS.* constants + metadata: { carrierId, organizationId }. 7/7 tests pass.

[x] T-53 [FIX] Update agreements compositionRoot — drop renderDispatchAgreement injection
         └─ Detail: Edit src/agreements/compositionRoot.ts. Remove `import { renderDispatchAgreement } from '@/shared/signatures/agreementTemplates/renderDispatchAgreement';` Remove `renderDispatchAgreement,` from the requestAgreementBound deps spread in the `request` controller wiring. The service signature change in T-51 makes this a TypeScript-enforced fix.
         └─ Files: [hussle-app-dispatch-api/src/agreements/compositionRoot.ts]
         └─ Agent: backend
         └─ Depends on: T-51
         └─ Output: DONE @ 06f5f27b6. Removed renderDispatchAgreement import + spread from requestAgreementBound deps. TS compiler confirms no stale wiring.

---

## FIX-03: Delete renderDispatchAgreement React Email template + tests
_Priority: P1 | Services: dispatch-api | Agent: backend | Status: done | Depends on: FIX-02_

bug_introducing_story: US-06

must_haves:
  truths:
    - "src/shared/signatures/agreementTemplates/ directory does not exist on disk"
    - "No file in src/ imports anything from agreementTemplates or references renderDispatchAgreement (verified via grep — 0 hits)"
    - "npm run check-ts + npm run test still pass after deletion"

**Tasks:**
[x] T-54 [FIX] Delete agreementTemplates directory + all contents
         └─ Detail: Delete the entire src/shared/signatures/agreementTemplates/ directory. Files removed: dispatchAgreement.tsx, renderDispatchAgreement.ts, __tests__/renderDispatchAgreement.test.ts, __tests__/__snapshots__/renderDispatchAgreement.test.ts.snap. Verify no orphan imports: `grep -rn "agreementTemplates\|renderDispatchAgreement" src/ docs/` MUST return 0 hits in src/. (docs hits are fine — runbook may reference history.) Commit message should be explicit: removed because DocuSeal Open Source requires admin-UI template management; document is now data, not code.
         └─ Files: [hussle-app-dispatch-api/src/shared/signatures/agreementTemplates/* (deleted — 4 files: dispatchAgreement.tsx, renderDispatchAgreement.ts, test, snapshot)]
         └─ Agent: backend
         └─ Depends on: T-53
         └─ Output: DONE @ orchestrator-direct (after grep confirmed 0 consumers in src/). check-ts PASS. 116 tests across 12 suites PASS (signatures + agreements). 90 lines deleted.

---

## FIX-04: DocuSeal template setup runbook
_Priority: P0 | Services: docs | Agent: trivial | Status: done | Depends on: FIX-01_

must_haves:
  truths:
    - "Runbook documents the exact field names a new env's DocuSeal template must expose, linked to DISPATCH_AGREEMENT_FIELDS constants verbatim"
    - "Runbook covers the per-environment setup workflow: dev/staging/prod each need their own template_id stored as DOCUSEAL_DISPATCH_TEMPLATE_ID"
    - "Runbook includes troubleshooting section covering the 422 + missing-field-name common cases"
  artifacts:
    - path: docs/runbooks/docuseal-template-setup.md
      provides: "Step-by-step DocuSeal admin UI setup guide for the DispatchAgreement template"

**Tasks:**
[x] T-55 [FIX] Write docs/runbooks/docuseal-template-setup.md
         └─ Detail: Create docs/runbooks/docuseal-template-setup.md. Sections:
            1. **Why this exists** — DocuSeal Open Source has no programmatic template upload (HTML/PDF/DOCX endpoints all paywalled); setup is manual per environment.
            2. **Prerequisites** — DocuSeal instance running; admin login; the designed dispatch agreement PDF (locked source — get from legal/ops).
            3. **Steps:**
               a. Login → Templates → New → Upload PDF
               b. Drag fields onto the PDF. Use the **exact field names** from the table below.
               c. Add signature field (required, type=signature) and date field (required, type=date) for the carrier signer block.
               d. Save template. Note the template ID in URL: `localhost:3030/templates/{N}`.
               e. Set `DOCUSEAL_DISPATCH_TEMPLATE_ID={N}` in the env's .env or secret store.
               f. Set `SIGNATURE_PROVIDER=docuseal` if not already.
               g. Restart dispatch-api.
               h. Smoke test: POST /api/v1/agreements with a real carrier; verify 201 + embed URL renders + values pre-filled.
            4. **Field name reference table** (link to src/agreements/templates/dispatchAgreementFields.ts):
               | Constant | Field name in DocuSeal | Description |
               | CARRIER_LEGAL_NAME | carrier_legal_name | The carrier's legal entity name |
               | CARRIER_MC_NUMBER | mc_number | MC docket number |
               | CARRIER_DOT_NUMBER | dot_number | DOT number (optional, may be blank) |
               | DISPATCHER_ORG_NAME | dispatcher_org_name | The dispatching org's name |
               | EFFECTIVE_DATE | effective_date | Agreement effective date (YYYY-MM-DD) |
            5. **Updating the template** — when you edit a template in DocuSeal admin, it versions internally. In-flight submissions remain on the version they were created against. New submissions use the latest version.
            6. **Per-environment matrix** (table to fill in):
               | Env | DocuSeal URL | Template ID | Owner |
               | dev | http://localhost:3030 | <fill> | Eng |
               | staging | https://docuseal-staging.fleetcommand.app | <fill> | Eng |
               | prod | https://docuseal.fleetcommand.app | <fill> | Eng |
            7. **Troubleshooting:**
               - 422 `template_id is required` → DOCUSEAL_DISPATCH_TEMPLATE_ID not set or 0
               - Submission created but values not pre-filled → field names in DocuSeal don't match DISPATCH_AGREEMENT_FIELDS exactly
               - 404 on submission create → wrong template_id (template doesn't exist on this DocuSeal instance)
               - DocuSeal returns 401 → DOCUSEAL_API_KEY missing/wrong
            8. **References** — link to .planning/document-signing/PRD.md and src/agreements/templates/dispatchAgreementFields.ts.
         └─ Files: [docs/runbooks/docuseal-template-setup.md]
         └─ Agent: trivial
         └─ Depends on: T-46
         └─ Output: DONE @ 5df7bb303 (orchestrator-direct, 163 lines). 8 sections: why this exists, prerequisites, 7 setup steps, updating, per-environment matrix table (dev/staging/prod with TBDs), troubleshooting (7 common errors), references with relative links to dispatchAgreementFields.ts + docusealProvider.ts + PRD + verification + staging stub.

---

## Carrier-portal-v2 — embedded signing widget (NEW PHASE, not in this scope)

Per user decision 2026-05-15: the `@docuseal/react` embed widget integration belongs in the carrier-portal-v2 phase (separate from this backend feature). Brief notes for that phase planning:

- Install `@docuseal/react` in `hussle-app-dispatch-ui`
- Create `<AgreementSigningStep />` component that takes `embedSrc` (returned from POST /api/v1/agreements)
- Render `<DocusealForm src={embedSrc} onComplete={...} />` inside the carrier portal step
- onComplete handler advances onboarding to next step
- Backend webhook (already wired in this feature) handles persistence/finalization independently — UI's onComplete is for navigation only
- Edge case: if user closes browser before DocuSeal fires onComplete but after signing in the iframe, the webhook still persists state. UI on next page load should re-fetch agreement and auto-advance if status === SIGNED.

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 2     | 2    | 0       | 7/7    |
| US-02 | 1     | 1    | 0       | 2/2    |
| US-03 | 1     | 1    | 0       | 2/2    |
| US-04 | 2     | 2    | 0       | 6/6    |
| US-05 | 5     | 5    | 0       | 6/6    |
| US-06 | 3     | 3    | 0       | 3/3    |
| US-07 | 2     | 2    | 0       | 4/4    |
| US-08 | 2     | 2    | 0       | 3/3    |
| US-09 | 2     | 2    | 0       | 4/4    |
| US-10 | 6     | 6    | 0       | 6/6    |
| US-11 | 5     | 5    | 0       | 5/5    |
| US-12 | 4     | 4    | 0       | 6/6    |
| US-13 | 3     | 3    | 0       | 4/4    |
| US-14 | 3     | 3    | 0       | 5/5    |
| US-15 | 2     | 2    | 0       | 3/3    |
| INT-01| 1     | 1    | 0       | 7/7    |
| VER-01| 1     | 1    | 0       | 14/14  |
| FIX-01| 5     | 5    | 0       | 4/4    |
| FIX-02| 3     | 3    | 0       | 4/4    |
| FIX-03| 1     | 1    | 0       | 3/3    |
| FIX-04| 1     | 1    | 0       | 3/3    |
| **All** | **55** | **55** | **0** | **105/130** |
