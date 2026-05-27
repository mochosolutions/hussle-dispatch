-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationTrigger" AS ENUM ('STATUS_CHANGE', 'CHECK_CALL', 'DOCUMENT_UPLOADED');

-- CreateTable
CREATE TABLE "CustomerNotificationSettings" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "trigger" "NotificationTrigger" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadNotificationOverride" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "trigger" "NotificationTrigger" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadNotificationOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadTrackingToken" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadTrackingToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "trigger" "NotificationTrigger" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "subject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerNotificationSettings_customerId_idx" ON "CustomerNotificationSettings"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerNotificationSettings_customerId_trigger_channel_key" ON "CustomerNotificationSettings"("customerId", "trigger", "channel");

-- CreateIndex
CREATE INDEX "LoadNotificationOverride_loadId_idx" ON "LoadNotificationOverride"("loadId");

-- CreateIndex
CREATE UNIQUE INDEX "LoadNotificationOverride_loadId_trigger_channel_key" ON "LoadNotificationOverride"("loadId", "trigger", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "LoadTrackingToken_token_key" ON "LoadTrackingToken"("token");

-- CreateIndex
CREATE INDEX "LoadTrackingToken_token_idx" ON "LoadTrackingToken"("token");

-- CreateIndex
CREATE INDEX "LoadTrackingToken_loadId_idx" ON "LoadTrackingToken"("loadId");

-- CreateIndex
CREATE INDEX "NotificationLog_loadId_idx" ON "NotificationLog"("loadId");

-- CreateIndex
CREATE INDEX "NotificationLog_loadId_trigger_idx" ON "NotificationLog"("loadId", "trigger");

-- AddForeignKey
ALTER TABLE "CustomerNotificationSettings" ADD CONSTRAINT "CustomerNotificationSettings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadNotificationOverride" ADD CONSTRAINT "LoadNotificationOverride_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadTrackingToken" ADD CONSTRAINT "LoadTrackingToken_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;
