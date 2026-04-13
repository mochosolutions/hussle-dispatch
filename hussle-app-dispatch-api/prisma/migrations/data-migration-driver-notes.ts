/**
 * Data migration: parse Driver.notes JSON for {payType, payRate}
 * and populate the new payType/payRate columns.
 *
 * Run manually: npx tsx prisma/migrations/data-migration-driver-notes.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_PAY_TYPES = ['PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE'] as const;

const isValidPayType = (value: unknown): value is typeof VALID_PAY_TYPES[number] =>
  typeof value === 'string' && VALID_PAY_TYPES.includes(value as typeof VALID_PAY_TYPES[number]);

const run = async (): Promise<void> => {
  const drivers = await prisma.driver.findMany({
    where: { notes: { not: null } },
    select: { id: true, notes: true, payType: true },
  });

  let migrated = 0;
  let skipped = 0;

  for (const driver of drivers) {
    if (driver.payType !== null) {
      skipped += 1;
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(driver.notes ?? '');
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'payType' in parsed &&
        'payRate' in parsed
      ) {
        const obj = parsed as Record<string, unknown>;
        if (isValidPayType(obj.payType) && typeof obj.payRate === 'number') {
          await prisma.driver.update({
            where: { id: driver.id },
            data: {
              payType: obj.payType,
              payRate: obj.payRate,
            },
          });
          migrated += 1;
        }
      }
    } catch {
      // notes is not JSON — skip
      skipped += 1;
    }
  }

  process.stdout.write(`Driver notes migration complete: ${migrated} migrated, ${skipped} skipped\n`);
  await prisma.$disconnect();
};

run().catch((error: unknown) => {
  process.stderr.write(`Migration failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
