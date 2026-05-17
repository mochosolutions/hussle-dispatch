# Carrier Onboarding — Technical Design Document

**Status:** Draft v1
**Author:** Jr (CTO)
**Audience:** Technical founders, principal engineers, future engineering hires
**Date:** May 2026

---

## 0. Purpose and scope

This document specifies the technical design of FleetCommand's carrier onboarding system. It targets a technical reader who needs to understand, evaluate, or extend the system.

**In scope:**
- Architectural decomposition and component boundaries
- Form engine internals: schema language, state machine, navigation, invalidation
- Data model and persistence strategy
- Side effect architecture and event topology
- External integrations (FMCSA, DocuSeal, scoring engine)
- Real-time concerns (eligibility sidebar, dispatcher dashboard, co-pilot mode)
- Security, legal compliance, audit trail
- Scalability posture and failure modes
- Implementation roadmap

**Out of scope:**
- Concrete schemas (this defines the schema *language*, not specific schemas)
- The dispatcher dashboard UI implementation
- Insurance brokering flow (Phase 4 dependency, deferred)
- Multi-language support (deferred)

This is a design document. It specifies architecture, not implementation. The implementing engineer (or Claude Code) makes implementation decisions consistent with existing codebase patterns.

**Companion documents:**
- `CarrierOnboarding_DesignSpec.docx` — design spec for non-technical reviewers (Omar, Isaiah)
- `CarrierOnboardingPrototype.jsx` — interactive prototype demonstrating the engine, branching, pre-sign mid-flow, and eligibility sidebar

---

## 1. Problem statement

A new carrier interacts with FleetCommand for the first time via a magic-link invitation, fills out a multi-step form on a phone, signs a revenue-share agreement, and uploads supporting documents — all in a single session of under 15 minutes. The system must:

1. Adapt the form to who the carrier is (segmentation-driven branching)
2. Reduce manual entry to a minimum (FMCSA auto-population)
3. Capture the legal commitment (signed dispatch agreement) mid-flow rather than at the end
4. Show live value preview (eligibility load count from the scoring engine)
5. Give dispatchers real-time visibility into in-flight onboardings
6. Allow saving and resuming via the same link
7. Lock fields that fed the signed agreement to preserve legal integrity
8. Audit everything for legal defensibility (ESIGN/UETA compliance)

The carrier is unauthenticated until the final step. The interaction must work on a low-end Android phone over a 4G connection. The system must remain consistent under network failure, abandoned sessions, and partial completions.

---

## 2. Architectural overview

The system decomposes into five layers, each with a single responsibility.

### 2.1 The schema layer
A versioned, declarative description of the onboarding flow. Phases contain steps; steps contain questions; questions have validation, visibility predicates, and prefill bindings. Stored as JSON in Postgres. Authored in TypeScript for editor support; serialized for runtime use.

### 2.2 The engine layer
A pure function: `(session, command) → (next_state, events, warnings)`. Reads the schema, applies a command, returns the result. No I/O. No persistence. No external calls. This is testable in isolation and replayable from an event log.

### 2.3 The renderer layer
React components that consume the schema and a session, rendering the appropriate step UI. One renderer per step type. Generic and reusable — knows nothing about carrier onboarding specifically.

### 2.4 The orchestration layer
A backend service that owns session state. Receives commands from the portal, invokes the engine, persists the resulting state, publishes domain events. Frontend has a thin proxy that calls this service.

### 2.5 The side-effect layer
RabbitMQ subscribers that consume domain events and perform external actions: call FMCSA, generate documents, talk to DocuSeal, query the scoring engine, send notifications. Each subscriber is isolated and independently scalable.

### 2.6 Component boundaries

```
[Carrier Portal (Next.js)]
    ↕ HTTPS, JWT-authenticated
[Onboarding API (Express)]
    ↓ writes               ↑ reads
[Postgres (sessions, events, schemas, profiles)]
    ↓ outbox → relay
[RabbitMQ exchange: onboarding.events]
    ↓ consumed by
[FMCSA Subscriber] [Agreement Generator] [DocuSeal Adapter]
[Eligibility Engine] [Dispatcher Notifier] [Session Projector]
[DocuSeal Webhook Handler] [Document OCR] [Session Watchdog]
    ↓ where applicable, publish completion events
[RabbitMQ] → [Onboarding API] (consumed as ExternalEvent commands)

[Carrier Portal]   ←─ WebSocket ─→ [Session Gateway]    ←── Redis pub/sub
[Dispatcher UI]    ←─ WebSocket ─→ [Dispatcher Gateway] ←── Redis pub/sub
```

