# Deployment & Scaling Architecture

> Status: **Design / decision record** — captures the senior-architect direction agreed for taking FleetCommand from the current Dokploy/Hetzner setup to a production-sturdy, horizontally scalable, cloud-portable deployment.
> Author context: solo engineer, dev-mode (no production carriers yet), top priority for the near term.
> Last updated: 2026-05-29.
>
> Covers two distinct workloads: the **control plane** (the dispatch app) and a planned **telemetry plane** (real-time IoT data — truck GPS, trailer, reefer temps — via telematics-platform integration). See §3.5.

---

## 1. Context

FleetCommand is a carrier/fleet dispatch platform: an Express + Prisma modular monolith (`hussle-app-dispatch-api`), a React 18 + Vite SPA (`hussle-app-dispatch-ui`), and a FastAPI rate-confirmation extractor (`hussle-app-dispatch-py`). Today it deploys to a **Hetzner VPS via Dokploy + Traefik** with self-hosted Postgres, Redis, and a custom RabbitMQ image (delayed-message-exchange plugin baked in). CI already pushes images to AWS ECR.

This document records the target architecture and the staged path to get there. It exists because we need to:

- **Not get crushed by load.** Reach a point where we can deploy safely, securely, and modularly, and scale up/down on demand. Current scale is modest (~100 carriers, a handful of users); the target is to **manage ~1000 carriers** and to add **real-time IoT telemetry** (truck GPS, trailer, reefer temperature).
- **Stay portable.** Be able to switch cloud providers and eventually self-host. Avoid lock-in in the hot path.
- **Harden for production** without prematurely adopting Kubernetes.

### Decisions locked in this document

1. **Orchestration:** stay on **Dokploy + Docker Swarm (container-on-VM)** now; graduate to Kubernetes later. No k8s today.
2. **Architecture philosophy:** **container-first + portable backing services**. Managed services are consumed *through seams* (connection strings / port interfaces), never as proprietary hot-path primitives.
3. **Keep RabbitMQ self-hosted.** Do not migrate the event bus to SQS/SNS (that was an AWS-lock-in path; rejected once portability became a hard goal).
4. **Move SMS-prompt delay timing from the RabbitMQ delayed-message plugin to a Postgres-backed poll.** This is the single highest-value change — it makes the only delay-sensitive feature durable + HA and removes our worst lock-in constraint.
5. **Managed Postgres is the headline production-sturdiness upgrade**, adopted through `DATABASE_URL` so the app stays on Dokploy.
6. **WebSockets:** container-hosted `socket.io` gateway + Redis pub/sub backplane (portable), reusing existing cookie/CSRF auth. Not API Gateway WebSockets.
7. **Marketing site (future Next.js):** a separate, independently deployed product — shares nothing with the dispatch app.
8. **IoT telemetry via platform integration, not own hardware.** Ingest from the telematics platforms carriers already run (Samsara / Geotab / Motive / Platform Science / Omnitracs for trucks-ELD; Thermo King / Carrier for reefer; Samsara / Skybitz / Spireon for trailers) via their APIs/webhooks. **No MQTT broker, no AWS IoT Core, no device fleet to manage.** This keeps the telemetry plane portable and on the existing stack (HTTP ingestion + RabbitMQ + Timescale/Postgres + Redis + WebSocket).

---

## 2. Scale reality check (this disciplines every decision)

The two planes scale very differently, and conflating them is the main trap:

- **Control plane (dispatch app):** even at **1000 carriers**, this is hundreds of concurrent users and thousands of loads/day — *transactionally* small. Postgres is lightly loaded. Scaling it is mostly **app-level hygiene** (pagination, data-scoping, dashboard caching, log retention — see §8 and the CONCERNS.md `CRIT-*` items), **not** an infrastructure problem. Moving it to AWS buys nothing those fixes don't.
- **Telemetry plane (IoT):** this is the high-volume part. ~1000 carriers × a few thousand assets × a GPS ping every 10–30s ≈ **hundreds of points/sec, tens of millions/day** — plus lower-frequency but compliance-critical reefer readings. This is a *streaming + time-series* workload and must NOT run through the dispatch app's Express→Prisma→Postgres path.

