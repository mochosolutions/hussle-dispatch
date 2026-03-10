import {
  NotFoundError,
  ProhibitedCommodityError,
  ValidationError,
} from '@/shared/errors';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import { generateSequenceNumber } from '@/shared/sequenceGenerator';
import type {
  LoadRepoPort,
  LoadWithRelations,
  OrgSettingsQueryPort,
} from '../types/loadTypes';
import type {
  CreateCheckCallServiceInput,
  CreateLoadServiceInput,
  DeleteLoadServiceInput,
  GetLoadByIdServiceInput,
  ListCheckCallsServiceInput,
  ListLoadDocumentsServiceInput,
  ListLoadsServiceInput,
  ListStatusHistoryServiceInput,
  LoadService,
  UpdateLoadServiceInput,
} from '../types/loadServiceTypes';

const listSortableFields = [
  'createdAt',
  'updatedAt',
  'loadNumber',
  'status',
  'customerRate',
  'carrierRate',
] as const;

/**
 * Statuses at or beyond DISPATCHED — once dispatched, financial fields are locked.
 */
const DISPATCHED_AND_BEYOND = new Set([
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
  'INVOICE_PENDING',
  'INVOICED',
  'PAID',
]);

const FINANCIAL_FIELDS = [
  'customerRate',
  'carrierRate',
  'dispatchFee',
  'partnerSplit',
  'ratePerMile',
] as const;

const getSafeSortField = (field: string): (typeof listSortableFields)[number] => {
  const matched = listSortableFields.find((allowedField) => allowedField === field);
  if (matched !== undefined) {
    return matched;
  }
  return 'createdAt';
};

const validateStops = (stops: { type: string }[]): void => {
  const hasPickup = stops.some((stop) => stop.type === 'PICKUP');
  const hasDelivery = stops.some((stop) => stop.type === 'DELIVERY');

  if (!hasPickup) {
    throw new ValidationError('At least one PICKUP stop is required');
  }

  if (!hasDelivery) {
    throw new ValidationError('At least one DELIVERY stop is required');
  }
};

const checkProhibitedCommodity = async (
  commodity: string | undefined,
  organizationId: string,
  orgSettingsQuery: OrgSettingsQueryPort,
): Promise<void> => {
  if (commodity === undefined || commodity.length === 0) {
    return;
  }

  const prohibited = await orgSettingsQuery.getProhibitedCommodities(organizationId);
  const lowerCommodity = commodity.toLowerCase().trim();

  const match = prohibited.find(
    (item) => lowerCommodity.includes(item.toLowerCase()),
  );

  if (match !== undefined) {
    throw new ProhibitedCommodityError(commodity);
  }
};

const assertFinancialsNotChanged = (
  currentStatus: string,
  input: Record<string, unknown>,
): void => {
  if (!DISPATCHED_AND_BEYOND.has(currentStatus)) {
    return;
  }

  const changedFinancials = FINANCIAL_FIELDS.filter(
    (field) => input[field] !== undefined,
  );

  if (changedFinancials.length > 0) {
    throw new ValidationError(
      `Cannot modify financial fields after dispatch. Locked fields: ${changedFinancials.join(', ')}`,
    );
  }
};

interface LoadServiceDeps {
  loadRepository: LoadRepoPort;
  orgSettingsQuery: OrgSettingsQueryPort;
}

const findLoadOrThrow = async (
  id: string,
  organizationId: string,
  deps: LoadServiceDeps,
): Promise<LoadWithRelations> => {
  const load = await deps.loadRepository.findById(id, organizationId);
  if (load === null) {
    throw new NotFoundError('Load not found.');
  }
  return load;
};

export const createLoadService = (deps: LoadServiceDeps): LoadService => ({
  createLoad: async ({ organizationId, input }: CreateLoadServiceInput) => {
    validateStops(input.stops);

    await checkProhibitedCommodity(
      input.commodity,
      organizationId,
      deps.orgSettingsQuery,
    );

    const loadNumber = await generateSequenceNumber('LOAD', organizationId);

    return deps.loadRepository.create(organizationId, loadNumber, input);
  },

  listLoads: async ({ query, organizationId, filters }: ListLoadsServiceInput) => {
    const params = parsePaginationParams(query);
    const sort = getSafeSortField(params.sort);

    return paginateQuery(
      { ...params, sort },
      {
        findMany: ({ skip, take, orderBy }) =>
          deps.loadRepository.list({
            organizationId,
            filters,
            skip,
            take,
            orderBy,
          }),
        count: () =>
          deps.loadRepository.count({
            organizationId,
            filters,
          }),
      },
    );
  },

  getLoadById: async ({ id, organizationId }: GetLoadByIdServiceInput) => {
    return findLoadOrThrow(id, organizationId, deps);
  },

  updateLoad: async ({ id, organizationId, input }: UpdateLoadServiceInput) => {
    const existing = await findLoadOrThrow(id, organizationId, deps);

    assertFinancialsNotChanged(existing.status, input as Record<string, unknown>);

    if (input.commodity !== undefined) {
      await checkProhibitedCommodity(
        input.commodity,
        organizationId,
        deps.orgSettingsQuery,
      );
    }

    if (input.stops !== undefined) {
      validateStops(input.stops);
    }

    return deps.loadRepository.update(id, input);
  },

  deleteLoad: async ({ id, organizationId }: DeleteLoadServiceInput) => {
    await findLoadOrThrow(id, organizationId, deps);
    await deps.loadRepository.softDelete(id, new Date());
  },

  createCheckCall: async ({ loadId, organizationId, userId, input }: CreateCheckCallServiceInput) => {
    await findLoadOrThrow(loadId, organizationId, deps);
    return deps.loadRepository.createCheckCall(loadId, userId, input);
  },

  listCheckCalls: async ({ loadId, organizationId }: ListCheckCallsServiceInput) => {
    await findLoadOrThrow(loadId, organizationId, deps);
    return deps.loadRepository.listCheckCalls(loadId);
  },

  listStatusHistory: async ({ loadId, organizationId }: ListStatusHistoryServiceInput) => {
    await findLoadOrThrow(loadId, organizationId, deps);
    return deps.loadRepository.listStatusHistory(loadId);
  },

  listLoadDocuments: async ({ loadId, organizationId }: ListLoadDocumentsServiceInput) => {
    await findLoadOrThrow(loadId, organizationId, deps);
    return deps.loadRepository.listDocuments(loadId, organizationId);
  },
});
