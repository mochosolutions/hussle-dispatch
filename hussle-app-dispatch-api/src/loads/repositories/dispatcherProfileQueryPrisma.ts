import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { DispatcherProfileQueryPort } from '../types/loadTypes';

export const dispatcherProfileQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DispatcherProfileQueryPort => ({
  findByUserId: async (userId, organizationId) => {
    const membership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { dispatcherProfile: true },
    });

    if (!membership?.dispatcherProfile) {
      return null;
    }

    return {
      commissionType: membership.dispatcherProfile.commissionType,
      commissionRate: String(membership.dispatcherProfile.commissionRate),
    };
  },
});
