-- CreateEnum
CREATE TYPE "RateconImportStatus" AS ENUM ('RECEIVED', 'EXTRACTING', 'PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'EXTRACTION_FAILED');

-- CreateEnum
CREATE TYPE "RateconImportSource" AS ENUM ('EMAIL_INBOUND', 'MANUAL_UPLOAD');

-- CreateTable
CREATE TABLE "PendingRateconImport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "RateconImportStatus" NOT NULL DEFAULT 'RECEIVED',
    "source" "RateconImportSource" NOT NULL,
    "documentId" TEXT,
    "extractionResult" JSONB,
    "extractionConfidence" TEXT,
    "requiresReview" BOOLEAN NOT NULL DEFAULT true,
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isRatecon" BOOLEAN,
    "documentTypeGuess" TEXT,
    "failureReason" TEXT,
    "matchedCustomerId" TEXT,
    "brokerName" TEXT,
    "brokerEmail" TEXT,
    "laneSummary" TEXT,
    "customerRate" DECIMAL(10,2),
    "pickupDate" TIMESTAMP(3),
    "emailMessageId" TEXT,
    "emailSubject" TEXT,
    "emailFrom" TEXT,
    "receivedByUserId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractionStartedAt" TIMESTAMP(3),
    "extractionCompletedAt" TIMESTAMP(3),
    "acceptedLoadId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "rejectedByUserId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PendingRateconImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingRateconImport_organizationId_status_idx" ON "PendingRateconImport"("organizationId", "status");

-- CreateIndex
CREATE INDEX "PendingRateconImport_organizationId_receivedAt_idx" ON "PendingRateconImport"("organizationId", "receivedAt");

-- CreateIndex
CREATE INDEX "PendingRateconImport_emailMessageId_idx" ON "PendingRateconImport"("emailMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingRateconImport_organizationId_emailMessageId_document_key" ON "PendingRateconImport"("organizationId", "emailMessageId", "documentId");

-- AddForeignKey
ALTER TABLE "PendingRateconImport" ADD CONSTRAINT "PendingRateconImport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingRateconImport" ADD CONSTRAINT "PendingRateconImport_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingRateconImport" ADD CONSTRAINT "PendingRateconImport_matchedCustomerId_fkey" FOREIGN KEY ("matchedCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingRateconImport" ADD CONSTRAINT "PendingRateconImport_acceptedLoadId_fkey" FOREIGN KEY ("acceptedLoadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingRateconImport" ADD CONSTRAINT "PendingRateconImport_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingRateconImport" ADD CONSTRAINT "PendingRateconImport_rejectedByUserId_fkey" FOREIGN KEY ("rejectedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

