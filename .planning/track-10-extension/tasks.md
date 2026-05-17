# Track 10 — Chrome Extension (DAT/Relay) Tasks
_Last updated: 2026-04-27 10:30_
_Plan: .planning/track-10-extension/plan.md_
_Contract: — (no contract.yaml; plan acts as spec)_
_Shared types: — (none — types live per-package)_

---

## US-01: Per-org API key + apiKeyAuth middleware
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Plan refs:** 10.BE.0

**Acceptance Criteria:**
- [x] `OrgApiKey` Prisma model exists (id, organizationId FK, name, keyHash, keyPrefix, lastUsedAt?, revokedAt?, createdAt, updatedAt) with index on `keyPrefix`
- [x] Migration `20260427000000_add_org_api_key` creates the table
- [x] `apiKeyService.generate({ organizationId, name })` returns `{ key, record }`; key format `fc_live_<24url-safe-chars>`; only the hash + prefix persist; plaintext key is returned exactly once
- [x] `apiKeyService.verify(key)` returns `{ organizationId }` for valid keys; returns null for invalid/revoked/missing; uses constant-time compare; updates `lastUsedAt` non-blocking
- [x] `apiKeyService.revoke(id)` sets `revokedAt`
- [x] `apiKeyService.listForOrg(organizationId)` returns prefix-only entries
- [x] `apiKeyAuth` middleware: parses `Authorization: Bearer fc_live_…`, sets `req.organizationId` + `req.authMethod = 'apiKey'` on success, 401 otherwise
- [x] `sessionOrApiKeyAuth` composite middleware: tries `apiKeyAuth` if header looks like `Bearer fc_live_…`, otherwise falls back to `appAuth`
- [x] `POST /api/v1/api-keys` (under `appAuth`) generates a key for `req.organizationId`; returns plaintext key once + record
- [x] `GET /api/v1/api-keys` (under `appAuth`) lists keys for org (prefix-only)
- [x] `DELETE /api/v1/api-keys/:id` (under `appAuth`) revokes a key (org-scoped)
- [x] `POST /api/v1/load-board/ingest` accepts `Authorization: Bearer fc_live_…` and rejects missing/invalid/revoked with 401 (uses `sessionOrApiKeyAuth`)
- [x] `GET /api/v1/load-board/ping` (under `sessionOrApiKeyAuth`) returns `{ organizationId, organizationName }`
- [x] Unit tests: `apiKeyService.test.ts` covering generate/verify/revoke and constant-time compare semantics
- [~] `cd hussle-app-dispatch-api && npm run validate` passes — net-zero new violations from this story; pre-existing failures in unrelated modules (loads, notifications, settlements, hussle-emails). Lint/typecheck/tests on the new files all pass.

**Story output (for downstream):**
- New endpoints: `POST/GET/DELETE /api/v1/api-keys` (session), `GET /api/v1/load-board/ping` (session OR `Bearer fc_live_…`), `POST /api/v1/load-board/ingest` (session OR `Bearer fc_live_…`).
- Key format: `fc_live_` + 24 url-safe chars (length 32). Prefix index = first 12 chars.
- Ping response shape: `{ data: { organizationId, organizationName } }` via `sendSingle`.
- API key create response: `{ data: { key, id, name, keyPrefix, lastUsedAt, revokedAt, createdAt, updatedAt } }` (plaintext key returned ONCE).
- Lazy-init exports: `apiKeyService` and `apiKeyRouter` from `src/api-keys/index.ts`. `apiKeyAuth` from `src/shared/middleware/apiKeyAuth.ts`. `sessionOrApiKeyAuth` from `src/shared/middleware/sessionOrApiKeyAuth.ts`.

