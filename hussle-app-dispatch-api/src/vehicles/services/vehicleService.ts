import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging';
import { BLOCKING_DELETE_STATUSES } from '@/shared/constants/loadStatuses';
import { OWNER_OPERATOR_ROLE } from '@/shared/constants/roles';
import { SUBSCRIPTION_LIMITS } from '@/config/subscriptionLimits';
import {
  ActiveLoadsConflictError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  SeatLimitReachedError,
  ValidationError,
} from '@/shared/errors';
import type { LoadQueryPort } from '@/shared/loadQueries';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import type {
  CarrierRepositoryPort,
  DriverQueryPort,
  LoadRepositoryPort,
  UpdateVehicleDataInput,
  VehicleExpenseInput,
  VehicleRepositoryPort,
  VehicleResponse,
} from '../types/vehicleTypes';
import type {
  AssignDriverServiceInput,
  CreateExpenseServiceInput,
  CreateVehicleServiceInput,
  DeleteVehicleServiceInput,
  GetVehicleByIdServiceInput,
  GetVehicleLoadHistoryServiceInput,
  ListExpensesServiceInput,
  ListVehiclesServiceInput,
  UnassignDriverServiceInput,
  UpdateVehicleServiceInput,
  VehicleService,
} from '../types/vehicleServiceTypes';

const listSortableFields = [
  'createdAt',
  'updatedAt',
  'unitNumber',
  'type',
  'year',
  'make',
  'model',
] as const;

const MAX_BLOCKING_LOAD_IDS = 10;

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
  driverQueryPort: DriverQueryPort;
  loadQueryPort: LoadQueryPort;
  eventBus: EventBus;
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

const getUniqueIds = (values: (string | null | undefined)[]): string[] =>
  Array.from(
    new Set(values.filter((value): value is string => value !== null && value !== undefined)),
  );

const findBlockingReassignmentLoadIds = async (
  driverIds: string[],
  vehicleIds: string[],
  deps: VehicleServiceDeps,
): Promise<string[]> => {
  const driverLoadIds = await Promise.all(
    driverIds.map((driverId) =>
      deps.loadRepository.findBlockingLoadIdsByDriver(
        driverId,
        BLOCKING_DELETE_STATUSES,
        MAX_BLOCKING_LOAD_IDS,
      ),
    ),
  );

  const vehicleLoadIds = await Promise.all(
    vehicleIds.map((vehicleId) =>
      deps.loadRepository.findBlockingLoadIdsByVehicle(
        vehicleId,
        BLOCKING_DELETE_STATUSES,
        MAX_BLOCKING_LOAD_IDS,
      ),
    ),
  );

  return Array.from(new Set([...driverLoadIds.flat(), ...vehicleLoadIds.flat()])).slice(
    0,
    MAX_BLOCKING_LOAD_IDS,
  );
};

