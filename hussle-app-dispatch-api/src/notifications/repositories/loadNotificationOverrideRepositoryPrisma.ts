import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { LoadNotificationOverrideRepoPort } from '../types/notificationRepoPort';

export const loadNotificationOverrideRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): LoadNotificationOverrideRepoPort => ({
  findByLoadId: async (loadId, organizationId) =>
    prisma.loadNotificationOverride.findMany({
      where: { loadId, load: { organizationId } },
      orderBy: { createdAt: 'asc' },
    }),

  upsert: async (input) =>
    prisma.loadNotificationOverride.upsert({
      where: {
        loadId_trigger_channel: {
          loadId: input.loadId,
          trigger: input.trigger,
          channel: input.channel,
        },
      },
      create: {
        loadId: input.loadId,
        trigger: input.trigger,
        channel: input.channel,
        enabled: input.enabled,
        recipientEmail: input.recipientEmail ?? null,
        recipientPhone: input.recipientPhone ?? null,
        ccEmails: input.ccEmails ?? [],
      },
      update: {
        enabled: input.enabled,
        recipientEmail: input.recipientEmail ?? null,
        recipientPhone: input.recipientPhone ?? null,
        ccEmails: input.ccEmails ?? [],
      },
    }),

  deleteByLoadIdAndTriggerChannel: async (loadId, trigger, channel) => {
    await prisma.loadNotificationOverride.deleteMany({
      where: {
        loadId,
        trigger: trigger as never,
        channel: channel as never,
      },
    });
  },
});
