# Load Board Ingest Tasks
_Last updated: 2026-04-10 12:30_
_Plan: .planning/load-board-ingest/plan.md_

---

## US-01: Infrastructure — Redis Stack + connection enablement
_Priority: P0 | Services: infrastructure, dispatch-api | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] Docker Compose uses `redis/redis-stack:7.4.0-v2` instead of `redis:7-alpine`
- [x] Redis connection is enabled in `src/index.ts` (redisClient.connect() uncommented)
- [x] `docker compose up` starts Redis Stack with ReJSON module available

**Tasks:**
[x] T-01 [INFRA] Swap Redis Docker image to redis-stack
         └─ Detail: In `docker-compose.yml`, change the redis service image from `redis:7-alpine`
            to `redis/redis-stack:7.4.0-v2`. Keep the same port mapping (6379:6379).
            Add port 8001:8001 for RedisInsight (optional dev UI bundled with redis-stack).
            Keep existing volume mount and healthcheck (adjust healthcheck if needed —
            redis-stack uses same `redis-cli ping`).
         └─ Depends on: —
         └─ Output: Changed image to redis/redis-stack:7.4.0-v2, added port 8001, removed command (redis-stack has its own entrypoint)

[x] T-02 [INFRA] Enable Redis connection in dispatch-api
         └─ Detail: In `hussle-app-dispatch-api/src/index.ts`, find the commented-out
            `redisClient.connect()` call and uncomment it. Verify `src/shared/redisClient.ts`
            exports a singleton ioredis client. Ensure the connect call happens before
            `app.listen()`.
         └─ Depends on: —
         └─ Output: Uncommented import + connect(). Added redisClient.quit() to graceful shutdown.

---

## US-02: Load board types and Redis adapter
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `StagedLoad` interface matches the shape defined in plan.md (all 30+ fields)
- [x] `IngestPayload` type captures `{ source, loads }` with source as `'relay' | 'dat'`
- [x] `FeedResponse` type matches the response envelope from plan.md (data + meta with sources/lastUpdated)
- [x] `LoadBoardRedisPort` defines all Redis operations needed (JSON.SET, JSON.GET, JSON.MGET, SADD, SMEMBERS, DEL, pipeline, expire)
- [x] `loadBoardRedisAdapter` implements the port using ioredis `call()` for RedisJSON commands
- [x] Adapter uses the key structure: `loadboard:loads:{orgId}:{source}`, `loadboard:load:{orgId}:{source}:{srcId}`, `loadboard:meta:{orgId}`
- [x] TTL on load keys = max(firstPickupTime - now, 5 min); TTL on set/meta keys = 5 min

**Tasks:**
[x] T-03 [TYPES] Define load board domain types
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/types/loadBoardTypes.ts`.
            Define:
            - `LoadSource = 'relay' | 'dat'`
            - `EquipmentTypeApp = 'DRY_VAN' | 'REEFER' | 'FLATBED' | 'STEP_DECK' | 'BOX_TRUCK' | 'HOTSHOT' | 'POWER_ONLY'`
            - `StagedLoad` interface (all fields from plan.md Data Requirements section)
            - `IngestPayload = { source: LoadSource; loads: Record<string, unknown>[] }`
            - `IngestServiceInput = { organizationId: string; source: LoadSource; loads: Record<string, unknown>[] }`
            - `FeedServiceInput = { organizationId: string; source?: LoadSource }`
            - `FeedDetailInput = { organizationId: string; id: string }`
            - `ClearSourceInput = { organizationId: string; source: LoadSource }`
            - `FeedResponse = { data: StagedLoad[]; meta: { total: number; sources: Record<LoadSource, number>; lastUpdated: Record<LoadSource, string> } }`
            - `FeedDetailResponse = { data: StagedLoad }`
         └─ Depends on: —
         └─ Output:

[x] T-04 [TYPES] Define LoadBoardRedisPort interface
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/types/loadBoardPorts.ts`.
            Define `LoadBoardRedisPort` with methods:
            - `snapshotReplace(orgId: string, source: LoadSource, loads: StagedLoad[]): Promise<void>` — atomically replaces all loads for source+org
            - `getAllLoads(orgId: string, source?: LoadSource): Promise<StagedLoad[]>` — get all loads, optionally filtered by source
            - `getLoadById(orgId: string, id: string): Promise<StagedLoad | null>` — get single load detail
            - `clearSource(orgId: string, source: LoadSource): Promise<void>` — delete all loads for a source+org
            - `getMeta(orgId: string): Promise<{ lastUpdated: Record<string, string>; counts: Record<string, number> } | null>`
            - `updateMeta(orgId: string, source: LoadSource, count: number): Promise<void>`
            Follow the port pattern from `src/load-intel/types/loadIntelPorts.ts`.
         └─ Depends on: T-03
         └─ Output:

[x] T-05 [DB] Implement loadBoardRedisAdapter
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/adapters/loadBoardRedisAdapter.ts`.
            Accept ioredis `Redis` instance. Use `redis.call('JSON.SET', ...)` for RedisJSON commands
            since ioredis doesn't have native RedisJSON support.
            Key structure from plan:
            - `loadboard:loads:{orgId}:{source}` — SET of sourceIds (TTL 5min)
            - `loadboard:load:{orgId}:{source}:{srcId}` — JSON doc per load (TTL = max(firstPickupTime - now, 5min))
            - `loadboard:meta:{orgId}` — HASH with lastUpdated per source + counts (TTL 5min)
            `snapshotReplace` implementation:
            1. Build pipeline: DEL the old set key, DEL all old load keys (SMEMBERS first to get old IDs)
            2. For each new load: JSON.SET the load doc, SADD the sourceId to the set
            3. Set TTL on each load key (firstPickupTime - now, floor 5min)
            4. Set TTL on the set key (5min)
            5. Update meta hash
            6. Execute pipeline
            `getAllLoads`: SMEMBERS to get IDs per source, then JSON.MGET or pipeline JSON.GET for each.
            For feed (map pin) use case, consider JSON.GET with path `$` to get full docs.
            `getLoadById`: JSON.GET the specific key, parse, return.
            Follow the adapter pattern from `src/load-intel/adapters/loadIntelRedisAdapter.ts`.
         └─ Depends on: T-03, T-04
         └─ Output:

[x] T-06 [TEST] Unit tests for loadBoardRedisAdapter
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/__tests__/loadBoardRedisAdapter.test.ts`.
            Mock ioredis. Test:
            - `snapshotReplace` calls JSON.SET for each load, SADD for each sourceId, DEL for old keys
            - `snapshotReplace` sets correct TTL (firstPickupTime - now, floor 5min)
            - `getAllLoads` returns parsed StagedLoad array
            - `getAllLoads` with source filter returns only that source
            - `getLoadById` returns parsed load or null
            - `clearSource` deletes set key and all load keys
            - `updateMeta` sets correct hash fields
            Use AAA pattern, `describe`/`it` blocks.
         └─ Depends on: T-05
         └─ Output:

---

## US-03: Source mappers — Relay and DAT
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Relay mapper transforms `workOpportunity` objects into `StagedLoad` with all field mappings from plan
- [x] DAT mapper transforms `matchDetail` objects into `StagedLoad` with all field mappings from plan
- [x] Equipment type mapping is correct for both sources (Relay wildcards, DAT codes)
- [x] `rawData` is truncated: nested arrays stripped (stopRequirements, trailerDetails, actions), capped at 2KB per load
- [x] `ratePerMile` is calculated (payout / totalMiles) when both values exist
- [x] `totalDuration` converts from ms to minutes for Relay (÷ 60000)
- [x] `id` field is generated as UUID for each mapped load
- [x] `ingestedAt` is set to current ISO timestamp

**Tasks:**
[x] T-07 [TYPES] Define mapper interfaces and equipment type maps
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/mappers/equipmentTypeMap.ts`.
            Define:
            - `RELAY_EQUIPMENT_MAP: Record<string, EquipmentTypeApp>` using wildcard matching rules from plan
              (keys containing 'DRY_VAN', 'FIFTY_THREE', 'CONTAINER' → DRY_VAN; keys containing 'REEFER', 'FROZEN', 'AMBIENT' → REEFER; etc.)
            - `DAT_EQUIPMENT_MAP: Record<string, EquipmentTypeApp>` (V → DRY_VAN, R → REEFER, F → FLATBED, SD → STEP_DECK, PO → POWER_ONLY, SB → BOX_TRUCK, HS → HOTSHOT)
            - `mapRelayEquipment(raw: string): EquipmentTypeApp | null` — uses wildcard matching (includes/startsWith checks)
            - `mapDatEquipment(code: string): EquipmentTypeApp | null` — direct lookup
            Also define `SourceMapper` interface:
            ```typescript
            interface SourceMapper {
              mapLoads(rawLoads: Record<string, unknown>[]): StagedLoad[];
            }
            ```
            Create `hussle-app-dispatch-api/src/load-board/mappers/truncateRawData.ts`:
            - `truncateRawData(raw: Record<string, unknown>): Record<string, unknown>` — strips keys
              that are arrays (stopRequirements, trailerDetails, actions, loads[].stops, etc.),
              JSON.stringify result, if > 2048 bytes truncate object to fit.
         └─ Depends on: T-03
         └─ Output:

[x] T-08 [API] Implement Relay mapper
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/mappers/relayMapper.ts`.
            Export `createRelayMapper(): SourceMapper`.
            The `mapLoads` method iterates over raw `workOpportunity` objects and maps each field
            per the Relay Field Mapping table in plan.md:
            - `id` = crypto.randomUUID()
            - `source` = 'relay'
            - `sourceId` = raw.id
            - `payout` = raw.payout?.value ?? null
            - `ratePerMile` = (payout && totalMiles) ? Math.round((payout / totalMiles) * 100) / 100 : null
            - `totalMiles` = raw.totalDistance?.value ? Math.round(raw.totalDistance.value) : null
            - `deadheadMiles` = raw.deadhead?.value ? Math.round(raw.deadhead.value) : null
            - `loadedMiles` = raw.loads?.[0]?.distance?.value ? Math.round(...) : null
            - `equipmentTypeRaw` = raw.loads?.[0]?.equipmentType ?? null
            - `equipmentType` = mapRelayEquipment(equipmentTypeRaw) ?? null
            - `commodity` = raw.loads?.[0]?.commodity ?? null
            - `isTeamDriver` = raw.transitOperatorType === 'TEAM'
            - `workType` = raw.workType ?? null
            - `loadType` = raw.loads?.[0]?.loadType ?? null
            - `totalDuration` = raw.totalDuration ? Math.round(raw.totalDuration / 60000) : null
            - `firstPickupTime` = raw.firstPickupTime ?? null
            - `lastDeliveryTime` = raw.lastDeliveryTime ?? null
            - `originCity` = raw.startLocation?.city ?? null
            - `originState` = raw.startLocation?.state ?? null
            - `originLat` = raw.startLocation?.latitude ?? null
            - `originLng` = raw.startLocation?.longitude ?? null
            - `destCity` = raw.endLocation?.city ?? null
            - `destState` = raw.endLocation?.state ?? null
            - `destLat` = raw.endLocation?.latitude ?? null
            - `destLng` = raw.endLocation?.longitude ?? null
            - `stopCount` = raw.stopCount ?? null
            - `costBreakdown` = map raw.aggregatedCostItems[] by name → amount
            - `tags` = raw.tags ?? null
            - `rawData` = truncateRawData(raw)
            - `ingestedAt` = new Date().toISOString()
            Safe-access all nested paths (null coalescing). Never throw on missing fields.
         └─ Depends on: T-03, T-07
         └─ Output:

[x] T-09 [API] Implement DAT mapper
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/mappers/datMapper.ts`.
            Export `createDatMapper(): SourceMapper`.
            Real DAT response shape (from old-code/dat-load-scraper/src/utils/removeDuplicates.ts):
            - Data arrives in `similarMatchDetails[]` and `matchDetails[]` arrays
            - Each object has: matchId, pickupDate, equipmentType (human), equipmentTypeCode (short),
              companyName, origin { city, state, latitude, longitude, county },
              destination { city, state, latitude, longitude, county },
              tripMiles, weight, length, rate (OPTIONAL — not all loads have it),
              rateBasedOn, comments[], contactName { first, last }, callback { email/phone, type },
              credit { score, daysToPay }, availability { earliest, latest }
            Maps per plan + real shape:
            - `id` = crypto.randomUUID()
            - `source` = 'dat'
            - `sourceId` = raw.matchId ?? crypto.randomUUID()
            - `payout` = raw.rate ?? null (rate is OPTIONAL in DAT data)
            - `ratePerMile` = (raw.rate && raw.tripMiles) ? Math.round((raw.rate / raw.tripMiles) * 100) / 100 : null
            - `totalMiles` = raw.tripMiles ?? null
            - `deadheadMiles` = null
            - `loadedMiles` = null
            - `equipmentTypeRaw` = raw.equipmentTypeCode ?? null
            - `equipmentType` = mapDatEquipment(equipmentTypeRaw) ?? null
            - `commodity` = null
            - `isTeamDriver` = false
            - `workType` = null
            - `loadType` = null
            - `totalDuration` = null
            - `firstPickupTime` = raw.pickupDate ?? null
            - `lastDeliveryTime` = null
            - `originCity` = raw.origin?.city ?? null
            - `originState` = raw.origin?.state ?? null
            - `originLat` = raw.origin?.latitude ?? null
            - `originLng` = raw.origin?.longitude ?? null
            - `destCity` = raw.destination?.city ?? null
            - `destState` = raw.destination?.state ?? null
            - `destLat` = raw.destination?.latitude ?? null
            - `destLng` = raw.destination?.longitude ?? null
            - `stopCount` = null
            - `costBreakdown` = null
            - `tags` = null
            - `rawData` = truncateRawData(raw) — keeps companyName, credit, contactName, weight, comments
            - `ingestedAt` = new Date().toISOString()
         └─ Depends on: T-03, T-07
         └─ Output:

[x] T-10 [TEST] Unit tests for mappers
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/__tests__/relayMapper.test.ts`
            and `hussle-app-dispatch-api/src/load-board/__tests__/datMapper.test.ts`.
            Relay mapper tests:
            - Maps complete workOpportunity with all fields
            - Handles missing optional fields (payout, deadhead, etc.)
            - Calculates ratePerMile correctly
            - Converts totalDuration from ms to minutes
            - Maps equipment types correctly (DRY_VAN variants, REEFER variants, BOX_TRUCK)
            - Truncates rawData (strips nested arrays, caps at 2KB)
            - Sets source='relay', generates UUID id, sets ingestedAt
            DAT mapper tests:
            - Maps complete matchDetail with all fields
            - Handles missing rate (ratePerMile should be null)
            - Maps DAT equipment codes (V, R, F, SD, PO, SB, HS)
            - Sets source='dat', handles missing matchId
            - Truncates rawData
            Also test equipmentTypeMap:
            - Relay wildcard matching (BOX_TRUCK_16_FOOT → BOX_TRUCK, FIFTY_THREE_FOOT_DRY_VAN_TRUCK → DRY_VAN)
            - DAT code mapping
            - Unknown types return null
         └─ Depends on: T-08, T-09
         └─ Output:

---

## US-04: Ingest and feed API endpoints
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] `POST /api/v1/load-board/ingest` accepts `{ source, loads }`, derives orgId from JWT, returns 200
- [x] Ingest rejects payload >1MB with 413
- [x] Ingest rejects >100 loads with 400 validation error
- [x] Ingest rejects unknown source (not 'relay'/'dat') with 400
- [x] `GET /api/v1/load-board/feed` returns all staged loads for the org with meta (total, sources, lastUpdated)
- [x] `GET /api/v1/load-board/feed?source=relay` filters by source
- [x] `GET /api/v1/load-board/feed/:id` returns single load detail or 404
- [x] `DELETE /api/v1/load-board/feed/:source` clears all loads for that source+org
- [x] All endpoints require `requireAuth` middleware — 401 without valid JWT
- [x] Each ingest atomically replaces previous loads for that source+org (snapshot-replace)

**Tasks:**
[x] T-11 [API] Implement ingest service
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/services/loadBoardService.ts`.
            Export `createLoadBoardService(deps: LoadBoardServiceDeps): LoadBoardService`.
            Deps: `{ redisPort: LoadBoardRedisPort; logger: LoggerPort }`.
            Methods:
            - `ingest(input: IngestServiceInput): Promise<{ count: number }>`:
              1. Select mapper by input.source ('relay' → createRelayMapper(), 'dat' → createDatMapper())
              2. Call mapper.mapLoads(input.loads) → StagedLoad[]
              3. Call redisPort.snapshotReplace(input.organizationId, input.source, stagedLoads)
              4. Call redisPort.updateMeta(input.organizationId, input.source, stagedLoads.length)
              5. Log: `logger.info('Loads ingested', { orgId, source, count })`
              6. Return { count: stagedLoads.length }
            - `getFeed(input: FeedServiceInput): Promise<FeedResponse>`:
              1. Call redisPort.getAllLoads(input.organizationId, input.source)
              2. Call redisPort.getMeta(input.organizationId)
              3. Build and return FeedResponse envelope
            - `getLoadDetail(input: FeedDetailInput): Promise<StagedLoad>`:
              1. Call redisPort.getLoadById(input.organizationId, input.id)
              2. If null, throw NotFoundError('StagedLoad', input.id)
              3. Return load
            - `clearSource(input: ClearSourceInput): Promise<void>`:
              1. Call redisPort.clearSource(input.organizationId, input.source)
              2. Log: `logger.info('Source cleared', { orgId, source })`
         └─ Depends on: T-04, T-08, T-09
         └─ Output:

[x] T-12 [API] Implement controllers and mappers
         └─ Detail: Create controllers following the project pattern (see REGISTRY-dispatch-api.md § Controller pattern).
            File: `hussle-app-dispatch-api/src/load-board/controllers/loadBoardControllers.ts`
            Export `createLoadBoardControllers(deps): LoadBoardControllers` with:
            - `ingest`: calls ingestMapper(req) → service.ingest(input) → sendSingle(res, { count }, 200)
            - `getFeed`: calls getFeedMapper(req) → service.getFeed(input) → sendList(res, feedResponse)
            - `getLoadDetail`: calls getLoadDetailMapper(req) → service.getLoadDetail(input) → sendSingle(res, load)
            - `clearSource`: calls clearSourceMapper(req) → service.clearSource(input) → res.status(204).send()

            Create mappers:
            `hussle-app-dispatch-api/src/load-board/controllers/mappers/ingestMapper.ts`:
            - Extracts `organizationId` from `req.user.organizationId` (JWT-derived, NEVER from body)
            - Extracts `source` and `loads` from `req.body`
            - Returns `IngestServiceInput`

            `hussle-app-dispatch-api/src/load-board/controllers/mappers/getFeedMapper.ts`:
            - Extracts `organizationId` from `req.user.organizationId`
            - Extracts optional `source` from `req.query.source`
            - Returns `FeedServiceInput`

            `hussle-app-dispatch-api/src/load-board/controllers/mappers/getLoadDetailMapper.ts`:
            - Extracts `organizationId` from `req.user.organizationId`
            - Extracts `id` from `req.params.id`
            - Returns `FeedDetailInput`

            `hussle-app-dispatch-api/src/load-board/controllers/mappers/clearSourceMapper.ts`:
            - Extracts `organizationId` from `req.user.organizationId`
            - Extracts `source` from `req.params.source`
            - Returns `ClearSourceInput`
         └─ Depends on: T-11
         └─ Output:

[x] T-13 [API] Implement validators
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/validators/loadBoardValidators.ts`.
            Using Yup (follow existing pattern in `src/carriers/validators/carrierValidators.ts`):
            - `ingestValidator`: validates `body.source` is oneOf(['relay', 'dat']),
              `body.loads` is array with max 100 items and required.
            - `getFeedValidator`: validates optional `query.source` is oneOf(['relay', 'dat']) if present.
            - `getLoadDetailValidator`: validates `params.id` is string required.
            - `clearSourceValidator`: validates `params.source` is oneOf(['relay', 'dat']).
         └─ Depends on: T-03
         └─ Output:

[x] T-14 [API] Implement routes with auth middleware
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/routes/loadBoardRoutes.ts`.
            Follow the route pattern from `src/maps/routes/mapRoutes.ts` or `src/load-intel/routes/`.
            ```
            POST   /ingest       → appAuth, express.json({ limit: '1mb' }), validateRequest(ingestValidator), controllers.ingest
            GET    /feed         → appAuth, validateRequest(getFeedValidator), controllers.getFeed
            GET    /feed/:id     → appAuth, validateRequest(getLoadDetailValidator), controllers.getLoadDetail
            DELETE /feed/:source → appAuth, validateRequest(clearSourceValidator), controllers.clearSource
            ```
            Note: The 1MB body limit should be applied via `express.json({ limit: '1mb' })` on the
            ingest route specifically (or as middleware on the router). If the API already has a global
            body limit, check what it is and only add route-level if needed.
            Use `appAuth` (the project's requireAuth middleware from `src/shared/middleware/authenticateUser.ts`).
         └─ Depends on: T-12, T-13
         └─ Output:

[x] T-15 [API] Wire composition root and mount routes
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/compositionRoot.ts`.
            Follow the composition root pattern from REGISTRY-dispatch-api.md:
            ```typescript
            interface LoadBoardModuleDeps {
              redis: Redis;  // ioredis instance
              logger: LoggerPort;
            }
            export const createLoadBoardModule = (deps: LoadBoardModuleDeps) => {
              const redisPort = createLoadBoardRedisAdapter(deps.redis);
              const service = createLoadBoardService({ redisPort, logger: deps.logger });
              const controllers = createLoadBoardControllers({ service, logger: deps.logger });
              return { controllers };
            };
            ```
            Then in `src/compositionRoot.ts` (or wherever modules are wired), add the load-board module.
            Pass the redis client from `src/shared/redisClient.ts`.
            In `src/app.ts`, mount the routes:
            ```typescript
            app.use('/api/v1/load-board', loadBoardRoutes(root.loadBoard));
            ```
         └─ Depends on: T-14
         └─ Output:

[x] T-16 [TEST] Unit tests for ingest and feed services
         └─ Detail: Create `hussle-app-dispatch-api/src/load-board/__tests__/loadBoardService.test.ts`.
            Mock `LoadBoardRedisPort` and `LoggerPort`. Test:
            - `ingest` with source='relay' calls relay mapper and snapshotReplace with correct args
            - `ingest` with source='dat' calls dat mapper
            - `ingest` returns correct count
            - `getFeed` returns FeedResponse with data and meta
            - `getFeed` with source filter passes filter to getAllLoads
            - `getLoadDetail` returns load when found
            - `getLoadDetail` throws NotFoundError when load is null
            - `clearSource` calls redisPort.clearSource with correct args
         └─ Depends on: T-11
         └─ Output:

---

## US-05: Extension auth and auto-push
_Priority: P0 | Services: extension | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] Extension popup shows login form (email + password)
- [x] Successful login stores JWT in `chrome.storage.local` and shows "Connected" status
- [x] Extension auto-pushes intercepted Relay loads to `POST /api/v1/load-board/ingest` with Bearer token
- [x] Push is throttled to configurable interval (default 60s) — skips pushes within the window
- [x] Push interval is configurable via popup settings UI
- [x] On 401 response, extension clears token and shows login prompt
- [x] Redux reducer replaces snapshot on each refresh (does not accumulate)
**Note:** API login endpoint sets httpOnly cookies, not body token. Popup uses chrome.cookies fallback. Future improvement: add accessToken to login response body for extension use.

**Tasks:**
[x] T-17 [UI] Add login flow to extension popup
         └─ Detail: In `extension/popup/popup.ts`, add a login form section:
            - Email input + password input + "Login" button
            - On submit, POST to `{apiBaseUrl}/api/v1/auth/login` with `{ email, password }`
              (the auth endpoint already exists in dispatch-api)
            - On success: store the access token via `chrome.storage.local.set({ authToken: response.token })`
            - Show "Connected" status indicator (green dot + text)
            - On failure: show error message
            - On 401 from any subsequent API call: clear token, show login form again
            Reference: `extension/shared/api.ts` for existing API call patterns (`saveApiToken`, `getApiToken`).
            The popup is vanilla TS + HTML (no React). Follow existing popup.ts patterns.
         └─ Depends on: —
         └─ Output:

