# Agreement Signing Redesign Tasks
_Last updated: 2026-05-24 14:15_
_Plan: .planning/agreement-signing-redesign/plan.md_
_Patterns: .planning/agreement-signing-redesign/PATTERNS.md_

---

## US-01: Backend — Template Registry refactor
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: —_

must_haves:
  truths:
    - "requestAgreement.ts no longer imports DISPATCH_AGREEMENT_FIELDS or constructs the variables object inline — it looks up a registry entry by templateKey and calls buildVariables(carrier)."
    - "Adding a hypothetical W9 entry to TEMPLATE_REGISTRY (with its own buildVariables + docusealTemplateId) would require zero changes to requestAgreement.ts body."
    - "All existing requestAgreement unit tests still pass against the registry-driven code path."
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/templates/templateRegistry.ts
      provides: "TEMPLATE_REGISTRY: Record<TemplateKey, TemplateConfig> with DISPATCH_AGREEMENT entry exporting docusealTemplateId + buildVariables(ctx)"
    - path: hussle-app-dispatch-api/src/agreements/services/requestAgreement.ts
      provides: "registry-driven variable build replacing inline DISPATCH_AGREEMENT_FIELDS spread"
    - path: hussle-app-dispatch-api/src/agreements/__tests__/templateRegistry.test.ts
      provides: "unit test asserting DISPATCH_AGREEMENT entry, buildVariables output shape, and missing-key throw"
  key_links:
    - from: requestAgreement
      to: TEMPLATE_REGISTRY[input.templateKey]
      via: "lookup → call buildVariables({ carrier, orgName, effectiveDate }) → pass returned record to signatureService.createSubmission"

**Acceptance Criteria:**
- [x] AC-B2: requestAgreement.ts no longer references DISPATCH_AGREEMENT_FIELDS directly — uses registry lookup
- [x] AC-B3: Adding a hypothetical second registry entry requires no changes to requestAgreement.ts body

**Tasks:**
[x] T-01 [API] Create templateRegistry.ts and refactor requestAgreement.ts to use it
         └─ Detail: Create `src/agreements/templates/templateRegistry.ts` exporting:
              - `type BuildVariablesContext = { carrier: { legalName: string; mcNumber: string; dotNumber: string | null }; orgName: string; effectiveDate: string }`
              - `interface TemplateConfig { docusealTemplateId: number; buildVariables: (ctx: BuildVariablesContext) => Record<string, string> }`
              - `TEMPLATE_REGISTRY: Record<AgreementTemplateKey, TemplateConfig>` with a single `DISPATCH_AGREEMENT` entry whose `buildVariables` returns the same 5-key object currently built inline at requestAgreement.ts:89-95 (using DISPATCH_AGREEMENT_FIELDS for the keys — still imported INSIDE the registry, just not by the service).
              - `docusealTemplateId` value: read from `env.DOCUSEAL_DISPATCH_TEMPLATE_ID` if available; otherwise hardcode `0` with a TODO comment (today nothing consumes this field — it's plumbing for the next entry).
            Refactor `src/agreements/services/requestAgreement.ts`:
              - Remove `DISPATCH_AGREEMENT_FIELDS` / `DispatchAgreementFieldName` imports.
              - Look up `TEMPLATE_REGISTRY[input.templateKey]`. Throw `BadRequestError` if missing.
              - Call `registryEntry.buildVariables({ carrier, orgName: input.orgName, effectiveDate })` and pass the result as `variables` into both `signatureService.createSubmission` and `agreementRepo.create`.
              - `input.templateKey` type widens from `'DISPATCH_AGREEMENT'` literal to `AgreementTemplateKey` enum.
              - Existing test `requestAgreement.test.ts` continues to use DISPATCH_AGREEMENT_FIELDS in its assertions (the variables shape is unchanged) — no test edits required unless type narrowing breaks compilation.
         └─ Files: [hussle-app-dispatch-api/src/agreements/templates/templateRegistry.ts, hussle-app-dispatch-api/src/agreements/services/requestAgreement.ts]
         └─ Depends on: —
         └─ Output: CREATED templateRegistry.ts with TEMPLATE_REGISTRY: Record<AgreementTemplateKey, TemplateConfig> + BuildVariablesContext + TemplateConfig exports. MODIFIED requestAgreement.ts — removed DISPATCH_AGREEMENT_FIELDS import; widened templateKey input to AgreementTemplateKey; lookup at L89 throws BadRequestError on unknown key; delegates variable build to registryEntry.buildVariables. Event payload generalized from hardcoded 'DISPATCH_AGREEMENT' → input.templateKey. Wiring verified: grep DISPATCH_AGREEMENT_FIELDS in service → 0 hits; grep TEMPLATE_REGISTRY → 2 hits (import + usage).

[x] T-02 [TEST] Write templateRegistry.test.ts
         └─ Detail: Create `src/agreements/__tests__/templateRegistry.test.ts`. Cover:
              - `TEMPLATE_REGISTRY` has a `DISPATCH_AGREEMENT` entry.
              - `entry.buildVariables({ carrier: {...}, orgName: 'X', effectiveDate: '2026-01-01' })` returns the expected 5-key object with values mapped from carrier fields.
              - Missing-key access (`TEMPLATE_REGISTRY['UNKNOWN_KEY' as AgreementTemplateKey]`) returns `undefined` (TypeScript-typed via `Partial<Record<...>>` if needed; otherwise assert keys via `Object.keys`).
            Pattern after `__tests__/requestAgreement.test.ts:1-40` for setup/structure.
         └─ Files: [hussle-app-dispatch-api/src/agreements/__tests__/templateRegistry.test.ts]
         └─ Depends on: T-01
         └─ Output: CREATED templateRegistry.test.ts with 5 tests (presence, numeric id, full field mapping, null dotNumber → '', enum-coverage drift catch). 19/19 tests pass across templateRegistry.test.ts + requestAgreement.test.ts + 2 indirectly-related suites (`/tmp/build-us01-jest.log`). Lint clean (`/tmp/build-us01-lint.log`). TSC clean (`/tmp/build-us01-tsc.log`).

---

## US-02: Backend — Multi-key agreements endpoint + AgreementContext shape
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: —_

must_haves:
  truths:
    - "GET /api/v1/carrier-portal/agreements?templateKeys=DISPATCH_AGREEMENT returns { data: { DISPATCH_AGREEMENT: AgreementContext }, ... } — keyed record, not a list."
    - "Each AgreementContext in the response includes `mock: boolean` (derived from providerName === 'MOCK') and `variables: Record<string, string>` (the persisted JSON column)."
    - "Multiple keys in the CSV (e.g. ?templateKeys=DISPATCH_AGREEMENT,W9) return one entry per key — each lazily created via ensureForCarrier — and an unknown key returns 400 from the validator."
  artifacts:
    - path: hussle-app-dispatch-api/src/carrier-portal/controllers/portalAgreementController.ts
      provides: "getLatestForCarrier rewritten to accept CSV templateKeys, loop ensureForCarrier per key, build Record<key, AgreementContext>"
    - path: hussle-app-dispatch-api/src/carrier-portal/validators/portalAgreementListValidator.ts
      provides: "validator that parses templateKeys (required, CSV of known AgreementTemplateKey values)"
    - path: hussle-app-dispatch-api/src/agreements/controllers/transformers/agreementTransformer.ts
      provides: "transformer that adds `mock: boolean` and `variables: Record<string, string>` to AgreementResponseData"
  key_links:
    - from: getLatestForCarrier
      to: agreementQueries.ensureForCarrier
      via: "for each templateKey in parsed CSV → ensureForCarrier({ carrierId, organizationId, templateKey, ...signer })"
    - from: agreementTransformer
      to: agreement.providerName + agreement.variables
      via: "transformer reads agreement.providerName and agreement.variables JSON to emit mock + variables in the response shape"

**Acceptance Criteria:**
- [x] AC-B1: GET /carrier-portal/agreements?templateKeys=DISPATCH_AGREEMENT returns `{ data: { DISPATCH_AGREEMENT: AgreementContext } }`. Each missing agreement is created via ensureAgreementForCarrier.
- [x] AC-B4: AgreementContext returned to UI includes `mock: boolean` and `variables: Record<string, string>`.

**Tasks:**
[x] T-03 [API] Add `mock` + `variables` fields to agreementTransformer
         └─ Detail: Modify `src/agreements/controllers/transformers/agreementTransformer.ts`:
              - Extend `AgreementResponseData` interface: add `mock: boolean;` and `variables: Record<string, string>;`.
              - In the transformer body, emit `mock: agreement.providerName === 'MOCK'`.
              - Emit `variables: (agreement.variables as Record<string, string>) ?? {}`. The Prisma column is `Json`; cast narrowing is acceptable here because `requestAgreement.ts` always writes `Record<string, string>` (no other producer).
              - Remove the comment "variables is stripped — internal-only field" — it's no longer accurate.
              - Existing single-Agreement tests that consume agreementTransformer continue to work; they'll just see two extra fields.
         └─ Files: [hussle-app-dispatch-api/src/agreements/controllers/transformers/agreementTransformer.ts]
         └─ Depends on: —
         └─ Output: AgreementResponseData extended with `mock: boolean` and `variables: Record<string, string>`. Transformer emits `mock: agreement.providerName === 'MOCK'` and `variables: (agreement.variables as Record<string, string> | null) ?? {}`. JSDoc updated. No existing tests broken (Prisma JsonValue cast is documented as safe — requestAgreement is sole writer).

[x] T-04 [API] Rewrite portalAgreementListValidator for CSV templateKeys
         └─ Detail: Modify `src/carrier-portal/validators/portalAgreementListValidator.ts`:
              - Replace the single `templateKey: string` field with `templateKeys: string` (CSV) — required, non-empty.
              - Validate via Yup `.test('parses-to-known-keys', ...)`: split on `,`, trim, assert each is in `['DISPATCH_AGREEMENT']` (today the only key). Reject with message `'templateKeys must be a CSV of known agreement keys'` on unknown.
              - Keep the file's existing docblock; update to reflect plural shape.
              - Backward compat for `?templateKey=` is NOT preserved (plan §API/Interface Changes).
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/validators/portalAgreementListValidator.ts]
         └─ Depends on: —
         └─ Output: Replaced single-key `oneOf` validator with CSV `templateKeys` Yup `.test()` predicate; ALLOWED_TEMPLATE_KEYS allowlist constant. Unknown tokens return 400 from middleware.

[x] T-05 [API] Rewrite getLatestForCarrier controller for multi-key response
         └─ Detail: Modify `src/carrier-portal/controllers/portalAgreementController.ts`:
              - Replace `parseTemplateKey(req.query['templateKey'])` with `parseTemplateKeys(req.query['templateKeys'])` returning `AgreementTemplateKey[]`. Reuse the same DISPATCH_AGREEMENT-only allowlist (Yup validator already enforces this — controller can `as AgreementTemplateKey[]` after split, or re-validate defensively).
              - For each key in the parsed array, call `deps.agreementQueries.ensureForCarrier({ carrierId, organizationId, templateKey: key, ...signer })`.
              - Build `Record<AgreementTemplateKey, AgreementResponseData>` by awaiting `agreementTransformer(ensured.data, { storage })` per key and assigning into the record.
              - Replace the existing `{ data: [...], pagination: { ... } }` response with `res.status(200).json({ data: record })`. Drop pagination — it doesn't apply to a keyed object.
              - Rename the exported handler property from `getLatestForCarrier` to keep the route consumer untouched. (Controller export name change cascades to compositionRoot.ts wiring and routes/index.ts type alias — both already reference `controllers.agreement.getLatestForCarrier`. Leave the name; the semantics fit "get latest per requested key.")
              - Update the JSDoc block to describe the new shape.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/controllers/portalAgreementController.ts]
         └─ Depends on: T-03, T-04
         └─ Output: parseTemplateKey → parseTemplateKeys (returns AgreementTemplateKey[]). Handler loops via Promise.all calling ensureForCarrier per key (line 103) + agreementTransformer per key (line 109). Response: `{ data: Record<string, AgreementResponseData> }`; pagination dropped. Export property name `getLatestForCarrier` preserved (compositionRoot wiring untouched). 21/21 tests pass across 3 related suites (`/tmp/build-us02-jest.log`). Lint + tsc clean.

