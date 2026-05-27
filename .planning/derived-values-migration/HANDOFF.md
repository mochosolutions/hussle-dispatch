# Derived Values Migration — Session Handoff

> Written 2026-05-25 to seed a new session. Context was at 80% when this was created; the prior session is being compacted.
>
> Companion to `.planning/agreement-signing-redesign/us-09-plan.md` (the consolidated sign+upload redesign that surfaced this work).

---

## Why we're here

The Auto-Filled Carrier LLC test fixture (token `c49558a3...`) exposed a class of bug: `Carrier` columns like `dispatchAgreementOnFile` and `insuranceCertOnFile` are denormalized caches of state that lives in other tables (`Agreement`, `Document`). When the source mutates without the cache being updated, the carrier's gate decisions go wrong — they get stuck on `/complete` because the API gate reads stale flags.

We patched two specific drift paths during the prior session (`setSignedAgreementId` / `clearSignedAgreement` lockstep, plus a backfill migration). The user then asked for a **structural fix**: migrate to Option B (compute derived values on read) so drift becomes impossible.

This doc captures everything needed to execute that migration cleanly.

---

## Status at handoff

**Phase 1 (sign + upload consolidation) and Phase 2 (mid-signing edit guard + terminal state) of US-09 are complete and verified end-to-end with Playwright.** Including:

- Backfill migration `20260524000001_backfill_dispatch_agreement_flags` applied
- Drop-dead-columns migration `20260524000002_drop_dead_legacy_columns` applied
- Recovery bug fix: `CompleteStep` redirects to `/sign-agreement` on `completeSession` failure
- Infinite-loop fix: `selectOnboardingComplete` keys only on `session.completedAt` (the durable signal), not on the client-side cursor

**Auto-Filled Carrier LLC's `/complete` URL now silently redirects to `/sign-agreement`** when the carrier hasn't uploaded the COI. UI shows the unified list with the COI as the next required item. Verified via Playwright at the end of the prior session.

**Nothing about the derived-values migration has been implemented yet.** This doc is the planning artifact. Code freeze on this work until decisions land.

---

## The five fields under consideration

All five live on `Carrier`. They're denormalized caches of state that lives elsewhere.

| Field | Type | Authoritative source | UI uses |
|-------|------|----------------------|---------|
| `insuranceCertOnFile` | boolean | `Document` table (type=INSURANCE_CERT, isArchived=false) | Display + admin edit |
| `insuranceExpiry` | DateTime? | `Document` row metadata (expiresAt) | Display + admin edit |
| `dispatchAgreementOnFile` | boolean | `Document` table AND `Agreement` table (two sources today!) | Display + admin edit |
| `signedAgreementId` | String? | `Agreement.id` where status=SIGNED, latest | Not used in UI |
| `dispatchAgreementSignedAt` | DateTime? | `Agreement.signedAt` for the signed row | Not used in UI (declared in one Yup schema but never rendered) |

---

## API-side audit findings (drift sources)

The compliance flags have **two independent writers** for `document.confirmed`:

1. `portalDocumentsService.confirmDocument` (direct) — line 47 of `portalDocumentsService.ts`, `COMPLIANCE_FLAG_MAP[INSURANCE_CERT]` writes `{ insuranceCertOnFile: true, insuranceExpiry: ... }`
2. `carrierComplianceSubscriber` (event-bus listener on `document.confirmed`) — `src/carriers/compositionRoot.ts` lines ~110 and ~231, also writes the same flags

Both run in production. Harmless duplication today; both go away cleanly under Option B.

**Drift paths that exist today and are NOT covered:**

- `document.archived` event fires → only `auditSubscriber` listens → `Carrier.insuranceCertOnFile` stays `true` even though the source doc is gone
- Hard delete of a Document row → no event → same drift
- `Agreement` voided without calling `clearSignedAgreement` → projection stale (we partially patched this in Phase 2 but there are still callers)

**Readers that consume the flags (must migrate):**

- `src/shared/onboardingGate.ts:29` — `checkCarrierOnboarding` (the gate that blocks completion)
- `src/loads/services/loadService.ts:444` — load eligibility check
- `src/loads/repositories/loadRepositoryPrisma.ts:521` — load query projections
- `src/carrier-portal/controllers/sessionController.ts` — projects `signedFieldsLocked` onto session response
- `src/carrier-portal/services/onboardingSessionService.ts:226` — completion gate
- `src/carriers/jobs/documentCheckJob.ts:43` — nightly compliance status job
- `src/carriers/compositionRoot.ts:127, 246` — carrier service compositions

