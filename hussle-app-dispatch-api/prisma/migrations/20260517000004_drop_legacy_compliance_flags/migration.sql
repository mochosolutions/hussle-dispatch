-- NOTE: Readers of w9OnFile/carrierPacketOnFile migrate in story US-02.
-- This migration runs after that reader-migration commit by virtue of its later timestamp.
-- Deploying this migration before US-02 lands will break loadService/onboardingGate readers.

ALTER TABLE "Carrier" DROP COLUMN "w9OnFile";
ALTER TABLE "Carrier" DROP COLUMN "carrierPacketOnFile";
