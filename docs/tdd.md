# FleetCommand MVP — Technical Design Document

**Version:** 4.4
**Date:** March 1, 2026
**Companion to:** FleetCommand PRD v4.4

---

## 1. Architecture

### Modular Monolith

```
┌──────────────────────────────────────────────────────────────────┐
│                    EXPRESS APP (Modular Monolith)                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  AUTH MODULE (existing package)                              │ │
│  │  Cognito Provider │ Redis Token │ Middleware │ Routes        │ │
│  │  OWNS: User, Organization, Membership, Invitation           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│            req.user, req.organizationId, req.orgSlug             │
│                          │                                       │
│  ┌───────────────────────▼─────────────────────────────────────┐ │
│  │  FLEETCOMMAND MODULES                                       │ │
│  │  Loads │ Carriers │ Invoices │ Documents │ LoadIntel│ Fleet  │ │
│  │  Stops │ Drivers  │ Dashboard│ Email     │ Market   │ Onboard│ │
│  │  Places│ Vehicles │          │ (SES)     │ Chaining │        │ │
│  │        │ Contacts │          │           │ Scoring  │        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────┬──────────────────┬──────────────────┬─────────────────┘
           │                  │                  │
      ┌────▼────┐       ┌────▼────┐        ┌────▼────┐
      │Postgres │       │  Redis  │        │   S3    │
      │Auth +   │       │Sessions │        │  Docs   │
      │Fleet    │       │Load     │        │  PDFs   │
      │(perm.)  │       │Intel    │        │         │
      │         │       │Market   │        │         │
      │         │       │Geo      │        │         │
      │         │       │(ephem.) │        │         │
      └─────────┘       └─────────┘        └─────────┘
```

**Data storage split:**
- **Postgres:** Permanent business data — carriers, drivers, vehicles, loads, places, invoices, documents, settings
- **Redis:** Sessions + all ephemeral intelligence data — load intel feed (24h TTL), market strength (6h TTL), dismissed loads (24h TTL), chain cache (24h TTL), US city centroids (permanent)
- **S3:** Files — BOLs, rate cons, dispatch agreements, invoice PDFs

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 18.x |
| Build | Vite | 5.x |
| UI Framework | Material UI (MUI) | 5.x |
| Client State | TanStack React Query + Zustand | RQ 5.x |
| Backend | Express.js + TypeScript | 4.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16 |
| Cache / Ephemeral | Redis | 7.x |
| Auth | AWS Cognito + Redis Sessions | Existing module |
| Validation | Yup | 1.x |
| File Storage | AWS S3 | - |
| Email | AWS SES | - |
| PDF | @react-pdf/renderer | 3.x |
| Math | Decimal.js | 10.x |
| Deployment | Hetzner VPS + Dokploy + Docker | - |

---

## 2. Project Structure