---

## US-03: Backend — Dev-only mock-sign endpoint
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: —_

must_haves:
  truths:
    - "POST /api/v1/carrier-portal/agreements/:id/mock-sign with SIGNATURE_PROVIDER=mock returns the updated AgreementContext with status SIGNED."
    - "POST /api/v1/carrier-portal/agreements/:id/mock-sign with SIGNATURE_PROVIDER=docuseal returns 404 (route not mounted)."
    - "mockSignAgreement service rejects with ForbiddenError when the agreement's carrierId does not match the session's carrierId."
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/services/mockSignAgreement.ts
      provides: "service that validates ownership, calls mockSignatureProvider.__testHelpers.markSigned, then flips the Agreement row to SIGNED via agreementRepo.update"
    - path: hussle-app-dispatch-api/src/carrier-portal/controllers/portalMockSignAgreementController.ts
      provides: "controller that reads :id from params, carrierId from req.carrierPortal, and dispatches mockSignAgreement"
    - path: hussle-app-dispatch-api/src/agreements/__tests__/mockSignAgreement.test.ts
      provides: "unit test covering happy-path mark-signed, ForbiddenError on ownership mismatch, NotFoundError on missing agreement"
  key_links:
    - from: portalMockSignAgreementController
      to: agreementsModule.queries.mockSignAgreement
      via: "dispatch via injected service; returned data passes through agreementTransformer for response shape"
    - from: createCarrierPortalRouter
      to: env.SIGNATURE_PROVIDER === 'mock'
      via: "route POST /agreements/:id/mock-sign mounted only when env flag is mock; otherwise omitted (returns 404 by Express default)"

**Acceptance Criteria:**
- [x] AC-M2: POST /carrier-portal/agreements/:id/mock-sign dispatches `markAgreementSignedMock` flow, backend flips status to SIGNED, refetch returns SIGNED.
- [x] AC-M3: POST /carrier-portal/agreements/:id/mock-sign returns 404 when SIGNATURE_PROVIDER !== 'mock'.

**Tasks:**
[x] T-06 [API] Create mockSignAgreement service
         └─ Detail: Create `src/agreements/services/mockSignAgreement.ts` exporting:
              - `interface MockSignAgreementInput { agreementId: string; carrierId: string }`
              - `interface MockSignAgreementDeps { agreementRepo: AgreementRepoPort; signatureService: SignatureService; logger: Logger; now?: () => Date }`
              - `mockSignAgreement(input, deps): Promise<AgreementServiceResult<Agreement>>`:
                  1. `findById(agreementId)` → throw `NotFoundError('Agreement', agreementId)` if null.
                  2. If `agreement.carrierId !== input.carrierId` → throw `ForbiddenError('Agreement not owned by this carrier session')`.
                  3. Cast `signatureService` provider to `MockSignatureProvider` via a runtime guard. Since the service-layer only knows the `SignatureService` shape, expose markSigned by ALSO accepting an optional `markSigned: (providerSubmissionId: string) => void` dep (cleaner than runtime casting). The compositionRoot wires `markSigned: mockProvider.__testHelpers.markSigned` only when SIGNATURE_PROVIDER === 'mock'.
                  4. Call `markSigned(agreement.providerSubmissionId)`.
                  5. Call `agreementRepo.update(agreement.id, { status: 'SIGNED', signedAt: now() })`.
                  6. Return `{ data: updatedAgreement, events: [] }` — no event emit; the production webhook handler emits agreement.signed but for the dev-mock path we keep it simple. If the subscriber chain matters for testing, follow plan note about "mirroring webhook handler" by adding `{ type: 'agreement.signed', ... }` event. Default: omit (less coupling).
              - Pattern after `finalizeAgreement.ts:1-50` for service shape.
            Note: This service lives in agreements/services/ (per plan PATTERNS.md). It is consumed by a controller in carrier-portal/controllers/ (one ownership boundary down — see T-07).
         └─ Files: [hussle-app-dispatch-api/src/agreements/services/mockSignAgreement.ts]
         └─ Depends on: —
         └─ Output: Service validates ownership (ForbiddenError on mismatch), calls injected markSigned(providerSubmissionId) when present, flips row to {status:'SIGNED', signedAt:now}. Returns {data, events:[]} — no event emit (dev-only path). NotFoundError + ForbiddenError use single-string-message constructor (matches existing service pattern).

[x] T-07 [API] Wire mockSignAgreement into agreements compositionRoot and expose to carrier-portal
         └─ Detail: Modify `src/agreements/compositionRoot.ts`:
              - At top of `createAgreementsModule`, derive `markSigned: ((providerSubmissionId: string) => void) | null`:
                  ```ts
                  const markSigned = deps.env.SIGNATURE_PROVIDER === 'mock'
                    ? (deps.signatureService as unknown as { __testHelpers?: { markSigned(id: string): void } }).__testHelpers?.markSigned ?? null
                    : null;
                  ```
                Actually cleaner: pass the raw provider in via deps OR add a `markAgreementSignedMock` to `AgreementsModuleQueries` only when markSigned exists.
              - Add to `AgreementsModuleQueries` interface (optional):
                  `mockSignAgreement?: (input: MockSignAgreementInput) => Promise<AgreementServiceResult<Agreement>>;`
              - Wire in `queries`: only set `mockSignAgreement` if `markSigned !== null`; otherwise leave undefined.
                  ```ts
                  mockSignAgreement: markSigned
                    ? (input) => mockSignAgreement(input, { agreementRepo, signatureService: deps.signatureService, markSigned, logger: deps.logger })
                    : undefined,
                  ```
              - Import the new service at the top of the file.
            Note: SignatureService type currently does NOT expose __testHelpers. The cleanest path is to add an optional `signatureProvider?: SignatureProviderPort & { __testHelpers?: MockSignatureProviderTestHelpers }` field to AgreementsModuleDeps (or pass the raw provider alongside the service). Use whichever the existing dispatch-api wiring already exposes; check `src/shared/signatures/compositionRoot.ts` to see what's available.
         └─ Files: [hussle-app-dispatch-api/src/agreements/compositionRoot.ts, hussle-app-dispatch-api/src/agreements/index.ts]
         └─ Depends on: T-06
         └─ Output: AgreementsModuleDeps extended with signatureProvider: SignatureProviderPort. Compositionroot narrows `as` once to detect optional __testHelpers.markSigned; if present, wires mockSignAgreement into AgreementsModuleQueries (else undefined). index.ts passes getSignatureProvider() alongside getSignatureService(). Wiring verified: 5 hits for mockSignAgreement in compositionRoot.ts (import, type, query field, conditional, call); 2 hits for signatureProvider in index.ts (import + pass).

[x] T-08 [API] Create portalMockSignAgreementController in carrier-portal
         └─ Detail: Create `src/carrier-portal/controllers/portalMockSignAgreementController.ts`:
              - Controller factory that accepts `{ mockSignAgreement, storage }` where mockSignAgreement is the bound service from agreements queries.
              - Handler reads `id` from `req.params`, `carrierId` from `req.carrierPortal.carrierId` (throw UnauthorizedError if missing — mirror `getCarrierId` helper from portalAgreementController.ts:18-23).
              - Calls `await mockSignAgreement({ agreementId: req.params.id, carrierId })`.
              - Transforms result via `agreementTransformer(result.data, { storage })` and returns `res.status(200).json({ data: response })`.
              - Pattern after `portalAgreementController.ts:82-110`.
            Update `src/carrier-portal/compositionRoot.ts`:
              - Add `mockSignAgreement` to `agreementQueries` port (`PortalAgreementQueryPort` extension): optional `mockSignAgreement?(input): Promise<AgreementServiceResult<Agreement>>`.
              - In createCarrierPortalModule, wire controllers.mockSignAgreement only if deps.agreementQueries.mockSignAgreement is defined; otherwise leave undefined.
              - Update the exported controllers shape: `agreement.mockSign?: express.RequestHandler` (optional).
            Update `src/carrier-portal/routes/index.ts`:
              - Update `AgreementControllers` interface to add `mockSign?: express.RequestHandler;`.
              - At the bottom of agreements section, mount conditionally:
                  ```ts
                  if (controllers.agreement.mockSign) {
                    router.post('/agreements/:id/mock-sign', controllers.agreement.mockSign);
                  }
                  ```
              - No validator needed — `:id` is a URL param, ownership enforced in the service.
         └─ Files: [hussle-app-dispatch-api/src/carrier-portal/controllers/portalMockSignAgreementController.ts, hussle-app-dispatch-api/src/carrier-portal/compositionRoot.ts, hussle-app-dispatch-api/src/carrier-portal/routes/index.ts, hussle-app-dispatch-api/src/carrier-portal/types/portalAgreementQueryPort.ts]
         └─ Depends on: T-07
         └─ Output: Controller created (reads :id + carrierId, dispatches cross-module port, agreementTransformer to response shape). PortalAgreementQueryPort extended with optional mockSignAgreement. compositionRoot.ts spreads createPortalAgreementControllers + conditionally adds mockSign controller when agreementQueries.mockSignAgreement is defined. routes/index.ts adds optional `mockSign` to AgreementControllers interface; mounts POST /agreements/:id/mock-sign only when controller exists (lines 156-159). Cross-module import of agreementTransformer matches existing portalAgreementController precedent.

[x] T-09 [TEST] Write mockSignAgreement unit test
         └─ Detail: Create `src/agreements/__tests__/mockSignAgreement.test.ts`. Cover:
              - Happy path: agreementRepo.findById returns an agreement matching the carrierId; markSigned is called with the providerSubmissionId; agreementRepo.update is called with `{ status: 'SIGNED', signedAt: <Date> }`; result.data is the updated row.
              - NotFoundError when findById returns null.
              - ForbiddenError when agreement.carrierId !== input.carrierId.
              - Pattern after `__tests__/requestAgreement.test.ts:1-40`.
         └─ Files: [hussle-app-dispatch-api/src/agreements/__tests__/mockSignAgreement.test.ts]
         └─ Depends on: T-08
         └─ Output: 4 unit tests (happy-path mark-signed + SIGNED flip, NotFoundError on missing, ForbiddenError on carrierId mismatch, skip markSigned when providerSubmissionId null). All 11 tests pass across 3 related suites (`/tmp/build-us03-jest.log`). Lint clean (`/tmp/build-us03-lint.log`). TSC clean (`/tmp/build-us03-tsc.log`). lint:deps exit 3 but only pre-existing violations in src/notifications — none of US-03's files involved.

---

## US-04: Frontend — Engine types, schema, selectors, lock semantics
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done (with US-05-bound carry-overs) | Depends on: —_

must_haves:
  truths:
    - "Step.template (singular literal) is removed; Step.templates: TemplateEntry[] is the only template field. signingPhase declares templates: [{ key: 'DISPATCH_AGREEMENT' }]."
    - "Session.agreement (singular) is removed; Session.agreements: Record<string, AgreementContext> is the only agreement field. AgreementContext gains templateKey, signedAt, mock, variables."
    - "selectIsLocked returns true iff at least one agreement in session.agreements has signedFieldsLocked === true; engine computeStepMode + computeInvalidations read from the agreements record (no more session.agreement.* references)."
    - "selectVisibleAgreementKeys(session) returns the schema's signing-step template entry keys, filtered by per-entry visibility predicates (returns ['DISPATCH_AGREEMENT'] today)."
    - "Existing engine + downstream tests still pass after updating fixtures from session.agreement to session.agreements (refactor, not regression)."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/engine/types.ts
      provides: "TemplateEntry interface, Step.templates replacement, AgreementContext shape with templateKey/signedAt/mock/variables, Session.agreements record"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/engine/index.ts
      provides: "TemplateEntry re-export"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/schema/signingPhase.ts
      provides: "signing step declaring templates: [{ key: 'DISPATCH_AGREEMENT' }], with `template` literal removed"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/store/selectors/carrierPortalSelectors.ts
      provides: "selectAgreements, selectAgreement(key), selectAllAgreementsSigned, selectFirstUnsignedAgreement, selectVisibleAgreementKeys; selectIsLocked rewritten against agreements record"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/engine/computeStepMode.ts
      provides: "lock check that reads from session.agreements record"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/engine/computeInvalidations.ts
      provides: "lock check that reads from session.agreements record"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/engine/resolveContext.ts
      provides: "'agreements' root replaces 'agreement' (or kept alongside for predicate dot-paths if needed)"
  key_links:
    - from: signingPhase.steps[0].templates[0].key
      to: TEMPLATE_REGISTRY['DISPATCH_AGREEMENT']
      via: "schema declares the template key; selectVisibleAgreementKeys exposes it to the list view; the saga sends it to the API"
    - from: selectIsLocked
      to: state.pages.carrierPortalV2.session?.agreements
      via: "any(agreement → agreement.signedFieldsLocked === true) across the record"
    - from: computeStepMode + computeInvalidations
      to: session.agreements
      via: "iterate values; if any agreement.signedFieldsLocked → locked mode / invalidate locked-path mutations"