Consequence: **serverless fan-out tooling (Lambda / SQS / SNS / API-Gateway / DynamoDB) is still the wrong tool** — it solves internet-scale, spiky, scale-to-zero workloads at the cost of maximum lock-in, the opposite of our portability goal. The telemetry plane is high-*throughput* but predictable and steady, which a purpose-built time-series path on portable open-source tech (Timescale/PostGIS + a stream) handles cleanly. We architect for **clean horizontal scalability** (stateless, port-abstracted, orchestrator-swappable), not for traffic we don't have.

---

## 3. What's already right (do not throw away)

The codebase is already well-positioned for a portable architecture:

- **12-factor containers** — `Dockerfile.prod` for API and UI; all config via `src/config/env.ts`.
- **Portable backing services** — Postgres, Redis, RabbitMQ. All open-source, all run on any cloud or on-prem. Nothing in the hot path depends on a proprietary cloud primitive.
- **Clean abstraction seams** — the `EventBus` port (`src/shared/messaging/eventBus.ts`), the `STORAGE_BACKEND` switch (local/s3), the `SMS_BACKEND` switch (console/twilio), repo ports, per-module composition roots.
- **IaC in reusable modules** — `mocho-infra-modules/` already contains both a `hcloud_vps` (Hetzner) module and AWS modules (`ecr`, `s3-uploads`, `s3-static-assets`, `iam-runtime-user`).

**Existing lock-in is narrow and at the edges:** Cognito (auth), SES (email), S3 (file storage), Location API. Each sits behind a seam or is trivially swappable (SES → any SMTP, S3 → MinIO/R2). **Cognito is the stickiest** — flagged in §9.

---

## 3.5. Two planes: control vs telemetry

The single most important architectural decision once IoT enters the picture is to **keep the two workloads separate**. They have opposite characteristics and must not share a write path.

| | **Control plane** (dispatch app) | **Telemetry plane** (IoT) |
|---|---|---|
| Traffic shape | Transactional CRUD + domain events | High-throughput streaming |
| Volume @ 1000 carriers | Hundreds of users, thousands of loads/day | Hundreds of points/sec, tens of millions/day |
| Storage | Relational, mutable rows (Postgres) | Append-only time-series + geospatial (Timescale/PostGIS) |
| Consistency | Strong (money, state machine) | Eventual, lossy-tolerant (except reefer compliance) |
| Right tool | Express + Prisma + RabbitMQ (existing) | Provider adapters + stream + time-series + WebSocket |
| Hosting | Portable containers + managed Postgres | Portable containers + Timescale (no IoT Core / hardware) |

The planes meet only at well-defined seams: telemetry **publishes domain events** onto the existing RabbitMQ bus (e.g. `reefer.excursion.detected`, `asset.geofence.arrived`), which the control plane and the WebSocket gateway consume — exactly the pattern the existing `load.detention.detected` event already uses.

### Why the current location subsystem does NOT become the telemetry plane

Verified in the code review — today's tracking is **manual check-call only**, built for occasional human input, not device streams:

- **One overwrite row, no history:** `Driver.currentLatitude/currentLongitude/lastLocationAt` (`prisma/schema.prisma`). Each update overwrites the last. No time-series, no PostGIS `POINT`, no spatial index.
- **Full transactional write per point:** `POST → loadController → loadService → prisma.checkCall.create()`, then async `checkCallLocationSubscriber → prisma.driver.update()` — one Postgres transaction per location, no batching, no Redis hot-cache.
- **No real-time to UI:** `CommandCenterMap.tsx` renders markers from a Redux entity slice populated by on-demand fetches.
- **No device layer:** zero `mqtt`/`iot`/`device`/`telemetry`/`geofence` in the codebase; tracking tokens are *load-scoped*, not device/asset identities.

The telemetry plane is **net-new** and built alongside this — the check-call path stays for manual/human status, while automated arrival detection (geofence) can eventually supersede it.

---

## 3.6. Telemetry plane design (IoT via telematics integration)

**Decision (locked, §8 above):** integrate with the telematics platforms carriers already run — **do not** deploy hardware or run an MQTT broker / AWS IoT Core. Data sources: truck GPS + engine/HOS, trailer (location/door/motion), reefer (supply/return temp per zone, setpoint, fuel, alarms).

### Pipeline

