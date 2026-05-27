/**
 * Data migration: convert TruckExpense rows to RecurringExpense rows.
 * Keeps TruckExpense table (dropped in Migration B).
 *
 * Run manually: npx tsx prisma/migrations/data-migration-truck-expenses.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const run = async (): Promise<void> => {
  const truckExpenses = await prisma.truckExpense.findMany({
    include: {
      vehicle: {
        select: {
          id: true,
          carrier: {
            select: { managedByOrgId: true },
          },
        },
      },
    },
  });

  let created = 0;
  let skipped = 0;

  for (const te of truckExpenses) {
    const existing = await prisma.recurringExpense.findUnique({
      where: {
        vehicleId_label: {
          vehicleId: te.vehicleId,
          label: te.expenseKey,
        },
      },
    });

    if (existing !== null) {
      skipped += 1;
      continue;
    }

    await prisma.recurringExpense.create({
      data: {
        organizationId: te.vehicle.carrier.managedByOrgId,
        vehicleId: te.vehicleId,
        category: te.category,
        label: te.expenseKey,
        amount: te.monthlyAmount,
        frequency: 'MONTHLY',
      },
    });
    created += 1;
  }

  process.stdout.write(`TruckExpense migration complete: ${created} created, ${skipped} skipped\n`);
  await prisma.$disconnect();
};

run().catch((error: unknown) => {
  process.stderr.write(`Migration failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