```
fleetcommand/
├── docker-compose.yml
├── .env.example
├── .github/workflows/deploy.yml
├── package.json                       # Workspace root
├── tsconfig.base.json
├── data/
│   └── us-cities.csv                  # ~30K city centroids for geo matching
│
├── packages/
│   ├── auth/                          # EXISTING MODULE (unchanged)
│   │
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config/
│   │       │   ├── env.ts
│   │       │   ├── database.ts
│   │       │   ├── redis.ts
│   │       │   ├── s3.ts
│   │       │   ├── ses.ts
│   │       │   └── geoBootstrap.ts        # Load city CSV → Redis at startup
│   │       ├── middleware/
│   │       ├── modules/
│   │       │   ├── loads/
│   │       │   │   ├── loads.routes.ts
│   │       │   │   ├── loads.controller.ts
│   │       │   │   ├── loads.service.ts
│   │       │   │   ├── loads.validation.ts
│   │       │   │   └── loads.stateMachine.ts
│   │       │   ├── carriers/              # includes onboarding gate
│   │       │   ├── drivers/
│   │       │   ├── vehicles/
│   │       │   ├── contacts/
│   │       │   ├── places/
│   │       │   │   ├── places.routes.ts
│   │       │   │   ├── places.controller.ts
│   │       │   │   ├── places.service.ts
│   │       │   │   └── places.validation.ts
│   │       │   ├── invoices/
│   │       │   ├── documents/
│   │       │   ├── load-intel/            # Source-agnostic intelligence engine
│   │       │   │   ├── loadIntel.routes.ts
│   │       │   │   ├── loadIntel.controller.ts
│   │       │   │   ├── loadIntel.service.ts      # Ingest + dedupe + score
│   │       │   │   ├── loadIntel.scoring.ts      # Single-load composite scoring
│   │       │   │   ├── loadIntel.chaining.ts     # Chain assembly + scoring
│   │       │   │   ├── loadIntel.backhaul.ts     # Backhaul candidate search
│   │       │   │   ├── loadIntel.redis.ts        # Redis key helpers + feed ops
│   │       │   │   └── loadIntel.manual.ts       # Manual entry handler
│   │       │   ├── market/
│   │       │   │   ├── market.routes.ts
│   │       │   │   ├── market.controller.ts
│   │       │   │   └── market.service.ts
│   │       │   ├── fleet/
│   │       │   ├── dashboard/
│   │       │   └── email/
│   │       │       ├── email.service.ts
│   │       │       └── templates/
│   │       ├── shared/
│   │       │   ├── pagination.ts
│   │       │   ├── s3Presign.ts
│   │       │   ├── sequenceGenerator.ts
│   │       │   ├── financials.ts
│   │       │   ├── onboardingGate.ts
│   │       │   ├── redisClient.ts
│   │       │   └── geoLookup.ts               # City coords + haversine distance
│   │       └── types/
│   │
│   ├── web/
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Login.tsx
│   │       │   ├── Dashboard.tsx
│   │       │   ├── DispatchBoard.tsx
│   │       │   ├── LoadDetail.tsx              # includes Planned Backhaul section
│   │       │   ├── LoadCreate.tsx
│   │       │   ├── Carriers.tsx
│   │       │   ├── CarrierDetail.tsx
│   │       │   ├── DriverDetail.tsx            # includes preferences editor
│   │       │   ├── Places.tsx
│   │       │   ├── PlaceDetail.tsx
│   │       │   ├── Invoices.tsx
│   │       │   ├── LoadIntelFeed.tsx           # Intelligence feed page
│   │       │   └── FleetOverview.tsx
│   │       ├── components/
│   │       │   ├── dispatch/
│   │       │   │   ├── KanbanBoard.tsx
│   │       │   │   ├── KanbanColumn.tsx
│   │       │   │   ├── KanbanCard.tsx
│   │       │   │   ├── LoadTable.tsx
│   │       │   │   └── WeeklyGrossTracker.tsx
│   │       │   ├── loads/
│   │       │   │   ├── LoadCreatorStepper.tsx
│   │       │   │   ├── LoadDetailPanel.tsx
│   │       │   │   ├── StatusChangeDialog.tsx
│   │       │   │   ├── BrokerRateConUpload.tsx
│   │       │   │   ├── BolWorkflow.tsx
│   │       │   │   ├── DriverFitBadge.tsx
│   │       │   │   └── PlannedBackhaulPanel.tsx   # Book Chain backhaul section
│   │       │   ├── places/
│   │       │   │   └── PlaceTypeahead.tsx
│   │       │   ├── carriers/
│   │       │   │   ├── OnboardingChecklist.tsx
│   │       │   │   └── DispatchAgreementGenerator.tsx
│   │       │   ├── drivers/
│   │       │   │   ├── PreferencesEditor.tsx
│   │       │   │   └── DriverAssignmentCard.tsx
│   │       │   ├── invoices/
│   │       │   │   ├── InvoicePdfTemplate.tsx
│   │       │   │   └── InvoiceApprovalQueue.tsx
│   │       │   ├── fleet/
│   │       │   │   └── CpmExpenseEditor.tsx
│   │       │   ├── load-intel/
│   │       │   │   ├── IntelCard.tsx              # Side-by-side single + chain
│   │       │   │   ├── SingleScorePanel.tsx
│   │       │   │   ├── ChainScorePanel.tsx
│   │       │   │   ├── TruckBreakdownTable.tsx    # Expanded per-truck view
│   │       │   │   ├── MarketBadge.tsx
│   │       │   │   ├── MinBookIndicator.tsx
│   │       │   │   ├── SourceBadge.tsx            # DAT/Manual/Email/etc
│   │       │   │   ├── ManualEntryModal.tsx
│   │       │   │   └── FeedHeader.tsx             # Stats + source counts
│   │       │   └── shared/
│   │       │       ├── StatusBadge.tsx
│   │       │       ├── ConfirmDialog.tsx
│   │       │       ├── DocumentUpload.tsx
│   │       │       ├── EmptyState.tsx
│   │       │       └── OfflineBanner.tsx
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── stores/
│   │       ├── theme/
│   │       └── types/
│   │
│   └── shared/
│       └── src/
│           ├── types/
│           │   ├── loadIntel.ts               # LoadIntelPayload, TruckScore, ChainResult
│           │   └── market.ts
│           ├── constants/
│           │   ├── loadStatuses.ts
│           │   ├── kanbanGroups.ts
│           │   ├── roles.ts
│           │   ├── equipmentTypes.ts
│           │   ├── facilityTypes.ts
│           │   ├── dockTypes.ts
│           │   ├── documentTypes.ts
│           │   ├── prohibitedCommodities.ts
│           │   ├── marketTiers.ts
│           │   ├── scoringWeights.ts
│           │   └── loadSources.ts             # Source type enum + labels
│           └── utils/
│               ├── cpm.ts
│               ├── pricing.ts
│               ├── minBookRate.ts
│               ├── compositeScore.ts          # Single-load scoring
│               ├── chainScore.ts              # Chain-level scoring (RTP + DRU + WGP)
│               ├── driverFit.ts
│               └── geo.ts                     # Haversine distance
│
├── extension/                                 # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background/
│   │   └── service-worker.ts                  # Tab monitoring, batch queue, API
│   ├── content/
│   │   ├── dat-scraper.ts                     # DOM parser for DAT results
│   │   ├── dat-market.ts                      # DOM parser for market sidebar
│   │   └── dat-detector.ts                    # DAT page type detection
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.ts                           # Mode toggles, status, bulk trigger
│   ├── shared/
│   │   ├── normalizer.ts                      # DAT DOM data → LoadIntelPayload
│   │   ├── dedup.ts                           # Client-side hash cache
│   │   └── api.ts                             # FleetCommand API client
│   └── assets/icons/
```

