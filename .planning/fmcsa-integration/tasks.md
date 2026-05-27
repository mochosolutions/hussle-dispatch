# fmcsa-integration Tasks
_Last updated: 2026-05-14 02:00_
_Plan: .planning/fmcsa-integration/PRD.md_
_Patterns: .planning/fmcsa-integration/PATTERNS.md_

---

## US-01: Define FMCSA type contracts and port interfaces
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

must_haves:
  truths:
    - "Importing FmcsaSnapshot, FmcsaLookupResult, FmcsaService, FmcsaPort, CachePort from src/shared/fmcsa compiles with no any/as/!"
    - "The FmcsaLookupResult discriminated union narrows on .status — code reading `result.status === 'found'` gets `snapshot` typed without assertion"
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/fmcsa/types.ts
      provides: "FmcsaSnapshot, FmcsaLookupResult (found | not_found | error), FmcsaLookupOpts, FmcsaService interface, FmcsaIdentifier helper type"
    - path: hussle-app-dispatch-api/src/shared/fmcsa/fmcsaPort.ts
      provides: "FmcsaPort interface with lookupByMcNumber and lookupByDotNumber"
    - path: hussle-app-dispatch-api/src/shared/fmcsa/cachePort.ts
      provides: "CachePort interface with get/set/del scoped to FmcsaSnapshot"
  key_links:
    - from: FmcsaService
      to: FmcsaPort
      via: "type composition — service deps include FmcsaPort"
    - from: FmcsaService
      to: CachePort
      via: "type composition — service deps include CachePort"

**Acceptance Criteria:**
- [x] types.ts exports FmcsaSnapshot with all PRD fields (mcNumber, dotNumber, legalName, dba, address, authorityStatus, safetyRating, fleetSize, officerName, lastCheckedAt, raw)
- [x] FmcsaLookupResult is a discriminated union with three branches (found, not_found, error)
- [x] not_found and error branches carry `identifier: { type: 'mc' | 'dot'; value: string }`
- [x] error.reason union is `'timeout' | 'rate_limit' | 'provider_error'`
- [x] FmcsaService interface includes lookupByMcNumber, lookupByDotNumber, invalidateCache; lookups accept optional `FmcsaLookupOpts { skipCache?, correlationId? }`
- [x] FmcsaPort and CachePort are pure interfaces — no class, no impl

**Tasks:**
[x] T-01 [TYPES] Define FmcsaSnapshot and FmcsaLookupResult in types.ts
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/types.ts with:
            - `FmcsaIdentifier` helper: `{ type: 'mc' | 'dot'; value: string }`
            - `FmcsaSnapshot` interface per PRD § API/Interface Changes
            - `FmcsaLookupResult` discriminated union:
              found:    `{ status: 'found'; snapshot: FmcsaSnapshot }`
              not_found:`{ status: 'not_found'; identifier: FmcsaIdentifier }`
              error:    `{ status: 'error'; reason: 'timeout' | 'rate_limit' | 'provider_error'; identifier: FmcsaIdentifier }`
            - `FmcsaLookupOpts { skipCache?: boolean; correlationId?: string }`
            - `FmcsaService` interface: lookupByMcNumber(mc, opts?), lookupByDotNumber(dot, opts?), invalidateCache(identifier)
            Follow Airbnb TS style; `import type` for type-only refs. Use `interface` per project rule.
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/types.ts]
         └─ Depends on: —
         └─ Output:

[x] T-02 [TYPES] Define FmcsaPort interface
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/fmcsaPort.ts mirroring routeCalculatorPort.ts:1-6 shape:
            `export interface FmcsaPort {
               lookupByMcNumber(mc: string): Promise<FmcsaLookupResult>;
               lookupByDotNumber(dot: string): Promise<FmcsaLookupResult>;
             }`
            Import FmcsaLookupResult as `import type` from './types'.
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/fmcsaPort.ts]
         └─ Depends on: T-01
         └─ Output:

[x] T-03 [TYPES] Define CachePort interface
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/cachePort.ts:
            `export interface CachePort {
               get(key: string): Promise<FmcsaSnapshot | null>;
               set(key: string, value: FmcsaSnapshot, ttlSeconds: number): Promise<void>;
               del(key: string): Promise<void>;
             }`
            Import FmcsaSnapshot as `import type` from './types'.
            This is FMCSA-scoped (not a generic cache) so we don't accidentally couple it to unrelated cache work.
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/cachePort.ts]
         └─ Depends on: T-01
         └─ Output:

---

## US-02: Extend EventMap with FMCSA observability events
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

must_haves:
  truths:
    - "EventMap['fmcsa.lookup.completed'] resolves to a payload with correlationId, identifier, and discriminated result (found with snapshot | not_found)"
    - "EventMap['fmcsa.lookup.failed'] resolves to a payload with correlationId, identifier, and reason ∈ {'timeout','rate_limit','provider_error'}"

**Acceptance Criteria:**
- [x] eventMap.ts compiles with two new entries
- [x] Payloads reference FmcsaSnapshot via `import type` from `@/shared/fmcsa/types`
- [x] No `fmcsa.lookup.requested` event (deliberately absent per PRD)

**Tasks:**
[x] T-04 [TYPES] Add fmcsa.lookup.completed and fmcsa.lookup.failed to EventMap
         └─ Detail: Edit hussle-app-dispatch-api/src/shared/messaging/eventMap.ts. After line 213 (closing of last event entry, before `}`), append:
            ```
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
            Add `import type { FmcsaSnapshot } from '@/shared/fmcsa/types';` at the top (preserve existing imports if any; eventMap.ts currently has none — add the import block above the `export interface EventMap`).
         └─ Files: [hussle-app-dispatch-api/src/shared/messaging/eventMap.ts]
         └─ Depends on: T-01
         └─ Output:

---

## US-03: Register FMCSA_PROVIDER env var
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

must_haves:
  truths:
    - "env.FMCSA_PROVIDER imports as the literal type 'mock' | 'safer-web' and defaults to 'mock' when the env var is unset in every NODE_ENV"

**Acceptance Criteria:**
- [x] env.ts compiles with FMCSA_PROVIDER added
- [x] .env.example documents FMCSA_PROVIDER under the backend-selection group

**Tasks:**
[x] T-05 [INFRA] Add FMCSA_PROVIDER to env config and .env.example
         └─ Detail:
            1. Edit hussle-app-dispatch-api/src/config/env.ts. After the SMS_BACKEND line (L56), before TWILIO_ACCOUNT_SID (L57), insert:
               `FMCSA_PROVIDER: getEnv('FMCSA_PROVIDER', 'mock') as 'mock' | 'safer-web',`
               Use `getEnv` (not `requireInProd`) — default 'mock' everywhere.
            2. Edit .env.example. Add a line alongside STORAGE_BACKEND / SMS_BACKEND:
               `FMCSA_PROVIDER=mock   # 'mock' | 'safer-web' (safer-web is stubbed in v1)`
            No other changes.
         └─ Files: [hussle-app-dispatch-api/src/config/env.ts, .env.example]
         └─ Depends on: —
         └─ Output:

---

## US-04: Implement Redis cache adapter
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01_

must_haves:
  truths:
    - "redisCacheAdapter.set(key, snapshot, ttl) followed by .get(key) returns the same snapshot deep-equal"
    - ".del(key) clears the entry — subsequent .get returns null"
    - ".get on a missing key returns null (not throws)"
    - "Redis transport errors are swallowed and logged via Logger; .get returns null on transport error, .set / .del log and continue"
    - "lastCheckedAt is preserved as a Date instance through the serialize/deserialize round-trip"
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/fmcsa/redisCacheAdapter.ts
      provides: "createRedisCacheAdapter(deps: { redis: Redis; logger: Logger }) => CachePort"
    - path: hussle-app-dispatch-api/src/shared/fmcsa/__tests__/cachePort.test.ts
      provides: "Adapter contract tests using ioredis-mock or an in-memory fake"
  key_links:
    - from: redisCacheAdapter
      to: redisClient
      via: "deps.redis (ioredis instance) — wired by compositionRoot in US-07"
    - from: redisCacheAdapter
      to: CachePort
      via: "implements interface"

**Acceptance Criteria:**
- [x] createRedisCacheAdapter returns a CachePort
- [x] Serializes via JSON.stringify; deserializes via JSON.parse; revives lastCheckedAt as Date
- [x] Transport failures logged at warn, never thrown out of the adapter
- [x] Tests run without a real Redis instance (use an in-memory fake passed as Redis-like dep, or ioredis-mock)