---

## UI-side audit findings

The UI uses three categories: **read-only**, **conditional**, and **editable**.

### Read-only / not-used (safe to migrate cleanly)

- `signedAgreementId` — **zero references** in UI codebase. Drop column → no UI work.
- `dispatchAgreementSignedAt` — declared in `features/carrier/validators/fleetSchema.ts:29` but never bound to a form input. Effectively dead. Portal reads `agreement.signedAt` from the Agreement object instead.

### Editable in dispatcher UI (the complication)

| Field | Where editable |
|-------|----------------|
| `insuranceCertOnFile` | `features/carrier/components/CarrierFormDialog/index.tsx:63,183-186` — admin checkbox |
| `insuranceExpiry` | `features/carrier/components/CarrierFormDialog/index.tsx:66,201` — admin date picker |
| `dispatchAgreementOnFile` | `features/carrier/components/CarrierFormDialog/index.tsx:62,175-179` + `features/carrier/components/DispatchTermsDrawer/index.tsx:40,87-91` — admin checkboxes |

These aren't just caches — they're **admin override flags**. A dispatcher can manually toggle them to mark "we received a paper agreement via email" without uploading a Document row. This is the central decision point for the migration.

### Display locations (will need API response updates)

- `features/carrier/components/CarrierDetailPage/GeneralTab.tsx:152-179, 237, 265-267` — onboarding section, dispatch terms section, insurance status section. Gates an entire section visibility on `insuranceCertOnFile`.
- `features/carrier/components/CarrierKPI/index.tsx:96-160` — KPI bar reads `insuranceExpiry` to render expiry warning chip
- `utils/getInsuranceExpiryStatus.ts` — utility computing expiry-status badge

### Carrier portal (the carrier-facing flow)

Does NOT read these booleans back to render. Portal reads agreement data from the `Agreement` table directly via `selectAgreements`. No portal-side impact from dropping the booleans.

---

## Three migration directions

### Direction 1 — Pure Option B (most aggressive)

Drop the columns entirely. Compliance state is 100% derived from `Document` + `Agreement`.

**Trade-offs:**
- ✅ Eliminates drift by construction
- ✅ Removes both writers (`confirmDocument` flag-writing + `carrierComplianceSubscriber`)
- ❌ Dispatcher loses admin override capability
- ❌ "Paper agreement received via email" workflow breaks unless they upload a placeholder doc

### Direction 2 — Hybrid (columns stay as explicit overrides, no auto-cache)

Columns persist but their semantics change to **manual overrides only**:
- Auto-writers (`confirmDocument`, `carrierComplianceSubscriber`) are deleted
- Read semantic: `is_on_file = exists(non_archived_doc) OR carrier.<override_flag>`
- Admin forms keep working (toggle the override directly)

**Trade-offs:**
- ✅ Admin forms keep working
- ✅ Drift impossible (override is intentional)
- ⚠️ Dual-source ambiguity ("on file" means either auto-detected or override)
- ⚠️ Slightly more complex read logic

### Direction 3 — Carrier compliance overrides table (most thorough)

Create `CarrierComplianceOverride` table with explicit rows: `{ carrierId, fieldName, reason, enteredByUserId, enteredAt }`. Drop the booleans from Carrier. Compute: `derived OR has_override`.

**Trade-offs:**
- ✅ Cleanest semantics + per-override audit trail
- ✅ Drift impossible
- ❌ Most work; probably overkill if overrides are rare

---

## Pre-decision questions for the new session

Before any code change, answer these:

1. **Are the admin override checkboxes actually used?** Check git blame on `CarrierFormDialog/index.tsx` for toggle activity, OR check the `AuditLog` table for `CARRIER_*` actions where these fields changed. If never toggled → Direction 1 is free. If sometimes toggled → Direction 2 or 3.

2. **Workflow for "paper agreement on file."** When a carrier emails a signed agreement (instead of using DocuSeal), what does the dispatcher do today?
   - If they upload a scan as a Document row → admin checkbox is vestigial → Direction 1
   - If they toggle the checkbox without uploading → need Direction 2 or 3

3. **`insuranceExpiry` derivation semantics.** When a carrier has multiple INSURANCE_CERT documents (renewals over time), which one's expiry is authoritative?
   - Latest non-archived, non-rejected? (probably yes)
   - Document needs an explicit query/index decision before migration

4. **Does `reviewStatus` affect "on file"?** Today `insuranceCertOnFile` flips `true` on `confirmDocument`, BEFORE the dispatcher reviews. Option B is a natural moment to redefine "on file" as "approved by review" — but that's a semantic change that affects gate decisions. Default: keep current semantic (uploaded = on file).

