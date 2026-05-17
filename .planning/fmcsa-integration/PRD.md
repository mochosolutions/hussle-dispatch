# fmcsa-integration — PRD

## Summary

Shared API module at `hussle-app-dispatch-api/src/shared/fmcsa/` that exposes FMCSA / SaferWebAPI carrier lookups behind a port + adapter pattern. Initial consumer is **carrier-portal** (Phase 1 Business Profile prefill); future consumers include broker/customer verification flows and ratecon-extractor enrichment.

## Why shared, not feature-local

FMCSA data is identity-proofing data — needed anywhere we onboard, verify, or enrich a motor carrier record. Living under `src/shared/` makes it consumable by:
- `carrier-portal` (MC entry → prefill business name, address, DOT#, officer name, safety rating)
- Future broker-onboarding / customer verification
- `ratecon-extractor` (verify broker MC# extracted from a rate confirmation against FMCSA)
- Dispatcher manual carrier creation (auto-fill on MC# entry)

## Capabilities

### Must Have (P0)

- **`FmcsaPort` interface** in `src/shared/fmcsa/fmcsaPort.ts` exposing `lookupByMcNumber(mc: string): Promise<FmcsaLookupResult>` and `lookupByDotNumber(dot: string): Promise<FmcsaLookupResult>`.
- **`FmcsaSnapshot` type** modeling the response: legalName, dba, mcNumber, dotNumber, address, authorityStatus, safetyRating, fleetSize, officerName, lastCheckedAt, raw (provider payload for audit).
- **`CachePort` interface** in `src/shared/fmcsa/cachePort.ts` exposing `get`, `set` (with TTL), `del`. Real impl wraps `redisClient` singleton; tests pass an in-memory fake.
- **`MockFmcsaProvider`** in `src/shared/fmcsa/mockFmcsaProvider.ts` returning canned data for any MC#. Deterministic — same input → same output. Configurable failure mode (timeout, not-found, rate-limit) for testing degradation paths.
- **`fmcsaService` factory** (`createFmcsaService`) that wraps the port with:
  - Input normalization (strip non-digits from MC# / DOT# inputs at the service boundary).
  - 24-hour dual-key cache via `CachePort`: every successful (`found`) lookup writes the same snapshot to `fmcsa:mc:{digits}` AND `fmcsa:dot:{digits}`. `not_found` and `error` results are never cached.
  - Retry with exponential backoff (3 attempts, ~1s/5s/30s) on provider errors.
  - Caller-supplied `correlationId` opt (UUID generated if absent) for event traceability.
  - Structured logging via injected `Logger` from `@/shared/utils/logger`.
- **Observability events** (RabbitMQ, fire-and-forget from the service after each lookup):
  - `fmcsa.lookup.completed` — emitted for both `found` and `not_found` results; payload carries the discriminated `FmcsaLookupResult`.
  - `fmcsa.lookup.failed` — emitted only for real provider errors (`timeout` / `rate_limit` / `provider_error`).
  - No `fmcsa.lookup.requested` event; no consuming subscriber. The sync service is the call path; events exist for audit and downstream observers.
- **Composition root pattern**: `createFmcsaModule({ eventBus, logger })` returns `{ service }`. Module is stateless except for the Redis-backed `CachePort` (wired internally). Module side-effect-initialized via shared event bus in `src/app.ts`.
- **Provider selection via env var**: `FMCSA_PROVIDER: 'mock' | 'safer-web'`, default `'mock'` in all envs.
- **Unit tests**: port contract test (any provider must satisfy), mock provider determinism, cache hit/miss, dual-key cache writes, retry behavior, normalization edge cases, event emission paths.

### Nice to Have (P1)

- **`SaferWebApiProvider`** real adapter — gated behind `FMCSA_PROVIDER=safer-web` env var. Stubbed in v1 (throws "not implemented"). Real implementation follows in a separate plan.

### Out of scope (defer)

- Webhook for FMCSA data refresh
- Bulk lookup endpoint
- Authority status change notifications
- OOS percent / crash count aggregation (the tech design mentions these — defer until carrier-portal explicitly needs them)
- **Consumer-side persistence and retention.** Consumers own snapshot persistence and must handle retention per their own data-classification policy. This module retains nothing beyond the 24h Redis cache.

## API / Interface Changes

### New TypeScript surface (no HTTP endpoints in v1 — internal shared module)

```typescript
// src/shared/fmcsa/types.ts
interface FmcsaSnapshot {
  mcNumber: string;        // bare digits, no prefix
  dotNumber: string | null;
  legalName: string;
  dba: string | null;
  address: string | null;
  authorityStatus: 'ACTIVE' | 'INACTIVE' | 'NOT_AUTHORIZED';
  safetyRating: 'SATISFACTORY' | 'CONDITIONAL' | 'UNSATISFACTORY' | 'UNRATED' | null;
  fleetSize: number | null;
  officerName: string | null;
  lastCheckedAt: Date;
  raw: Record<string, unknown>; // provider-specific payload for audit
}

type FmcsaLookupResult =
  | { status: 'found'; snapshot: FmcsaSnapshot }
  | { status: 'not_found'; identifier: { type: 'mc' | 'dot'; value: string } }
  | {
      status: 'error';
      reason: 'timeout' | 'rate_limit' | 'provider_error';
      identifier: { type: 'mc' | 'dot'; value: string };
    };

// src/shared/fmcsa/fmcsaPort.ts
interface FmcsaPort {
  lookupByMcNumber(mc: string): Promise<FmcsaLookupResult>;
  lookupByDotNumber(dot: string): Promise<FmcsaLookupResult>;
}

// src/shared/fmcsa/cachePort.ts
interface CachePort {
  get(key: string): Promise<FmcsaSnapshot | null>;
  set(key: string, value: FmcsaSnapshot, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

// src/shared/fmcsa/fmcsaService.ts
interface FmcsaLookupOpts {
  skipCache?: boolean;
  correlationId?: string;
}

interface FmcsaService {
  lookupByMcNumber(mc: string, opts?: FmcsaLookupOpts): Promise<FmcsaLookupResult>;
  lookupByDotNumber(dot: string, opts?: FmcsaLookupOpts): Promise<FmcsaLookupResult>;
  invalidateCache(identifier: { type: 'mc' | 'dot'; value: string }): Promise<void>;
}
```

### New events (extend `src/shared/messaging/eventMap.ts`)

```typescript
'fmcsa.lookup.completed': {
  correlationId: string;
  identifier: { type: 'mc' | 'dot'; value: string };
  result:
    | { status: 'found'; snapshot: FmcsaSnapshot }
    | { status: 'not_found' };
};
'fmcsa.lookup.failed': {
  correlationId: string;
  identifier: { type: 'mc' | 'dot'; value: string };
  reason: 'timeout' | 'rate_limit' | 'provider_error';
};
```

Events are ephemeral observability artifacts emitted fire-and-forget from the service. Any subscriber that chooses to persist event payloads (including the `raw` field on the snapshot) owns its own compliance and retention policy.

## Affected Services

| Service | Changes |
|---------|---------|
| dispatch-api | New `src/shared/fmcsa/` module; 2 new events in `EventMap`; `FMCSA_PROVIDER` env var in `src/config/env.ts`; `.env.example` documentation. |
| dispatch-ui | No changes in this feature (consumers wire in separately). |

## Technical Context

### Existing patterns to reuse

- **`PuppeteerBrowserPool`** (`src/shared/providers/puppeteerBrowserPool.ts`) — lazy-init pattern with async loading, error handling, reconnect. Apply same shape to `MockFmcsaProvider` / `SaferWebApiProvider`.
- **`rabbitMqEventBus.ts`** — publish/subscribe with typed `EventMap`. Add 2 events.
- **`redisClient.ts`** — shared singleton; wrapped by `CachePort` impl.
- **`Logger`** (`src/shared/utils/logger.ts`) — inject into service factory; log all lookups + cache hits/misses.
- **`EventBus`** (`src/shared/messaging/eventBus.ts`) — inject into composition root.
- **Composition root pattern** — see `src/notifications/compositionRoot.ts` as reference.
- **Backend-selection env var** — `STORAGE_BACKEND` / `SMS_BACKEND` in `src/config/env.ts` as the pattern for `FMCSA_PROVIDER`.

### Key decisions (locked)

- **Port-first**: define `FmcsaPort` before any provider. Composition decides which provider to bind.
- **Mock as a real provider**: not a test double — a first-class provider used in dev. Deterministic, configurable, audited.
- **Service is the primary call path**: consumers depend on the injected `FmcsaService`, not on events. Events are fire-and-forget observability only.
- **Dual-key cache, found only**: write `fmcsa:mc:{digits}` and `fmcsa:dot:{digits}` on every successful lookup. Negative and error results never cached so they auto-retry.
- **Normalization at service boundary**: callers can pass `MC-1234567`, `mc 1234567`, or `1234567` — service strips to digits before cache lookup and provider call.
- **24-hour cache TTL**: matches tech-design §7.1 — FMCSA data rarely changes.
- **Retry budget = 3**: short backoff (1s, 5s, 30s). Provider errors surface to consumer as `error` status, not exceptions.
- **No DB persistence in this module**: FMCSA snapshots are written by consumers (e.g., onboarding session stores the snapshot on the session row). This module is stateless except for the Redis-backed cache.

## Acceptance Criteria

1. `npm run validate` passes (lint + lint:deps + check-ts + test).
2. `MockFmcsaProvider.lookupByMcNumber('MC-1234567')` returns deterministic `FmcsaSnapshot` with canned data; same call with `'1234567'` returns the identical snapshot (normalization).
3. Second lookup of the same MC# (or DOT# of the same carrier) hits cache — verified by log assertion: only one provider call across the two lookups.
4. After every lookup, the service publishes `fmcsa.lookup.completed` (for `found` and `not_found`) or `fmcsa.lookup.failed` (for `error`), with the caller's `correlationId` or a service-generated UUID.
5. Composition root factory `createFmcsaModule({ eventBus, logger })` wires correctly with the mock provider; module integrates via `src/app.ts` side-effect import.
6. **Coverage**: 90% line coverage across the module (project standard). 100% on critical paths — port contract test (any `FmcsaPort` impl must satisfy), service public API (`lookup*`, `invalidateCache`, retry, cache hit/miss, normalization), and observability event emission.
7. Provider can be swapped via `FMCSA_PROVIDER` env var without code changes (mock default; safer-web stub throws if selected).

## Out of Scope

- Real SaferWebAPI HTTP calls (deferred to a follow-on plan)
- HTTP endpoints — consumers integrate via injected service
- Persistence (consumers own snapshot storage and retention)
- Caching invalidation on FMCSA data changes (no webhook; cache simply expires at 24h)
- Consuming subscriber for `fmcsa.lookup.*` events — service is the producer; consumers subscribe as they arise
