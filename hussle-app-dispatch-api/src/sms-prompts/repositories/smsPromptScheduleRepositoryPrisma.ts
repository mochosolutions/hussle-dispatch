import type { PrismaClient } from '@prisma/client';
import type {
  SmsPromptScheduleRepoPort,
  SmsPromptAnchorValue,
} from '../types/smsPromptScheduleRepoPort';

export const smsPromptScheduleRepositoryPrisma = (
  prisma: PrismaClient,
): SmsPromptScheduleRepoPort => ({
  create: async (input) =>
    prisma.smsPromptSchedule.create({
      data: {
        loadId: input.loadId,
        driverId: input.driverId,
        organizationId: input.organizationId,
        anchor: input.anchor,
        scheduledAt: input.scheduledAt,
      },
    }),

  findById: async (id) =>
    prisma.smsPromptSchedule.findUnique({ where: { id } }),

  findPending: async (loadId, anchor) =>
    prisma.smsPromptSchedule.findMany({
      where: {
        loadId,
        status: 'PENDING',
        ...(anchor !== undefined && { anchor }),
      },
      orderBy: { scheduledAt: 'asc' },
    }),

  cancel: async (ids, reason) => {
    if (ids.length === 0) {
      return;
    }
    await prisma.smsPromptSchedule.updateMany({
      where: {
        id: { in: ids },
        status: 'PENDING',
      },
      data: {
        status: 'CANCELED',
        failureReason: reason,
      },
    });
  },

  markSent: async (id, twilioMessageSid, sentAt) =>
    prisma.smsPromptSchedule.update({
      where: { id },
      data: {
        status: 'SENT',
        twilioMessageSid,
        sentAt,
      },
    }),

  markFailed: async (id, failureReason) =>
    prisma.smsPromptSchedule.update({
      where: { id },
      data: {
        status: 'FAILED',
        failureReason,
      },
    }),

  findByLoad: async (loadId, pagination) => {
    const [data, total] = await Promise.all([
      prisma.smsPromptSchedule.findMany({
        where: { loadId },
        orderBy: { scheduledAt: 'asc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.smsPromptSchedule.count({ where: { loadId } }),
    ]);
    return { data, total };
  },

  lastSentAtForLoad: async (loadId) => {
    const row = await prisma.smsPromptSchedule.findFirst({
      where: {
        loadId,
        status: 'SENT',
        sentAt: { not: null },
      },
      orderBy: { sentAt: 'desc' },
    });
    return row?.sentAt ?? null;
  },
});

// Re-export helper for downstream consumers that only need the typed port alias
export type { SmsPromptScheduleRepoPort, SmsPromptAnchorValue };
