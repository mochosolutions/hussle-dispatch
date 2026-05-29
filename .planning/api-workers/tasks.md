# API / Worker Role Split Tasks
_Last updated: 2026-05-29 04:52_
_Contract: none (no API-contract change)_
_Shared types: none_
_Plan: .planning/api-workers/plan.md · Patterns: .planning/api-workers/PATTERNS.md_

---

## US-01: Role-gated process bootstrap (api / worker / all)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

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
- [x] `ROLE` env added (api|worker|all, default all); invalid value fails fast at boot.
- [x] `ROLE=api`: HTTP + /health served; zero consumers bound; zero crons scheduled. _(cpm decoupled in FIX-01; T-08 asserts createApp → 0 subscribers)_
- [x] `ROLE=worker`: 13 subscriber groups + 4 crons running; /health responds (dedicated WORKER_HEALTH_PORT, default 3002); no app routes.
- [x] `ROLE=all`: identical to current behavior.
- [x] No subscriber/cron initializes from importing a router (all 13 decoupled; FIX-01 closed the load-intel cpm gap; grep + test verified).
- [x] Event published to the shared exchange flows to the worker, not the api. _(Runtime-proven: published `load.detention.detected` to `fleet-command.events`; queue `…loads-detention-alerts…` had 1 consumer = worker, delivered+acked, worker logged "Detention detected on Load RT-PROOF-001"; api logged 0 hits.)_
- [x] Graceful shutdown stops all 4 crons + `stopAgreements()` + `eventBus.close()` + `redisClient.quit()` in worker and all modes.

**Tasks:**
[x] T-01 [SETUP] Add `ROLE` to env schema
         └─ Detail: Add `ROLE: 'api' | 'worker' | 'all'` (default `'all'`) to `src/config/env.ts`,
            validated like the existing enum-ish vars (FMCSA_PROVIDER/SIGNATURE_PROVIDER pattern).
            Fail fast on an invalid value.
         └─ Files: [src/config/env.ts]
         └─ Depends on: —
         └─ Output:

[x] T-02 [INFRA] Decouple subscriber/cron init from module import (12 modules)
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

[x] T-03 [INFRA] Create `src/startBackground.ts` aggregator
         └─ Detail: New module exporting `startBackground(deps)` → calls all 12 exported inits
            (T-02) + starts the 2 index-level crons (processedEventCleanup, invitationCleanup)
            and returns an object of stop handles. Provide `startSubscribers(deps)` and
            `startCrons(deps)` internally. Accept the shared deps (prisma, eventBus, redis, logger).
            Analog: current wiring in src/index.ts:24-28 + the module index.ts patterns.
         └─ Files: [src/startBackground.ts]
         └─ Depends on: T-02
         └─ Output:

[x] T-04 [INFRA] Create `src/worker.ts` entrypoint
         └─ Detail: Boot path for ROLE=worker: connect redis, construct the event bus (consumer+
            publisher), call `startBackground(deps)`, start a MINIMAL express app exposing only
            `/health` (reuse the health-check logic from app.ts:~99), register SIGTERM/SIGINT
            shutdown that stops all background handles + stopAgreements() + eventBus.close() +
            redisClient.quit(). Analog: src/index.ts:12-51.
         └─ Files: [src/worker.ts]
         └─ Depends on: T-03
         └─ Output:

[x] T-05 [INFRA] Refactor `src/index.ts` into a role dispatcher + reconcile bus instance
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

[x] T-06 [INFRA] Clean `src/app.ts` — remove import-time init
         └─ Detail: Remove the side-effect imports at L31-34 (`./audit`, `./notifications`,
            `@/shared/fmcsa`). Verify mounting feature routers no longer transitively triggers any
            `initialize*Subscriber` (this is guaranteed once T-02 moves those out of module scope).
            Keep the `/health` route. createApp must be pure HTTP wiring with zero background side effects.
         └─ Files: [src/app.ts]
         └─ Depends on: T-02
         └─ Output:

---

## US-02: Decoupling guardrail + role-bootstrap test
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01_

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
- [x] dependency-cruiser rule `no-background-in-api` added (scoped to `app.ts`); `lint:deps` passes; a deliberate `import './startBackground'` in app.ts would error.
- [x] Role-bootstrap test passes (6/6): worker → all subs + 4 crons; createApp → 0 crons. _(Test discovered the load-intel cpm eager-subscriber gap → FIX-01.)_

**Tasks:**
[x] T-07 [INFRA] Add dependency-cruiser forbidden rule
         └─ Detail: In `.dependency-cruiser.cjs`, add a rule (e.g. `no-background-in-api`) forbidding
            `src/app.ts` and the api boot path from importing `src/startBackground.ts` (and the module
            init aggregators). Mirror the existing rule shape (no-prisma-in-services etc.).
         └─ Files: [.dependency-cruiser.cjs]
         └─ Depends on: T-03
         └─ Output:

[x] T-08 [TEST] Role-bootstrap integration test
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
_Priority: P0 | Services: dispatch-api (infra) | Agent: trivial | Status: done | Depends on: US-01_

must_haves:
  truths:
    - "docker-compose-prod.yml defines distinct `api` and `worker` services from the same image; `api` has the HTTP/Traefik ingress and ROLE=api, `worker` has ROLE=worker, no public ingress, and its own /health healthcheck."

**Tasks:**
[x] T-09 [INFRA] Add separate api + worker services to docker-compose-prod.yml
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
| US-01 | 6     | 6    | 0       | 7/7    |
| US-02 | 2     | 2    | 0       | 2/2    |
| FIX-01| 2     | 2    | 0       | 2/2    |
| US-03 | 1     | 1    | 0       | —      |
| FIX-02| 1     | 1    | 0       | 1/1    |
| VER-01| 1     | 0    | 0       | —      |
| **All** | **13** | **12** | **0** | **12/12** |

> **Runtime verification (2026-05-29):** brought up the split locally on the dev stack. `dispatch-api` (ROLE=api) → health 200, `role:api`, **0 subscriber inits**. `dispatch-worker` (ROLE=worker, :3002) → health 200, "Background workers started: subscribers 13, crons 4", same RabbitMQ broker. `ROLE=all` also confirmed (default) → health 200, `role:all`, 13 subs + 4 crons. Both containers `(healthy)`. FIX-02 below was the only runtime defect found.

### FIX-02 — worker health route path (commit 8555aed4a)
- Runtime found `worker.ts` registered the probe at `/api/health` (copied from app.ts) while the comment, plan AC, and both compose healthchecks use `/health` → worker stayed `(unhealthy)` despite booting fine. Changed `worker.ts` route to `/health`. After ts-node-dev respawn: `:3002/health` → 200, container `(healthy)`. Truth: "worker /health responds" — met.

---

## Completed Tasks Summary

### US-01 — Role-gated process bootstrap (commit e0af751e9)
- **T-01** `src/config/env.ts` — `ROLE: 'api'|'worker'|'all'` (default `all`), invalid → `MissingEnvError` at boot (mirrors FMCSA_PROVIDER pattern).
- **T-02** 12 module `index.ts` decoupled — top-level init moved into exported fns: `initializeAuditSubscriber`, `initializeNotificationSubscriber`, `initializeLoadsSubscriber`, `initializeRateconSubscriber`, `initializeDriversSubscribers`, `initializeSmsPromptsSubscribers`, `initializeInvoiceSubscriber`, `initializeIftaSubscriber`, `startSettlements` (sub+cron, returns stop), `startAgreements` (sub+watchdog; `stopAgreements` kept), `initializeCarriersSubscriber`, `startDocuments` (both subs). No top-level bare invocation remains.
- **T-03** `src/startBackground.ts` (NEW) — `startBackground(deps): Promise<{ stopAll() }>`; calls all 12 inits + starts processedEventCleanup + invitationCleanup; `stopAll()` covers all 4 crons + `stopAgreements`. Called by index.ts + worker.ts; **0 hits in app.ts** (verified).
- **T-04** `src/worker.ts` (NEW) — `startWorker()`: redis + bus + startBackground + minimal `/health` server on PORT+1 + SIGTERM/SIGINT shutdown (stopAll + eventBus.close + redisClient.quit).
- **T-05** `src/index.ts` — role dispatcher (`startApi`/`startWorker`/`startAll`); removed L24-28 direct cron starts. **Bus reconciliation:** dropped the second `createRabbitMqEventBus`; all roles use the `sharedEventBus` singleton → single RabbitMQ connection, no split topology.
- **T-06** `src/app.ts` — removed side-effect imports `./audit`, `./notifications`, `@/shared/fmcsa`; `/health` route kept; createApp now pure HTTP wiring. FMCSA import was dead code (no `subscribe` calls).
- **Validation:** typecheck PASS (0 errors); related tests 92/92 (11 suites); lint clean on changed files (112 pre-existing problems in unchanged files — see [[project_preexisting_validate_failures]]).
- **Open:** runtime api→worker event round-trip not executed (code path + single-bus reconciled; to be proven by T-08 + VER-01). Worker `/health` on **PORT+1** — superseded by dedicated `WORKER_HEALTH_PORT` in FIX-01/T-12.