### 2.7 Why this decomposition

Three properties matter:

1. **The engine is pure**, so it's trivially testable and horizontally scalable. Any orchestrator instance can process any command.
2. **Side effects are decoupled** from request/response. The portal returns 200 after persisting the command; subscribers do the work async.
3. **The schema is data, not code**, so flow evolution doesn't require deployments. Update the schema row; in-flight sessions stay pinned to their version.

---

## 3. The form engine

### 3.1 Schema language

The schema is a tree of phases, each containing an ordered list of steps. Each step has a type that determines its rendering and behavior. Steps contain zero or more questions. Each schema element optionally carries a visibility predicate.

**Phase** — top-level grouping with optional checkpoint screen, visibility predicate, and estimated duration metadata.

**Step** — ordered unit within a phase. Has a type (segmentation, input, verification, upload, signing, review, checkpoint, complete). Optional visibility predicate, side effects, navigation rules, and lock metadata (`locksFields` for signing steps).

**Question** — data-gathering unit within an input step. Has an ID, label, field type, validation, visibility predicate, prefill binding, UX hints.

**Predicate** — a serializable expression evaluated against the session context. Operators: `eq`, `in`, `and`, `or`, `not`, `jsonpath`. Field references use dot notation: `answers.<step_id>.<question_id>`, `fmcsa.<field>`, `invitation.<field>`.

**Prefill binding** — a context dot-path. When the question renders and its current value is empty, the engine resolves the binding against the session context and populates it. The carrier can still edit.

**Side effect** — a serializable description of an action to take when entering or completing a step. Types: `fmcsa_lookup`, `generate_agreement`, `eligibility_recalc`, `notify_dispatcher`, `ocr_document`.

### 3.2 The state machine

The engine accepts commands and produces results.

**Commands:**
- `OpenInvitation`
- `SubmitStep(stepId, answers)`
- `NavigateBack(toStepId, confirm)`
- `AcknowledgeCheckpoint(stepId)`
- `ResumeSession`
- `ExternalEvent(event)`
- `DispatcherFillOnBehalf(stepId, answers, actorId)`

**Results:**
- Next state (updated session)
- Events to publish (domain events for RabbitMQ via outbox)
- Invalidated steps (in case of back-navigation)
- Warnings (locked field violations, validation errors)

The engine is referentially transparent. Given the same session and command, it always produces the same result. This is the property that makes it testable.

### 3.3 Visibility evaluation

Three layers of conditional logic:

1. **Phase visibility** — entire phases hidden when predicate evaluates false
2. **Step visibility** — individual steps within visible phases hidden
3. **Question visibility** — individual questions within visible steps hidden

Predicates evaluate lazily: a question's visibility is computed at render time against current session context. Changes propagate immediately.

The engine exposes `getVisibleSteps(schema, session)` as the canonical "what's the flow right now" answer. Progress percentages, navigation, and invalidation all derive from this.

### 3.4 Step navigation

Default behavior: linear traversal of visible steps. `getNextStepId` and `getPrevStepId` are functions of `(schema, session, currentStepId)`.

Steps may declare custom navigation rules in their `navigation` property — e.g., "go to step X if answer Y, otherwise default." For v1, the linear default suffices for all known cases.

### 3.5 Back navigation and invalidation

When a carrier navigates back and changes an answer:

