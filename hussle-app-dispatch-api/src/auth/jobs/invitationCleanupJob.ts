import { InvitationStatus, type PrismaClient } from '@prisma/client';
import type { ScheduledTask } from 'node-cron';
import { schedule } from 'node-cron';

import type { Logger } from '@/shared/utils/logger';

// Terminal invitations are kept for a window (audit trail) then pruned to
// bound table growth.
const RETENTION_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface InvitationCleanupDeps {
  prisma: PrismaClient;
  logger: Logger;
}

/**
 * Periodic maintenance of the `Invitation` table:
 *  1. Expire past-due PENDING invites (frees seats — the seat gate counts
 *     non-expired PENDING rows).
 *  2. Purge terminal (EXPIRED / REVOKED) invites older than the retention window.
 */
export const createInvitationCleanupJob = (deps: InvitationCleanupDeps) => {
  let task: ScheduledTask | null = null;

  const sweep = async (): Promise<void> => {
    const now = new Date();

    const { count: expired } = await deps.prisma.invitation.updateMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { lt: now },
      },
      data: { status: InvitationStatus.EXPIRED },
    });

    const purgeCutoff = new Date(now.getTime() - RETENTION_DAYS * MS_PER_DAY);
    const { count: purged } = await deps.prisma.invitation.deleteMany({
      where: {
        status: { in: [InvitationStatus.EXPIRED, InvitationStatus.REVOKED] },
        updatedAt: { lt: purgeCutoff },
      },
    });

    deps.logger.info('Invitation cleanup complete', {
      expired,
      purged,
      purgeCutoff: purgeCutoff.toISOString(),
    });
  };

  return {
    start: (): void => {
      // Daily at 03:15
      task = schedule('15 3 * * *', () => {
        sweep().catch((error: unknown) => {
          deps.logger.error('Invitation cleanup failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      });
      deps.logger.info('Invitation cleanup scheduled (daily 03:15)');
    },

    stop: (): void => {
      if (task) {
        task.stop();
        task = null;
      }
    },

    runNow: sweep,
  };
};