**Tasks:**
[x] T-01 [DB] Add `OrgApiKey` model to Prisma schema
         └─ Detail: Edit `hussle-app-dispatch-api/prisma/schema.prisma`. Add model with fields: `id String @id @default(uuid())`, `organizationId String`, `name String`, `keyHash String`, `keyPrefix String`, `lastUsedAt DateTime?`, `revokedAt DateTime?`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`. Relation to Organization (back-relation `apiKeys OrgApiKey[]` on Organization). Index `@@index([keyPrefix])`. Add `@@map("OrgApiKey")` if needed for naming consistency.
         └─ Depends on: —
         └─ Output:

[x] T-02 [DB] Create migration `20260427000000_add_org_api_key`
         └─ Detail: Create `hussle-app-dispatch-api/prisma/migrations/20260427000000_add_org_api_key/migration.sql` with CREATE TABLE statement matching the new model and the `keyPrefix` index. Match the convention of other migrations in the repo (read a recent migration first).
         └─ Depends on: T-01
         └─ Output:

[x] T-03 [TYPES] Define module types and port
         └─ Detail: Create `src/api-keys/types/apiKeyTypes.ts` with `GenerateApiKeyInput`, `GenerateApiKeyResult` ({ key: string, record: ApiKeyRecord }), `ApiKeyRecord` (id, organizationId, name, keyPrefix, lastUsedAt, revokedAt, createdAt, updatedAt — no keyHash), `VerifyApiKeyResult` ({ organizationId: string }). Define `ApiKeyRepoPort` with `create`, `findByPrefix`, `findById`, `listByOrg`, `markRevoked`, `touchLastUsed`. Derive base type from Prisma `OrgApiKey` per CLAUDE.md type-derivation rule.
         └─ Depends on: T-01
         └─ Output:

[x] T-04 [DB] Implement `apiKeyRepositoryPrisma`
         └─ Detail: Create `src/api-keys/repositories/apiKeyRepositoryPrisma.ts` implementing `ApiKeyRepoPort`. `create(data)` inserts row. `findByPrefix(prefix)` returns first non-revoked row matching prefix. `findById(id)` returns by id. `listByOrg(orgId)` returns rows for org (no keyHash exposure — strip in repo or via a Prisma `select`). `markRevoked(id)` sets `revokedAt`. `touchLastUsed(id)` updates `lastUsedAt` (use `Promise.resolve()` from caller to make non-blocking).
         └─ Depends on: T-03
         └─ Output:

[x] T-05 [API] Implement `apiKeyService`
         └─ Detail: Create `src/api-keys/services/apiKeyService.ts` exporting `createApiKeyService(deps)` where deps = `{ apiKeyRepo, logger }`. Methods:
            - `generate({ organizationId, name })` — generate 24 url-safe random chars (use `crypto.randomBytes(18).toString('base64url')` truncated to 24), prefix `fc_live_`, hash full key with SHA-256 (`crypto.createHash('sha256').update(key).digest('hex')`), persist `{ keyHash, keyPrefix: key.slice(0, 12), organizationId, name }`, return `{ key, record }`. Plaintext key is returned ONCE; never logged.
            - `verify(key)` — early return null if key doesn't start with `fc_live_`. Slice prefix (first 12 chars), call `findByPrefix`, hash input, `crypto.timingSafeEqual` against stored hash. If match and not revoked → fire-and-forget `touchLastUsed(record.id)` (catch + log error, do NOT block) → return `{ organizationId: record.organizationId }`. Else null.
            - `revoke(id)` — calls `markRevoked`.
            - `listForOrg(organizationId)` — proxy to `listByOrg`.
            Use typed errors from `shared/errors/`: `NotFoundError`, `ForbiddenError` if org mismatch on revoke.
         └─ Depends on: T-04
         └─ Output:

[x] T-06 [AUTH] Implement `apiKeyAuth` middleware
         └─ Detail: Create `src/shared/middleware/apiKeyAuth.ts`. Receives `apiKeyService` via factory: `export const createApiKeyAuth = (apiKeyService: ApiKeyService) => async (req, res, next) => { ... }`. Read `Authorization: Bearer <key>`. If missing or not `fc_live_…` prefix, throw `UnauthorizedError`. Call `apiKeyService.verify(key)`. On null → throw `UnauthorizedError`. On success, set `req.organizationId = result.organizationId` and `req.authMethod = 'apiKey'`. Call `next()`. Add `authMethod` to `express.d.ts` augmentation.
         └─ Depends on: T-05
         └─ Output:

[x] T-07 [AUTH] Implement `sessionOrApiKeyAuth` composite middleware
         └─ Detail: Create `src/shared/middleware/sessionOrApiKeyAuth.ts`. Receives `apiKeyAuth` and re-uses existing `appAuth`. Pseudocode: read Authorization header. If header starts with `Bearer fc_live_` → delegate to `apiKeyAuth`. Else → delegate to `appAuth`. Both middlewares set `req.organizationId`. Export factory `createSessionOrApiKeyAuth(apiKeyAuth)`.
         └─ Depends on: T-06
         └─ Output:

[x] T-08 [API] Build api-keys module: validators, mappers, transformers, controllers, routes, compositionRoot
         └─ Detail:
            - `src/api-keys/validators/apiKeyValidators.ts` — `createApiKeyValidator` (body.name required, 1-128 chars), `revokeApiKeyValidator` (params.id uuid).
            - `src/api-keys/controllers/mappers/createApiKeyMapper.ts` — `(req) => ({ organizationId: req.organizationId, name: req.body.name })`.
            - `src/api-keys/controllers/transformers/apiKeyTransformer.ts` — `apiKeyRecordTransformer(record)` returns id, name, keyPrefix, lastUsedAt, revokedAt, createdAt, updatedAt as ISO. `createApiKeyTransformer({ key, record })` returns `{ key, ...recordFields }` — INCLUDES plaintext key.
            - `src/api-keys/controllers/apiKeyControllers.ts` — `create`, `list`, `revoke` controllers using mappers/transformers + `sendSingle`/`sendList`.
            - `src/api-keys/routes/apiKeyRoutes.ts` — Router with `POST /` (appAuth + validate(createApiKeyValidator)), `GET /` (appAuth), `DELETE /:id` (appAuth + validate(revokeApiKeyValidator)).
            - `src/api-keys/compositionRoot.ts` — `createApiKeysModule({ prismaClient, logger })` wires repo → service → controllers; returns `{ controllers, service }` (service exposed for use by middleware factory).
         └─ Depends on: T-05
         └─ Output:

[x] T-09 [WIRE] Wire api-keys module via its own `index.ts`; expose `apiKeyAuth` lazily
         └─ Detail: This codebase uses per-module `index.ts` self-wiring (see `hussle-app-dispatch-api/src/load-board/index.ts` and `appAuth`'s lazy init pattern in `authenticateUser.ts`). Do NOT create a top-level composition root.
            - Create `src/api-keys/index.ts`: build the module via `createApiKeysModule({ prismaClient, logger })` (using the shared `prisma` client — find how other modules import it; e.g. `import { prisma } from '@/shared/prisma'` or similar). Export `apiKeyRouter = apiKeyRoutes(module.controllers)` plus the wired `apiKeyService` for middleware to consume.
            - Add `apiKeyAuth` and `sessionOrApiKeyAuth` exports to `src/shared/middleware/` files using the same lazy-cache pattern as `appAuth`: an internal `getApiKeyAuth()` that imports the api-keys module's wired service on first use, then a thin async middleware function that delegates.
            - Update `src/app.ts`: import `apiKeyRouter` and mount at `/api/v1/api-keys`.
         └─ Depends on: T-07, T-08
         └─ Output:

[x] T-10 [API] Apply `sessionOrApiKeyAuth` to ingest + add `GET /load-board/ping`
         └─ Detail:
            - Edit `src/load-board/routes/loadBoardRoutes.ts` to receive `sessionOrApiKeyAuth` from caller (function signature: `loadBoardRoutes(controllers, { sessionOrApiKeyAuth })`). Replace `appAuth` on `POST /ingest` and on the new `GET /ping` route. Keep `appAuth` on the GET feed/detail/clear routes (they remain session-only).
            - Add `controllers.ping` — controller reads `req.organizationId`, queries org name via existing org query (find appropriate query in compositionRoot or add one). Returns `{ organizationId, organizationName }` via `sendSingle`.
            - If org-name lookup needs a new query, add it to the orgs/auth module and pass through composition root.
         └─ Depends on: T-09
         └─ Output:

[x] T-11 [TEST] Unit tests for apiKeyService
         └─ Detail: Create `src/api-keys/__tests__/apiKeyService.test.ts`. Cases:
            - `generate` returns `fc_live_`-prefixed plaintext key + record; persists hash not plaintext; keyPrefix is first 12 chars of key
            - `verify` returns `{ organizationId }` for matching key
            - `verify` returns null for unknown prefix
            - `verify` returns null for matching prefix but mismatched hash
            - `verify` returns null for revoked key
            - `verify` does not block on `touchLastUsed` failure
            - `revoke` sets revokedAt
            - `listForOrg` returns prefix-only records
            Use AAA pattern, jest.clearAllMocks in beforeEach.
         └─ Depends on: T-05
         └─ Output:

[x] T-12 [VALIDATE] Run validate
         └─ Detail: Run `cd hussle-app-dispatch-api && npm run validate > /tmp/build-us01-validate.log 2>&1`. Report pass/fail. Fix any failures.
         └─ Depends on: T-11, T-10
         └─ Output:

---

## US-02: Strict ingest validator (DAT + Relay discriminated schemas)
_Priority: P0 | Services: dispatch-api | Agent: backend (orchestrator-direct) | Status: done_

**Plan refs:** 10.BE.1

**Acceptance Criteria:**
- [x] `POST /load-board/ingest` rejects DAT loads missing `matchId`, origin/destination state with 400
- [x] `POST /load-board/ingest` rejects Relay loads missing `id`, start/end state, or with empty `loads[]` with 400
- [x] Schemas allow unknown fields (DAT/Relay drift tolerance) — `.unknown(true)` on both schemas
- [x] Existing valid DAT and Relay payloads still pass — covered by validator tests

**Story output (for downstream):**
- Validator file: `src/load-board/validators/loadBoardValidators.ts` rewritten with `datLoadSchema` + `relayLoadSchema` + discriminated `ingestValidator`. `loads.max(100)` retained.
- Test file: `src/load-board/__tests__/loadBoardValidators.test.ts` — 11 cases, all pass.

**Tasks:**
[x] T-13 [API] Replace `ingestValidator` with discriminated schemas
         └─ Detail: Rewrite `src/load-board/validators/loadBoardValidators.ts` `ingestValidator` per plan §10.BE.1. Define `datLoadSchema` (matchId required, origin/destination objects with state required and city nullable, equipmentTypeCode nullable, `.unknown(true)`), `relayLoadSchema` (id required, startLocation/endLocation with state required + city nullable, loads array min 1, `.unknown(true)`), and a top-level `body.source` discriminator using `yup.array().when('source', ...)`. Keep `max(100)`. Other validators in the file stay unchanged.
         └─ Depends on: —
         └─ Output:

[x] T-14 [TEST] Update existing ingest tests; add discriminator coverage
         └─ Detail: Find existing tests under `src/load-board/__tests__/` that exercise the validator (likely `loadBoardController` or integration tests). Add cases:
            - Valid DAT payload passes
            - Valid Relay payload passes
            - DAT load without `matchId` → 400
            - DAT load without `origin.state` → 400
            - Relay load without `id` → 400
            - Relay load with empty `loads[]` → 400
            - Unknown fields on a valid DAT load → still passes
         └─ Depends on: T-13
         └─ Output:

[x] T-15 [VALIDATE] Run validate
         └─ Detail: `cd hussle-app-dispatch-api && npm run validate > /tmp/build-us02-validate.log 2>&1`.
         └─ Depends on: T-14
         └─ Output:

---

## US-03: Per-record dedup with `{ ingested, skipped }` response
_Priority: P0 | Services: dispatch-api | Agent: backend (orchestrator-direct) | Status: done_

**Plan refs:** 10.BE.2

**Acceptance Criteria:**
- [x] Same-payload re-POST returns `{ ingested: 0, skipped: N }` — covered by dedup test
- [x] New + duplicate mix returns split counts; new loads still added to Redis — covered by dedup test
- [x] Existing key shape (`loadboard:load:<orgId>:<source>:<sourceId>`) and TTL logic untouched — adapter reuses `loadKey`/`calculateLoadTtl`
- [x] Service response shape changes from `{ count }` to `{ ingested, skipped, total }`
- [x] `loadBoardService.dedup.test.ts` covers per-record dedup behaviour — 6 cases pass
- [x] Existing `relayMapper.test.ts` and `datMapper.test.ts` still pass — 36/36 related tests green

**Story output (for downstream):**
- New port method: `addIfAbsent(orgId, source, load): Promise<boolean>` on `LoadBoardRedisPort`. `snapshotReplace` deprecated but retained on the port.
- Redis adapter uses `SET … EX … NX` for atomic insert; SADD only after successful set.
- API response shape: `{ data: { ingested, skipped, total } }` from `POST /load-board/ingest`.
- `updateMeta` now receives newly-added count (not total payload count).

**Tasks:**
[x] T-16 [API] Add `addIfAbsent` to `LoadBoardRedisPort` + adapter
         └─ Detail:
            - Edit `src/load-board/types/loadBoardPorts.ts`: add `addIfAbsent(orgId, source, load): Promise<boolean>` to `LoadBoardRedisPort` (returns true if newly added, false if a load already exists for that key). Keep `snapshotReplace` for backward compat but mark deprecated in a leading comment.
            - Edit `src/load-board/adapters/loadBoardRedisAdapter.ts`: implement `addIfAbsent` using `redis.set(key, value, 'EX', ttl, 'NX')` (NX = only set if not exists). On `null` reply (key existed) → return false. Otherwise SADD source set + return true. Keep `calculateLoadTtl` and key shape untouched.
         └─ Depends on: —
         └─ Output:

[x] T-17 [API] Refactor `loadBoardService.ingest` to per-record dedup
         └─ Detail: Edit `src/load-board/services/loadBoardService.ts`:
            - Update `LoadBoardService.ingest` signature: returns `Promise<{ ingested: number; skipped: number; total: number }>`.
            - In implementation: map loads as before. Iterate mapped loads: `const added = await deps.redisPort.addIfAbsent(orgId, source, load);` increment `ingested` or `skipped` accordingly. Track newly-added load count for `updateMeta`.
            - Continue to call `updateMeta` with the cumulative count of **newly added** loads (or, if simpler, the total active count via a SCARD-style query — preserve existing meta behaviour as closely as possible; the simpler choice is to pass `ingested` and document that meta reflects last-batch additions only).
            - Update `IngestServiceInput` / response types in `src/load-board/types/loadBoardTypes.ts` if needed.
            - Update the controller transformer in `src/load-board/controllers/transformers/` (find the ingest transformer) to expose `ingested`, `skipped`, `total` instead of `count`.
         └─ Depends on: T-16
         └─ Output:

[x] T-18 [TEST] Add `loadBoardService.dedup.test.ts` + update existing tests
         └─ Detail:
            - Create `src/load-board/__tests__/loadBoardService.dedup.test.ts` mocking `LoadBoardRedisPort` (`addIfAbsent` returning true/false based on input). Cases:
              - All-new payload returns `{ ingested: N, skipped: 0, total: N }`
              - All-duplicate payload returns `{ ingested: 0, skipped: N, total: N }`
              - Mixed payload returns split counts
              - DAT and Relay sources both exercised
            - Update any existing `loadBoardService` test that asserts on `{ count }` to use the new shape.
            - `relayMapper.test.ts` / `datMapper.test.ts` stay unchanged unless they break.
         └─ Depends on: T-17
         └─ Output:

[x] T-19 [VALIDATE] Run validate
         └─ Detail: `cd hussle-app-dispatch-api && npm run validate > /tmp/build-us03-validate.log 2>&1`.
         └─ Depends on: T-18
         └─ Output:

---

## US-04: Extension foundation — bundled background.ts + build-time API_URL + manifest
_Priority: P0 | Services: extension (dat-load-scraper) | Agent: frontend (orchestrator-direct) | Status: done_

**Plan refs:** 10.EXT.2, 10.EXT.6

**Acceptance Criteria:**
- [x] `webpack.common.js` has DefinePlugin substituting `process.env.API_URL` (default `http://localhost:3001`)
- [x] `background.ts` is the canonical service-worker source; `background.js` is deleted
- [x] Webpack bundles `background.ts` → `dist/background.js`
- [x] `package.json` has `build:local`, `build:staging`, `build:prod` scripts pointing to correct `API_URL`
- [x] No hardcoded `localhost:3001` strings in bundled output for staging/prod builds — verified
- [x] `manifest.json` `host_permissions` includes both `http://localhost:3001/*` (dev) and `https://*.fleetcommand.app/*` (staging/prod)
- [x] All `chrome.runtime.onMessage` cases from old `background.js` (popupInit, RELAY_LOAD_COUNT, PUSH_RELAY_LOADS, PUSH_DAT_LOADS) preserved in `background.ts`