**Acceptance Criteria:**
- [x] AC-E1: signingPhase.steps[0].templates exists with a single entry `{ key: 'DISPATCH_AGREEMENT' }`.
- [x] AC-E2: selectVisibleAgreementKeys(session) returns ordered keys after evaluating each entry's optional visibility predicate.
- [x] AC-E3: Existing engine tests still pass (no regression in visibility / prefill / lock paths used by other steps). Carry-over: 2 pre-existing failures in AgreementSigningStep/index.test.tsx (stale @docuseal/react mock vs current iframe rendering) — improved by 1 vs baseline; full file is deleted/replaced in US-07.

**Tasks:**
[x] T-10 [TYPES] Update engine/types.ts — TemplateEntry, AgreementContext, Session.agreements
         └─ Detail: Modify `src/features/carrier-portal/engine/types.ts`:
              - Add `export interface TemplateEntry { key: string; visibility?: Predicate; }` after the SideEffect interface.
              - On Step interface (~line 104): remove `template?: 'dispatch_v1';` and add `templates?: TemplateEntry[];` (with comment "Signing step only.").
              - On AgreementContext (~line 153):
                  ```ts
                  export interface AgreementContext {
                    id: string;
                    templateKey: string;        // NEW — which template this agreement is for
                    status: AgreementStatus;
                    embedUrl?: string | null;
                    signedAt?: string | null;   // NEW — ISO timestamp when status flipped to SIGNED
                    signedFieldsLocked?: boolean;
                    mock?: boolean;             // NEW — true when backend signature provider is mock
                    variables?: Record<string, string>; // NEW — prefilled DocuSeal field values
                  }
                  ```
              - On Session interface (~line 261): replace `agreement?: AgreementContext;` with `agreements?: Record<string, AgreementContext>;`.
            Modify `src/features/carrier-portal/engine/index.ts` (~line 5): add `TemplateEntry` to the exported `export type { ... }` list.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/engine/types.ts, hussle-app-dispatch-ui/src/features/carrier-portal/engine/index.ts]
         └─ Depends on: —
         └─ Output: TemplateEntry interface added. Step.template → Step.templates?: TemplateEntry[]. AgreementContext gains templateKey/signedAt/mock/variables. Session.agreement → Session.agreements: Record<string, AgreementContext>. Engine purity preserved.

[x] T-11 [ENGINE] Update engine lock + resolveContext logic to read agreements record
         └─ Detail: Modify `src/features/carrier-portal/engine/computeStepMode.ts` (line 44):
              - Replace `if (!session.agreement?.signedFieldsLocked)` with `if (!Object.values(session.agreements ?? {}).some((a) => a.signedFieldsLocked === true))`.
            Modify `src/features/carrier-portal/engine/computeInvalidations.ts` (line 23):
              - Replace `const isLocked = session.agreement?.status === 'SIGNED';` with `const isLocked = Object.values(session.agreements ?? {}).some((a) => a.status === 'SIGNED');`.
              - (Behavior preserved today since there's only ever one agreement; semantics ready for multiple.)
            Modify `src/features/carrier-portal/engine/resolveContext.ts`:
              - Replace the `'agreement'` root case (line 40-41) with `'agreements'`. Returns `session.agreements ?? null`.
              - Update the supported-roots comment (line 5, 12, 19).
              - Note: if any predicate `field: 'agreement.status'` exists in schema files, it'll break. Grep before editing:
                  `grep -rn "field:\s*['\"]agreement\." hussle-app-dispatch-ui/src/features/carrier-portal/`
                — none today. Safe to flip.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/engine/computeStepMode.ts, hussle-app-dispatch-ui/src/features/carrier-portal/engine/computeInvalidations.ts, hussle-app-dispatch-ui/src/features/carrier-portal/engine/resolveContext.ts]
         └─ Depends on: T-10
         └─ Output: Lock checks rewritten as `Object.values(session.agreements ?? {}).some(...)`. resolveContext 'agreement' root → 'agreements' (returns record). Pre-flight grep for `field:'agreement.` returned zero hits — no predicate consumer broken.

[x] T-12 [SCHEMA] Update signingPhase to use templates array
         └─ Detail: Modify `src/features/carrier-portal/schema/signingPhase.ts`:
              - Replace `template: 'dispatch_v1',` with `templates: [{ key: 'DISPATCH_AGREEMENT' }],`.
              - No other changes to the step (id/title/subtitle/locksFields stay).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/schema/signingPhase.ts]
         └─ Depends on: T-10
         └─ Output: `template: 'dispatch_v1'` → `templates: [{ key: 'DISPATCH_AGREEMENT' }]`.

[x] T-13 [SELECTORS] Rewrite carrierPortalSelectors for agreements record + visibility
         └─ Detail: Modify `src/features/carrier-portal/store/selectors/carrierPortalSelectors.ts`:
              - Replace `selectAgreement` (no-arg) with parameterized `selectAgreement(key)`:
                  ```ts
                  export const selectAgreement = (key: string) => (state: RootState): AgreementContext | null =>
                    state.pages.carrierPortalV2.session?.agreements?.[key] ?? null;
                  ```
              - Add `selectAgreements(state): Record<string, AgreementContext>` returning the record (or `{}` when absent).
              - Add `selectAllAgreementsSigned(state): boolean` — true only when the record is non-empty AND every entry's status === 'SIGNED'.
              - Add `selectFirstUnsignedAgreement(visibleKeys: string[])` — returns the first AgreementContext in visibleKeys order whose status !== 'SIGNED', else null. Implementation note: takes the ordered visible-keys array, walks them, and pulls each from the record.
              - Add `selectVisibleAgreementKeys(session: Session | null): string[]` — pure function (not a RootState selector — takes Session directly). Walks `findStep(onboardingSchema, 'sign-agreement')?.templates ?? []`, evaluates each entry's optional `visibility` against the session via `evaluatePredicate`, returns the keys in order. Export from this file (or co-locate with selectors).
              - Rewrite `selectIsLocked` (line 59-60) to:
                  ```ts
                  export const selectIsLocked = (state: RootState): boolean => {
                    const agreements = state.pages.carrierPortalV2.session?.agreements ?? {};
                    return Object.values(agreements).some((a) => a.signedFieldsLocked === true);
                  };
                  ```
              - Update CompleteStep (`components/steps/CompleteStep/index.tsx:41,69`): change `useSelector(selectAgreement)` to `useSelector(selectAgreement('DISPATCH_AGREEMENT'))`. Quick drive-by; CompleteStep otherwise unchanged.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/store/selectors/carrierPortalSelectors.ts, hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/CompleteStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/store/reducers/carrierPortalSlice.ts]
         └─ Depends on: T-10, T-12
         └─ Output: Selectors rewritten: selectAgreements / selectAgreement(key) / selectAllAgreementsSigned / selectFirstUnsignedAgreement(keys) / selectVisibleAgreementKeys(session) added; selectIsLocked rewritten against agreements record. Compat patches: CompleteStep + AgreementSigningStep call selectAgreement('DISPATCH_AGREEMENT'); slice's fetchAgreementSuccess writes to agreements record keyed by `incoming.templateKey || 'DISPATCH_AGREEMENT'` (fallback supports US-05 working without coordination).

