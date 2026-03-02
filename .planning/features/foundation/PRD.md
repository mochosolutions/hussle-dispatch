# Shared Context Preamble

> Every feature PRD should carry this context. It defines the business rules, roles, and patterns that span the entire system.

## Business Model

**Two Carrier Types, Two Financial Flows:**

- **COMPANY_ASSET (Own Fleet):** Company owns/leases the truck. Broker pays the company the full load rate. Dispatch fee calculated as percentage of load rate (or rate + accessorials if configured), split between company and Jr.
- **EXTERNAL_CARRIER (Dispatch Service):** Company dispatches for independent carriers with their own MC. Carrier must complete onboarding before load assignment. Broker pays carrier directly. Carrier pays company a dispatch fee, split between company and Jr.
- **OWNER_OPERATOR:** In data model but NOT implemented in MVP. System rejects attempts to use this carrier type.

**Financial Rules:**

| Rule | Formula |
|------|---------|
| Dispatch fee | `customerRate × feePercent` (or `(customerRate + accessorials) × feePercent` if carrier has feeIncludesAccessorials) |
| Partner split | `dispatchFee × partnerSplitPercent` |
| Company share | `dispatchFee − partnerSplit` |
| Rounding | Banker's rounding (half to even), 2 decimal places, applied once at final stored value |

**Financial field lifecycle:**
- QUOTED: customerRate may be set, financial fields are null
- BOOKED (carrier assigned): dispatchFee, partnerSplit, ratePerMile calculated and stored
- If carrier or rate changes while BOOKED: financials recalculate
- DISPATCHED and beyond: financial fields are frozen

**DISPATCHER role restriction:** API never includes partnerSplit in responses to DISPATCHER users.

**Prohibited Commodities:** Configurable per org. Default: garbage, refuse, recyclables, dirty recyclables. Checked only in Load Creator (not load intelligence).

## Role Permissions Matrix

| Permission | ADMIN | DISPATCHER | VIEWER |
|-----------|-------|------------|--------|
| Full access to all features | Yes | — | — |
| Create/manage loads | Yes | Yes | — |
| Upload broker rate cons | Yes | Yes | — |
| Update load statuses | Yes | Yes (except EXCEPTION, PAID) | — |
| Generate invoice drafts | Yes | Yes | — |
| Approve/send invoices | Yes | — | — |
| View carriers/drivers/vehicles/places | Yes | Yes | Yes (read-only) |
| Create/edit places | Yes | Yes | — |
| Delete carriers/drivers/vehicles/places | Yes | — | — |
| See partner split amounts | Yes | — | — |
| See financial data | Yes | Yes | — |
| Flag EXCEPTION | Yes | — | — |
| Mark PAID | Yes | — | — |
| Access load intelligence feed | Yes | Yes | — |
| View dispatch board (read-only) | Yes | Yes | Yes |
| Invite users | Yes | — | — |
| Cancel loads | Yes | Yes | — |

## State Machine Overview

**13 Statuses:** QUOTED → BOOKED → DISPATCHED → EN_ROUTE_PICKUP → AT_PICKUP → IN_TRANSIT → AT_DELIVERY → DELIVERED → INVOICE_PENDING → INVOICED → PAID. Plus EXCEPTION, CANCELED, TONU.

**Kanban Groups:**

| Column | Color | Statuses |
|--------|-------|----------|
| NEW | Yellow | QUOTED |
| BOOKED | Orange | BOOKED |
| ACTIVE | Green | DISPATCHED, EN_ROUTE_PICKUP, AT_PICKUP, IN_TRANSIT, AT_DELIVERY |
| DELIVERED | Purple | DELIVERED, INVOICE_PENDING |
| COMPLETE | Gray | INVOICED, PAID |
| ISSUES | Red | EXCEPTION, CANCELED, TONU |

**Transition Map:**

