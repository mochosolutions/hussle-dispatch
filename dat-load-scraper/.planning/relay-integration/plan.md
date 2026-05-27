# Relay Integration Plan (SUPERSEDED)

> **This plan has been split into two features:**
> - `.planning/load-board-ingest/plan.md` — MVP: multi-source ingestion, RedisJSON staging, map view, auth
> - `.planning/load-board-prod/plan.md` — Production: preference filtering, book action, analytics, pagination replay
>
> This file is kept for reference only. The active plans are above.

## Overview

Push scraped Amazon Relay load data from the Chrome extension into the dispatch API's Redis staging area, with manual pagination support to fetch all pages of results.

---

## Architecture

```
Chrome Extension (relay.amazon.com page context)
  ├── Intercepts POST /api/loadboard/search responses
  ├── Captures x-csrf-token + request body from original request
  ├── Pagination: replays fetch() with nextItemToken in page context
  │   (cookies + CSRF token inherited automatically)
  └── Pushes normalized loads to dispatch API
        │
        ▼
Dispatch API — POST /api/v1/scraper/ingest
  ├── Auth: JWT (same as dispatch UI login)
  ├── Validates + stores in Redis as JSON
  │   Key: relay:staging:{orgId}:{workOpportunityId}
  │   TTL: 24 hours
  └── Returns ingestion summary
```

---

## Part 1: Pagination (Extension Side)

### How Relay Pagination Works
- `POST /api/loadboard/search` with `nextItemToken: 0` → page 1 (50 results)
- Response returns `nextItemToken: 50, totalResultsSize: 231`
- Next request uses `nextItemToken: 50` → page 2 (results 51-100)
- Continue until all pages fetched

### Implementation
1. **Capture original request context** — When intercepting the search response, also capture:
   - The original request body (search filters)
   - The `x-csrf-token` header from the request
   
2. **Store pagination state** in `chrome.storage.local`:
   ```
   relayPagination: {
     nextItemToken: 50,
     totalResultsSize: 231,
     currentPage: 1,
     totalPages: 5,       // ceil(231/50)
     requestBody: {...},  // original search filters
     csrfToken: "...",    // captured from original request
   }
   ```

3. **Popup UI** — Page controls:
   - "Page 1 of 5 — 231 loads" with Next/Prev buttons
   - "Fetch All" button to auto-fetch remaining pages
   - Each page click sends message to content script → content script calls fetch() in page context

4. **Replay fetch in page context** — Content script calls:
   ```js
   fetch('/api/loadboard/search', {
     method: 'POST',
     headers: {
       'content-type': 'application/json',
       'x-csrf-token': capturedCsrfToken,
     },
     credentials: 'include',  // sends cookies
     body: JSON.stringify({ ...originalBody, nextItemToken: 50 }),
   })
   ```
   This works because the script runs on relay.amazon.com — same origin, cookies included.

---

## Part 2: Push to Dispatch API

### Auth Strategy: Reuse Existing JWT
- Extension popup gets a login form (email + password)
- Calls `POST /api/v1/auth/login` on dispatch API
- Receives JWT, stores in `chrome.storage.local`
- All subsequent API calls include `Authorization: Bearer <jwt>`
- Token refresh on 401 — re-prompt login if expired
- Most secure: no API keys to leak, same auth as main app, session-scoped

### Extension → API Flow
1. Extension intercepts/fetches a page of Relay results
2. Site-specific mapper normalizes `workOpportunities` into `StagedLoad[]`
3. Extension calls `POST /api/v1/scraper/ingest` with the batch
4. API validates, deduplicates by `sourceId`, stores in Redis

### API Endpoint

