import type { PrismaClient } from '@prisma/client';

import type { PrismaTransaction } from '@/shared/prisma';

import type { DriverAuthRepoPort } from '../types/driverAuthTypes';

export const driverAuthRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DriverAuthRepoPort => ({
  findDriverAuthInfo: async (driverId) => {
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        userId: true,
        carrier: { select: { managedByOrgId: true } },
      },
    });

    if (driver === null) {
      return null;
    }

    return {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      userId: driver.userId,
      managedByOrgId: driver.carrier.managedByOrgId,
    };
  },

  findDriverIdByUserId: async (userId) => {
    const driver = await prisma.driver.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    return driver?.id ?? null;
  },

  linkUser: async (driverId, userId) => {
    await prisma.driver.update({ where: { id: driverId }, data: { userId } });
  },
});
