import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CreateStopInput,
  ReorderStopsInput,
  StopRepoPort,
  UpdateStopInput,
} from '../types/stopTypes';
import { NotFoundError } from '@/shared/errors';

const isFullClient = (
  client: PrismaClient | PrismaTransaction,
): client is PrismaClient => '$transaction' in client;

const runTransaction = async <T>(
  prisma: PrismaClient | PrismaTransaction,
  fn: (tx: PrismaTransaction) => Promise<T>,
): Promise<T> => {
  if (isFullClient(prisma)) {
    return prisma.$transaction(fn);
  }
  // Already inside a transaction — run directly
  return fn(prisma);
};

export const stopRepositoryPrisma = (prisma: PrismaClient | PrismaTransaction): StopRepoPort => ({
  create: async (input) => {
    const { organizationId: _organizationId, loadId, sequence, ...stopData } = input;

    // Auto-assign sequence if not provided
    let resolvedSequence = sequence;
    if (resolvedSequence === undefined) {
      const count = await prisma.stop.count({ where: { loadId } });
      resolvedSequence = count + 1;
    }

    return prisma.stop.create({
      data: {
        loadId,
        sequence: resolvedSequence,
        ...stopData,
        resolutionStatus: stopData.resolutionStatus ?? 'UNRESOLVED',
      },
    });
  },

  update: async (input) => {
    const { id, organizationId, ...updateData } = input;

    // Verify stop belongs to the org via the load relation
    const existing = await prisma.stop.findFirst({
      where: {
        id,
        load: { organizationId },
      },
    });

    if (existing === null) {
      throw new NotFoundError(`Stop ${id} not found`);
    }

    return prisma.stop.update({
      where: { id },
      data: updateData,
    });
  },

  delete: async (id, organizationId) => {
    // Verify stop belongs to the org via the load relation
    const existing = await prisma.stop.findFirst({
      where: {
        id,
        load: { organizationId },
      },
    });

    if (existing === null) {
      throw new NotFoundError(`Stop ${id} not found`);
    }

    const { loadId } = existing;

    await runTransaction(prisma, async (tx) => {
      await tx.stop.delete({ where: { id } });

      // Re-sequence remaining stops for the load
      const remainingStops = await tx.stop.findMany({
        where: { loadId },
        orderBy: { sequence: 'asc' },
      });

      await Promise.all(
        remainingStops.map((stop, index) =>
          tx.stop.update({
            where: { id: stop.id },
            data: { sequence: index + 1 },
          }),
        ),
      );
    });
  },

  findById: async (id, organizationId) =>
    prisma.stop.findFirst({
      where: {
        id,
        load: { organizationId },
      },
    }),

  findByLoadId: async (loadId, organizationId) => {
    return prisma.stop.findMany({
      where: {
        loadId,
        load: { organizationId },
      },
      orderBy: { sequence: 'asc' },
    });
  },

  reorder: async (input) => {
    const { organizationId, loadId, stopOrder } = input;

    // Verify all stops belong to the given load/org
    const existingStops = await prisma.stop.findMany({
      where: {
        loadId,
        load: { organizationId },
      },
      select: { id: true },
    });

    const existingIds = new Set(existingStops.map((stop) => stop.id));
    const invalidIds = stopOrder.filter((item) => !existingIds.has(item.id));

    if (invalidIds.length > 0) {
      const ids = invalidIds.map((item) => item.id).join(', ');
      throw new NotFoundError(`Stops not found for load ${loadId}: ${ids}`);
    }

    await runTransaction(prisma, async (tx) => {
      await Promise.all(
        stopOrder.map((item) =>
          tx.stop.update({
            where: { id: item.id },
            data: { sequence: item.sequence },
          }),
        ),
      );
    });
  },
});