```
POST /api/v1/scraper/ingest
Authorization: Bearer <jwt>

{
  "source": "relay",
  "loads": [
    {
      "sourceId": "3efd9f24-c112-4ba2-bd9a-bcaae2976c69",
      "source": "relay",
      "payout": 280.19,
      "ratePerMile": 3.01,
      "totalMiles": 93,
      "deadheadMiles": 25,
      "loadedMiles": 93,
      "equipmentType": "TWENTY_SIX_FOOT_BOX_TRUCK",
      "commodity": "UNKNOWN",
      "isTeamDriver": false,
      "workType": "SPOT",
      "firstPickupTime": "2026-04-04T05:45:00Z",
      "lastDeliveryTime": "2026-04-04T11:53:00Z",
      "costBreakdown": {
        "baseRate": 155.21,
        "fuelSurcharge": 47.47,
        "tollCharge": 77.51
      },
      "tags": ["PUSH_NOTIFICATION_ENABLED", "STARTING_SOON"],
      "stops": [
        {
          "type": "PICKUP",
          "sequence": 1,
          "facilityName": "EWR5",
          "address": "301 Blair Rd",
          "city": "AVENEL",
          "state": "NJ",
          "zip": "07001",
          "latitude": 40.5838806,
          "longitude": -74.2549101,
          "appointmentStart": "2026-04-04T05:45:00Z",
          "appointmentEnd": "2026-04-04T06:35:00Z",
          "loadingType": "LIVE",
          "stopCategory": "SORT_CENTER"
        },
        ...
      ],
      "rawData": { ... }  // full original object for reference
    }
  ]
}
```

---

## Part 3: Redis Staging (Dispatch API)

### Storage Pattern — Snapshot-Replace Model
```
relay:snapshot:{orgId}                 → SET of workOpportunity IDs (TTL 90s)
relay:load:{orgId}:{workOpId}          → STRING JSON per load (TTL = firstPickupTime - now)
relay:meta:{orgId}                     → HASH: epoch, lastUpdatedAt, totalResultsSize (TTL 90s)
relay:booked:{orgId}                   → SET of IDs claimed by dispatcher (TTL 1h per entry)
relay:pagination:{orgId}:{epoch}       → HASH: page accumulation for multi-page snapshots (TTL 60s)
```

Each Relay auto-refresh (30s) atomically replaces the snapshot. Loads not in the
latest response are deleted. If the extension stops sending data, the 90s TTL
expires and staging empties — no stale loads.

See `plans/happy-snacking-cascade.md` for the full staleness-proof design.

### API Module Structure
```
src/scraper/
├── compositionRoot.ts
├── index.ts
├── controllers/
│   └── scraperController.ts
│   └── mappers/
│       └── ingestMapper.ts
├── services/
│   └── scraperService.ts
├── repositories/
│   └── scraperRedisRepository.ts
├── types/
│   └── scraperTypes.ts        — StagedLoad interface, IngestInput
├── validators/
│   └── scraperValidators.ts   — Yup schema for ingest payload
└── routes/
    └── scraperRoutes.ts
```

### Service Logic
- Validate incoming batch
- Deduplicate: skip if `sourceId` already exists in Redis
- Store each load as RedisJSON document
- Add sourceId to org's staging index set
- Return: `{ ingested: 45, duplicates: 5, total: 50 }`

---

## Part 4: Site-Specific Mappers (Extension Side)

Each site handler gets a `toStagedLoads()` method that normalizes raw API data into the `StagedLoad` format the API expects.

### Relay Mapper — Key Field Mappings

| Relay workOpportunity | StagedLoad | Transform |
|---|---|---|
| `id` | `sourceId` | direct |
| `payout.value` | `payout` | direct |
| `payout.value / totalDistance.value` | `ratePerMile` | calculated |
| `totalDistance.value` | `totalMiles` | Math.round |
| `deadhead.value` | `deadheadMiles` | Math.round |
| `loads[0].distance.value` | `loadedMiles` | Math.round |
| `loads[0].equipmentType` | `equipmentType` | map to app enum (see Decisions) |
| `transitOperatorType` | `isTeamDriver` | `=== 'TEAM'` |
| `workType` | `workType` | direct |
| `firstPickupTime` | `firstPickupTime` | direct |
| `lastDeliveryTime` | `lastDeliveryTime` | direct |
| `totalDuration` | `totalDuration` | milliseconds → minutes (÷ 60000) |
| `totalLayover` | `totalLayover` | milliseconds → minutes (÷ 60000) |
| `loads[0].loadType` | `loadType` | `LOADED` / `EMPTY` — trailer status |
| `workOpportunityArrivalWindows` | `arrivalWindows` | array of `{ start, end }` time windows |
| `aggregatedCostItems[]` | `costBreakdown` | map by name |
| `tags` | `tags` | direct |
| `loads[0].stops[]` | `stops[]` | see stop mapping |

