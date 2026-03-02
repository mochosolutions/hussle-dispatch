# Registry: hussle-app-dispatch-api

> Last updated: BE-003 (Financial calculations with Decimal.js)
> Service directory: `hussle-app-dispatch-api/`

---

## Package Info

| Field | Value |
|-------|-------|
| Name | `hussle-app-dispatch-api` |
| Port | 3001 |
| Node version | 20 |
| Framework | Express 4.x |
| ORM | Prisma 5.x |
| Language | TypeScript 5.x (strict) |

---

## Directory Structure

```
hussle-app-dispatch-api/
├── prisma/
│   ├── schema.prisma          # Complete domain schema (15 models + enums)
│   ├── seed.ts                # Dev seed data (BE-009: full sample data — 2 carriers, 3 drivers, 3 vehicles, TruckExpenses, 3 contacts, OrgSettings, 3 places)
│   └── migrations/
│       └── 20260302013455_init/migration.sql
├── src/
│   ├── index.ts               # Entry point — connects Redis, runs geoBootstrap, starts Express
│   ├── app.ts                 # Express app factory (createApp)
│   ├── config/
│   │   ├── env.ts             # Typed env config (DATABASE_URL, REDIS_URL, S3_BUCKET, AWS_REGION, etc.)
│   │   ├── database.ts        # Prisma client singleton
│   │   ├── s3.ts              # S3Client singleton (AWS SDK v3, configured with AWS_REGION)
│   │   └── geoBootstrap.ts    # runGeoBootstrap(redis) — reads data/us-cities.csv, bulk-loads geo:cities hash
│   └── shared/
│       ├── errors.ts          # Typed error classes (AppError + subtypes)
│       ├── responseEnvelope.ts # sendSingle, sendList, buildPaginationMeta, success, paginated, buildErrorResponse
│       ├── redisClient.ts     # Redis singleton (ioredis, lazy connect, REDIS_URL)
│       ├── s3Presign.ts       # generatePresignedPutUrl, buildLoadDocumentKey, buildCarrierDocumentKey
│       ├── geoLookup.ts       # getCityCoords(redis, state, city), haversineDistance(lat1, lng1, lat2, lng2)
│       ├── financials.ts      # calculateLoadFinancials — Decimal.js ROUND_HALF_EVEN financial engine
│       ├── middleware/
│       │   └── errorHandler.ts # Centralized Express error handler
│       └── constants/
│           ├── index.ts           # Barrel re-export for all constants
│           ├── loadStatuses.ts    # LOAD_STATUSES, LoadStatus
│           ├── kanbanGroups.ts    # KANBAN_GROUPS, KanbanGroup, KanbanGroupKey
│           ├── stateMachine.ts    # ADMIN_ONLY_TRANSITIONS, NOTES_REQUIRED_TRANSITIONS
│           ├── equipmentTypes.ts  # EQUIPMENT_TYPES, EquipmentType
│           ├── facilityTypes.ts   # FACILITY_TYPES, DOCK_TYPES, FacilityType, DockType
│           ├── documentTypes.ts   # DOCUMENT_TYPES, DocumentType
│           ├── contactTypes.ts    # CONTACT_TYPES, ContactType
│           ├── roles.ts           # ROLES, Role
│           ├── commodities.ts     # PROHIBITED_COMMODITIES_DEFAULT
│           ├── marketTiers.ts     # MARKET_TIERS, MarketTier
│           ├── scoringWeights.ts  # SCORING_WEIGHTS, ScoringWeights
│           ├── loadSources.ts     # LOAD_SOURCES, LoadSource
│           ├── expenseCategories.ts # EXPENSE_CATEGORIES, ExpenseCategory
│           ├── vehicleOwnership.ts  # VEHICLE_OWNERSHIP, VehicleOwnershipType
│           ├── stopTypes.ts       # STOP_TYPES, StopType
│           ├── accessorialTypes.ts # ACCESSORIAL_TYPES, AccessorialType
│           ├── invoiceTypes.ts    # INVOICE_TYPES, INVOICE_STATUSES, InvoiceType, InvoiceStatus
│           ├── geoSources.ts      # GEO_SOURCES, GeoSource
│           └── carrierTypes.ts    # CARRIER_TYPES, CarrierType
├── __tests__/
│   └── app.test.ts            # Smoke tests (app instantiation, health route)
├── package.json
├── tsconfig.json
├── .env.example
└── Dockerfile.dev
```

---

## Config Exports

### `src/config/env.ts`

