import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import { createPrismaMessageDedup } from '../prismaMessageDedup';

describe('prismaMessageDedup', () => {
  const findUnique = jest.fn();
  const create = jest.fn();
  const prisma = { processedEvent: { findUnique, create } } as unknown as PrismaClient;
  const dedup = createPrismaMessageDedup(prisma);

  beforeEach(() => jest.clearAllMocks());

  describe('wasProcessed', () => {
    it('returns true when a row exists for the key', async () => {
      findUnique.mockResolvedValue({ id: 'pe-1' });

      const result = await dedup.wasProcessed('grp', 'msg-1');

      expect(result).toBe(true);
      expect(findUnique).toHaveBeenCalledWith({
        where: { queueGroup_messageId: { queueGroup: 'grp', messageId: 'msg-1' } },
        select: { id: true },
      });
    });

    it('returns false when no row exists', async () => {
      findUnique.mockResolvedValue(null);

      expect(await dedup.wasProcessed('grp', 'msg-1')).toBe(false);
    });
  });

  describe('markProcessed', () => {
    it('inserts a row for the key', async () => {
      create.mockResolvedValue({ id: 'pe-1' });

      await dedup.markProcessed('grp', 'msg-1');

      expect(create).toHaveBeenCalledWith({ data: { queueGroup: 'grp', messageId: 'msg-1' } });
    });

    it('treats a unique-constraint conflict as already processed', async () => {
      const conflict = new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      });
      create.mockRejectedValue(conflict);

      await expect(dedup.markProcessed('grp', 'msg-1')).resolves.toBeUndefined();
    });

    it('rethrows non-conflict errors', async () => {
      create.mockRejectedValue(new Error('connection lost'));

      await expect(dedup.markProcessed('grp', 'msg-1')).rejects.toThrow('connection lost');
    });
  });
});