export const createVehicleService = (deps: VehicleServiceDeps): VehicleService => ({
  createVehicle: async ({ organizationId, role, input }: CreateVehicleServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await assertCarrierExists(input.carrierId, organizationId, deps);

    const activeVehicleCount =
      await deps.vehicleRepository.countActiveByOrganization(organizationId);

    if (activeVehicleCount >= SUBSCRIPTION_LIMITS.maxVehicles) {
      throw new SeatLimitReachedError('vehicles', SUBSCRIPTION_LIMITS.maxVehicles);
    }

    return deps.vehicleRepository.create(input);
  },

  listVehicles: async ({ query, organizationId, role, filters }: ListVehiclesServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    const params = parsePaginationParams(query);
    const sort = getSafeSortField(params.sort);

    const result = await paginateQuery(
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

    const vehicleIds = result.data.map((vehicle) => vehicle.id);
    const activeLoadCounts = vehicleIds.length > 0
      ? await deps.loadRepository.countActiveByVehicleIds(vehicleIds, organizationId)
      : new Map<string, number>();

    const enrichedData = result.data.map((vehicle) => ({
      ...vehicle,
      activeLoadCount: activeLoadCounts.get(vehicle.id) ?? 0,
    }));

    return { data: enrichedData, meta: result.meta };
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

    const updatedVehicle = await deps.transactionManager.runInTransaction(async (tx) => {
      const txVehicleRepository = deps.vehicleRepositoryFactory(tx);
      await txVehicleRepository.update(id, updateData);
      await txVehicleRepository.replaceExpenses(id, expensesToReplace);

      const result = await txVehicleRepository.findById(id, organizationId);

      if (result === null) {
        throw new NotFoundError('Vehicle not found.');
      }

      return result;
    });

    await deps.eventBus.publish('vehicle.expense.changed', { vehicleId: id, organizationId });

    return updatedVehicle;
  },

  deleteVehicle: async ({ id, organizationId, role }: DeleteVehicleServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await findVehicleOrThrow(id, organizationId, deps);

    const blockingLoadIds = await deps.loadRepository.findBlockingLoadIdsByVehicle(
      id,
      BLOCKING_DELETE_STATUSES,
      10,
    );

    if (blockingLoadIds.length > 0) {
      throw new ConflictError(
        `Vehicle has active loads and cannot be deleted. Blocking load IDs: ${blockingLoadIds.join(', ')}`,
      );
    }

    await deps.vehicleRepository.softDelete(id, new Date());
  },

  assignDriver: async ({ id, organizationId, role, driverId }: AssignDriverServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    const vehicle = await findVehicleOrThrow(id, organizationId, deps);

    const driver = await deps.driverQueryPort.findById(driverId, organizationId);

    if (driver === null) {
      throw new NotFoundError('Driver not found.');
    }

    if (driver.carrierId !== vehicle.carrierId) {
      throw new ValidationError('Driver and vehicle must belong to the same carrier.');
    }

    const existingVehicle = await deps.vehicleRepository.findByDriverId(driverId);

    if (existingVehicle !== null && existingVehicle.id === id) {
      return vehicle;
    }

    const blockingLoadIds = await findBlockingReassignmentLoadIds(
      getUniqueIds([driver.id, vehicle.driverId]),
      getUniqueIds([vehicle.id, existingVehicle?.id]),
      deps,
    );

    if (blockingLoadIds.length > 0) {
      throw new ActiveLoadsConflictError(
        'Vehicle-driver reassignment is blocked by active loads.',
        blockingLoadIds,
      );
    }

    return deps.transactionManager.runInTransaction(async (tx) => {
      const txVehicleRepository = deps.vehicleRepositoryFactory(tx);

      if (existingVehicle !== null && existingVehicle.id !== id) {
        await txVehicleRepository.unassignDriver(existingVehicle.id);
      }

      if (vehicle.driverId !== null && vehicle.driverId !== driverId) {
        await txVehicleRepository.unassignDriver(id);
      }

      return txVehicleRepository.assignDriver(id, driverId);
    });
  },

  unassignDriver: async ({ id, organizationId, role }: UnassignDriverServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    const vehicle = await findVehicleOrThrow(id, organizationId, deps);

    if (vehicle.driverId === null) {
      throw new ValidationError('Vehicle does not have an assigned driver.');
    }

    const blockingLoadIds = await findBlockingReassignmentLoadIds(
      [vehicle.driverId],
      [vehicle.id],
      deps,
    );

    if (blockingLoadIds.length > 0) {
      throw new ActiveLoadsConflictError(
        'Vehicle-driver unassignment is blocked by active loads.',
        blockingLoadIds,
      );
    }

    return deps.vehicleRepository.unassignDriver(id);
  },

  getLoadHistory: async ({
    id,
    organizationId,
    role,
    query,
  }: GetVehicleLoadHistoryServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await findVehicleOrThrow(id, organizationId, deps);

    return deps.loadQueryPort.getLoadsByVehicleId(id, query);
  },

  createExpense: async ({
    vehicleId,
    organizationId,
    role,
    input,
  }: CreateExpenseServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await findVehicleOrThrow(vehicleId, organizationId, deps);

    const expense = await deps.vehicleRepository.createExpense(vehicleId, input);

    await deps.eventBus.publish('vehicle.expense.created', {
      vehicleId,
      organizationId,
      expenseId: expense.id,
    });

    return expense;
  },

  listExpenses: async ({ vehicleId, organizationId, role }: ListExpensesServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await findVehicleOrThrow(vehicleId, organizationId, deps);

    return deps.vehicleRepository.findExpensesByVehicleId(vehicleId);
  },
});
