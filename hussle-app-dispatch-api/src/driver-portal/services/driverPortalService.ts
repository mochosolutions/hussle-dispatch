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
import { ForbiddenError, NotFoundError, ValidationError } from '@/shared/errors';

export interface DriverPortalService {
  getLoadSummary(loadId: string, requestingDriverId: string): Promise<DriverPortalLoadSummary>;
  listDriverLoads(
    requestingDriverId: string,
    organizationId: string,
  ): Promise<DriverPortalLoadSummary[]>;
  advanceStatus(
    loadId: string,
    targetStatus: LoadStatus,
    requestingDriverId: string,
  ): Promise<{ success: boolean; status: string }>;
  checkIn(
    loadId: string,
    input: CreateDriverCheckCallInput,
    requestingDriverId: string,
  ): Promise<DriverCheckCallRecord>;
}

/**
 * Authorizes that the requesting driver session owns the load. Throws
 * ForbiddenError when the load's assigned driver differs from the session.
 */
const assertDriverOwnsLoad = (
  loadDriverId: string | null,
  requestingDriverId: string,
): void => {
  if (loadDriverId === null || loadDriverId !== requestingDriverId) {
    throw new ForbiddenError('You are not assigned to this load.');
  }
};

interface DriverPortalServiceDeps {
  loadQuery: DriverPortalLoadQueryPort;
  checkCallRepo: DriverPortalCheckCallRepoPort;
  loadStatusService: LoadStatusService;
  eventBus: EventBus;
  logger: Logger;
}

export const createDriverPortalService = (deps: DriverPortalServiceDeps): DriverPortalService => ({
  getLoadSummary: async (loadId, requestingDriverId) => {
    const load = await deps.loadQuery.findLoadForDriverPortal(loadId);

    if (load === null) {
      throw new NotFoundError('Load not found.');
    }

    assertDriverOwnsLoad(load.driverId, requestingDriverId);

    return load;
  },

  // The query is already scoped to the session's own driverId (and org), so no
  // per-load ownership assertion is needed — every row already belongs to them.
  listDriverLoads: async (requestingDriverId, organizationId) =>
    deps.loadQuery.findLoadsByDriver(requestingDriverId, organizationId),

  advanceStatus: async (loadId, targetStatus, requestingDriverId) => {
    const load = await deps.loadQuery.findLoadForDriverPortal(loadId);

    if (load === null) {
      throw new NotFoundError('Load not found.');
    }

    assertDriverOwnsLoad(load.driverId, requestingDriverId);

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

  checkIn: async (loadId, input, requestingDriverId) => {
    const load = await deps.loadQuery.findLoadForDriverPortal(loadId);

    if (load === null) {
      throw new NotFoundError('Load not found.');
    }

    assertDriverOwnsLoad(load.driverId, requestingDriverId);

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
        contactCcEmails: [],
        location: input.location ?? null,
        status: input.status ?? null,
        eta: input.eta?.toISOString() ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        occurredAt: checkCall.createdAt.toISOString(),
        driverId: load.driverId,
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
