import type { PrismaClient } from '@prisma/client';
import type { LoadMileageUpdatePort } from '../types/iftaTypes';

export const loadMileageUpdatePrisma = (
  prisma: PrismaClient,
): LoadMileageUpdatePort => ({
  updateTotalMiles: async (loadId, miles) => {
    await prisma.load.update({
      where: { id: loadId },
      data: { totalMiles: miles },
    });
  },
});