```
[Samsara/Geotab/Motive/Platform Science]  --webhook/poll-->  ┐
[Thermo King / Carrier reefer telematics]  --API--------->   │  provider adapter
[Samsara/Skybitz/Spireon trailer]          --webhook/poll->  ┘  (normalize → canonical)
                                                                  │
                          ┌───────────────────────────────────────┼──────────────────────────────┐
                          ▼                                        ▼                              ▼
                 TimescaleDB + PostGIS                      Redis (last-known                RabbitMQ events:
                 (history + reefer compliance)              per asset, live map)             reefer.excursion.detected
                          │                                        │                          asset.geofence.arrived
                          │                                        │                          hos.violation / fault.code
                          └──────────────► cold archive S3/R2      └──► WebSocket gateway ◄────────────┘
                                           (cold-chain retention)        (org-scoped push to dispatcher maps)
                                                                         + existing notifications module
```

### Components

- **Provider adapters** — one normalizing adapter per platform. Two ingestion modes, both on the existing stack:
  - **Webhooks** — HTTP receivers (Express routes, like the existing ratecon webhook) for push-capable providers. Auth via provider-signed secrets.
  - **Polling** — scheduled clients (worker crons) for providers without webhooks, or for backfill.
  Each adapter maps the provider payload to a **canonical telemetry event** and publishes it; the rest of the pipeline is provider-agnostic.
- **Canonical telemetry model** — `(assetId, deviceType, metric, value, unit, occurredAt, lat?, lng?)`. Heterogeneous metrics (temp zones, speed, door state, fuel, fault codes) fit a typed metric shape.
- **TimescaleDB + PostGIS** — the standout call. It is a **Postgres extension**, so it keeps our Postgres skills, Prisma-style access, and portability while adding hypertables (time-series), compression/retention policies, and geospatial queries (geofences, "assets within radius"). Can run as a separate Timescale instance or as extensions on the managed Postgres if the provider supports them.
- **Redis hot state** — last-known reading per asset, for instant live-map reads without hitting the history store.
- **Event bus integration** — the ingest/rules step evaluates each reading and publishes domain events onto the existing RabbitMQ bus:
  - **Reefer excursion** — compare actual vs the **setpoint/allowed range derived from the load's commodity** → `reefer.excursion.detected` → existing notifications (dispatcher/driver/customer) + WebSocket. Mirrors the existing `load.detention.detected` pattern.
  - **Geofence arrival/departure** → `asset.geofence.arrived` → can auto-create the "arrived at pickup/delivery" status, superseding manual check-calls.
  - **HOS / fault codes** → alerts as needed.
- **WebSocket fan-out** — the gateway (§7) relays org-scoped live positions/temps to dispatcher maps. The map UI (`CommandCenterMap.tsx`) switches from fetch-on-load to live updates.

### Domain model additions

- **Asset / Device entity** + **device → asset → load association** (which trailer/reefer is on which load *now*) — required to attach telemetry to a shipment and to source reefer thresholds from the load's commodity. The existing Vehicle/Driver/Load models gain a telemetry-bearing asset layer.
- **Reefer compliance trail** — temperature history is a legal proof-of-condition record (FSMA / cold-chain). Durable time-series + cold archive (S3/R2) with multi-year retention; integrity matters more than for GPS.

### Hosting implication

Because ingestion is HTTP + polling (not raw devices), the telemetry plane needs **no new proprietary infrastructure**: provider-adapter services + Timescale + Redis + the WebSocket gateway, all portable containers on the same Dokploy/Swarm model. **AWS IoT Core stays off the table** unless the strategy ever changes to owning hardware. The real cost is *integration breadth* (one adapter per provider) and *domain logic* (excursion/compliance/geofencing), not infrastructure.

---

## 4. Target service topology

A small set of independently deployable, independently scalable containers. This *is* the "modular so I can scale up and down" requirement.

| Service | Replicas | Scaling driver | Notes |
|---|---|---|---|
| **api** | 2–3 | HTTP traffic | Stateless, behind Traefik. HTTP only — runs no subscribers/crons. |
| **worker** | 1 → N | event volume | Subscribers + crons. Count 1 until crons are leader-elected (then N). Isolates the Chromium/PDF memory profile from HTTP. |
| **ws-gateway** | 2 | connection count | `socket.io` + Redis adapter. May start *inside* `api`, split out later. |
| **ratecon-py** | 1–2 | extraction queue | FastAPI + Claude PDF extractor. Internal-only; worker calls it over the network. Needs a `Dockerfile.prod` (only `Dockerfile.dev` exists today). |
| **ui** | — | (CDN) | Static Vite bundle on a CDN, not on Swarm. |
| **marketing** | — | (separate) | Future Next.js site; own domain, own deploy. |
| **telemetry-ingest** | 1 → N | telemetry throughput | Provider adapters (webhook receivers + polling) + normalize → canonical events + rules. Telemetry plane (§3.6). Stateless; scales with point volume. |

