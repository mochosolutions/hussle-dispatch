import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import type { CarrierAgreementWritePort } from '../types/carrierAgreementWritePort';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';

export interface AgreementSignedSubscriberDeps {
  eventBus: EventBus;
  finalizeAgreement: (input: {
    providerSubmissionId: string;
  }) => Promise<AgreementServiceResult<Agreement>>;
  carrierWritePort: CarrierAgreementWritePort;
  logger: Logger;
}

const QUEUE_GROUP = 'agreements.signed-finalizer';

/**
 * Subscriber for `agreement.signed` events. Calls `finalizeAgreement`
 * (idempotent) and re-publishes any events the service returns
 * (notably `agreement.finalized`).
 *
 * On failure: logs and rethrows so RabbitMQ retries / DLQs the message.
 */
export const initializeAgreementSignedSubscriber = async (
  deps: AgreementSignedSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('agreement.signed', QUEUE_GROUP, async (payload) => {
    try {
      const result = await deps.finalizeAgreement({
        providerSubmissionId: payload.providerSubmissionId,
      });

      // Republish each event returned by finalizeAgreement.
      // The discriminated union narrows event.type → event.payload correctly per arm.
      for (const event of result.events) {
        switch (event.type) {
          case 'agreement.finalized':
            await deps.eventBus.publish('agreement.finalized', event.payload);
            break;
          case 'agreement.generated':
            await deps.eventBus.publish('agreement.generated', event.payload);
            break;
          case 'agreement.voided':
            await deps.eventBus.publish('agreement.voided', event.payload);
            break;
          default: {
            // Exhaustiveness: AgreementEvent is a closed union — adding a new
            // variant must update this switch.
            const exhaust: never = event;
            throw new Error(`Unhandled agreement event variant: ${JSON.stringify(exhaust)}`);
          }
        }
      }

      deps.logger.info('Agreement finalized via subscriber', {
        agreementId: result.data.id,
        providerSubmissionId: payload.providerSubmissionId,
        republishedEvents: result.events.length,
      });

      // Projection: stamp the signed agreement id on the carrier row.
      // Subscriber idempotency: a failure here must not retry the whole
      // finalize pipeline — the agreement is already signed and republished.
      try {
        await deps.carrierWritePort.setSignedAgreementId(
          result.data.carrierId,
          result.data.id,
        );
      } catch (writeError: unknown) {
        deps.logger.warn('Failed to project signedAgreementId onto carrier', {
          agreementId: result.data.id,
          carrierId: result.data.carrierId,
          error: writeError instanceof Error ? writeError.message : String(writeError),
        });
      }
    } catch (error: unknown) {
      deps.logger.error('agreementSignedSubscriber failed', {
        providerSubmissionId: payload.providerSubmissionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  deps.logger.info('Agreement signed subscriber initialized');
};
