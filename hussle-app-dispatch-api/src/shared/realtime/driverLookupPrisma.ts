import type { PrismaClient } from '@prisma/client';

import type { DriverLookupPort } from './socketServer';

/**
 * Prisma-backed DriverLookupPort for the realtime layer. Resolves the Driver.id
 * linked to an authenticated DRIVER user via Driver.userId.
 */
export const createDriverLookupPrisma = (prisma: PrismaClient): DriverLookupPort => ({
  findDriverIdByUserId: async (userId: string): Promise<string | null> => {
    const driver = await prisma.driver.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    return driver?.id ?? null;
  },
});