---

## 3. Prisma Schema

```prisma
// ============================================
// FLEETCOMMAND DOMAIN TABLES
// ============================================
// NOTE: No ScrapedLoad table. All load intelligence
// data lives in Redis with 24h TTL.
// NOTE: Organization model (auth module) needs
// reverse relation: places Place[]
// ============================================

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

enum CarrierType {
  COMPANY_ASSET
  OWNER_OPERATOR
  EXTERNAL_CARRIER
}

enum FacilityType {
  WAREHOUSE
  DISTRIBUTION_CENTER
  CROSS_DOCK
  COLD_STORAGE
  PORT
  RAIL_YARD
  TRUCK_STOP
  DROP_YARD
  MANUFACTURING
  RETAIL
  FARM
  CONSTRUCTION_SITE
  MILITARY
  GOVERNMENT
  RESIDENTIAL
  OTHER
}

enum DockType {
  DOCK_HIGH
  GROUND_LEVEL
  BOTH
  NONE
}

enum GeoSource {
  AUTO
  MANUAL
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

enum ContactType {
  BROKER
  SHIPPER
  CONSIGNEE
  FACTORING
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

  // Preferences
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

enum VehicleOwnership {
  OWNED
  LEASED
}

enum EquipmentType {
  DRY_VAN
  REEFER
  FLATBED
  STEP_DECK
  BOX_TRUCK
  HOTSHOT
  POWER_ONLY
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

enum ExpenseCategory {
  FIXED
  VARIABLE
  SERVICE
  WAGE
  DEDUCTION
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

enum LoadStatus {
  QUOTED
  BOOKED
  DISPATCHED
  EN_ROUTE_PICKUP
  AT_PICKUP
  IN_TRANSIT
  AT_DELIVERY
  DELIVERED
  INVOICE_PENDING
  INVOICED
  PAID
  EXCEPTION
  CANCELED
  TONU
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

enum StopType {
  PICKUP
  DELIVERY
  STOP_OFF
  DROP_HOOK
  LIVE_UNLOAD
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

enum AccessorialType {
  DETENTION
  LUMPER
  TONU
  LAYOVER
  DRIVER_ASSIST
  FUEL_SURCHARGE
  TARP
  TOLL
  OTHER
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

enum InvoiceType {
  CUSTOMER
  DISPATCH_FEE
}

enum InvoiceStatus {
  DRAFT
  APPROVED
  SENT
  PARTIALLY_PAID
  PAID
  OVERDUE
  VOID
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

enum DocumentType {
  BROKER_RATE_CON
  BOL_UNSIGNED
  BOL_SIGNED
  DISPATCH_AGREEMENT
  INSURANCE_CERT
  W9
  CARRIER_PACKET
  INVOICE
  LUMPER_RECEIPT
  SCALE_TICKET
  OTHER
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
  loadIntelEmailAddress        String?   // V2: inbound email for load offers
  sesFromEmail                 String?
  companyLogoUrl               String?

  organization                 Organization @relation(fields: [organizationId], references: [id])
}
```

---

## 4. Redis Data Structures

### Key Patterns

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `intel:{orgId}:{loadHash}` | String (JSON) | 24h | Individual load with per-truck scores |
| `intel:feed:{orgId}` | Sorted Set | none* | Feed ranked by best composite score |
| `intel:dismissed:{orgId}` | Set | 24h | Dismissed load hashes |
| `intel:chain:{orgId}:{loadHash}` | String (JSON) | 24h | Cached chain results per load |
| `market:{state}:{city}` | String (JSON) | 6h | Market strength snapshot |
| `geo:cities` | Hash | none | US city centroids (~30K entries) |

*Sorted set members cleaned lazily when individual load keys expire.

### Load Hash Generation

Source-aware to prevent cross-source dedup collisions:
```
Hash = SHA256(source + origin_state + origin_city + dest_state + dest_city
              + pickup_date + broker_mc + posted_rate).slice(0, 12)
```

### Universal Load Intelligence Payload

```typescript
// packages/shared/src/types/loadIntel.ts

interface LoadIntelPayload {
  source: LoadSource;
  sourceRef?: string;
  batchId?: string;

  origin: { city: string; state: string; zip?: string };
  destination: { city: string; state: string; zip?: string };

  pickupDate?: string;
  deliveryDate?: string;
  equipmentType?: string;
  length?: number;

  commodity?: string;
  weight?: number;
  isHazmat?: boolean;

  postedRate?: number;
  ratePerMile?: number;
  loadedMiles?: number;
  deadheadMiles?: number;

  broker?: {
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
    mc?: string;
  };

  marketData?: {
    loadToTruckRatio?: number;
    market: string;
  };

  metadata?: Record<string, any>;
}

type LoadSource =
  | 'dat'            // DAT Chrome extension (active page)
  | 'dat_bulk'       // DAT bulk multi-tab scrape
  | 'manual'         // Dispatcher manual entry
  | 'truckstop'      // V2
  | '123loadboard'   // V2
  | 'email'          // V2
  | 'broker_api';    // V2
```

