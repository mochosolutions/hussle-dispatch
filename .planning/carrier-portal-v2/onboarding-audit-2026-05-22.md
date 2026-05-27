# Carrier Onboarding — Production-Readiness Audit (2026-05-22)

**Method**: walked the live flow end-to-end via Playwright against the dev stack
(`api:3001`, `ui:5173`, Postgres + Redis + RabbitMQ + Mailpit + DocuSeal-off).
**Carrier**: `7efe7701-76cd-41ef-b250-6085f67196df` "Acme Test Carrier"
**Token**: `ba3e…da81c` (plaintext, expires 2026-05-24).
**Path exercised**: owner-operator → No-authority business form → cargo van →
solo driver → cost analysis → lane prefs (defaults) → signing → documents → complete.

## Verdict: not production-ready

Every phase has at least one issue that materially affects a real carrier.
Three are showstoppers that would each, on their own, end the onboarding session:

| # | Step that breaks | What the carrier sees |
|---|---|---|
| BUG-06 | Company → address typeahead | Bounced to `/login`, all data lost |
| BUG-10 | Sign Agreement | Blank iframe; no recourse |
| BUG-11 | Documents → COI upload | File picker silently rejects every file |

The flow is **incompletable on the “Yes, I have MC authority” path** (BUG-04
FMCSA spinner) and **incompletable on the “No authority” path** unless we
ship fixes for BUG-06, BUG-10, BUG-11 together.

## Critical (Sev-1) — blocks completion or compromises data

### BUG-01  Fresh session is stuck on a spinner
- `getOrCreate` in `onboardingSessionService.ts:167` writes a row with
  `currentStepId = null`. `selectCurrentStep` returns null →
  `CarrierPortalPage` renders `SessionLoadingFallback` forever.
- Fix: write the schema’s first step id when creating the session, so refresh
  also lands the carrier on the same step.

### BUG-06 (showstopper)  Address typeahead logs the carrier out mid-form
- `AddressTypeaheadField` calls `GET /api/v1/places/address-search`, which is
  gated by `requireAuth` (staff JWT). Portal carrier has no JWT → `401` →
  axios interceptor calls `/auth/token/refresh` → `400` →
  `handleAuthFailure()` redirects to `/login`.
- All form data they entered is gone, and the magic link is the only way back.
- Fix (both layers):
  1. Make the route portal-token-aware: add a
     `/api/v1/carrier-portal/places/address-search` proxy that runs through
     `authenticateCarrierToken`, or extend `requireAuth` to
     `requireAuthOrInviteToken`.
  2. Patch `utils/axios.ts` so the 401 interceptor short-circuits when
     `window.location.pathname.startsWith('/carrier-portal/')` — never redirect
     a carrier to `/login`.

### BUG-09 (critical)  Company step never promotes answers to `Carrier` columns
- Company-authority-question writes a fat JSON blob to
  `OnboardingSession.answers['company-authority-question']`, but nothing copies
  `mcNumber`, `dotNumber`, `ein`, `phone`, `email`, `address`, signatory fields
  back to the `Carrier` row.
- Downstream `portalEquipmentService.validateComplianceRules` reads
  `carrier.mcNumber` / `carrier.dotNumber` — both null → any semi-truck and any
  heavy vehicle get rejected with a silent `400` (see BUG-08).
- Also blocks: dispatch agreement variables, FMCSA cross-check, the dispatcher
  view of the carrier.
- A `portalCompanyService.saveCompany` already exists on the API but
  **nothing on the UI calls it** — the v2 flow only uses `/session/submit-step`.
- Fix: either (a) route company submit-step through `saveCompany` server-side,
  or (b) extend `submitStepService` to dispatch a `CarrierFieldsUpdated`
  intent for steps that locks-fields against the `Carrier` table.

### BUG-10 (critical)  DocuSeal iframe 500s — sign step is unusable
- `/docuseal-embed/s/M9UEXWiVBcoUw4` returns 500 because the `docuseal`
  container is behind `--profile docuseal` in `docker-compose.yml` and isn’t
  running by default. `.env` ships `SIGNATURE_PROVIDER=docuseal`.
- The UI iframe never reports an error — it just shows a blank frame.
- Fix:
  1. Default to `SIGNATURE_PROVIDER=mock` in dev/staging .env, OR move
     `docuseal` out of the profile so it always boots with the stack.
  2. Detect iframe load failure in `AgreementSigningStep` and render a
     fallback ("Agreement service unavailable — retry / contact support").

### BUG-11 (critical)  Document upload presign 400s every time
- UploadStep dispatches `uploadDocument` with `doc.id.toUpperCase()` → `'COI'`.
- Saga sends `{ filename, contentType, documentType: 'COI' }`.
- API validator wants `{ fileName, contentType, documentType: 'INSURANCE_CERT'
  | 'DISPATCH_AGREEMENT' | 'W9' | 'CARRIER_PACKET' }`.
