import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { GenerateSettlementInput, SettlementWithRelations } from '../types/settlementTypes';
import { ConflictError } from '../../shared/errors/commonErrors';

interface SettlementGeneratorSubscriberDeps {
  eventBus: EventBus;
  generateSettlement: (input: GenerateSettlementInput) => Promise<SettlementWithRelations>;
  logger: Logger;
}

export const initializeSettlementGeneratorSubscriber = async (
  deps: SettlementGeneratorSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe(
    'settlement.generate',
    'settlement-generator',
    async (data) => {
      try {
        const input: GenerateSettlementInput = {
          organizationId: data.organizationId,
          carrierId: data.carrierId,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          periodStart: new Date(data.periodStart),
          periodEnd: new Date(data.periodEnd),
        };

        const settlement = await deps.generateSettlement(input);
        deps.logger.info('Auto-draft settlement generated', {
          settlementId: settlement.id,
          settlementNumber: settlement.settlementNumber,
          carrierId: data.carrierId,
        });
      } catch (error: unknown) {
        if (error instanceof ConflictError) {
          deps.logger.info('Settlement already exists for period, skipping', {
            carrierId: data.carrierId,
            organizationId: data.organizationId,
          });
        } else {
          deps.logger.error('Failed to generate settlement', {
            carrierId: data.carrierId,
            organizationId: data.organizationId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    },
  );

  deps.logger.info('Settlement generator subscriber initialized');
};
