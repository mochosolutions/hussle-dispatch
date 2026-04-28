-- CreateTable
CREATE TABLE "OrgApiKey" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgApiKey_keyPrefix_idx" ON "OrgApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "OrgApiKey_organizationId_idx" ON "OrgApiKey"("organizationId");

-- AddForeignKey
ALTER TABLE "OrgApiKey" ADD CONSTRAINT "OrgApiKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