### Load Intel Redis Value Shape

```typescript
interface LoadIntelRedis {
  id: string;
  source: LoadSource;
  sourceRef?: string;
  origin: { city: string; state: string; zip?: string };
  destination: { city: string; state: string; zip?: string };
  pickupDate?: string;
  deliveryDate?: string;
  equipmentType?: string;
  hasRate: boolean;
  postedRate?: number;
  ratePerMile?: number;
  loadedMiles: number;
  deadheadMiles?: number;
  broker?: { name?: string; company?: string; phone?: string; email?: string; mc?: string };
  destinationMarket?: { loadToTruckRatio: number; tier: string };
  truckScores: TruckScore[];
  bestScore: number;
  bestScoreType: 'full' | 'route';
  bestTruckId: string;
  lowestMinBookRate: number;
  lowestMinBookTruckUnit: string;
  scrapedAt: string;
}

interface TruckScore {
  vehicleId: string;
  unitNumber: string;
  carrierName: string;
  driverId: string;
  driverName: string;
  minBookRate: number;
  rateMargin?: number;
  rateMarginStatus?: 'above' | 'below';
  cpm?: { truckCost: number; dispatchFee: number; estimatedProfit: number; profitPerMile: number; points: number };
  market: { loadToTruckRatio?: number; tier: string; points: number };
  driverFit: { isPreferredLane: boolean; isNoGoZone: boolean; milesFromHome?: number;
               daysFromHome?: number; exceedsMaxDaysOut: boolean; points: number };
  compositeScore: number;
  scoreType: 'full' | 'route';
  compositeLabel: string;
  flags: string[];
}
```

### Chain Cache Value Shape

```typescript
interface ChainCacheRedis {
  loadHash: string;
  evaluatedAt: string;
  chains: ChainResult[];   // Top 3 per truck
}

interface ChainResult {
  vehicleId: string;
  driverId: string;
  chainType: '2-step' | '3-step';
  legs: ChainLeg[];
  metrics: {
    roundTripRevenue: number;
    roundTripProfit: number;
    chainRPM: number;
    chainDays: number;
    dailyRevenueUtilization: number;
    projectedWeeklyGross: number;
    weeklyGrossTarget: number;
  };
  chainScore: number;
  chainScoreLabel: string;
  returnDistanceFromHome: number;
}

interface ChainLeg {
  loadHash: string;
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  rate?: number;
  miles: number;
  pickupDate?: string;
}
```

---

## 5. State Machine Implementation

```typescript
// packages/shared/src/constants/loadStatuses.ts

export const TRANSITIONS: Record<string, string[]> = {
  QUOTED:          ['BOOKED', 'CANCELED'],
  BOOKED:          ['DISPATCHED', 'CANCELED'],
  DISPATCHED:      ['EN_ROUTE_PICKUP', 'TONU', 'CANCELED'],
  EN_ROUTE_PICKUP: ['AT_PICKUP', 'TONU'],
  AT_PICKUP:       ['IN_TRANSIT', 'TONU'],
  IN_TRANSIT:      ['AT_DELIVERY', 'EXCEPTION'],
  AT_DELIVERY:     ['DELIVERED', 'EXCEPTION'],
  DELIVERED:       ['INVOICE_PENDING', 'EXCEPTION'],
  INVOICE_PENDING: ['INVOICED'],
  INVOICED:        ['PAID'],
  PAID:            [],
  EXCEPTION:       ['INVOICED'],
  CANCELED:        [],
  TONU:            ['INVOICED'],
};

export const ADMIN_ONLY_TRANSITIONS: string[] = ['EXCEPTION', 'PAID'];
export const NOTES_REQUIRED_TRANSITIONS: string[] = ['EXCEPTION', 'CANCELED'];

export const TRANSITION_PREREQUISITES: Record<string, (load: any) => string | null> = {
  BOOKED: (load) => load.carrierId ? null : 'Carrier must be assigned',
  DISPATCHED: (load) => {
    if (!load.driverId) return 'Driver must be assigned';
    if (!load.vehicleId) return 'Vehicle must be assigned';
    return null;
  },
};

export const TRANSITION_WARNINGS: Record<string, (load: any) => string | null> = {
  DISPATCHED: (load) => {
    if (!load.rateConReceivedAt) return 'No broker rate con on file. Continue anyway?';
    return null;
  },
  DELIVERED: (load) => {
    if (!load.bolSignedAt) return 'No signed BOL on file — payment may be delayed. Continue anyway?';
    return null;
  },
};

export const TRANSITION_SIDE_EFFECTS: Record<string, string[]> = {
  BOOKED:    ['CALCULATE_FINANCIALS'],
  DISPATCHED: ['FREEZE_FINANCIALS'],
  DELIVERED: ['AUTO_GENERATE_INVOICE'],
  TONU:      ['AUTO_CREATE_TONU_ACCESSORIAL', 'AUTO_GENERATE_INVOICE'],
};

export const KANBAN_GROUPS = {
  NEW:       { label: 'New',       color: '#FFC107', statuses: ['QUOTED'] },
  BOOKED:    { label: 'Booked',    color: '#FF9800', statuses: ['BOOKED'] },
  ACTIVE:    { label: 'Active',    color: '#4CAF50', statuses: ['DISPATCHED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'IN_TRANSIT', 'AT_DELIVERY'] },
  DELIVERED: { label: 'Delivered', color: '#9C27B0', statuses: ['DELIVERED', 'INVOICE_PENDING'] },
  COMPLETE:  { label: 'Complete',  color: '#9E9E9E', statuses: ['INVOICED', 'PAID'] },
  ISSUES:    { label: 'Issues',    color: '#F44336', statuses: ['EXCEPTION', 'CANCELED', 'TONU'] },
};
```

