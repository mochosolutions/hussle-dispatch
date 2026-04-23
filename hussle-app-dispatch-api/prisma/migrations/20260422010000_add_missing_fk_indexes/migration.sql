-- Missing FK / hot-column indexes identified by database review 2026-04-22.
-- All additive; safe on production data; no data migration required.

-- CreateIndex
CREATE INDEX "Load_driverId_idx" ON "Load"("driverId");

-- CreateIndex
CREATE INDEX "Load_vehicleId_idx" ON "Load"("vehicleId");

-- CreateIndex
CREATE INDEX "Invoice_carrierId_idx" ON "Invoice"("carrierId");

-- CreateIndex
CREATE INDEX "Settlement_driverId_idx" ON "Settlement"("driverId");

-- CreateIndex
CREATE INDEX "SettlementLineItem_settlementId_idx" ON "SettlementLineItem"("settlementId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_entityType_entityId_idx" ON "AuditLog"("organizationId", "entityType", "entityId");