```typescript
import { env } from './config/env';
// env.PORT, env.NODE_ENV, env.DATABASE_URL, env.REDIS_URL,
// env.S3_BUCKET, env.AWS_REGION, env.SES_FROM_EMAIL
```

### `src/config/database.ts`

```typescript
import { prisma } from './config/database';
// Singleton PrismaClient
```

---

## Shared Exports

### `src/shared/errors.ts`

| Export | Type | Description |
|--------|------|-------------|
| `AppError` | class | Base error (statusCode, code, isOperational) |
| `NotFoundError` | class | 404 |
| `ValidationError` | class | 400 + details[] |
| `ConflictError` | class | 409 |
| `UnauthorizedError` | class | 401 |
| `ForbiddenError` | class | 403 |
| `InvalidTransitionError` | class | 422, includes allowedTransitions[] |
| `OnboardingBlockError` | class | 422, includes missingDocuments[] |
| `ProhibitedCommodityError` | class | 422 |
| `InsuranceExpiredError` | class | 422 |
| `ConcurrentEditError` | class | 409 |
| `OwnerOperatorNotSupportedError` | class | 422 |
| `isAppError` | function | Type guard: `error is AppError` |

### `src/shared/responseEnvelope.ts`

| Export | Description |
|--------|-------------|
| `sendSingle(res, data, statusCode?)` | Sends `{ data }` JSON response |
| `sendList(res, data[], meta, statusCode?)` | Sends `{ data, meta }` JSON response |
| `buildPaginationMeta(total, page, limit)` | Builds pagination meta object |
| `success(data)` | Returns `{ data }` plain object (no Express dep) |
| `paginated(data[], meta)` | Returns `{ data, meta }` plain object |
| `buildErrorResponse(appError)` | Returns `{ error: { code, message, details? } }` |
| `PaginationMeta` | type |
| `SingleResponse<T>` | type |
| `ListResponse<T>` | type |
| `ErrorResponse` | type |

### `src/shared/constants/index.ts`

All constants re-exported from this barrel. Import via:
```typescript
import { LOAD_STATUSES, KANBAN_GROUPS, ROLES, ... } from '../shared/constants';
```

| Export | Type | Description |
|--------|------|-------------|
| `LOAD_STATUSES` | `readonly LoadStatus[]` | All 14 load statuses |
| `LoadStatus` | type union | `'QUOTED' \| 'BOOKED' \| ...` |
| `KANBAN_GROUPS` | `KanbanGroupMap` | 6 groups with label, color, statuses |
| `KanbanGroup`, `KanbanGroupKey` | types | |
| `ADMIN_ONLY_TRANSITIONS` | `readonly LoadStatus[]` | `['EXCEPTION', 'PAID']` |
| `NOTES_REQUIRED_TRANSITIONS` | `readonly LoadStatus[]` | `['EXCEPTION', 'CANCELED']` |
| `EQUIPMENT_TYPES` | `readonly EquipmentType[]` | 7 types |
| `EquipmentType` | type union | |
| `FACILITY_TYPES` | `readonly FacilityType[]` | 16 types |
| `FacilityType` | type union | |
| `DOCK_TYPES` | `readonly DockType[]` | 4 types |
| `DockType` | type union | |
| `DOCUMENT_TYPES` | `readonly DocumentType[]` | 11 types |
| `DocumentType` | type union | |
| `CONTACT_TYPES` | `readonly ContactType[]` | 4 types |
| `ContactType` | type union | |
| `ROLES` | `{ ADMIN, DISPATCHER, VIEWER }` (frozen) | Role constants |
| `Role` | type union | |
| `PROHIBITED_COMMODITIES_DEFAULT` | `readonly string[]` | 4 default prohibited commodities |
| `MARKET_TIERS` | `{ STRONG, MODERATE, WEAK, UNKNOWN }` (frozen) | |
| `MarketTier` | type union | |
| `SCORING_WEIGHTS` | `ScoringWeights` (frozen) | composite + chain weights |
| `ScoringWeights`, `CompositeScoreWeights`, `ChainScoreWeights` | types | |
| `LOAD_SOURCES` | `readonly LoadSource[]` | `['DAT', 'MANUAL', 'EMAIL', 'DIRECT']` |
| `LoadSource` | type union | |
| `EXPENSE_CATEGORIES` | `readonly ExpenseCategory[]` | 5 categories |
| `ExpenseCategory` | type union | |
| `VEHICLE_OWNERSHIP` | `{ OWNED, LEASED }` (frozen) | |
| `VehicleOwnershipType` | type union | |
| `STOP_TYPES` | `readonly StopType[]` | 5 types |
| `StopType` | type union | |
| `ACCESSORIAL_TYPES` | `readonly AccessorialType[]` | 9 types |
| `AccessorialType` | type union | |
| `INVOICE_TYPES` | `readonly InvoiceType[]` | 2 types |
| `InvoiceType` | type union | |
| `INVOICE_STATUSES` | `readonly InvoiceStatus[]` | 7 statuses |
| `InvoiceStatus` | type union | |
| `GEO_SOURCES` | `{ AUTO, MANUAL }` (frozen) | |
| `GeoSource` | type union | |
| `CARRIER_TYPES` | `{ COMPANY_ASSET, OWNER_OPERATOR, EXTERNAL_CARRIER }` (frozen) | |
| `CarrierType` | type union | |

