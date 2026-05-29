import type { PrismaClient } from '@prisma/client';
import type { ScheduledTask } from 'node-cron';
import { schedule } from 'node-cron';

import type { Logger } from '../utils/logger';

// Keep inbox rows comfortably longer than any plausible broker redelivery
// window, then prune to bound table growth.
const RETENTION_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface ProcessedEventCleanupDeps {
  prisma: PrismaClient;
  logger: Logger;
}

/**
 * Periodic pruning of the `ProcessedEvent` idempotency inbox.
 */
export const createProcessedEventCleanup = (deps: ProcessedEventCleanupDeps) => {
  let task: ScheduledTask | null = null;

  const purge = async (): Promise<void> => {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * MS_PER_DAY);
    const { count } = await deps.prisma.processedEvent.deleteMany({
      where: { processedAt: { lt: cutoff } },
    });
    deps.logger.info('Processed-event inbox pruned', {
      deleted: count,
      cutoff: cutoff.toISOString(),
    });
  };

  return {
    start: (): void => {
      // Daily at 03:30
      task = schedule('30 3 * * *', () => {
        purge().catch((error: unknown) => {
          deps.logger.error('Processed-event cleanup failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      });
      deps.logger.info('Processed-event cleanup scheduled (daily 03:30)');
    },

    stop: (): void => {
      if (task) {
        task.stop();
        task = null;
      }
    },

    runNow: purge,
  };
};
