# US-09 — Consolidate Sign + Document Upload Into One Phase

> Plan handoff doc — written 2026-05-24 to seed a new session.
> Read this top-to-bottom before doing anything. The full task ledger lives at `.planning/agreement-signing-redesign/tasks.md`.

---

## Status at handoff

The agreement-signing-redesign build (US-01..US-08 + 4 FIX rounds) is **complete and verified end-to-end via Playwright**. 48 tasks done, 31/31 acceptance criteria met. Nothing is committed yet — the entire feature is in the working tree on branch `feature/carrier-portal-v2`.

What ships in the working tree:

**Backend (`hussle-app-dispatch-api/`):**
- `src/agreements/templates/templateRegistry.ts` (new) — template-agnostic registry, `requestAgreement.ts` consumes it
- `src/agreements/services/mockSignAgreement.ts` (new) — dev-only signing, writes `Carrier.dispatchAgreementSignedAt` projection directly
- `src/agreements/controllers/transformers/agreementTransformer.ts` — emits `mock`, `variables`, `signedFieldsLocked` (FIX-01)
- `src/carrier-portal/controllers/portalAgreementController.ts` — multi-key endpoint returns `Record<key, AgreementContext>`
- `src/carrier-portal/controllers/portalMockSignAgreementController.ts` (new) — env-gated mount of POST /agreements/:id/mock-sign
- `src/agreements/compositionRoot.ts` + `src/agreements/index.ts` — wires mockSign queries only when SIGNATURE_PROVIDER=mock