**Tasks:**
[x] T-06 [INFRA] Create redisCacheAdapter implementing CachePort
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/redisCacheAdapter.ts.
            Reference analog: src/shared/routing/routeCache.ts (lines 1-57). Same shape — accept deps { redis, logger, ttlSeconds? }, return implementation, swallow + log transport errors.
            - Signature: `export const createRedisCacheAdapter = (deps: { redis: Redis; logger: Logger }): CachePort => { ... }`
            - `get(key)`: `await redis.get(key)`; if null → return null; else JSON.parse and revive `lastCheckedAt` to `new Date(parsed.lastCheckedAt)`. On thrown error: log warn, return null.
            - `set(key, value, ttlSeconds)`: `await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)`. On error: log warn, return.
            - `del(key)`: `await redis.del(key)`. On error: log warn, return.
            Import Redis type via `import type { Redis } from 'ioredis'`. Import Logger from `@/shared/utils/logger`. Import CachePort + FmcsaSnapshot from `./cachePort` and `./types`.
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/redisCacheAdapter.ts]
         └─ Depends on: T-03
         └─ Output:

[x] T-07 [TEST] Cache adapter contract tests
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/__tests__/cachePort.test.ts.
            Cover: round-trip set→get returns deep-equal snapshot with Date revival, get on missing key returns null, del clears, transport error on get returns null (mock redis.get to throw), transport error on set/del logs and does not throw.
            Use a minimal Map-backed Redis-like fake (matches ioredis surface: `get`, `set`, `del` with ioredis args). Match jest patterns in src/short-links/__tests__/shortLinkService.test.ts:33-138 — describe block per behavior, jest.fn() for logger, AAA layout.
            Run: `cd hussle-app-dispatch-api && npx jest --findRelatedTests src/shared/fmcsa/redisCacheAdapter.ts src/shared/fmcsa/__tests__/cachePort.test.ts`
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/__tests__/cachePort.test.ts]
         └─ Depends on: T-06
         └─ Output:

---

## US-05: Implement mock and stub FMCSA providers + port contract test
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01_

must_haves:
  truths:
    - "MockFmcsaProvider.lookupByMcNumber('MC-1234567') returns a FmcsaSnapshot with deterministic field values"
    - "Calling lookupByMcNumber twice with inputs 'MC-1234567' and '1234567' returns identical snapshots (provider treats inputs as already-normalized digits — service normalizes upstream, but provider accepts either)"
    - "Reserved markers in the input trigger configured failure modes — e.g. 'TIMEOUT' input returns { status: 'error', reason: 'timeout', identifier }; 'NOTFOUND' returns { status: 'not_found', identifier }; 'RATELIMIT' returns { status: 'error', reason: 'rate_limit', identifier }"
    - "SaferWebApiProvider.lookupByMcNumber throws an Error with message containing 'not implemented' (stub)"
    - "fmcsaPort.contract.test.ts runs against the mock provider and validates every FmcsaPort method against the discriminated FmcsaLookupResult contract"
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/fmcsa/mockFmcsaProvider.ts
      provides: "createMockFmcsaProvider() => FmcsaPort with deterministic responses and failure-mode markers"
    - path: hussle-app-dispatch-api/src/shared/fmcsa/saferWebApiProvider.ts
      provides: "createSaferWebApiProvider() => FmcsaPort — throws 'not implemented' in v1"
    - path: hussle-app-dispatch-api/src/shared/fmcsa/__tests__/mockFmcsaProvider.test.ts
      provides: "Determinism + failure-mode tests for the mock provider"
    - path: hussle-app-dispatch-api/src/shared/fmcsa/__tests__/fmcsaPort.contract.test.ts
      provides: "Shared contract assertions that any FmcsaPort impl must satisfy"
  key_links:
    - from: mockFmcsaProvider
      to: FmcsaPort
      via: "implements interface"
    - from: saferWebApiProvider
      to: FmcsaPort
      via: "implements interface (stub)"
    - from: fmcsaPort.contract.test.ts
      to: FmcsaPort
      via: "asserts compliance against any provider"

**Acceptance Criteria:**
- [x] Mock provider returns deterministic snapshot — same input always returns same legalName, dotNumber, address, etc.
- [x] Failure markers (`TIMEOUT`, `NOTFOUND`, `RATELIMIT`) tested for both lookupByMcNumber and lookupByDotNumber
- [x] Stub provider's methods throw Error('not implemented for v1') or similar
- [x] Port contract test exports a `runFmcsaPortContract(provider: FmcsaPort)` helper and exercises the mock through it

