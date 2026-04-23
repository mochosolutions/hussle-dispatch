-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "LoadNotificationOverride" ADD COLUMN "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[];
