import { CarrierStatus } from '@prisma/client';
import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { CreateCarrierInput } from '../types/carrierTypes';
import type { CarrierAuditPort } from '../types/carrierAuditPort';

interface CreatedCarrier {
  id: string;
}

interface CarrierCreatePort {
  create(organizationId: string, input: CreateCarrierInput): Promise<CreatedCarrier>;
}

interface CarrierSubscriberDeps {
  eventBus: EventBus;
  carrierRepo: CarrierCreatePort;
  logger: Logger;
  auditLog: CarrierAuditPort;
}

const isErrorWithMessage = (error: unknown): error is { message: string } =>
  typeof error === 'object' && error !== null && 'message' in error;

const ORG_ROLES_WITH_COMPANY_ASSET: readonly string[] = ['CARRIER', 'DISPATCH_COMPANY'];

/**
 * Subscribes to 'organization.created' events on the EventBus
 * to auto-create a carrier record for CARRIER and DISPATCH_COMPANY organizations.
 */
export const initializeCarrierSubscriber = async (
  deps: CarrierSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('organization.created', 'carriers-service', async (data) => {
    if (!ORG_ROLES_WITH_COMPANY_ASSET.includes(data.orgRole)) {
      return;
    }

    const mcNumber = typeof data.customMetadata.mcNumber === 'string'
      ? data.customMetadata.mcNumber
      : undefined;
    const dotNumber = typeof data.customMetadata.dotNumber === 'string'
      ? data.customMetadata.dotNumber
      : undefined;

    try {
      // COMPANY_ASSET represents the org's own fleet, not a third party.
      // It bypasses the invite/onboarding workflow and lands directly in ACTIVE
      // because there's no separate party to vet — the doc-check job still
      // governs ACTIVE ↔ ACTION_REQUIRED based on insurance validity.
      const carrier = await deps.carrierRepo.create(data.orgId, {
        name: data.orgName,
        type: 'COMPANY_ASSET',
        carrierOrgId: data.orgId,
        mcNumber,
        dotNumber,
        status: CarrierStatus.ACTIVE,
      });

      await deps.auditLog
        .create(data.orgId, {
          userId: null,
          action: 'CARRIER_CREATED',
          entityType: 'CARRIER',
          entityId: carrier.id,
          changes: { status: { old: null, new: CarrierStatus.ACTIVE } },
          metadata: { source: 'organization.created', carrierType: 'COMPANY_ASSET' },
        })
        .catch(() => undefined);

      deps.logger.info('Auto-created COMPANY_ASSET carrier for org', { orgId: data.orgId });
    } catch (error: unknown) {
      const message = isErrorWithMessage(error) ? error.message : 'Unknown error';
      deps.logger.error('Failed to auto-create carrier for org', {
        orgId: data.orgId,
        error: message,
      });
    }
  });

  deps.logger.info('Carrier subscriber initialized');
};
