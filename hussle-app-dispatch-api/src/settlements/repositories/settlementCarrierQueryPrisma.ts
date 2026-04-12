import type { PrismaClient } from '@prisma/client';
import type { CarrierQueryPort } from '../types/settlementTypes';

export const settlementCarrierQueryPrisma = (prisma: PrismaClient): CarrierQueryPort => ({
  findById: async (carrierId, organizationId) =>
    prisma.carrier.findFirst({ where: { id: carrierId, managedByOrgId: organizationId } }),
});
