import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { MessageDedupPort } from './messageDedupPort';

const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

/**
 * Durable idempotency store backed by the `ProcessedEvent` inbox table.
 * Survives process/broker restarts; the `@@unique([queueGroup, messageId])`
 * constraint also resolves the concurrent-delivery race — a duplicate insert
 * throws P2002, which we treat as "already processed".
 */
export const createPrismaMessageDedup = (prisma: PrismaClient): MessageDedupPort => ({
  wasProcessed: async (queueGroup, messageId) => {
    const existing = await prisma.processedEvent.findUnique({
      where: { queueGroup_messageId: { queueGroup, messageId } },
      select: { id: true },
    });
    return existing !== null;
  },

  markProcessed: async (queueGroup, messageId) => {
    try {
      await prisma.processedEvent.create({ data: { queueGroup, messageId } });
    } catch (error: unknown) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  },
});