1. Engine re-evaluates visibility for all completed steps using the trial session state
2. Any step whose visibility flipped true → false is marked invalidated
3. Any step whose prefill source changed (e.g., FMCSA snapshot stale because MC# changed) is marked invalidated
4. Engine returns the list of invalidated steps
5. UI shows a confirmation modal listing what will reset
6. On confirm, invalidated steps' answers are archived (not deleted) and the steps are removed from the completed list

**Locked steps are immune.** If a back-edit would invalidate a step whose fields are referenced in `locksFields` of a completed signing step, the engine refuses the edit and returns a lock-violation warning.

### 3.6 Step type semantics

| Type | Semantics |
|------|-----------|
| `segmentation` | First step. Drives downstream branching. No side effects. |
| `input` | Data collection. Submits trigger validation (Yup) and downstream visibility recomputation. |
| `verification` | Engine emits outbound side effect (e.g., FMCSA lookup), shows waiting UI, advances on inbound `ExternalEvent`. |
| `upload` | Document collection. Presigned S3 PUT plus async verification. Completes when required uploads are `Pending` or better. |
| `signing` | Deferred-completion. Engine emits agreement generation on entry, transitions through `Generating → ReadyToSign → Signing → Signed` from inbound events. Locks itself when `Signed`. |
| `review` | Read-only summary with inline edit links per displayed field. |
| `checkpoint` | Celebratory milestone screen. No data. Engine waits for `AcknowledgeCheckpoint`. |
| `complete` | Terminal. Fires finalization side effects (Cognito provisioning, dispatcher notification, `CarrierActivated` event). |

### 3.7 Context resolution

The engine maintains a unified context object combining:

- `answers.*` — current session answers
- `fmcsa.*` — FMCSA snapshot if present
- `invitation.*` — invitation metadata (inviter, email, phone)
- `carrier.*` — carrier profile fields after creation
- `dispatcher.*` — dispatcher context for the inviting org

Predicates and prefill bindings resolve against this context. The context is reconstructed from session state on each invocation — it's not a cached, mutable thing.

---

## 4. Data model

Conceptual entities. Field names indicative, not normative. The implementing engineer maps these to Prisma based on existing codebase patterns.

### 4.1 CarrierInvitation
Created by a dispatcher. Holds the JWT token (signed magic link), invitee contact info, schema reference, status, and the eventual link to the CarrierProfile once activated.

**Lifecycle states:** `Created → Sent → Opened → InProgress → AwaitingSignature → AwaitingDocuments → Complete` (or `Expired`, `Voided`).

### 4.2 OnboardingSchema
Versioned, immutable. Each version is a complete schema definition. New versions create new rows. Existing sessions stay pinned to the version they started with. Active flag indicates which version new invitations should use.

### 4.3 OnboardingSession
One per opened invitation. Holds current step, completed steps, answers (JSONB, namespaced by step), UI context (last-known progress, eligibility cache), timestamps. Materialized projection from the event stream — can be rebuilt from events if needed.

### 4.4 OnboardingEvent
Append-only event log. Every state transition produces one or more events. Source of truth for audit and replay. Indexed by `(sessionId, emittedAt)`.

### 4.5 CarrierProfile
Created when onboarding completes (or when agreement is signed — see §13.4). Holds the operational carrier identity used by the rest of FleetCommand. EIN is encrypted at rest (KMS-backed column encryption); only the last four digits are surfaced in UI.

### 4.6 Agreement
One row per agreement generated for a carrier. References the template and variables used. Holds the DocuSeal submission ID, signed PDF S3 key, audit certificate S3 key, and a SHA-256 hash of the signed PDF.

**Lifecycle:** `Draft → Pending → Signed` (or `Voided`).

### 4.7 Document
One row per uploaded document. Type enum (W9, COI, MCLetter, VoidedCheck, DL, CDL, Registration). Stored on S3 under org-scoped path. Status (`Pending`, `Verified`, `Rejected`) tracks human or automated verification. Metadata column holds OCR results, expiry dates, extracted fields.

### 4.8 Indexes worth flagging
- Invitations by token (unique, hashed lookup)
- Sessions by invitation (one-to-one)
- Events by `(sessionId, emittedAt)` for replay
- Agreements by `providerSubmissionId` for webhook routing
- Carrier profiles by `(orgId, dotNumber)` for dispatcher dashboard queries

---

## 5. Session lifecycle and persistence

### 5.1 Persistence model
Hybrid: event-sourced ledger plus materialized projection. Every command produces events that are appended to the event log atomically with the session row update. The session row is a denormalized projection used for fast reads; the event log is the source of truth.

For dispute resolution or debugging, any session's state at any moment can be reconstructed by replaying its events.

### 5.2 Outbox pattern for event publishing
Events are not published to RabbitMQ inline with the API request. Instead, they're written to an `outbox` table in the same Postgres transaction as the session state update. A relay process drains the outbox to RabbitMQ asynchronously.

**Why:** atomicity. If the API process crashes after publishing to RabbitMQ but before committing the DB transaction, we have an event without state. The outbox pattern eliminates that.

### 5.3 Schema version pinning
When a session is created, the active schema version is stamped on the session row. The session evaluates against that version until completion. If the schema is updated mid-flight, in-progress sessions are unaffected.

Schema migrations: write a new version row, flip the active flag. Old version stays for in-flight sessions.

### 5.4 Save and resume
The invitation token JWT is reusable until status is `Complete`, `Voided`, or `Expired`. When the carrier returns via the same URL, the orchestration layer loads the session and engine state and resumes at `currentStepId`. UI shows a welcome-back banner.

A watchdog job emits `session.abandoned` events when `lastActivityAt` exceeds a configured threshold (default 30 minutes). Dispatchers see these in their dashboard. The session itself isn't terminated — abandonment is a notification, not a state change.

### 5.5 Concurrent edits
A single session is owned by one carrier. Concurrent edits aren't expected. Dispatcher co-pilot mode introduces a possibility of carrier + dispatcher editing simultaneously. Mitigated by optimistic locking on the session row (version column, conflict returns 409). The losing client refreshes and retries.

---

## 6. Side effect architecture

### 6.1 Event flow

The orchestration layer is the only producer of `engine.*` events. Subscribers consume these, do work, and publish completion events back. The engine consumes those as `ExternalEvent` commands.

**Exchange:** `onboarding.events` (topic exchange)

**Routing keys produced by the engine:**
- `onboarding.session.started`
- `onboarding.step.completed`
- `onboarding.session.advanced`
- `onboarding.session.abandoned` (by watchdog)
- `onboarding.fmcsa.requested`
- `onboarding.agreement.generation_requested`
- `onboarding.agreement.signing_requested`
- `onboarding.eligibility.requested`
- `onboarding.dispatcher.notification_requested`
- `onboarding.session.completed`

**Routing keys produced by subscribers (consumed by engine):**
- `onboarding.fmcsa.completed`
- `onboarding.agreement.generated`
- `onboarding.agreement.signed`
- `onboarding.agreement.declined`
- `onboarding.document.uploaded`
- `onboarding.document.verified`
- `onboarding.eligibility.completed`

### 6.2 Subscriber responsibilities

| Subscriber | Responsibility |
|------------|---------------|
| FmcsaLookupSubscriber | Consumes `fmcsa.requested`, calls SaferWebAPI, publishes `fmcsa.completed` with response or error. |
| AgreementGeneratorSubscriber | Consumes `agreement.generation_requested`, renders React template with answers, posts HTML to DocuSeal, publishes `agreement.generated` with embedUrl. |
| DocusealAdapterSubscriber | Wraps DocuSeal API. Owns submission lifecycle: create, fetch status, void, fetch signed artifacts. |
| DocusealWebhookHandler | HTTP endpoint receiving DocuSeal webhooks. Verifies HMAC. Translates `submission.completed` → `agreement.signed`, etc. Fetches signed artifacts, stores to S3. |
| DocumentOCRSubscriber | Consumes `document.uploaded`, invokes Textract, parses fields, publishes `document.verified` or queues for human review on low confidence. |
| EligibilityEngineSubscriber | Consumes `eligibility.requested`, queries scoring engine with partial carrier profile, publishes `eligibility.completed`. |
| DispatcherNotifierSubscriber | Consumes various notification events, dispatches via Twilio SMS or WebSocket push. |
| SessionProjector | Consumes all step and external events, updates OnboardingSession row. Idempotent. |
| DispatcherDashboardBroadcaster | Consumes all session events, projects to dispatcher dashboard WebSocket channels. |
| SessionWatchdog | Periodic job. Scans sessions with stale `lastActivityAt`, emits `session.abandoned`. |

### 6.3 Idempotency

Every subscriber is idempotent against the message's deduplication key (a function of session ID and event timestamp, or the external system's own ID for inbound webhooks). RabbitMQ may redeliver; subscribers handle this without producing duplicate effects.