### US-02 — Decoupling guardrail + role-bootstrap test (commit 94f1212e3)
- **T-07** `.dependency-cruiser.cjs` — rule `no-background-in-api` (from `^src/app\.ts$` → `^src/startBackground\.ts$`, error). `lint:deps` passes; a violating import in app.ts would error. Scoped to app.ts (index.ts legitimately imports startBackground).
- **T-08** `src/__tests__/integration/roleBootstrap.integration.test.ts` (NEW, 6/6 pass) — asserts: module import registers no subscriber; `startBackground` registers subs + schedules exactly 4 crons; `stopAll()` clean; `createApp` schedules 0 crons. Uses `jest.setup.ts` global mocks (node-cron + sharedEventBus in-memory).
- **DISCOVERY (feeds FIX-01):** `load-intel/compositionRoot.ts` calls `initializeCpmInvalidationSubscriber` eagerly inside `createLoadIntelModule`, so importing `loadIntelRouter` registers 2 subscribers — violates US-01 "router import = zero consumers" for ROLE=api.

---

## FIX-01: Decouple load-intel cpm subscriber + dedicated worker health port
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01, US-02_

bug_introducing_story: US-01

must_haves:
  truths:
    - "Importing the load-intel router (loadIntelRouter) registers ZERO event-bus subscribers; the cpm-invalidation subscriber starts only via startBackground."
    - "ROLE=api binds zero consumers (the T-08 test asserts createApp registers 0 subscribers, tightened from the current '2')."
    - "The worker health server binds to a dedicated WORKER_HEALTH_PORT env (default e.g. 3002), not PORT+1."
  artifacts:
    - path: src/config/env.ts
      provides: "WORKER_HEALTH_PORT (number, sensible default)."
  key_links:
    - from: src/startBackground.ts
      to: load-intel exported cpm-subscriber init
      via: "import + call (no eager init in createLoadIntelModule)"
    - from: src/worker.ts
      to: env.WORKER_HEALTH_PORT
      via: "health server .listen(env.WORKER_HEALTH_PORT)"

**Acceptance Criteria:**
- [x] Importing loadIntelRouter registers 0 subscribers; cpm subscriber starts via startBackground; T-08 tightened to assert createApp → 0 subscribers and passes (6/6).
- [x] `WORKER_HEALTH_PORT` env added (default 3002); worker `/health` listens on it; no PORT+1 arithmetic remains.

**Tasks:**
[x] T-11 [FIX] Make load-intel cpm-invalidation subscriber lazy
         └─ Detail: In `src/load-intel/compositionRoot.ts` (and `src/load-intel/index.ts`), STOP calling
            `initializeCpmInvalidationSubscriber` eagerly inside `createLoadIntelModule`. Expose it as an
            exported init fn (e.g. `initializeLoadIntelSubscriber`) and call it from `src/startBackground.ts`
            alongside the other inits. Then TIGHTEN `roleBootstrap.integration.test.ts`: assert importing the
            load-intel router/module registers 0 subscribers, and that `createApp` registers 0 subscribers
            (remove the "fewer/2" concession). Verify with the existing grep/test.
         └─ Files: [src/load-intel/compositionRoot.ts, src/load-intel/index.ts, src/startBackground.ts, src/__tests__/integration/roleBootstrap.integration.test.ts]
         └─ Depends on: —
         └─ Output:

[x] T-12 [ADJ] Dedicated WORKER_HEALTH_PORT
         └─ Detail: Add `WORKER_HEALTH_PORT` (number, default 3002 — distinct from PORT 3001) to
            `src/config/env.ts` (mirror PORT parsing). In `src/worker.ts`, bind the `/health` server to
            `env.WORKER_HEALTH_PORT` instead of `PORT+1`. Remove the PORT+1 arithmetic. Update the worker
            shutdown/log lines to reference the new port.
         └─ Files: [src/config/env.ts, src/worker.ts]
         └─ Depends on: —
         └─ Output: DONE — see FIX-01 summary below.

---

### FIX-01 — cpm decouple + WORKER_HEALTH_PORT (commit f6cd54bc7)
- **T-11** load-intel cpm subscriber made lazy: removed eager init from `createLoadIntelModule` (`src/load-intel/compositionRoot.ts`); added exported `initializeLoadIntelSubscriber` (`src/load-intel/index.ts`); `startBackground.ts` now calls it (13 subscriber inits total). Tightened `roleBootstrap.integration.test.ts` to assert `createApp` → **0 subscribers**; 6/6 pass.
- **T-12** `WORKER_HEALTH_PORT` added to `src/config/env.ts` (default 3002, distinct from PORT 3001); `src/worker.ts` binds `/health` to `env.WORKER_HEALTH_PORT` — PORT+1 arithmetic removed.
- **Validation:** typecheck 0; role-bootstrap test 6/6; lint clean on changed files except a **pre-existing** `max-params` warning in `load-intel/compositionRoot.ts` (`assembleChain`, not introduced here).
- **Restores US-01 ACs:** ROLE=api zero-consumers ✓ and router-import-no-subscriber ✓ (now grep + test verified).