---

## 6. Carrier Onboarding Gate

```typescript
// packages/api/src/shared/onboardingGate.ts

interface OnboardingResult {
  allowed: boolean;
  missingDocuments: string[];
}

export function checkCarrierOnboarding(carrier: {
  type: string;
  dispatchAgreementOnFile: boolean;
  insuranceCertOnFile: boolean;
  insuranceExpiry: Date | null;
  w9OnFile: boolean;
}): OnboardingResult {
  if (carrier.type === 'COMPANY_ASSET') return { allowed: true, missingDocuments: [] };
  if (carrier.type === 'OWNER_OPERATOR') return { allowed: false, missingDocuments: ['Owner-operator support coming soon'] };

  const missing: string[] = [];
  if (!carrier.dispatchAgreementOnFile) missing.push('Signed Dispatch Agreement');
  if (!carrier.insuranceCertOnFile) {
    missing.push('Certificate of Insurance');
  } else if (carrier.insuranceExpiry && carrier.insuranceExpiry < new Date()) {
    missing.push(`Insurance expired on ${carrier.insuranceExpiry.toISOString().split('T')[0]}`);
  }
  if (!carrier.w9OnFile) missing.push('W-9');

  return { allowed: missing.length === 0, missingDocuments: missing };
}
```

---

## 7. Financial Calculations

```typescript
// packages/shared/src/utils/pricing.ts
import Decimal from 'decimal.js';
Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN });

export function calculateLoadFinancials(input: {
  customerRate: string | number;
  accessorials: string | number;
  loadedMiles: number | null;
  carrier: { type: string; dispatchFeePercent: string | number;
             partnerSplitPercent: string | number; feeIncludesAccessorials: boolean };
}) {
  if (input.carrier.type === 'OWNER_OPERATOR') throw new Error('Not yet implemented');

  const customerRate = new Decimal(input.customerRate);
  const accessorials = new Decimal(input.accessorials);
  const feePercent = new Decimal(input.carrier.dispatchFeePercent).div(100);
  const splitPercent = new Decimal(input.carrier.partnerSplitPercent).div(100);

  const feeBase = input.carrier.feeIncludesAccessorials ? customerRate.plus(accessorials) : customerRate;
  const dispatchFee = feeBase.mul(feePercent).toDecimalPlaces(2);
  const partnerSplit = dispatchFee.mul(splitPercent).toDecimalPlaces(2);
  const companyShare = dispatchFee.minus(partnerSplit);
  const totalRevenue = input.carrier.type === 'COMPANY_ASSET' ? customerRate.plus(accessorials) : dispatchFee;
  const ratePerMile = input.loadedMiles && input.loadedMiles > 0
    ? customerRate.div(input.loadedMiles).toDecimalPlaces(2).toString() : null;

  return {
    customerRate: customerRate.toDecimalPlaces(2).toString(),
    accessorials: accessorials.toDecimalPlaces(2).toString(),
    dispatchFee: dispatchFee.toString(),
    partnerSplit: partnerSplit.toString(),
    companyShare: companyShare.toString(),
    totalRevenue: totalRevenue.toDecimalPlaces(2).toString(),
    ratePerMile,
  };
}
```

---

## 8. Intelligence Engine — Scoring & Chaining

### 8.1 Min Book Rate

```typescript
// packages/shared/src/utils/minBookRate.ts
export function calculateMinBookRate(input: {
  vehicleCpm: number; totalMiles: number; feePercent: number; profitMargin: number;
}): number {
  const cost = new Decimal(input.vehicleCpm).mul(input.totalMiles);
  const feeMultiplier = new Decimal(1).minus(new Decimal(input.feePercent).div(100));
  const marginMultiplier = new Decimal(1).plus(input.profitMargin);
  const minRate = cost.div(feeMultiplier).mul(marginMultiplier).toDecimalPlaces(0);
  return Math.ceil(minRate.toNumber() / 50) * 50; // Round up to nearest $50
}
```

### 8.2 Single-Load Composite Score

See full implementation in TDD v4.1 §8. Unchanged. Three dimensions: CPM Profitability (0-40), Destination Market (0-30), Driver Fit (0-30). Two modes: ★ full (rate available) and ◇ route (no rate).