**Tasks:**
[x] T-08 [INFRA] Create MockFmcsaProvider
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/mockFmcsaProvider.ts.
            Reference analog for shape: src/shared/providers/puppeteerBrowserPool.ts:1-120 (factory function returning object).
            Signature: `export const createMockFmcsaProvider = (): FmcsaPort => ({ ... })`
            Implementation:
            - Internal helper `buildSnapshot(identifier: FmcsaIdentifier): FmcsaSnapshot` returns deterministic fields seeded from the digit value:
              - mcNumber/dotNumber: derive from identifier (the looked-up one is the value; the other is `'9' + value.padStart(6,'0').slice(-6)` or similar deterministic stub)
              - legalName: `'Mock Carrier ' + value`
              - dba: null
              - address: `'1 Mock St, Mock City, MC 00000'`
              - authorityStatus: 'ACTIVE'
              - safetyRating: 'SATISFACTORY'
              - fleetSize: parseInt(value.slice(-2), 10) + 1
              - officerName: `'Officer ' + value`
              - lastCheckedAt: new Date('2026-01-01T00:00:00Z')  — fixed for determinism
              - raw: { source: 'mock', queriedValue: value }
            - Marker handling on each method: digits-only input matching '0000000' → not_found; 'TIMEOUT' / 'NOTFOUND' / 'RATELIMIT' literal inputs trigger respective branches before digit parsing.
            - Otherwise return { status: 'found', snapshot: buildSnapshot(...) }.
            Provider does NOT normalize inputs (service does that upstream). Provider accepts strings as given.
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/mockFmcsaProvider.ts]
         └─ Depends on: T-02
         └─ Output:

[x] T-09 [INFRA] Create SaferWebApiProvider stub
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/saferWebApiProvider.ts.
            Reference analog: src/shared/providers/puppeteerBrowserPool.ts:47-63 (error-throwing branch shape).
            Signature: `export const createSaferWebApiProvider = (): FmcsaPort => ({ ... })`
            Each method throws `new Error('SaferWebApiProvider not implemented in v1 — see fmcsa-integration PRD § Out of Scope')`.
            Keep it under 30 lines.
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/saferWebApiProvider.ts]
         └─ Depends on: T-02
         └─ Output:

[x] T-10 [TEST] Mock provider determinism + failure-mode tests
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/__tests__/mockFmcsaProvider.test.ts.
            Pattern from src/short-links/__tests__/shortLinkService.test.ts:33-138.
            Cover:
            - Same input returns deep-equal snapshot across two calls (determinism)
            - 'NOTFOUND' input → status === 'not_found' with correct identifier shape
            - 'TIMEOUT' input → status === 'error', reason === 'timeout'
            - 'RATELIMIT' input → status === 'error', reason === 'rate_limit'
            - Both lookupByMcNumber and lookupByDotNumber tested
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/__tests__/mockFmcsaProvider.test.ts]
         └─ Depends on: T-08
         └─ Output:

[x] T-11 [TEST] FmcsaPort contract test
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/__tests__/fmcsaPort.contract.test.ts.
            Export a `runFmcsaPortContract(provider: FmcsaPort, name: string)` helper that wraps assertions in a describe block. Inside, run cases:
            - lookupByMcNumber('1234567') returns a result whose status matches the discriminated union
            - lookupByDotNumber('9876543') likewise
            - When status === 'found', snapshot is a complete FmcsaSnapshot (all fields present, lastCheckedAt is a Date)
            - When status === 'not_found' or 'error', identifier is present
            Call `runFmcsaPortContract(createMockFmcsaProvider(), 'mock')` to register the suite for the mock.
            This file becomes the suite future providers (saferWeb, etc.) reuse — when they're implemented they import the helper.
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/__tests__/fmcsaPort.contract.test.ts]
         └─ Depends on: T-08
         └─ Output:

---

## US-06: Implement fmcsaService with normalization, dual-key cache, retry, and event emission
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-01, US-02, US-05_

