# FleetCommand Feature Manifest

**Version:** 1.0
**Date:** March 1, 2026
**Purpose:** Single source of truth for splitting the master PRD/TDD into 9 feature-scoped PRDs for the MACHO workflow.

> **How to use this file:**
> 1. Run `/bootstrap` in the fleet-command repo
> 2. Run `/feature-init <key>` for each feature
> 3. Copy the relevant feature section into `.planning/features/<key>/PRD.md`
> 4. Run `/prd-refine <key>` and paste the conversation starter from this manifest
> 5. Repeat in dependency order

---

## Table of Contents

- [Shared Context Preamble](#shared-context-preamble)
- [Dependency Graph & Build Order](#dependency-graph--build-order)
- [Feature 1: foundation](#feature-1-foundation)
- [Feature 2: fleet-management](#feature-2-fleet-management)
- [Feature 3: place-management](#feature-3-place-management)
- [Feature 4: load-management](#feature-4-load-management)
- [Feature 5: documents-bol](#feature-5-documents-bol)
- [Feature 6: invoicing](#feature-6-invoicing)
- [Feature 7: dashboard](#feature-7-dashboard)
- [Feature 8: load-intelligence](#feature-8-load-intelligence)
- [Feature 9: chrome-extension](#feature-9-chrome-extension)

---

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

# Dependency Graph & Build Order

```
                    ┌─────────────┐
                    │  foundation  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ fleet-management │    │ place-management  │
    └────────┬─────────┘    └────────┬──────────┘
             │    ┌──────────────────┘
             │    │    ┌─────────────────────────────┐
             ▼    ▼    │                             │
    ┌──────────────────┤              ┌──────────────┴──────┐
    │ load-management  │              │ load-intelligence    │
    └───┬──────┬───────┘              └──────────┬──────────┘
        │      │                                 │
        ▼      │                                 ▼
  ┌───────────────┐  │              ┌────────────────────┐
  │ documents-bol │  │              │ chrome-extension    │
  └───────┬───────┘  │              └────────────────────┘
          │          │
          ▼          ▼
    ┌──────────┐  ┌───────────┐
    │ invoicing│  │ dashboard │
    └──────────┘  └───────────┘
```

## Build Phases

| Phase | Features | Dependencies | Parallel? |
|-------|----------|-------------|-----------|
| **Phase A** | `foundation` | None | No |
| **Phase B** | `fleet-management`, `place-management` | foundation | Yes (parallel) |
| **Phase C** | `load-management`, `load-intelligence` | fleet + place (loads), foundation + fleet (intel) | Yes (parallel) |
| **Phase D** | `documents-bol`, `invoicing`, `dashboard` | load-management | Yes (parallel, invoicing after docs-bol) |
| **Phase E** | `chrome-extension` | load-intelligence API | No |

---

# Feature 1: foundation

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

**Key shared utilities to implement:**

| Utility | Location (TDD reference) | Actual Path |
|---------|-------------------------|-------------|
| Financial calculations | `packages/shared/src/utils/pricing.ts` | `hussle-app-dispatch-api/src/shared/financials.ts` |
| State machine | `packages/shared/src/constants/loadStatuses.ts` | `hussle-app-dispatch-api/src/shared/` or shared constants package |
| Onboarding gate | `packages/api/src/shared/onboardingGate.ts` | `hussle-app-dispatch-api/src/shared/onboardingGate.ts` |
| Pagination | `packages/api/src/shared/pagination.ts` | `hussle-app-dispatch-api/src/shared/pagination.ts` |
| S3 presign | `packages/api/src/shared/s3Presign.ts` | `hussle-app-dispatch-api/src/shared/s3Presign.ts` |
| Sequence generator | `packages/api/src/shared/sequenceGenerator.ts` | `hussle-app-dispatch-api/src/shared/sequenceGenerator.ts` |
| Geo lookup | `packages/api/src/shared/geoLookup.ts` | `hussle-app-dispatch-api/src/shared/geoLookup.ts` |
| Redis client | `packages/api/src/shared/redisClient.ts` | `hussle-app-dispatch-api/src/shared/redisClient.ts` |
| Min book rate | `packages/shared/src/utils/minBookRate.ts` | Shared constants/utils |
| Composite score | `packages/shared/src/utils/compositeScore.ts` | Shared constants/utils |
| Chain score | `packages/shared/src/utils/chainScore.ts` | Shared constants/utils |
| Driver fit | `packages/shared/src/utils/driverFit.ts` | Shared constants/utils |
| CPM calculator | `packages/shared/src/utils/cpm.ts` | Shared constants/utils |
| Haversine | `packages/api/src/shared/geoLookup.ts` | `hussle-app-dispatch-api/src/shared/geoLookup.ts` |

**Key technical decisions:**
- All financial math uses Decimal.js with banker's rounding
- State machine is a pure data structure (transition maps + pure functions), not a class
- Scoring utilities are pure functions with no side effects — consumed by load-intelligence at runtime
- Redis is used for ephemeral intelligence data; Postgres for everything persistent
- Geo data bootstrapped from CSV at startup, not fetched from external API

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

## /prd-refine Conversation Starter

> This feature's requirements are defined in docs/prd.md lines 55-94 (Business Model), 95-126 (Roles), 809-877 (State Machine), 925-987 (Sequences/Pagination/Presigned URLs), 950-976 (Error Handling). The TDD at docs/tdd.md has the complete Prisma schema (lines 262-842), Redis data structures (846-1006), state machine implementation (1010-1070), onboarding gate (1074-1105), financial calculations (1109-1148), and all scoring utilities (1152-1335). This is backend-only — no UI. Generate stories for: schema + migration, shared utilities, Redis/S3/geo config, scoring utils, constants, error handling, auth middleware, seed script.

## Dependencies

- None. This is the root of the dependency graph.

---

# Feature 2: fleet-management

## Summary

Full CRUD for carriers, drivers, vehicles, and contacts with carrier onboarding gate enforcement, driver preferences (lanes, no-go zones, home base), vehicle CPM expense tracking, and list/detail pages for each entity.

## Scope

**Does:**
- Carriers CRUD (create, read, update, soft-delete) with onboarding fields + dispatch agreement handling
- Drivers CRUD with preferences: home base, max days out, preferred lanes, no-go zones
- Vehicles CRUD with CPM expense editor (monthly costs → cost per mile → daily min revenue)
- Contacts CRUD (broker, shipper, consignee, factoring)
- Onboarding gate enforcement on load assignment for EXTERNAL_CARRIER
- Insurance expiry tracking (30-day and 7-day warnings)
- Carrier list/detail pages, driver detail with preferences editor, vehicle detail with CPM editor
- Delete constraints: cannot deactivate carrier/driver/vehicle with active loads

**Does NOT:**
- Implement load assignment UI (that's load-management)
- Implement document upload flow (that's documents-bol — carrier onboarding doc booleans are set manually in MVP)
- Implement dispatch agreement PDF generation or email sending (that's invoicing/email)
- Implement driver fit scoring (that's foundation utilities consumed by load-intelligence)

## Capabilities

1. Carrier list: name, type badge, MC#, status, onboarding status (complete/incomplete), driver count, vehicle count
2. Carrier detail: contact info, compliance, financial terms (fee %, split %, feeIncludesAccessorials toggle), onboarding doc section with upload slots + indicators, drivers/vehicles/load-history tabs, insurance expiry warning
3. Driver detail: standard info, operational (availableHours, currentCity/State), preferences section (home base, maxDaysOut, preferred lanes table, no-go zones list)
4. Vehicle detail: ownership, emergency contact, warranty, CPM expense editor (same categories as existing CPM Calculator), auto-calculated monthly cost, cost per mile, daily minimum revenue
5. Contact CRUD: type-based (broker, shipper, consignee, factoring), payment terms, quick pay discount
6. Onboarding gate: blocks EXTERNAL_CARRIER load assignment if missing dispatch agreement, insurance cert (or expired), or W-9

## Success Criteria

- GIVEN a new external carrier with no documents WHEN ADMIN tries to assign to a load THEN blocked: "Missing: Dispatch Agreement, Insurance Certificate, W-9"
- GIVEN a carrier with expired insurance WHEN assignment attempted THEN blocked: "[Carrier] insurance expired on [date]"
- GIVEN a carrier with all docs on file and valid insurance WHEN assigned to load THEN assignment succeeds
- GIVEN COMPANY_ASSET carrier WHEN assigned to load THEN no onboarding gate check
- GIVEN external carrier missing insurance WHEN viewed THEN onboarding status shows "Incomplete" with missing items listed
- GIVEN vehicle with CPM expenses totaling $8,500/month and 10,000 miles target THEN CPM shows $0.85/mile
- GIVEN carrier with active load WHEN deactivation attempted THEN blocked with load list
- GIVEN driver with MT no-go WHEN assigning to Montana load THEN warning displayed (requires confirmation)
- GIVEN driver with NJ→PA preferred WHEN assigning NJ→PA load THEN "Preferred Lane" badge

## Data Requirements

**Prisma models (defined in foundation, consumed here):**
- Carrier (lines 274-322) — all fields
- Driver (lines 400-431) — all fields including preferences (preferredLanes, noGoZones JSON)
- Vehicle (lines 433-465) — all fields
- TruckExpense (lines 482-495) — expense categories for CPM
- Contact (lines 361-391) — all fields

**Depends on from foundation:**
- Onboarding gate utility (`checkCarrierOnboarding`)
- Pagination helper
- Error classes
- Auth middleware (role checks)

## User Flows

**Create External Carrier:**
1. ADMIN navigates to Carriers → clicks "Add Carrier"
2. Fills in name, type=EXTERNAL_CARRIER, MC#, contact info, financial terms
3. Saves → carrier created with onboarding status "Incomplete"
4. Uploads dispatch agreement, insurance cert, W-9 (toggles booleans in MVP)
5. Onboarding status becomes "Complete"

**Add Driver with Preferences:**
1. Navigate to carrier detail → Drivers tab → "Add Driver"
2. Fill in name, phone, CDL info
3. Set home base (city + state), max days out
4. Add preferred lanes (origin state → dest state, optional city refinement)
5. Add no-go zones (state, optional city)
6. Save

**CPM Expense Setup:**
1. Navigate to vehicle detail → "Edit Expenses"
2. Add expense rows: category (Fixed/Variable/Service/Wage/Deduction), key, label, monthly amount
3. System auto-calculates: total monthly cost, CPM (monthly cost / monthly miles target), daily minimum

## Affected Services

- `hussle-app-dispatch-api` — Carrier, Driver, Vehicle, Contact modules (routes, controllers, services, validation)
- `hussle-app-dispatch-ui` — Carrier list/detail pages, driver detail, vehicle detail, contact components

## Technical Context

**mocho-ui components:**
`MainLayout`, `PageWrapper`, `PageHeader`, `MainCard`, `Tabs`, `DataGrid`/`ActionsCell`, `FormDialog`, `TextField`, `SelectField`, `DateTimePickerField`, `ImageUploadField`, `CheckboxField`, `EditableSection`, `ReadOnlyFieldDisplay`, `ConfirmDeleteDialog`, `Avatar`, `Dot`, `EmptyState`, `ListSkeleton`, `FormSkeleton`, `createCrudSlice`, `createEntityModule`, `createCrudSelectors`, `useFormRef`

**Redux factories from @mocho/ui:**
- `createCrudSlice` — generates Redux slice with standard CRUD actions + async thunks
- `createEntityModule` — combines slice + selectors + thunks for a full entity module
- `createCrudSelectors` — generates memoized selectors for entity state

**Key technical decisions:**
- Driver preferences stored as JSON fields (preferredLanes, noGoZones) — not separate tables
- CPM calculated client-side from expense data, not stored as a separate field
- Onboarding booleans set manually in MVP (no automated document verification)
- Soft delete via `deletedAt` timestamp — queries filter `WHERE deletedAt IS NULL`

**API Endpoints:**

```
GET    /api/v1/carriers                     ?page=&limit=&type=&search=
POST   /api/v1/carriers
PATCH  /api/v1/carriers/:id
GET    /api/v1/carriers/:id/onboarding

GET    /api/v1/drivers                      ?carrierId=
POST   /api/v1/drivers
PATCH  /api/v1/drivers/:id                  # Includes preferences

GET    /api/v1/drivers/:id/fit              ?originState=&destState=&destCity=

GET    /api/v1/vehicles                     ?carrierId=
POST   /api/v1/vehicles
PATCH  /api/v1/vehicles/:id

GET    /api/v1/contacts                     ?type=&search=
POST   /api/v1/contacts
PATCH  /api/v1/contacts/:id
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.6 Carrier Onboarding | 355-400 |
| `docs/prd.md` | S4.9 Fleet & Carrier Management | 688-738 |
| `docs/tdd.md` | Carrier, Driver, Vehicle, Contact, TruckExpense models | 274-503 |
| `docs/tdd.md` | S6 Onboarding Gate | 1074-1105 |
| `docs/tdd.md` | P0 Carriers/Drivers/Vehicles/Contacts endpoints | 1413-1447 |

## Screenshots

- `docs/screenshots/carrier_details.png`
- `docs/screenshots/carrier_onboarding.png`
- `docs/screenshots/carrier_onboarding_details.png`
- `docs/screenshots/driver_details.png`

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 355-400 (Carrier Onboarding) and 688-738 (Fleet & Carrier Management). TDD has models at lines 274-498 and endpoints at 1413-1447. Screenshots in docs/screenshots/: carrier_details.png, carrier_onboarding.png, carrier_onboarding_details.png, driver_details.png. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Generate BE stories for carriers/drivers/vehicles/contacts CRUD + onboarding gate, FE stories for list/detail pages.

## Dependencies

- **foundation** — Prisma schema, onboarding gate, pagination, error classes, auth middleware

---

# Feature 3: place-management

## Summary

Places CRUD with facility intelligence fields (type, dock, hours, appointment/lumper/PPE requirements), typeahead API for stop forms, geo auto-lookup from Redis city centroids on save, and a reusable PlaceTypeahead component used later by load-management.

## Scope

**Does:**
- Places CRUD: create, read, update, soft-delete
- Place list page with sort/filter/search, pagination
- Place detail page with all fields + "Recent loads at this facility" section
- Create/edit form (3 sections: Location, Facility Details, Contact & Intelligence)
- Typeahead API: search by name/city/state (min 2 chars), returns matching places with facility type badge + contact name
- Geo auto-lookup: on save, resolve city+state to lat/lng from Redis centroids
- PlaceTypeahead reusable component (consumed by load-management stop forms)

**Does NOT:**
- Create or modify loads (that's load-management)
- Handle stop creation (that's load-management)
- Manage contacts (that's fleet-management)

## Capabilities

1. Place list page: table with name, city/state, facility type, associated contact, appointment required badge. Sortable: name, city, state, facility type, created date. Filterable: facility type, state, associated contact. Searchable: name, city, state. Pagination: 25/page.
2. Create/edit form: Location (name, address, city, state, zip, lat/lng auto), Facility Details (type dropdown with 16 options, dock type, hours, toggles), Contact & Intelligence (associated contact, on-site contact, check-in procedures, notes)
3. Typeahead: `GET /api/v1/places/typeahead?q=&limit=10` — min 2 chars, returns `{name} — {city}, {state}` with type badge and contact name. On selection: auto-fill address/contact fields. Excludes soft-deleted places.
4. Geo auto-lookup: getCityCoords from foundation's Redis hash, set geoSource=AUTO. Manual override option.

## Success Criteria

- GIVEN city "Charlotte", state "NC" WHEN Place saved THEN lat/lng auto-populate from Redis
- GIVEN Place "Amazon FTW1" exists WHEN dispatcher types "Amazon" in stop form THEN typeahead shows it
- GIVEN Place selected on stop WHEN auto-fill runs THEN address/contact fields populate, all editable
- GIVEN Place soft-deleted WHEN dispatcher searches THEN excluded from typeahead
- GIVEN Place with lumperRequired=true WHEN selected on stop THEN info badge shown
- GIVEN Place linked to Contact "TQL" WHEN searching "TQL" in typeahead THEN associated Places appear

## Data Requirements

**Prisma models (defined in foundation, consumed here):**
- Place (lines 631-668) — all fields including facility intelligence

**Depends on from foundation:**
- Geo lookup utility (`getCityCoords`)
- Pagination helper
- Error classes
- Auth middleware

## User Flows

**Create a Place:**
1. Navigate to Places → "Create Place"
2. Fill Location: name="Amazon FTW1", city="Fort Worth", state="TX"
3. Fill Facility: type=Distribution Center, dock=Dock High, appointment required=ON
4. Fill Contact: associated contact (searchable dropdown), check-in procedures
5. Save → lat/lng auto-populated from Redis, place appears in list

**Use PlaceTypeahead in Load Creator:**
1. In load creation Step 1, type "Amazon" in stop facility field
2. Typeahead shows: "Amazon FTW1 — Fort Worth, TX [Distribution Center]"
3. Select → address, city, state, zip, contact auto-fill into stop fields
4. All auto-filled fields remain editable for that specific load
5. "+" button opens modal to create new Place from entered stop data

## Affected Services

- `hussle-app-dispatch-api` — Places module (routes, controller, service, validation)
- `hussle-app-dispatch-ui` — Place list page, Place detail page, PlaceTypeahead component

## Technical Context

**mocho-ui components:**
`PageWrapper`, `PageHeader`, `MainCard`, `DataGrid`/`ActionsCell`, `FormDialog`, `TextField`, `SelectField`, `EmptyState`, `ListSkeleton`, `FormSkeleton`, `createCrudSlice`, `createEntityModule`, `useFormRef`

**Key technical decisions:**
- PlaceTypeahead is a reusable component — load-management imports it for stop forms
- Geo auto-lookup happens server-side on create/update, not client-side
- Place soft-delete preserves existing stop references (placeId stays on stops)
- Typeahead endpoint is separate from list endpoint for performance (no pagination overhead)

**API Endpoints:**

```
GET    /api/v1/places                       ?page=&limit=&search=&facilityType=&state=&contactId=&sort=&order=
GET    /api/v1/places/:id
POST   /api/v1/places
PATCH  /api/v1/places/:id
DELETE /api/v1/places/:id                   # Soft delete
GET    /api/v1/places/typeahead             ?q=&limit=10
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.11 Place Management | 764-806 |
| `docs/tdd.md` | Place model | 631-668 |
| `docs/tdd.md` | P0 Places endpoints | 1436-1442 |

## Screenshots

None in `docs/screenshots/` for place-management specifically. The place typeahead is visible in the load creation screenshots.

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 764-806 (Place Management). TDD has Place model at lines 631-668 and endpoints at 1436-1442. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Generate BE stories for places CRUD + typeahead + geo auto-lookup, FE stories for list/detail/form pages + reusable PlaceTypeahead component.

## Dependencies

- **foundation** — Prisma schema (Place model), geo lookup, pagination, error classes, auth middleware

---

# Feature 4: load-management

## Summary

The core dispatch feature: Load CRUD with 13-status state machine (transitions, prerequisites, warnings, side effects), multi-step load creator (4 steps), dispatch board (6-column Kanban + table view with sort/filter/search), load detail page, weekly gross tracker, broker rate con tracking, check calls, status history, and driver fit integration.

## Scope

**Does:**
- Load CRUD with full validation (stops, carrier/driver/vehicle ownership, prohibited commodities)
- State machine enforcement: transitions, prerequisites, warnings, side effects (calculate financials, freeze financials, auto-generate invoice, TONU accessorial)
- Multi-step Load Creator: Route & Broker (with PlaceTypeahead), Cargo, Assignment & Rate (with driver fit warnings + onboarding gate), Review & Create
- Dispatch board: 6-column Kanban + table view, card contents, sort/filter/search, 15s polling
- Weekly gross tracker per truck ($5,000 target)
- Load detail page: route, broker info, assignment, financial, planned backhaul, status timeline, check calls, documents, invoice
- Status change dialog with confirmation, notes for EXCEPTION/CANCELED
- Check calls: log with location, ETA, notes, broker notified flag
- Broker rate con tracking (rateConReceivedAt, warnings)

**Does NOT:**
- Implement document upload flow (that's documents-bol — load-management calls document module APIs)
- Implement invoice generation logic (that's invoicing — state machine fires event, invoicing handles it)
- Implement intelligence feed or scoring (that's load-intelligence — loads created from intel are pre-filled)
- Implement email sending (that's invoicing)

## Capabilities

1. **Dispatch Board Kanban:** 6 columns (NEW/BOOKED/ACTIVE/DELIVERED/COMPLETE/ISSUES), cards show load number, route, carrier+type, driver, rate (hidden for VIEWER), status badge, pickup date, urgency indicator. Not draggable. COMPLETE collapsed by default. Mobile: card list only.
2. **Table View:** Sortable (load#, status, carrier, origin, dest, pickup, rate, created). Filterable (status, carrier, type, equipment, date range). Searchable (load#, broker ref, carrier, city). 25/page.
3. **Load Creator Step 1:** Broker (searchable from Contacts), broker ref, equipment type, PlaceTypeahead for stops, auto-fill from places, "Save as Place" quick action, add stop button.
4. **Load Creator Step 2:** Commodity (prohibited check), weight, piece count, hazmat, tarp (auto-suggest $150-200 accessorial), team driver, loaded/deadhead miles.
5. **Load Creator Step 3:** Carrier (active only, onboarding gate for external), driver (filtered to carrier, fit warnings: preferred lane badge, no-go warning, days from home, available hours, current location, active load warning), vehicle (filtered, auto-select if single), customer rate (min book rate helper if from intel), accessorials, financial preview.
6. **Load Creator Step 4:** Summary, financial breakdown, planned backhaul (if from Book Chain), notes, "Create as Quoted" or "Create as Booked", prompt to upload rate con.
7. **Load Detail:** All sections with status-appropriate actions, planned backhaul panel (if booked via chain), status timeline, check calls.
8. **Weekly Gross Tracker:** Per truck: "Truck #133718: $3,200 / $5,000" with progress bar. ADMIN/DISPATCHER only.

## Success Criteria

- GIVEN no filters WHEN dispatch board loads THEN all non-deleted loads display in correct Kanban columns
- GIVEN VIEWER role WHEN viewing board THEN rates are hidden on all cards
- GIVEN 5 active trucks WHEN board loads THEN weekly gross tracker shows all 5 with progress toward $5,000
- GIVEN a prohibited commodity entered WHEN user submits THEN creation is blocked with policy message
- GIVEN an external carrier missing W-9 WHEN dispatcher tries to assign THEN assignment is blocked with list of missing documents
- GIVEN a carrier with one driver and one vehicle WHEN selected THEN both auto-populate
- GIVEN DISPATCHER role WHEN viewing financial preview THEN partner split is hidden
- GIVEN driver has Montana as no-go zone WHEN assigning to Montana load THEN warning: "[Driver] has Montana as a no-go zone. Assign anyway?"
- GIVEN driver has NJ→PA preferred lane WHEN assigning to NJ→PA load THEN "Preferred Lane" badge shown
- GIVEN load created from intelligence feed WHEN rate field displays THEN min book rate shown as helper text
- GIVEN load created from "Book Chain" WHEN review step displays THEN planned backhaul summary shown
- GIVEN Place "Amazon FTW1" exists WHEN dispatcher types "Amazon" in stop form THEN typeahead shows it
- GIVEN load in DISPATCHED WHEN ADMIN or DISPATCHER views THEN primary action is "Mark En Route to Pickup"
- GIVEN load in IN_TRANSIT WHEN DISPATCHER tries EXCEPTION THEN rejected (ADMIN only)
- GIVEN VIEWER role WHEN viewing THEN financials hidden, no action buttons
- GIVEN load created from "Book Chain" WHEN load detail viewed THEN Planned Backhaul section is visible

## Data Requirements

**Prisma models (defined in foundation, consumed here):**
- Load (lines 505-573) — all fields
- Stop (lines 592-621) — all fields
- LoadStatusHistory (lines 670-683)
- CheckCall (lines 685-703)
- AccessorialCharge (lines 705-731)

**Depends on from foundation:**
- State machine (transitions, prerequisites, warnings, side effects)
- Financial calculations (`calculateLoadFinancials`)
- Onboarding gate (`checkCarrierOnboarding`)
- Sequence generator (load numbers)
- Pagination helper
- Error classes, auth middleware

## User Flows

**Create a Load (BOOKED):**
1. Dispatcher clicks "Create Load" on dispatch board
2. Step 1: Select broker from contacts, enter broker ref, choose equipment. Use PlaceTypeahead for pickup/delivery stops.
3. Step 2: Enter commodity (prohibited check), weight, miles.
4. Step 3: Select carrier (onboarding gate check), driver (fit warnings), vehicle. Enter customer rate. System shows financial preview.
5. Step 4: Review all details. Click "Create as Booked". Prompt: "Upload broker rate con now?"
6. Load created with status BOOKED, financials calculated.

**Transition Load through Lifecycle:**
1. BOOKED → DISPATCHED: click "Dispatch" on load detail, confirm. Warnings if no rate con or low driver hours.
2. DISPATCHED → EN_ROUTE_PICKUP → AT_PICKUP → IN_TRANSIT → AT_DELIVERY → DELIVERED: sequential status changes via primary action button.
3. DELIVERED → INVOICE_PENDING: automatic (side effect fires invoice generation event).

## Affected Services

- `hussle-app-dispatch-api` — Loads module (routes, controller, service, validation, stateMachine)
- `hussle-app-dispatch-ui` — DispatchBoard page, LoadCreate page, LoadDetail page, KanbanBoard/Column/Card, LoadTable, LoadCreatorStepper, StatusChangeDialog, WeeklyGrossTracker, PlannedBackhaulPanel, DriverFitBadge, BrokerRateConUpload

## Technical Context

**mocho-ui components:**
`PageWrapper`, `PageHeader`, `MainCard`, `Tabs`, `FormDialog`, `ConfirmDialog`, `TextField`, `SelectField`, `DateTimePickerField`, `Dot`, `LoadingButton`, `AnalyticEcommerce`, `EmptyState`, `Tooltip`, `createCrudSlice`, `createEntityModule`, `useFormRef`, `useDirtyFormBlocker`

**Key technical decisions:**
- Kanban cards are NOT draggable — status changes only via load detail
- 15-second polling for dispatch board refresh
- Financial fields frozen at DISPATCHED — no recalculation beyond that point
- PlannedNextLoadRef is a JSON field on Load, not a separate table
- Check calls are append-only (no edit/delete)
- State machine side effects use domain events (e.g., DELIVERED fires invoice generation — invoicing module handles it)
- Mobile (< 768px): card list only, no Kanban

**API Endpoints:**

```
GET    /api/v1/loads                        ?page=&limit=&status=&search=&sort=&order=
GET    /api/v1/loads/:id
POST   /api/v1/loads
PATCH  /api/v1/loads/:id
PATCH  /api/v1/loads/:id/status             { status, notes?, overrideWarnings? }
POST   /api/v1/loads/:id/check-calls
GET    /api/v1/loads/:id/check-calls
GET    /api/v1/loads/:id/status-history
GET    /api/v1/loads/:id/documents
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.1 Dispatch Board | 129-183 |
| `docs/prd.md` | S4.2 Load Creator | 184-257 |
| `docs/prd.md` | S4.3 Load Detail | 258-287 |
| `docs/prd.md` | S4.4 Broker Rate Con | 288-322 |
| `docs/prd.md` | S5 State Machine (transitions/side effects) | 809-877 |
| `docs/tdd.md` | Load, Stop, LoadStatusHistory, CheckCall, AccessorialCharge models | 505-731 |
| `docs/tdd.md` | S5 State Machine impl | 1010-1070 |
| `docs/tdd.md` | P0 Load endpoints | 1396-1412 |
| `docs/tdd.md` | P1 Load detail endpoints | 1460-1465 |

## Screenshots

- `docs/screenshots/dispatch_board.png`
- `docs/screenshots/dispatch_board_kanban.png`
- `docs/screenshots/dispatch_board_table.png`
- `docs/screenshots/create_load.png`
- `docs/screenshots/load_details.png`

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 129-322 (Dispatch Board, Load Creator, Load Detail, Broker Rate Con) and 809-877 (State Machine). TDD has models at lines 505-731, state machine at 1010-1070, endpoints at 1396-1412. Screenshots: dispatch_board.png, dispatch_board_kanban.png, dispatch_board_table.png, create_load.png, load_details.png. This feature depends on fleet-management and place-management. Directory mapping: packages/api = hussle-app-dispatch-api, packages/web = hussle-app-dispatch-ui. Max 12 stories. Generate BE stories for load CRUD + state machine + side effects + check calls, FE stories for dispatch board (Kanban + table) + load creator stepper + load detail page.

## Dependencies

- **foundation** — Prisma schema, state machine, financials, onboarding gate, sequences, pagination, error classes
- **fleet-management** — Carrier/Driver/Vehicle data for assignment, onboarding gate enforcement
- **place-management** — PlaceTypeahead component for stop forms, place auto-fill

---

# Feature 5: documents-bol

## Summary

Document management module with presigned URL upload flow, BOL two-stage workflow (unsigned at pickup, signed at delivery), broker rate con document handling, and shared DocumentUpload component.

## Scope

**Does:**
- Document module: presigned URL upload (request → S3 direct upload → confirm), list by load/carrier/type
- BOL two-stage workflow: unsigned BOL prompted at AT_PICKUP, signed BOL prompted at DELIVERED
- Broker rate con document handling: upload sets rateConReceivedAt, multiple uploads (latest is primary, previous archived)
- DocumentUpload shared component
- BolWorkflow component (prompts at AT_PICKUP and DELIVERED statuses)
- Document list on load detail and carrier detail pages

**Does NOT:**
- Generate invoice PDFs (that's invoicing)
- Send emails with attachments (that's invoicing)
- Manage carrier onboarding booleans (that's fleet-management)
- Handle load status transitions (that's load-management — documents-bol provides UI prompts)

## Capabilities

1. Presigned URL flow: `POST /api/v1/documents/presign` → S3 PUT URL (15-min expiry) + pending record → frontend uploads directly → `POST /api/v1/documents/:id/confirm` → verified
2. BOL at pickup (AT_PICKUP): prompt "Upload unsigned BOL from shipper", type=BOL_UNSIGNED, check call should capture arrival/loading ETA/broker notified
3. BOL at delivery (AT_DELIVERY→DELIVERED): prompt "Upload signed BOL", type=BOL_SIGNED. Warning if no signed BOL when transitioning to DELIVERED. Load tracks `bolSignedAt`.
4. Broker rate con: type=BROKER_RATE_CON, sets `rateConReceivedAt`. Multiple uploads: latest primary, previous archived (not deleted).
5. Document types supported: BROKER_RATE_CON, BOL_UNSIGNED, BOL_SIGNED, DISPATCH_AGREEMENT, INSURANCE_CERT, W9, CARRIER_PACKET, INVOICE, LUMPER_RECEIPT, SCALE_TICKET, OTHER
6. S3 structure: `{orgId}/loads/{loadId}/{type}/{filename}` and `{orgId}/carriers/{carrierId}/{type}/{filename}`
7. File limits: PDFs max 5MB, uploads (BOL, POD) max 10MB. Accepted: PDF, PNG, JPG, JPEG.

## Success Criteria

- GIVEN a load at AT_PICKUP WHEN dispatcher views load detail THEN an "Upload Unsigned BOL" prompt is visible
- GIVEN a load transitioning to DELIVERED without signed BOL WHEN dispatcher confirms THEN warning displayed and load transitions with bolSignedAt=null
- GIVEN a load at DELIVERED with signed BOL WHEN invoice auto-generates THEN invoice has no missing-BOL warning
- GIVEN a load at DELIVERED without signed BOL WHEN invoice auto-generates THEN invoice displays "Missing signed BOL" flag
- GIVEN a load in QUOTED status WHEN dispatcher uploads a broker rate con THEN document is stored and rateConReceivedAt is set
- GIVEN a load transitioning to DISPATCHED with no broker rate con uploaded THEN show warning: "No broker rate con on file"
- GIVEN a load with a broker rate con WHEN dispatcher uploads a new one THEN new document becomes primary, previous is archived

## Data Requirements

**Prisma models (defined in foundation, consumed here):**
- Document (lines 783-821) — all fields including uploadStatus, isArchived
- DocumentType enum (lines 809-821)

**Depends on from foundation:**
- S3 presign utility
- Error classes, auth middleware

## User Flows

**Upload Broker Rate Con:**
1. From load detail (QUOTED status), click "Upload Rate Con"
2. DocumentUpload component opens → select file
3. Frontend calls `POST /api/v1/documents/presign` → gets presigned URL
4. Frontend uploads file directly to S3
5. Frontend calls `POST /api/v1/documents/:id/confirm`
6. rateConReceivedAt set on load

**BOL Workflow:**
1. Load reaches AT_PICKUP → BolWorkflow component shows "Upload unsigned BOL from shipper"
2. Dispatcher uploads unsigned BOL
3. Load reaches AT_DELIVERY → dispatcher transitions to DELIVERED
4. BolWorkflow shows "Upload signed BOL"
5. If no signed BOL: warning "No signed BOL on file — payment may be delayed. Continue anyway?"
6. bolSignedAt set when signed BOL uploaded

## Affected Services

- `hussle-app-dispatch-api` — Documents module (routes, controller, service)
- `hussle-app-dispatch-ui` — DocumentUpload component, BolWorkflow component, document list components

## Technical Context

**mocho-ui components:**
`MainCard`, `DocumentImageUploadField`, `ConfirmDialog`, `LoadingButton`, `useDocumentUpload`

**Key technical decisions:**
- Direct-to-S3 upload via presigned URLs (API never handles file bytes)
- Orphaned S3 files cleaned by lifecycle rules (7 days)
- Document "pending" → "confirmed" two-step ensures file actually reached S3
- Archive old rate cons rather than delete (audit trail)
- BOL workflow is a UI component that integrates with load detail — it doesn't own status transitions

**API Endpoints:**

```
POST   /api/v1/documents/presign            { fileName, mimeType, loadId?, carrierId?, type }
POST   /api/v1/documents/:id/confirm
GET    /api/v1/documents                    ?loadId=&carrierId=&type=
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.5 BOL Workflow | 323-354 |
| `docs/prd.md` | S6 Document Types | 879-895 |
| `docs/prd.md` | S9 Presigned URL flow | 934-948 |
| `docs/tdd.md` | Document model + DocumentType enum | 783-821 |
| `docs/tdd.md` | P0 Documents endpoints | 1443-1447 |

## Screenshots

None specific to documents. BOL workflow is visible in load detail screenshots.

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 323-354 (BOL Workflow), 879-895 (Document Types), 934-948 (Presigned URL flow). TDD has Document model at lines 783-821 and endpoints at 1443-1447. Depends on load-management. Generate BE stories for document presign/confirm/list + BOL workflow + rate con handling, FE stories for upload component + BOL prompts + document list.

## Dependencies

- **foundation** — Prisma schema (Document model), S3 presign, error classes, auth middleware
- **load-management** — Load detail page integrates document upload and BOL workflow

---

# Feature 6: invoicing

## Summary

Invoice management with auto-generation on DELIVERED (CUSTOMER vs DISPATCH_FEE types based on carrier type), approval workflow, PDF generation (@react-pdf), SES email delivery with retry, payment tracking, and invoice list/detail pages.

## Scope

**Does:**
- Invoice auto-generation on DELIVERED: COMPANY_ASSET → CUSTOMER invoice (full rate), EXTERNAL_CARRIER → DISPATCH_FEE invoice (dispatch fee amount)
- Due date from contact's payment terms (default net 30)
- Warning flag if signed BOL is missing at generation time
- Invoice approval: ADMIN reviews and approves
- PDF generation: @react-pdf in browser, uploaded to S3 via presigned URL
- Email sending: AWS SES with 3-attempt retry, 5-second delay between
- Payment tracking: mark paid (amount, method, reference, date), partial payment support
- Invoice list with filters (status, type, date range, overdue, missing BOL), count badges, overdue highlighting
- Invoice detail page with line items, approval queue
- InvoicePdfTemplate component
- Email service (SES config, invoice template, dispatch agreement template)

**Does NOT:**
- Modify load status directly (load-management's state machine fires the event)
- Generate dispatch agreement PDFs (that's a V2 enhancement or fleet-management concern)
- Handle document upload flow (uses documents-bol)

## Capabilities

1. Auto-generation: load → DELIVERED triggers INVOICE_PENDING, invoice draft created with type based on carrier type, due date from contact payment terms, missing BOL flag
2. Invoice types: CUSTOMER (bills broker at full rate for COMPANY_ASSET), DISPATCH_FEE (bills carrier for dispatch fee for EXTERNAL_CARRIER)
3. Actions: Edit Draft (line items, notes, terms), Delete Draft (ADMIN only, load reverts to DELIVERED), Approve (ADMIN), Generate PDF & Send (PDF → S3, email → SES), Mark Paid (amount, method, reference, date)
4. Email: SES from `dispatch@[configurable-domain]`, reply-to dispatcher's email. Invoice delivery email with PDF attachment. 3 retries, 5s delay. On failure: "Email failed. PDF saved — download manually." Invoice stays APPROVED (not SENT).
5. Payment: partial → PARTIALLY_PAID, full → PAID, load → PAID

## Success Criteria

- GIVEN COMPANY_ASSET load DELIVERED THEN CUSTOMER invoice draft created for full rate
- GIVEN EXTERNAL_CARRIER load DELIVERED THEN DISPATCH_FEE invoice draft created for dispatch fee amount
- GIVEN invoice missing signed BOL THEN warning flag visible in list and detail
- GIVEN ADMIN deletes draft THEN invoice removed, load → DELIVERED
- GIVEN DISPATCHER tries to approve THEN rejected (ADMIN only)
- GIVEN email fails after 3 retries THEN "Email failed. PDF saved — download manually." Invoice stays APPROVED.

## Data Requirements

**Prisma models (defined in foundation, consumed here):**
- Invoice (lines 733-766) — all fields including missingSignedBol, pdfUrl, sentAt/sentTo
- InvoiceType enum (lines 768-771): CUSTOMER, DISPATCH_FEE
- InvoiceStatus enum (lines 773-781): DRAFT, APPROVED, SENT, PARTIALLY_PAID, PAID, OVERDUE, VOID

**Depends on from foundation:**
- Financial calculations (to compute invoice amounts)
- Sequence generator (invoice numbers: `INV-{YYYY}-{NNNNNN}`)
- S3 presign (for PDF upload)
- Error classes, auth middleware, pagination

## User Flows

**Auto-Generation on Delivery:**
1. Load transitions to DELIVERED (via load-management state machine)
2. System determines carrier type → creates invoice draft
3. If COMPANY_ASSET: CUSTOMER invoice at full customerRate + accessorials
4. If EXTERNAL_CARRIER: DISPATCH_FEE invoice at dispatchFee amount
5. Due date = today + contact's paymentTermsDays
6. If no signed BOL: missingSignedBol=true, flag shown
7. Load status → INVOICE_PENDING

**Approve and Send:**
1. ADMIN navigates to invoice list → filters to DRAFT
2. Reviews invoice detail, edits if needed
3. Clicks "Approve" → status = APPROVED
4. Clicks "Generate PDF & Send" → @react-pdf generates PDF in browser → uploads to S3 → SES sends email
5. Status → SENT. If no recipient email: warning with manual download.

**Record Payment:**
1. ADMIN opens invoice detail (SENT status)
2. Clicks "Mark Paid" → enters amount, method, reference, date
3. If partial: PARTIALLY_PAID. If full: PAID, load → PAID.

## Affected Services

- `hussle-app-dispatch-api` — Invoices module, Email service (SES)
- `hussle-app-dispatch-ui` — Invoices list page, invoice detail, InvoicePdfTemplate, InvoiceApprovalQueue

## Technical Context

**mocho-ui components:**
`PageWrapper`, `PageHeader`, `MainCard`, `Tabs`, `DataGrid`/`ActionsCell`, `AnalyticEcommerce`, `Dot`, `ConfirmDialog`, `EmptyState`, `ListSkeleton`, `createCrudSlice`, `createEntityModule`

**Key technical decisions:**
- PDF generated client-side with @react-pdf, then uploaded to S3
- SES email is async with 3-attempt retry and 5s delay
- Invoice deletion allowed only in DRAFT status, only by ADMIN
- VOID status exists for cancellation after sending (no auto-use in MVP)
- Invoice auto-generation is triggered by domain event from load state machine, not by direct import

**API Endpoints:**

```
GET    /api/v1/invoices                     ?status=&type=&overdue=&missingBol=
GET    /api/v1/invoices/:id
PATCH  /api/v1/invoices/:id
DELETE /api/v1/invoices/:id
POST   /api/v1/invoices/:id/approve
POST   /api/v1/invoices/:id/send            { email }
POST   /api/v1/invoices/:id/mark-paid       { amount, method, reference, date }
```

**Email Templates:**

| Email | Trigger | Subject | Attachment |
|-------|---------|---------|------------|
| Invoice Delivery | ADMIN sends approved invoice | "Invoice [INV-2026-000042] — [Company Name]" | Invoice PDF |
| Dispatch Agreement | ADMIN clicks "Send Agreement" | "Dispatch Agreement — [Company Name]" | Generated agreement PDF |

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.7 Invoice Manager | 401-431 |
| `docs/prd.md` | S7 Email Specifications | 897-924 |
| `docs/tdd.md` | Invoice model + InvoiceType + InvoiceStatus enums | 733-781 |
| `docs/tdd.md` | P1 Invoice endpoints | 1449-1465 |

## Screenshots

None specific to invoicing in `docs/screenshots/`.

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 401-431 (Invoice Manager) and 897-924 (Email Specs). TDD has Invoice model at lines 733-781 and endpoints at 1449-1465. Depends on load-management + documents-bol. Generate BE stories for invoice auto-generation + approval + PDF + SES email + payment tracking, FE stories for invoice list + detail + PDF template + approval queue.

## Dependencies

- **foundation** — Prisma schema (Invoice model), financial calculations, sequence generator, S3 presign, error classes
- **load-management** — Load state machine fires invoice generation event on DELIVERED
- **documents-bol** — Signed BOL status checked at invoice generation time

---

# Feature 7: dashboard

## Summary

Dashboard page with KPI cards (active loads, revenue, fees, overdue invoices), weekly gross per truck bar chart, and attention items section (exceptions, overdue invoices, missing docs, expiring insurance, un-dispatched loads).

## Scope

**Does:**
- Dashboard KPIs endpoint: active load counts by Kanban group, revenue this week/month, dispatch fees this month, partner split this month (ADMIN only), overdue invoice count + total
- Weekly gross per truck endpoint: each truck's weekly revenue vs $5,000 target
- Attention items: loads in EXCEPTION, invoices past due, loads dispatched without rate con, invoices missing signed BOL, carrier insurance expiring within 30 days, loads with pickup today still in BOOKED
- Dashboard page with KPI cards, bar chart, attention items section

**Does NOT:**
- Modify any records (read-only aggregation)
- Implement detailed load/invoice/carrier views (links to other features)

## Capabilities

1. **KPIs:** Active loads by Kanban group, weekly/monthly revenue (PAID loads), dispatch fees this month, partner split this month (ADMIN only), overdue invoices count + total
2. **Weekly Gross Tracker:** Bar chart per truck showing revenue vs $5,000 target
3. **Attention Items:** Loads in EXCEPTION (with links), invoices past due, loads dispatched without rate con, invoices missing signed BOL, carrier insurance expiring within 30 days, loads with pickup today still BOOKED

## Success Criteria

- GIVEN DISPATCHER role THEN partner split KPI hidden
- GIVEN 3 loads in EXCEPTION THEN attention section shows them with links

## Data Requirements

No additional models. Aggregates data from Load, Invoice, Carrier tables.

**Depends on from foundation:**
- Pagination (not needed for dashboard, but auth/error patterns)
- Auth middleware (role-based visibility for partner split)

## User Flows

1. User logs in → lands on dashboard
2. KPI cards show current state at a glance
3. Weekly gross bar chart shows each truck's progress
4. Attention items highlight what needs action — each item links to the relevant detail page

## Affected Services

- `hussle-app-dispatch-api` — Dashboard module (routes, controller, service)
- `hussle-app-dispatch-ui` — Dashboard page with KPI cards, bar chart component, attention items section

## Technical Context

**mocho-ui components:**
`PageWrapper`, `PageHeader`, `MainCard`, `AnalyticEcommerce`, `AnalyticsDataCard`

**Key technical decisions:**
- Dashboard queries are read-only aggregations, no write operations
- Partner split KPI filtered at API layer based on user role
- No caching for MVP — queries run on each page load
- Attention items are actionable links to the relevant entity detail pages

**API Endpoints:**

```
GET    /api/v1/dashboard/kpis
GET    /api/v1/dashboard/weekly-gross
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.10 Dashboard | 740-763 |
| `docs/tdd.md` | P2 Dashboard endpoints | 1496-1500 |

## Screenshots

- `docs/screenshots/dashboard.png`

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 740-763 (Dashboard). TDD endpoints at 1496-1500. Screenshot: dashboard.png. Depends on load-management + invoicing. Generate BE stories for KPIs + weekly gross + attention items endpoints, FE stories for dashboard page + chart + attention section.

## Dependencies

- **foundation** — Auth middleware, error classes
- **load-management** — Load data for KPIs and attention items
- **invoicing** — Invoice data for KPIs and overdue tracking

---

# Feature 8: load-intelligence

## Summary

Source-agnostic intelligence engine that ingests loads from any source (DAT extension, manual entry), deduplicates via Redis hash, scores them per truck across profitability + market + driver fit, chains them into round trips with three optimization metrics, and provides a feed UI with side-by-side single + chain scoring, filters, book/dismiss actions, and per-truck breakdown.

## Scope

**Does:**
- Source-agnostic ingestion API: single + batch, validates, normalizes, dedupes, scores, stores in Redis (24h TTL)
- Deduplication via SHA256 hash (source-aware): `SHA256(source + origin + dest + pickup + broker_mc + rate).slice(0, 12)`
- Per-truck composite scoring (0-100): CPM Profitability (0-40) + Destination Market (0-30) + Driver Fit (0-30). Two modes: full (★, rate available) and route (◇, no rate)
- Min book rate calculation per truck, shown on all loads as negotiation reference
- Destination market strength from DAT (load-to-truck ratio), stored in Redis with 6h TTL
- Backhaul search: loads originating within 50mi of outbound destination, filtered by date/equipment, capped at 20
- Chain assembly: 2-step (< 500mi from home) or 3-step (≥ 500mi). Three metrics: Round-Trip Profitability, Daily Revenue Utilization, Weekly Gross Projection
- Chain scoring (0-100): Chain Profitability (0-40) + Return Positioning (0-35) + Time Efficiency (0-25)
- "Book This Load" → pre-fills Load Creator with best truck/driver, min book rate helper
- "Book Chain" → pre-fills outbound + saves backhaul as planned reference on load record
- Manual entry form (simplified modal)
- Feed page with side-by-side single + chain cards, source badges, stats header, filters/sort, per-truck breakdown table
- Dismiss (Redis set)

**Does NOT:**
- Scrape DAT or any external source (that's chrome-extension)
- Manage loads in Postgres (that's load-management)
- Generate invoices or handle documents

## Capabilities

1. **Ingestion API:** `POST /api/v1/load-intel/ingest` (single), `POST /api/v1/load-intel/ingest/batch` (batch for extension). Universal `LoadIntelPayload` format with source tag. Validate → normalize → dedupe → get market data → score per truck → store Redis (24h TTL) → add to feed sorted set.
2. **Scoring:** Three dimensions. CPM: $1.00+/mi profit→40pts, $0.75-0.99→35, $0.50-0.74→28, $0.25-0.49→18, $0.10-0.24→8, below→0. Market: Hot(3.0+)→30, Balanced(1.5-2.9)→22, Soft(0.8-1.4)→10, Dead(<0.8)→0, No data→15. Driver Fit: no-go→0 (🚫), preferred lane→+15, not preferred→+5, ≤200mi from home→+10, 200-500→+5, no prefs→15 neutral.
3. **Min Book Rate:** `(vehicleCPM × totalMiles) / (1 - feePercent/100) × (1 + profitMargin)`, rounded to nearest $50. Three card states: above min (green), below min (red), no price (show "Book above $X").
4. **Market Strength:** Hot (3.0+, green), Balanced (1.5-2.9, blue), Soft (0.8-1.4, yellow), Dead (<0.8, red). 6h TTL in Redis.
5. **Chaining:** Backhaul within 50mi radius, compatible equipment, pickup ≥ delivery date. 2-step or 3-step based on 500mi threshold. Chain scoring: profitability (0-40), return positioning (0-35), time efficiency (0-25). Lazy evaluation (on feed load, not ingestion).
6. **Feed UI:** Side-by-side single + chain scores. Source badges (DAT blue, Manual gray). Stats header: "142 loads from 3 sources". Filters: score tier, equipment, origin/dest, market, has rate, score type, source. Sort: score, chain score, rate, miles, pickup.
7. **Book This Load:** copies to Load Creator with best truck/driver pre-selected, min book rate as helper
8. **Book Chain:** copies outbound + saves backhaul as plannedNextLoadRef JSON on load record
9. **Manual Entry:** modal form (origin, dest, pickup, equipment, rate, miles, broker). Source='manual'.

## Success Criteria

- GIVEN a load to Charlotte (L/T=2.8) with Marcus (preferred NJ→NC) WHEN feed displays THEN Marcus's truck shows highest composite with "Preferred Lane" and min book rate, plus chain with best Charlotte→NJ backhaul
- GIVEN a load to Montana with James (MT is no-go) WHEN feed displays THEN James's truck shows "🚫 No-Go" with single score 0, no chain evaluated
- GIVEN an unpriced load to Memphis with no backhaul data WHEN feed displays THEN card shows "📞 Book above $1,200" with ◇ route score, chain panel shows "— No backhaul data" with market proxy
- GIVEN a priced load with strong 2-step chain WHEN "Book Chain" clicked THEN Load Creator opens with outbound pre-filled and Step 4 shows planned backhaul summary
- GIVEN a load booked via "Book Chain" WHEN load detail viewed 3 days later THEN planned backhaul shows "Backhaul Expired" with "Find New Backhaul" button
- GIVEN a manual load entry for NJ→NC WHEN submitted THEN load appears in feed tagged "Manual" with full scoring and chain data
- GIVEN auto-capture ON WHEN dispatcher browses 5 DAT pages THEN extension silently ingests all results into feed
- GIVEN "Bulk Scrape All Tabs" with 3 DAT tabs WHEN clicked THEN shows "3 searches, 142 loads, 98 new"

## Data Requirements

**Redis structures (defined in foundation S4, used here):**
- `intel:{orgId}:{loadHash}` — LoadIntelRedis (individual load with per-truck scores)
- `intel:feed:{orgId}` — Sorted set (feed ranked by best composite score)
- `intel:dismissed:{orgId}` — Set (dismissed load hashes)
- `intel:chain:{orgId}:{loadHash}` — ChainCacheRedis (cached chain results)
- `market:{state}:{city}` — Market strength snapshot

**TypeScript interfaces (from TDD S4):**
- `LoadIntelPayload` — universal ingestion format
- `LoadIntelRedis` — stored in Redis per load
- `TruckScore` — per-truck scoring breakdown
- `ChainCacheRedis` / `ChainResult` / `ChainLeg` — chain data

**Depends on from foundation:**
- Scoring utilities (minBookRate, compositeScore, driverFit, chainScore, CPM)
- Geo utilities (getCityCoords, haversineDistance)
- Redis client
- Error classes, auth middleware

## User Flows

**Ingest from Extension:**
1. Extension POSTs batch of LoadIntelPayloads to `/api/v1/load-intel/ingest/batch`
2. Each payload: validate → normalize → hash → dedupe check → get/store market data → score per active truck → store in Redis → add to feed
3. Result: `{ total: 50, ingested: 42, duplicates: 6, invalid: 2 }`

**Browse Feed:**
1. Dispatcher opens load intelligence page
2. Feed loads from Redis sorted set, top scores first
3. Each card shows: route, rate, min book rate indicator, market badge, single-load score, chain score
4. Expand card → per-truck breakdown table
5. Filter/sort as needed

**Book Chain:**
1. Dispatcher finds promising chain (outbound + backhaul)
2. Clicks "Book Chain"
3. Load Creator opens with outbound data pre-filled, best truck/driver selected
4. Step 4 shows planned backhaul summary
5. Creates load → backhaul saved as plannedNextLoadRef JSON
6. Later on load detail: "Planned Backhaul" section shows backhaul info, "Convert to Load" button, or "Backhaul Expired" if Redis key gone

## Affected Services

- `hussle-app-dispatch-api` — Load-intel module (routes, controller, service, scoring, chaining, backhaul, redis, manual), Market module
- `hussle-app-dispatch-ui` — LoadIntelFeed page, IntelCard, SingleScorePanel, ChainScorePanel, TruckBreakdownTable, MarketBadge, MinBookIndicator, SourceBadge, ManualEntryModal, FeedHeader

## Technical Context

**mocho-ui components:**
`PageWrapper`, `PageHeader`, `MainCard`, `Tabs`, `DataGrid`, `FormDialog`, `TextField`, `SelectField`, `Dot`, `Tooltip`, `EmptyState`, `createCrudSlice`, `createEntityModule`, `useFormRef`

**Key technical decisions:**
- All intelligence data is ephemeral in Redis (24h TTL), not Postgres
- Scoring happens at ingestion time (per-truck), chaining is lazy (on feed load/card expand)
- Chain results cached in Redis alongside load data
- "Book This Load" and "Book Chain" copy data into Postgres via load-management — intelligence data is ephemeral reference only
- Feed pagination is from Redis sorted set (ZREVRANGE with offset/limit), not Postgres
- Source-agnostic: ingestion API doesn't know or care where data comes from
- No commodity check at ingestion (DAT doesn't show commodity)

**API Endpoints:**

```
POST   /api/v1/load-intel/ingest            Single load ingestion
POST   /api/v1/load-intel/ingest/batch      Batch ingestion (extension modes)
POST   /api/v1/load-intel/manual            Simplified manual entry form
GET    /api/v1/load-intel/feed              ?page=&limit=&score=&hasRate=&equipmentType=
                                            &source=&includeChains=
GET    /api/v1/load-intel/:id               Single load with full scores
GET    /api/v1/load-intel/:id/chains        Chain options (?vehicleId=&limit=3)
POST   /api/v1/load-intel/:id/book          Copy to Load Creator
POST   /api/v1/load-intel/:id/book-chain    Copy outbound + planned backhaul
DELETE /api/v1/load-intel/:id               Dismiss

GET    /api/v1/load-intel/backhaul          ?fromCity=&fromState=&radius=&earliestPickup=

POST   /api/v1/market-data                  Store market snapshot
GET    /api/v1/market-data/:state/:city     Current market strength
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.8 Load Intelligence Feed (all subsections) | 433-687 |
| `docs/tdd.md` | S4 Redis Data Structures | 846-1006 |
| `docs/tdd.md` | S8 Intelligence Engine (all: min book, scoring, chaining, backhaul, geo, ingestion) | 1152-1392 |
| `docs/tdd.md` | P2 Load Intel + Market + Backhaul + Fleet endpoints | 1467-1504 |

## Screenshots

- `docs/screenshots/load_intelligence.png`

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 433-687 (Load Intelligence Feed — all subsections). TDD has Redis structures at lines 846-1006, intelligence engine at 1152-1392, endpoints at 1467-1504. Screenshot: load_intelligence.png. Depends on foundation + fleet-management. Max 12 stories. Generate BE stories for ingestion API + scoring + market data + backhaul search + chain assembly + book load/chain, FE stories for feed page + intel card + manual entry + truck breakdown.

## Dependencies

- **foundation** — Scoring utilities, geo utilities, Redis client, error classes, auth middleware
- **fleet-management** — Carrier/Driver/Vehicle data for per-truck scoring (driver preferences, vehicle CPM)

---

# Feature 9: chrome-extension

## Summary

Chrome Extension (Manifest V3) that scrapes load data and market data from DAT load board in three modes (active page, auto-capture, bulk multi-tab), normalizes to LoadIntelPayload format, deduplicates client-side, and POSTs to the FleetCommand ingestion API.

## Scope

**Does:**
- Manifest V3 with service worker, content scripts, popup
- DAT scraper: DOM parser for load results with multiple selector fallback chains
- DAT market scraper: load-to-truck ratio from sidebar
- Three scraping modes: Active Page (on-demand), Auto-Capture (silent, 30s batching), Bulk Multi-Tab (scrape all open DAT tabs)
- Normalizer: DAT DOM data → LoadIntelPayload with `source: 'dat'` or `source: 'dat_bulk'`
- Client-side deduplication via hash cache
- API client for FleetCommand (ingest single, ingest batch, market data)
- Popup UI: mode toggles, status display, batch results
- Selector fallback chains for resilience against DAT layout changes
- Error handling: if selectors return 0 results, pause scraping, show "DAT layout may have changed"

**Does NOT:**
- Score loads (that's load-intelligence API)
- Store data persistently (sends to API, which stores in Redis)
- Handle authentication (uses existing FleetCommand auth token)
- Scrape any source other than DAT

## Capabilities

1. **Active Page Mode:** Dispatcher clicks "Send to FleetCommand" → scrapes current DAT results → batch POST to API
2. **Auto-Capture Mode:** Toggle ON → silently scrapes as dispatcher browses DAT, batches every 30s → POST
3. **Bulk Multi-Tab Mode:** "Bulk Scrape All Tabs" → scrapes all open DAT tabs in sequence → reports results
4. **Two data types captured:** Load data (origin, dest, rate, miles, equipment, broker, dates — NO commodity) and market data (load-to-truck ratio)
5. **DOM resilience:** Multiple selector fallback chains per field. If selectors return 0 results → pause, show warning
6. **Popup:** Mode toggles (active page, auto-capture), status indicators, bulk trigger, batch result display

## Success Criteria

- GIVEN auto-capture ON WHEN dispatcher browses 5 DAT pages THEN extension silently ingests all results into feed
- GIVEN "Bulk Scrape All Tabs" with 3 DAT tabs WHEN clicked THEN shows "3 searches, 142 loads, 98 new"
- GIVEN DAT layout changes WHEN selectors return 0 results THEN extension pauses, shows "DAT layout may have changed — update available"
- GIVEN a DAT page with load results WHEN "Send to FleetCommand" clicked THEN loads appear in intelligence feed with DAT source badge

## Data Requirements

No Prisma models. Extension produces `LoadIntelPayload` objects and `MarketData` snapshots, POSTed to load-intelligence API.

**TypeScript interfaces used:**
- `LoadIntelPayload` — from shared types
- `LoadSource: 'dat' | 'dat_bulk'` — source tags for DAT modes

## User Flows

**Active Page Scrape:**
1. Dispatcher is on DAT load board search results page
2. Clicks FleetCommand extension icon → "Send to FleetCommand"
3. Content script scrapes DOM → normalizer produces LoadIntelPayloads
4. Service worker POSTs batch to `/api/v1/load-intel/ingest/batch`
5. Popup shows: "24 loads scraped, 18 new, 6 duplicates"

**Auto-Capture:**
1. Dispatcher toggles "Auto-Capture" ON in extension popup
2. Browses DAT normally — each page load triggers content script
3. Every 30 seconds, service worker batches accumulated loads → POST
4. Status indicator in popup shows "Auto: 142 loads captured"

**Bulk Multi-Tab:**
1. Dispatcher has 3 DAT search tabs open (different lanes)
2. Clicks "Bulk Scrape All Tabs"
3. Extension iterates tabs, scrapes each → accumulates → batch POST
4. Shows: "3 searches, 142 loads, 98 new"

## Affected Services

- Chrome Extension only (standalone Manifest V3)
- Consumes: `hussle-app-dispatch-api` load-intel ingestion endpoints

## Technical Context

**mocho-ui components:** None (standalone extension, no mocho-ui)

**Extension directory structure (from TDD):**

```
extension/
├── manifest.json
├── background/
│   └── service-worker.ts          # Tab monitoring, batch queue, API
├── content/
│   ├── dat-scraper.ts             # DOM parser for DAT results
│   ├── dat-market.ts              # DOM parser for market sidebar
│   └── dat-detector.ts            # DAT page type detection
├── popup/
│   ├── popup.html
│   └── popup.ts                   # Mode toggles, status, bulk trigger
├── shared/
│   ├── normalizer.ts              # DAT DOM data → LoadIntelPayload
│   ├── dedup.ts                   # Client-side hash cache
│   └── api.ts                     # FleetCommand API client
└── assets/icons/
```

**Key technical decisions:**
- Manifest V3 (service worker, not background page)
- Content scripts inject into DAT pages only (matches pattern for DAT URLs)
- Client-side dedup prevents re-sending known loads within a session
- Market data scraped separately and POSTed to `/api/v1/market-data`
- Selector fallback chains: primary selector → fallback 1 → fallback 2 → give up and warn
- No commodity extraction (DAT doesn't show it on listings)
- Auth token stored in extension storage, passed with API requests

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.8.2 DAT Chrome Extension (3 modes) | 464-493 |
| `docs/tdd.md` | Extension directory structure | 242-258 |

## Screenshots

None specific to the extension.

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 464-493 (DAT Chrome Extension — 3 modes). TDD has extension directory structure at lines 242-258. Depends on load-intelligence API (ingestion endpoint must exist). Generate stories for: manifest + service worker, DAT scraper with selector fallbacks, market scraper, auto-capture mode, bulk multi-tab, normalizer + dedup, popup UI.

## Dependencies

- **load-intelligence** — Ingestion API endpoints must exist (`POST /api/v1/load-intel/ingest`, `POST /api/v1/load-intel/ingest/batch`, `POST /api/v1/market-data`)

---

# Cross-Cutting Concerns Reference

## What Lives Where

| Concern | Defined In | Consumed By |
|---------|-----------|-------------|
| Prisma schema (all models) | foundation | fleet, place, load, docs, invoice, intel |
| State machine (transition maps) | foundation | load-management (enforcement + UI) |
| Financial calculations | foundation | load-management (preview), invoicing (generation) |
| Onboarding gate | foundation | fleet-management (display), load-management (enforcement) |
| Scoring utilities | foundation | load-intelligence (runtime scoring) |
| Geo utilities | foundation | place-management (auto-lookup), load-intelligence (backhaul search) |
| S3 presign | foundation | documents-bol (upload), invoicing (PDF upload) |
| Sequence generator | foundation | load-management (load numbers), invoicing (invoice numbers) |
| Pagination helper | foundation | fleet, place, load, invoice, intel |
| Error classes | foundation | every API feature |
| Auth middleware | foundation (integration) | every API feature |
| Redis client | foundation | load-intelligence, place-management (geo) |
| Role permissions | Shared preamble | every feature |

## Feature → Expected Foundation Utilities

| Feature | Depends on from foundation |
|---------|---------------------------|
| fleet-management | onboardingGate, pagination, errorClasses, authMiddleware |
| place-management | geoLookup, pagination, errorClasses, authMiddleware |
| load-management | stateMachine, financials, onboardingGate, sequenceGenerator, pagination, errorClasses, authMiddleware |
| documents-bol | s3Presign, errorClasses, authMiddleware |
| invoicing | financials, sequenceGenerator, s3Presign, pagination, errorClasses, authMiddleware |
| dashboard | authMiddleware, errorClasses |
| load-intelligence | minBookRate, compositeScore, driverFit, chainScore, cpm, geoLookup, haversine, redisClient, errorClasses, authMiddleware |
| chrome-extension | None (standalone, consumes API) |

---

# Screenshot-to-Feature Mapping

| Screenshot | Feature | Use During |
|-----------|---------|-----------|
| `docs/screenshots/dispatch_board.png` | load-management | `/prd-refine`, `/design` |
| `docs/screenshots/dispatch_board_kanban.png` | load-management | `/prd-refine`, `/design` |
| `docs/screenshots/dispatch_board_table.png` | load-management | `/prd-refine`, `/design` |
| `docs/screenshots/create_load.png` | load-management | `/prd-refine`, `/design` |
| `docs/screenshots/load_details.png` | load-management | `/prd-refine`, `/design` |
| `docs/screenshots/carrier_details.png` | fleet-management | `/prd-refine`, `/design` |
| `docs/screenshots/carrier_onboarding.png` | fleet-management | `/prd-refine`, `/design` |
| `docs/screenshots/carrier_onboarding_details.png` | fleet-management | `/prd-refine`, `/design` |
| `docs/screenshots/driver_details.png` | fleet-management | `/prd-refine`, `/design` |
| `docs/screenshots/dashboard.png` | dashboard | `/prd-refine`, `/design` |
| `docs/screenshots/load_intelligence.png` | load-intelligence | `/prd-refine`, `/design` |

**Additional screenshots (not mapped in playbook but available):**
- `carrier_portal_billing.png`, `carrier_portal_dashboard.png`, `carrier_portal_documents.png`, `carrier_portal_drivers_vehicles.png`, `carrier_portal_load_history.png`, `carrier_portal_preferences.png` — these are carrier portal views that may inform fleet-management detail pages.

---

# Verification Checklist

After creating all feature PRDs from this manifest, verify:

- [ ] Every PRD section line range from `prd-split-playbook.md` is accounted for
- [ ] All 9 features have complete sections matching `/prd-refine` expected format
- [ ] mocho-ui components are mapped for all UI features (7 of 9)
- [ ] Cross-cutting concerns are explicitly called out per feature
- [ ] Each feature's conversation starter is paste-ready for `/prd-refine`
- [ ] Dependency graph matches `build-guide.md`
- [ ] No PRD/TDD requirement is orphaned (not assigned to any feature)
- [ ] No requirement is duplicated (assigned to exactly one feature, referenced by others)
- [ ] File is self-contained — no external lookups needed during the split process
