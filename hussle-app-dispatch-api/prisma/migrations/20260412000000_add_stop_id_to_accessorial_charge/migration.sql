-- AlterTable
ALTER TABLE "AccessorialCharge" ADD COLUMN "stopId" TEXT;

-- CreateIndex
CREATE INDEX "AccessorialCharge_stopId_idx" ON "AccessorialCharge"("stopId");

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "Stop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