For DocuSeal webhooks specifically: the handler checks if the agreement is already in the target state before processing. Replay is a no-op.

### 6.4 Retry and dead letter

Each subscriber declares a retry policy (exponential backoff, max 5 retries) and a dead-letter queue. Messages that exhaust retries land in DLQ for human review. A dashboard surfaces DLQ depth.

### 6.5 Ordering and consistency

Per-session ordering is guaranteed by routing all events for a session through a single partition (session ID hash). Across sessions, order is not preserved. This is acceptable — sessions are independent.

---

## 7. External integrations

### 7.1 FMCSA / SaferWebAPI

**Used for:** carrier identity proofing and prefill on MC number entry.

**Integration:** HTTP wrapper service. Cached per-MC for 24 hours to avoid redundant queries. Rate-limited per TOS.

**Failure mode:** if FMCSA is unavailable, the verification step shows a degraded UI with a "skip and enter manually" option. Engine continues, prefill is skipped. The carrier types fields manually. Background job retries the FMCSA lookup later and notifies the dispatcher when it succeeds.

### 7.2 DocuSeal (via port + adapter)

**Used for:** dispatch agreement generation, embedded signing, audit trail, signed PDF retrieval.

**Port interface:** `SignatureProvider` with methods `createSubmission`, `getSubmission`, `voidSubmission`, `fetchSignedArtifacts`.

