import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { LoadIntelRedisPort } from '../types/loadIntelPorts';

interface CpmInvalidationSubscriberDeps {
  eventBus: EventBus;
  redisPort: LoadIntelRedisPort;
  logger: Logger;
}

export const initializeCpmInvalidationSubscriber = async (
  deps: CpmInvalidationSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe(
    'vehicle.expense.changed',
    'cpm-invalidation',
    async (data) => {
      try {
        await deps.redisPort.del(`intel:feed:${data.organizationId}`);
        deps.logger.info('CPM cache invalidated on expense change', {
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
        });
      } catch (error: unknown) {
        deps.logger.error('CPM cache invalidation failed on expense change', {
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  await deps.eventBus.subscribe(
    'vehicle.expense.created',
    'cpm-invalidation',
    async (data) => {
      try {
        await deps.redisPort.del(`intel:feed:${data.organizationId}`);
        deps.logger.info('CPM cache invalidated on expense created', {
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
          expenseId: data.expenseId,
        });
      } catch (error: unknown) {
        deps.logger.error('CPM cache invalidation failed on expense created', {
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
          expenseId: data.expenseId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  await deps.eventBus.subscribe(
    'expense.created',
    'cpm-invalidation',
    async (data) => {
      try {
        await deps.redisPort.del(`intel:feed:${data.organizationId}`);
        deps.logger.info('CPM cache invalidated on expense.created', {
          expenseId: data.expenseId,
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
        });
      } catch (error: unknown) {
        deps.logger.error('CPM cache invalidation failed on expense.created', {
          expenseId: data.expenseId,
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  await deps.eventBus.subscribe(
    'expense.updated',
    'cpm-invalidation',
    async (data) => {
      try {
        await deps.redisPort.del(`intel:feed:${data.organizationId}`);
        deps.logger.info('CPM cache invalidated on expense.updated', {
          expenseId: data.expenseId,
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
        });
      } catch (error: unknown) {
        deps.logger.error('CPM cache invalidation failed on expense.updated', {
          expenseId: data.expenseId,
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  await deps.eventBus.subscribe(
    'expense.deleted',
    'cpm-invalidation',
    async (data) => {
      try {
        await deps.redisPort.del(`intel:feed:${data.organizationId}`);
        deps.logger.info('CPM cache invalidated on expense.deleted', {
          expenseId: data.expenseId,
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
        });
      } catch (error: unknown) {
        deps.logger.error('CPM cache invalidation failed on expense.deleted', {
          expenseId: data.expenseId,
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  await deps.eventBus.subscribe(
    'recurring-expense.generated',
    'cpm-invalidation',
    async (data) => {
      try {
        await deps.redisPort.del(`intel:feed:${data.organizationId}`);
        deps.logger.info('CPM cache invalidated on recurring-expense.generated', {
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
          count: data.count,
        });
      } catch (error: unknown) {
        deps.logger.error('CPM cache invalidation failed on recurring-expense.generated', {
          vehicleId: data.vehicleId,
          organizationId: data.organizationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  deps.logger.info('CPM invalidation subscriber initialized');
};