5. **Performance check.** Load-eligibility checks (`loadService.ts:444`) fire on every load creation. If the derived value becomes a correlated `EXISTS` subquery on `Document`, will that be fine? Probably yes for hundreds of carriers; if it becomes a hot loop, consider a materialized view or a Prisma-computed column.

---

## Findings — 2026-05-25 (answers + new constraints)

Code + dev-DB investigation completed. Direction not yet locked.

### Dev DB state (5 carriers total)

| Carrier | `agr_flag` | `signedAgreementId` set? | Agreement row status | `ins_flag` | `insuranceExpiry` (Carrier) | INSURANCE_CERT docs | `Document.expiresAt` |
|---|---|---|---|---|---|---|---|
| Auto-Filled | true | ✅ | SIGNED | false | — | 0 | — |
| Demo Carrier | true | ❌ | **SIGNED** | true | **2027-05-22** | 1 (uploaded, pending_review) | **NULL** |
| QA Test Carrier | true | ❌ | **SIGNED** | true | NULL | **3** (1 uploaded, 2 pending) | NULL × 3 |
| Acme / Mocho | false | — | — | false | — | 0 | — |

**Drift confirmed in live data:**
- `signedAgreementId` is stale on 2/3 SIGNED-agreement carriers (Phase-2 lockstep gap)
- Every `Document.expiresAt` in dev is NULL even when `Carrier.insuranceExpiry` is populated
- QA Test Carrier has multiple non-archived INSURANCE_CERT rows — multi-doc case is already live
- Zero `AGREEMENT`-type documents exist (only `INSURANCE_CERT` and `OTHER`)

### Q1 — Are admin override checkboxes used?

**Unprovable from code/data alone.** `AuditLog` action distribution shows `CARRIER_CREATED`, `CARRIER_INVITED`, `CARRIER_INVITE_RESENT`, `CARRIER_ONBOARDING_STARTED`, `CARRIER_ONBOARDING_COMPLETED` — **no `CARRIER_UPDATED` action exists**, so dispatcher field edits leave no trail. Dev data shows every flagged carrier got its flag programmatically via the portal flow, not via the admin checkbox. **No evidence of manual toggle usage**, but no negative proof either.

### Q2 — "Paper agreement" workflow

**Likely vestigial.** Zero `AGREEMENT`-type documents in dev. The checkboxes (`dispatchAgreementOnFile`, `insuranceCertOnFile`) are freestanding toggles in `CarrierFormDialog/index.tsx:175-179, 183-186` and `DispatchTermsDrawer/index.tsx:87-91` — not tied to any file upload. A dispatcher CAN toggle them without uploading anything, but there's no observed usage of this workflow.

### Q3 — `insuranceExpiry` derivation rule

**Critical new finding: portal never writes `Document.expiresAt`.** Two parallel write paths exist:

| Path | Writer of `Document.expiresAt` | Writer of `Carrier.insuranceExpiry` |
|---|---|---|
| Portal (`carrier-portal/services/portalDocumentsService.ts`) | **never written** | direct write from request body via `COMPLIANCE_FLAG_MAP` (line 34) |
| Dispatcher (`documents/services/documentService.ts`) | written at presign time (line 94) | `carrierComplianceSubscriber` reads `Document.expiresAt` from the `document.confirmed` event payload |

The portal's `confirmDocument` (line 100-122) calls `documentRepo.updateStatus(documentId, { uploadStatus: 'confirmed', reviewStatus: 'pending_review' })` — never touches `expiresAt`. It does **not** publish `document.confirmed`.