| From | Can Go To | Who |
|------|-----------|-----|
| QUOTED | BOOKED, CANCELED | ADMIN, DISPATCHER |
| BOOKED | DISPATCHED, CANCELED | ADMIN, DISPATCHER |
| DISPATCHED | EN_ROUTE_PICKUP, TONU, CANCELED | ADMIN, DISPATCHER |
| EN_ROUTE_PICKUP | AT_PICKUP, TONU | ADMIN, DISPATCHER |
| AT_PICKUP | IN_TRANSIT, TONU | ADMIN, DISPATCHER |
| IN_TRANSIT | AT_DELIVERY, EXCEPTION | ADMIN, DISP (Exception: ADMIN only) |
| AT_DELIVERY | DELIVERED, EXCEPTION | ADMIN, DISP (Exception: ADMIN only) |
| DELIVERED | INVOICE_PENDING, EXCEPTION | System (auto), ADMIN for Exception |
| INVOICE_PENDING | INVOICED | ADMIN (via invoice approval) |
| INVOICED | PAID | ADMIN (via mark paid) |
| PAID | (terminal) | — |
| EXCEPTION | INVOICED | ADMIN |
| CANCELED | (terminal) | — |
| TONU | INVOICED | ADMIN, DISPATCHER |

**Prerequisites:** BOOKED requires carrier. DISPATCHED requires driver + vehicle + onboarding gate (external). CANCELED/EXCEPTION require notes. TONU auto-creates $250 accessorial.

**Side Effects:** → BOOKED: calculate financials. → DISPATCHED: freeze financials. → DELIVERED: auto-generate invoice, → INVOICE_PENDING. → TONU: auto $250 accessorial + invoice. Every transition: LoadStatusHistory record.

**Warnings (soft):** → DISPATCHED without rate con. → DELIVERED without signed BOL. → DISPATCHED with driver < 10 available hours.

## Error Handling Patterns

All features must use typed error classes extending a common base. Specific patterns:

| Scenario | UX |
|----------|-----|
| Invalid status transition | Toast: "Cannot move to [status]. Allowed: [list]" |
| Concurrent edit | "Updated by [user] at [time]. Please refresh." |
| S3 upload fails | "Upload failed. Try again." Retry button. |
| Email fails (3 retries) | "Email failed. PDF saved — download manually." |
| Onboarding docs missing | Hard block: "[Carrier] missing: [doc list]. Complete onboarding first." |
| Insurance expired | Hard block: "[Carrier] insurance expired [date]." |
| Prohibited commodity | Hard block: "This commodity is prohibited per company policy." |
| Dispatching without rate con | Soft warning: "No broker rate con on file. Continue anyway?" |
| Invoice without signed BOL | Warning flag: "Missing signed BOL." |
| Driver no-go zone | Warning: "[Driver] has [state] as no-go zone. Assign anyway?" |
| Redis unavailable | Intel feed: "Load intelligence temporarily unavailable." Dispatch board unaffected. |
| Chrome extension: DOM changed | Extension pauses: "DAT layout may have changed — update available" |

## Directory Mapping (TDD → Actual Paths)

| TDD Reference | Actual Directory | Notes |
|---------------|-----------------|-------|
| `packages/api/` | `hussle-app-dispatch-api/` | Express + Prisma backend |
| `packages/web/` | `hussle-app-dispatch-ui/` | React + Vite + MUI frontend |
| `packages/shared/` | `mocho-ui/` (partial) | Component library; shared types/utils may need a new shared package or go in api |
| `extension/` | Created during chrome-extension feature | Chrome Extension (Manifest V3) |

## Pagination Standard

- Offset-based, default 25, max 100
- Response: `{ data, meta: { page, limit, total, totalPages, hasMore } }`
- Sort: `?sort=field&order=asc|desc` (default: createdAt desc)
- Decimals serialized as strings in JSON
- Intelligence feed: paginated from Redis sorted set, not Postgres

## Sequential Number Generation

- Load: `LD-{YYYY}-{NNNNNN}` — continuous, no annual reset
- Invoice: `INV-{YYYY}-{NNNNNN}` — continuous
- Postgres sequence. Retry on collision (max 3).

## Presigned URL Upload Flow

1. Frontend requests presigned URL: `POST /api/v1/documents/presign`
2. API generates S3 PUT URL (15-min expiry) + document record in "pending" state
3. Frontend uploads directly to S3
4. Frontend confirms: `POST /api/v1/documents/{id}/confirm`
5. API verifies file exists, updates record to "confirmed"

S3 structure: `{orgId}/loads/{loadId}/{type}/{filename}` and `{orgId}/carriers/{carrierId}/{type}/{filename}`. File limits: PDFs max 5MB, uploads max 10MB. Accepted: PDF, PNG, JPG, JPEG.

---

# Feature: Foundation

## Summary

