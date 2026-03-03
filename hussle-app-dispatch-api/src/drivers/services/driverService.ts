import { LOAD_STATUSES } from '@/shared/constants/loadStatuses';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import type {
  CarrierRepositoryPort,
  DriverRepositoryPort,
  DriverResponse,
  LoadRepositoryPort,
} from '../types/driverTypes';
import type {
  CreateDriverServiceInput,
  DeleteDriverServiceInput,
  DriverService,
  GetDriverByIdServiceInput,
  ListDriversServiceInput,
  UpdateDriverServiceInput,
} from '../types/driverServiceTypes';

const OWNER_OPERATOR_ROLE = 'owner_operator';

const listSortableFields = ['createdAt', 'updatedAt', 'name', 'cdlExpiry', 'currentState'] as const;

const blockingDeleteStatuses = LOAD_STATUSES.filter((status) =>
  [
    'QUOTED',
    'BOOKED',
    'DISPATCHED',
    'EN_ROUTE_PICKUP',
    'AT_PICKUP',
    'IN_TRANSIT',
    'AT_DELIVERY',
  ].includes(status),
);

const assertOwnerOperatorIsBlocked = (role: string): void => {
  if (role === OWNER_OPERATOR_ROLE) {
    throw new ForbiddenError('Owner-operator access to fleet management is not supported.');
  }
};

const getSafeSortField = (field: string): (typeof listSortableFields)[number] => {
  const matched = listSortableFields.find((allowedField) => allowedField === field);
  if (matched !== undefined) {
    return matched;
  }
  return 'createdAt';
};

interface DriverServiceDeps {
  driverRepository: DriverRepositoryPort;
  carrierRepository: CarrierRepositoryPort;
  loadRepository: LoadRepositoryPort;
}

const assertCarrierExists = async (
  carrierId: string,
  organizationId: string,
  deps: DriverServiceDeps,
): Promise<void> => {
  const exists = await deps.carrierRepository.findActiveByIdForOrg(carrierId, organizationId);
  if (!exists) {
    throw new NotFoundError('Carrier not found.');
  }
};

const findDriverOrThrow = async (
  id: string,
  organizationId: string,
  deps: DriverServiceDeps,
): Promise<DriverResponse> => {
  const driver = await deps.driverRepository.findById(id, organizationId);
  if (driver === null) {
    throw new NotFoundError('Driver not found.');
  }
  return driver;
};

export const createDriverService = (deps: DriverServiceDeps): DriverService => ({
  createDriver: async ({ organizationId, role, input }: CreateDriverServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await assertCarrierExists(input.carrierId, organizationId, deps);

    return deps.driverRepository.create(input);
  },

  listDrivers: async ({ query, organizationId, role, filters }: ListDriversServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    const params = parsePaginationParams(query);
    const sort = getSafeSortField(params.sort);

    return paginateQuery(
      { ...params, sort },
      {
        findMany: ({ skip, take, orderBy }) =>
          deps.driverRepository.list({
            organizationId,
            filters,
            skip,
            take,
            orderBy,
          }),
        count: () =>
          deps.driverRepository.count({
            organizationId,
            filters,
          }),
      },
    );
  },

  getDriverById: async ({ id, organizationId, role }: GetDriverByIdServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    return findDriverOrThrow(id, organizationId, deps);
  },

  updateDriver: async ({ id, organizationId, role, input }: UpdateDriverServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    await findDriverOrThrow(id, organizationId, deps);

    if (input.carrierId !== undefined) {
      await assertCarrierExists(input.carrierId, organizationId, deps);
    }

    return deps.driverRepository.update(id, input);
  },

  deleteDriver: async ({ id, organizationId, role }: DeleteDriverServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await findDriverOrThrow(id, organizationId, deps);

    const blockingLoadIds = await deps.loadRepository.findBlockingLoadIdsByDriver(
      id,
      blockingDeleteStatuses,
      10,
    );

    if (blockingLoadIds.length > 0) {
      throw new ConflictError(
        `Driver has active loads and cannot be deleted. Blocking load IDs: ${blockingLoadIds.join(', ')}`,
      );
    }

    await deps.driverRepository.softDelete(id, new Date());
  },
});