**Frontend (`hussle-app-dispatch-ui/`):**
- 7 new primitive components: `AgreementsCompleteBanner`, `AgreementsErrorBanner`, `AgreementsFootNote`, `AgreementSignedInterstitial`, `AgreementPrefillSummary`, `MockSigningPlaceholder`, `LockedFieldsBanner`
- 3 new view wrappers in `components/steps/AgreementSigningStep/`: `AgreementListView`, `AgreementFocusView`, `AgreementSuccessView` + `useAgreementPolling` + `toEmbedUrl` helpers
- `AgreementSigningStep/index.tsx` is now a URL-driven router (list / focus / success based on `:agreementKey?/signed?` splat)
- `StepNavContext/index.tsx` extended with `StepChromeProvider` + `useStepChromeOverride` (let views replace PortalShell's stepper + footer slots from inside the Outlet)
- `CarrierPortalPage/index.tsx` reads `chromeOverride` to swap chrome slots; renders `LockedFieldsBanner` when `mode === 'locked'`
- `engine/types.ts`: `Session.agreement` → `Session.agreements: Record<string, AgreementContext>`; `Step.template` → `Step.templates: TemplateEntry[]`; AgreementContext gains `templateKey, signedAt, mock, variables`
- `schema/signingPhase.ts`: declares `templates: [{ key: 'DISPATCH_AGREEMENT' }]`
- `selectors/carrierPortalSelectors.ts`: new `selectAgreements`, `selectAgreement(key)`, `selectAllAgreementsSigned`, `selectFirstUnsignedAgreement(visibleKeys)`, `selectVisibleAgreementKeys(session)`
- API client `utils/api/carrierPortal/v2.ts`: `getAgreementsV2(token, templateKeys[])` + `mockSignAgreementV2(token, id)`
- Sagas: `fetchAgreementsSaga` (multi-key) + `markAgreementSignedMockSaga`; old `fetchAgreementSaga.ts` deleted
- Dev preview at `/dev/onboarding-preview/sign-agreement` shows 5 states (A overview, B focus, C all-signed, D success interstitial, E mock placeholder)

**Validation snapshot at handoff:**
- API jest: 13/13 in agreement modules; full suite 1659/1661 (2 unrelated pre-existing failures in docusealProvider + shortLinkRoutes)
- UI jest: ~1300+ pass + 1 todo; 0 new failures
- API tsc + lint: clean
- UI tsc: 257 errors — baseline, all in unrelated files (password-strength.ts, validation/blogPost.ts, uploadInlineImages.ts)
- UI lint: 5 react-refresh warnings in StepNavContext (pre-existing pattern)

---

## US-09 — what to build

US-09 ships in two sequenced phases:

- **Phase 1 — Consolidate Sign + Upload** (the original scope; details below).
- **Phase 2 — Lock-state coverage across all input fields** (added 2026-05-24 after a field-component audit revealed the lock contract is only wired into Company/InputStep today; Lane Preferences, Cost Analysis, Equipment list, Drivers list, and even the AddressTypeahead inside Company are not lockable).

Land Phase 1 first (smaller, testable), then Phase 2 as a sweep across all step components.

### Phase 1 goal

Combine the existing `signing` phase (agreement signing) and `documents` phase (Certificate of Insurance upload) into a single `signing` phase that surfaces BOTH agreements to sign AND required documents to upload as unified rows in one list. Continue advances only when ALL required agreements signed AND ALL required documents uploaded.

**User decisions captured during the design conversation:**
1. **Unified rows in the same list.** AgreementListView renders document rows AND agreement rows in one stack. **Ordered: required documents first, then required agreements, then optional items.** Documents come first so the carrier uploads supporting paperwork (e.g., COI) before committing to the signed agreement at the end. Each row has its own state (uploaded / signed / pending). Continue requires all required uploaded AND signed.
2. **UploadStep is removed from the schema.** The standalone `documents-upload` step goes away. Its code may be deleted entirely or repurposed inline in the consolidated view.
3. **VerificationStep + CompleteStep remain as-is.** Their lack of Continue is acceptable (FMCSA wait state + terminal).

---

## Concrete plan

### Schema change

`hussle-app-dispatch-ui/src/features/carrier-portal/schema/signingPhase.ts`:
- Rename label from "Sign Agreement" to "Sign & upload" (or similar).
- Extend the step shape: add `documents: DocumentSlot[]` alongside `templates: TemplateEntry[]`. The signing step now declares both.
- Today's content: `templates: [{ key: 'DISPATCH_AGREEMENT' }]` and `documents: [{ id: 'coi', label: 'Certificate of Insurance', required: true, documentType: 'CERTIFICATE_OF_INSURANCE' }]`.

`hussle-app-dispatch-ui/src/features/carrier-portal/schema/documentsPhase.ts`:
- Delete the file OR remove the phase from `onboardingSchema.ts`.

`hussle-app-dispatch-ui/src/features/carrier-portal/schema/onboardingSchema.ts`:
- Remove the documents phase from the phases array. Now: Welcome → Company → Equipment → Drivers → Cost → Lanes → Signing+Upload → Complete.

### Engine type addition

`hussle-app-dispatch-ui/src/features/carrier-portal/engine/types.ts`:
- `Step` already has `documents?: DocumentSlot[]` (used by the old documents-upload step). No change needed — the signing step just uses both `templates` and `documents` now.

### View extension — AgreementListView

`hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.tsx`:

1. **Add a new selector** (or compute inline): `selectUploadedDocumentTypes` — returns the set of document types the carrier has successfully uploaded. Wire to existing document-status data. (Today: `UploadStep` reads `selectLoading('upload')` for in-flight state; for persistent upload state, may need to add a `selectUploadedDocuments` to read `session.documents` — check whether the GET /session endpoint already projects this; if not, may need a small backend change.)

2. **Render unified rows — documents first, then agreements.** Loop over `[...step.documents.map(toDocumentRow), ...visibleAgreementKeys.map(toAgreementRow)]`. Each row is a `<DocumentRow>` with state derived per item:
   - Document slot: `uploaded` / `next` (first unuploaded required) / `pending` / `skipped` (optional + skipped)
   - Agreement: `signed` / `next` (first unsigned, only becomes "next" once all required documents are uploaded) / `pending` / blocked (VOIDED/DECLINED/EXPIRED)

   The `next` cursor walks the unified list top-down: first unuploaded required document → first unsigned required agreement. This naturally guides the carrier through "upload your paperwork, then sign."

3. **Update ProgressStrip** to count both documents + agreements toward the total: `${uploadedDocumentCount + signedAgreementCount} of ${requiredDocumentCount + visibleAgreementCount} required complete`.

4. **Update Continue handler.** `canContinue` is currently always true (click-verifies). Update validation in `handleContinue`:
   - If all required documents uploaded AND all required agreements signed → dispatch `submitStep({ stepId: 'sign-agreement', answers: { acknowledged: true, uploadedDocumentTypes, signedAgreementIds } })`.
   - Else → show `AgreementsErrorBanner` with appropriate message ("Please upload all required documents and sign all required agreements before continuing.") + scroll to first incomplete row.

5. **Document slot actions.** Each document row needs an action button:
   - Pending → "Upload" → opens file picker → dispatches `uploadDocument({ documentType, file })` (existing action in `carrierPortalSlice.ts`)
   - Uploaded → "View" / "Replace" (optional v1: just show as completed with timestamp)

### Inline document upload UI

Two approaches:

**Approach A (simpler):** Each document row renders an inline file-input button. Clicking opens a native file picker. On select, dispatches `uploadDocument`. Show pending state during upload. UploadZone component (from old UploadStep) can be inlined into the row's expanded state OR replaced with a simpler trigger.

**Approach B (richer):** Click on document row navigates to `/sign-agreement/upload/<documentType>` — a focus-mode view (similar to AgreementFocusView) with the full UploadZone UI. Reuses the chrome override pattern.

**Recommended: Approach A.** Cleaner UX, fewer URLs, and the upload action is simple enough to not need its own focus view.

### Backend — session response

Check `hussle-app-dispatch-api/src/carrier-portal/controllers/sessionController.ts` (the GET /session endpoint). It already projects `vehicles`, `drivers`, `costAnalysis`, `lanePreferences`. May need to add `documents: Array<{ documentType, uploadedAt, fileUrl }>` so the frontend can render which document slots are complete on cold load.

Look for `portalDocumentRepoPrisma` — it likely has `findByCarrierId` already. If not, add one. Wire into sessionController similar to `vehiclePrefillQuery`.

### Cleanup — UploadStep + documentsPhase

After the consolidated flow works:
- Delete `hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/UploadStep/` (entire dir)
- Delete `hussle-app-dispatch-ui/src/features/carrier-portal/schema/documentsPhase.ts` (if not already removed in the schema change)
- Remove `documents-upload` references from `pages/CarrierPortalPage/StepRouter.tsx`
- Remove `uploadDocument` loading key from carrierPortalSlice IF nothing else uses it — but the new inline upload uses the same action, so keep it
- Update any tests that reference the documents phase as standalone

### Tests

- Update `AgreementListView.test.tsx`: extend the existing tests to cover the new document rows. Add fixtures for `step.documents` and `session.documents`.
- Add tests for the unified Continue validation: agreements-only-incomplete, documents-only-incomplete, both-complete cases.
- If `UploadStep` is deleted, remove its test too.
- Update engine + schema tests if `documents-upload` step removal breaks fixtures.

---

## Phase 2 — Mid-signing edit guard + terminal state

**Revised 2026-05-24 after two reframes:**
1. Audit of `templateRegistry.ts` showed only 3 carrier-editable fields are bound by the signed PDF.
2. Onboarding is a one-time wizard, not a steady-state interface — after completion the portal shows a terminal screen and the wizard is gone.

The combination of these two facts collapses the lock problem dramatically. We don't need to lock any fields. We only need to handle one narrow edge case (mid-signing identity edit) and define the terminal state cleanly.

### Ground truth — what the signed PDF actually embeds

`hussle-app-dispatch-api/src/agreements/templates/templateRegistry.ts:50-55` enumerates the DocuSeal field map for `DISPATCH_AGREEMENT`. Exactly **three carrier-editable fields** are baked into the signed PDF:

1. `CARRIER_LEGAL_NAME` ← `carrier.legalName`
2. `CARRIER_MC_NUMBER` ← `carrier.mcNumber`
3. `CARRIER_DOT_NUMBER` ← `carrier.dotNumber` (nullable)

Everything else (address, EIN/TIN, equipment, drivers, lanes, cost) is not in the template.

### Two states, two behaviors

| State | Definition | Carrier UX |
|-------|-----------|-----------|
| **Mid-signing** | At least one required agreement signed OR uploaded; not all required items complete yet. | Wizard remains fully editable. Back navigation works. Only edits to the 3 identity fields trigger a void+re-sign confirmation. |
| **Onboarding complete** | All required agreements signed AND all required documents uploaded. | Wizard is gone. Carrier sees the terminal "Onboarding complete" screen. No edits possible — there's no UI to edit through. |

### Mid-signing edit guard (the only re-sign trigger)

When the carrier is mid-signing (one or more agreements already signed, sign+upload phase not yet complete) and attempts to save a change to `legalName`, `mcNumber`, or `dotNumber`:

1. **Field-level affordance** (passive). The 3 identity fields show a small `LockOutlined` icon in their helper text with tooltip "This field is in your signed agreement. Changing it requires re-signing." Conditional on `selectAnyAgreementSigned`. Not a lock — just a heads-up.

2. **Save-time confirmation** (active). When the carrier submits a change to one of those fields while at least one agreement is signed, `ConfirmReSignDialog` opens:
   > "Changing your [legal name / MC / DOT] will void Agreement [name], which you signed on [date]. You'll need to re-sign before you can complete onboarding.
   >
   > [Cancel] [Continue and re-sign]"

3. **On confirm.** Saga calls the void-for-resign endpoint, saves the field change, navigates back to the Sign + Upload phase. The agreement reappears in the unsigned list. The phase's "all required complete" gate naturally blocks Continue until they re-sign.

If multiple agreements embed the changed field, all of them get voided in the same call. The list view shows them all as unsigned again.

### Terminal state

When the Sign + Upload phase reports all required items complete (all agreements signed, all required docs uploaded), the portal transitions to the terminal state:

- **Route guard:** all wizard URLs (`/company`, `/equipment`, `/drivers`, `/cost`, `/lanes`, `/sign-agreement`) redirect to `/complete`. Only `/complete` is reachable in this state.
- **CompleteStep content.** Replace today's placeholder with:
  - "Onboarding complete" heading + checkmark
  - "Welcome aboard, [carrier name]. Your dispatcher will be in touch with loads."
  - Dispatcher contact card (name, email, phone)
  - "Download your signed agreement" button(s) — one per signed agreement
  - "What happens next" copy — short bulleted list
- **Chrome:** stepper navigation hidden in this state. Just `PortalHeader` + terminal content. No footer with Back/Continue buttons.
- **Token lifetime:** invite token remains valid indefinitely after completion so the carrier can revisit `/complete` to re-download their signed PDFs. No new auth required.

### Lock primitive stays — but becomes schema-driven and dormant

The current shipping config declares **zero locked fields**. But the lock capability stays in the codebase so future schema changes (different agreement templates, dispatcher-configurable lock rules, new compliance fields) can opt fields into the locked treatment without rebuilding the plumbing.

**What changes shape:**

- **`LOCKS_FIELDS` (hardcoded Question-ID map in `engine/types.ts`) → deleted.** Replaced by a per-question `locked?` declaration in the schema, evaluated at runtime against session state.

  ```typescript
  // schema/companyPhase.ts (or wherever questions are declared)
  interface Question {
    id: string;
    // ... existing fields
    locked?: boolean | ((ctx: { session: Session }) => boolean);
  }
  ```

  Default = unlocked. A schema author opts in by declaring `locked: true` or a predicate like `locked: ({ session }) => session.agreements.some(a => a.status === 'SIGNED')`.

- **`engine/computeStepMode.ts` (or per-field evaluator) keeps the lock-evaluation path.** It walks visible questions, calls `locked` (or treats `undefined` as `false`), and returns `{ questionId, locked }` so consumers know which fields render locked. Current config → all returns are `locked: false`.

- **`LockableField` component stays.** No consumers in the current shipping config, but the component remains so schemas can light it up later. Mark with a short header comment: "Dormant — current schema declares no locked fields. Re-activate by setting `locked` on a question in the schema."

- **`LockedFieldsBanner` stays** for the same reason. Trigger expression simplifies to: "show when any visible question on the current step has `locked: true` and a value." Today that's never true → banner never shows.

- **Per-question lock wrappers in `InputStep`** stay but uniformly drive from engine output (`question.locked`) instead of the hardcoded `LOCKS_FIELDS` lookup. Cleaner code, same behavior, schema-controlled.

**Tests stay too.** `LockableField`, `LockedFieldsBanner`, and the engine lock-evaluation paths keep their tests — they cover dormant capability that may be re-activated.

### Mid-signing edit guard is separate from the lock primitive

The 3 identity fields (`legalName`, `mcNumber`, `dotNumber`) do not use the schema lock — they use the hardcoded mid-signing edit guard (helper icon + `ConfirmReSignDialog` + void-and-resign saga). Rationale: this behavior is tied specifically to agreement-PDF integrity, not to a schema-author-configurable lock. Locking a field via the schema would prevent edits entirely; the identity-field guard allows edits with a void+re-sign confirmation. Different semantics, different mechanism.

If a future schema author wants to lock these same fields outright (e.g., a fleet-management onboarding variant that forbids changes mid-signing), they can also add `locked: true` to the schema entry. The lock check wins (renders read-only); the edit guard never fires because the field can't be edited.

### Concrete tasks

**Frontend — schema-driven lock refactor (capability stays, declarations cleared)**

1. Add `locked?: boolean | ((ctx: { session: Session }) => boolean)` to the question type in `engine/types.ts`. Default undefined → unlocked.
2. Delete the `LOCKS_FIELDS` hardcoded map in `engine/types.ts`. Refactor `engine/computeStepMode.ts` (and any consumers) to evaluate `question.locked` instead of looking up the map.
3. In `components/steps/InputStep/index.tsx`, refactor per-question lock wrappers to drive from engine output (`question.locked` resolved by the engine) uniformly. No behavior change today (no field declares `locked`); cleaner code path.
4. Keep `LockableField` and `LockedFieldsBanner` as-is. Add a short header comment to each: "Dormant — current schema declares no locked fields. Re-activate by setting `locked` on a question in the schema." Banner trigger simplifies to: "any visible question on the current step has `locked: true`."
5. Audit the existing company-phase questions in the schema and confirm none declare `locked` (they shouldn't — the FIX-04 lock behavior was hardcoded outside the schema). If any do, remove them; locking comes from the schema author's decision, not from FIX-04 inheritance.

**Frontend — mid-signing edit guard**

5. Add `selectAnyAgreementSigned` selector — true if `session.agreements` contains any agreement with `status === 'SIGNED'`.
6. In `InputStep`, when rendering the `legalName`, `mcNumber`, or `dotNumber` question AND `selectAnyAgreementSigned` is true, append a small `LockOutlined` icon to the field helper text with the tooltip copy above.
7. Build `features/carrier-portal/components/ConfirmReSignDialog/index.tsx` — modal with the void+re-sign copy. Receives the field name + the list of agreements that will be voided.
8. Intercept the save in InputStep: if any identity field changed AND `selectAnyAgreementSigned`, open `ConfirmReSignDialog` instead of dispatching the save directly.
9. Build `voidAndReSignSaga` — calls void endpoint, dispatches the field-save, navigates to `/sign-agreement`.

**Frontend — terminal state**

10. Add `selectOnboardingComplete` selector — true when all required agreements signed AND all required documents uploaded (reuses Phase 1's completion gate).
11. Add a route guard in `CarrierPortalPage` or `StepRouter`: when `selectOnboardingComplete` is true, redirect any wizard URL to `/complete`.
12. Build out `CompleteStep` content — heading, dispatcher contact card, signed-agreement download buttons, "what happens next" copy. Hide stepper + footer in this state.

**Backend**

13. New endpoint `POST /api/v1/carrier-portal/agreements/void-for-resign` (note: not scoped to a single agreement ID — it voids ALL signed agreements that embed the changed field). Body: `{ changedField: 'legalName' | 'mcNumber' | 'dotNumber' }`. Sets `status='VOIDED'`, `voidReason='CARRIER_IDENTITY_CHANGED'`, `voidedAt=now()` on each affected agreement. Auth: invite token.
14. Server-side enforcement on identity-field PUT endpoints: reject `legalName`/`mcNumber`/`dotNumber` changes if any agreement embeds them and is currently `SIGNED`, unless the request includes `voidPriorAgreements: true`.
15. Audit event `EVT_CARRIER_AGREEMENT_VOIDED_FOR_IDENTITY_CHANGE` on the event bus — payload includes carrier ID, changed field, voided agreement IDs.
16. Dispatcher contact projection on `/session` response — name, email, phone of the carrier's assigned dispatcher (so the terminal screen can render it without a second API call).
17. Confirm Carrier model has `onboardingCompletedAt` (or equivalent). If not, add it. Set it via a new transition when all required signing+uploads finish.

**Tests**

18. Backend unit — `voidForReSign` service test: voids all matching agreements, emits event.
19. Backend unit — identity-update validators reject changes without `voidPriorAgreements` flag when relevant agreements are signed.
20. Backend unit — `onboardingCompletedAt` transition fires when all required items complete.
21. Frontend selector — `selectAnyAgreementSigned`, `selectOnboardingComplete` unit tests.
22. Frontend RTL — `ConfirmReSignDialog` renders agreement names and dates, fires saga on confirm, no-op on cancel.
23. Frontend RTL — `InputStep` shows the field-helper lock icon on the 3 identity fields when any agreement signed.
24. Frontend saga test — `voidAndReSignSaga` calls void endpoint, saves change, navigates to `/sign-agreement`.
25. Frontend route guard test — `selectOnboardingComplete=true` redirects all wizard URLs to `/complete`.
26. Frontend RTL — `CompleteStep` renders dispatcher contact, agreement download buttons, hides stepper + footer.

### Out of scope for Phase 2

- Dispatcher-side review/approval of identity changes (carrier just re-signs; dispatcher gets the event-bus notification and can react if they want).
- Post-onboarding edits by the carrier — those happen on the dispatcher side, in the internal app. Not a portal feature.
- Per-component `locked` props on Lane Preferences, Cost Analysis, Equipment, Drivers components (none get built — operational data is freely editable mid-signing, and the wizard is gone post-completion).
- Field-level audit trail UI (existing audit infra captures the underlying events).
- A separate "carrier dashboard" for steady-state use post-onboarding (future scope; not part of this US).

---

## Risks + things to watch

1. **`session.documents` projection.** May not exist on the cold-load `/session` endpoint yet. If not, add it via `portalDocumentRepoPrisma.findByCarrierId(carrierId)` injected into `sessionController` and projected into the response. Without it, the frontend can't tell which documents are already uploaded on cold load.

2. **`step.documents` typing.** `engine/types.ts` already declares `Step.documents?: DocumentSlot[]`. No change needed there — just check that selectors/visibility-evaluators don't blindly assume only `templates` OR only `documents`.

3. **`AGREEMENT_TITLES` map.** Hardcoded in AgreementListView. Documents need a similar `DOCUMENT_TITLES` or the schema's `documentSlot.label` should be used directly (it already exists per DocumentSlot type).

4. **submitStep payload.** Existing `submitStep` saga accepts arbitrary `answers`. Add `uploadedDocumentTypes` to the payload. Backend's `submitStepValidator` may reject unknown answer keys — check `hussle-app-dispatch-api/src/carrier-portal/validators/sessionValidators.ts`.

5. **Auto-advance vs manual Continue.** Today `UploadStep` auto-advances when all required uploaded (via internal effect). The unified view should NOT auto-advance — carrier explicitly clicks Continue after both signing and uploading. Remove any auto-advance logic when consolidating.

6. **Lock state for documents.** Documents don't have a "locked" semantic the way company fields do. After signing, the carrier shouldn't be blocked from uploading. Confirm that `useStepMode()` returning `'locked'` for the signing+upload step doesn't disable the upload controls.

---

## Concrete first actions for the new session

### Phase 1 (Sign + Upload consolidation)

1. **Read this file end-to-end.**
2. Read `.planning/agreement-signing-redesign/tasks.md` — full task ledger with every Output line documenting what shipped in US-01..FIX-04.
3. Read `.planning/agreement-signing-redesign/plan.md` — the original PRD.
4. Read these 4 files to understand the current state of the consolidated story:
   - `hussle-app-dispatch-ui/src/features/carrier-portal/schema/signingPhase.ts`
   - `hussle-app-dispatch-ui/src/features/carrier-portal/schema/onboardingSchema.ts`
   - `hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.tsx`
   - `hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/UploadStep/index.tsx`
5. Check the GET /session endpoint at `hussle-app-dispatch-api/src/carrier-portal/controllers/sessionController.ts` — confirm whether `documents` is projected. If not, that's task #1.
6. Then plan Phase 1 as discrete tasks (T-49 onward) and append to tasks.md before writing code.

### Phase 2 (Mid-signing edit guard + terminal state) — start only after Phase 1 ships

1. Read `features/carrier-portal/components/LockableField/index.tsx`, `features/carrier-portal/components/LockedFieldsBanner/index.tsx`, `features/carrier-portal/engine/types.ts` (`LOCKS_FIELDS`), and `engine/computeStepMode.ts` to understand what gets deleted.
2. Read `features/carrier-portal/components/steps/InputStep/index.tsx` to see where the per-question lock wrappers attach (the deletions target these branches) and where `legalName`/`mcNumber`/`dotNumber` are rendered (the helper-icon hook attaches here).
3. Read `features/carrier-portal/components/steps/CompleteStep/index.tsx` (or wherever the terminal step lives today) to see its current state. Decide whether to expand in place or rebuild.
4. Read `hussle-app-dispatch-api/src/agreements/services/voidAgreement.ts` (or the existing void path) — the new `void-for-resign` endpoint should reuse the same void primitive.
5. Append Phase 2 tasks to tasks.md. Suggested grouping:
   - **T-?? Schema-driven lock refactor** — add `locked?` to question type, delete `LOCKS_FIELDS` hardcoded map, drive InputStep wrappers from engine output. `LockableField` + `LockedFieldsBanner` stay (dormant) for future use.
   - **T-?? Mid-signing edit guard** — `selectAnyAgreementSigned` selector, identity-field helper icon in InputStep, `ConfirmReSignDialog`, `voidAndReSignSaga`
   - **T-?? Backend re-sign endpoint** — `POST /agreements/void-for-resign`, identity-update enforcement, event emission
   - **T-?? Terminal state** — `selectOnboardingComplete`, route guard, `CompleteStep` rebuild with dispatcher contact + downloads
   - **T-?? Backend terminal projections** — dispatcher contact on `/session`, `onboardingCompletedAt` transition
   - **T-?? Tests** — per the test list in the Phase 2 section
6. Verification: invite token `c49558a3e54aae105a2783ef4e2237a281cac7f73833f6b7996ab98d9b7aad54` (Auto-Filled Carrier LLC) is parked at the right state to walk through both the mid-signing edit guard (back-nav from signing → change MC → confirm re-sign) and the terminal state (sign + upload everything → land on /complete).

---

## Useful repro commands for new session

**Inspect Docker stack:**
```bash
docker compose ps
```

**Active invite tokens for live portal testing:**
```bash
docker exec hussle-app-postgres psql -U postgres -d hussle_dispatch -c \
  "SELECT t.token, c.name, t.\"expiresAt\" FROM \"CarrierInviteToken\" t \
   JOIN \"Carrier\" c ON t.\"carrierId\" = c.id \
   WHERE t.\"revokedAt\" IS NULL AND t.\"expiresAt\" > NOW() \
   ORDER BY t.\"createdAt\" DESC LIMIT 5;"
```

The token `c49558a3e54aae105a2783ef4e2237a281cac7f73833f6b7996ab98d9b7aad54` (Auto-Filled Carrier LLC) is the best test fixture — it's parked at `/documents-upload`, has all 7 prior phases complete, and has signed the dispatch agreement, so it surfaces the consolidated-phase UX immediately.

**Trigger mock-sign manually (if needed):**
```bash
curl -X POST http://localhost:3001/api/v1/carrier-portal/agreements/<AGREEMENT_ID>/mock-sign \
  -H "Authorization: Bearer <TOKEN>"
```

**Validation commands:**
```bash
(cd hussle-app-dispatch-api && npm run validate)
(cd hussle-app-dispatch-ui && npm test && npm run check-ts && npm run lint)
```

**Restart API after backend code changes** (ts-node-dev doesn't always hot-reload in Docker):
```bash
docker compose restart dispatch-api
```

---

## Out of scope for US-09

- **Continue button on VerificationStep / CompleteStep.** User confirmed these are acceptable as-is (wait state + terminal). Don't add Continue here unless a follow-up explicitly asks.
- **Document review/approval UX.** This is a carrier-side upload flow — dispatcher-side review/approval of uploaded documents is a separate scope.
- **Multiple document types in v1.** Today only Certificate of Insurance is required. The unified list supports more types via schema, but v1 ships with just COI.
- **Document replacement / re-upload UI.** Defer to a follow-up unless trivial.

---

## Reference: file inventory at handoff (uncommitted)

48 files in the working tree. Run `git status` to see them all. Key new files:

```
NEW:
.planning/agreement-signing-redesign/
hussle-app-dispatch-api/src/agreements/__tests__/mockSignAgreement.test.ts
hussle-app-dispatch-api/src/agreements/__tests__/templateRegistry.test.ts
hussle-app-dispatch-api/src/agreements/services/mockSignAgreement.ts
hussle-app-dispatch-api/src/agreements/templates/templateRegistry.ts
hussle-app-dispatch-api/src/carrier-portal/controllers/portalMockSignAgreementController.ts
hussle-app-dispatch-api/src/carrier-portal/validators/__tests__/
hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementPrefillSummary/
hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementSignedInterstitial/
hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsCompleteBanner/
hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsErrorBanner/
hussle-app-dispatch-ui/src/features/carrier-portal/components/AgreementsFootNote/
hussle-app-dispatch-ui/src/features/carrier-portal/components/LockedFieldsBanner/
hussle-app-dispatch-ui/src/features/carrier-portal/components/MockSigningPlaceholder/
hussle-app-dispatch-ui/src/features/carrier-portal/components/StepNavContext/index.test.tsx
hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementFocusView.tsx + test
hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementListView.tsx + test
hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/AgreementSuccessView.tsx + test
hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/toEmbedUrl.ts
hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/useAgreementPolling.ts
hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/fetchAgreementsSaga.ts
hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/markAgreementSignedMockSaga.ts
hussle-app-dispatch-ui/src/features/carrier-portal/store/selectors/__tests__/

DELETED:
hussle-app-dispatch-ui/src/features/carrier-portal/components/steps/AgreementSigningStep/index.test.tsx (replaced by per-view tests)
hussle-app-dispatch-ui/src/features/carrier-portal/store/sagas/fetchAgreementSaga.ts (renamed to plural)
```

Screenshots for visual reference in repo root:
- `sign-agreement-preview-full.png` — dev preview States A-E
- `bug-uploadstep-no-continue.png` — pre-fix UploadStep (no Continue)
- `bug-no-lock-after-signing.png` — pre-fix unlocked company step
- `verify-lock-final.png` — post-FIX-04 LockedFieldsBanner working