Backend-only infrastructure layer that provides the Prisma schema (all 15+ models and enums), shared utilities (financials, state machine, pagination, sequences), scoring utilities (minBookRate, compositeScore, driverFit, chainScore, CPM), Redis/S3/geo configuration, onboarding gate, error classes, response envelope, auth middleware integration, constants, and seed data. Every other feature depends on this.

## Scope

**Does:**
- Define the complete Prisma schema with all models, enums, relations, and indexes
- Implement shared utilities: financial calculations (Decimal.js with banker's rounding), state machine (transitions, prerequisites, warnings, side effects), pagination helper, sequence generator
- Implement scoring utilities: minBookRate, compositeScore, driverFit, chainScore, CPM calculator
- Configure Redis client, S3 presign utility, geo lookup (city coords from Redis + haversine distance)
- Implement geo bootstrap script (CSV → Redis at startup, ~30K US city centroids)
- Define onboarding gate logic (carrier doc checks)
- Define shared constants (LoadStatus enum, kanban groups, equipment types, facility types, dock types, document types, contact types, roles, prohibited commodities default, market tiers, scoring weights, load sources)
- Implement error classes (typed, extending common base), response envelope
- Integrate auth middleware (from existing auth package)
- Create seed script (carriers, drivers, vehicles, contacts, org settings)
- Set up env/database/redis/s3/ses config modules

**Does NOT:**
- Create any UI components or pages
- Create API routes or controllers (those belong to each feature)
- Implement business logic for specific features (load CRUD, invoice generation, etc.)

## Capabilities

1. Prisma schema defines all domain models: Carrier, Driver, Vehicle, TruckExpense, Contact, Load, Stop, LoadStatusHistory, CheckCall, AccessorialCharge, Invoice, Document, Place, OrgSettings — plus all enums
2. Financial calculations use Decimal.js with banker's rounding, supporting both COMPANY_ASSET and EXTERNAL_CARRIER flows, feeIncludesAccessorials flag
3. State machine defines transitions map, admin-only transitions, notes-required transitions, prerequisites (carrier for BOOKED, driver+vehicle for DISPATCHED), warnings (no rate con, no BOL, low hours), side effects (calculate financials, freeze financials, auto-generate invoice, TONU accessorial)
4. Onboarding gate checks dispatchAgreementOnFile, insuranceCertOnFile + expiry, w9OnFile for EXTERNAL_CARRIER; skips for COMPANY_ASSET; rejects OWNER_OPERATOR
5. Scoring utilities: minBookRate = `(vehicleCPM × totalMiles) / (1 - feePercent/100) × (1 + profitMargin)`, rounded up to nearest $50. Composite score: CPM Profitability (0-40) + Destination Market (0-30) + Driver Fit (0-30). Chain score: Chain Profitability (0-40) + Return Positioning (0-35) + Time Efficiency (0-25)
6. Geo utilities: getCityCoords from Redis hash, haversine distance in miles
7. Pagination: offset-based with meta envelope
8. Sequence generator: `LD-{YYYY}-{NNNNNN}` and `INV-{YYYY}-{NNNNNN}` with collision retry

## Success Criteria

- GIVEN a new database WHEN migration runs THEN all 15+ models and enums are created without errors
- GIVEN customerRate=$2800, feePercent=10%, partnerSplitPercent=50%, feeIncludesAccessorials=false WHEN calculateLoadFinancials runs THEN dispatchFee=$280, partnerSplit=$140, companyShare=$140
- GIVEN an EXTERNAL_CARRIER missing W-9 WHEN checkCarrierOnboarding runs THEN returns `{ allowed: false, missingDocuments: ['W-9'] }`
- GIVEN a COMPANY_ASSET carrier WHEN checkCarrierOnboarding runs THEN returns `{ allowed: true, missingDocuments: [] }`
- GIVEN vehicleCPM=$0.85, totalMiles=800, feePercent=10%, profitMargin=15% WHEN calculateMinBookRate runs THEN returns $900 (rounded up to nearest $50)
- GIVEN city="Charlotte", state="NC" WHEN getCityCoords queries Redis THEN returns valid lat/lng
- GIVEN two city coordinates WHEN haversineDistance runs THEN returns distance in miles within 1% accuracy
- GIVEN seed script runs THEN at least 2 carriers (one COMPANY_ASSET, one EXTERNAL_CARRIER), drivers, vehicles, contacts, and org settings are created

## Data Requirements

### Complete Prisma Schema

```prisma
// All models owned by foundation, consumed by other features

model Carrier {
  id                          String      @id @default(uuid())
  managedByOrgId              String
  carrierOrgId                String?
  name                        String
  type                        CarrierType @default(EXTERNAL_CARRIER)
  mcNumber                    String?
  dotNumber                   String?
  ein                         String?
  phone                       String?
  email                       String?
  address                     String?
  city                        String?
  state                       String?
  zip                         String?
  dispatchFeePercent          Decimal     @default(10.00) @db.Decimal(5, 2)
  partnerSplitPercent         Decimal     @default(50.00) @db.Decimal(5, 2)
  feeIncludesAccessorials     Boolean     @default(false)
  ownerOpPayPercent           Decimal?    @db.Decimal(5, 2)
  dispatchAgreementOnFile     Boolean     @default(false)
  dispatchAgreementSignedAt   DateTime?
  insuranceCertOnFile         Boolean     @default(false)
  insuranceExpiry             DateTime?
  w9OnFile                    Boolean     @default(false)
  carrierPacketOnFile         Boolean     @default(false)
  onboardingFlowId            String?
  onboardingStatus            String?
  authorityStatus             String?     @default("active")
  status                      String      @default("active")
  notes                       String?
  createdAt                   DateTime    @default(now())
  updatedAt                   DateTime    @updatedAt
  deletedAt                   DateTime?
  managedByOrg                Organization  @relation("ManagedCarriers", fields: [managedByOrgId], references: [id])
  carrierOrg                  Organization? @relation("CarrierOrg", fields: [carrierOrgId], references: [id])
  drivers                     Driver[]
  vehicles                    Vehicle[]
  loads                       Load[]
  invoices                    Invoice[]
  documents                   Document[]    @relation("CarrierDocuments")
  @@index([managedByOrgId])
}

model Contact {
  id                     String      @id @default(uuid())
  organizationId         String
  type                   ContactType
  companyName            String
  contactName            String?
  phone                  String?
  email                  String?
  mcNumber               String?
  address                String?
  city                   String?
  state                  String?
  zip                    String?
  paymentTerms           String      @default("net_30")
  paymentTermsDays       Int         @default(30)
  quickPayDiscount       Decimal?    @db.Decimal(5, 2)
  carrierPacketSentAt    DateTime?
  notes                  String?
  createdAt              DateTime    @default(now())
  updatedAt              DateTime    @updatedAt
  deletedAt              DateTime?
  organization           Organization @relation(fields: [organizationId], references: [id])
  loadsAsBroker          Load[]      @relation("LoadBroker")
  loadsAsShipper         Load[]      @relation("LoadShipper")
  loadsAsConsignee       Load[]      @relation("LoadConsignee")
  stopsAsFacility        Stop[]
  places                 Place[]
  @@index([organizationId])
}

model Driver {
  id              String    @id @default(uuid())
  carrierId       String
  name            String
  phone           String?
  email           String?
  cdlNumber       String?
  cdlState        String?
  cdlExpiry       DateTime?
  availableHours  Decimal?  @db.Decimal(4, 1)
  currentCity     String?
  currentState    String?
  homeBaseCity    String?
  homeBaseState   String?
  maxDaysOut      Int?      @default(5)
  preferredLanes  Json?     // [{ originState, destState, originCity?, destCity? }]
  noGoZones       Json?     // [{ state, city? }]
  isAvailable     Boolean   @default(true)
  status          String    @default("active")
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  carrier         Carrier   @relation(fields: [carrierId], references: [id])
  loads           Load[]
  @@index([carrierId])
}

model Vehicle {
  id                     String         @id @default(uuid())
  carrierId              String
  unitNumber             String
  type                   EquipmentType
  ownership              VehicleOwnership @default(OWNED)
  year                   Int?
  make                   String?
  model                  String?
  vin                    String?
  licensePlate           String?
  licensePlateState      String?
  emergencyContactName   String?
  emergencyContactPhone  String?
  warrantyInfo           String?
  monthlyGrossTarget     Decimal?       @db.Decimal(10, 2)
  monthlyMilesTarget     Int?
  workingDaysPerMonth    Int            @default(22)
  isActive               Boolean        @default(true)
  notes                  String?
  createdAt              DateTime       @default(now())
  updatedAt              DateTime       @updatedAt
  deletedAt              DateTime?
  carrier                Carrier        @relation(fields: [carrierId], references: [id])
  loads                  Load[]
  expenses               TruckExpense[]
  @@index([carrierId])
}

model TruckExpense {
  id              String          @id @default(uuid())
  vehicleId       String
  category        ExpenseCategory
  expenseKey      String
  label           String
  monthlyAmount   Decimal         @default(0) @db.Decimal(10, 2)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  vehicle         Vehicle         @relation(fields: [vehicleId], references: [id])
  @@unique([vehicleId, expenseKey])
}

model Load {
  id                     String      @id @default(uuid())
  organizationId         String
  loadNumber             String
  carrierId              String?
  driverId               String?
  vehicleId              String?
  brokerId               String?
  shipperId              String?
  consigneeId            String?
  brokerRefNumber        String?
  equipmentType          EquipmentType?
  isHazmat               Boolean     @default(false)
  isTarp                 Boolean     @default(false)
  isTeamDriver           Boolean     @default(false)
  commodity              String?
  weight                 Int?
  pieceCount             Int?
  loadedMiles            Int?
  deadheadMiles          Int?
  totalMiles             Int?
  customerRate           Decimal?    @db.Decimal(10, 2)
  carrierRate            Decimal?    @db.Decimal(10, 2)
  dispatchFee            Decimal?    @db.Decimal(10, 2)
  partnerSplit           Decimal?    @db.Decimal(10, 2)
  ratePerMile            Decimal?    @db.Decimal(6, 2)
  status                 LoadStatus  @default(QUOTED)
  rateConReceivedAt      DateTime?
  bolUnsignedAt          DateTime?
  bolSignedAt            DateTime?
  dispatcherNotes        String?
  driverInstructions     String?
  scrapedLoadId          String?     // Redis key reference (no FK)
  plannedNextLoadRef     Json?       // { scrapedLoadId, origin, dest, rate, broker, pickupDate }
  createdByUserId        String?
  updatedByUserId        String?
  createdAt              DateTime    @default(now())
  updatedAt              DateTime    @updatedAt
  deletedAt              DateTime?
  organization           Organization     @relation(fields: [organizationId], references: [id])
  carrier                Carrier?         @relation(fields: [carrierId], references: [id])
  driver                 Driver?          @relation(fields: [driverId], references: [id])
  vehicle                Vehicle?         @relation(fields: [vehicleId], references: [id])
  broker                 Contact?         @relation("LoadBroker", fields: [brokerId], references: [id])
  shipper                Contact?         @relation("LoadShipper", fields: [shipperId], references: [id])
  consignee              Contact?         @relation("LoadConsignee", fields: [consigneeId], references: [id])
  stops                  Stop[]
  statusHistory          LoadStatusHistory[]
  checkCalls             CheckCall[]
  accessorialCharges     AccessorialCharge[]
  invoices               Invoice[]
  documents              Document[]
  @@unique([organizationId, loadNumber])
  @@index([organizationId])
  @@index([status])
  @@index([carrierId])
}

model Stop {
  id                String    @id @default(uuid())
  loadId            String
  contactId         String?
  placeId           String?
  type              StopType
  sequence          Int
  facilityName      String?
  address           String?
  city              String?
  state             String?
  zip               String?
  appointmentDate   DateTime?
  appointmentTime   String?
  appointmentNumber String?
  arrivalTime       DateTime?
  departureTime     DateTime?
  contactName       String?
  contactPhone      String?
  notes             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  load              Load      @relation(fields: [loadId], references: [id], onDelete: Cascade)
  facility          Contact?  @relation(fields: [contactId], references: [id])
  place             Place?    @relation(fields: [placeId], references: [id])
  @@index([loadId])
  @@index([placeId])
}

model Place {
  id                    String         @id @default(uuid())
  organizationId        String
  contactId             String?
  name                  String
  address               String?
  address2              String?
  city                  String
  state                 String
  zip                   String?
  latitude              Decimal?       @db.Decimal(10, 7)
  longitude             Decimal?       @db.Decimal(10, 7)
  geoSource             GeoSource      @default(AUTO)
  facilityType          FacilityType?
  operatingHours        String?
  receivingHours        String?
  appointmentRequired   Boolean        @default(false)
  dockType              DockType?
  contactName           String?
  contactPhone          String?
  contactEmail          String?
  checkInProcedures     String?
  lumperRequired        Boolean        @default(false)
  ppeRequired           Boolean        @default(false)
  notes                 String?
  status                String         @default("active")
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
  deletedAt             DateTime?
  organization          Organization   @relation(fields: [organizationId], references: [id])
  contact               Contact?       @relation(fields: [contactId], references: [id])
  stops                 Stop[]
  @@index([organizationId])
  @@index([organizationId, city, state])
  @@index([contactId])
}

model LoadStatusHistory {
  id              String      @id @default(uuid())
  loadId          String
  fromStatus      LoadStatus?
  toStatus        LoadStatus
  changedByUserId String?
  notes           String?
  createdAt       DateTime    @default(now())
  load            Load        @relation(fields: [loadId], references: [id], onDelete: Cascade)
  changedBy       User?       @relation(fields: [changedByUserId], references: [id])
  @@index([loadId])
}

model CheckCall {
  id                   String    @id @default(uuid())
  loadId               String
  calledByUserId       String?
  location             String?
  latitude             Decimal?  @db.Decimal(10, 7)
  longitude            Decimal?  @db.Decimal(10, 7)
  status               String?
  eta                  DateTime?
  brokerNotified       Boolean   @default(false)
  brokerNotes          String?
  notes                String?
  createdAt            DateTime  @default(now())
  load                 Load      @relation(fields: [loadId], references: [id], onDelete: Cascade)
  calledBy             User?     @relation(fields: [calledByUserId], references: [id])
  @@index([loadId])
}

model AccessorialCharge {
  id              String          @id @default(uuid())
  loadId          String
  type            AccessorialType
  description     String?
  amount          Decimal         @db.Decimal(10, 2)
  billTo          String          @default("customer")
  isAutoGenerated Boolean         @default(false)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  load            Load            @relation(fields: [loadId], references: [id], onDelete: Cascade)
  @@index([loadId])
}

model Invoice {
  id                String        @id @default(uuid())
  loadId            String
  carrierId         String?
  invoiceNumber     String        @unique
  type              InvoiceType
  subtotal          Decimal       @db.Decimal(10, 2)
  accessorials      Decimal       @default(0) @db.Decimal(10, 2)
  totalAmount       Decimal       @db.Decimal(10, 2)
  paymentTerms      String        @default("net_30")
  paymentTermsDays  Int           @default(30)
  dueDate           DateTime
  missingSignedBol  Boolean       @default(false)
  status            InvoiceStatus @default(DRAFT)
  sentAt            DateTime?
  sentTo            String?
  paidAt            DateTime?
  paidAmount        Decimal?      @db.Decimal(10, 2)
  paymentMethod     String?
  paymentReference  String?
  pdfUrl            String?
  createdByUserId   String?
  approvedByUserId  String?
  approvedAt        DateTime?
  notes             String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  load              Load          @relation(fields: [loadId], references: [id])
  carrier           Carrier?      @relation(fields: [carrierId], references: [id])
  @@index([loadId])
  @@index([status])
}

model Document {
  id               String       @id @default(uuid())
  organizationId   String
  loadId           String?
  carrierId        String?
  type             DocumentType
  fileName         String
  fileSize         Int?
  mimeType         String?
  s3Key            String
  s3Url            String
  uploadStatus     String       @default("pending")
  isArchived       Boolean      @default(false)
  uploadedByUserId String?
  notes            String?
  createdAt        DateTime     @default(now())
  organization     Organization @relation(fields: [organizationId], references: [id])
  load             Load?        @relation(fields: [loadId], references: [id])
  carrier          Carrier?     @relation("CarrierDocuments", fields: [carrierId], references: [id])
  @@index([loadId])
  @@index([carrierId])
  @@index([organizationId])
}

model OrgSettings {
  id                           String    @id @default(uuid())
  organizationId               String    @unique
  defaultTonuFee               Decimal   @default(250.00) @db.Decimal(10, 2)
  prohibitedCommodities        String[]  @default(["garbage", "refuse", "recyclables", "dirty recyclables"])
  weeklyGrossTarget            Decimal   @default(5000.00) @db.Decimal(10, 2)
  defaultDetentionRate         Decimal   @default(25.00) @db.Decimal(10, 2)
  detentionFreeHours           Int       @default(2)
  minBookRateProfitMargin      Decimal   @default(0.15) @db.Decimal(3, 2)
  defaultMaxDaysOut            Int       @default(5)
  chainDepthThresholdMiles     Int       @default(500)
  backhaulSearchRadiusMiles    Int       @default(50)
  autoScrapingEnabled          Boolean   @default(true)
  loadIntelEmailAddress        String?
  sesFromEmail                 String?
  companyLogoUrl               String?
  organization                 Organization @relation(fields: [organizationId], references: [id])
}

// --- Enums ---
enum CarrierType { COMPANY_ASSET; OWNER_OPERATOR; EXTERNAL_CARRIER }
enum ContactType { BROKER; SHIPPER; CONSIGNEE; FACTORING }
enum EquipmentType { DRY_VAN; REEFER; FLATBED; STEP_DECK; BOX_TRUCK; HOTSHOT; POWER_ONLY }
enum VehicleOwnership { OWNED; LEASED }
enum ExpenseCategory { FIXED; VARIABLE; SERVICE; WAGE; DEDUCTION }
enum LoadStatus { QUOTED; BOOKED; DISPATCHED; EN_ROUTE_PICKUP; AT_PICKUP; IN_TRANSIT; AT_DELIVERY; DELIVERED; INVOICE_PENDING; INVOICED; PAID; EXCEPTION; CANCELED; TONU }
enum StopType { PICKUP; DELIVERY; STOP_OFF; DROP_HOOK; LIVE_UNLOAD }
enum FacilityType { WAREHOUSE; DISTRIBUTION_CENTER; CROSS_DOCK; COLD_STORAGE; PORT; RAIL_YARD; TRUCK_STOP; DROP_YARD; MANUFACTURING; RETAIL; FARM; CONSTRUCTION_SITE; MILITARY; GOVERNMENT; RESIDENTIAL; OTHER }
enum DockType { DOCK_HIGH; GROUND_LEVEL; BOTH; NONE }
enum GeoSource { AUTO; MANUAL }
enum AccessorialType { DETENTION; LUMPER; TONU; LAYOVER; DRIVER_ASSIST; FUEL_SURCHARGE; TARP; TOLL; OTHER }
enum InvoiceType { CUSTOMER; DISPATCH_FEE }
enum InvoiceStatus { DRAFT; APPROVED; SENT; PARTIALLY_PAID; PAID; OVERDUE; VOID }
enum DocumentType { BROKER_RATE_CON; BOL_UNSIGNED; BOL_SIGNED; DISPATCH_AGREEMENT; INSURANCE_CERT; W9; CARRIER_PACKET; INVOICE; LUMPER_RECEIPT; SCALE_TICKET; OTHER }
```

### Redis Data Structures

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `intel:{orgId}:{loadHash}` | String (JSON) | 24h | Individual load with per-truck scores |
| `intel:feed:{orgId}` | Sorted Set | none* | Feed ranked by best composite score |
| `intel:dismissed:{orgId}` | Set | 24h | Dismissed load hashes |
| `intel:chain:{orgId}:{loadHash}` | String (JSON) | 24h | Cached chain results per load |
| `market:{state}:{city}` | String (JSON) | 6h | Market strength snapshot |
| `geo:cities` | Hash | none | US city centroids (~30K entries) |

## User Flows

1. **Migration:** Developer runs `npx prisma migrate dev` → all tables and enums created
2. **Seed:** Developer runs `npx prisma db seed` → sample carriers, drivers, vehicles, contacts, org settings populated
3. **Geo bootstrap:** On API startup, `geoBootstrap.ts` reads `data/us-cities.csv` and populates `geo:cities` Redis hash

## Affected Services

- `hussle-app-dispatch-api` only (backend)

## Technical Context

**mocho-ui components:** None (backend only)

**API Package:** `hussle-app-dispatch-api/` must be scaffolded from scratch (Express + Prisma + TypeScript). Currently only contains a CLAUDE.md. BE-001 handles full scaffolding + initial migration. After scaffolding, the package must be registered in the workspace root package.json and packages.json.

**All shared utilities live in `hussle-app-dispatch-api/src/shared/`:**

| Utility | TDD Reference | Actual Path |
|---------|---------------|-------------|
| Financial calculations | `packages/shared/src/utils/pricing.ts` | `hussle-app-dispatch-api/src/shared/financials.ts` |
| State machine | `packages/shared/src/constants/loadStatuses.ts` | `hussle-app-dispatch-api/src/shared/stateMachine.ts` |
| Onboarding gate | `packages/api/src/shared/onboardingGate.ts` | `hussle-app-dispatch-api/src/shared/onboardingGate.ts` |
| Pagination | `packages/api/src/shared/pagination.ts` | `hussle-app-dispatch-api/src/shared/pagination.ts` |
| S3 presign | `packages/api/src/shared/s3Presign.ts` | `hussle-app-dispatch-api/src/shared/s3Presign.ts` |
| Sequence generator | `packages/api/src/shared/sequenceGenerator.ts` | `hussle-app-dispatch-api/src/shared/sequenceGenerator.ts` |
| Geo lookup | `packages/api/src/shared/geoLookup.ts` | `hussle-app-dispatch-api/src/shared/geoLookup.ts` |
| Redis client | `packages/api/src/shared/redisClient.ts` | `hussle-app-dispatch-api/src/shared/redisClient.ts` |
| Min book rate | `packages/shared/src/utils/minBookRate.ts` | `hussle-app-dispatch-api/src/shared/scoring/minBookRate.ts` |
| Composite score | `packages/shared/src/utils/compositeScore.ts` | `hussle-app-dispatch-api/src/shared/scoring/compositeScore.ts` |
| Chain score | `packages/shared/src/utils/chainScore.ts` | `hussle-app-dispatch-api/src/shared/scoring/chainScore.ts` |
| Driver fit | `packages/shared/src/utils/driverFit.ts` | `hussle-app-dispatch-api/src/shared/scoring/driverFit.ts` |
| CPM calculator | `packages/shared/src/utils/cpm.ts` | `hussle-app-dispatch-api/src/shared/scoring/cpm.ts` |
| Haversine | `packages/api/src/shared/geoLookup.ts` | `hussle-app-dispatch-api/src/shared/geoLookup.ts` |
| Constants | `packages/shared/src/constants/*` | `hussle-app-dispatch-api/src/shared/constants/` |
| Error classes | N/A | `hussle-app-dispatch-api/src/shared/errors.ts` |
| Response envelope | N/A | `hussle-app-dispatch-api/src/shared/responseEnvelope.ts` |

**Existing Code Leveraged:**
- Auth module (`packages/auth/`) — provides Cognito auth, Redis sessions, middleware that injects `req.user`, `req.organizationId`, `req.orgSlug`
- mocho-ui — not used by foundation (backend only)

**Key Technical Decisions:**
- BE-001 scaffolds the full API package (Express + Prisma + TypeScript + Jest)
- All scoring utilities go in `hussle-app-dispatch-api/src/shared/scoring/` — extract to a shared package later if frontend needs them
- All financial math uses Decimal.js with banker's rounding
- State machine is a pure data structure (transition maps + pure functions), not a class
- Scoring utilities are pure functions with no side effects — consumed by load-intelligence at runtime
- Redis is used for ephemeral intelligence data; Postgres for everything persistent
- Geo data bootstrapped from CSV at startup, not fetched from external API
- TDD (test-first) for logic-heavy stories: financials, state machine, onboarding gate, scoring utils

**Note:** `hussle-app-dispatch-api` is not yet registered in packages.json. After BE-001 completes, `/bootstrap` should be re-run to register the service. Until then, validation commands are set based on the expected package structure.

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S2 Business Model | 55-94 |
| `docs/prd.md` | S3 Roles & Permissions | 95-126 |
| `docs/prd.md` | S5 State Machine | 809-877 |
| `docs/prd.md` | S8 Sequences | 925-931 |
| `docs/prd.md` | S9 Presigned URLs | 934-948 |
| `docs/prd.md` | S10 Error Handling | 950-976 |
| `docs/prd.md` | S11 Pagination | 978-987 |
| `docs/tdd.md` | S2 Project Structure | 72-258 |
| `docs/tdd.md` | S3 Prisma Schema (ALL models) | 262-842 |
| `docs/tdd.md` | S4 Redis Data Structures | 846-1006 |
| `docs/tdd.md` | S5 State Machine impl | 1010-1070 |
| `docs/tdd.md` | S6 Onboarding Gate | 1074-1105 |
| `docs/tdd.md` | S7 Financial Calculations | 1109-1148 |
| `docs/tdd.md` | S8 Scoring Utilities | 1152-1272 |
| `docs/tdd.md` | S8.5 Geo Utilities | 1312-1335 |

## Screenshots

None (backend only).

## Dependencies

- None. This is the root of the dependency graph.