**Adapter implementation:** DocuSeal-specific. Sends HTML templates directly (DocuSeal handles HTML→PDF, skipping Puppeteer). Uses text-tag field anchoring in templates so legal can edit React components without breaking field positions.

**Webhook handler:** HMAC-verified HTTP endpoint. Translates DocuSeal events to domain events.

**Failure mode:** if DocuSeal is unavailable for submission creation, the signing step blocks with "unable to prepare agreement, please try again in a moment." Retry is automatic. If unavailable >5 minutes, dispatcher is notified to manually advance via co-pilot once it recovers.

**Self-host vs cloud:** see §13.1.

### 7.3 Scoring engine

**Used for:** live eligibility preview during equipment and lane steps.

**Integration:** internal gRPC service. Query takes a partial carrier profile (equipment, lane) and returns load count + revenue band.

**Caching:** Redis, 5-minute TTL per partial-profile hash. Absorbs keystroke-level UI updates without hammering the scoring engine.

**Failure mode:** sidebar shows "calculating..." indefinitely. Onboarding not blocked. If scoring engine is down for extended period, sidebar is suppressed entirely.

### 7.4 S3 (document storage)

All carrier-uploaded documents and signed agreements store under org-scoped paths:

```
s3://fleetcommand-carrier-docs/orgs/{orgId}/carriers/{carrierId}/{type}/{documentId}.{ext}
```

Signed agreements:

```
s3://fleetcommand-carrier-docs/orgs/{orgId}/carriers/{carrierId}/agreements/{agreementId}/signed.pdf
s3://fleetcommand-carrier-docs/orgs/{orgId}/carriers/{carrierId}/agreements/{agreementId}/audit-certificate.pdf
```

Multipart uploads via presigned URLs. Portal uploads directly to S3 without proxying through the API.

### 7.5 Twilio

**Used for:** invitation SMS, nudge SMS, dispatcher-side notifications.

**Integration:** existing Twilio wrapper. No new abstractions required.

### 7.6 AWS Cognito

**Used for:** carrier identity post-onboarding. Creation timing decision in §13.4.

---

## 8. Real-time concerns

### 8.1 Eligibility broadcast

The eligibility sidebar updates as the carrier fills equipment and lane fields. Flow:

1. Carrier updates an answer
2. Engine emits `eligibility.requested` after debouncing (300ms)
3. EligibilityEngineSubscriber queries scoring engine, publishes `eligibility.completed`
4. SessionProjector updates the session's eligibility cache
5. Session state change published to Redis channel `session-state.{sessionId}`
6. WebSocket gateway pushes delta to carrier's browser
7. Sidebar re-renders

Debouncing happens at the engine layer to avoid one event per keystroke.

### 8.2 Dispatcher dashboard

Each dispatcher org subscribes to `dispatcher.{orgId}.invitations` via WebSocket. Events pushed: new invitation created, invitation opened, step completed, document uploaded, agreement signed, session abandoned.

The dispatcher dashboard maintains a denormalized read model (`InvitationListItem`) for fast rendering. Updates from the event stream patch this read model in place.

### 8.3 Co-pilot mode

A dispatcher opens a carrier's in-flight session in a "co-pilot" view. Their fills go through the same engine but are stamped with `actor: dispatcher_id` in the event payload. The carrier's portal subscribes to the session state channel and re-renders as the dispatcher edits.

Bidirectional WebSocket — both can edit. Optimistic locking handles conflict.

A `co_pilot_review_required` flag is set on the session if any co-pilot edits occurred. The signing step refuses to proceed until the carrier acknowledges a "review and confirm" screen verifying all data.

---

## 9. Security and legal

### 9.1 Token handling

Magic link JWTs are signed with a rotating key (`kid` in header). Claims: `sub` (invitation ID), `exp` (invitation expiration), `iat`, `jti` (for revocation tracking).

Tokens validated on every request to the carrier portal. Token validation is decoupled from session lookup — the token authorizes access to a specific invitation; the session is loaded from the invitation.

### 9.2 PII handling

- **EIN** — encrypted at rest using KMS-backed column encryption. Decrypted only when needed for agreement generation. Last 4 surfaced in UI. Never logged.
- **SSN** — not collected. We use EIN for businesses, not individual SSNs.
- **Banking details** — stored only via Stripe Connect tokens. Raw account numbers never touch our DB.
- **Document contents** — stored in S3 with bucket-level encryption (AES-256 server-side). Access via presigned URLs with short TTL (15 minutes).

