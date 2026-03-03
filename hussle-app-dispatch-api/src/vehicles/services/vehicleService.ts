import type { PrismaTransaction } from '@/config/database';
import { LOAD_STATUSES } from '@/shared/constants/loadStatuses';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/shared/errors';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import type {
  CarrierRepositoryPort,
  LoadRepositoryPort,
  UpdateVehicleDataInput,
  VehicleExpenseInput,
  VehicleRepositoryPort,
  VehicleResponse,
} from '../types/vehicleTypes';
import type {
  CreateVehicleServiceInput,
  DeleteVehicleServiceInput,
  GetVehicleByIdServiceInput,
  ListVehiclesServiceInput,
  UpdateVehicleServiceInput,
  VehicleService,
} from '../types/vehicleServiceTypes';

const OWNER_OPERATOR_ROLE = 'owner_operator';

const listSortableFields = [
  'createdAt',
  'updatedAt',
  'unitNumber',
  'type',
  'year',
  'make',
  'model',
] as const;

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

interface VehicleServiceDeps {
  vehicleRepository: VehicleRepositoryPort;
  carrierRepository: CarrierRepositoryPort;
  loadRepository: LoadRepositoryPort;
  transactionManager: {
    runInTransaction: <T>(operation: (tx: PrismaTransaction) => Promise<T>) => Promise<T>;
  };
  vehicleRepositoryFactory: (tx: PrismaTransaction) => VehicleRepositoryPort;
}

const assertCarrierExists = async (
  carrierId: string,
  organizationId: string,
  deps: VehicleServiceDeps,
): Promise<void> => {
  const exists = await deps.carrierRepository.findActiveByIdForOrg(carrierId, organizationId);
  if (!exists) {
    throw new NotFoundError('Carrier not found.');
  }
};

const findVehicleOrThrow = async (
  id: string,
  organizationId: string,
  deps: VehicleServiceDeps,
): Promise<VehicleResponse> => {
  const vehicle = await deps.vehicleRepository.findById(id, organizationId);
  if (vehicle === null) {
    throw new NotFoundError('Vehicle not found.');
  }

  return vehicle;
};

const assertUniqueExpenseKeys = (expenses: VehicleExpenseInput[]): void => {
  const uniqueExpenseKeys = new Set(expenses.map((expense) => expense.expenseKey));

  if (uniqueExpenseKeys.size !== expenses.length) {
    throw new ValidationError('Duplicate expenseKey values are not allowed in expenses.');
  }
};

const toUpdateVehicleData = (
  input: UpdateVehicleServiceInput['input'],
): UpdateVehicleDataInput => ({
  carrierId: input.carrierId,
  unitNumber: input.unitNumber,
  type: input.type,
  ownership: input.ownership,
  year: input.year,
  make: input.make,
  model: input.model,
  vin: input.vin,
  licensePlate: input.licensePlate,
  licensePlateState: input.licensePlateState,
  emergencyContactName: input.emergencyContactName,
  emergencyContactPhone: input.emergencyContactPhone,
  warrantyInfo: input.warrantyInfo,
  monthlyGrossTarget: input.monthlyGrossTarget,
  monthlyMilesTarget: input.monthlyMilesTarget,
  workingDaysPerMonth: input.workingDaysPerMonth,
  isActive: input.isActive,
  notes: input.notes,
});

export const createVehicleService = (deps: VehicleServiceDeps): VehicleService => ({
  createVehicle: async ({ organizationId, role, input }: CreateVehicleServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await assertCarrierExists(input.carrierId, organizationId, deps);

    return deps.vehicleRepository.create(input);
  },

  listVehicles: async ({ query, organizationId, role, filters }: ListVehiclesServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    const params = parsePaginationParams(query);
    const sort = getSafeSortField(params.sort);

    return paginateQuery(
      { ...params, sort },
      {
        findMany: ({ skip, take, orderBy }) =>
          deps.vehicleRepository.list({
            organizationId,
            filters,
            skip,
            take,
            orderBy,
          }),
        count: () =>
          deps.vehicleRepository.count({
            organizationId,
            filters,
          }),
      },
    );
  },

  getVehicleById: async ({ id, organizationId, role }: GetVehicleByIdServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    return findVehicleOrThrow(id, organizationId, deps);
  },

  updateVehicle: async ({ id, organizationId, role, input }: UpdateVehicleServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    await findVehicleOrThrow(id, organizationId, deps);

    if (input.carrierId !== undefined) {
      await assertCarrierExists(input.carrierId, organizationId, deps);
    }

    const updateData = toUpdateVehicleData(input);

    if (input.expenses === undefined) {
      return deps.vehicleRepository.update(id, updateData);
    }

    const expensesToReplace = input.expenses;

    assertUniqueExpenseKeys(expensesToReplace);

    return deps.transactionManager.runInTransaction(async (tx) => {
      const txVehicleRepository = deps.vehicleRepositoryFactory(tx);
      await txVehicleRepository.update(id, updateData);
      await txVehicleRepository.replaceExpenses(id, expensesToReplace);

      const updatedVehicle = await txVehicleRepository.findById(id, organizationId);

      if (updatedVehicle === null) {
        throw new NotFoundError('Vehicle not found.');
      }

      return updatedVehicle;
    });
  },

  deleteVehicle: async ({ id, organizationId, role }: DeleteVehicleServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await findVehicleOrThrow(id, organizationId, deps);

    const blockingLoadIds = await deps.loadRepository.findBlockingLoadIdsByVehicle(
      id,
      blockingDeleteStatuses,
      10,
    );

    if (blockingLoadIds.length > 0) {
      throw new ConflictError(
        `Vehicle has active loads and cannot be deleted. Blocking load IDs: ${blockingLoadIds.join(', ')}`,
      );
    }

    await deps.vehicleRepository.softDelete(id, new Date());
  },
});
