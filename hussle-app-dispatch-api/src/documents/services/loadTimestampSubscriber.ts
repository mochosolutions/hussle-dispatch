import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { LoadTimestampPort } from '../types/loadTimestampPort';

interface LoadTimestampSubscriberDeps {
  eventBus: EventBus;
  loadTimestampPort: LoadTimestampPort;
  logger: Logger;
}

type TimestampField = 'rateConReceivedAt' | 'bolUnsignedAt' | 'bolSignedAt';

const FIELD_BY_DOCUMENT_TYPE: Record<string, TimestampField> = {
  BROKER_RATE_CON: 'rateConReceivedAt',
  BOL_UNSIGNED: 'bolUnsignedAt',
  BOL_SIGNED: 'bolSignedAt',
};

/**
 * Subscribes to 'document.confirmed' events and projects the confirmed document
 * type onto the load's timestamp columns (rate con, BOL unsigned, BOL signed).
 *
 * Idempotency: the write is a monotonic set-if-null (`setTimestampIfNull`), so a
 * redelivered event leaves the timestamp set once and a still-null field is
 * reconcilable by a later event. Errors are swallowed (logged, not rethrown) —
 * this is a best-effort projection: the durable source of truth is the confirmed
 * Document itself (read-time derivation drives gates/invoices), so we
 * deliberately do NOT engage the retry path here.
 */
export const createLoadTimestampSubscriber = async (
  deps: LoadTimestampSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('document.confirmed', 'load-timestamp-service', async (data) => {
    if (data.entityType !== 'load') {
      return;
    }

    const field = FIELD_BY_DOCUMENT_TYPE[data.documentType];
    if (field === undefined) {
      return;
    }

    try {
      await deps.loadTimestampPort.setTimestampIfNull(data.entityId, field, new Date());
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
