-- CreateEnum
CREATE TYPE "BillingMethod" AS ENUM ('DIRECT', 'FACTORED');

-- CreateEnum
CREATE TYPE "FactoringSubmission" AS ENUM ('EMAIL', 'PORTAL');

-- CreateEnum
CREATE TYPE "EmailMode" AS ENUM ('PLATFORM', 'MANUAL');

-- CreateEnum
CREATE TYPE "InvoiceWorkflow" AS ENUM ('AUTO_SEND', 'AUTO_REVIEW');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "InvoiceReadiness" AS ENUM ('NOT_READY', 'AWAITING_DOCUMENTS', 'READY', 'INVOICE_CREATED');

-- AlterTable: Carrier — add billing/factoring fields
ALTER TABLE "Carrier" ADD COLUMN "billingMethod" "BillingMethod" NOT NULL DEFAULT 'DIRECT';
ALTER TABLE "Carrier" ADD COLUMN "factoringCompanyName" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "factoringCompanyEmail" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "factoringSubmissionMethod" "FactoringSubmission";
ALTER TABLE "Carrier" ADD COLUMN "factoringAdvanceRate" DECIMAL(5,4);
ALTER TABLE "Carrier" ADD COLUMN "factoringFeePercent" DECIMAL(5,4);
ALTER TABLE "Carrier" ADD COLUMN "factoringNoa" TEXT;
ALTER TABLE "Carrier" ADD COLUMN "outboundEmailMode" "EmailMode" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Carrier" ADD COLUMN "replyToEmail" TEXT;

-- AlterTable: AccessorialCharge — add approval tracking
ALTER TABLE "AccessorialCharge" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "AccessorialCharge" ADD COLUMN "approvalSource" TEXT;
ALTER TABLE "AccessorialCharge" ADD COLUMN "approvalNotes" TEXT;
ALTER TABLE "AccessorialCharge" ADD COLUMN "documentId" TEXT;

-- AlterTable: Invoice — add billing/delivery fields
ALTER TABLE "Invoice" ADD COLUMN "billingMethod" "BillingMethod";
ALTER TABLE "Invoice" ADD COLUMN "deliveryMethod" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "sentToEmail" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "factoringAdvance" DECIMAL(10,2);
ALTER TABLE "Invoice" ADD COLUMN "factoringFeeAmount" DECIMAL(10,2);
ALTER TABLE "Invoice" ADD COLUMN "reserveAmount" DECIMAL(10,2);
ALTER TABLE "Invoice" ADD COLUMN "advanceReceivedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "reserveReleasedAt" TIMESTAMP(3);

-- AlterTable: OrgSettings — add invoice workflow
ALTER TABLE "OrgSettings" ADD COLUMN "invoiceWorkflow" "InvoiceWorkflow" NOT NULL DEFAULT 'AUTO_REVIEW';

-- AlterTable: Load — add invoice readiness
ALTER TABLE "Load" ADD COLUMN "invoiceReadiness" "InvoiceReadiness" NOT NULL DEFAULT 'NOT_READY';

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
