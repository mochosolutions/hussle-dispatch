import { CARRIER_TYPES } from '@/shared/constants/carrierTypes';
import { LOAD_STATUSES } from '@/shared/constants/loadStatuses';
import {
  ActiveLoadsConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors';
import { checkCarrierOnboarding } from '@/shared/onboardingGate';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import type {
  CarrierRepositoryPort,
  CarrierWithCounts,
  LoadRepositoryPort,
} from '../types/carrierTypes';
import type {
  CarrierService,
  CreateCarrierServiceInput,
  CreateCarrierWithAssetsServiceInput,
  DeleteCarrierServiceInput,
  GetCarrierByIdServiceInput,
  GetCarrierOnboardingServiceInput,
  ListCarriersServiceInput,
  UpdateCarrierServiceInput,
} from '../types/carrierServiceTypes';

const OWNER_OPERATOR_ROLE = 'owner_operator';

const listSortableFields = ['createdAt', 'updatedAt', 'name', 'insuranceExpiry'] as const;

const blockedDeleteStatuses = LOAD_STATUSES.filter((status) => status !== 'PAID');

const assertOwnerOperatorIsBlocked = (role: string): void => {
  if (role === OWNER_OPERATOR_ROLE) {
    throw new ForbiddenError('Owner-operator access to fleet management is not supported.');
  }
};

const assertCarrierTypeSupported = (type: string): void => {
  if (type === CARRIER_TYPES.OWNER_OPERATOR) {
    throw new ValidationError('Owner-operator support coming soon');
  }
};

const getSafeSortField = (field: string): (typeof listSortableFields)[number] => {
  const matched = listSortableFields.find((allowedField) => allowedField === field);
  if (matched !== undefined) {
    return matched;
  }
  return 'createdAt';
};

interface CarrierServiceDeps {
  carrierRepository: CarrierRepositoryPort;
  loadRepository: LoadRepositoryPort;
}

const findCarrierOrThrow = async (
  id: string,
  organizationId: string,
  deps: CarrierServiceDeps,
): Promise<CarrierWithCounts> => {
  const carrier = await deps.carrierRepository.findById(id, organizationId);
  if (carrier === null) {
    throw new NotFoundError('Carrier not found.');
  }
  return carrier;
};

export const createCarrierService = (deps: CarrierServiceDeps): CarrierService => ({
  createCarrier: async ({ organizationId, role, input }: CreateCarrierServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    assertCarrierTypeSupported(input.type);

    return deps.carrierRepository.create(organizationId, input);
  },

  createCarrierWithAssets: async ({
    organizationId,
    role,
    input,
  }: CreateCarrierWithAssetsServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    assertCarrierTypeSupported(input.type);

    return deps.carrierRepository.createWithAssets(organizationId, {
      carrier: input,
      drivers: input.drivers,
      vehicles: input.vehicles,
    });
  },

  listCarriers: async ({ query, organizationId, filters, role }: ListCarriersServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    const params = parsePaginationParams(query);
    const sort = getSafeSortField(params.sort);

    return paginateQuery(
      { ...params, sort },
      {
        findMany: ({ skip, take, orderBy }) =>
          deps.carrierRepository.list({
            organizationId,
            filters,
            skip,
            take,
            orderBy,
          }),
        count: () =>
          deps.carrierRepository.count({
            organizationId,
            filters,
          }),
      },
    );
  },

  getCarrierById: async ({ id, organizationId, role }: GetCarrierByIdServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    return findCarrierOrThrow(id, organizationId, deps);
  },

  updateCarrier: async ({ id, organizationId, input, role }: UpdateCarrierServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    if (input.type !== undefined) {
      assertCarrierTypeSupported(input.type);
    }

    await findCarrierOrThrow(id, organizationId, deps);
    return deps.carrierRepository.update(id, input);
  },

  deleteCarrier: async ({ id, organizationId, role }: DeleteCarrierServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    await findCarrierOrThrow(id, organizationId, deps);

    const blockingLoadIds = await deps.loadRepository.findBlockingLoadIds(
      id,
      blockedDeleteStatuses,
      10,
    );

    if (blockingLoadIds.length > 0) {
      throw new ActiveLoadsConflictError(
        'Carrier has active loads and cannot be deleted.',
        blockingLoadIds,
      );
    }

    await deps.carrierRepository.softDelete(id, new Date());
  },

  getCarrierOnboardingStatus: async ({
    id,
    organizationId,
    role,
  }: GetCarrierOnboardingServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    const carrier = await findCarrierOrThrow(id, organizationId, deps);

    return checkCarrierOnboarding({
      carrierType: carrier.type,
      dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
      insuranceCertOnFile: carrier.insuranceCertOnFile,
      insuranceExpiry: carrier.insuranceExpiry,
      w9OnFile: carrier.w9OnFile,
    });
  },
});