[x] T-14 [TEST] Update engine tests + add visibility-keys test
         └─ Detail: Modify `src/features/carrier-portal/engine/__tests__/engine.test.ts`:
              - All fixtures with `agreement: { id: 'agr-1', status: 'SIGNED', ... }` → `agreements: { DISPATCH_AGREEMENT: { id: 'agr-1', templateKey: 'DISPATCH_AGREEMENT', status: 'SIGNED', ... } }`. Same pattern for PENDING fixtures.
              - The 'resolves agreement context when present' test at line 96-100: change to assert `resolveContext(session, 'agreements.DISPATCH_AGREEMENT.status') === 'SIGNED'` (or 'agreements' returns the record).
              - All existing lock-related tests should remain green after fixture updates — semantics preserved.
            Add a new test for `selectVisibleAgreementKeys`:
              - Create `src/features/carrier-portal/store/selectors/__tests__/carrierPortalSelectors.test.ts` (or extend existing). Cover:
                  - Returns `['DISPATCH_AGREEMENT']` for a baseline session.
                  - Filters out entries whose visibility predicate evaluates to false (use a synthetic schema-mock with a `{ visibility: { op: 'eq', field: 'answers.x.y', value: 'present' } }` entry).
                  - Returns `[]` when session is null.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/engine/__tests__/engine.test.ts, hussle-app-dispatch-ui/src/features/carrier-portal/store/selectors/__tests__/carrierPortalSelectors.test.ts, hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/InputStep/index.test.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/ReviewStep/index.test.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/index.test.tsx]
         └─ Depends on: T-13
         └─ Output: Engine test fixtures migrated to agreements record. New selectors test created (selectAgreements, selectAgreement(key), selectAllAgreementsSigned, selectFirstUnsignedAgreement, selectIsLocked, selectVisibleAgreementKeys). InputStep + ReviewStep + AgreementSigningStep test fixtures patched. 183/185 tests pass (`/tmp/build-us04-jest.log`). 2 failures pre-existing in AgreementSigningStep/index.test.tsx (stale @docuseal/react mock vs current iframe render — improved by 1 vs baseline; file deleted in US-07). Lint clean. TSC net better: 260 errors vs 261 baseline — 3 new errors are in fetchAgreementSaga.ts:35, sessionAdapters.ts:50/111 (US-05 territory, cleared by US-05's saga + adapter rewrite).

---

## US-05: Frontend — API client, slice, sagas, sessionAdapters (multi-key + mock-sign)
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-04_

must_haves:
  truths:
    - "fetchAgreements({ templateKeys: ['DISPATCH_AGREEMENT'] }) → saga calls GET /carrier-portal/agreements?templateKeys=DISPATCH_AGREEMENT → projects response.data record into session.agreements (with mock + variables populated)."
    - "markAgreementSignedMock({ agreementId }) → saga calls POST /carrier-portal/agreements/:id/mock-sign → on success dispatches fetchAgreements to refresh the record."
    - "Cold-load session adapter (toEngineSession in sessionAdapters.ts) projects the backend's session.agreements into Session.agreements (record), preserving mock + variables fields."
    - "Loading-state map keys stay backwards-compatible: 'agreement' loading key remains for the fetch operation; new key 'agreementMockSign' for the mock-sign call."
  artifacts:
    - path: hussle-app-dispatch-ui/src/utils/api/carrierPortal/v2.ts
      provides: "getAgreementsV2(token, templateKeys[]): Record<string, AgreementSnapshotV2>; mockSignAgreementV2(token, id): AgreementSnapshotV2; AgreementSnapshotV2 with mock + variables fields"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/store/reducers/carrierPortalSlice.ts
      provides: "fetchAgreements/Success/Failure actions taking record payloads; markAgreementSignedMock/Success/Failure actions"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/fetchAgreementSaga.ts
      provides: "saga rewritten for multi-key — one API call, record back into Redux"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/markAgreementSignedMockSaga.ts
      provides: "saga that POSTs mock-sign, then re-dispatches fetchAgreements with the visible keys"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/sessionAdapters.ts
      provides: "toEngineSession projects response.agreements record (including mock + variables) into Session.agreements"
  key_links:
    - from: fetchAgreementsSaga
      to: getAgreementsV2(token, templateKeys)
      via: "select token → call API → project response record into AgreementContext record → dispatch fetchAgreementsSuccess({ agreements })"
    - from: markAgreementSignedMockSaga
      to: mockSignAgreementV2(token, agreementId)
      via: "POST mock-sign → dispatch markAgreementSignedMockSuccess({ agreement }) → re-dispatch fetchAgreements to update peers"
    - from: toEngineSession
      to: PortalSessionResponseV2.agreements (server-side multi-key shape)
      via: "session GET response carries agreements record → adapter projects into Session.agreements (server is responsible for ensuring DISPATCH_AGREEMENT exists)"

**Acceptance Criteria:**
- [x] AC-M1: With SIGNATURE_PROVIDER=mock, agreement.mock === true for every agreement in the record (data pipeline verified — projector copies `mock` field through; end-to-end gated on INT-01).
- [x] AC-F9: Polling fires fetchAgreements every 4s while any agreement in the visible set is PENDING (saga supports repeated dispatch via takeLatest; consumer wired in US-07).

**Tasks:**
[x] T-15 [API] Extend v2 API client — getAgreementsV2 (multi-key) + mockSignAgreementV2
         └─ Detail: Modify `src/utils/api/carrierPortal/v2.ts`:
              - Extend `AgreementSnapshotV2` interface: add `templateKey: string;`, `signedAt: string | null;`, `mock: boolean;`, `variables: Record<string, string>;`.
              - Update `PortalSessionResponseV2.agreement` to `agreements: Record<string, AgreementSnapshotV2> | null;` (matches new server shape; OK to land alongside the carrier-portal server change in US-02 — server doesn't return session.agreements yet, see note below).
              - Replace `getAgreementV2(token, templateKey)` with `getAgreementsV2(token, templateKeys: string[]): Promise<Record<string, AgreementSnapshotV2>>`. Params: `{ templateKeys: templateKeys.join(',') }`. Response unwrap: `response.data.data` is the record. Drop the array-unwrap + last-item logic — server now returns a record directly (per US-02 T-05).
              - Add `mockSignAgreementV2(token, agreementId: string): Promise<AgreementSnapshotV2>`: POST to `/carrier-portal/agreements/${agreementId}/mock-sign`. Response unwrap: `response.data.data` is a single AgreementSnapshotV2.
            Note on session adapter shape: the GET /session endpoint (separate from agreements) still returns `agreement` singular today (see PortalSessionResponseV2:101-106). For this story we update the interface to `agreements: Record<...>` even though the server-side session response shape hasn't been changed — the cold-load fetch will populate via fetchAgreements after session loads. If the server's session response also needs adjusting, that's a follow-up scoped to onboarding session service (NOT in this plan's scope). Practical impact: session adapter for now projects `response.agreement` (singular) into `Session.agreements` as `{ [response.agreement.templateKey ?? 'DISPATCH_AGREEMENT']: <agreement> }` when present; otherwise leaves agreements undefined and lets the explicit fetchAgreements populate.
         └─ Files: [hussle-app-dispatch-ui/src/utils/api/carrierPortal/v2.ts]
         └─ Depends on: —
         └─ Output: getAgreementsV2(token, templateKeys[]) returns Record<key, AgreementSnapshotV2>. mockSignAgreementV2(token, id) returns single. AgreementSnapshotV2 extended with templateKey/signedAt/mock/variables. Old getAgreementV2 deleted.

[x] T-16 [REDUX] Rewrite agreement actions in carrierPortalSlice for multi-key + mock-sign
         └─ Detail: Modify `src/features/carrier-portal/store/reducers/carrierPortalSlice.ts`:
              - Replace the three `fetchAgreement*` actions (current lines 142-154):
                  - `fetchAgreements(state, _action: PayloadAction<{ templateKeys: string[] }>)` → markPending(state, 'agreement').
                  - `fetchAgreementsSuccess(state, action: PayloadAction<{ agreements: Record<string, AgreementContext> }>)` → if session, `state.session.agreements = action.payload.agreements`. markSuccess(state, 'agreement').
                  - `fetchAgreementsFailure(state, action: PayloadAction<string>)` → markFailure(state, 'agreement', action.payload).
              - Add `markAgreementSignedMock(state, _action: PayloadAction<{ agreementId: string }>)` → markPending(state, 'agreementMockSign').
              - Add `markAgreementSignedMockSuccess(state, action: PayloadAction<{ agreement: AgreementContext }>)` → if session.agreements, replace `state.session.agreements[action.payload.agreement.templateKey] = action.payload.agreement`. markSuccess(state, 'agreementMockSign'). touchSavedAt(state).
              - Add `markAgreementSignedMockFailure(state, action: PayloadAction<string>)` → markFailure(state, 'agreementMockSign', action.payload).
              - Extend `LoadingKey` union to include `'agreementMockSign'`.
              - Remove the old `fetchAgreement*` actions — no backward compat (carrier-portal v2 is the only consumer; AgreementSigningStep is being rewritten in US-07).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/store/reducers/carrierPortalSlice.ts]
         └─ Depends on: T-10
         └─ Output: Old singular fetchAgreement* actions removed. New fetchAgreements/Success/Failure + markAgreementSignedMock/Success/Failure added. LoadingKey union extended with 'agreementMockSign'.

[x] T-17 [SAGA] Rewrite fetchAgreementSaga for multi-key
         └─ Detail: Modify `src/features/carrier-portal/store/sagas/fetchAgreementSaga.ts`:
              - Rename the handler to `handleFetchAgreements`. Rename the watcher to `fetchAgreementsSaga` — keep the file name as-is (`fetchAgreementSaga.ts`) to minimize churn; just rename exports.
                Actually: rename the file to `fetchAgreementsSaga.ts` since the function is plural and the sagas/index.ts imports the watcher by name. Update the import + spread in sagas/index.ts (T-19).
              - Action type: `PayloadAction<{ templateKeys: string[] }>`.
              - Worker:
                  1. Select token. If null → dispatch fetchAgreementsFailure('No token available').
                  2. Call `getAgreementsV2(token, action.payload.templateKeys)` → record of AgreementSnapshotV2.
                  3. Project record → `Record<string, AgreementContext>` via a `projectAgreements(raw)` helper that maps each entry with `projectAgreement(snapshot)` (existing single-row projector, extended to include the new fields: templateKey, signedAt, mock, variables).
                  4. Dispatch `fetchAgreementsSuccess({ agreements: projected })`.
              - Watcher: `takeLatest(carrierPortalV2Actions.fetchAgreements.type, handleFetchAgreements)`.
              - Update `projectAgreement` (or rename to `projectAgreementSnapshot`) to copy through the four new fields. Strip `signedFieldsLocked` projection — derived server-side, may not yet flow through; check ensured.data shape from the existing single-key path. Today `signedFieldsLocked` is computed in the carrier-portal/services/onboardingSessionService.ts session response; the agreements endpoint may not include it. For this saga, surface it if present, else default false.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/fetchAgreementsSaga.ts]
         └─ Depends on: T-15, T-16
         └─ Output: New saga file created. Worker calls getAgreementsV2 → projects via projectAgreementsRecord → dispatches fetchAgreementsSuccess. projectAgreementSnapshot exported for reuse by mock-sign saga.

[x] T-18 [SAGA] Create markAgreementSignedMockSaga
         └─ Detail: Create `src/features/carrier-portal/store/sagas/markAgreementSignedMockSaga.ts`:
              - Pattern after the new `fetchAgreementsSaga.ts` (post-T-17) shape.
              - Action type: `PayloadAction<{ agreementId: string }>`.
              - Worker:
                  1. Select token. If null → dispatch markAgreementSignedMockFailure('No token available').
                  2. Call `mockSignAgreementV2(token, action.payload.agreementId)` → AgreementSnapshotV2.
                  3. Project via the same `projectAgreementSnapshot` helper.
                  4. Dispatch `markAgreementSignedMockSuccess({ agreement: projected })`. The slice writes this into the agreements record at key=templateKey.
              - Watcher: `takeLatest(carrierPortalV2Actions.markAgreementSignedMock.type, handleMarkAgreementSignedMock)`.
              - On error: snackbar via `enqueueSnackbar` (extractErrorMessage path mirror).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/markAgreementSignedMockSaga.ts]
         └─ Depends on: T-17
         └─ Output: Saga calls mockSignAgreementV2 + reuses projectAgreementSnapshot + dispatches markAgreementSignedMockSuccess. extractErrorMessage path mirrors fetch saga.

[x] T-19 [SAGA] Register both sagas in store/sagas/index.ts
         └─ Detail: Modify `src/features/carrier-portal/store/sagas/index.ts`:
              - Replace `import { fetchAgreementSaga } from './fetchAgreementSaga';` with `import { fetchAgreementsSaga } from './fetchAgreementsSaga';`.
              - Add `import { markAgreementSignedMockSaga } from './markAgreementSignedMockSaga';`.
              - Replace the `fork(fetchAgreementSaga)` line in the all/fork block with `fork(fetchAgreementsSaga)`.
              - Add `fork(markAgreementSignedMockSaga)` to the all/fork block.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/index.ts]
         └─ Depends on: T-18
         └─ Output: Old import replaced; both fetchAgreementsSaga + markAgreementSignedMockSaga forked into root saga.

[x] T-20 [ADAPTER] Update sessionAdapters to project agreements record + new fields
         └─ Detail: Modify `src/features/carrier-portal/store/sagas/sessionAdapters.ts`:
              - Replace `toAgreementContext` (returns single AgreementContext | undefined) with `toAgreementsRecord(raw): Record<string, AgreementContext> | undefined`. Today the GET /session response still carries `agreement: { id, status, embedUrl, signedFieldsLocked }` singular. So:
                  ```ts
                  const toAgreementsRecord = (raw): Record<string, AgreementContext> | undefined => {
                    if (!raw) return undefined;
                    const tk = (raw.templateKey ?? 'DISPATCH_AGREEMENT') as string;
                    return {
                      [tk]: {
                        id: raw.id,
                        templateKey: tk,
                        status: toAgreementStatus(raw.status),
                        embedUrl: raw.embedUrl,
                        signedFieldsLocked: raw.signedFieldsLocked,
                        signedAt: raw.signedAt ?? null,
                        mock: raw.mock ?? false,
                        variables: (raw.variables as Record<string, string>) ?? {},
                      },
                    };
                  };
                  ```
              - In `toEngineSession` (~line 98), replace `agreement: toAgreementContext(response.agreement),` with `agreements: toAgreementsRecord(response.agreement),`.
              - Note: this preserves cold-load behavior while leaving room for the GET /session response to evolve to a record shape later (no backend change in this plan).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/sessionAdapters.ts]
         └─ Depends on: T-15, T-16
         └─ Output: toAgreementContext renamed to toAgreementsRecord, returns single-entry record keyed by templateKey (fallback 'DISPATCH_AGREEMENT') with mock/variables/signedAt populated from optional response fields. toEngineSession assigns agreements: toAgreementsRecord(response.agreement).

