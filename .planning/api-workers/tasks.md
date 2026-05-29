# API / Worker Role Split Tasks
_Last updated: 2026-05-29 03:40_
_Contract: none (no API-contract change)_
_Shared types: none_
_Plan: .planning/api-workers/plan.md · Patterns: .planning/api-workers/PATTERNS.md_

---

## US-01: Role-gated process bootstrap (api / worker / all)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo_

The core refactor: decouple subscriber/cron startup from module import and run the same image as `api`, `worker`, or `all`. Executed as one cohesive change so the system goes working → working (no broken intermediate where subscribers never start).

must_haves:
  truths:
    - "With ROLE=api, the process serves HTTP + /health and registers ZERO event-bus consumers and starts ZERO cron timers."
    - "With ROLE=worker, all 12 subscriber groups consume and all 4 crons (processedEventCleanup, invitationCleanup, settlementCronJob, signedAgreementWatchdog) are scheduled; a minimal /health server responds; no app routers are mounted."
    - "With ROLE=all (default), behavior is identical to the pre-change process — subscribers + crons + HTTP all run."
    - "Importing any feature router no longer registers a subscriber as a side effect (init only happens via startBackground)."
    - "A domain event published by an ROLE=api process is consumed by a ROLE=worker process end-to-end (single broker/topology)."
  artifacts:
    - path: src/worker.ts
      provides: "Worker entrypoint — boot redis+bus, startBackground, /health server, graceful shutdown."
    - path: src/startBackground.ts
      provides: "Aggregator that starts all 12 subscriber inits + all 4 crons and returns stop handles."
    - path: src/config/env.ts
      provides: "ROLE env (api|worker|all, default all)."
  key_links:
    - from: src/index.ts
      to: src/worker.ts / createApp
      via: "ROLE dispatch — selects api path, worker path, or both (all)"
    - from: src/startBackground.ts
      to: each module's exported initialize* / cron-start function
      via: "import + call (no module-load side effects)"
    - from: src/worker.ts
      to: src/startBackground.ts
      via: "import + call, retains returned stop handles for shutdown"

**Acceptance Criteria:**
- [ ] `ROLE` env added (api|worker|all, default all); invalid value fails fast at boot.
- [ ] `ROLE=api`: HTTP + /health served; zero consumers bound; zero crons scheduled.
- [ ] `ROLE=worker`: 12 subscriber groups + 4 crons running; /health responds; no app routes.
- [ ] `ROLE=all`: identical to current behavior.
- [ ] No subscriber/cron initializes from importing a router (decoupling verified).
- [ ] Event published by api-role flows to a worker-role consumer (bus reconciled).
- [ ] Graceful shutdown stops all 4 crons + `stopAgreements()` + `eventBus.close()` + `redisClient.quit()` in worker and all modes.

**Tasks:**
[ ] T-01 [SETUP] Add `ROLE` to env schema
         └─ Detail: Add `ROLE: 'api' | 'worker' | 'all'` (default `'all'`) to `src/config/env.ts`,
            validated like the existing enum-ish vars (FMCSA_PROVIDER/SIGNATURE_PROVIDER pattern).
            Fail fast on an invalid value.
         └─ Files: [src/config/env.ts]
         └─ Depends on: —
         └─ Output:

[ ] T-02 [INFRA] Decouple subscriber/cron init from module import (12 modules)
         └─ Detail: In each module index.ts, MOVE the top-level init/cron-start call into an
            exported function (no execution at import). Export names suggested per module:
            audit:initializeAuditSubscriber, notifications:initializeNotificationSubscriber,
            loads:initializeLoadsSubscriber, ratecon-imports:initializeRateconSubscriber,
            drivers:initializeDriversSubscribers, sms-prompts:initializeSmsPromptsSubscribers,
            invoices:initializeInvoiceSubscriber, ifta:initializeIftaSubscriber,
            settlements:startSettlements (subscriber + settlementCronJob),
            agreements:startAgreements (subscriber + watchdog; keep stopAgreements),
            carriers:initializeCarriersSubscriber, documents:startDocuments (both subscribers).
            Routers/controllers stay exported as before — ONLY the side-effect init moves.
         └─ Files: [src/audit/index.ts, src/notifications/index.ts, src/loads/index.ts, src/ratecon-imports/index.ts, src/drivers/index.ts, src/sms-prompts/index.ts, src/invoices/index.ts, src/ifta/index.ts, src/settlements/index.ts, src/agreements/index.ts, src/carriers/index.ts, src/documents/index.ts]
         └─ Depends on: —
         └─ Output:

[ ] T-03 [INFRA] Create `src/startBackground.ts` aggregator
         └─ Detail: New module exporting `startBackground(deps)` → calls all 12 exported inits
            (T-02) + starts the 2 index-level crons (processedEventCleanup, invitationCleanup)
            and returns an object of stop handles. Provide `startSubscribers(deps)` and
            `startCrons(deps)` internally. Accept the shared deps (prisma, eventBus, redis, logger).
            Analog: current wiring in src/index.ts:24-28 + the module index.ts patterns.
         └─ Files: [src/startBackground.ts]
         └─ Depends on: T-02
         └─ Output:

[ ] T-04 [INFRA] Create `src/worker.ts` entrypoint
         └─ Detail: Boot path for ROLE=worker: connect redis, construct the event bus (consumer+
            publisher), call `startBackground(deps)`, start a MINIMAL express app exposing only
            `/health` (reuse the health-check logic from app.ts:~99), register SIGTERM/SIGINT
            shutdown that stops all background handles + stopAgreements() + eventBus.close() +
            redisClient.quit(). Analog: src/index.ts:12-51.
         └─ Files: [src/worker.ts]
         └─ Depends on: T-03
         └─ Output:

[ ] T-05 [INFRA] Refactor `src/index.ts` into a role dispatcher + reconcile bus instance
         └─ Detail: Read `env.ROLE`. `api` → createApp + listen (publisher bus, NO startBackground).
            `worker` → delegate to worker.ts boot. `all` → do both in one process (current behavior:
            createApp + listen AND startBackground). Remove the direct cron starts at L24-28 (now
            owned by startBackground). RECONCILE the event bus: today index.ts builds a bus passed
            to createApp while subscribers use the sharedEventBus singleton — ensure api publishes
            and worker consumes on the SAME broker/topology (one construction path per role; verify
            against src/shared/messaging/sharedEventBus.ts).
         └─ Files: [src/index.ts]
         └─ Depends on: T-04
         └─ Output:

[ ] T-06 [INFRA] Clean `src/app.ts` — remove import-time init
         └─ Detail: Remove the side-effect imports at L31-34 (`./audit`, `./notifications`,
            `@/shared/fmcsa`). Verify mounting feature routers no longer transitively triggers any
            `initialize*Subscriber` (this is guaranteed once T-02 moves those out of module scope).
            Keep the `/health` route. createApp must be pure HTTP wiring with zero background side effects.
         └─ Files: [src/app.ts]
         └─ Depends on: T-02
         └─ Output:

---

## US-02: Decoupling guardrail + role-bootstrap test
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: todo | Depends on: US-01_

Lock the decoupling in place so it can't silently regress, and prove the role behavior.

must_haves:
  truths:
    - "dependency-cruiser fails the build if the api entrypoint or app.ts imports startBackground (or any module's subscriber/cron init aggregator)."
    - "An automated test asserts ROLE=api starts no subscribers/crons and ROLE=worker starts all of them."
  artifacts:
    - path: src/__tests__/integration/roleBootstrap.integration.test.ts
      provides: "Test proving per-role subscriber/cron registration."
  key_links:
    - from: .dependency-cruiser.cjs
      to: src/startBackground.ts
      via: "forbidden-dependency rule from app.ts/api entrypoint"