### 9.3 Audit trail

Every state transition is an event. Event payloads include actor, timestamp, IP (from request), user agent. Events are append-only; tampering would require modifying the event log, which is detected via periodic hash chain verification.

For agreement signing specifically: the audit trail consists of (a) FleetCommand's event log showing the signing request and webhook receipt, plus (b) DocuSeal's audit certificate including signer authentication, IP, timestamp, document hash.

### 9.4 ESIGN / UETA compliance

The four pillars:

1. **Intent to sign** — explicit click on "Sign now" button in DocuSeal embedded surface
2. **Consent to do business electronically** — captured in initial portal acceptance, archived in event log
3. **Association of signature with record** — DocuSeal binds signature to document via cryptographic seal
4. **Record retention** — signed PDF + audit certificate stored in S3 with no automatic deletion. Retention: 7 years from signing date or contract termination, whichever is later.

### 9.5 Co-pilot protection

When a dispatcher fills fields on a carrier's behalf:

- Each filled field's event payload includes dispatcher's actor ID
- Session is flagged `co_pilot_review_required: true`
- Signing step blocks until carrier acknowledges the review and confirm screen
- Audit log records both co-pilot edits and carrier's confirmation as separate events

In a dispute, this evidence chain shows the carrier had the opportunity to review and explicitly confirmed.

### 9.6 Multi-tenant data isolation

Every entity has an `orgId`. Every query through the API filters by orgId. S3 paths are org-scoped. The carrier's view of their data shows only their org's context.

The carrier portal accesses data via the invitation token. The token implies the org. The token can't be used to access another carrier's data — server enforces this with token-to-invitation-to-org chain.

---

## 10. Scalability posture

### 10.1 What scales horizontally
- **Orchestration API** — stateless, behind load balancer. Scale on CPU/memory.
- **Engine invocations** — pure functions, scale with API instances.
- **RabbitMQ subscribers** — independently scalable per subscriber type. Add replicas when queue depth grows.
- **WebSocket gateways** — stateless after Redis pub/sub fan-out. Scale on connection count.

### 10.2 What's per-session
- The carrier's WebSocket connection
- The dispatcher's WebSocket connection (when viewing a specific session)
- Redis pub/sub channels per session

### 10.3 Bottlenecks to monitor

**Scoring engine query latency.** Eligibility recalcs fire on every answer change in equipment and lane steps. 5-minute Redis cache mitigates, but cache miss latency must stay under 500ms or the UI lags.

**DocuSeal API rate limits.** At scale, may hit DocuSeal's per-account rate limits. Self-hosted deployment removes this risk; cloud requires negotiation.

**FMCSA SaferWebAPI rate limits.** Third-party wrapper has its own limits. 24-hour per-MC cache makes this a non-issue for normal usage but matters during traffic spikes.

**Database write throughput on the events table.** Append-only, high-volume. Consider partitioning by month after 1M+ events. Not relevant until carrier volume crosses ~10K/month.

### 10.4 Caching strategy
| Layer | TTL | Key |
|-------|-----|-----|
| FMCSA responses | 24 hours | MC number |
| Eligibility queries | 5 minutes | partial-profile hash |
| Schema definitions | in-memory, invalidated on row update | schema ID |
| Session state read replicas | not needed initially | — |

---

## 11. Failure modes and recovery

### 11.1 FMCSA unavailable
Detected by timeout or 5xx. Engine receives `fmcsa.completed` with error payload. Verification step shows "FMCSA temporarily unavailable — you can continue and we'll fill this in later." Engine proceeds without prefill. Carrier types fields manually. Background job retries later and notifies dispatcher when it succeeds.

### 11.2 DocuSeal webhook never fires
Agreement stuck in `Signing` status. Watchdog job scans for agreements in `Signing` older than 10 minutes, queries DocuSeal directly via `getSubmission`, reconciles. If DocuSeal confirms signed but we missed the webhook, watchdog re-publishes `agreement.signed`.

Webhook delivery is not the only mechanism. Watchdog is the fallback.

### 11.3 RabbitMQ unavailable
Outbox pattern (§5.2). Events written to Postgres `outbox` table in same transaction as state changes. Relay process drains outbox to RabbitMQ. If RabbitMQ is down, outbox grows; once RabbitMQ recovers, events flush. Carrier sees the API working; subscribers catch up.

### 11.4 Scoring engine slow or down
Eligibility sidebar shows "calculating..." Onboarding not blocked. If down for extended period, sidebar suppressed entirely with "estimated load count will be available in your portal once you complete onboarding."