**Migration blocker:** If we naively migrate `Carrier.insuranceExpiry` → derived from `Document.expiresAt`, every existing carrier loses their expiry (all source rows are NULL). Required prep:
1. **Fix the portal write path** — either move the expiry write to `Document.expiresAt` in `portalDocumentsService.confirmDocument`, or have the portal publish `document.confirmed` so the subscriber handles it uniformly.
2. **Backfill migration** — copy `Carrier.insuranceExpiry` → `Document.expiresAt` for the most-recent non-archived INSURANCE_CERT per carrier.
3. **Derivation rule for multi-doc:** latest non-archived where `uploadStatus = 'confirmed'` (ignores abandoned `pending` rows like QA Test Carrier's two extras).

### Q4 — Does `reviewStatus` affect "on file"?

**No, and don't change it.** `portalDocumentsService.confirmDocument:111-118` sets compliance flags **before** review (`reviewStatus='pending_review'`). `checkCarrierOnboarding` in `src/shared/onboardingGate.ts:24-49` checks only boolean flags + expiry, never `Document.reviewStatus`. Changing this to "reviewed = on file" would be a breaking semantic change to load eligibility and onboarding completion. **Recommendation: keep current semantic** (`uploaded = on file`).

### Q5 — Performance

**Negligible risk.** `checkCarrierOnboarding` is called 8 places (loadService, onboardingSessionService, carrierService, documentCheckJob, carrierSuspendService, dispatchOverrideService) — all single-call, none in inner loops. The hottest path (`loadService.ts:441` on `createLoad`) does one carrier fetch + one gate evaluation per load. The existing `Document_entityType_entityId_idx` covers an `EXISTS` subquery. Add `isArchived` to a future composite index if profiling shows it.

### Other write-path bugs surfaced (NOT in scope but worth tracking)

- `document.archived` event fires but no carrier-compliance listener exists — archiving the only INSURANCE_CERT leaves `Carrier.insuranceCertOnFile = true` (drift bug)
- Portal `confirmDocument` doesn't publish `document.confirmed` — this means other subscribers (`loadTimestampSubscriber`, `notificationSubscriber`, `documentArchiveSubscriber`, `invoiceReadinessSubscriber`) never fire for portal-confirmed carrier docs. The dispatcher and portal are silently divergent in event-driven side-effect coverage.

### Implication for direction choice

- **Direction 1 (drop columns)** is now plausible because there's no evidence the admin override checkboxes are actually used. But it requires fixing the portal write path AND backfilling `Document.expiresAt` first.
- **Direction 2 (override semantics)** is the safe-but-not-clean fallback — but the dev data gives no compelling case for it.
- **Direction 3 (override table)** remains overkill for an unverified workflow.

**Provisional recommendation: Direction 1 with a prerequisite track to (a) unify the portal/dispatcher confirm flows so `Document.expiresAt` is always written, (b) wire up `document.archived` to recompute compliance, (c) backfill, (d) THEN migrate.**

Decision still requires the user's sign-off — Q1 cannot be answered with full certainty from local artifacts.

---

## Other denormalized values in the codebase (deferred but tracked)

The audit found denormalized values beyond the five Carrier fields. NOT in scope for the first migration pass, but worth knowing about:

**Load financials (~10 cols)** — `Load.dispatchFee`, `Load.carrierPayout`, `Load.companyMargin`, `Load.driverPay`, `Load.partnerSplit`, `Load.ratePerMile`, `Load.ratePerTotalMile`, `Load.estimatedCost`, `Load.estimatedHours`, `Load.dispatcherComm`. Computed by `calculateFinancials.ts`. Recalc subscriber watches `accessorial.*` only — drift if dispatch fee % / driver pay rate / partner split changes after computation.

**`Load.invoiceReadiness`** — no subscriber on `document.archived`, so deleting BOL/POD doesn't re-evaluate readiness.

**Invoice snapshots (3 cols)** — `Invoice.subtotal`, `Invoice.accessorials`, `Invoice.totalAmount`. **Probably should NOT migrate** — invoices should be immutable financial documents; if an accessorial changes after invoice creation, the invoice should not silently change. Different problem; needs change-protection at the AccessorialCharge level instead.

**Settlement aggregates (~6 cols)** — already recomputed on read via `recalculateTotals`. Persistence makes them snapshot-immutable after status moves to APPROVED/PAID, which is the desired behavior. Leave alone.

Full inventory + drift-risk classification was generated by an Explore agent in the prior session — see the conversation log for the comprehensive table.

---

## Recommended next steps for the new session

1. **Answer the pre-decision questions above** — without these, any implementation is premature.
2. **Once a direction is picked, write tasks for:**
   - DB schema changes (migrations)
   - API write-path deletions (`COMPLIANCE_FLAG_MAP`, `carrierComplianceSubscriber`)
   - API read-path migrations (the 7 reader locations)
   - UI form changes (delete checkbox/date inputs OR rewire to override-only endpoints)
   - UI display updates (response shape changes)
   - Add tests for the new derived behavior (existence check, reviewStatus semantic, multi-document expiry rule)
3. **Sequence:** API reads first (so backend works with new shape), then UI updates, then drop columns last. Drop columns ONLY after all reads/writes have moved off them — otherwise prod requests crash.

---

## Useful repro commands

```bash
# Active invite tokens for live portal testing:
docker exec hussle-app-postgres psql -U postgres -d hussle_dispatch -c \
  "SELECT t.token, c.name, t.\"expiresAt\" FROM \"CarrierInviteToken\" t \
   JOIN \"Carrier\" c ON t.\"carrierId\" = c.id \
   WHERE t.\"revokedAt\" IS NULL AND t.\"expiresAt\" > NOW() \
   ORDER BY t.\"createdAt\" DESC LIMIT 5;"

# Check Auto-Filled Carrier LLC state:
docker exec hussle-app-postgres psql -U postgres -d hussle_dispatch -c \
  "SELECT c.name, c.\"dispatchAgreementOnFile\", c.\"insuranceCertOnFile\",
          c.\"insuranceExpiry\", c.\"signedAgreementId\" IS NOT NULL AS has_sid,
          s.\"currentStepId\"
   FROM \"Carrier\" c
   LEFT JOIN \"OnboardingSession\" s ON s.\"carrierId\" = c.id
   WHERE c.id = (SELECT \"carrierId\" FROM \"CarrierInviteToken\"
                 WHERE token = 'c49558a3e54aae105a2783ef4e2237a281cac7f73833f6b7996ab98d9b7aad54');"

# Validation:
(cd hussle-app-dispatch-api && npm run validate)
(cd hussle-app-dispatch-ui && npm test && npm run check-ts && npm run lint)
```

---

## Baselines for validation

| Gate | Baseline |
|------|----------|
| API jest | 1672/1673 (1 pre-existing `docusealProvider` failure) |
| API tsc | clean |
| API lint:deps | 3 pre-existing notifications violations |
| UI tsc | 257 errors (unrelated baseline) |
| UI jest | 136/136 suites, 1324 passed + 1 todo |

Any new errors introduced by the migration must be tracked and resolved before considering the work done.

---

## Files most relevant to the migration

**API (writers + readers):**
- `src/carrier-portal/services/portalDocumentsService.ts` — `COMPLIANCE_FLAG_MAP`
- `src/carriers/compositionRoot.ts` — `carrierComplianceSubscriber` wiring
- `src/agreements/repositories/carrierAgreementWriteRepositoryPrisma.ts` — `setSignedAgreementId` / `clearSignedAgreement` (Phase 2 lockstep — would be deleted under Direction 1)
- `src/shared/onboardingGate.ts` — `checkCarrierOnboarding` (main reader)
- `src/loads/services/loadService.ts` + `src/loads/repositories/loadRepositoryPrisma.ts` — load-eligibility readers
- `src/carrier-portal/services/onboardingSessionService.ts` — `complete` service
- `src/carriers/jobs/documentCheckJob.ts` — nightly compliance status job

**UI (editable + display):**
- `src/features/carrier/types.ts` — type declarations
- `src/features/carrier/components/CarrierFormDialog/index.tsx` — admin form with all 3 editable fields
- `src/features/carrier/components/DispatchTermsDrawer/index.tsx` — second admin form for `dispatchAgreementOnFile`
- `src/features/carrier/components/CarrierDetailPage/GeneralTab.tsx` — display + section gating
- `src/features/carrier/components/CarrierKPI/index.tsx` — insurance expiry warning badge
- `src/utils/getInsuranceExpiryStatus.ts` — expiry status utility
- `src/features/carrier/validators/carrierSchema.ts` — Yup validation
- `src/features/carrier/validators/fleetSchema.ts` — Yup validation for dispatch terms drawer
- `src/utils/api/fleet/carrierApi.ts` — API client type for `CarrierOnboardingStatus`

**Schema:**
- `hussle-app-dispatch-api/prisma/schema.prisma` — `Carrier` model (5 fields under audit)

---

## Out of scope for this migration

- The legacy `dispatchAgreementOnFile` writer in `portalDocumentsService.signDocument` — already deleted in Track A (session prior).
- The `Carrier.dispatchAgreementConsentIp/UserAgent` columns — already dropped in Track B.
- The legacy `OnboardingSession.completedPhases/currentPhase/currentQuestionIndex` columns — already dropped in Track B.
- Load financial denormalization — separate migration, see "Other denormalized values" above.
- Invoice snapshot migration — explicitly DON'T migrate; needs change-protection instead.

---

## Open file states at end of prior session

Branch: `feature/carrier-portal-v2`
Status: ahead of origin by 35+ commits. All Phase 1, Phase 2, recovery, Track A, and Track B work is on the working tree, uncommitted. Run `git status` to see the full diff.

No work in progress for the derived-values migration itself — this is a planning artifact for a fresh start.