### 8.3 Chain Scoring

```typescript
// packages/shared/src/utils/chainScore.ts

interface ChainScoreInput {
  outboundRate: number;          // or minBookRate if unpriced
  backhaulRate: number;
  relayRate?: number;            // 3-step only
  outboundLoadedMiles: number;
  backhaulLoadedMiles: number;
  relayLoadedMiles?: number;
  totalChainMiles: number;       // All miles including deadhead between legs
  vehicleCpm: number;
  outboundFeePercent: number;
  backhaulFeePercent: number;
  relayFeePercent?: number;
  chainDays: number;
  returnDistanceFromHome: number;
  currentWeeklyGross: number;
  weeklyGrossTarget: number;
}

interface ChainScoreResult {
  profitabilityPoints: number;   // 0-40
  positioningPoints: number;     // 0-35
  timeEfficiencyPoints: number;  // 0-25
  chainScore: number;            // 0-100
  chainLabel: string;
  metrics: {
    roundTripRevenue: number;
    roundTripProfit: number;
    chainRPM: number;
    dailyRevenueUtilization: number;
    projectedWeeklyGross: number;
  };
}

export function calculateChainScore(input: ChainScoreInput): ChainScoreResult {
  // Revenue
  const revenue = input.outboundRate + input.backhaulRate + (input.relayRate ?? 0);

  // Cost
  const truckCost = input.vehicleCpm * input.totalChainMiles;
  const fees = (input.outboundRate * input.outboundFeePercent / 100)
             + (input.backhaulRate * input.backhaulFeePercent / 100)
             + ((input.relayRate ?? 0) * (input.relayFeePercent ?? 0) / 100);
  const profit = revenue - truckCost - fees;

  const loadedMiles = input.outboundLoadedMiles + input.backhaulLoadedMiles + (input.relayLoadedMiles ?? 0);
  const chainRPM = loadedMiles > 0 ? profit / loadedMiles : 0;

  // Dimension 1: Chain Profitability (0-40)
  let profitabilityPoints: number;
  if (chainRPM >= 1.00) profitabilityPoints = 40;
  else if (chainRPM >= 0.75) profitabilityPoints = 35;
  else if (chainRPM >= 0.50) profitabilityPoints = 28;
  else if (chainRPM >= 0.25) profitabilityPoints = 18;
  else if (chainRPM >= 0.10) profitabilityPoints = 8;
  else profitabilityPoints = 0;

  // Dimension 2: Return Positioning (0-35)
  let positioningPoints: number;
  const dist = input.returnDistanceFromHome;
  if (dist <= 100) positioningPoints = 35;
  else if (dist <= 200) positioningPoints = 28;
  else if (dist <= 300) positioningPoints = 20;
  else if (dist <= 500) positioningPoints = 10;
  else positioningPoints = 0;
  // Penalty if backhaul goes away from home is handled at chain assembly

  // Dimension 3: Time Efficiency (0-25)
  const dru = input.chainDays > 0 ? revenue / input.chainDays : 0;
  let timeEfficiencyPoints: number;
  if (dru >= 1500) timeEfficiencyPoints = 25;
  else if (dru >= 1200) timeEfficiencyPoints = 20;
  else if (dru >= 900) timeEfficiencyPoints = 15;
  else if (dru >= 600) timeEfficiencyPoints = 8;
  else timeEfficiencyPoints = 0;

  const chainScore = Math.max(0, Math.min(100, profitabilityPoints + positioningPoints + timeEfficiencyPoints));

  let chainLabel: string;
  if (chainScore >= 85) chainLabel = 'Excellent';
  else if (chainScore >= 65) chainLabel = 'Good';
  else if (chainScore >= 40) chainLabel = 'Marginal';
  else chainLabel = 'Pass';

  return {
    profitabilityPoints, positioningPoints, timeEfficiencyPoints,
    chainScore, chainLabel,
    metrics: {
      roundTripRevenue: revenue,
      roundTripProfit: profit,
      chainRPM,
      dailyRevenueUtilization: dru,
      projectedWeeklyGross: input.currentWeeklyGross + revenue,
    },
  };
}
```

### 8.4 Backhaul Search

```typescript
// packages/api/src/modules/load-intel/loadIntel.backhaul.ts

async function findBackhaulCandidates(params: {
  fromCity: string; fromState: string;
  radiusMiles: number; earliestPickup: string;
  equipmentType?: string; orgId: string;
}, redis: RedisClient): Promise<LoadIntelRedis[]> {
  const fromCoords = await getCityCoords(redis, params.fromState, params.fromCity);
  if (!fromCoords) return [];

  const feedKey = `intel:feed:${params.orgId}`;
  const allLoadIds = await redis.zrevrange(feedKey, 0, -1);
  const candidates: LoadIntelRedis[] = [];

  for (const loadId of allLoadIds) {
    const loadJson = await redis.get(loadId);
    if (!loadJson) { await redis.zrem(feedKey, loadId); continue; }
    const load: LoadIntelRedis = JSON.parse(loadJson);

    const originCoords = await getCityCoords(redis, load.origin.state, load.origin.city);
    if (!originCoords) continue;

    const distance = haversineDistance(fromCoords.lat, fromCoords.lng, originCoords.lat, originCoords.lng);
    if (distance > params.radiusMiles) continue;
    if (load.pickupDate && load.pickupDate < params.earliestPickup) continue;
    if (params.equipmentType && load.equipmentType && load.equipmentType !== params.equipmentType) continue;

    candidates.push(load);
    if (candidates.length >= 20) break; // Cap
  }
  return candidates;
}
```

