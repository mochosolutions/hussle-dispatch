import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { CreateCarrierInput } from '../types/carrierTypes';

interface CarrierCreatePort {
  create(organizationId: string, input: CreateCarrierInput): Promise<unknown>;
}

interface CarrierSubscriberDeps {
  eventBus: EventBus;
  carrierRepo: CarrierCreatePort;
  logger: Logger;
}

const isErrorWithMessage = (error: unknown): error is { message: string } =>
  typeof error === 'object' && error !== null && 'message' in error;

const ORG_ROLES_WITH_COMPANY_ASSET: ReadonlyArray<string> = ['CARRIER', 'DISPATCH_COMPANY'];

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
      await deps.carrierRepo.create(data.orgId, {
        name: data.orgName,
        type: 'COMPANY_ASSET',
        carrierOrgId: data.orgId,
        mcNumber,
        dotNumber,
        status: 'ACTIVE',
      });

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