- 100% failure; UI silently reverts the upload UI to “Drop a file”, no toast.
- Fix:
  1. Rename `filename` → `fileName` in `utils/api/carrierPortal/v2.ts:174`.
  2. Map UI doc IDs to backend enum in UploadStep (`coi → INSURANCE_CERT`,
     etc.) — or align the schema (`documentsPhase.id = 'insurance_cert'`).
  3. Wire `enqueueSnackbar` into `uploadDocumentFailure`.

### BUG-12  Reaching “Complete” doesn’t actually complete the session
- Page renders "You're submitted, John" but
  `OnboardingSession.completedAt` is still NULL and `Carrier.status` stays
  `DRAFT`. CompleteStep never calls `POST /session/complete`.
- Dispatcher sees a `DRAFT` carrier with no submitted signal; carrier thinks
  they're done.
- Fix: `CompleteStep` dispatches a `completeSession` action on mount; only
  show the cheerful copy after the success.

## High (Sev-2) — silent failures and persistence gaps

### BUG-03 / BUG-07  Continue does nothing, no error
- On welcome-segmentation with nothing selected, Continue produces no toast,
  no inline error, no network call — pure no-op.
- Same on equipment-entry with empty list.
- Fix: either disable Continue until the current step’s validator passes, or
  raise a toast when the registered `onContinue` short-circuits.

### BUG-08  submitStep failures are silent
- `submitStepFailure` updates the loading map but the saga never calls
  `enqueueSnackbar`. The 400 ("MC number is required…") only appeared in
  devtools console.
- Compare to `loadSessionSaga.ts:29` which **does** raise a toast on failure.
- Fix: standardize — every `*Failure` action that has a user-facing error
  should toast (uploadDocument, submitStep, costAnalysis, lanePreferences,
  saveAndExit).

### BUG-04  FMCSA verification spins forever (already known)
- `VerificationStep` waits on `session.fmcsaSnapshot`. No saga populates it.
- Carrier sees the spinner with no recovery UI. Should never have shipped to
  the live `Yes` path without the side-effect pipeline (US-21/US-23).
- Short-term mitigation: until the saga lands, hide the “Yes” path on the
  client OR auto-fall-through to the manual form after a 5s timeout.

### BUG-05  One Continue click hits `submit-step` twice
- Same Continue press on company-authority produced 834 + 835 to
  `/session/submit-step`. Most likely React 18 StrictMode + a non-idempotent
  registered onContinue handler in `StepNavContext`. Either guard the
  registration or wrap the handler in a `useEvent`-style stable callback.

## Medium — UX/data quality

### UX-01  Yes/No driver question is a combobox
- `drivers-has-employees` renders as a select; every other Yes/No step uses
  radios. Mobile UX inconsistency.

### UX-02  Complete summary omits “Sign Agreement”
- Checklist on the complete page renders 8 of 9 phases — the signing step is
  filtered out. Carrier loses visual confirmation that they signed.

### UX-03  Complete page has no terminal CTA
- Only "Save & Exit" and "Back". Add a primary "Done" / "Take me to my
  dashboard" so the carrier knows the flow is over.

### BUG-02  GET /session called 4× on initial page load
- `PortalAuthGuard` and `CarrierPortalPage` each `useEffect`-dispatch
  `loadSession`; React 18 StrictMode doubles each → 4 calls in dev (2 in
  prod). Delete the duplicate dispatch in `CarrierPortalPage/index.tsx:146`.

## Security

### SEC-01  Invite tokens stored in plaintext
- `CarrierInviteToken.token` is a 64-hex string compared directly.
- DB or backup leak = every unrevoked token is a live full-access portal link.
- Fix: hash on write (`createHash('sha256').update(raw).digest('hex')`), hash
  incoming token before lookup. Send the raw value only in the magic link.

### SEC-02  EIN/TIN unencrypted; SSN goes into `answers` JSON
- `Carrier.ein` is plain text; the "I'm an individual" checkbox puts an SSN
  into `OnboardingSession.answers` as plain JSON.
- Either encrypt the column with KMS/pg_crypto, or refuse to persist SSN at
  all and capture it only through the signed W-9 PDF.

## Suggested ship order

The list is long, but the path back to a green flow is short:

1. **BUG-06 + BUG-10 + BUG-11** — three independent fixes that together make
   the No-authority path completable end-to-end. ~1 day each.
2. **BUG-09 + BUG-12** — promote answers to `Carrier` columns and actually
   call `/session/complete`. Without these the carrier looks done but the
   dispatcher view doesn’t know it.
3. **BUG-01 / BUG-03 / BUG-07 / BUG-08** — small UX/initialization fixes,
   batch in one pass.
4. **BUG-04** — block the Yes-authority path until the FMCSA saga lands.
5. **SEC-01 + SEC-02** — before any real carrier touches the system.
6. **BUG-02 / BUG-05 / UX-01-03** — polish.