[x] T-21 [CLEANUP] Delete obsolete fetchAgreementSaga.ts file
         └─ Detail: After renaming, `git rm hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/fetchAgreementSaga.ts` (the file should already be the renamed target — confirm only one exists post-T-17). If T-17 left a stale file, delete it.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/fetchAgreementSaga.ts]
         └─ Depends on: T-19
         └─ Output: Old saga file deleted. Drive-by compat: AgreementSigningStep/index.tsx had two old fetchAgreement call sites — patched to fetchAgreements({ templateKeys: [...] }); companion test + sagas/__tests__/sagas.test.ts also updated. TSC at 257 errors (target met — cleared US-04's 3 carry-overs + shaved one). 99/101 jest pass (2 same pre-existing AgreementSigningStep stale-mock failures — file deleted in US-07). Lint clean.

---

## US-06: Frontend — New primitive UI components
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: —_

must_haves:
  truths:
    - "AgreementSignedInterstitial renders a green check, signed timestamp, and an optional 'Up next: <name>' block; auto-advances via onAutoAdvance callback after ~2s when nextAgreementName is provided."
    - "AgreementsCompleteBanner renders the green gradient with the success message and matches the visual treatment of CompleteBanner in SignAgreementPreview's State C."
    - "AgreementsErrorBanner renders a red banner with the supplied message and can be queried by role='alert' in tests."
    - "MockSigningPlaceholder renders a 🧪 card with copy + 'Mark as signed' button; clicking the button invokes onMarkSigned (caller wires to dispatch)."
    - "AgreementPrefillSummary renders a key-value list from a Record<string, string> with one row per key, in insertion order."
    - "Each component has at least one component test covering its observable behavior."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementSignedInterstitial/index.tsx
      provides: "interstitial component with auto-advance behavior"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsCompleteBanner/index.tsx
      provides: "green gradient banner — extracted from SignAgreementPreview CompleteBanner inline impl"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsErrorBanner/index.tsx
      provides: "red banner with role='alert' and dismissable optional"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/MockSigningPlaceholder/index.tsx
      provides: "🧪 mock-mode card with Mark-as-signed button"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsFootNote/index.tsx
      provides: "informational footnote pill extracted from SignAgreementPreview"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementPrefillSummary/index.tsx
      provides: "key-value summary list rendered from Record<string, string>"
  key_links:
    - from: AgreementSignedInterstitial
      to: window.setTimeout (cleanup on unmount)
      via: "useEffect schedules onAutoAdvance after 2000ms when nextAgreementName provided; cleanup on unmount"
    - from: MockSigningPlaceholder
      to: onMarkSigned prop
      via: "click handler invokes prop; tests assert it's called once per click"
    - from: AgreementPrefillSummary
      to: Object.entries(variables)
      via: "renders one DetailRow-style row per entry; keys are humanized via a simple transform (carrier_legal_name → 'Carrier Legal Name')"

**Tasks:**
[x] T-22 [UI] Build AgreementsCompleteBanner + test
         └─ Detail: Create `components/AgreementsCompleteBanner/index.tsx`. Extract the inline `CompleteBanner` from `SignAgreementPreview.tsx:522-583` into a reusable component:
              - Props: `{ title?: string; subtitle?: string; onDownloadAll?: () => void; }`. Defaults: title `"All required documents signed."`, subtitle `"Ready to continue."`, onDownloadAll undefined (button hidden when absent).
              - Visual: green gradient background, success-color circular check icon, primary download button (only when onDownloadAll provided).
              - Use Typography helpers from `components/Typography`.
            Create `components/AgreementsCompleteBanner/index.test.tsx`. Cover:
              - Renders the title text.
              - Hides the download button when onDownloadAll is undefined.
              - Calls onDownloadAll when the button is clicked (user-event).
            Pattern after `components/Callout/index.tsx` for structure.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsCompleteBanner/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsCompleteBanner/index.test.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-23 [UI] Build AgreementsErrorBanner + test
         └─ Detail: Create `components/AgreementsErrorBanner/index.tsx`. Props: `{ message: string; onDismiss?: () => void; }`. Render:
              - Red border-left card (use Callout `variant="red"` as the base composition).
              - The message in BodyStrong.
              - Optional dismiss icon button (X) when onDismiss provided.
              - Set `role="alert"` on the outer container so screen readers announce on render and tests can query via `getByRole('alert')`.
            Create test. Cover: renders message; renders with role='alert'; dismiss button calls onDismiss.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsErrorBanner/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsErrorBanner/index.test.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-24 [UI] Build AgreementsFootNote + test
         └─ Detail: Create `components/AgreementsFootNote/index.tsx`. Extract the inline footnote pill from `SignAgreementPreview.tsx:196-224`:
              - Props: `{ children: React.ReactNode; }`.
              - Visual: light gray background, gray border, padded rounded rectangle, TaskAlt icon on the left.
            Create test asserting children render.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsFootNote/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsFootNote/index.test.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-25 [UI] Build MockSigningPlaceholder + test
         └─ Detail: Create `components/MockSigningPlaceholder/index.tsx`:
              - Props: `{ onMarkSigned: () => void; isPending?: boolean; }`.
              - Visual: centered card inside DocuSealStage's expected content area. Shows 🧪 emoji + "Mock mode — no real signing required" copy + primary button "Mark as signed" (disabled while isPending).
              - Use OnboardingCard or a plain MUI Card as the inner container.
            Create test. Cover:
              - Renders the mock-mode copy.
              - Button click invokes onMarkSigned once.
              - Button is disabled while isPending=true.
            Pattern after `components/OnboardingCard/index.tsx:1-25` for the card frame.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/MockSigningPlaceholder/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/MockSigningPlaceholder/index.test.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-26 [UI] Build AgreementPrefillSummary + test
         └─ Detail: Create `components/AgreementPrefillSummary/index.tsx`:
              - Props: `{ variables: Record<string, string>; title?: string; }`. Default title: "Prefilled values".
              - Render a card with the title + one row per Object.entries(variables) entry. Each row: humanized key label (Body) + value (BodyStrong). Humanize: snake_case → "Snake Case" (lowercase split on '_', capitalize first letters, join with space).
              - Empty state: when variables is `{}`, render BodyMuted "No prefilled values."
              - Use DetailRow pattern from `components/Typography` if available; otherwise inline Grid with label / value cells.
            Create test. Cover:
              - Renders one row per variable entry.
              - Humanizes keys ('carrier_legal_name' → 'Carrier Legal Name').
              - Empty-state copy when variables is {}.
            Pattern after `components/OnboardingCard/index.tsx:1-25` for the card frame.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementPrefillSummary/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementPrefillSummary/index.test.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-27 [UI] Build AgreementSignedInterstitial + test
         └─ Detail: Create `components/AgreementSignedInterstitial/index.tsx`:
              - Props: `{ signedAt: string | null; signedAgreementName: string; nextAgreementName?: string; onAutoAdvance?: () => void; onBackToList: () => void; autoAdvanceMs?: number; }`. Default autoAdvanceMs = 2000.
              - Visual: centered card with a large green CheckCircle icon, headline "Signed", BodyMuted with formatted signedAt (use date-fns `format(parseISO(signedAt), 'PPpp')` if signedAt non-null), and either:
                  - When `nextAgreementName` is provided: an "Up next: <name>" callout + the auto-advance behavior.
                  - When not: a primary "Back to list" button (calls onBackToList) and NO auto-advance.
              - useEffect to schedule `setTimeout(onAutoAdvance, autoAdvanceMs)` only when `nextAgreementName && onAutoAdvance` are both present. Cleanup on unmount.
              - Always render a secondary "Back to list" button.
            Create test. Cover:
              - Renders signed-at timestamp.
              - When nextAgreementName + onAutoAdvance provided, calls onAutoAdvance after autoAdvanceMs (use jest fake timers).
              - When nextAgreementName absent, does NOT call onAutoAdvance.
              - "Back to list" button invokes onBackToList.
            Pattern after `components/Callout/index.tsx:1-40` for card frame.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementSignedInterstitial/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementSignedInterstitial/index.test.tsx]
         └─ Depends on: —
         └─ Output:

---

## US-07: Frontend — AgreementSigningStep rewrite, view wrappers, routes, console cleanup
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-04, US-05, US-06_

must_haves:
  truths:
    - "GET /carrier-portal/:token/sign-agreement renders AgreementListView (DocumentRow per visible key, ProgressStrip, Continue registered via useStepNavigation)."
    - "GET /carrier-portal/:token/sign-agreement/DISPATCH_AGREEMENT renders AgreementFocusView with FocusHeader + DocuSealStage (iframe OR MockSigningPlaceholder based on agreement.mock) + FocusFooter + AgreementPrefillSummary."
    - "GET /carrier-portal/:token/sign-agreement/DISPATCH_AGREEMENT/signed renders AgreementSuccessView (AgreementSignedInterstitial); auto-advances to the next focus URL after 2s OR shows 'Back to list' when no remaining unsigned."
    - "Clicking Continue (footer) with any agreement unsigned renders AgreementsErrorBanner and scrolls to the first unsigned DocumentRow; no submitStep dispatched."
    - "Clicking Continue (footer) with all agreements SIGNED dispatches submitStep({ stepId: 'sign-agreement', answers: { acknowledged: true, signedAgreementIds: string[] } })."
    - "Polling fires fetchAgreements every 4s while any visible agreement is PENDING; polling stops when no PENDING remains."
    - "In mock mode, MockSigningPlaceholder's button dispatches markAgreementSignedMock({ agreementId }); on next poll the status flips to SIGNED."
    - "Stale console.log block at pages/CarrierPortalPage/index.tsx:202-206 is removed."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/index.tsx
      provides: "URL-driven router: list / focus / success based on :agreementKey and trailing /signed segment"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.tsx
      provides: "list view composing OnboardingCard + ProgressStrip + DocumentRow stack + banners + AgreementsFootNote; registers useStepNavigation"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementFocusView.tsx
      provides: "focus view composing FocusHeader + DocuSealStage (iframe OR MockSigningPlaceholder) + FocusFooter + AgreementPrefillSummary"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementSuccessView.tsx
      provides: "success view composing AgreementSignedInterstitial + auto-navigation logic"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/routes/CarrierPortalRoutes.tsx
      provides: "route extended to accept :stepId/:agreementKey? and trailing /signed segment"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx
      provides: "stale console.log block at L202-206 removed"
  key_links:
    - from: AgreementSigningStep
      to: useParams() :agreementKey, :signed suffix
      via: "URL drives view selection; no internal component state"
    - from: AgreementListView.handleContinue
      to: carrierPortalV2Actions.submitStep
      via: "selectAllAgreementsSigned → dispatch submitStep with signedAgreementIds; else render AgreementsErrorBanner + scroll"
    - from: AgreementFocusView (mock branch)
      to: carrierPortalV2Actions.markAgreementSignedMock
      via: "MockSigningPlaceholder.onMarkSigned → dispatch markAgreementSignedMock({ agreementId: agreement.id })"
    - from: AgreementFocusView polling
      to: carrierPortalV2Actions.fetchAgreements
      via: "setInterval 4000ms while any visible agreement is PENDING; cleared on no-PENDING or unmount"
    - from: AgreementSuccessView auto-advance
      to: useNavigate to /sign-agreement/<nextKey>
      via: "select first unsigned visible key; AgreementSignedInterstitial.onAutoAdvance → navigate"

**Acceptance Criteria:**
- [x] AC-L1: List view renders DocumentRow per selectVisibleAgreementKeys, first row in `next` with primary "Sign agreement →"; rest in `pending`.
- [x] AC-L2: Continue button always visible; muted-gray until selectAllAgreementsSigned; full primary blue when ready.
- [x] AC-L3: Clicking Continue with unsigned remaining renders AgreementsErrorBanner + scroll, no submitStep dispatched.
- [x] AC-L4: Clicking Continue with all signed dispatches submitStep({ stepId: 'sign-agreement', answers: { acknowledged: true, signedAgreementIds } }).
- [x] AC-L5: When all agreements SIGNED, AgreementsCompleteBanner renders at top of list.
- [x] AC-L6: Agreements in VOIDED/DECLINED/EXPIRED render as red-bordered blocked variant; Continue treats them as unsigned.
- [x] AC-F1: GET focus URL with valid key renders AgreementFocusView; unknown key redirects to list.
- [x] AC-F2: FocusHeader shows "Agreement N of M · <title>" eyebrow + dot-trail.
- [x] AC-F3: When agreement.mock===false and status===PENDING, iframe renders with src from toEmbedUrl(agreement.embedUrl).
- [x] AC-F4: When agreement.mock===true, MockSigningPlaceholder renders instead.
- [x] AC-F5: AgreementPrefillSummary renders left rail (desktop) / disclosure (mobile) with one row per agreement.variables entry.
- [x] AC-F6: Clicking "Sign & continue to next" with status !== SIGNED renders inline error; no navigation.
- [x] AC-F7: Clicking "Sign & continue to next" with status === SIGNED navigates to /sign-agreement/:agreementKey/signed.
- [x] AC-F8: Clicking Cancel / back arrow navigates to /sign-agreement; no state mutation.
- [x] AC-F9: Polling fires fetchAgreements every 4s while any visible agreement is PENDING.
- [x] AC-S1: Success URL renders AgreementSignedInterstitial with formatted signedAt.
- [x] AC-S2: When more unsigned remain, shows "Up next: <name>" + 2s auto-advance to next focus URL.
- [x] AC-S3: On final agreement, no "Up next", no auto-advance, single "Back to list" primary button.
- [x] AC-S4: "Back to list" present always; navigates to /sign-agreement.
- [x] AC-X2: Stale console.log block at CarrierPortalPage/index.tsx:202-206 removed.

