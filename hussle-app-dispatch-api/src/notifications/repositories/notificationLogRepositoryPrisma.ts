import type { PrismaClient, Prisma } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { NotificationLogRepoPort } from '../types/notificationRepoPort';

export const notificationLogRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): NotificationLogRepoPort => ({
  create: async (input) =>
    prisma.notificationLog.create({
      data: {
        loadId: input.loadId,
        trigger: input.trigger,
        channel: input.channel,
        recipientEmail: input.recipientEmail ?? null,
        recipientPhone: input.recipientPhone ?? null,
        subject: input.subject ?? null,
        status: input.status ?? 'sent',
        errorMessage: input.errorMessage ?? null,
        metadata: input.metadata !== undefined
          ? (input.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    }),

  findByLoadId: async (loadId) =>
    prisma.notificationLog.findMany({
      where: { loadId },
      orderBy: { createdAt: 'desc' },
    }),
});