### `src/shared/redisClient.ts`

```typescript
import { redisClient } from './shared/redisClient';
// ioredis singleton — connect at startup via redisClient.connect()
```

### `src/config/s3.ts`

```typescript
import { s3Client } from './config/s3';
// @aws-sdk/client-s3 S3Client — configured with AWS_REGION
```

### `src/shared/s3Presign.ts`

| Export | Signature | Description |
|--------|-----------|-------------|
| `generatePresignedPutUrl` | `(bucket, key, contentType, maxSize) => Promise<PresignedPutResult>` | 15-min PUT URL; validates contentType + maxSize |
| `buildLoadDocumentKey` | `(orgId, loadId, type, filename) => string` | `{orgId}/loads/{loadId}/{type}/{filename}` |
| `buildCarrierDocumentKey` | `(orgId, carrierId, type, filename) => string` | `{orgId}/carriers/{carrierId}/{type}/{filename}` |
| `PresignedPutResult` | type | `{ url: string; key: string; expiresAt: Date }` |

Accepted content types: `application/pdf` (max 5 MB), `image/png`, `image/jpg`, `image/jpeg` (max 10 MB each).

### `src/shared/geoLookup.ts`

| Export | Signature | Description |
|--------|-----------|-------------|
| `getCityCoords` | `(redis, state, city) => Promise<CityCoords \| null>` | Looks up city in `geo:cities` hash; field: `{STATE}:{city_lowercase}` |
| `haversineDistance` | `(lat1, lng1, lat2, lng2) => number` | Great-circle distance in miles (R = 3959) |
| `CityCoords` | type | `{ lat: number; lng: number }` |

### `src/config/geoBootstrap.ts`

```typescript
import { runGeoBootstrap } from './config/geoBootstrap';
// runGeoBootstrap(redis) — call once at startup; reads data/us-cities.csv, bulk-loads geo:cities
```

### `data/us-cities.csv` (repo root)

161 US city centroids. Format: `state,city,lat,lng`. Loaded into Redis `geo:cities` at API startup.

### `src/shared/financials.ts`

| Export | Type | Description |
|--------|------|-------------|
| `calculateLoadFinancials` | function | Calculates load financials using Decimal.js with ROUND_HALF_EVEN. Accepts `LoadFinancialsInput`, returns `LoadFinancialsResult`. Throws `OwnerOperatorNotSupportedError` for OWNER_OPERATOR type (decision X-001). |
| `LoadFinancialsInput` | interface | `{ customerRate, accessorials, loadedMiles, carrier: { type, dispatchFeePercent, partnerSplitPercent, feeIncludesAccessorials } }` |
| `LoadFinancialsResult` | interface | `{ customerRate, accessorials, dispatchFee, partnerSplit, companyShare, totalRevenue, ratePerMile }` — all strings; ratePerMile is `string \| null` |

Financial rules:
- `dispatchFee = customerRate × feePercent` (or `(customerRate + accessorials) × feePercent` if `feeIncludesAccessorials`)
- `partnerSplit = dispatchFee × partnerSplitPercent`
- `companyShare = dispatchFee − partnerSplit`
- COMPANY_ASSET: `totalRevenue = customerRate + accessorials`
- EXTERNAL_CARRIER: `totalRevenue = dispatchFee`
- `ratePerMile = customerRate / loadedMiles` (null when loadedMiles is null or 0)

### `src/shared/middleware/errorHandler.ts`

```typescript
import { errorHandler } from './shared/middleware/errorHandler';
// Express error middleware — mount last on app
```

---

