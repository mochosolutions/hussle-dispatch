-- CreateEnum
CREATE TYPE "DriverPayType" AS ENUM ('PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('PER_LOAD_PERCENT', 'FLAT_WEEKLY', 'FLAT_MONTHLY');

-- CreateEnum
CREATE TYPE "DispatcherCommType" AS ENUM ('PERCENTAGE_OF_MARGIN', 'PERCENTAGE_OF_GROSS', 'FLAT_PER_LOAD');

-- CreateEnum
CREATE TYPE "ExpenseSource" AS ENUM ('MANUAL', 'RECURRING', 'BANK_IMPORT', 'FUEL_CARD');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'DEF');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'DISPUTED');

-- CreateEnum
CREATE TYPE "SettlementItemType" AS ENUM ('LOAD_REVENUE', 'DISPATCH_FEE', 'EXPENSE', 'ACCESSORIAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "MileageSource" AS ENUM ('MANUAL', 'GPS', 'ELD');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('TRUCK', 'TRAILER', 'EQUIPMENT', 'BUSINESS_LINE');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'PAID_OFF', 'DEFAULTED');

-- AlterEnum
ALTER TYPE "CarrierType" ADD VALUE 'LEASED_CARRIER';

-- AlterEnum: Replace ExpenseCategory with expanded value set.
-- Data migration for TruckExpense (existing table): map old values to new equivalents.
-- FIXED->TRUCK_PAYMENT, VARIABLE->FUEL, SERVICE->MAINTENANCE, WAGE->OTHER, DEDUCTION->OTHER
-- Expense and RecurringExpense are new tables created below, so they don't need USING mapping.
CREATE TYPE "ExpenseCategory_new" AS ENUM ('FUEL', 'MAINTENANCE', 'TOLLS', 'PARKING', 'MEALS', 'INSURANCE', 'TRUCK_PAYMENT', 'TRAILER_RENTAL', 'PERMITS_TAGS', 'SCALES', 'LUMPER', 'TIRES', 'OIL_CHANGE', 'DEF_FLUID', 'TRUCK_WASH', 'ELD_SUBSCRIPTION', 'PHONE', 'LODGING', 'FACTORING_FEE', 'OTHER');
ALTER TABLE "TruckExpense" ALTER COLUMN "category" TYPE "ExpenseCategory_new" USING (
  CASE "category"::text
    WHEN 'FIXED'     THEN 'TRUCK_PAYMENT'
    WHEN 'VARIABLE'  THEN 'FUEL'
    WHEN 'SERVICE'   THEN 'MAINTENANCE'
    WHEN 'WAGE'      THEN 'OTHER'
    WHEN 'DEDUCTION' THEN 'OTHER'
    ELSE "category"::text
  END::"ExpenseCategory_new"
);
ALTER TYPE "ExpenseCategory" RENAME TO "ExpenseCategory_old";
ALTER TYPE "ExpenseCategory_new" RENAME TO "ExpenseCategory";
DROP TYPE "ExpenseCategory_old";

-- AlterTable
ALTER TABLE "Carrier" ADD COLUMN     "feeType" "FeeType" NOT NULL DEFAULT 'PER_LOAD_PERCENT',
ADD COLUMN     "includeExpensesOnSettlement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payFromNet" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "payRate" DECIMAL(7,4),
ADD COLUMN     "payType" "DriverPayType";

-- AlterTable
ALTER TABLE "Load" ADD COLUMN     "carrierPayout" DECIMAL(10,2),
ADD COLUMN     "companyMargin" DECIMAL(10,2),
ADD COLUMN     "dispatcherComm" DECIMAL(10,2),
ADD COLUMN     "dispatcherUserId" TEXT,
ADD COLUMN     "driverPay" DECIMAL(10,2),
ADD COLUMN     "estimatedCost" DECIMAL(10,2),
ADD COLUMN     "estimatedHours" DECIMAL(5,1);

-- CreateTable
CREATE TABLE "DispatcherProfile" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "commissionType" "DispatcherCommType" NOT NULL DEFAULT 'PERCENTAGE_OF_MARGIN',
    "commissionRate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatcherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Loan must exist before RecurringExpense references it
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "LoanType" NOT NULL,
    "lender" TEXT NOT NULL,
    "originalAmount" DECIMAL(12,2) NOT NULL,
    "interestRate" DECIMAL(5,4) NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "remainingBalance" DECIMAL(12,2) NOT NULL,
    "monthlyPayment" DECIMAL(10,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RecurringExpense must exist before Expense references it
CREATE TABLE "RecurringExpense" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "Frequency" NOT NULL DEFAULT 'MONTHLY',
    "dayOfMonth" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "loanId" TEXT,
    "lastGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "vendor" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "state" TEXT,
    "notes" TEXT,
    "receiptUrl" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringExpenseId" TEXT,
    "source" "ExpenseSource" NOT NULL DEFAULT 'MANUAL',
    "externalTransactionId" TEXT,
    "gallons" DECIMAL(8,2),
    "pricePerGallon" DECIMAL(6,3),
    "fuelType" "FuelType",
    "odometer" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "settlementNumber" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossRevenue" DECIMAL(12,2) NOT NULL,
    "totalMiles" INTEGER NOT NULL,
    "dispatchFeeTotal" DECIMAL(10,2) NOT NULL,
    "expensesTotal" DECIMAL(10,2) NOT NULL,
    "netEarnings" DECIMAL(12,2) NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "disputeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementLineItem" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "type" "SettlementItemType" NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "miles" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadStateMiles" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "miles" DECIMAL(8,2) NOT NULL,
    "source" "MileageSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadStateMiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanPayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "expenseId" TEXT,
    "principal" DECIMAL(10,2) NOT NULL,
    "interest" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DispatcherProfile_membershipId_key" ON "DispatcherProfile"("membershipId");

-- CreateIndex
CREATE INDEX "Expense_vehicleId_date_idx" ON "Expense"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "Expense_organizationId_date_idx" ON "Expense"("organizationId", "date");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringExpense_vehicleId_label_key" ON "RecurringExpense"("vehicleId", "label");

-- CreateIndex
CREATE INDEX "Settlement_organizationId_periodStart_idx" ON "Settlement"("organizationId", "periodStart");

-- CreateIndex
CREATE INDEX "Settlement_carrierId_idx" ON "Settlement"("carrierId");

-- CreateIndex
CREATE INDEX "LoadStateMiles_loadId_idx" ON "LoadStateMiles"("loadId");

-- CreateIndex
CREATE UNIQUE INDEX "LoadStateMiles_loadId_state_key" ON "LoadStateMiles"("loadId", "state");

-- AddForeignKey
ALTER TABLE "DispatcherProfile" ADD CONSTRAINT "DispatcherProfile_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringExpenseId_fkey" FOREIGN KEY ("recurringExpenseId") REFERENCES "RecurringExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementLineItem" ADD CONSTRAINT "SettlementLineItem_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadStateMiles" ADD CONSTRAINT "LoadStateMiles_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill carrierPayout from carrierRate
UPDATE "Load" SET "carrierPayout" = "carrierRate" WHERE "carrierRate" IS NOT NULL;
-- Backfill companyMargin from dispatchFee
UPDATE "Load" SET "companyMargin" = "dispatchFee" WHERE "dispatchFee" IS NOT NULL;
