-- CreateEnum
CREATE TYPE "OrganizationVertical" AS ENUM ('LOGISTICS', 'HEALTHCARE', 'STAFFING');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('BROKER', 'CARRIER', 'SHIPPER');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CarrierType" AS ENUM ('COMPANY_ASSET', 'OWNER_OPERATOR', 'EXTERNAL_CARRIER');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('BROKER', 'SHIPPER', 'CONSIGNEE', 'FACTORING');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 'BOX_TRUCK', 'HOTSHOT', 'POWER_ONLY');

-- CreateEnum
CREATE TYPE "VehicleOwnership" AS ENUM ('OWNED', 'LEASED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FIXED', 'VARIABLE', 'SERVICE', 'WAGE', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('QUOTED', 'BOOKED', 'DISPATCHED', 'EN_ROUTE_PICKUP', 'AT_PICKUP', 'IN_TRANSIT', 'AT_DELIVERY', 'DELIVERED', 'INVOICE_PENDING', 'INVOICED', 'PAID', 'EXCEPTION', 'CANCELED', 'TONU');

-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('PICKUP', 'DELIVERY', 'STOP_OFF', 'DROP_HOOK', 'LIVE_UNLOAD');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('WAREHOUSE', 'DISTRIBUTION_CENTER', 'CROSS_DOCK', 'COLD_STORAGE', 'PORT', 'RAIL_YARD', 'TRUCK_STOP', 'DROP_YARD', 'MANUFACTURING', 'RETAIL', 'FARM', 'CONSTRUCTION_SITE', 'MILITARY', 'GOVERNMENT', 'RESIDENTIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DockType" AS ENUM ('DOCK_HIGH', 'GROUND_LEVEL', 'BOTH', 'NONE');

-- CreateEnum
CREATE TYPE "GeoSource" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "AccessorialType" AS ENUM ('DETENTION', 'LUMPER', 'TONU', 'LAYOVER', 'DRIVER_ASSIST', 'FUEL_SURCHARGE', 'TARP', 'TOLL', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('CUSTOMER', 'DISPATCH_FEE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BROKER_RATE_CON', 'BOL_UNSIGNED', 'BOL_SIGNED', 'DISPATCH_AGREEMENT', 'INSURANCE_CERT', 'W9', 'CARRIER_PACKET', 'INVOICE', 'LUMPER_RECEIPT', 'SCALE_TICKET', 'OTHER');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "description" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "vertical" "OrganizationVertical" NOT NULL DEFAULT 'LOGISTICS',
    "role" "OrganizationRole" NOT NULL DEFAULT 'BROKER',
    "status" "OrganizationStatus" NOT NULL DEFAULT 'PENDING',
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "customFields" JSONB,
    "resources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "invitedById" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "managedByOrgId" TEXT NOT NULL,
    "carrierOrgId" TEXT,
    "name" TEXT NOT NULL,
    "type" "CarrierType" NOT NULL DEFAULT 'EXTERNAL_CARRIER',
    "mcNumber" TEXT,
    "dotNumber" TEXT,
    "ein" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "primaryContactName" TEXT,
    "primaryContactPhone" TEXT,
    "primaryContactEmail" TEXT,
    "dispatchFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "partnerSplitPercent" DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    "feeIncludesAccessorials" BOOLEAN NOT NULL DEFAULT false,
    "ownerOpPayPercent" DECIMAL(5,2),
    "dispatchAgreementOnFile" BOOLEAN NOT NULL DEFAULT false,
    "dispatchAgreementSignedAt" TIMESTAMP(3),
    "insuranceCertOnFile" BOOLEAN NOT NULL DEFAULT false,
    "insuranceExpiry" TIMESTAMP(3),
    "w9OnFile" BOOLEAN NOT NULL DEFAULT false,
    "carrierPacketOnFile" BOOLEAN NOT NULL DEFAULT false,
    "onboardingFlowId" TEXT,
    "onboardingStatus" TEXT,
    "authorityStatus" TEXT DEFAULT 'active',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "mcNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "paymentTerms" TEXT NOT NULL DEFAULT 'net_30',
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "quickPayDiscount" DECIMAL(5,2),
    "carrierPacketSentAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "cdlNumber" TEXT,
    "cdlState" TEXT,
    "cdlExpiry" TIMESTAMP(3),
    "availableHours" DECIMAL(4,1),
    "currentCity" TEXT,
    "currentState" TEXT,
    "homeBaseCity" TEXT,
    "homeBaseState" TEXT,
    "maxDaysOut" INTEGER DEFAULT 5,
    "preferredLanes" JSONB,
    "noGoZones" JSONB,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "driverId" TEXT,
    "unitNumber" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "ownership" "VehicleOwnership" NOT NULL DEFAULT 'OWNED',
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "vin" TEXT,
    "licensePlate" TEXT,
    "licensePlateState" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "warrantyInfo" TEXT,
    "monthlyGrossTarget" DECIMAL(10,2),
    "monthlyMilesTarget" INTEGER,
    "workingDaysPerMonth" INTEGER NOT NULL DEFAULT 22,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckExpense" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "expenseKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "monthlyAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Load" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "loadNumber" TEXT NOT NULL,
    "carrierId" TEXT,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "brokerId" TEXT,
    "shipperId" TEXT,
    "consigneeId" TEXT,
    "brokerRefNumber" TEXT,
    "equipmentType" "EquipmentType",
    "isHazmat" BOOLEAN NOT NULL DEFAULT false,
    "isTarp" BOOLEAN NOT NULL DEFAULT false,
    "isTeamDriver" BOOLEAN NOT NULL DEFAULT false,
    "commodity" TEXT,
    "weight" INTEGER,
    "pieceCount" INTEGER,
    "loadedMiles" INTEGER,
    "deadheadMiles" INTEGER,
    "totalMiles" INTEGER,
    "customerRate" DECIMAL(10,2),
    "carrierRate" DECIMAL(10,2),
    "dispatchFee" DECIMAL(10,2),
    "partnerSplit" DECIMAL(10,2),
    "ratePerMile" DECIMAL(6,2),
    "status" "LoadStatus" NOT NULL DEFAULT 'QUOTED',
    "rateConReceivedAt" TIMESTAMP(3),
    "bolUnsignedAt" TIMESTAMP(3),
    "bolSignedAt" TIMESTAMP(3),
    "dispatcherNotes" TEXT,
    "driverInstructions" TEXT,
    "scrapedLoadId" TEXT,
    "plannedNextLoadRef" JSONB,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Load_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stop" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "contactId" TEXT,
    "placeId" TEXT,
    "type" "StopType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "facilityName" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "appointmentDate" TIMESTAMP(3),
    "appointmentTime" TEXT,
    "appointmentNumber" TEXT,
    "arrivalTime" TIMESTAMP(3),
    "departureTime" TIMESTAMP(3),
    "contactName" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "geoSource" "GeoSource" NOT NULL DEFAULT 'AUTO',
    "facilityType" "FacilityType",
    "operatingHours" TEXT,
    "receivingHours" TEXT,
    "appointmentRequired" BOOLEAN NOT NULL DEFAULT false,
    "dockType" "DockType",
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "checkInProcedures" TEXT,
    "lumperRequired" BOOLEAN NOT NULL DEFAULT false,
    "ppeRequired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadStatusHistory" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "fromStatus" "LoadStatus",
    "toStatus" "LoadStatus" NOT NULL,
    "changedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckCall" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "calledByUserId" TEXT,
    "location" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "status" TEXT,
    "eta" TIMESTAMP(3),
    "brokerNotified" BOOLEAN NOT NULL DEFAULT false,
    "brokerNotes" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessorialCharge" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "type" "AccessorialType" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "billTo" TEXT NOT NULL DEFAULT 'customer',
    "isAutoGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessorialCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "carrierId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "accessorials" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paymentTerms" TEXT NOT NULL DEFAULT 'net_30',
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "missingSignedBol" BOOLEAN NOT NULL DEFAULT false,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "sentTo" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidAmount" DECIMAL(10,2),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "pdfUrl" TEXT,
    "createdByUserId" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "loadId" TEXT,
    "carrierId" TEXT,
    "type" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "s3Key" TEXT NOT NULL,
    "s3Url" TEXT NOT NULL,
    "uploadStatus" TEXT NOT NULL DEFAULT 'pending',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "uploadedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "defaultTonuFee" DECIMAL(10,2) NOT NULL DEFAULT 250.00,
    "prohibitedCommodities" TEXT[] DEFAULT ARRAY['garbage', 'refuse', 'recyclables', 'dirty recyclables']::TEXT[],
    "weeklyGrossTarget" DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
    "defaultDetentionRate" DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    "detentionFreeHours" INTEGER NOT NULL DEFAULT 2,
    "minBookRateProfitMargin" DECIMAL(3,2) NOT NULL DEFAULT 0.15,
    "defaultMaxDaysOut" INTEGER NOT NULL DEFAULT 5,
    "chainDepthThresholdMiles" INTEGER NOT NULL DEFAULT 500,
    "backhaulSearchRadiusMiles" INTEGER NOT NULL DEFAULT 50,
    "autoScrapingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "loadIntelEmailAddress" TEXT,
    "sesFromEmail" TEXT,
    "companyLogoUrl" TEXT,

    CONSTRAINT "OrgSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrierNote" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarrierNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_deleted_status_idx" ON "Organization"("deleted", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_externalId_key" ON "User"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_externalId_idx" ON "User"("externalId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Membership_userId_status_idx" ON "Membership"("userId", "status");

-- CreateIndex
CREATE INDEX "Membership_organizationId_status_idx" ON "Membership"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_token_idx" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_status_expiresAt_idx" ON "Invitation"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_organizationId_email_key" ON "Invitation"("organizationId", "email");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_timestamp_idx" ON "AuditLog"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "Carrier_managedByOrgId_idx" ON "Carrier"("managedByOrgId");

-- CreateIndex
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

-- CreateIndex
CREATE INDEX "Driver_carrierId_idx" ON "Driver"("carrierId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_driverId_key" ON "Vehicle"("driverId");

-- CreateIndex
CREATE INDEX "Vehicle_carrierId_idx" ON "Vehicle"("carrierId");

-- CreateIndex
CREATE UNIQUE INDEX "TruckExpense_vehicleId_expenseKey_key" ON "TruckExpense"("vehicleId", "expenseKey");

-- CreateIndex
CREATE INDEX "Load_organizationId_idx" ON "Load"("organizationId");

-- CreateIndex
CREATE INDEX "Load_status_idx" ON "Load"("status");

-- CreateIndex
CREATE INDEX "Load_carrierId_idx" ON "Load"("carrierId");

-- CreateIndex
CREATE UNIQUE INDEX "Load_organizationId_loadNumber_key" ON "Load"("organizationId", "loadNumber");

-- CreateIndex
CREATE INDEX "Stop_loadId_idx" ON "Stop"("loadId");

-- CreateIndex
CREATE INDEX "Stop_placeId_idx" ON "Stop"("placeId");

-- CreateIndex
CREATE INDEX "Place_organizationId_idx" ON "Place"("organizationId");

-- CreateIndex
CREATE INDEX "Place_organizationId_city_state_idx" ON "Place"("organizationId", "city", "state");

-- CreateIndex
CREATE INDEX "Place_contactId_idx" ON "Place"("contactId");

-- CreateIndex
CREATE INDEX "LoadStatusHistory_loadId_idx" ON "LoadStatusHistory"("loadId");

-- CreateIndex
CREATE INDEX "CheckCall_loadId_idx" ON "CheckCall"("loadId");

-- CreateIndex
CREATE INDEX "AccessorialCharge_loadId_idx" ON "AccessorialCharge"("loadId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_loadId_idx" ON "Invoice"("loadId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Document_loadId_idx" ON "Document"("loadId");

-- CreateIndex
CREATE INDEX "Document_carrierId_idx" ON "Document"("carrierId");

-- CreateIndex
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgSettings_organizationId_key" ON "OrgSettings"("organizationId");

-- CreateIndex
CREATE INDEX "CarrierNote_carrierId_idx" ON "CarrierNote"("carrierId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrier" ADD CONSTRAINT "Carrier_managedByOrgId_fkey" FOREIGN KEY ("managedByOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrier" ADD CONSTRAINT "Carrier_carrierOrgId_fkey" FOREIGN KEY ("carrierOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckExpense" ADD CONSTRAINT "TruckExpense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stop" ADD CONSTRAINT "Stop_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stop" ADD CONSTRAINT "Stop_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stop" ADD CONSTRAINT "Stop_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadStatusHistory" ADD CONSTRAINT "LoadStatusHistory_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadStatusHistory" ADD CONSTRAINT "LoadStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckCall" ADD CONSTRAINT "CheckCall_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckCall" ADD CONSTRAINT "CheckCall_calledByUserId_fkey" FOREIGN KEY ("calledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgSettings" ADD CONSTRAINT "OrgSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrierNote" ADD CONSTRAINT "CarrierNote_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

