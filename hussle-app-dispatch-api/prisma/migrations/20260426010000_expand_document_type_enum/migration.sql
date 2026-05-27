-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'MEDICAL_CARD';
ALTER TYPE "DocumentType" ADD VALUE 'MVR';
ALTER TYPE "DocumentType" ADD VALUE 'DRUG_TEST';
ALTER TYPE "DocumentType" ADD VALUE 'ROAD_TEST_CERT';
ALTER TYPE "DocumentType" ADD VALUE 'DRIVER_APPLICATION';
ALTER TYPE "DocumentType" ADD VALUE 'PSP_REPORT';
ALTER TYPE "DocumentType" ADD VALUE 'BACKGROUND_CHECK';
ALTER TYPE "DocumentType" ADD VALUE 'ANNUAL_REVIEW';
ALTER TYPE "DocumentType" ADD VALUE 'HAZMAT_ENDORSEMENT';
ALTER TYPE "DocumentType" ADD VALUE 'TWIC_CARD';
ALTER TYPE "DocumentType" ADD VALUE 'MC_AUTHORITY';
ALTER TYPE "DocumentType" ADD VALUE 'VOIDED_CHECK';
ALTER TYPE "DocumentType" ADD VALUE 'NOTICE_OF_ASSIGNMENT';
ALTER TYPE "DocumentType" ADD VALUE 'BOC3';
ALTER TYPE "DocumentType" ADD VALUE 'IFTA_LICENSE';
ALTER TYPE "DocumentType" ADD VALUE 'TITLE';
ALTER TYPE "DocumentType" ADD VALUE 'IFTA_DECAL';
ALTER TYPE "DocumentType" ADD VALUE 'IRP_CAB_CARD';
ALTER TYPE "DocumentType" ADD VALUE 'MAINTENANCE_RECORD';
ALTER TYPE "DocumentType" ADD VALUE 'LEASE_AGREEMENT';
ALTER TYPE "DocumentType" ADD VALUE 'BIT_INSPECTION';
ALTER TYPE "DocumentType" ADD VALUE 'TEMPERATURE_LOG';
ALTER TYPE "DocumentType" ADD VALUE 'TONU_DOC';
ALTER TYPE "DocumentType" ADD VALUE 'FUEL_RECEIPT';
ALTER TYPE "DocumentType" ADD VALUE 'LOAD_PHOTO';
