import type { PrismaClient } from '@prisma/client';

export interface SettlementFreezeQueryPort {
  hasNonDraftSettlementForLoad(
    loadId: string,
    organizationId: string,
  ): Promise<boolean>;
}

export const settlementFreezeQueryPrisma = (
  prisma: PrismaClient,
): SettlementFreezeQueryPort => ({
  hasNonDraftSettlementForLoad: async (loadId, organizationId) => {
    const count = await prisma.settlementLineItem.count({
      where: {
        referenceId: loadId,
        settlement: {
          organizationId,
          status: { in: ['APPROVED', 'PAID'] },
        },
      },
    });
    return count > 0;
  },
});
