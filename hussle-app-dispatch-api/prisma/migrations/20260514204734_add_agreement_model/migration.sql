-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'PENDING', 'SIGNED', 'VOIDED', 'EXPIRED', 'DECLINED');

-- CreateEnum
CREATE TYPE "AgreementTemplateKey" AS ENUM ('DISPATCH_AGREEMENT');

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "templateKey" "AgreementTemplateKey" NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'PENDING',
    "providerName" TEXT NOT NULL,
    "providerSubmissionId" TEXT,
    "embedUrl" TEXT,
    "embedUrlExpiresAt" TIMESTAMP(3),
    "signerName" TEXT,
    "signerEmail" TEXT,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "signedPdfS3Key" TEXT,
    "auditCertificateS3Key" TEXT,
    "signedPdfSha256" TEXT,
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidedByUserId" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_providerSubmissionId_key" ON "Agreement"("providerSubmissionId");

-- CreateIndex
CREATE INDEX "Agreement_organizationId_carrierId_status_idx" ON "Agreement"("organizationId", "carrierId", "status");

-- CreateIndex
CREATE INDEX "Agreement_status_updatedAt_idx" ON "Agreement"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Agreement_organizationId_idx" ON "Agreement"("organizationId");

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_voidedByUserId_fkey" FOREIGN KEY ("voidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