### 8.5 Geo Utilities

```typescript
// packages/api/src/shared/geoLookup.ts

export async function getCityCoords(redis: RedisClient, state: string, city: string)
  : Promise<{ lat: number; lng: number } | null> {
  const val = await redis.hget('geo:cities', `${state}:${city.toLowerCase()}`);
  if (!val) return null;
  const [lat, lng] = val.split(',').map(Number);
  return { lat, lng };
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number { return deg * (Math.PI / 180); }
```

### 8.6 Ingestion Pipeline

```typescript
// packages/api/src/modules/load-intel/loadIntel.service.ts

async function ingestLoad(payload: LoadIntelPayload, orgId: string): Promise<IngestResult> {
  // 1. Validate minimum fields
  if (!payload.origin?.city || !payload.origin?.state ||
      !payload.destination?.city || !payload.destination?.state) {
    throw new ValidationError('Origin and destination required');
  }

  // 2. Normalize
  const normalized = normalizePayload(payload);

  // 3. Deduplicate (hash includes source)
  const loadHash = generateLoadHash(normalized);
  const key = `intel:${orgId}:${loadHash}`;
  if (await redis.exists(key)) return { status: 'duplicate', loadHash };

  // 4. Market data
  if (normalized.marketData?.loadToTruckRatio) {
    await storeMarketData(normalized.destination, normalized.marketData);
  }
  const destMarket = await getMarketData(normalized.destination);

  // 5. Score per truck
  const trucks = await getActiveTrucksWithDrivers(orgId);
  const truckScores = trucks.map(truck => scoreLoadForTruck(normalized, truck, destMarket));

  // 6. Store in Redis (24h TTL)
  const loadIntel: LoadIntelRedis = { id: key, source: normalized.source, /* ... */ truckScores,
    bestScore: Math.max(...truckScores.map(t => t.compositeScore)), scrapedAt: new Date().toISOString() };
  await redis.set(key, JSON.stringify(loadIntel), 'EX', 86400);
  await redis.zadd(`intel:feed:${orgId}`, loadIntel.bestScore, key);

  // 7. Chain evaluation: LAZY — triggered on feed read, not here
  return { status: 'ingested', loadHash, bestScore: loadIntel.bestScore };
}

// Batch ingestion for extension auto-capture and bulk scrape
async function ingestBatch(loads: LoadIntelPayload[], orgId: string): Promise<BatchResult> {
  let ingested = 0, duplicates = 0, invalid = 0;
  const errors: { index: number; error: string }[] = [];
  for (let i = 0; i < loads.length; i++) {
    try {
      const result = await ingestLoad(loads[i], orgId);
      if (result.status === 'duplicate') duplicates++; else ingested++;
    } catch (e) {
      invalid++;
      errors.push({ index: i, error: e.message });
    }
  }
  return { total: loads.length, ingested, duplicates, invalid, errors };
}
```

---

## 9. API Endpoints

### P0: Dispatch first load (Weeks 1-2)
```
# Auth (existing)
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/token/refresh
GET    /api/v1/auth/me

# Loads
GET    /api/v1/loads                        ?page=&limit=&status=&search=&sort=&order=
GET    /api/v1/loads/:id
POST   /api/v1/loads
PATCH  /api/v1/loads/:id
PATCH  /api/v1/loads/:id/status             { status, notes?, overrideWarnings? }

# Carriers
GET    /api/v1/carriers                     ?page=&limit=&type=&search=
POST   /api/v1/carriers
PATCH  /api/v1/carriers/:id
GET    /api/v1/carriers/:id/onboarding

# Drivers
GET    /api/v1/drivers                      ?carrierId=
POST   /api/v1/drivers
PATCH  /api/v1/drivers/:id                  # Includes preferences
GET    /api/v1/drivers/:id/fit              ?originState=&destState=&destCity=

# Vehicles
GET    /api/v1/vehicles                     ?carrierId=
POST   /api/v1/vehicles
PATCH  /api/v1/vehicles/:id

# Contacts
GET    /api/v1/contacts                     ?type=&search=
POST   /api/v1/contacts
PATCH  /api/v1/contacts/:id

# Places
GET    /api/v1/places                       ?page=&limit=&search=&facilityType=&state=&contactId=&sort=&order=
GET    /api/v1/places/:id
POST   /api/v1/places
PATCH  /api/v1/places/:id
DELETE /api/v1/places/:id                   # Soft delete
GET    /api/v1/places/typeahead             ?q=&limit=10

# Documents
POST   /api/v1/documents/presign            { fileName, mimeType, loadId?, carrierId?, type }
POST   /api/v1/documents/:id/confirm
GET    /api/v1/documents                    ?loadId=&carrierId=&type=
```

