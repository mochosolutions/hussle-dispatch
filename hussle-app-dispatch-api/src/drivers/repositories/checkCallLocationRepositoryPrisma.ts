import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

export interface LoadDriverLocationSnapshot {
  driverId: string;
  lastLocationAt: Date | null;
}

export interface CheckCallLocationRepoPort {
  findDriverByLoadId(loadId: string): Promise<LoadDriverLocationSnapshot | null>;
  updateDriverLocation(
    driverId: string,
    input: { latitude: number; longitude: number; lastLocationAt: Date },
  ): Promise<void>;
}

export const checkCallLocationRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): CheckCallLocationRepoPort => ({
  findDriverByLoadId: async (loadId) => {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        driverId: true,
        driver: {
          select: { lastLocationAt: true },
        },
      },
    });

    if (load === null || load.driverId === null || load.driver === null) {
      return null;
    }

    return {
      driverId: load.driverId,
      lastLocationAt: load.driver.lastLocationAt,
    };
  },

  updateDriverLocation: async (driverId, input) => {
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLatitude: input.latitude,
        currentLongitude: input.longitude,
        lastLocationAt: input.lastLocationAt,
      },
    });
  },
});
