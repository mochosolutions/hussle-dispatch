-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "userId" TEXT;

-- CreateTable
CREATE TABLE "DriverInviteToken" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverInviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverInviteToken_token_key" ON "DriverInviteToken"("token");

-- CreateIndex
CREATE INDEX "DriverInviteToken_driverId_idx" ON "DriverInviteToken"("driverId");

-- CreateIndex
CREATE INDEX "DriverInviteToken_token_idx" ON "DriverInviteToken"("token");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverInviteToken" ADD CONSTRAINT "DriverInviteToken_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverInviteToken" ADD CONSTRAINT "DriverInviteToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