## Prisma Schema Models

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| `Organization` | id, name, slug | carriers, contacts, loads, places, documents, orgSettings |
| `User` | id, organizationId, email, role | statusChanges, checkCalls |
| `Carrier` | id, managedByOrgId, type (CarrierType), dispatchFeePercent, partnerSplitPercent | drivers, vehicles, loads, invoices, documents |
| `Contact` | id, organizationId, type (ContactType) | loadsAsBroker/Shipper/Consignee, stopsAsFacility, places |
| `Driver` | id, carrierId, availableHours, preferredLanes (Json), noGoZones (Json) | carrier, loads |
| `Vehicle` | id, carrierId, unitNumber, type (EquipmentType), ownership | carrier, loads, expenses |
| `TruckExpense` | id, vehicleId, category, expenseKey (unique per vehicle) | vehicle |
| `Load` | id, organizationId, loadNumber, status (LoadStatus), customerRate, dispatchFee, partnerSplit | carrier, driver, vehicle, stops, statusHistory, etc. |
| `Stop` | id, loadId, type (StopType), sequence | load, facility (Contact), place |
| `Place` | id, organizationId, city, state, geoSource (GeoSource) | organization, contact, stops |
| `LoadStatusHistory` | id, loadId, fromStatus, toStatus, changedByUserId | load, changedBy (User) |
| `CheckCall` | id, loadId, latitude, longitude, eta | load, calledBy (User) |
| `AccessorialCharge` | id, loadId, type (AccessorialType), amount, isAutoGenerated | load |
| `Invoice` | id, loadId, invoiceNumber (unique), type (InvoiceType), status (InvoiceStatus) | load, carrier |
| `Document` | id, organizationId, loadId?, carrierId?, type (DocumentType), s3Key | organization, load, carrier |
| `OrgSettings` | id, organizationId (unique), defaultTonuFee, prohibitedCommodities[] | organization |

---

## Prisma Enums

| Enum | Values |
|------|--------|
| `UserRole` | ADMIN, DISPATCHER, VIEWER |
| `CarrierType` | COMPANY_ASSET, OWNER_OPERATOR, EXTERNAL_CARRIER |
| `ContactType` | BROKER, SHIPPER, CONSIGNEE, FACTORING |
| `EquipmentType` | DRY_VAN, REEFER, FLATBED, STEP_DECK, BOX_TRUCK, HOTSHOT, POWER_ONLY |
| `VehicleOwnership` | OWNED, LEASED |
| `ExpenseCategory` | FIXED, VARIABLE, SERVICE, WAGE, DEDUCTION |
| `LoadStatus` | QUOTED, BOOKED, DISPATCHED, EN_ROUTE_PICKUP, AT_PICKUP, IN_TRANSIT, AT_DELIVERY, DELIVERED, INVOICE_PENDING, INVOICED, PAID, EXCEPTION, CANCELED, TONU |
| `StopType` | PICKUP, DELIVERY, STOP_OFF, DROP_HOOK, LIVE_UNLOAD |
| `FacilityType` | WAREHOUSE, DISTRIBUTION_CENTER, CROSS_DOCK, COLD_STORAGE, PORT, RAIL_YARD, TRUCK_STOP, DROP_YARD, MANUFACTURING, RETAIL, FARM, CONSTRUCTION_SITE, MILITARY, GOVERNMENT, RESIDENTIAL, OTHER |
| `DockType` | DOCK_HIGH, GROUND_LEVEL, BOTH, NONE |
| `GeoSource` | AUTO, MANUAL |
| `AccessorialType` | DETENTION, LUMPER, TONU, LAYOVER, DRIVER_ASSIST, FUEL_SURCHARGE, TARP, TOLL, OTHER |
| `InvoiceType` | CUSTOMER, DISPATCH_FEE |
| `InvoiceStatus` | DRAFT, APPROVED, SENT, PARTIALLY_PAID, PAID, OVERDUE, VOID |
| `DocumentType` | BROKER_RATE_CON, BOL_UNSIGNED, BOL_SIGNED, DISPATCH_AGREEMENT, INSURANCE_CERT, W9, CARRIER_PACKET, INVOICE, LUMPER_RECEIPT, SCALE_TICKET, OTHER |

---

## Future Stories — Integration Points

- **Auth middleware (L-007):** `Organization` and `User` models are stubs. When BE-auth integrates, they will be replaced. The auth module injects `req.user`, `req.organizationId`, `req.orgSlug`.
- **Redis client:** `ioredis` is in dependencies — use `src/shared/redisClient.ts` (created by BE-002+)
- **Shared utilities:** State machine, scoring, pagination, etc. go in `src/shared/` (created by later stories). Financial engine: `src/shared/financials.ts` (BE-003 done).
- **Feature routes:** Mounted on `app.ts` when each feature story implements its controllers
