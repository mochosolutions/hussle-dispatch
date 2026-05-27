import type { PrismaClient } from '@prisma/client';
import type { SettlementDriverQueryPort } from '../types/settlementTypes';

export const settlementDriverQueryPrisma = (
  prisma: PrismaClient,
): SettlementDriverQueryPort => ({
  findById: async (driverId) =>
    prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, payType: true, payRate: true },
    }),
});
