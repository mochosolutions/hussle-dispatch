import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EligibleDriverQueryPort } from '@/loads/types/rankDriverTypes';

export const eligibleDriverQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): EligibleDriverQueryPort => ({
  findActiveDriversForOrg: async (organizationId) => {
    const drivers = await prisma.driver.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        carrier: {
          managedByOrgId: organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        currentCity: true,
        currentState: true,
        status: true,
        timezone: true,
      },
    });

    return drivers;
  },
});
