import type { PrismaClient } from '@prisma/client';
import type { DriverQueryPort } from '../types/driverQueryPort';

export const driverQueryPrisma = (prisma: PrismaClient): DriverQueryPort => ({
  findById: async (driverId) => {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });
    return driver;
  },
});