**Acceptance Criteria:**
- [ ] dependency-cruiser rule added and passing; a deliberate violating import would fail `lint:deps`.
- [ ] Role-bootstrap test passes: api → none, worker → all (use a fake/in-memory bus + spy on subscribe/cron-start).

**Tasks:**
[ ] T-07 [INFRA] Add dependency-cruiser forbidden rule
         └─ Detail: In `.dependency-cruiser.cjs`, add a rule (e.g. `no-background-in-api`) forbidding
            `src/app.ts` and the api boot path from importing `src/startBackground.ts` (and the module
            init aggregators). Mirror the existing rule shape (no-prisma-in-services etc.).
         └─ Files: [.dependency-cruiser.cjs]
         └─ Depends on: T-03
         └─ Output:

[ ] T-08 [TEST] Role-bootstrap integration test
         └─ Detail: New test at src/__tests__/integration/roleBootstrap.integration.test.ts. Use the
            in-memory event bus (src/shared/messaging/inMemoryEventBus.ts) + spies to assert: ROLE=api
            path registers 0 subscriptions and starts 0 crons; ROLE=worker path registers the expected
            subscriber groups and starts the 4 crons. Use fake timers for cron (per project rule — no
            NODE_ENV gating). Analog: src/carriers/services/__tests__/carrierSubscriber.test.ts.
         └─ Files: [src/__tests__/integration/roleBootstrap.integration.test.ts]
         └─ Depends on: T-04, T-05
         └─ Output:

---

## US-03: Split deploy services (api + worker)
_Priority: P0 | Services: dispatch-api (infra) | Agent: trivial | Status: todo | Depends on: US-01_

must_haves:
  truths:
    - "docker-compose-prod.yml defines distinct `api` and `worker` services from the same image; `api` has the HTTP/Traefik ingress and ROLE=api, `worker` has ROLE=worker, no public ingress, and its own /health healthcheck."

**Tasks:**
[ ] T-09 [INFRA] Add separate api + worker services to docker-compose-prod.yml
         └─ Detail: Duplicate the existing api service into `api` (ROLE=api, keep Traefik labels +
            3001 ingress + healthcheck on /api/health) and `worker` (ROLE=worker, same image/env,
            NO Traefik labels / no public port, healthcheck on the worker /health, deploy replicas=1).
            Both reference the same built image. Keep `all` as the implicit default for local/dev
            compose (do not change docker-compose.yml dev behavior).
         └─ Files: [docker-compose-prod.yml]
         └─ Depends on: T-04, T-05
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Agent: review | Depends on: US-01, US-02, US-03_

**Verification Checklist:**
- [ ] ROLE dispatch correct for all three modes (api / worker / all).
- [ ] No `initialize*Subscriber` / cron-start remains at module top-level in the 12 index.ts files.
- [ ] app.ts has no background side effects; routers don't transitively init.
- [ ] Bus instance reconciled — publish path (api) and consume path (worker) share broker/topology.
- [ ] Shutdown stops all 4 crons + bus + redis in worker/all.
- [ ] Every US-01/US-02/US-03 AC satisfied.

**Tasks:**
[ ] T-10 [VERIFY] Trace role behavior and check all ACs
         └─ Detail: Read env.ts, index.ts, worker.ts, startBackground.ts, app.ts, the 12 module
            index.ts, .dependency-cruiser.cjs, the role-bootstrap test, and docker-compose-prod.yml.
            Confirm each must_haves truth across stories. Confirm no import-time subscriber init
            remains. Report any gaps as findings.
         └─ Files: []
         └─ Depends on: T-07, T-08, T-09
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 6     | 0    | 0       | 0/7    |
| US-02 | 2     | 0    | 0       | 0/2    |
| US-03 | 1     | 0    | 0       | —      |
| VER-01| 1     | 0    | 0       | —      |
| **All** | **10** | **0** | **0** | **0/9** |
