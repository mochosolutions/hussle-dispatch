import type { PrismaClient } from '@prisma/client';
import type { StateMilesRepoPort } from '../types/iftaTypes';

export const stateMilesRepositoryPrisma = (
  prisma: PrismaClient,
): StateMilesRepoPort => ({
  upsertMany: async (loadId, entries) => {
    await prisma.$transaction(
      entries.map((entry) =>
        prisma.loadStateMiles.upsert({
          where: {
            loadId_state: { loadId, state: entry.state },
          },
          update: {
            miles: entry.miles,
            source: entry.source,
          },
          create: {
            loadId,
            state: entry.state,
            miles: entry.miles,
            source: entry.source,
          },
        }),
      ),
    );
  },

  deleteByLoadIdAndSource: async (loadId, source) => {
    await prisma.loadStateMiles.deleteMany({
      where: { loadId, source },
    });
  },

  findByLoadId: async (loadId) =>
    prisma.loadStateMiles.findMany({
      where: { loadId },
      orderBy: { state: 'asc' },
    }),
});