### P1: Full operations (Week 3)
```
# Invoices
GET    /api/v1/invoices                     ?status=&type=&overdue=&missingBol=
GET    /api/v1/invoices/:id
PATCH  /api/v1/invoices/:id
DELETE /api/v1/invoices/:id
POST   /api/v1/invoices/:id/approve
POST   /api/v1/invoices/:id/send            { email }
POST   /api/v1/invoices/:id/mark-paid       { amount, method, reference, date }

# Load detail
POST   /api/v1/loads/:id/check-calls
GET    /api/v1/loads/:id/check-calls
GET    /api/v1/loads/:id/status-history
GET    /api/v1/loads/:id/documents
```

### P2: Intelligence engine (Weeks 5-6)
```
# Load Intelligence (source-agnostic, Redis-backed)
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

# Backhaul Search
GET    /api/v1/load-intel/backhaul          ?fromCity=&fromState=&radius=&earliestPickup=

# Market Data
POST   /api/v1/market-data                  Store market snapshot
GET    /api/v1/market-data/:state/:city     Current market strength

# Carrier Onboarding
POST   /api/v1/carriers/:id/generate-agreement
POST   /api/v1/carriers/:id/send-agreement

# Fleet / CPM
PATCH  /api/v1/vehicles/:id/expenses
GET    /api/v1/fleet/overview
POST   /api/v1/fleet/price-check            { loadedMiles, deadheadMiles, rate }

# Dashboard
GET    /api/v1/dashboard/kpis
GET    /api/v1/dashboard/weekly-gross

# Org Settings
GET    /api/v1/settings
PATCH  /api/v1/settings
```

### Response Envelope
```typescript
// Success
{ data: T | T[], meta?: { page, limit, total, totalPages, hasMore } }

// Error
{ error: { code: string, message: string, details?: Record<string, string> } }

// Batch ingestion
{ data: { total, ingested, duplicates, invalid, errors: [] } }

// Status transition with warnings
{ data: Load, warnings?: string[] }

// Place typeahead response
{ data: { id, name, city, state, address?, facilityType?, contactName?, contactCompanyName? }[] }
```

**Place geo auto-lookup behavior:**
- POST: if no lat/lng provided, call `getCityCoords(redis, state, city)`, set `geoSource: AUTO`
- PATCH: if city/state changes and geoSource is AUTO, re-lookup. If lat/lng manually set, geoSource → MANUAL.

---

## 10. Tenant Scoping

```typescript
// Postgres entities: filter by organizationId
prisma.load.findMany({ where: { organizationId, deletedAt: null } });

// Places: filter by organizationId
prisma.place.findMany({ where: { organizationId, deletedAt: null } });

// Carriers: filter by managedByOrgId
prisma.carrier.findMany({ where: { managedByOrgId: organizationId, deletedAt: null } });

// Children: scope through parent
prisma.driver.findMany({ where: { carrier: { managedByOrgId: organizationId }, deletedAt: null } });

// Redis intelligence data: orgId in key pattern
// intel:{orgId}:{loadHash} — scoped by key structure

// DISPATCHER role: strip partnerSplit
function stripSensitiveFields(data: any, role: string) {
  if (role !== 'ADMIN') { delete data.partnerSplit; delete data.partnerSplitPercent; }
  return data;
}
```

---

## 11. Deployment

```yaml
version: '3.8'
services:
  api:
    build: ./packages/api
    environment:
      - DATABASE_URL=postgresql://fleetcommand:${DB_PASSWORD}@postgres:5432/fleetcommand
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
      - COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
      - S3_BUCKET=${S3_BUCKET}
      - SES_FROM_EMAIL=${SES_FROM_EMAIL}
      - APP_URL=${APP_URL}
      - COOKIE_DOMAIN=${COOKIE_DOMAIN}
    ports:
      - "4000:4000"
    depends_on: [postgres, redis]
    restart: unless-stopped

  web:
    build: ./packages/web
    ports:
      - "3000:80"
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: fleetcommand
      POSTGRES_USER: fleetcommand
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redisdata:/data
    restart: unless-stopped

  backup:
    image: prodrigestivill/postgres-backup-local
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: fleetcommand
      POSTGRES_USER: fleetcommand
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      SCHEDULE: "@daily"
      BACKUP_KEEP_DAYS: 30
    volumes:
      - ./backups:/backups
    depends_on: [postgres]

volumes:
  pgdata:
  redisdata:
```

### Environment Variables
```bash
NODE_ENV=production
APP_URL=https://app.fleetcommand.com
COOKIE_DOMAIN=.fleetcommand.com
DB_PASSWORD=
REDIS_PASSWORD=
JWT_SECRET=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_REGION=us-east-1
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=fleetcommand-documents
S3_PRESIGN_EXPIRES=900
SES_FROM_EMAIL=dispatch@fleetcommand.com
```

### Hetzner
- **CPX21** (3 vCPU, 4GB RAM, 80GB SSD) — ~€8.50/month
- Redis 256MB with LRU eviction covers: sessions + ~5,000 load intel records + geo data + market + chain cache
- Upgrade to CPX31 at 10+ concurrent users