must_haves:
  truths:
    - "lookupByMcNumber accepts 'MC-1234567', 'mc 1234567', '  1234567  ' — all reduce to digits '1234567' identically and yield the same provider call + cache key"
    - "On a successful (found) lookup by MC, the snapshot is written to BOTH `fmcsa:mc:{digits}` AND `fmcsa:dot:{snapshot.dotNumber}` via CachePort.set with 86400s TTL"
    - "A second lookup of either identifier (the looked-up MC OR the snapshot's DOT) hits CachePort.get and DOES NOT call the provider"
    - "not_found and error results are never cached — second call still invokes the provider"
    - "On every lookup the service publishes EXACTLY ONE event: fmcsa.lookup.completed for found/not_found (with the discriminated result), fmcsa.lookup.failed for error"
    - "When opts.correlationId is provided, the event payload carries it verbatim; when omitted, the service generates a UUID and uses that"
    - "Retry: provider errors trigger up to 3 attempts with backoff (1s, 5s, 30s) before surfacing { status: 'error', reason }; not_found surfaces immediately without retry"
    - "opts.skipCache bypasses CachePort.get but still writes on success"
    - "invalidateCache({ type, value }) calls CachePort.del on the corresponding key"
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/fmcsa/fmcsaService.ts
      provides: "createFmcsaService(deps: { provider, cache, eventBus, logger, sleep? }) => FmcsaService"
    - path: hussle-app-dispatch-api/src/shared/fmcsa/__tests__/fmcsaService.test.ts
      provides: "Service unit tests covering normalization, dual-key cache, retry, events, correlationId"
  key_links:
    - from: fmcsaService
      to: FmcsaPort
      via: "deps.provider — injected"
    - from: fmcsaService
      to: CachePort
      via: "deps.cache — injected"
    - from: fmcsaService
      to: EventBus
      via: "deps.eventBus.publish('fmcsa.lookup.completed'|'fmcsa.lookup.failed', ...) — fire-and-forget"

