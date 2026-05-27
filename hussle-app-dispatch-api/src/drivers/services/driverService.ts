import type { Driver } from '@prisma/client';
import type Redis from 'ioredis';
import { BLOCKING_DELETE_STATUSES } from '@/shared/constants/loadStatuses';
import { OWNER_OPERATOR_ROLE } from '@/shared/constants/roles';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors';
import type { CityCoords } from '@/shared/geoLookup';
import type { LoadQueryPort } from '@/shared/loadQueries';
import type { Logger } from '@/shared/utils/logger';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import type {
  CarrierRepositoryPort,
  DriverRepositoryPort,
  LoadRepositoryPort,
} from '../types/driverTypes';
import type {
  CreateDriverServiceInput,
  DeleteDriverServiceInput,
  DriverLocationResult,
  DriverService,
  GetDriverByIdServiceInput,
  GetDriverLoadHistoryServiceInput,
  GetDriverLocationServiceInput,
  ListDriversServiceInput,
  UpdateDriverServiceInput,
} from '../types/driverServiceTypes';

const listSortableFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'licenseExpiry', 'currentState'] as const;

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
  loadQueryPort: LoadQueryPort;
  redis: Redis;
  getCityCoords: (redis: Redis, state: string, city: string) => Promise<CityCoords | null>;
  logger: Logger;
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
): Promise<Driver> => {
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

    const existingDriver = await findDriverOrThrow(id, organizationId, deps);

    if (input.carrierId !== undefined) {
      await assertCarrierExists(input.carrierId, organizationId, deps);
    }

    if (input.currentCity !== undefined || input.currentState !== undefined) {
      const newCity = input.currentCity !== undefined ? input.currentCity : existingDriver.currentCity;
      const newState = input.currentState !== undefined
        ? input.currentState
        : existingDriver.currentState;
      const changed =
        newCity !== existingDriver.currentCity || newState !== existingDriver.currentState;

      if (changed) {
        if (newCity !== null && newState !== null) {
          const coords = await deps.getCityCoords(deps.redis, newState, newCity);

          if (coords !== null) {
            input.currentLatitude = coords.lat;
            input.currentLongitude = coords.lng;
          } else {
            deps.logger.warn('Could not geocode city/state', { city: newCity, state: newState });
          }
        } else {
          input.currentLatitude = null;
          input.currentLongitude = null;
        }
      }
    }

    return deps.driverRepository.update(id, organizationId, input);
  },

  deleteDriver: async ({ id, organizationId, role }: DeleteDriverServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await findDriverOrThrow(id, organizationId, deps);

    const blockingLoadIds = await deps.loadRepository.findBlockingLoadIdsByDriver(
      id,
      BLOCKING_DELETE_STATUSES,
      10,
    );

    if (blockingLoadIds.length > 0) {
      throw new ConflictError(
        `Driver has active loads and cannot be deleted. Blocking load IDs: ${blockingLoadIds.join(', ')}`,
      );
    }

    await deps.driverRepository.softDelete(id, organizationId, new Date());
  },

  getLoadHistory: async ({ id, organizationId, role, query }: GetDriverLoadHistoryServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await findDriverOrThrow(id, organizationId, deps);

    return deps.loadQueryPort.getLoadsByDriverId(id, query);
  },

  getDriverLocation: async ({
    id,
    organizationId,
    role,
  }: GetDriverLocationServiceInput): Promise<DriverLocationResult> => {
    assertOwnerOperatorIsBlocked(role);
    const driver = await findDriverOrThrow(id, organizationId, deps);

    return {
      driverId: driver.id,
      city: driver.currentCity,
      state: driver.currentState,
      latitude: driver.currentLatitude !== null ? String(driver.currentLatitude) : null,
      longitude: driver.currentLongitude !== null ? String(driver.currentLongitude) : null,
      updatedAt: driver.updatedAt,
    };
  },
});
