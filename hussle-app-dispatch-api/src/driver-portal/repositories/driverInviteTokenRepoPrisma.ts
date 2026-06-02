import type { PrismaClient } from '@prisma/client';

import type { PrismaTransaction } from '@/shared/prisma';

import type { DriverInviteTokenRepoPort } from '../types/driverAuthTypes';

export const driverInviteTokenRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DriverInviteTokenRepoPort => ({
  create: async (input) =>
    prisma.driverInviteToken.create({
      data: {
        driverId: input.driverId,
        organizationId: input.organizationId,
        token: input.token,
        expiresAt: input.expiresAt,
      },
    }),

  findByToken: async (token) => prisma.driverInviteToken.findUnique({ where: { token } }),

  markAccepted: async (id, acceptedAt) => {
    await prisma.driverInviteToken.update({ where: { id }, data: { acceptedAt } });
  },
});
