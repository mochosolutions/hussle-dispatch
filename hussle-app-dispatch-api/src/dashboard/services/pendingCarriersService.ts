import type { PendingCarriersPort, PendingCarrier } from '../types/pendingCarriersTypes';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import { buildPaginationMeta } from '@/shared/responseEnvelope';

interface PendingCarriersServiceDeps {
  pendingCarriersPort: PendingCarriersPort;
}

export interface PendingCarriersService {
  listPendingCarriers(
    organizationId: string,
    page: number,
    limit: number,
  ): Promise<{ data: PendingCarrier[]; meta: PaginationMeta }>;
}

export const createPendingCarriersService = (
  deps: PendingCarriersServiceDeps,
): PendingCarriersService => ({
  listPendingCarriers: async (organizationId, page, limit) => {
    const result = await deps.pendingCarriersPort.listPending(organizationId, page, limit);
    const meta = buildPaginationMeta(result.total, page, limit);
    return { data: result.data, meta };
  },
});
