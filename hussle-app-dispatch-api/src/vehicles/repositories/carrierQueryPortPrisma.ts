import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { CarrierRepositoryPort } from '../types/vehicleTypes';

export const createCarrierQueryPort = (
  prisma: PrismaClient | PrismaTransaction,
): CarrierRepositoryPort => ({
  findActiveByIdForOrg: async (carrierId, organizationId) => {
    const carrier = await prisma.carrier.findFirst({
      where: {
        id: carrierId,
        managedByOrgId: organizationId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return carrier !== null;
  },
});
