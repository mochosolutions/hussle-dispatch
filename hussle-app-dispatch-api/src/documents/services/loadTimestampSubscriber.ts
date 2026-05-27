import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { LoadTimestampPort } from '../types/loadTimestampPort';

interface LoadTimestampSubscriberDeps {
  eventBus: EventBus;
  loadTimestampPort: LoadTimestampPort;
  logger: Logger;
}

/**
 * Subscribes to 'document.confirmed' events and updates load timestamps
 * based on the confirmed document type (rate con, BOL unsigned, BOL signed).
 */
export const createLoadTimestampSubscriber = async (
  deps: LoadTimestampSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('document.confirmed', 'load-timestamp-service', async (data) => {
    if (data.entityType !== 'load') {
      return;
    }

    try {
      switch (data.documentType) {
        case 'BROKER_RATE_CON': {
          await deps.loadTimestampPort.updateTimestamp(
            data.entityId,
            'rateConReceivedAt',
            new Date(),
          );
          break;
        }
        case 'BOL_UNSIGNED': {
          await deps.loadTimestampPort.updateTimestamp(
            data.entityId,
            'bolUnsignedAt',
            new Date(),
          );
          break;
        }
        case 'BOL_SIGNED': {
          await deps.loadTimestampPort.updateTimestamp(
            data.entityId,
            'bolSignedAt',
            new Date(),
          );
          break;
        }
        default:
          break;
      }
    } catch (error: unknown) {
      deps.logger.error('Failed to process document.confirmed for load timestamp', {
        documentId: data.documentId,
        entityId: data.entityId,
        documentType: data.documentType,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  deps.logger.info('Load timestamp subscriber initialized');
};
