import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { DriverQueryPort } from '../types/vehicleTypes';

export const createDriverQueryPort = (
  prisma: PrismaClient | PrismaTransaction,
): DriverQueryPort => ({
  findById: async (driverId, organizationId) => {
    const driver = await prisma.driver.findFirst({
      where: {
        id: driverId,
        deletedAt: null,
        carrier: {
          managedByOrgId: organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        carrierId: true,
      },
    });

    return driver;
  },
});