### 11.5 S3 upload failure
Presigned URL upload fails. Frontend retries with exponential backoff. After 3 failures, surface "retry upload" button. Carrier can continue with other documents; failed uploads don't block.

### 11.6 Carrier abandons mid-flow
No automated recovery — user choice. Dispatcher dashboard surfaces abandoned sessions; dispatcher decides whether to nudge, call, or void. Watchdog emits `session.abandoned` after configurable inactivity threshold.

### 11.7 Schema bug discovered after deployment
Active schema flag flipped back to previous version. New invitations use previous version. In-flight sessions on bad version stay pinned, but can be migrated manually by re-issuing invitation tokens against the new schema if needed.

### 11.8 Catastrophic data loss
Event log is the source of truth. From event log + schema definitions, we can rebuild any session's materialized state. Daily Postgres backups. S3 versioning enabled on document bucket.

---

## 12. Implementation roadmap

Twelve tasks, each scoped to 2–4 hours of focused work, dependency-ordered.

### Task 1: Schema TypeScript types + validator
Define schema TypeScript interfaces. Build JSON Schema validator confirming a stored schema row is structurally valid. Tests covering happy paths and malformed schemas.

### Task 2: Engine pure functions
Implement `getVisibleSteps`, `getNextStepId`, `getPrevStepId`, `evaluatePredicate`, `resolveContext`, `computeInvalidations`. Pure, dependency-free except types from Task 1. Comprehensive unit tests — these are the heart of the system.

### Task 3: Prisma schema and migrations
Define entities from §4. Apply migrations to dev DB. Seed a v1 onboarding schema row.

### Task 4: Invitation API + token verifier
Endpoints: create invitation (dispatcher-auth), open invitation (token-auth), regenerate, void. JWT signing/verification with key rotation.

### Task 5: Session orchestration API
Endpoints: load session (token-auth), submit step, navigate back, acknowledge checkpoint. Internally calls engine, persists state, writes to outbox.

### Task 6: Outbox relay
Background process draining outbox table to RabbitMQ. Idempotent, exactly-once delivery.

### Task 7: FMCSA lookup subscriber
SaferWebAPI integration. Caching, retry, timeout handling. Publishes `fmcsa.completed`.

### Task 8: DocuSeal adapter + agreement generator
`SignatureProvider` port implementation. AgreementGeneratorSubscriber renders React template, posts HTML to DocuSeal, publishes `agreement.generated`.

### Task 9: DocuSeal webhook handler
HTTP endpoint with HMAC verification. Fetches signed artifacts, stores to S3, publishes `agreement.signed`. Watchdog job for missed webhooks.

### Task 10: Step renderer components
React components for each step type. Generic, consume schema + session. Use `@mocho/ui` primitives.

### Task 11: Eligibility subscriber + WebSocket gateway
Scoring engine integration. Redis pub/sub channels per session. WebSocket gateway service.

### Task 12: Dispatcher dashboard projection + WebSocket channel
Read model for invitation list. Real-time updates. Co-pilot mode hooks (deferred if needed).

### Cross-cutting
- Authentication and authorization middleware
- Audit log read API
- Observability (metrics, logs, traces) per subscriber
- DLQ monitoring dashboard

**Total estimated effort:** ~40–50 hours. Sequencing: 1→2→3→4→5→6, then 7–12 mostly in parallel.

---

## 13. Open technical decisions

### 13.1 DocuSeal: self-hosted vs cloud
- **Self-hosted:** full control, no per-document fees beyond infrastructure, AGPL licensing question to resolve with legal.
- **Cloud:** simpler ops, ~$540/year at expected scale, no AGPL concern, less infrastructure.

**Lean:** self-hosted on AWS once Pro licensing question is clarified in writing. Defer if it adds significant ops overhead in v1.

### 13.2 HTML template route vs Puppeteer-rendered PDF
- **HTML route:** fewer moving parts, single source of truth (React component), but couples to DocuSeal's HTML/CSS support.
- **Pre-rendered PDF:** more steps, but full typography control, reuses existing Puppeteer pipeline.

**Lean:** HTML route for v1. Migrate to pre-rendered if typography fidelity becomes an issue.

### 13.3 OCR scope
- **W-9:** EIN is verifiable via agreement-signing step; OCR not critical.
- **COI:** high value — auto-extract carrier, policy, dates, limits, verify expiry.

**Lean:** defer OCR to Phase 2. v1 ships with Isaiah manually reviewing every document.