**Story output (for downstream):**
- `background.ts` exports `pushLoadsToApi` (named export) for testability. Function reads `process.env.API_URL` at compile time (DefinePlugin substitution).
- Per-source throttle map: `lastPushTimes: { relay: 0, dat: 0 }` (in-memory, resets on service-worker restart). Default interval 10s; configurable via `chrome.storage.local.pushIntervalSeconds`.
- Reads ingest response as `{ data: { ingested?: number } }` and surfaces `data.ingested` as `count` (still backward compatible with `loads.length` fallback if API returns the old shape).
- US-05 will add `Authorization` header + 401-clear behaviour. US-06 will add `failedCount`/`lastError`/`RETRY_LAST_PAYLOAD` plumbing.
- `tsconfig.json` excludes `src/utils/s3.ts` (pre-existing dead code with hardcoded AWS creds — flagged in CLAUDE.md known issues; needed exclude to unblock compile).

**Tasks:**
[x] T-20 [INFRA] Add webpack DefinePlugin for `process.env.API_URL`
         └─ Detail: Edit `dat-load-scraper/webpack.common.js`. Add `const webpack = require('webpack');` at top. In `plugins` array add: `new webpack.DefinePlugin({ 'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3001') })`. Add `background` entry to `entry`: `background: path.resolve('src/contentScript/background.ts')`. Remove the CopyPlugin pattern that copies `background.js` to dist/background.js (webpack now produces it).
         └─ Depends on: —
         └─ Output:

[x] T-21 [EXT] Consolidate background.ts; port logic from background.js; delete background.js
         └─ Detail:
            - Replace contents of `dat-load-scraper/src/contentScript/background.ts` with a TS port of `background.js`. Keep the per-source throttle map (`lastPushTimes: Record<string, number>`). Implement `pushLoadsToApi(source, loads)` using `process.env.API_URL` for the URL: `` `${process.env.API_URL}/api/v1/load-board/ingest` ``. DO NOT add Authorization header here yet — that's US-05. Keep all four message cases from background.js (`popupInit`, `RELAY_LOAD_COUNT`, `PUSH_RELAY_LOADS`, `PUSH_DAT_LOADS`).
            - Use proper TypeScript: typed message discriminated union (define `BackgroundMessage` type), no `any`, no eslint-disable. Replace `var` with `const`/`let`. Remove the commented-out skeleton at the top of the file.
            - Delete `dat-load-scraper/src/contentScript/background.js`.
         └─ Depends on: T-20
         └─ Output:

[x] T-22 [INFRA] Update `package.json` build scripts
         └─ Detail: Edit `dat-load-scraper/package.json` `scripts`:
            - `build:local`: `webpack --progress --config webpack.prod.js` (no env override)
            - `build:staging`: `cross-env API_URL=https://api-staging.fleetcommand.app webpack --progress --config webpack.prod.js`
            - `build:prod`: `cross-env API_URL=https://api.fleetcommand.app webpack --progress --config webpack.prod.js`
            - Keep `dev` script unchanged.
            - Drop `--watch` from these named build scripts (production builds shouldn't watch).
            - Add `cross-env` to devDependencies.
         └─ Depends on: T-21
         └─ Output:

[x] T-23 [INFRA] Widen manifest host_permissions
         └─ Detail: Edit `dat-load-scraper/src/static/manifest.json`. `host_permissions` becomes `["http://localhost:3001/*", "https://*.fleetcommand.app/*"]`.
         └─ Depends on: —
         └─ Output:

[x] T-24 [VERIFY] Build extension locally and confirm bundle
         └─ Detail: Run `cd dat-load-scraper && npm install > /tmp/build-us04-install.log 2>&1 && npx webpack --config webpack.prod.js > /tmp/build-us04-build.log 2>&1`. Confirm `dist/background.js` exists. Grep `dist/background.js` for `localhost:3001` — should be present (default build). Then `API_URL=https://api-staging.fleetcommand.app npx webpack --config webpack.prod.js > /tmp/build-us04-build-staging.log 2>&1` — confirm bundle now contains `api-staging.fleetcommand.app` and NOT `localhost:3001`.
         └─ Depends on: T-22, T-23
         └─ Output:

---

## US-05: Extension API key handling — storage + Authorization header + popup entry + verification ping
_Priority: P0 | Services: extension (dat-load-scraper) | Agent: frontend (orchestrator-direct) | Status: done_

**Plan refs:** 10.EXT.0, 10.EXT.0b

**Acceptance Criteria:**
- [x] Extension stores `apiKey` in `chrome.storage.local` — via `apiKeyStorage.ts`
- [x] Every ingest POST includes `Authorization: Bearer <apiKey>` — verified in bundle
- [x] Missing key blocks ingest entirely; surfaces toast/log "Set API key in extension popup" — sets `lastError` in storage and returns early
- [x] 401 response clears stored key + sets a `lastError` "API key invalid — paste a new one"
- [x] Popup has an API key input (password style); save persists to storage
- [x] On save (or on popup mount), popup pings `GET /load-board/ping` and shows org name on success; shows error on failure
- [x] Key is never displayed in plaintext after save — only `••••••••<last4>` via `maskKey`

**Story output (for downstream):**
- `apiKeyStorage.ts` exports `getApiKey/setApiKey/clearApiKey/maskKey`. Storage key: `apiKey`.
- `verifyApiKey.ts` exports `verifyApiKey(key)` returning `{ organizationId, organizationName }` or `{ error }`. `isFailure` type guard.
- Background `pushLoadsToApi` reads key first, returns `{ ok: false, error: 'No API key' }` if absent (also writes `lastError` to storage). On 401 → clears key + writes `lastError`. On success → clears `lastError`.
- Popup mounts, loads stored key, runs verification; allows password-style save; "Disconnect" clears storage. The old email/password login is fully removed.

**Tasks:**
[x] T-25 [EXT] Add `apiKeyStorage` module
         └─ Detail: Create `dat-load-scraper/src/popup/apiKeyStorage.ts` exporting `getApiKey(): Promise<string | null>`, `setApiKey(key: string): Promise<void>`, `clearApiKey(): Promise<void>`. Wraps `chrome.storage.local.get/set/remove` with the key `apiKey`. Storage is shared between popup and background — same module imported in both.
         └─ Depends on: —
         └─ Output:

[x] T-26 [EXT] Wire Authorization header in `background.ts pushLoadsToApi`
         └─ Detail: Edit `src/contentScript/background.ts`. In `pushLoadsToApi`:
            - Import `getApiKey, clearApiKey` from `../popup/apiKeyStorage`.
            - Read api key first; if null → `chrome.storage.local.set({ lastError: 'Set API key in extension popup' })` and return `{ ok: false, error: 'No API key' }`.
            - Add `'Authorization': \`Bearer ${apiKey}\`` to fetch headers.
            - If response.status === 401 → `await clearApiKey(); await chrome.storage.local.set({ lastError: 'API key invalid — paste a new one' });` then return `{ ok: false, error: 'Invalid API key' }`.
            - On success, clear `lastError` (`chrome.storage.local.remove('lastError')`).
         └─ Depends on: T-25, T-21
         └─ Output:

[x] T-27 [EXT] Popup: API key input field + save flow
         └─ Detail: Edit `dat-load-scraper/src/popup/index.tsx`:
            - Replace the `authToken`-based login section with an API-key section.
            - State: `apiKey` (loaded last-4 only after save), `keyInput` (controlled input), `orgName`, `pingError`, `pingLoading`.
            - On mount, load existing api key via `getApiKey()`. If present, run verification ping (T-28) to populate `orgName`.
            - "FleetCommand API Key" password-style input + "Save" button. On click: `setApiKey(keyInput)`, run ping, display result.
            - Display when connected: "Connected to: {orgName}" + key shown as `••••••••{last4}`. Add a "Disconnect" button calling `clearApiKey` and resetting state.
            - Remove the old email/password login UI entirely.
         └─ Depends on: T-25
         └─ Output:

[x] T-28 [EXT] Popup verification ping helper
         └─ Detail: Add `dat-load-scraper/src/popup/verifyApiKey.ts` exporting `verifyApiKey(key: string): Promise<{ organizationId: string; organizationName: string } | { error: string }>`. Calls `${process.env.API_URL}/api/v1/load-board/ping` with `Authorization: Bearer <key>`. On 200 → returns parsed `{ organizationId, organizationName }` from `data` envelope. On 401 → `{ error: 'Invalid API key' }`. On network error → `{ error: 'Cannot reach API' }`.
         └─ Depends on: T-25
         └─ Output:

[x] T-29 [VERIFY] Build extension and inspect popup
         └─ Detail: Run `cd dat-load-scraper && npx webpack --config webpack.prod.js > /tmp/build-us05-build.log 2>&1`. Confirm `dist/popup.html`, `dist/popup.js`, `dist/background.js` all exist with no build errors. Skip manual chrome verification — that's covered by manual verification in plan §10.V.1.
         └─ Depends on: T-26, T-27, T-28
         └─ Output:

---

## US-06: Extension error surfacing UI (badge + retry button)
_Priority: P1 | Services: extension (dat-load-scraper) | Agent: frontend (orchestrator-direct) | Status: done_

**Plan refs:** 10.EXT.3

**Acceptance Criteria:**
- [x] On ingest failure (network, 4xx, 5xx): `failedCount` increments in `chrome.storage.local`; `lastFailedPayload` stored — via `recordFailure()`
- [x] Badge shows `failedCount` with red background (#D32F2F) when > 0
- [x] Popup shows "Last error: {timestamp} — {message}" + "Retry now" button
- [x] Retry re-sends `lastFailedPayload` — `RETRY_LAST_PAYLOAD` message handler resets throttle and re-runs `pushLoadsToApi`
- [x] Successful ingest clears badge + clears `lastFailedPayload` — via `clearFailureState()`

**Story output (for downstream):**
- New message type: `RETRY_LAST_PAYLOAD` (no payload). Returns `{ ok, error?, count? }`.
- Storage shape change: `lastError` is now `{ message: string; timestamp: number }` (was a bare string in US-05).
- New exports from `background.ts`: `pushLoadsToApi`, `retryLastPayload`.
- Popup hides error row when `failedCount === 0`. Network errors caught around fetch and routed through `recordFailure`.
- 401 path does NOT increment `failedCount` — it clears the api key and writes its own `lastError`. Auth issues are distinct from transient ingest failures.

**Tasks:**
[x] T-30 [EXT] Track failedCount + lastFailedPayload in background.ts
         └─ Detail: Edit `src/contentScript/background.ts`:
            - On any non-ok response or thrown error in `pushLoadsToApi`, read current `failedCount` (default 0) from storage, set `failedCount + 1`. Set `lastFailedPayload: { source, loads, timestamp: Date.now() }`. Set `lastError: { message, timestamp: Date.now() }`.
            - `chrome.action.setBadgeText({ text: String(newFailedCount) })` and `chrome.action.setBadgeBackgroundColor({ color: '#D32F2F' })`.
            - On success, clear: `chrome.storage.local.remove(['lastFailedPayload', 'lastError', 'failedCount'])` and `chrome.action.setBadgeText({ text: '' })`.
            - Add a new message handler `RETRY_LAST_PAYLOAD`: reads `lastFailedPayload`, calls `pushLoadsToApi(source, loads)` with stored data.
         └─ Depends on: T-26
         └─ Output:

[x] T-31 [EXT] Popup: last-error row + Retry button
         └─ Detail: Edit `dat-load-scraper/src/popup/index.tsx`. Read `lastError` and `failedCount` from storage on mount + via `chrome.storage.onChanged`. Render a section when `failedCount > 0`: red text "Last error: {time} — {message}", a "Retry now" button that does `chrome.runtime.sendMessage({ type: 'RETRY_LAST_PAYLOAD' })`. Hide section when `failedCount === 0`.
         └─ Depends on: T-30, T-27
         └─ Output:

[x] T-32 [VERIFY] Build extension and confirm bundle
         └─ Detail: `cd dat-load-scraper && npx webpack --config webpack.prod.js > /tmp/build-us06-build.log 2>&1`. No build errors expected.
         └─ Depends on: T-31
         └─ Output:

---

## US-07: Extension dependency cleanup + Jest test setup + tests
_Priority: P1 | Services: extension (dat-load-scraper) | Agent: frontend | Status: done_

**Plan refs:** 10.EXT.4, 10.EXT.5

**Acceptance Criteria:**
- [x] `yup` and `ts-node` removed from `dat-load-scraper/package.json`; `package-lock.json` regenerated
- [x] `jest`, `ts-jest`, `@types/jest`, `jest-environment-jsdom`, `@types/chrome` wired
- [x] `dat-load-scraper/jest.config.js` exists, uses jsdom, ts-jest preset
- [x] `package.json` `test` script: `jest`
- [x] Tests pass: `pushLoadsToApi.test.ts` (8), `removeDuplicates.test.ts` (6), `relayMapper.test.ts` (2), `datHandler.test.ts` (2), `messageRouting.test.ts` (6) — 24/24 green

**Story output (for downstream):**
- `npm test` exit 0; 5 suites / 24 tests.
- chrome shim in `src/__tests__/setup.ts` exposes `__resetChromeMock` global for per-test isolation; polyfills `setImmediate` for jsdom.
- ts-jest config tolerates pre-existing `any` codes (7006/7019/7034/7053) in untested utility files.
- Tests use `jest.resetModules()` + dynamic require to flush module-scoped throttle map between cases.
- Used a minimal `FakeResponse` instead of jsdom's missing `Response` constructor.

**Tasks:**
[x] T-33 [DEP] Remove `yup` and `ts-node`; add jest deps
         └─ Detail: Edit `dat-load-scraper/package.json`:
            - `dependencies`: drop `yup`, drop `ts-node`.
            - `devDependencies`: add `jest`, `ts-jest`, `@types/jest`, `jest-environment-jsdom`. Use compatible versions (jest 29.x, ts-jest 29.x).
            - `scripts.test`: `jest`
            - Run `cd dat-load-scraper && npm install > /tmp/build-us07-install.log 2>&1`.
         └─ Depends on: —
         └─ Output:

[x] T-34 [INFRA] Create `jest.config.js`
         └─ Detail: Create `dat-load-scraper/jest.config.js`:
            ```js
            module.exports = {
              preset: 'ts-jest',
              testEnvironment: 'jsdom',
              testMatch: ['**/__tests__/**/*.test.ts'],
              moduleFileExtensions: ['ts', 'tsx', 'js'],
              setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
            };
            ```
            Create `src/__tests__/setup.ts` that mocks `chrome.storage.local`, `chrome.runtime.onMessage`, `chrome.action.setBadgeText`, `chrome.action.setBadgeBackgroundColor`. Use a global `chrome` shim with jest.fn() mocks.
         └─ Depends on: T-33
         └─ Output:

[x] T-35 [TEST] `pushLoadsToApi.test.ts`
         └─ Detail: Create `dat-load-scraper/src/__tests__/pushLoadsToApi.test.ts`. To make `pushLoadsToApi` testable, export it from `background.ts` (named export). Cases:
            - Sends `Authorization: Bearer <key>` when stored key present (mock `getApiKey`)
            - Returns `{ ok: false, error: 'No API key' }` when key missing
            - Throttles second call within interval window
            - On 401 → clears stored key + sets `lastError`
            - On network failure → increments `failedCount` + stores `lastFailedPayload`
            - On success → clears `failedCount`, `lastFailedPayload`, `lastError`
            Mock `global.fetch` per case.
         └─ Depends on: T-34, T-30
         └─ Output:

[x] T-36 [TEST] `removeDuplicates.test.ts`
         └─ Detail: Create `dat-load-scraper/src/__tests__/removeDuplicates.test.ts`. Port any existing inline test from `src/utils/removeDuplicates.ts`. Cases: empty input returns empty; deduplicates by sourceId; preserves order; handles duplicates within and across batches (whatever the actual function does — read it first).
         └─ Depends on: T-34
         └─ Output:

[x] T-37 [TEST] `relayMapper.test.ts`
         └─ Detail: Create `dat-load-scraper/src/__tests__/relayMapper.test.ts`. NOTE: the relay mapping in this extension is a thin pass-through (workOpportunities → ingest payload). Test the shape transformation in `background.ts`'s `PUSH_RELAY_LOADS` handler — assert `loads` array equals `message.data.workOpportunities`, `source` is `'relay'`. If the handler does no transformation, test the storage/badge updates instead.
         └─ Depends on: T-34
         └─ Output:

[x] T-38 [TEST] `datHandler.test.ts`
         └─ Detail: Create `dat-load-scraper/src/__tests__/datHandler.test.ts`. Read `dat-load-scraper/src/contentScript/contentScript.ts` to find the DAT XHR-intercept handler. Feed a sample DAT XHR response object (matchDetails + similarMatchDetails arrays). Assert the combined output array matches expected shape, length, and field mapping.
         └─ Depends on: T-34
         └─ Output:

[x] T-39 [TEST] `messageRouting.test.ts`
         └─ Detail: Create `dat-load-scraper/src/__tests__/messageRouting.test.ts`. Exercise `chrome.runtime.onMessage` listener registered in `background.ts`. Send `popupInit`, `RELAY_LOAD_COUNT`, `PUSH_RELAY_LOADS`, `PUSH_DAT_LOADS`, `RETRY_LAST_PAYLOAD`, and an unknown type. Assert correct branch runs (mock `pushLoadsToApi` to spy) + correct sendResponse called.
         └─ Depends on: T-34, T-30
         └─ Output:

[x] T-40 [VALIDATE] Run jest
         └─ Detail: `cd dat-load-scraper && npm test > /tmp/build-us07-test.log 2>&1`. Report pass/fail.
         └─ Depends on: T-35, T-36, T-37, T-38, T-39
         └─ Output:

---

## US-08: Update mvp-plan + packages.json
_Priority: P2 | Services: docs | Agent: trivial | Status: done_

**Plan refs:** plan footer, audit findings

**Acceptance Criteria:**
- [x] `.planning/codebase/packages.json` extension entry: `path` is `dat-load-scraper/`, `name` is `dat-load-scraper`, `stack` includes `webpack` (not `esbuild`), `commands.test` references `dat-load-scraper`
- [x] `docs/tasks/mvp-plan.md` Track 10 footer updated: stale `cheerio`/`ioredis` bullet removed; Track 10 task list rewritten to reflect refined scope (10.BE.0 + 10.EXT.0/0b/6 added, all in-scope items checked, 10.V.1 still pending manual verification)

**Tasks:**
[x] T-41 [DOCS] Fix packages.json extension entry
         └─ Detail: Edit `.planning/codebase/packages.json`. Replace the `extension` package entry with: serviceKey `extension`, name `dat-load-scraper`, path `dat-load-scraper/`, type `library`, stack `["chrome-extension", "webpack", "react"]`, commands updated: `test: "cd dat-load-scraper && npx jest"`, `build: "cd dat-load-scraper && npx webpack --config webpack.prod.js"`, `testRelated: "cd dat-load-scraper && npx jest --findRelatedTests"`, lint/typecheck null.
         └─ Depends on: —
         └─ Output:

[x] T-42 [DOCS] Update mvp-plan Track 10 footer
         └─ Detail: Edit `docs/tasks/mvp-plan.md` Track 10 section. Remove or correct the bullet about `cheerio`/`ioredis`. Add a one-line note: "Track 10 reframed 2026-04-26 — see .planning/track-10-extension/plan.md". Do not rewrite the whole section.
         └─ Depends on: —
         └─ Output:

---

## INT-01: Wire extension ↔ dispatch-api integration
_Auto-generated | Services: dispatch-api, extension | Agent: review (orchestrator-direct) | Status: done_

**Verification Checklist:**
- [x] Extension sends `Authorization: Bearer fc_live_…` on every `/load-board/ingest` POST — `background.ts:108` adds `Authorization: \`Bearer ${apiKey}\``; key reader is `getApiKey()` from `apiKeyStorage.ts`
- [x] Extension's URL uses `process.env.API_URL` substitution — `background.ts:7 const API_URL = process.env.API_URL;` substituted at build time by `webpack.common.js` `DefinePlugin`. Default `'http://localhost:3001'` matches API dev port (`hussle-app-dispatch-api/.env.example`).
- [x] Backend `sessionOrApiKeyAuth` accepts `Bearer fc_live_…` — `sessionOrApiKeyAuth.ts` checks `header?.startsWith('Bearer fc_live_')` and routes to `apiKeyAuth`; otherwise delegates to `appAuth`. Applied to `POST /load-board/ingest` and `GET /load-board/ping` only.
- [x] Extension `verifyApiKey` calls `GET /load-board/ping` and parses `{ organizationId, organizationName }` from `{ data }` envelope — `verifyApiKey.ts:22-44` reads `body.data.organizationId` and `body.data.organizationName`. Backend ping controller uses `sendSingle(res, { organizationId: org.id, organizationName: org.name })` which produces `{ data: ... }`. **MATCH.**
- [x] DAT load shape — Extension `contentScript.ts` builds `loads = [...matchDetails, ...similarMatchDetails]`. `removeDuplicates.ts` shows DAT records have `matchId`, `origin: { state, city, ... }`, `destination: { state, city, ... }`, `equipmentTypeCode`. `datLoadSchema` requires exactly these (origin/destination state required, city nullable). **MATCH.**
- [x] Relay load shape — Extension passes `data.workOpportunities` from the Amazon Relay API. The Relay API records have `id`, `startLocation: { city, state, ... }`, `endLocation: { city, state, ... }`, `loads: [...]`. `relayLoadSchema` requires exactly these. **MATCH.**
- [x] Extension reads `{ ingested, skipped, total }` — `background.ts:142 result.data?.ingested ?? loads.length`. Forward-compatible: surfaces `ingested` when present, falls back to total. The popup error UI doesn't read this directly. Acceptable — full breakdown is observable via API logs and is mainly for AC-6 verification.
- [x] 401 path — `background.ts:118-124` on 401 calls `clearApiKey()` and writes `lastError` of "API key invalid — paste a new one in the extension popup". Popup `chrome.storage.onChanged` listener clears `storedKey` and `orgName` state when `apiKey` is removed.

**Status: ALL CHECKS PASS** — no integration gaps requiring additional WIRE tasks.

**Tasks:**
[x] T-43 [WIRE] Verify extension ↔ API integration
         └─ Detail: Read `dat-load-scraper/src/contentScript/background.ts`, `dat-load-scraper/src/popup/verifyApiKey.ts`, `hussle-app-dispatch-api/src/load-board/routes/loadBoardRoutes.ts`, `hussle-app-dispatch-api/src/load-board/validators/loadBoardValidators.ts`, `hussle-app-dispatch-api/src/load-board/services/loadBoardService.ts`, `hussle-app-dispatch-api/src/shared/middleware/sessionOrApiKeyAuth.ts`. Compare:
            - URL paths (extension's POST URL vs route mount)
            - Auth header format on both sides
            - Request payload shape vs validator schema (DAT + Relay)
            - Response envelope shape (sendSingle returns `{ data: ... }`) vs extension parser
            - `/load-board/ping` response shape matches `verifyApiKey`'s expected return
            Produce a structured report: ✅ matched / ❌ mismatched per line in the checklist.
         └─ Agent: review
         └─ Depends on: T-12, T-15, T-19, T-29, T-32, T-40
         └─ Output:

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Agent: review (orchestrator-direct) | Status: done_

**AC Matrix (rolled up across stories):**

| AC | Source | Code location | Status |
|---|---|---|---|
| OrgApiKey table with hashed-key storage | plan §AC1 | `prisma/schema.prisma` + migration `20260427000000_add_org_api_key/migration.sql` | ✅ |
| Plaintext keys never persisted | plan §AC1 | `apiKeyService.ts` `generate()` hashes via SHA-256 before persist; only `keyHash`+`keyPrefix` stored | ✅ |
| `generate` returns plaintext key once | plan §AC2 | `apiKeyService.ts` returns `{ key, record }`; subsequent reads use `listForOrg`/`findById` which select prefix only | ✅ |
| Ingest accepts `Bearer fc_live_…`; rejects missing/invalid/revoked 401 | plan §AC3 | `sessionOrApiKeyAuth.ts` + `apiKeyAuth.ts`; `findByPrefix` filters `revokedAt: null` | ✅ |
| Reject DAT load missing matchId / origin state / dest state → 400 | plan §AC4 | `loadBoardValidators.ts datLoadSchema` requires `matchId`/`origin.state`/`destination.state`. Test cases pass. | ✅ |
| Reject Relay load missing id / start state / end state / empty loads[] → 400 | plan §AC5 | `relayLoadSchema` requires `id`/`startLocation.state`/`endLocation.state`/`loads.min(1)`. Test cases pass. | ✅ |
| Same payload re-POST → `{ ingested: 0, skipped: N }` | plan §AC6 | `loadBoardService.ingest` iterates with `addIfAbsent`; adapter uses Redis `SET … EX … NX`. Test `loadBoardService.dedup.test.ts` covers both pure-new, all-duplicate, and mixed cases. | ✅ |
| Built bundle uses `process.env.API_URL` at build time; no localhost in prod build | plan §AC7 | `webpack.common.js` DefinePlugin; staging build verified to contain `https://api-staging.fleetcommand.app` only | ✅ |
| Popup has API-key input; save persists; ping shows org name | plan §AC8 | `popup/index.tsx` API key form; `verifyApiKey` runs on save and on mount when key present | ✅ |
| Every ingest POST sends `Authorization: Bearer <storedKey>` | plan §AC9 | `background.ts pushLoadsToApi` reads `getApiKey()` first; missing key returns early without fetch | ✅ |
| Failure → red badge with failedCount; popup last-error row + Retry; success clears | plan §AC10 | `background.ts recordFailure/clearFailureState`; `popup/index.tsx` conditionally renders error row when `failedCount > 0` | ✅ |
| `dat-load-scraper/package.json` no longer lists `yup`/`ts-node` | plan §AC11 | confirmed in current `package.json` | ✅ |
| `background.js` deleted; `background.ts` is sole source | plan §AC12 | confirmed via `ls dat-load-scraper/src/contentScript/` (no .js files) | ✅ |
| Jest suite passes for all 5 test files | plan §AC13 | 24/24 tests pass; 5 suites: `pushLoadsToApi`/`removeDuplicates`/`relayMapper`/`datHandler`/`messageRouting` | ✅ |
| `cd hussle-app-dispatch-api && npm run validate` passes | plan §AC14 | Net-zero new violations from this story; pre-existing repo-wide failures unrelated to Track 10 | ⚠️ partial |
| Manual verification (10.V.1) walked through end-to-end | plan §AC15 | **PENDING** — ops/dev to execute on staging per plan §V.1 walkthrough | ⏳ pending |

**Quality gate (no `any` / `as` / `eslint-disable` introduced):**
- Backend new code: 0 `any`, 0 `as` casts, 0 `eslint-disable`. `apiKeyAuth.ts` uses a typed `Request & { ... }` annotation rather than `as any`.
- Extension new code: `background.ts` uses typed message discriminated union with `never` exhaustiveness check; `apiKeyStorage.ts`/`verifyApiKey.ts` use proper type guards. Tests: minor `as unknown as { type: ... }` cast in messageRouting.test.ts to test the runtime guard for unknown message types — legitimate use.

**Data flow trace (DAT scrape → ingest → feed):**
1. User loads `https://power.dat.com/...` → `manifest.json` matches → `contentScript.js` injects `script.js` → `script.js` monkey-patches XHR
2. DAT API XHR returns matchDetails/similarMatchDetails → contentScript catches via `window.postMessage` → builds combined array → `chrome.runtime.sendMessage({ type: 'PUSH_DAT_LOADS', loads })`
3. `background.ts onMessage` → `pushLoadsToApi('dat', loads)` → reads stored `apiKey` → POSTs to `${API_URL}/api/v1/load-board/ingest` with `Authorization: Bearer fc_live_...`
4. API `loadBoardRoutes` → `sessionOrApiKeyAuth` (sees `Bearer fc_live_`) → delegates to `apiKeyAuth` → `apiKeyService.verify` → sets `req.organizationId` + `req.authMethod = 'apiKey'`
5. → `validateRequest(ingestValidator)` → `datLoadSchema` validates each load → 400 if any missing required field
6. → `loadBoardController.ingest` → `loadBoardService.ingest` → `datMapper` maps raw → `StagedLoad[]` → for each load `redisPort.addIfAbsent(orgId, 'dat', load)` (Redis `SET NX EX`) → counts ingested/skipped
7. → `updateMeta` with newly-added count → `sendSingle(res, { ingested, skipped, total })`
8. Extension `pushLoadsToApi` reads `result.data?.ingested ?? loads.length`, clears failure state, sets orange/blue badge
9. Dispatcher UI calls `GET /api/v1/load-board/feed` (separate flow under `appAuth` only — session scoped) → reads from Redis → renders feed

All 8 steps connected with no missing wiring.

**Status: VERIFICATION COMPLETE** — code-level checks all green; manual end-to-end (10.V.1) remains for the user.

**Tasks:**
[x] T-44 [VERIFY] Trace complete feature flow + AC matrix
         └─ Detail: Read all source files modified in US-01..US-07. For each AC across all stories:
            1. Locate the code that satisfies it
            2. Mark satisfied / unsatisfied
            3. List any unimplemented or partial ACs
            Produce an AC matrix table mapping AC → file:line → status. Confirm no `any`, no `// eslint-disable`, no `as` casts were introduced. Do NOT execute manual verification (10.V.1) — that's the user's step.
         └─ Agent: review
         └─ Depends on: T-43
         └─ Output:

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 12    | 12   | 0       | 14/15  |
| US-02 | 3     | 3    | 0       | 4/4    |
| US-03 | 4     | 4    | 0       | 6/6    |
| US-04 | 5     | 5    | 0       | 7/7    |
| US-05 | 5     | 5    | 0       | 7/7    |
| US-06 | 3     | 3    | 0       | 5/5    |
| US-07 | 8     | 8    | 0       | 5/5    |
| US-08 | 2     | 2    | 0       | 2/2    |
| INT-01| 1     | 1    | 0       | —      |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **44** | **44** | **0** | **50/51** |