### Stop Mapping

| Relay stop | StagedLoad stop | Transform |
|---|---|---|
| `stopType` | `type` | `DROPOFF` → `DELIVERY` |
| `stopSequenceNumber` | `sequence` | direct |
| `location.label` | `facilityName` | direct |
| `location.line1` | `address` | direct |
| `location.city` | `city` | direct |
| `location.state` | `state` | direct |
| `location.postalCode` | `zip` | direct |
| `location.latitude` | `latitude` | direct |
| `location.longitude` | `longitude` | direct |
| `actions[CHECKIN].plannedTime` | `appointmentStart` | find by type |
| `actions[CHECKOUT].plannedTime` | `appointmentEnd` | find by type |
| `loadingType` | `loadingType` | `LIVE` / `PRELOADED` / `DROP` |
| `unloadingType` | `unloadingType` | `LIVE` / `DROP` |
| `stopCategory` | `stopCategory` | `SORT_CENTER`, `DDU_HUB`, `NON_SORT`, `THIRD_PARTY_LOGISTICS` |
| `weight.value` | `weight` | direct (when present) |
| `weight.unit` | `weightUnit` | `pounds` / `grams` |

### DAT Mapper (future)
Same `StagedLoad` output, different field source. DAT's shape uses `origin/destination`, `tripMiles`, `rate`, etc. — different field names, same normalized output.

---

## Implementation Order

1. **Extension: Capture request context** — Store CSRF token + request body during interception
2. **Extension: Pagination in popup** — Page controls, replay fetch with nextItemToken
3. **API: Scraper module** — Redis staging endpoint with validation
4. **Extension: Relay mapper** — `toStagedLoads()` normalization
5. **Extension: Auth + push** — Login in popup, push batches to API
6. **Extension: DAT mapper** — Same pattern for DAT site handler

---

## Decisions

### Equipment Type Mapping
Map Relay's equipment enums to the app's `EquipmentType` enum at ingestion time.

| Relay Equipment | App EquipmentType |
|---|---|
| `FIFTY_THREE_FOOT_TRUCK` | `DRY_VAN` |
| `SKIRTED_FIFTY_THREE_FOOT_TRUCK` | `DRY_VAN` |
| `FIFTY_THREE_FOOT_DRY_VAN` | `DRY_VAN` |
| `FIFTY_THREE_FOOT_A5_AIR_TRAILER` | `DRY_VAN` |
| `FORTY_FIVE_FOOT_TRUCK` | `DRY_VAN` |
| `FIFTY_THREE_FOOT_REEFER_TRUCK` | `REEFER` |
| `FIFTY_THREE_FOOT_AMBIENT_REEFER_TRUCK` | `REEFER` |
| `FIFTY_THREE_FOOT_FROZEN_TRUCK` | `REEFER` |
| `FIFTY_THREE_FOOT_DUAL_TMP_TRUCK` | `REEFER` |
| `TWENTY_SIX_FOOT_REEFER_TRUCK` | `REEFER` |
| `TWENTY_SIX_FOOT_BOX_TRUCK` | `BOX_TRUCK` |
| `FIFTY_THREE_FOOT_CONTAINER` | `DRY_VAN` |
| `FORTY_FIVE_FOOT_CONTAINER` | `DRY_VAN` |
| `FORTY_FOOT_CONTAINER` | `DRY_VAN` |
| `TWENTY_FOOT_CONTAINER` | `DRY_VAN` |
| `FORTY_FIVE_FOOT_HIGHCUBE_CONTAINER` | `DRY_VAN` |
| `FORTY_FOOT_HIGHCUBE_CONTAINER` | `DRY_VAN` |
| `FIFTY_THREE_FOOT_FLATBED` | `FLATBED` |
| *(unmapped)* | `POWER_ONLY` |