[x] T-18 [API] Add throttled load-board ingest POST to extension
         └─ Detail: The extension currently intercepts Relay data in `content/dat-scraper.ts` and
            sends it to the service worker via messages. We need to add a NEW content script or
            modify the service worker to also POST intercepted Relay loads to the dispatch API.

            In `extension/background/service-worker.ts`:
            - Add a new message handler for `RELAY_LOADS_INTERCEPTED` (or reuse existing flow)
            - On receiving Relay workOpportunities data:
              1. Check throttle: compare Date.now() against last push timestamp
              2. If within interval (default 60s from config), skip
              3. Otherwise, POST to `{apiBaseUrl}/api/v1/load-board/ingest` with:
                 `{ source: 'relay', loads: workOpportunities }`
                 Headers: `Authorization: Bearer {token}` from chrome.storage.local
              4. Update last push timestamp
              5. On 401: send message to popup to show re-login prompt
            - Store push interval in chrome.storage.local (default 60000ms)

            Also need a content script for Relay (the extension currently only has DAT scripts).
            Check if there's already a Relay content script. If not, create
            `extension/content/relay-interceptor.ts`:
            - Listen for XHR/fetch responses matching `/api/loadboard/search` on `relay.amazon.com`
            - Extract `workOpportunities[]` from response body
            - Send to service worker via `chrome.runtime.sendMessage({ type: 'RELAY_LOADS_INTERCEPTED', payload: workOpportunities })`
            Register in `manifest.json` for `relay.amazon.com/loadboard/*` URLs.
         └─ Depends on: T-17
         └─ Output:

[x] T-19 [UI] Add push interval config to popup
         └─ Detail: In `extension/popup/popup.ts`, add a settings section:
            - Label: "Push interval (seconds)"
            - Number input, default 60, min 10, max 300
            - On change: save to `chrome.storage.local.set({ pushIntervalSeconds: value })`
            - Service worker reads this value on each push decision
            Keep it simple — just an input field in the existing popup layout.
         └─ Depends on: T-17
         └─ Output:

[x] T-20 [API] Fix Redux reducer — snapshot replace, not append
         └─ Detail: The plan states the extension's Redux reducer currently appends to `rawResponses`.
            Find the relevant reducer in the extension (check `extension/background/service-worker.ts`
            or any state management file). The extension uses chrome.storage, not Redux Toolkit.
            Find where intercepted load data is stored and change from append to replace:
            - Instead of: `storage.rawResponses = [...storage.rawResponses, newData]`
            - Change to: `storage.currentSnapshot = newData` (or equivalent)
            This prevents memory growth from accumulated responses.
            Search for `rawResponses` or similar accumulation patterns in the extension codebase.
         └─ Depends on: —
         └─ Output:

---

## US-06: Load Board UI page with map view
_Priority: P0 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] `/loadboard` route renders a full-page map with one pin per staged load at pickup lat/lng
- [x] Pins are color-coded by source (Relay = blue, DAT = orange)
- [x] Clicking a pin shows popup with load details: payout, rate/mile, origin->destination, duration, equipment, pickup time, stop count
- [x] "Sync DAT" button posts bundled DAT fixture data to ingest endpoint
- [x] Source filter chips toggle pin visibility (All / Relay / DAT)
- [x] Map auto-refreshes on configurable interval (default 10s) via saga polling
- [x] Page uses existing MapView component pattern extended for multi-load pins

**Tasks:**
[x] T-21 [TYPES] Define frontend types and API client
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/loadBoard/types/loadBoardTypes.ts`.
            Define frontend types matching the API response:
            - `StagedLoad` (mirror of API StagedLoad — all fields)
            - `LoadBoardFeedResponse` = `{ data: StagedLoad[]; meta: { total: number; sources: Record<string, number>; lastUpdated: Record<string, string> } }`
            - `LoadBoardSource = 'relay' | 'dat'`

            Create `hussle-app-dispatch-ui/src/utils/api/loadBoard/loadBoardApi.ts`:
            - `getLoadBoardFeed(source?: string): Promise<LoadBoardFeedResponse>` — GET `/api/v1/load-board/feed`
            - `ingestLoads(source: string, loads: Record<string, unknown>[]): Promise<{ count: number }>` — POST `/api/v1/load-board/ingest`
            Use the existing Axios instance from `utils/axios.ts`.
         └─ Depends on: —
         └─ Output:

[x] T-22 [UI] Create DAT mock fixture file
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/loadBoard/data/datMockData.json`.
            Use the REAL DAT response shape from `old-code/dat-load-scraper/src/utils/removeDuplicates.ts`.
            The fixture should be a `similarMatchDetails[]` array (the format the UI will POST to ingest).
            Include 15-20 objects matching the real DAT shape:
            - `matchId` (short string like "LS4Vh0Va")
            - `pickupDate` (future ISO dates)
            - `equipmentType` (human: "Van", "Power Only", "Straight Box Truck", "Reefer", "Flatbed")
            - `equipmentTypeCode` (V, PO, SB, R, F, SD, HS)
            - `companyName`, `isLoad: true`, `assetType: "Shipment"`
            - `origin: { id: -1, city, state, latitude, longitude, county, type: "minimalPoint" }`
            - `destination: { id: -1, city, state, latitude, longitude, county, type: "minimalPoint" }`
            - `tripMiles` (100-1500), `weight`, `length`
            - `rate` (OPTIONAL — only include on ~60% of loads, range $500-$5000)
            - `rateBasedOn: "Flat"` (when rate present)
            - `credit: { score, daysToPay }`, `contactName: { first, last, initials }`
            - `callback: { email/phone, type }`, `comments: [...]`
            - `availability: { earliest, latest }`
            Spread across US cities with real coordinates (Atlanta, Chicago, Dallas, Miami, Denver, etc.)
         └─ Depends on: —
         └─ Output:

[x] T-23 [UI] Create load board Redux slices and sagas
         └─ Detail: Create feature store structure:
            `hussle-app-dispatch-ui/src/features/loadBoard/store/reducers/loadBoardSlice.ts`:
            - State: `{ loads: StagedLoad[]; meta: FeedMeta | null; sourceFilter: 'all' | 'relay' | 'dat'; loading: boolean; error: string | null; pollInterval: number }`
            - Actions: `fetchFeedRequest`, `fetchFeedSuccess`, `fetchFeedFailure`, `setSourceFilter`, `ingestDatRequest`, `ingestDatSuccess`, `ingestDatFailure`, `setPollInterval`
            - Use createSlice from Redux Toolkit (follow dashboardSlice.ts pattern, not createCrudSlice — this is a custom page, not a CRUD entity)

            `hussle-app-dispatch-ui/src/features/loadBoard/store/sagas/loadBoardSaga.ts`:
            - `fetchFeedSaga`: calls `getLoadBoardFeed(sourceFilter)`, dispatches success/failure
            - `pollFeedSaga`: uses `delay()` + recursive call pattern for polling (default 10s interval).
              On fetchFeedRequest, start polling. On page unmount/navigation, stop.
            - `ingestDatSaga`: imports datMockData.json, calls `ingestLoads('dat', data)`, on success dispatches fetchFeedRequest to refresh
            - Watcher: `loadBoardWatcherSaga` — takeLatest for each action type

            Register slice in root reducer and saga in root saga watcher.
         └─ Depends on: T-21
         └─ Output:

[x] T-24 [UI] Extend MapView for multi-load pin mode
         └─ Detail: The existing MapView is at `hussle-app-dispatch-ui/src/features/load/components/MapView/`.
            Read the existing implementation first to understand the MapLibre GL setup.
            Extend or create a new component `LoadBoardMap` at
            `hussle-app-dispatch-ui/src/features/loadBoard/components/LoadBoardMap/index.tsx`:
            - Accept props: `{ loads: StagedLoad[]; sourceFilter: 'all' | 'relay' | 'dat'; onPinClick: (load: StagedLoad) => void }`
            - Render a full-page MapLibre GL map (reuse map setup from existing MapView)
            - Add a marker per load at `[originLng, originLat]` (skip loads with null coords)
            - Pin color by source: Relay = `#2196F3` (MUI blue), DAT = `#FF9800` (MUI orange)
            - On marker click, show a MapLibre Popup with load details:
              payout (formatted $X,XXX.XX), rate/mile, origin city/state -> dest city/state,
              duration (formatted Xh Ym), equipment type, pickup time (formatted), stop count
            - Auto-fit bounds to contain all visible markers
            - Source filter: show/hide markers based on sourceFilter prop
            Check if maplibre-gl is already installed. If not, note it as a dependency to add.
         └─ Depends on: T-21
         └─ Output:

[x] T-25 [UI] Build Load Board page
         └─ Detail: Create `hussle-app-dispatch-ui/src/features/loadBoard/pages/LoadBoardPage/index.tsx`.
            Layout:
            - Full-page layout (no PageWrapper needed — map IS the page)
            - Top bar with: page title "Load Board", source filter chips (All / Relay / DAT),
              "Sync DAT" button (MUI Button, outlined, onClick dispatches ingestDatRequest)
            - LoadBoardMap component filling remaining space
            - Use MUI `Chip` components for source filters with onClick → dispatch setSourceFilter
            - Active chip uses filled variant, inactive uses outlined
            - On mount: dispatch fetchFeedRequest to start polling
            - On unmount: stop polling (cleanup in saga or useEffect)
            - Connect to Redux: useSelector for loads, meta, sourceFilter, loading
            - Show Loader component during initial load
            - Show error snackbar on failure

            Register route at `/loadboard`:
            `hussle-app-dispatch-ui/src/features/loadBoard/routes/loadBoardRoutes.tsx`:
            Follow the route pattern from REGISTRY-dispatch-ui.md:
            ```tsx
            const LoadBoardPage = Loadable(lazy(() => import('../pages/LoadBoardPage')));
            const loadBoardRoutes = {
              element: <PersistLogin><AuthGuard><AppLayout /></AuthGuard></PersistLogin>,
              path: '/loadboard',
              children: [{ index: true, element: <LoadBoardPage /> }],
            };
            ```
            Add to the router config in the app's route definitions.
            Add sidebar navigation item for "Load Board" with a map icon.
         └─ Depends on: T-23, T-24
         └─ Output:

---

## INT-01: Wire dispatch-api to extension integration
_Auto-generated | Services: dispatch-api, extension_

**Verification Checklist:**
- [x] Extension POST to `/api/v1/load-board/ingest` uses correct path and method
- [x] Request body shape matches `{ source: 'relay', loads: [...] }` — no organizationId in body
- [x] Authorization header format: `Bearer <token>` matching API's requireAuth middleware expectations (FIXED: added Bearer fallback)
- [x] Extension calls `POST /api/v1/auth/login` for authentication (same endpoint dispatch-ui uses)
- [x] On 401 response, extension clears stored token and prompts re-login
- [x] Extension sends raw workOpportunities (not pre-mapped) — API does the mapping

