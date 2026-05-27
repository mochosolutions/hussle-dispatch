import type { ScheduledTask } from 'node-cron';
import { schedule } from 'node-cron';
import type { PrismaClient } from '@prisma/client';
import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';

interface SettlementCronDeps {
  prisma: PrismaClient;
  eventBus: EventBus;
  logger: Logger;
}

export const createSettlementCronJob = (deps: SettlementCronDeps) => {
  let task: ScheduledTask | null = null;

  const publishSettlementEvents = async (): Promise<void> => {
    deps.logger.info('Settlement cron job started');

    // Compute Mon-Sun window for the current week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const orgs = await deps.prisma.organization.findMany({ select: { id: true } });

    let eventCount = 0;

    for (const org of orgs) {
      const combos = await deps.prisma.load.groupBy({
        by: ['carrierId', 'driverId', 'vehicleId'],
        where: {
          organizationId: org.id,
          status: 'DELIVERED',
          deletedAt: null,
          stops: {
            some: {
              type: 'DELIVERY',
              OR: [
                { departureTime: { gte: monday, lte: sunday } },
                { appointmentStart: { gte: monday, lte: sunday } },
              ],
            },
          },
        },
      });

      for (const combo of combos) {
        if (!combo.carrierId) {
          continue;
        }

        await deps.eventBus.publish('settlement.generate', {
          organizationId: org.id,
          carrierId: combo.carrierId,
          driverId: combo.driverId ?? undefined,
          vehicleId: combo.vehicleId ?? undefined,
          periodStart: monday.toISOString(),
          periodEnd: sunday.toISOString(),
        });
        eventCount += 1;
      }
    }

    deps.logger.info('Settlement cron job completed', { eventCount });
  };

  return {
    start: (): void => {
      // Sunday 11 PM
      task = schedule('0 23 * * 0', () => {
        publishSettlementEvents().catch((error: unknown) => {
          deps.logger.error('Settlement cron job failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      });
      deps.logger.info('Settlement cron job scheduled (Sunday 11 PM)');
    },

    stop: (): void => {
      if (task) {
        task.stop();
        task = null;
      }
    },

    runNow: publishSettlementEvents,
  };
};
