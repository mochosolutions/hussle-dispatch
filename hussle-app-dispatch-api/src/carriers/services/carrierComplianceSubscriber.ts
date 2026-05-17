import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';

interface CarrierCompliancePort {
  updateComplianceFlags(
    carrierId: string,
    organizationId: string,
    flags: Record<string, unknown>,
  ): Promise<void>;
}

interface CarrierComplianceSubscriberDeps {
  eventBus: EventBus;
  carrierCompliance: CarrierCompliancePort;
  logger: Logger;
}

const COMPLIANCE_FLAG_BUILDERS: Record<
  string,
  (input: { expiresAt: string | null }) => Record<string, unknown>
> = {
  DISPATCH_AGREEMENT: () => ({ dispatchAgreementOnFile: true }),
  INSURANCE_CERT: (input) => ({
    insuranceCertOnFile: true,
    ...(input.expiresAt !== null ? { insuranceExpiry: new Date(input.expiresAt) } : {}),
  }),
  W9: () => ({}),
};

/**
 * Subscribes to 'document.confirmed' events. When the confirmed document is
 * a carrier compliance document (insurance, W-9, dispatch agreement, packet),
 * sets the corresponding boolean flag on the Carrier row, and copies the
 * document's expiry to carrier.insuranceExpiry for insurance certificates.
 *
 * This makes the dispatch gate's expiry check meaningful regardless of which
 * confirm path was used (portal or generic dispatcher upload).
 */
export const initializeCarrierComplianceSubscriber = async (
  deps: CarrierComplianceSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe(
    'document.confirmed',
    'carrier-compliance-service',
    async (data) => {
      if (data.entityType !== 'carrier') {
        return;
      }

      const flagBuilder = COMPLIANCE_FLAG_BUILDERS[data.documentType];
      if (flagBuilder === undefined) {
        return;
      }

      try {
        const flags = flagBuilder({ expiresAt: data.expiresAt });
        await deps.carrierCompliance.updateComplianceFlags(
          data.entityId,
          data.organizationId,
          flags,
        );
      } catch (error: unknown) {
        deps.logger.error('Failed to apply carrier compliance flags on document.confirmed', {
          documentId: data.documentId,
          carrierId: data.entityId,
          documentType: data.documentType,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  deps.logger.info('Carrier compliance subscriber initialized');
};