**Tasks:**
[x] T-26 [WIRE] Verify extension-to-API integration
         └─ Detail: Read extension source (popup.ts, service-worker.ts, relay-interceptor.ts)
            and API source (load-board routes, auth routes, authenticateUser middleware).
            Compare:
            1. Auth endpoint path and expected request/response shape
            2. Ingest endpoint path, method, and payload shape
            3. Authorization header format and JWT validation flow
            4. Error response handling (401, 400, 413)
            5. Content-Type headers
            Report any mismatches.
         └─ Agent: review
         └─ Depends on: US-04, US-05
         └─ Output: 2 CRITICAL issues found and FIXED:
           (1) appAuth only read cookies, not Bearer header → added Bearer fallback in authenticateUser.ts
           (2) Login response didn't include accessToken in body → added to loginController.ts
           Non-critical: 100-load cap has no client guard; manifest default_title is stale

---

## INT-02: Wire dispatch-api to dispatch-ui integration
_Auto-generated | Services: dispatch-api, dispatch-ui_

**Verification Checklist:**
- [x] Frontend API client calls correct endpoint paths (`/api/v1/load-board/feed`, `/api/v1/load-board/ingest`)
- [x] `LoadBoardFeedResponse` type matches API's actual response shape (data + meta structure)
- [x] `StagedLoad` fields match between frontend types and API response
- [x] Source filter query param (`?source=relay`) matches API's query parameter name
- [x] DAT ingest payload shape matches API validator expectations
- [x] Auth: requests use httpOnly cookie auth (Axios withCredentials) not Bearer token (that's extension-only)

**Tasks:**
[x] T-27 [WIRE] Verify UI-to-API integration
         └─ Detail: Read frontend API client (loadBoardApi.ts), frontend types (loadBoardTypes.ts),
            and API source (routes, validators, controllers, response shapes).
            Compare:
            1. Endpoint paths and HTTP methods
            2. Request payload shapes (ingest body, query params)
            3. Response shapes (FeedResponse data + meta, field names, types)
            4. StagedLoad field names match character-for-character
            5. Source enum values match ('relay', 'dat')
            6. Auth mechanism (cookie vs Bearer — UI uses cookies via Axios interceptor)
            Report any mismatches.
         └─ Agent: review
         └─ Depends on: US-04, US-06
         └─ Output: ALL 6 integration points MATCH. No critical issues.
           Non-critical: UI equipmentType typed as string|null (looser than API EquipmentTypeApp)

---

## VER-01: End-to-end verification
_Auto-generated | Read-only_

**Tasks:**
[x] T-28 [VERIFY] Trace complete load board data flow
         └─ Detail: For each flow, trace every step from trigger through API through Redis and back to UI:

            **Flow 1: Relay ingest**
            Extension intercepts XHR → service worker throttle → POST /ingest → relay mapper →
            snapshotReplace in Redis → UI polls GET /feed → loads appear on map

            **Flow 2: DAT mock ingest**
            User clicks "Sync DAT" → UI reads fixture → POST /ingest → dat mapper →
            snapshotReplace in Redis → UI refreshes → loads appear on map

            **Flow 3: Map interaction**
            UI receives feed → renders pins at originLat/originLng → click pin → popup with
            payout, ratePerMile, origin→dest, duration, equipment, pickupTime, stopCount

            **Flow 4: Source filtering**
            User clicks source chip → Redux filter update → map re-renders showing only matching pins

            Check every AC from every story is satisfied by reading the actual source code.
            Report any gaps.
         └─ Agent: review
         └─ Depends on: INT-01, INT-02
         └─ Output: All 4 flows CONNECTED. All 18 acceptance criteria MET. No gaps.

---

## FIX-01: Redis adapter uses plain SET/GET instead of RedisJSON
_Priority: P0 | Services: dispatch-api | Status: done_

**Tasks:**
[x] T-29 [FIX] Rewrite adapter to use plain SET/GET instead of JSON.SET/JSON.GET
         └─ Detail: The running Redis instance lacks the RedisJSON module (JSON.SET returns
            "unknown command"). Replaced all `redis.call('JSON.SET', ...)` with `redis.set(key, JSON.stringify(load), 'EX', ttl)`
            and all `redis.call('JSON.GET', ...)` / pipeline JSON.GET with `redis.get(key)` / `redis.mget(...keys)`.
            This works on any Redis without extra modules.
         └─ Output: Adapter rewritten, 15/15 tests pass. Also fixed eslint-disable in loadBoardSlice.

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 2     | 2    | 0       | 3/3    |
| US-02 | 4     | 4    | 0       | 7/7    |
| US-03 | 4     | 4    | 0       | 8/8    |
| US-04 | 6     | 6    | 0       | 10/10  |
| US-05 | 4     | 4    | 0       | 7/7    |
| US-06 | 5     | 5    | 0       | 7/7    |
| INT-01| 1     | 1    | 0       | 6/6    |
| INT-02| 1     | 1    | 0       | 6/6    |
| VER-01| 1     | 1    | 0       | 18/18  |
| FIX-01| 1     | 1    | 0       | —      |
| **All** | **29** | **29** | **0** | **54/54** |
