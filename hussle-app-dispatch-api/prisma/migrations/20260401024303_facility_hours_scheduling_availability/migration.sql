/*
  Warnings:

  - You are about to drop the column `operatingHours` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `receivingHours` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `appointmentDate` on the `Stop` table. All the data in the column will be lost.
  - You are about to drop the column `appointmentTime` on the `Stop` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SchedulingType" AS ENUM ('APPOINTMENT', 'FCFS', 'NOTIFICATION', 'OPEN', 'DROP_HOOK');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ScheduleOverrideType" AS ENUM ('OFF', 'MODIFIED', 'ADDED');

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "Place" DROP COLUMN "operatingHours",
DROP COLUMN "receivingHours",
ADD COLUMN     "facilityHours" JSONB,
ADD COLUMN     "is24Hours" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "Stop" DROP COLUMN "appointmentDate",
DROP COLUMN "appointmentTime",
ADD COLUMN     "appointmentEnd" TIMESTAMP(3),
ADD COLUMN     "appointmentStart" TIMESTAMP(3),
ADD COLUMN     "notificationHours" INTEGER,
ADD COLUMN     "notifiedAt" TIMESTAMP(3),
ADD COLUMN     "schedulingType" "SchedulingType" NOT NULL DEFAULT 'FCFS',
ADD COLUMN     "targetDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DriverAvailability" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "is24Hours" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverScheduleOverride" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "ScheduleOverrideType" NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverAvailability_driverId_idx" ON "DriverAvailability"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverAvailability_driverId_dayOfWeek_key" ON "DriverAvailability"("driverId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "DriverScheduleOverride_driverId_idx" ON "DriverScheduleOverride"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverScheduleOverride_driverId_date_key" ON "DriverScheduleOverride"("driverId", "date");

-- AddForeignKey
ALTER TABLE "DriverAvailability" ADD CONSTRAINT "DriverAvailability_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverScheduleOverride" ADD CONSTRAINT "DriverScheduleOverride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