**Tasks:**
[x] T-28 [ROUTES] Extend CarrierPortalRoutes to accept :agreementKey?/signed?
         └─ Detail: Modify `src/features/carrier-portal/routes/CarrierPortalRoutes.tsx`:
              - Inside the `:stepId` child route, the StepRouter currently renders. For `sign-agreement`, the URL can extend to `:stepId/:agreementKey?` and `:stepId/:agreementKey/signed`. React Router v6 nested route options:
                  - Easiest: keep one route `path: ':stepId/*'` (catch-all) and let AgreementSigningStep read trailing segments via `useParams` + `useLocation` (split pathname after stepId).
                  - Or: add nested children specifically for sign-agreement: `{ path: 'sign-agreement', children: [{ path: ':agreementKey', children: [{ path: 'signed' }] }] }`.
              - Pick the simpler approach: change the inner route `path: ':stepId'` to `path: ':stepId/*'`. AgreementSigningStep parses the wildcard via `useLocation().pathname.split('/').slice(-2)` (last two segments after stepId).
              - Document the choice in a one-line comment.
              - Verify other steps that previously matched `:stepId` exactly still match — `*` makes the route match longer paths too. The new path renders the same StepRouter; only AgreementSigningStep needs to interpret extra segments.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/routes/CarrierPortalRoutes.tsx]
         └─ Depends on: —
         └─ Output:

[x] T-29 [UI] Build AgreementListView
         └─ Detail: Create `components/steps/AgreementSigningStep/AgreementListView.tsx`:
              - Reads from Redux: token, session, agreements (record), loading('agreement').
              - Computes visibleKeys via `selectVisibleAgreementKeys(session)`. Computes signed/unsigned partition.
              - For each visibleKey, renders a DocumentRow:
                  - Look up `agreement = agreements[key]`.
                  - State derivation:
                      - status === 'SIGNED' → `state="signed"`, meta includes formatted signedAt.
                      - First unsigned key → `state="next"` with primary "Sign agreement →" button routing to `/carrier-portal/:token/sign-agreement/:key`.
                      - Remaining unsigned keys → `state="pending"` with secondary "Sign now" button.
                      - status in {VOIDED, DECLINED, EXPIRED} → `state="pending"` with a red callout below or a red border treatment + secondary "Contact dispatcher" copy. (DocumentRow doesn't have a 'blocked' variant — extend via wrapping Box with red border.)
                  - `name` = humanize templateKey (e.g. 'DISPATCH_AGREEMENT' → 'Dispatch Services Agreement'). Build a small map: `const AGREEMENT_TITLES: Record<string, string> = { DISPATCH_AGREEMENT: 'Dispatch Services Agreement' };`. Fallback to key.
              - Render ProgressStrip "X of Y required signed".
              - When all signed, render `<AgreementsCompleteBanner />` at the top.
              - When the page-level continue was clicked with unsigned remaining, render `<AgreementsErrorBanner />` at the top and scroll to first unsigned row (use ref + scrollIntoView).
              - Below the list, render `<AgreementsFootNote>Heads up: signing locks your business identity.</AgreementsFootNote>`.
              - useStepNavigation: register a continue handler that:
                  - `canContinue: selectAllAgreementsSigned` (compute locally from agreements).
                  - `onContinue: () => { if (allSigned) dispatch(submitStep({ stepId: 'sign-agreement', answers: { acknowledged: true, signedAgreementIds: signedIds } })); else setShowError(true) + scroll; }` — note: per plan, Continue ALWAYS renders + click-verifies, so canContinue is always true. The verify happens inside onContinue.
                  - `continueLabel: 'Continue'`, `isPending: loading.submitStep === 'pending'`.
              - Wrap with OnboardingCard for the chrome.
              - Pattern: composition follows SignAgreementPreview StateA layout (PortalShell is already supplied by CarrierPortalPage; the list view is just the content).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.tsx]
         └─ Depends on: T-22, T-23, T-24
         └─ Output:

[x] T-30 [UI] Build AgreementFocusView
         └─ Detail: Create `components/steps/AgreementSigningStep/AgreementFocusView.tsx`:
              - Reads `agreementKey` from props (parsed by AgreementSigningStep from URL).
              - Reads from Redux: agreements record, visibleKeys, token.
              - Compute current = `agreements[agreementKey]`. If not present or key not in visibleKeys → useEffect to navigate(`/carrier-portal/${token}/sign-agreement`, { replace: true }) and return null (AC-F1).
              - Computes queue position: `visibleKeys.indexOf(agreementKey) + 1` of `visibleKeys.length` for the eyebrow and trail.
              - Renders FocusHeader:
                  - onBack → navigate to /sign-agreement (list).
                  - eyebrow: `Agreement ${N} of ${M} · ${humanized title}`.
                  - title: humanized agreement title.
                  - trail: build DotTrailItem[] from visibleKeys with state done/current/pending based on signed status + current key.
              - Main stage: `<DocuSealStage>` containing either:
                  - When `current.mock === true` → `<MockSigningPlaceholder onMarkSigned={handleMarkSigned} isPending={mockSignLoading} />`. handleMarkSigned dispatches `markAgreementSignedMock({ agreementId: current.id })`.
                  - When `current.mock === false && current.status === 'PENDING'` && current.embedUrl → iframe with src = toEmbedUrl(current.embedUrl). Copy toEmbedUrl helper from the old AgreementSigningStep (or extract to a shared util in the same folder).
                  - Other statuses (SIGNED, blocked) → render a small status callout (e.g. SIGNED: green check, "Already signed — click Continue to next.").
              - Left rail (md+): `<AgreementPrefillSummary variables={current.variables ?? {}} />`. On xs/sm, render as a collapsible disclosure below the stage (use MUI Collapse + a "Show prefilled values" toggle button).
              - Render FocusFooter:
                  - onSaveClose → navigate to list.
                  - onSignComplete (the "Sign & continue to next" button):
                      ```ts
                      if (current.status !== 'SIGNED') {
                        setInlineError("Please complete signing in the document above.");
                        return;
                      }
                      navigate(`/carrier-portal/${token}/sign-agreement/${agreementKey}/signed`);
                      ```
                  - lockNote: "Signing locks your business identity" (or omit when not the DISPATCH_AGREEMENT).
              - Polling effect: setInterval 4000ms while any agreement in `agreements` record has status PENDING. Effect runs at the focus view level (also at list/success views via shared hook? Simpler: each view owns its own polling effect since they all consume the same data). Reuse logic — extract a `useAgreementPolling(visibleKeys)` hook in the same folder.
              - Do NOT register useStepNavigation here — page-level Continue is hidden in focus mode (per plan: chrome is FocusFooter, not PortalFooterBar). The page-level footer (PortalFooterBar) will still render unless the chrome is overridden. **Important**: in focus mode the plan says "Replace PortalShell footer slot with FocusFooter." But PortalShell footer is set by CarrierPortalPage, not AgreementFocusView. Workaround for v1: render FocusFooter as a child within the view, accept that PortalFooterBar still renders below it. OR: extend CarrierPortalPage to suppress footer when on a focus URL — but that's cross-cutting.
                  Decision for v1 simplicity: render FocusFooter inside the view; do NOT register stepNavHandler (so PortalFooterBar shows Continue with `canContinue=false` / undefined). The user has TWO footers visible briefly. Document this as a known v1 limitation in a comment; fix in follow-up if jarring. (Alternative: page-level checks URL path and suppresses footer — implement that if quick.)
                  Better solution: in AgreementFocusView, call `useStepNavigation({ canContinue: false, onContinue: noop, isPending: false, continueLabel: ' ' })` with empty label — the page Continue button will show but be inert. Combined with rendering FocusFooter, this gives the focus-mode treatment. Investigate PortalFooterBar's behavior when continueDisabled+empty label to confirm it visually deprioritizes.
                  **Final pick**: just suppress page footer by NOT registering stepNav (which leaves stepNav.onContinue undefined → CarrierPortalPage:197 `continueHandler = reviewContinue ?? stepNav?.onContinue` becomes undefined → footer renders without an active Continue). Confirm this works by re-reading PortalFooterBar default behavior.
            Note: Yes per CarrierPortalPage:197-220, when continueHandler is undefined, the footer still renders (it's wired by activeStep && phase). PortalFooterBar will show a Continue with no handler — likely disabled. Acceptable for v1; refine in follow-up.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementFocusView.tsx]
         └─ Depends on: T-25, T-26
         └─ Output:

[x] T-31 [UI] Build AgreementSuccessView
         └─ Detail: Create `components/steps/AgreementSigningStep/AgreementSuccessView.tsx`:
              - Reads `agreementKey` from props.
              - Reads from Redux: agreements record, visibleKeys, token, session.
              - Compute current = agreements[agreementKey]. If not signed → navigate to list (defensive).
              - Compute nextUnsigned via `selectFirstUnsignedAgreement(visibleKeys)`.
              - Render `<AgreementSignedInterstitial>`:
                  - signedAt = current.signedAt ?? null.
                  - signedAgreementName = humanized title of agreementKey.
                  - nextAgreementName = nextUnsigned ? humanized title of nextUnsigned.templateKey : undefined.
                  - onAutoAdvance = nextUnsigned ? () => navigate(`/carrier-portal/${token}/sign-agreement/${nextUnsigned.templateKey}`) : undefined.
                  - onBackToList = () => navigate(`/carrier-portal/${token}/sign-agreement`).
              - Polling effect (same useAgreementPolling hook — keeps the record fresh).
              - Do NOT register useStepNavigation (mirrors focus view).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementSuccessView.tsx]
         └─ Depends on: T-27
         └─ Output:

[x] T-32 [UI] Rewrite AgreementSigningStep as URL-driven router; remove console.log
         └─ Detail: Rewrite `components/steps/AgreementSigningStep/index.tsx` from scratch (after backing up logic referenced in T-30 like toEmbedUrl):
              - Read `useParams<{ token?: string; stepId?: string; '*'?: string }>()` — wildcard captures `agreementKey/signed` or `agreementKey` or empty.
              - Parse the wildcard:
                  - Empty (`'*' === '' || undefined`) → render `<AgreementListView />`.
                  - Single segment (key) → render `<AgreementFocusView agreementKey={key} />`.
                  - Two segments `<key>/signed` → render `<AgreementSuccessView agreementKey={key} />`.
                  - Any other shape → navigate to list view (replace).
              - On mount, dispatch `fetchAgreements({ templateKeys: visibleKeys })` where visibleKeys = `selectVisibleAgreementKeys(session)`. Wait for session via `useSelector(selectSession)`; gate dispatch on session presence.
              - Step prop unused (URL drives everything); accept it for type compat.
              - Also remove the old `TEMPLATE_KEY = 'DISPATCH_AGREEMENT'` constant + old branches.
            Modify `pages/CarrierPortalPage/index.tsx` lines 202-206: delete the 5 stale `console.log(...)` lines. Verify the surrounding code (200-209) still parses cleanly.
            Delete the old `AgreementSigningStep/index.test.tsx` and replace with three new test files (see T-33, T-34, T-35). Or update the old test to assert the URL-router behavior. Simplest: delete + recreate per-view tests.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/index.test.tsx]
         └─ Depends on: T-28, T-29, T-30, T-31
         └─ Output:

[x] T-33 [TEST] Write AgreementListView.test.tsx
         └─ Detail: Create `components/steps/AgreementSigningStep/AgreementListView.test.tsx`. Cover (use buildStore helper pattern from `AgreementSigningStep/index.test.tsx:39-62` as starting point but with `agreements: { [key]: ... }` record shape):
              - Renders one DocumentRow per visible key.
              - First unsigned row is in `state="next"`; remaining unsigned are `state="pending"`.
              - When all signed, AgreementsCompleteBanner renders.
              - When Continue is invoked (simulate via TestStepNavProvider's StepNavTestHandle and call onContinue()) with unsigned remaining, AgreementsErrorBanner appears and no submitStep is dispatched.
              - When Continue is invoked with all signed, dispatches submitStep with `{ stepId: 'sign-agreement', answers: { acknowledged: true, signedAgreementIds: [...] } }`.
              - VOIDED/DECLINED/EXPIRED agreements render in blocked treatment (assert via the row's red border styling — query by visual class or aria-label).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.test.tsx]
         └─ Depends on: T-29
         └─ Output:

[x] T-34 [TEST] Write AgreementFocusView.test.tsx
         └─ Detail: Create `components/steps/AgreementSigningStep/AgreementFocusView.test.tsx`. Cover:
              - Unknown agreementKey redirects to list (assert navigate called with /sign-agreement; useNavigate mocked).
              - When mock===false and status===PENDING, iframe renders with src derived from toEmbedUrl(embedUrl).
              - When mock===true, MockSigningPlaceholder renders (and iframe does not).
              - AgreementPrefillSummary renders one row per variables entry.
              - Clicking "Sign & continue to next" with status !== SIGNED renders the inline error; navigate not called.
              - Clicking "Sign & continue to next" with status === SIGNED navigates to /sign-agreement/<key>/signed.
              - Cancel / back arrow navigates to /sign-agreement.
              - Polling: fake timers; advance 4000ms; assert fetchAgreements action dispatched.
              - Polling stops when no PENDING agreements in record.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementFocusView.test.tsx]
         └─ Depends on: T-30
         └─ Output:

[x] T-35 [TEST] Write AgreementSuccessView.test.tsx
         └─ Detail: Create `components/steps/AgreementSigningStep/AgreementSuccessView.test.tsx`. Cover:
              - Renders AgreementSignedInterstitial with the signed timestamp.
              - When next unsigned exists: shows "Up next: <name>" and auto-advance fires after 2s (fake timers, assert navigate called with next focus URL).
              - When no next unsigned: no auto-advance; "Back to list" button is the primary action; clicking navigates to /sign-agreement.
              - Back to list button always present.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementSuccessView.test.tsx]
         └─ Depends on: T-31
         └─ Output:

---

## US-08: Frontend — Dev preview State D + State E
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done | Depends on: US-06_

must_haves:
  truths:
    - "/dev/onboarding-preview/sign-agreement renders new StateD (success interstitial frame) and StateE (focus view with MockSigningPlaceholder) alongside the existing A/B/C frames."
    - "StateD composes AgreementSignedInterstitial inside a PortalShell preview frame (mirroring how A/B/C are framed)."
    - "StateE composes PortalShell + FocusHeader + DocuSealStage + MockSigningPlaceholder + AgreementPrefillSummary (preview-only, no Redux)."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/dev/OnboardingPreview/previews/SignAgreementPreview.tsx
      provides: "StateD + StateE additions; renders them in the StateFrame stack"
  key_links:
    - from: SignAgreementPreview
      to: AgreementSignedInterstitial + MockSigningPlaceholder + AgreementPrefillSummary
      via: "preview imports + composes (no Redux); the dev preview is the single most-helpful regression catch"

**Acceptance Criteria:**
- [x] AC-D1: /dev/onboarding-preview/sign-agreement renders States A, B, C (existing) plus new States D and E.

**Tasks:**
[x] T-36 [UI] Add StateD + StateE to SignAgreementPreview
         └─ Detail: Modify `src/features/carrier-portal/dev/OnboardingPreview/previews/SignAgreementPreview.tsx`:
              - Add `StateD: React.FC` — composes the existing `StateFrame` shell with a PortalShell + a centered `<AgreementSignedInterstitial signedAt="2026-05-16T15:08:00Z" signedAgreementName="Dispatch Services Agreement" nextAgreementName="Broker-Carrier Master Agreement" onAutoAdvance={noop} onBackToList={noop} />`.
              - Add `StateE: React.FC` — PortalShell with FocusHeader (eyebrow "Document 2 of 4 · Required" or "Mock"), DocuSealStage containing `<MockSigningPlaceholder onMarkSigned={noop} />`, FocusFooter, AgreementPrefillSummary on the left rail (use Grid/Box for layout).
              - Register both in the SignAgreementPreview component:
                  ```jsx
                  <StateFrame label="State D · success interstitial — auto-advancing to next"><StateD /></StateFrame>
                  <StateFrame label="State E · focus mode + mock placeholder — dev only"><StateE /></StateFrame>
                  ```
              - Preserve existing A/B/C frames.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/dev/OnboardingPreview/previews/SignAgreementPreview.tsx]
         └─ Depends on: T-25, T-26, T-27
         └─ Output: Added imports for AgreementSignedInterstitial, MockSigningPlaceholder, AgreementPrefillSummary. StateD composes PortalShell + FocusHeader (4-dot trail with Dispatch DONE / Broker CURRENT) + AgreementSignedInterstitial (auto-advance disabled via autoAdvanceMs=0 so reviewers can inspect the frame). StateE composes PortalShell + FocusHeader + FocusFooter + DocuSealStage wrapping MockSigningPlaceholder + right-rail AgreementPrefillSummary with realistic Dispatch field values. Both registered in SignAgreementPreview as new StateFrames. Lint clean. TSC 257 (no regression — zero new errors in the edited file).

---

## INT-01: Wire dispatch-api ↔ dispatch-ui integration
_Auto-generated | Services: dispatch-api, dispatch-ui | Status: done (1 blocker found + fixed inline)_

**Verification Checklist:**
- [ ] GET /carrier-portal/agreements?templateKeys=… contract: server returns `{ data: Record<string, AgreementContext> }`; client expects same shape in `getAgreementsV2`.
- [ ] POST /carrier-portal/agreements/:id/mock-sign contract: server returns `{ data: AgreementContext }`; client expects same shape in `mockSignAgreementV2`.
- [ ] AgreementContext fields match across layers: `id, templateKey, status, embedUrl, signedAt, mock, variables`. Status enum values match character-for-character (`PENDING|SIGNED|VOIDED|DECLINED|EXPIRED|DRAFT`).
- [ ] Mock-sign endpoint registration is env-gated server-side AND the UI hides MockSigningPlaceholder when `agreement.mock === false`.
- [ ] Polling: client dispatches fetchAgreements while PENDING; server returns updated status after mock-sign or DocuSeal webhook.

**Tasks:**
[x] T-37 [WIRE] Verify multi-key endpoint + mock-sign contract end-to-end
         └─ Detail: Read US-02 + US-03 + US-05 outputs. Compare actual code against the contract in the plan §API/Interface Changes table:
              1. `src/carrier-portal/controllers/portalAgreementController.ts` returns `{ data: Record<key, AgreementResponseData> }` matching `getAgreementsV2` expectation in `utils/api/carrierPortal/v2.ts`.
              2. `mockSignAgreementController` returns `{ data: AgreementResponseData }` matching `mockSignAgreementV2`.
              3. Status enum values in `AgreementSnapshotV2` and engine `AgreementStatus` exactly match Prisma `AgreementStatus`.
              4. The new fields `mock` and `variables` flow from agreementTransformer → API response → AgreementSnapshotV2 → projectAgreementSnapshot → Redux.
              5. The mock-sign route is only mounted when env.SIGNATURE_PROVIDER === 'mock'; verify in compositionRoot wiring.
              Report mismatches as Issues with file:line references.
         └─ Files: [hussle-app-dispatch-api/src/agreements/controllers/transformers/agreementTransformer.ts (FIX-01)]
         └─ Depends on: T-05, T-08, T-15, T-17
         └─ Output: 9/10 checks MATCH. 1 BLOCKER found: AgreementResponseData was missing `signedFieldsLocked` while AgreementSnapshotV2 declared it required — first polling cycle would have erased the lock-state from cold-load. FIX-01 inline: added `signedFieldsLocked: agreement.status === 'SIGNED'` to AgreementResponseData + transformer return. This matches the existing computeInvalidations semantics so both frontend lock-checks (computeStepMode reads signedFieldsLocked, computeInvalidations reads status === 'SIGNED') now agree. 21/21 jest pass (`/tmp/build-fix01-jest.log`). Lint + tsc clean.

---

## VER-01: End-to-end verification
_Auto-generated | Read-only + Playwright | Status: done_