**Backing services** (portable, consumed through seams):

| Service | Posture | Rationale |
|---|---|---|
| **Postgres** | **Managed**, off-cluster, + PgBouncer | The durability anchor (control plane). Managed PG removes the hardest stateful-HA problem. |
| **TimescaleDB + PostGIS** | Self-hosted or Timescale-managed | Telemetry time-series + geospatial + reefer compliance history. Postgres extension → portable, familiar. |
| **Redis** | Self-hosted now (pinned), managed later | Cache + WebSocket backplane (§7) + telemetry last-known-per-asset hot state. Replicate when WS/telemetry lands. |
| **RabbitMQ** | Self-hosted, single durable node now | Event bus (both planes). Cluster only when delivery-availability is a hard requirement (§6). |
| **Object storage** | S3 / R2 / MinIO via `STORAGE_BACKEND` | File uploads + cold-chain telemetry archive. Must never touch local disk (multi-node requirement). |

### The one mandatory code change: split API from worker

Today subscribers + crons run **inside the HTTP process** (side-effect imports in `src/app.ts`; each module's `index.ts` calls `initialize*Subscriber`). This is the keystone refactor for everything else:

- Extract subscriber/cron startup out of `app.ts` into a new **`src/worker.ts`** entrypoint.
- Gate by a `ROLE` env var: same image runs as `api` (HTTP, no subscribers) or `worker` (subscribers + crons, no `listen`).
- Add a dependency-cruiser rule so the API entrypoint cannot import subscriber side-effect modules (prevents accidental double-running).

Why it matters on *any* platform: HTTP stays responsive regardless of how backed-up Puppeteer PDF generation or Python extraction gets; the two tiers scale independently; crons stop double-firing when `api` scales past one replica.

---

## 5. Orchestration: how multi-node Dokploy/Swarm works in practice

### The cluster is just VMs joined into one Swarm

- **Manager node(s)** run the orchestration brain (Raft state + scheduler), Dokploy's control plane, and Traefik (ingress + TLS). One manager works to start; **3 managers** for true HA (Raft majority survives one loss).
- **Worker nodes** just run containers. Add more = more capacity.

### Stateless replicas — the easy 80%

For `api`, `worker`, `ws-gateway`, `ui` (all stateless), set a replica count and Swarm handles the rest:

```yaml
api:
  image: fleet-api:latest
  deploy:
    replicas: 3
    update_config: { parallelism: 1, delay: 10s, order: start-first }  # rolling, zero-downtime
    restart_policy: { condition: on-failure }
```

- Swarm spreads replicas across nodes; **Traefik discovers all of them and load-balances** — no per-replica wiring.
- **Scale up/down** = change the number (Dokploy UI or `docker service scale api=5`). Add a node and the scheduler uses it.
- **Rolling deploys** replace one replica at a time, gated on `/health`, with auto-rollback on a bad image → zero-downtime.
- **Node failure:** Swarm reschedules the dead node's replicas onto healthy nodes; Traefik stops routing to dead ones. Run ≥2 replicas across ≥2 nodes so a loss degrades instead of killing — *requires spare capacity on survivors*.

### Stateful services do NOT work this way (the catch)

`replicas: 3` on Postgres/RabbitMQ/Redis gives three **independent, conflicting** copies, not a cluster — Swarm replicates containers, not data. Stateful services need either:

1. **Pinned single instance** — `placement.constraints` to one labeled node + a persistent volume. Reliable, but **not HA** (node dies → down until restored).
2. **Real clustering** — replication you operate yourself (Postgres/Patroni, RabbitMQ quorum, Redis Sentinel). Hard; mostly not worth it for a solo dev.

This is exactly why Postgres goes **managed** — it removes the single hardest multi-node problem.

### Two more gotchas

- **No shared filesystem across nodes.** A rescheduled container loses its local volume. Stateless services must treat local disk as throwaway — file uploads go to object storage (`STORAGE_BACKEND=s3`), never local disk.
- **WebSockets need the Redis backplane, not sticky sessions** (see §7).

### Honest flag

Docker Swarm is stable but in maintenance mode; industry momentum is Kubernetes. That's fine for the "Dokploy now → k8s later" plan: because the app is already 12-factor containers, the eventual k8s move is a deployment-layer change, not an app rewrite. **Do not** sink effort into hand-built Swarm-based Postgres/RabbitMQ clustering — that effort doesn't transfer. Lean on managed Postgres; keep clustering complexity out of your hands.

---

## 6. Messaging & the SMS-timing decision

### Keep RabbitMQ; the `EventBus` port is the seam

Every subscriber receives `eventBus` via DI and calls only `subscribe` / `publish` / `publishDelayed`. Nothing outside `rabbitMqEventBus.ts` touches `amqplib`. This means the broker is swappable later with zero subscriber changes — but for now we **keep RabbitMQ** because it runs anywhere (no lock-in) and preserves our durable topic exchange + per-group durable queues + custom retry/dedup/idempotency-inbox semantics 1:1.

### The delayed-plugin problem

`publishDelayed` **throws** if the `rabbitmq_delayed_message_exchange` plugin is absent — no fallback. The SMS prompt pipeline hard-depends on it (delays up to 48h). Two consequences:

- It blocks any managed broker (Amazon MQ forbids custom plugins) — a portability constraint.
- **The plugin is not cluster-replicated.** Delayed messages live in a node-local store; if that node dies before the delay elapses, those scheduled messages are **lost** and do not fail over — *even in a fully quorum-clustered RabbitMQ*. So clustering would give a false sense of safety on the exact feature we'd most want protected.

### Decision: move the *timing* to Postgres

We already persist the durable intent: the scheduler writes `SmsPromptSchedule` (PENDING) rows **and** fires a `publishDelayed` timer. Only the timer lives in the fragile delayed exchange. Replace it:

- A lightweight cron on the `worker` (~every 1 min) queries `SmsPromptSchedule WHERE status = PENDING AND dueAt <= now()` and publishes a **normal** (non-delayed) `sms.prompt.due` per row.
- The existing `smsPromptWorker` PENDING→SENT state guard already makes this idempotent — re-polling a mid-send row is harmless.

Wins:

1. The delay is now durable on **managed Postgres** (our HA anchor) — survives any RabbitMQ node loss; no dropped prompts.
2. **Deletes the delayed-message-plugin dependency entirely** — removes the portability constraint that blocked managed brokers.
3. RabbitMQ reverts to a plain durable event bus — simpler to run, cluster, or replace.

Cost: sub-second precision → ~1-minute granularity. Fine for SMS check-in prompts.

Touch points: `src/sms-prompts/services/smsPromptSchedulerSubscriber.ts` (stop calling `publishDelayed`, rely on the durable row), a new due-poll cron, and the `sms.prompt.canceled` path becomes a row status update.

### RabbitMQ HA posture (right-sized)

At 100 trucks a cluster is likely premature. Events are already **durable** (persistent messages, durable queues) and consumers **auto-reconnect** (`scheduleReconnect` in the bus). So:

1. **Now:** single durable RabbitMQ node, persistent volume, backups, fast restart. A restart = short blip, not data loss.
2. **Later, only if delivery-availability becomes a hard requirement:** stand up a **3-node quorum-queue cluster** (odd count for Raft majority; `cluster_partition_handling = pause_minority` to avoid split-brain; each node pinned to its own labeled VM + volume; clients fronted by a TCP load balancer). With the delayed plugin already gone, this is clean to stand up — or you can point at a managed broker and skip operating it.

---

## 7. Real-time status (WebSockets)

**Approach: container-hosted `socket.io` gateway + Redis pub/sub backplane.** Reinforced by the portability goal — runs anywhere, reuses existing infra, no proprietary primitives. (API Gateway WebSockets would be lock-in and would force rebuilding the cookie-auth handshake — rejected.)

- **Auth handshake:** on WS upgrade, reuse the existing cookie → JWT verification (`csrfProtection.ts` / `authenticateUser`). Reject the upgrade on failure. On success, `socket.data = { userId, organizationId }` and `socket.join('org:' + organizationId)`.
- **Org-scoping (security invariant):** the room name is **derived from the verified session, never from client input**. The gateway is just another `EventBus` subscriber (queue group `ws-gateway`) that relays each event only to `io.to('org:' + event.organizationId)`. Every event payload already carries `organizationId`.
- **Multi-node correctness:** with multiple `ws-gateway` replicas, a client's socket lives on one replica while events may be handled on another. The **socket.io Redis adapter** fans out so the event reaches whichever replica owns the connection. This is why the Redis backplane is mandatory once multi-node — not sticky sessions.
- **UI consumption:** a single root saga opens the socket and dispatches incoming events into the **existing** entity slices (no new state shape). Migration is incremental per the project's "empty pipe first" philosophy: land the gateway relaying one harmless event → adopt per feature (ratecon imports first, replacing the 10s poll in `features/ratecon-imports/store/sagas/`; then SMS history 30s poll; then invoices/settlements/agreements get live updates for free). Keep polling as a slow fallback; on reconnect, fire one REST refetch to resync, then remove polling per feature once proven.

---

## 8. Capacity & High Availability

"HA" here means removing single points of failure, not exotic topology:

- **App tier:** stateless `api`/`worker`/`ws-gateway`, ≥2 replicas across ≥2 nodes. Already stateless (tokens in cookies, no in-process session). Crons need **leader-election** (a Redis lock or a single designated worker) so they fire once.
- **Database (the real concern):** managed Postgres with a standby replica + automated backups + PITR. **PgBouncer** in front — the #1 real-world load failure is connection exhaustion as app replicas multiply Prisma pools. Size per-replica pools deliberately; add a read replica only if read load demands it.
- **Redis / RabbitMQ:** replicate/cluster when their availability (not just durability) becomes critical (§6, §7).
- **Health checks + graceful shutdown:** already present (`/health` covers db+redis+bus; SIGTERM handling in `index.ts`). Wire them into Swarm rolling updates.
- **Monitoring + alerting:** the thing that actually prevents "we got load and couldn't support it" — observe CPU/RAM/queue depth/DB connections and scale *before* it hurts. Autoscaling is not needed at this scale; manual/scripted replica changes suffice.

### The four real load-failure modes (and their fixes — all Dokploy-compatible)

| Failure mode | Fix |
|---|---|
| DB connection exhaustion / slow queries | PgBouncer + pool sizing + indexes |
| Single VM = SPOF | Multi-node Swarm, ≥2 replicas across ≥2 nodes |
| Heavy sync work blocking the event loop (Puppeteer, Python calls) | API/worker split (§4) |
| Stateful services as SPOFs | Managed Postgres; replicate Redis/RabbitMQ when needed |

---

## 9. Portability seams & lock-in ledger

What keeps "switch clouds / self-host" a config change, not a rewrite:

| Concern | Seam | Portability |
|---|---|---|
| Database | `DATABASE_URL` | Any Postgres (RDS / Neon / Aiven / self-hosted) |
| Cache / WS backplane | `REDIS_URL` | Any Redis |
| Event bus | `EventBus` port | RabbitMQ now; swappable later |
| File storage | `STORAGE_BACKEND` (local/s3) | S3 / R2 / MinIO |
| SMS | `SMS_BACKEND` (console/twilio) | Twilio / others |
| Email | SMTP config | SES / any SMTP |
| Telemetry sources | Provider-adapter interface → canonical event | Samsara/Geotab/Motive/Thermo King/… add/remove behind one normalizing seam |
| Telemetry store | Timescale/PostGIS (Postgres) | Portable extension; any Postgres host |
| Orchestration | 12-factor containers | Dokploy/Swarm → k8s, any cloud or on-prem |

**Lock-in flags:**
- **Cognito (stickiest).** We already issue our own JWTs, so Cognito may be more removable than it looks. Put auth fully behind our own seam before treating multi-cloud as real. Track as a dedicated future task.
- **Location API** (maps) — edge feature, swappable.
- **Telematics providers** — each carrier's platform (Samsara/Geotab/…) is an external dependency, but the **adapter→canonical-event seam** keeps any single provider swappable and isolates the rest of the pipeline from provider specifics. No infra lock-in (we avoided AWS IoT Core).

---

## 10. Staged roadmap

Each phase is independently shippable and solo-dev friendly. Dokploy/Hetzner stays live until each step is proven; rollback is generally "revert the config / re-point DNS."

| Phase | Work | Exit criteria |
|---|---|---|
| **0 — Worker split** | Extract subscribers + crons into `src/worker.ts`, gate by `ROLE`; add the dependency-cruiser guard. | Same image runs as `api` (HTTP-only) or `worker`; heavy work no longer blocks HTTP; crons run only on `worker`. |
| **1 — SMS timing → Postgres** | Replace `publishDelayed` with a `SmsPromptSchedule` due-poll cron; idempotent via existing PENDING→SENT guard. | SMS prompts fire from durable DB rows; delayed-message-plugin dependency removed; verified at the 48h horizon. |
| **2 — Managed Postgres + PgBouncer** | Point `DATABASE_URL` at managed PG with standby + backups + PITR; add PgBouncer; tune Prisma pools. | App on Dokploy, DB durable + failover-capable; load test shows no connection exhaustion. |
| **3 — Multi-node Dokploy/Swarm** | 2–4 VMs into a Swarm; ≥2 replicas of stateless services across ≥2 nodes; leader-election for crons; rolling deploys gated on `/health`. | A node loss degrades, not kills; scale up/down by replica count; zero-downtime deploys. |
| **4 — WebSocket gateway (empty pipe)** | `socket.io` + Redis adapter; cookie-auth handshake; org rooms; relay one trial event; UI socket saga logs receipt. | Authenticated client receives one org-scoped event; cross-org leakage test passes; ALB/Traefik WS upgrade works. |
| **5 — Features adopt WS, retire polling** | Ratecon → SMS history → invoices/settlements/agreements; lengthen then remove polling; reconnect → refetch resync. | Live updates per feature; polling removed or slow-fallback only. |
| **6 — RabbitMQ HA (deferred)** | Only if delivery-availability becomes a hard requirement: 3-node quorum cluster (or managed broker, now that the plugin is gone). | Broker survives a node loss with no message loss. |
| **CP — Control-plane hardening for 1000 carriers** | App-level fixes (not infra). Verified against current code 2026-05-29 — see the itemized status below the table. Must-do set: per-org unique constraints (`CRIT-DB-04`), paginate invoice/document lists (`CRIT-DB-02`), fix audit-table cascade-delete (`CRIT-DB-03`). | Per-org numbering enforced; list endpoints paginated; audit tables no longer cascade-delete; no cross-tenant leakage. |
| **T0 — Telemetry foundations** | Asset/Device model + device→asset→load association; stand up TimescaleDB+PostGIS; canonical telemetry event + write path; Redis last-known. | Telemetry schema live; a synthetic point flows ingest → Timescale + Redis. |
| **T1 — First provider adapter** | One real integration end-to-end (e.g. Samsara) via webhook/poll → normalize → store → live map over the WebSocket gateway. | Real truck GPS visible live on the dispatch map; one provider proven. |
| **T2 — Reefer compliance + alerts** | Reefer temp ingestion; setpoint from load commodity; `reefer.excursion.detected` → notifications + WS; compliance retention + cold archive. | Excursion alerts fire to dispatcher/customer; immutable temp trail retained. |
| **T3 — Geofence arrival + more providers** | Geofence enter/exit → `asset.geofence.arrived` (auto check-call); add Geotab/Motive/trailer/reefer providers behind the adapter seam. | Automated arrival events; ≥2 providers integrated. |
| **Future — Marketing site** | Independent Next.js deploy (own container on Dokploy, or Vercel), own domain, shares nothing with the app. | Marketing site live, decoupled deploy cadence. |
| **Future — Kubernetes graduation** | When ops appetite / scale justifies; deployment-layer change only. | Manifests run on EKS/GKE/AKS/k3s; no app rewrite. |

Suggested ordering rationale: Phases 0–1 are pure code/architecture wins that pay off on any platform and remove our worst constraint. Phase 2 is the biggest single sturdiness upgrade. Phase 3 removes the SPOF. WebSockets (4–5) precede telemetry because the gateway is the delivery path for live positions/temps. The **CP** hardening track runs in parallel and is what actually unlocks 1000 carriers on the control plane. The **T0–T3** telemetry track builds on top of WebSockets (4) and the worker split (0), and is sequenced provider-by-provider so each integration ships independently.

### CP track — verified status (2026-05-29)

Sourced from the 2026-04-20 production-readiness audit / CONCERNS.md, then re-verified against current code. The track shrank materially — **3 of 9 items are already fixed.**

**✅ Already fixed (no work needed):**
- **CRIT-DB-01** — notification-history endpoint is now tenant-scoped (`src/notifications/repositories/notificationLogRepositoryPrisma.ts:28` → `where: { loadId, load: { organizationId } }`).
- **CRIT-02** — CSRF implemented (`src/shared/middleware/csrfProtection.ts`, double-submit, applied in `src/app.ts:142`).
- **Puppeteer pool** — `src/shared/providers/puppeteerBrowserPool.ts` is a real pool, wired into invoice + settlement PDF services. (Single Chromium reused.)

**❌ Must-do before multi-tenant production (cheap — a migration + a few repo edits):**
- **CRIT-DB-04** — `Invoice.invoiceNumber` is globally `@unique` (`prisma/schema.prisma:994`); `Settlement` number has no constraint at all. → `@@unique([organizationId, invoiceNumber])` + settlement equivalent. *Hard multi-tenant blocker: the 2nd org to issue "INV-001" collides.*
- **CRIT-DB-02** — `invoice.findAll` is unbounded (`src/invoices/repositories/invoiceRepositoryPrisma.ts:146`); `documents.findMany` also unbounded. → add `take/skip` (carriers/loads/drivers already paginate — copy the pattern).
- **CRIT-DB-03** — `onDelete: Cascade` on the audit tables NotificationLog / LoadStatusHistory / CheckCall (`prisma/schema.prisma:1222` etc.). → `Restrict`/`SetNull`. *Latent today (Loads are soft-deleted) but a future hard-delete/GDPR-erasure silently wipes the audit trail. Cheap to fix now.*

**⚠️ Partial — defer until concurrency/data actually climb (degrade gracefully, not correctness bugs):**
- **MED-09** — dashboard queries are parallelized (`Promise.all` in `src/dashboard/services/dashboardService.ts`) but **uncached** (~12 queries/load) and attention-item lists are unbounded. → Redis aggregate cache (30–60s) + bound the lists.
- **MED-10** — load-intel chain building has a Redis cache but the backhaul loop is still sequential with `await`s inside (`src/load-intel/services/chainService.ts:91`). → `Promise.all` the loop + batch geo calls.
- **CRIT-05** — scope is injected (`req.organizationId`) and `applyTenantFilter` exists in `repositoryFactoryPrisma.ts`, but there's no global Prisma `$extends` guard — still per-repo discipline. The acute leak (CRIT-DB-01) is fixed; this is defense-in-depth. → optional `$extends` + lint rule.

---

## 11. Open decisions

1. **Managed Postgres provider** — AWS RDS vs cloud-neutral (Neon / Aiven / Crunchy). RDS integrates with existing AWS usage (ECR/SES/S3); a neutral provider better serves the multi-cloud/self-host goal. This is the one fork that changes the Phase-2 infra details.
2. **Marketing site host** — own Next.js container on Dokploy (full ownership, consistent model) vs Vercel (zero-ops, best Next.js DX, negligible lock-in for a stateless marketing site).
3. **`ws-gateway` placement** — start inside the `api` process (fewer moving parts) vs a separate service from day one (independent scaling). Recommendation: start in-process; the Redis backplane makes splitting it out later a config change.
4. **Timescale deployment** — separate self-hosted TimescaleDB+PostGIS instance vs Timescale-Cloud-managed vs Timescale/PostGIS extensions on the same managed Postgres (depends on whether the chosen Postgres host from decision #1 supports them). A separate instance keeps the high-throughput telemetry writes off the transactional DB — the recommended default at scale.
5. **First telematics provider** — which platform to integrate first (Samsara is the common starting point given market share + strong webhook API). Driven by which platforms your target carriers actually run.

---

## 12. Notes for implementers

- Reuse the existing Lambda-from-monorepo Terraform pattern only if/when a genuinely serverless edge job appears — it is **not** part of this portable-core architecture.
- Prisma binary targets must match the container runtime arch (`schema.prisma` `binaryTargets`) for any new entrypoint/image.
- Every new subscriber/handler keeps a **duplicate-delivery test** (project convention) — idempotency is load-bearing across redelivery, retries, and multi-publisher events.
- Follow the per-module composition-root + port pattern; the worker entrypoint wires the same modules as `api`, just without the HTTP listener.