**Acceptance Criteria:**
- [x] Service normalizes inputs by stripping non-digits before cache lookup or provider call
- [x] Dual-key write only on found results
- [x] Retry budget 3, backoff ~1s/5s/30s (parameterizable via injected `sleep` for tests)
- [x] Event emission fire-and-forget: caller is not blocked on eventBus.publish; publish errors logged, not thrown
- [x] correlationId behavior (caller-supplied vs UUID) covered by tests
- [x] cache hits still emit completed events (per implementation note — subscribers don't care about cache vs provider source)
- [x] Logger receives info on every lookup, debug on cache hit, warn on retry

**Implementation note on cache-hit event emission:**
Cache hits still publish `fmcsa.lookup.completed` with the cached snapshot (subscribers shouldn't care whether the data came from cache or provider). The log line distinguishes them.

**Tasks:**
[x] T-12 [API] Implement createFmcsaService
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/fmcsaService.ts.
            Reference analog: src/short-links/services/shortLinkService.ts:32-87 (factory shape, deps injection, internal helpers).
            
            Module-internal constants:
            ```
            const CACHE_TTL_SECONDS = 86400; // 24h
            const RETRY_DELAYS_MS = [1_000, 5_000, 30_000];
            ```
            
            Deps interface:
            ```
            interface FmcsaServiceDeps {
              provider: FmcsaPort;
              cache: CachePort;
              eventBus: EventBus;
              logger: Logger;
              uuid?: () => string;        // injectable for tests
              sleep?: (ms: number) => Promise<void>;  // injectable for tests
            }
            ```
            
            Public surface (export const createFmcsaService = (deps): FmcsaService => { ... }):
            - `lookupByMcNumber(mc, opts?)`: normalize → call internal `lookupAndEmit({ type: 'mc', value: normalized }, opts)`
            - `lookupByDotNumber(dot, opts?)`: same with `{ type: 'dot', value: normalized }`
            - `invalidateCache(identifier)`: `await cache.del(buildKey(identifier))`
            
            Internal helpers:
            - `normalize(input: string): string` — `input.replace(/\D/g, '')`. Throw BadRequestError if result is empty.
            - `buildKey(id: FmcsaIdentifier): string` — `\`fmcsa:${id.type}:${id.value}\``
            - `callProviderWithRetry(id, attempt = 0)`:
              - dispatch by type to provider.lookupByMcNumber / lookupByDotNumber
              - if result.status === 'error' AND attempt < 3, await sleep(RETRY_DELAYS_MS[attempt]), recurse
              - else return result
            - `lookupAndEmit(id, opts)`:
              1. correlationId = opts.correlationId ?? uuid()
              2. if !opts.skipCache: cached = await cache.get(buildKey(id)); if cached, emit completed(found, cached), return found
              3. result = await callProviderWithRetry(id)
              4. if result.status === 'found':
                 - await cache.set(buildKey(id), result.snapshot, CACHE_TTL_SECONDS)
                 - if result.snapshot.dotNumber: also cache.set under buildKey({type:'dot', value: result.snapshot.dotNumber})
                 - emit completed(found, snapshot)
              5. if result.status === 'not_found': emit completed({status:'not_found'})
              6. if result.status === 'error': emit failed(reason)
              7. return result
            - `emitCompleted` / `emitFailed`: wrap `eventBus.publish(...).catch(err => logger.warn(...))` — fire-and-forget
            
            Use uuid: `import { randomUUID } from 'node:crypto'` as default for `deps.uuid`.
            Default sleep: `(ms) => new Promise(r => setTimeout(r, ms))`.
            
            Logger calls:
            - info on every public lookup entry (`'FMCSA lookup started'`, { identifier, correlationId })
            - debug on cache hit (`'FMCSA cache hit'`, { identifier })
            - warn on retry (`'FMCSA provider error — retrying'`, { identifier, attempt, reason })
            - warn on event publish failure
            
            Type imports: `import type { FmcsaPort } from './fmcsaPort'; import type { CachePort } from './cachePort'; import type { FmcsaService, FmcsaSnapshot, FmcsaLookupResult, FmcsaLookupOpts, FmcsaIdentifier } from './types'; import type { EventBus } from '@/shared/messaging/eventBus'; import type { Logger } from '@/shared/utils/logger';`
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/fmcsaService.ts]
         └─ Depends on: T-01, T-02, T-03, T-04
         └─ Output:

[x] T-13 [TEST] fmcsaService unit tests
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/__tests__/fmcsaService.test.ts.
            Pattern from src/short-links/__tests__/shortLinkService.test.ts:33-138.
            
            Test groups (describe blocks):
            - "normalization": 'MC-1234567', 'mc 1234567', '  1234567  ', '1234567' all hit the same provider call (single jest.fn() call) and the same cache key
            - "dual-key cache": found result by MC writes BOTH fmcsa:mc:{mc} and fmcsa:dot:{dot}; a follow-up DOT lookup with that snapshot's DOT hits cache (cache.get returns the snapshot, provider not called)
            - "negative results not cached": not_found result by MC does NOT call cache.set; error result likewise
            - "retry": provider returns error 2 times then found → final result is found, sleep called twice with 1000, 5000
            - "retry budget exhausted": provider returns error 4 times → final result is error, sleep called 3 times with 1000, 5000, 30000; ONE failed event published
            - "events: found emits completed(found, snapshot)"
            - "events: not_found emits completed(not_found)"
            - "events: error after retries emits failed(reason)"
            - "events: correlationId — caller-supplied flows verbatim"
            - "events: correlationId — service generates UUID when omitted (assert eventBus.publish called with a uuid-shaped string)"
            - "skipCache: cache.get not called; cache.set still called on found"
            - "invalidateCache: cache.del called with buildKey of identifier"
            - "BadRequestError when normalized input is empty (e.g., service called with 'MC-' that yields empty digits)"
            
            Mocks:
            - provider: { lookupByMcNumber: jest.fn(), lookupByDotNumber: jest.fn() } — preset return values per case
            - cache: { get: jest.fn(), set: jest.fn(), del: jest.fn() }
            - eventBus: { publish: jest.fn().mockResolvedValue(undefined) } (only publish is used)
            - logger: { info, warn, error, debug: jest.fn() }
            - sleep: jest.fn().mockResolvedValue(undefined) — never wait real time
            - uuid: jest.fn().mockReturnValue('test-uuid-123') for predictable assertions
            
            AAA layout. Cover the public API thoroughly — this is the heart of the module.
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/__tests__/fmcsaService.test.ts]
         └─ Depends on: T-12
         └─ Output:

---

## US-07: Composition root, module barrel, and app bootstrap wiring
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done | Depends on: US-03, US-04, US-05, US-06_

