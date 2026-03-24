import type { LoadStatus } from '@prisma/client';
import type { Logger } from '@/shared/utils/logger';
import type { EventBus } from '@/shared/messaging/eventBus';
import type {
  DriverPortalLoadQueryPort,
  DriverPortalLoadSummary,
} from '../types/driverPortalTypes';
import type {
  DriverPortalCheckCallRepoPort,
  CreateDriverCheckCallInput,
  DriverCheckCallRecord,
} from '../repositories/driverPortalCheckCallRepositoryPrisma';
import type { LoadStatusService } from '../../loads/services/loadStatusService';
import { NotFoundError, ValidationError } from '@/shared/errors';

export interface DriverPortalService {
  getLoadSummary(loadId: string): Promise<DriverPortalLoadSummary>;
  advanceStatus(
    loadId: string,
    targetStatus: LoadStatus,
  ): Promise<{ success: boolean; status: string }>;
  checkIn(loadId: string, input: CreateDriverCheckCallInput): Promise<DriverCheckCallRecord>;
}

interface DriverPortalServiceDeps {
  loadQuery: DriverPortalLoadQueryPort;
  checkCallRepo: DriverPortalCheckCallRepoPort;
  loadStatusService: LoadStatusService;
  eventBus: EventBus;
  logger: Logger;
}

export const createDriverPortalService = (deps: DriverPortalServiceDeps): DriverPortalService => ({
  getLoadSummary: async (loadId) => {
    const load = await deps.loadQuery.findLoadForDriverPortal(loadId);

    if (load === null) {
      throw new NotFoundError('Load not found.');
    }

    return load;
  },

  advanceStatus: async (loadId, targetStatus) => {
    const load = await deps.loadQuery.findLoadForDriverPortal(loadId);

    if (load === null) {
      throw new NotFoundError('Load not found.');
    }

    const result = await deps.loadStatusService.transitionStatus({
      loadId,
      organizationId: load.organizationId,
      targetStatus,
      userRole: 'DRIVER',
      userId: null,
      overrideWarnings: true,
    });

    if (!result.success) {
      throw new ValidationError('Status transition failed');
    }

    return { success: true, status: targetStatus };
  },

  checkIn: async (loadId, input) => {
    const load = await deps.loadQuery.findLoadForDriverPortal(loadId);

    if (load === null) {
      throw new NotFoundError('Load not found.');
    }

    const checkCall = await deps.checkCallRepo.create(loadId, input);

    deps.eventBus
      .publish('load.checkcall.logged', {
        loadId,
        organizationId: load.organizationId,
        loadNumber: load.loadNumber,
        checkCallId: checkCall.id,
        customerId: null,
        contactEmail: null,
        contactPhone: null,
        location: input.location ?? null,
        status: input.status ?? null,
        eta: input.eta?.toISOString() ?? null,
      })
      .catch((error: unknown) => {
        deps.logger.error('Failed to publish check call event', {
          loadId,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    deps.logger.info('Driver check-in recorded', { loadId, checkCallId: checkCall.id });

    return checkCall;
  },
});