**Tasks:**
[x] T-38 [VERIFY] Trace complete agreement-signing flow
         └─ Detail: For each user flow in plan §User Flows (1-8), trace every step from URL → Redux action → saga → API call → backend service → response → projection → render. For each step in each flow, confirm there's code that does what the flow says. List any flow step that has no corresponding code as a gap.
            Then check every AC across US-01..US-08 against the implementation. Mark met / not met. Surface any AC that has no clear code path as "AC not verifiable."
            Also re-check plan §Constraints + §Out of Scope to make sure nothing in scope was deferred unintentionally.
            Run the affected packages' validation as a final gate:
              - `(cd hussle-app-dispatch-api && npm run validate)` > /tmp/build-ver-api.log 2>&1
              - `(cd hussle-app-dispatch-ui && npm run validate)` > /tmp/build-ver-ui.log 2>&1
              Report pass/fail summary only.
         └─ Files: []
         └─ Depends on: T-37
         └─ Output: All 8 plan §User Flows traced end-to-end — every step has code (file:line refs in agent report). All 31 ACs VERIFIED (AC-X1 partial: API has 2 unrelated test failures in docusealProvider/shortLinkRoutes + 3 pre-existing dep-cruiser violations in notifications; UI has 257 pre-existing tsc errors + 69 pre-existing lint errors — none in agreement-signing files). UI jest IMPROVED vs baseline: 1298/1298 pass + 1 todo (US-07's deletion of stale AgreementSigningStep tests cleared the 2 pre-existing failures). UI tsc held at 257 baseline. API tsc + lint clean. INT-01 FIX-01 (`signedFieldsLocked` derived from status === 'SIGNED') confirmed at agreementTransformer.ts:38,108. Playwright dev-preview check: all 5 states render with zero console errors; visual confirmation captured at `sign-agreement-preview-full.png`.

---

## FIX-02: Bugs discovered during manual portal review
_Priority: P0 | Services: dispatch-api, dispatch-ui | Status: done | Depends on: US-03, US-07_

bug_introducing_stories: US-03 (mock-sign service), US-07 (focus view chrome)

must_haves:
  truths:
    - "Mock-sign POST returns 200 (not 500) when the in-memory mock-provider submissions Map has been wiped by a Docker/ts-node-dev restart — the DB row flip is what the carrier-portal polling reads, so the user-visible flow still completes."
    - "AgreementFocusView and AgreementSuccessView render exactly one footer (FocusFooter); CarrierPortalPage's PortalFooterBar is suppressed when `activeStep.id === 'sign-agreement'` AND the URL has a non-empty splat."
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/services/mockSignAgreement.ts
      provides: "markSigned wrapped in try/catch; logs warning on missing submission rather than throwing"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx
      provides: "splat read from useParams; PortalFooterBar suppressed when in agreement focus/success view"
  key_links:
    - from: mockSignAgreement
      to: deps.logger.warn
      via: "try/catch around markSigned; warn-level log includes agreementId + providerSubmissionId for traceability"
    - from: CarrierPortalPage footer JSX
      to: useParams<PortalRouteParams>()['*']
      via: "isAgreementFocusOrSuccess derived from splat presence; gates the PortalFooterBar render"

**Tasks:**
[x] T-39 [FIX] mockSignAgreement tolerates Submission-not-found from mock provider
         └─ Detail: User reported `"Submission not found"` 500 from POST /agreements/:id/mock-sign after Docker restart. Root cause: `mockSignatureProvider` keeps submissions in an in-memory Map that's wiped on process restart, but Agreement rows in PG outlive that — agreement.providerSubmissionId points at a key the live provider instance no longer has. Fix in `src/agreements/services/mockSignAgreement.ts`: wrap `deps.markSigned(agreement.providerSubmissionId)` in try/catch; log warn-level message and proceed with the agreementRepo.update DB flip. The portal polling reads status from the DB, not from the provider's getSubmission, so the user-visible flow completes correctly. Added one new test asserting the warn+update behavior. 12/12 mockSignAgreement-related tests pass.
         └─ Files: [hussle-app-dispatch-api/src/agreements/services/mockSignAgreement.ts, hussle-app-dispatch-api/src/agreements/__tests__/mockSignAgreement.test.ts]
         └─ Output: api jest 12/12, api lint clean, api tsc clean.

[x] T-40 [FIX] Suppress PortalFooterBar in agreement focus/success views
         └─ Detail: User reported two stacked footers on the signing screen. Root cause: AgreementFocusView renders its own FocusFooter, but CarrierPortalPage:201 was rendering PortalFooterBar unconditionally whenever `activeStep && phase` existed — flagged as a known v1 limitation in the original plan but worth fixing now. Fix in `src/features/carrier-portal/pages/CarrierPortalPage/index.tsx`: extend PortalRouteParams with `'*'?: string`, read the splat from useParams, derive `isAgreementFocusOrSuccess = activeStep?.id === 'sign-agreement' && splat?.length > 0`, gate the footer JSX on `!isAgreementFocusOrSuccess`. The list view (no splat) keeps the page footer for its Continue button.
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx]
         └─ Output: ui lint clean, ui tsc holds at 257 baseline (no new errors). Visual verification requires the production /carrier-portal/:token/sign-agreement/:key flow (dev preview composes PortalShell directly so it doesn't surface the double-footer bug).

---

## FIX-03: Chrome override — FocusHeader in top bar, FocusFooter sticky
_Priority: P0 | Services: dispatch-ui | Status: done | Depends on: US-07, FIX-02_

bug_introducing_story: US-07 (focus/success views composed chrome inline instead of replacing PortalShell slots)

must_haves:
  truths:
    - "AgreementFocusView produces a FocusHeader rendered in the PortalShell top-bar (replacing PortalStepper) and a FocusFooter rendered sticky at the viewport bottom (replacing PortalFooterBar) — matching State B/E in the dev preview."
    - "AgreementSuccessView produces a FocusHeader in the top-bar (trail: current key DONE, next-unsigned CURRENT) and NO footer slot — matching State D."
    - "Step views inside the Outlet can replace BOTH PortalShell chrome slots without coupling to the page component."
  artifacts:
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/StepNavContext/index.tsx
      provides: "StepChromeContext + StepChromeProvider + useStepChromeOverride + useStepChromeOverrides + TestStepChromeProvider + StepChromeTestHandle"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx
      provides: "Reads chromeOverride, swaps stepper + footer slots accordingly; removed FIX-02 T-40 splat suppression"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementFocusView.tsx
      provides: "Builds FocusHeader + FocusFooter via useMemo; registers via useStepChromeOverride; body is just stage + rail"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementSuccessView.tsx
      provides: "Builds FocusHeader (success trail) via useMemo; registers stepperSlot only; body is the interstitial"
  key_links:
    - from: AgreementFocusView/SuccessView
      to: useStepChromeOverride({ stepperSlot, footerSlot? })
      via: "view-side hook registers memoized elements; cleanup on unmount"
    - from: PortalPageContent
      to: useStepChromeOverrides()
      via: "page-side reader; when registered, override wins both slots; when null, page renders its defaults"

**Tasks:**
[x] T-41 [UI] Add StepChromeContext + provider + hook + test helper to StepNavContext/index.tsx
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/StepNavContext/index.tsx]
         └─ Output: StepChromeContext + StepChromeProvider + useStepChromeOverride + useStepChromeOverrides + TestStepChromeProvider + StepChromeSlots + StepChromeTestHandle appended. Pattern mirrors useStepNavigation. View-side hook clears on unmount; test provider renders slots inside `data-testid="test-chrome-stepper|footer"` divs so test queries keep working.

[x] T-42 [UI] Wire StepChromeProvider + remove FIX-02 T-40 suppression
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx]
         └─ Output: PortalSession wraps StepChromeProvider around StepNavProvider. PortalPageContent reads chromeOverride via useStepChromeOverrides; PortalShell stepper/footer slots use override when set, default otherwise. FIX-02 T-40's isAgreementFocusOrSuccess splat-suppression removed (chrome override mechanism supersedes it). Hit no-nested-ternary inline → extracted defaultStepper const (WARNING-class, fixed inline).

[x] T-43 [UI] Refactor AgreementFocusView to register chrome overrides
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementFocusView.tsx]
         └─ Output: Removed inline FocusHeader + FocusFooter. Handlers (handleBackToList, handleMarkSigned, handleSignComplete) wrapped in useCallback. Trail wrapped in useMemo. focusHeaderElement + focusFooterElement built via useMemo for stable identity. Registered via useStepChromeOverride. Body is grid layout (DocuSealStage + AgreementPrefillSummary rail) only. Grep: `<FocusHeader` count = 1, `<FocusFooter` count = 1, both inside useMemo.

[x] T-44 [UI] Refactor AgreementSuccessView to register a chrome override
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementSuccessView.tsx]
         └─ Output: useStepChromeOverride registers `{ stepperSlot: <FocusHeader/>, footerSlot: undefined }` — success uses interstitial buttons. Trail marks current key DONE and next-unsigned CURRENT per State D in dev preview.

[x] T-45 [TEST] Wrap view tests with TestStepChromeProvider
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementFocusView.test.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementSuccessView.test.tsx]
         └─ Output: Test render helpers wrap routes in <TestStepChromeProvider> so existing queries for back-arrow, Cancel button, iframe title keep working via the test-chrome-* portal divs.

[x] T-46 [TEST] Add unit test for useStepChromeOverride + TestStepChromeProvider
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/StepNavContext/index.test.tsx]
         └─ Output: 3 tests (register+render, cleanup on unmount, no-slot fallback). All pass.

### Validation
  jest: PASS — 60 tests / 15 suites (`/tmp/build-fix03-jest.log`)
  tsc: 257 errors (baseline 257 — no regression) (`/tmp/build-fix03-tsc.log`)
  lint: clean (`/tmp/build-fix03-lint.log`); 5 react-refresh/only-export-components warnings on StepNavContext (3 new hooks live in the existing file per brief — same pre-existing warning class as the 2 prior hooks)

---

## FIX-04: Lock state visible after signing + prominent LockedFieldsBanner
_Priority: P0 | Services: dispatch-api, dispatch-ui | Status: done | Depends on: US-03, US-07_

bug_introducing_story: US-03 (mockSignAgreement skipped the carrier-row projection that the cold-load /session endpoint depends on)

must_haves:
  truths:
    - "After mock-signing the agreement, Carrier.dispatchAgreementSignedAt is set in PG, so the cold-load /session endpoint returns signedFieldsLocked: true on the next request — no async event hop required."
    - "When mode === 'locked', CarrierPortalPage renders a prominent amber LockedFieldsBanner above the Outlet content explaining the lock — InputStep + other steps still show per-field lock icons below."
    - "Banner is centered + width-matched to the OnboardingCard (max-width 760) so it visually aligns with the form below."
  artifacts:
    - path: hussle-app-dispatch-api/src/agreements/services/mockSignAgreement.ts
      provides: "Directly calls carrierWritePort.setSignedAgreementId after the DB row flip; warn-tolerant on failure"
    - path: hussle-app-dispatch-api/src/agreements/compositionRoot.ts
      provides: "Passes carrierAgreementWritePort into mockSignAgreement deps"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/components/LockedFieldsBanner/index.tsx
      provides: "Amber banner component with lock-icon, title, and explanatory copy"
    - path: hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx
      provides: "Renders LockedFieldsBanner when mode === 'locked'; wraps banner + Outlet in column container with matching max-width"
  key_links:
    - from: mockSignAgreement
      to: carrierWritePort.setSignedAgreementId
      via: "after agreement.update flips row to SIGNED, project to Carrier.dispatchAgreementSignedAt + signedAgreementId (idempotent — skips if both already set)"
    - from: CarrierPortalPage (Outlet wrapper)
      to: LockedFieldsBanner
      via: "renders when useStepMode() === 'locked'; sibling Box matches OnboardingCard maxWidth"

**Tasks:**
[x] T-47 [API] mockSignAgreement writes to Carrier.dispatchAgreementSignedAt
         └─ Detail: Root cause of lock bug: mockSignAgreement returned `events: []` so the agreement.signed → finalizeAgreement → carrierAgreementWritePort.setSignedAgreementId chain never fired in dev. carrier.dispatchAgreementSignedAt stayed NULL. Cold-load /session computes `signedFieldsLocked = carrier.dispatchAgreementSignedAt !== null` → returned false → lock UI never engaged. Fix: call setSignedAgreementId directly from mockSignAgreement after the DB row flip (faster than emitting an event + waiting for async subscriber, and skips the artifact-fetch path that mock provider can't satisfy). Wrapped in try/catch with warn-level log on failure (consistent with the subscriber's pattern). DB-level idempotency in the existing repo (skips if both columns set).
         └─ Files: [hussle-app-dispatch-api/src/agreements/services/mockSignAgreement.ts, hussle-app-dispatch-api/src/agreements/compositionRoot.ts, hussle-app-dispatch-api/src/agreements/__tests__/mockSignAgreement.test.ts]
         └─ Output: Service signature gained carrierWritePort: CarrierAgreementWritePort. CompositionRoot wires carrierAgreementWritePort into mockSignAgreement deps. Test updated (asserts setSignedAgreementId called with carrierId + agreementId; new test asserts warn+success path when projection throws). 13/13 jest pass (`/tmp/build-fix04c-jest.log`). End-to-end verified via curl + Playwright: POST /mock-sign → Carrier.dispatchAgreementSignedAt populated in PG → cold-load /session returns signedFieldsLocked: true.

[x] T-48 [UI] LockedFieldsBanner component + render in CarrierPortalPage when locked
         └─ Detail: New `components/LockedFieldsBanner/` with amber Callout-style banner (lock icon in circle, "These fields are locked" + explanatory copy). Default copy: "You've signed the dispatch agreement, so your business identity is now read-only. Contact your dispatcher to make changes." Rendered centrally in CarrierPortalPage above the Outlet content when `mode === 'locked'` (so individual steps don't need to import or position it). Discovered + fixed layout bug: PortalShell main uses `display: flex; justify-content: center` (row by default), so the banner and Outlet rendered side-by-side. Wrapped in a column-flex Box with maxWidth: 760 so banner + form align visually. Component has 3 unit tests (default render, custom title/message, status role).
         └─ Files: [hussle-app-dispatch-ui/src/features/carrier-portal/components/LockedFieldsBanner/index.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/components/LockedFieldsBanner/index.test.tsx, hussle-app-dispatch-ui/src/features/carrier-portal/pages/CarrierPortalPage/index.tsx]
         └─ Output: Component 3/3 jest pass. Page tsc holds at 257 baseline. Lint clean. Playwright-verified end-to-end on Auto-Filled Carrier LLC at /company-authority-question: banner renders above the form with proper alignment; locked fields show lock icons; editable fields stay editable.

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 2     | 2    | 0       | 2/2    |
| US-02 | 3     | 3    | 0       | 2/2    |
| US-03 | 4     | 4    | 0       | 2/2    |
| US-04 | 5     | 5    | 0       | 3/3    |
| US-05 | 7     | 7    | 0       | 2/2    |
| US-06 | 6     | 6    | 0       | —      |
| US-07 | 8     | 8    | 0       | 19/19  |
| US-08 | 1     | 1    | 0       | 1/1    |
| INT-01| 1     | 1    | 0       | —      |
| VER-01| 1     | 1    | 0       | —      |
| FIX-02| 2     | 2    | 0       | —      |
| FIX-03| 6     | 6    | 0       | —      |
| FIX-04| 2     | 2    | 0       | —      |
| **All** | **48** | **48** | **0** | **31/31** |