must_haves:
  truths:
    - "createFmcsaModule({ eventBus, logger }) returns { service: FmcsaService } and selects the provider via env.FMCSA_PROVIDER (defaults to mock; safer-web is wired but throws on use)"
    - "src/app.ts side-effect-imports './fmcsa' alongside './audit' and './notifications'"
    - "Importing `@/shared/fmcsa` from a hypothetical consumer surface exposes only the FmcsaService and its types — no providers, no adapter — barrel keeps internals encapsulated"
    - "The module integrates without prisma, without DB writes, and without HTTP endpoints"
    - "When FMCSA_PROVIDER=safer-web, the composition root wires the stub; calling the service does not throw at boot, only on first lookup invocation"
  artifacts:
    - path: hussle-app-dispatch-api/src/shared/fmcsa/compositionRoot.ts
      provides: "createFmcsaModule({ eventBus, logger }) factory + provider selection"
    - path: hussle-app-dispatch-api/src/shared/fmcsa/index.ts
      provides: "Side-effect bootstrap (constructs module from singletons + env) and exports `fmcsaService` for consumers"
    - path: hussle-app-dispatch-api/src/app.ts
      provides: "Side-effect import that triggers fmcsa module bootstrap (added to L30-32 group)"
  key_links:
    - from: compositionRoot
      to: createMockFmcsaProvider / createSaferWebApiProvider
      via: "selectProvider switch on env.FMCSA_PROVIDER"
    - from: compositionRoot
      to: createRedisCacheAdapter
      via: "direct construction with redisClient + logger"
    - from: compositionRoot
      to: createFmcsaService
      via: "factory call with assembled deps"
    - from: index.ts
      to: compositionRoot
      via: "calls createFmcsaModule with sharedEventBus + logger; exports module.service as fmcsaService"
    - from: app.ts
      to: index.ts
      via: "side-effect import `import './fmcsa'` near L30-32"

**Acceptance Criteria:**
- [x] createFmcsaModule signature is `{ eventBus, logger, redis, providerKind } → { service: FmcsaService }` (redis + providerKind added per US-04 RedisLike strategy and env-driven provider selection)
- [x] selectProvider helper inside compositionRoot returns FmcsaPort based on providerKind arg
- [x] index.ts wires sharedEventBus + logger + env.FMCSA_PROVIDER and exports `fmcsaService`
- [x] app.ts imports `@/shared/fmcsa` for side effects
- [x] check-ts + lint + lint:deps + tests pass (run in VER-01)
- [x] dependency-cruiser raises no new violations (3 pre-existing in notifications test, unrelated)

**Tasks:**
[x] T-14 [API] Create compositionRoot with provider selection
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/compositionRoot.ts.
            Reference analog: src/notifications/compositionRoot.ts:27-134 for shape and naming. Smaller in scope — no repos.
            
            ```
            import type { Redis } from 'ioredis';
            import type { EventBus } from '@/shared/messaging/eventBus';
            import type { Logger } from '@/shared/utils/logger';
            import { createMockFmcsaProvider } from './mockFmcsaProvider';
            import { createSaferWebApiProvider } from './saferWebApiProvider';
            import { createRedisCacheAdapter } from './redisCacheAdapter';
            import { createFmcsaService } from './fmcsaService';
            import type { FmcsaPort } from './fmcsaPort';
            import type { FmcsaService } from './types';
            
            type FmcsaProviderKind = 'mock' | 'safer-web';
            
            interface FmcsaModuleDeps {
              eventBus: EventBus;
              logger: Logger;
              redis: Redis;
              providerKind: FmcsaProviderKind;
            }
            
            export interface FmcsaModuleExports {
              service: FmcsaService;
            }
            
            const selectProvider = (kind: FmcsaProviderKind): FmcsaPort => {
              switch (kind) {
                case 'mock':       return createMockFmcsaProvider();
                case 'safer-web':  return createSaferWebApiProvider();
              }
            };
            
            export const createFmcsaModule = (deps: FmcsaModuleDeps): FmcsaModuleExports => {
              const provider = selectProvider(deps.providerKind);
              const cache = createRedisCacheAdapter({ redis: deps.redis, logger: deps.logger });
              const service = createFmcsaService({
                provider,
                cache,
                eventBus: deps.eventBus,
                logger: deps.logger,
              });
              return { service };
            };
            ```
            
            Note: redis IS injected into the composition root (not the service or cache adapter — those stay pure). This lets tests construct a module with a fake redis without monkeypatching the singleton.
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/compositionRoot.ts]
         └─ Depends on: T-06, T-08, T-09, T-12
         └─ Output:

[x] T-15 [API] Create module barrel index.ts (side-effect bootstrap)
         └─ Detail: Create hussle-app-dispatch-api/src/shared/fmcsa/index.ts.
            Reference analog: src/notifications/index.ts:1-end. Smaller scope — no router, no email/sms wiring.
            
            ```
            import { redisClient } from '@/shared/redisClient';
            import { sharedEventBus } from '@/shared/messaging';
            import { logger } from '@/shared/utils/logger';
            import { env } from '@/config/env';
            import { createFmcsaModule } from './compositionRoot';
            import type { FmcsaService } from './types';
            
            const fmcsaModule = createFmcsaModule({
              eventBus: sharedEventBus,
              logger,
              redis: redisClient,
              providerKind: env.FMCSA_PROVIDER,
            });
            
            export const fmcsaService: FmcsaService = fmcsaModule.service;
            export type { FmcsaSnapshot, FmcsaLookupResult, FmcsaLookupOpts, FmcsaIdentifier } from './types';
            ```
            
            Re-exports types for consumers. Does NOT re-export providers or the adapter — internals stay private.
            Check: `@/shared/messaging` index.ts exports `sharedEventBus` — if not, import from `'./shared/messaging/sharedEventBus'` directly.
         └─ Files: [hussle-app-dispatch-api/src/shared/fmcsa/index.ts]
         └─ Depends on: T-14
         └─ Output:

[x] T-16 [WIRE] Side-effect import in src/app.ts
         └─ Detail: Edit hussle-app-dispatch-api/src/app.ts. Existing side-effect imports are at L31-32:
            ```
            import './audit';
            import './notifications';
            ```
            Add a third line directly below:
            ```
            import '@/shared/fmcsa';
            ```
            Use the `@/shared/fmcsa` alias for consistency with the alias-based imports elsewhere. (audit and notifications use bare-relative because they're top-level feature modules; this one lives under shared, so the alias is the right form.)
            No other changes.
         └─ Files: [hussle-app-dispatch-api/src/app.ts]
         └─ Depends on: T-15
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Agent: review | Status: done | Depends on: US-01..US-07_

**Verification Checklist:**
- [x] AC #1: typecheck + scoped lint + lint:deps PASS on dispatch-api (pre-existing repo-wide lint errors in unrelated files: settlements, providers — NOT caused by this PR)
- [x] AC #2: Mock provider determinism + normalization (T-10: 12 mock tests; T-13: normalization group covers MC-1234567 / mc 1234567 / "  1234567  " / 1234567 all → same key)
- [x] AC #3: Cache hit on second lookup (T-13 cache-hit group + dual-key writes)
- [x] AC #4: Service publishes correct event per status with correlationId (T-13 events group; 5 cases)
- [x] AC #5: compositionRoot factory wires correctly; side-effect import triggers module bootstrap (compositionRoot.test.ts + app.ts grep)
- [x] AC #6: Coverage — module 94.53% lines / 93.05% branches; contract paths fmcsaService 95.52%, mockFmcsaProvider 100%, port contract test exists; only index.ts at 0% (intentional bootstrap)
- [x] AC #7: Provider switchable via FMCSA_PROVIDER (compositionRoot.test.ts safer-web wiring test)
- [x] Goal-backward: every must_haves.truth across US-01..US-07 maps to a test or compile-time guarantee
- [x] No dependency-cruiser violations introduced (3 pre-existing in notifications, unrelated)
- [x] No new `any`, `as`, or `!` introduced

**Tasks:**
[x] T-17 [VERIFY] Trace AC + must_haves across the module
         └─ Detail: Read-only review of all files produced in US-01..US-07. For each story's must_haves.truths, point to the test(s) or compile-time guarantee that enforces it. Run:
            - `cd hussle-app-dispatch-api && npm run validate`
            - `cd hussle-app-dispatch-api && npm test -- --coverage src/shared/fmcsa` and confirm line coverage ≥90%
            Produce a short report mapping each AC + each truth to evidence (file:line or test name). Flag any unresolved.
         └─ Files: []
         └─ Depends on: T-16, T-13, T-11, T-10, T-07
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 3 | 3 | 0 | 6/6 |
| US-02 | 1 | 1 | 0 | 3/3 |
| US-03 | 1 | 1 | 0 | 2/2 |
| US-04 | 2 | 2 | 0 | 4/4 |
| US-05 | 4 | 4 | 0 | 4/4 |
| US-06 | 2 | 2 | 0 | 7/7 |
| US-07 | 3 | 3 | 0 | 6/6 |
| VER-01 | 1 | 1 | 0 | 10/10 |
| **All** | **17** | **17** | **0** | **42/42** |
