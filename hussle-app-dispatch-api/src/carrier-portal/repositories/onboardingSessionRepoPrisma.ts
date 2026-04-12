import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { OnboardingSessionRepoPort } from '../types/onboardingSessionRepoPort';

export const onboardingSessionRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): OnboardingSessionRepoPort => ({
  findByCarrierId: (carrierId) =>
    prisma.onboardingSession.findUnique({
      where: { carrierId },
    }),

  create: (data) =>
    prisma.onboardingSession.create({ data }),

  update: (id, data) =>
    prisma.onboardingSession.update({
      where: { id },
      data,
    }),
});
