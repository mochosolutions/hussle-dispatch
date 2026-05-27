import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { NotificationSettingsRepoPort } from '../types/notificationRepoPort';

export const notificationSettingsRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): NotificationSettingsRepoPort => ({
  findByCustomerId: async (customerId) =>
    prisma.customerNotificationSettings.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    }),

  upsert: async (input) =>
    prisma.customerNotificationSettings.upsert({
      where: {
        customerId_trigger_channel: {
          customerId: input.customerId,
          trigger: input.trigger,
          channel: input.channel,
        },
      },
      create: {
        customerId: input.customerId,
        trigger: input.trigger,
        channel: input.channel,
        enabled: input.enabled,
        recipientEmail: input.recipientEmail ?? null,
        recipientPhone: input.recipientPhone ?? null,
      },
      update: {
        enabled: input.enabled,
        recipientEmail: input.recipientEmail ?? null,
        recipientPhone: input.recipientPhone ?? null,
      },
    }),

  deleteByCustomerIdAndTriggerChannel: async (customerId, trigger, channel) => {
    await prisma.customerNotificationSettings.deleteMany({
      where: {
        customerId,
        trigger: trigger as never,
        channel: channel as never,
      },
    });
  },
});