### 13.4 Cognito provisioning timing
- **At signing:** gives carrier portal access to upload remaining documents. Better UX. Creates Cognito identity even for abandoned carriers.
- **At completion:** cleaner — Cognito identity only for fully onboarded carriers. Forces carrier to complete documents in same session.

**Lean:** at signing. Abandoned-with-Cognito-identity case is rare and recoverable.

### 13.5 Schema authoring tool
v1: schemas authored in TypeScript by Jr, deployed via migration.
Future: non-engineer schema editor UI.

**Lean:** defer editor. Not needed until non-engineers need to evolve flows.

### 13.6 Invitation expiration policy
Defaults: unopened 14 days, opened-but-incomplete 30 days, manually regenerable.

**Lean:** hardcode v1 defaults. Expose configuration in Phase 2.

### 13.7 Co-pilot real-time conflict handling
- **Optimistic locking + 409 → refresh:** simple, sufficient for one carrier + one dispatcher max
- **Operational transform style merge:** overkill for this concurrency level

**Lean:** optimistic locking.

---

## 14. Risks and mitigations

Ranked by combined likelihood × impact.

### Risk 1: DocuSeal AGPL licensing creates legal exposure
**Likelihood:** medium · **Impact:** high
**Mitigation:** Confirm with DocuSeal that the Pro tier commercial license overrides AGPL obligations for embedding. Get this in writing before commit. Fall back to BoldSign or Documenso cloud if unresolved.

### Risk 2: Pre-sign mid-flow creates "signed-but-incomplete" carriers
**Likelihood:** medium · **Impact:** medium
**Mitigation:** Treat as a distinct session state. Isaiah's 24-hour call covers these. Dashboard surfaces them prominently. Worst case: an orphan signed agreement — no harm done.

### Risk 3: FMCSA data is stale or wrong
**Likelihood:** high · **Impact:** low
**Mitigation:** All prefilled fields editable. UI explicitly states "we pulled this from FMCSA, please confirm." Carrier corrects what's wrong.

### Risk 4: Eligibility sidebar shows misleading numbers
**Likelihood:** medium · **Impact:** medium
**Mitigation:** Numbers shown as ranges, not point estimates. Disclaimer: "estimated based on similar carriers in your lane — actual results vary." Adjust algorithm based on early-carrier feedback.

### Risk 5: Schema evolution breaks in-flight sessions
**Likelihood:** low · **Impact:** high
**Mitigation:** Pin sessions to schema version at start. Schema versioning is immutable. Predictable behavior even during deployments.

### Risk 6: Co-pilot mode creates legal exposure
**Likelihood:** low · **Impact:** high
**Mitigation:** Mandatory review-and-confirm step before signing whenever co-pilot edits occurred. Carrier's confirmation logged with timestamp + IP. Event log shows clear per-field provenance.

### Risk 7: Engine bug causes incorrect step visibility
**Likelihood:** medium · **Impact:** medium
**Mitigation:** Engine purity enables comprehensive unit test coverage. Property-based tests against the predicate evaluator. Visual regression tests on the prototype as schema evolves.

### Risk 8: RabbitMQ becomes a bottleneck
**Likelihood:** low · **Impact:** medium
**Mitigation:** Already in use, well-understood. Scale subscribers independently. Outbox pattern ensures no event loss during incidents.

### Risk 9: WebSocket connections at scale
**Likelihood:** low (year 1) · **Impact:** medium (year 2+)
**Mitigation:** WebSocket gateways stateless. Scale horizontally. Connection limit per server ~10K. Single server handles 1000 active onboardings comfortably.

---

## Appendix A: Glossary

- **Phase** — top-level grouping of related steps (e.g., "Business Profile")
- **Step** — single screen the carrier sees, e.g., "Enter MC number"
- **Question** — single data point collected within an input step
- **Predicate** — serializable boolean expression for visibility/branching
- **Side effect** — async work triggered by step entry/completion
- **Lock** — a field that becomes read-only after a signing step is completed
- **Co-pilot mode** — dispatcher fills fields on behalf of carrier during a call
- **Outbox** — Postgres table holding events not yet published to RabbitMQ; ensures transactional atomicity of state + event emission
- **Pinning (schema)** — stamping a session with the schema version active at start time; subsequent schema updates do not affect in-flight sessions

## Appendix B: References

- ESIGN Act (15 U.S.C. § 7001) — federal electronic signature law
- UETA — Uniform Electronic Transactions Act, state-level adoption
- AGPLv3 — DocuSeal community edition license
- Outbox pattern — Chris Richardson, microservices.io

## Appendix C: Change log

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| v1 | May 2026 | Jr | Initial draft |
