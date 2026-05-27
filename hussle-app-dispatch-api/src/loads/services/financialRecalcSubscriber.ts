import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { LoadStatusRepoPort } from '../types/loadStatusTypes';
import type { LoadWithRelations, VehicleCpmQueryPort, DispatcherProfileQueryPort } from '../types/loadTypes';
import { calculateAndPersistFinancials } from './calculateFinancials';

interface FinancialRecalcSubscriberDeps {
  eventBus: EventBus;
  loadFinder: {
    findByIdUnscoped(id: string): Promise<LoadWithRelations | null>;
  };
  loadStatusRepo: Pick<LoadStatusRepoPort, 'sumAccessorialCharges' | 'updateFinancials'>;
  vehicleCpmQuery: VehicleCpmQueryPort;
  dispatcherProfileQuery: DispatcherProfileQueryPort;
  logger: Logger;
}

const recalculateLoadFinancials = async (
  loadId: string,
  deps: Omit<FinancialRecalcSubscriberDeps, 'eventBus'>,
): Promise<void> => {
  const load = await deps.loadFinder.findByIdUnscoped(loadId);

  if (!load) {
    deps.logger.warn('Load not found for financial recalculation', { loadId });
    return;
  }

  await calculateAndPersistFinancials(loadId, {
    load,
    loadStatusRepo: deps.loadStatusRepo,
    logger: deps.logger,
    vehicleCpmQuery: deps.vehicleCpmQuery,
    dispatcherProfileQuery: deps.dispatcherProfileQuery,
    organizationId: load.organizationId,
  });
};

/**
 * Subscribes to accessorial.created, accessorial.updated, and accessorial.deleted
 * events to keep load financials up to date whenever accessorial charges change.
 */
export const initializeFinancialRecalcSubscriber = async (
  deps: FinancialRecalcSubscriberDeps,
): Promise<void> => {
  const handlerDeps = {
    loadFinder: deps.loadFinder,
    loadStatusRepo: deps.loadStatusRepo,
    vehicleCpmQuery: deps.vehicleCpmQuery,
    dispatcherProfileQuery: deps.dispatcherProfileQuery,
    logger: deps.logger,
  };

  await deps.eventBus.subscribe('accessorial.created', 'loads-financial-recalc', async (data) => {
    try {
      await recalculateLoadFinancials(data.loadId, handlerDeps);
    } catch (error: unknown) {
      deps.logger.error('Failed to recalculate financials on accessorial.created', {
        loadId: data.loadId,
        accessorialId: data.accessorialId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await deps.eventBus.subscribe('accessorial.updated', 'loads-financial-recalc', async (data) => {
    try {
      await recalculateLoadFinancials(data.loadId, handlerDeps);
    } catch (error: unknown) {
      deps.logger.error('Failed to recalculate financials on accessorial.updated', {
        loadId: data.loadId,
        accessorialId: data.accessorialId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await deps.eventBus.subscribe('accessorial.deleted', 'loads-financial-recalc', async (data) => {
    try {
      await recalculateLoadFinancials(data.loadId, handlerDeps);
    } catch (error: unknown) {
      deps.logger.error('Failed to recalculate financials on accessorial.deleted', {
        loadId: data.loadId,
        accessorialId: data.accessorialId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  deps.logger.info('Financial recalculation subscriber initialized');
};
