import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { StateMileageService } from './stateMileageService';

interface StateMileageSubscriberDeps {
  eventBus: EventBus;
  stateMileageService: StateMileageService;
  logger: Logger;
}

export const initializeStateMileageSubscriber = async (
  deps: StateMileageSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe(
    'load.stops.changed',
    'ifta.state-mileage',
    async (data) => {
      try {
        await deps.stateMileageService.calculateAndStore(data.loadId, data.organizationId);
      } catch (error: unknown) {
        deps.logger.warn('State mileage calculation failed', {
          loadId: data.loadId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  deps.logger.info('State mileage subscriber initialized');
};
