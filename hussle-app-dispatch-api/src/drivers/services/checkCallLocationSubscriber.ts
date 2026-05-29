import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { CheckCallLocationRepoPort } from '../repositories/checkCallLocationRepositoryPrisma';

const QUEUE_GROUP = 'drivers-service';

export interface CheckCallLocationSubscriberDeps {
  eventBus: EventBus;
  repo: CheckCallLocationRepoPort;
  logger: Logger;
}

export const initializeCheckCallLocationSubscriber = async (
  deps: CheckCallLocationSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('load.checkcall.logged', QUEUE_GROUP, async (data) => {
    try {
      if (data.latitude === null || data.longitude === null) {
        return;
      }

      const snapshot = await deps.repo.findDriverByLoadId(data.loadId);
      if (snapshot === null) {
        return;
      }

      const occurredAt = new Date(data.occurredAt);
      if (snapshot.lastLocationAt !== null && occurredAt <= snapshot.lastLocationAt) {
        return;
      }

      await deps.repo.updateDriverLocation(snapshot.driverId, {
        latitude: data.latitude,
        longitude: data.longitude,
        lastLocationAt: occurredAt,
      });

      deps.logger.info('Driver location updated from check call', {
        loadId: data.loadId,
        driverId: snapshot.driverId,
        checkCallId: data.checkCallId,
      });
    } catch (error: unknown) {
      deps.logger.error('Failed to process check call for driver location', {
        loadId: data.loadId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  deps.logger.info('Driver check-call location subscriber initialized');
};
