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
        organization: { is: { deleted: false } },
        carrier: { is: { deletedAt: null } },
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

  revokeByOrganizationId: async (organizationId) => {
    await prisma.carrierInviteToken.updateMany({
      where: {
        organizationId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },
});