Original Relay enum is preserved in `rawData` for reference.

### Promotion Flow: Staging → Real Load
- Staged loads appear in a "Load Board" view in the dispatch UI
- User reviews scraped loads, clicks **"Book"** to promote to a real Load
- Book action creates a Load record from the staged data, sets status to `BOOKED`
- Booked load is removed from Redis staging

### Rate Filtering
Filter scraped loads against carrier and driver preferences before pushing to staging.
The API already has the building blocks:

**Carrier-level:**
- `carrier.minimumRatePerMile` — reject loads below this threshold

**Driver-level (JSON preferences on Driver model):**
- `preferredLanes[]` — origin/dest state+city preferences
- `noGoZones[]` — states/cities to exclude
- `statePreferences[]` — state-level PREFERRED/NEUTRAL/AVOIDED
- `freightPreferences[]` — preferred equipment types (DRY_VAN, REEFER, etc.)
- `maxDaysOut` — max days away from home base

**Filtering happens API-side** during ingestion:
1. Extension sends all scraped loads to `POST /api/v1/scraper/ingest`
2. Scraper service loads carrier + active driver preferences
3. Filters out loads that fail:
   - `ratePerMile < carrier.minimumRatePerMile`
   - Equipment type not in driver's `freightPreferences`
   - Origin/destination in driver's `noGoZones`
   - `totalDuration > driver.maxTripDuration` (new preference)
   - Pickup time outside driver's `availabilityWindow` (new preference)
4. Remaining loads stored in Redis staging
5. Response includes: `{ ingested: 35, filtered: 10, duplicates: 5, total: 50, filterReasons: { belowMinRate: 3, wrongEquipment: 2, noGoZone: 1, tooLong: 2, outsideAvailability: 2 } }`

### Schema Changes Required (Driver model)

New preference fields to add to Driver:

```prisma
maxTripDuration      Int?      // max acceptable trip duration in minutes
driverType           DriverType? // LOCAL, REGIONAL, OTR
weeklySchedule       Json?     // per-day availability (see structure below)
```

**`weeklySchedule` JSON structure:**
```json
{
  "monday":    { "available": true, "start": "06:00", "end": "18:00" },
  "tuesday":   { "available": true, "start": "06:00", "end": "18:00" },
  "wednesday": { "available": true, "start": "06:00", "end": "18:00" },
  "thursday":  { "available": true, "start": "06:00", "end": "18:00" },
  "friday":    { "available": true, "start": "06:00", "end": "18:00" },
  "saturday":  { "available": true, "start": "06:00", "end": "12:00" },
  "sunday":    { "available": false }
}
```

**Filtering logic by driver type:**

| Driver Type | How availability is checked |
|---|---|
| **LOCAL** | Pickup time must fall within the driver's schedule for that day of week. Load must complete (lastDeliveryTime) same day or within schedule. |
| **REGIONAL** | Same as LOCAL but with wider radius tolerance. Uses `weeklySchedule`. |
| **OTR** | Available 24/7 during "out" periods. Filter uses existing `maxDaysOut` — reject loads that would extend the current trip chain beyond max days. No daily schedule needed. |

**Existing field reuse:**
- `maxDaysOut` (already on Driver) — caps OTR trip chain length
- `maxTripDuration` (new) — max single-load duration in minutes, applies to all driver types

**Example filter scenarios:**
- Local driver, schedule says Sunday=off → Relay load with Sunday pickup → filtered out
- Local driver, schedule says Mon 06:00-18:00 → load with 22:30 pickup → filtered out
- OTR driver, maxDaysOut=5, already 4 days out → 2-day load → filtered out
- Any driver, maxTripDuration=480 → 6h 8m (368 min) load → passes
- Any driver, maxTripDuration=180 → 6h 8m (368 min) load → filtered out
