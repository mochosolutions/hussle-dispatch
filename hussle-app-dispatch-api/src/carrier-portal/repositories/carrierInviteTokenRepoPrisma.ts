import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { CarrierInviteTokenRepoPort } from '../types/carrierInviteTokenRepoPort';

export const carrierInviteTokenRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): CarrierInviteTokenRepoPort => ({
  findByToken: (token) =>
    prisma.carrierInviteToken.findFirst({
      where: {
        token,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    }),

  create: (data) =>
    prisma.carrierInviteToken.create({ data }),

  revokeByCarrierId: async (carrierId) => {
    await prisma.carrierInviteToken.updateMany({
      where: {
        carrierId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },
});
