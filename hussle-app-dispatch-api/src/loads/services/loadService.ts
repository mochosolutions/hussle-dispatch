import type { CarrierType } from '@prisma/client';
import type { EventBus } from '@/shared/messaging/eventBus';
import {
  AssignmentValidationError,
  NotFoundError,
  ProhibitedCommodityError,
  ValidationError,
} from '@/shared/errors';
import { BLOCKING_DELETE_STATUSES } from '@/shared/constants/loadStatuses';
import { checkCarrierOnboarding } from '@/shared/onboardingGate';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import { generateSequenceNumber } from '@/shared/sequenceGenerator';
import { calculateRoadDistance } from '@/shared/utils/distanceCalculator';
import type { Logger } from '@/shared/utils/logger';
import { calculateAndPersistFinancials } from './calculateFinancials';
import type { LoadStatusRepoPort } from '../types/loadStatusTypes';
import type {
  CarrierAssignmentQueryPort,
  CustomerQueryPort,
  DispatcherProfileQueryPort,
  DriverAssignmentQueryPort,
  LoadAssignmentInput,
  LoadAssignmentWarning,
  LoadRepoPort,
  LoadWithRelations,
  OrgSettingsQueryPort,
  StopInput,
  UpdateLoadInput,
  VehicleAssignmentQueryPort,
  VehicleCpmQueryPort,
} from '../types/loadTypes';
import type {
  AssignLoadServiceInput,
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

const ASSIGNMENT_FIELD_NAMES = ['carrierId', 'driverId', 'vehicleId'] as const;
const MAX_BLOCKING_LOAD_IDS = 10;

const getSafeSortField = (field: string): (typeof listSortableFields)[number] => {
  const matched = listSortableFields.find((allowedField) => allowedField === field);
  if (matched !== undefined) {
    return matched;
  }
  return 'createdAt';
};

export const validateStops = (stops: StopInput[]): void => {
  const hasPickup = stops.some((stop) => stop.type === 'PICKUP');
  const hasDelivery = stops.some((stop) => stop.type === 'DELIVERY');

  if (!hasPickup) {
    throw new ValidationError('At least one PICKUP stop is required');
  }

  if (!hasDelivery) {
    throw new ValidationError('At least one DELIVERY stop is required');
  }

  stops.forEach((stop, index) => {
    if (
      stop.schedulingType === 'APPOINTMENT' &&
      (stop.appointmentStart === undefined || stop.appointmentStart === null)
    ) {
      throw new ValidationError(
        `Stop ${String(index + 1)}: appointmentStart is required when schedulingType is APPOINTMENT.`,
      );
    }

    if (
      stop.schedulingType === 'NOTIFICATION' &&
      (stop.notificationHours === undefined || stop.notificationHours === null)
    ) {
      throw new ValidationError(
        `Stop ${String(index + 1)}: notificationHours is required when schedulingType is NOTIFICATION.`,
      );
    }

    if (
      stop.schedulingType === 'FCFS' &&
      (stop.targetDate === undefined || stop.targetDate === null)
    ) {
      throw new ValidationError(
        `Stop ${String(index + 1)}: targetDate is required when schedulingType is FCFS.`,
      );
    }
  });
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

  const match = prohibited.find((item) => lowerCommodity.includes(item.toLowerCase()));

  if (match !== undefined) {
    throw new ProhibitedCommodityError(commodity);
  }
};

interface ProhibitedCommodityCheckInput {
  stops: StopInput[] | undefined;
  organizationId: string;
}

const checkProhibitedCommodities = async (
  input: ProhibitedCommodityCheckInput,
  orgSettingsQuery: OrgSettingsQueryPort,
): Promise<void> => {
  if (input.stops === undefined) {
    return;
  }

  const stopCommodities = input.stops
    .map((stop) => stop.commodity)
    .filter((c): c is string => c !== undefined && c.length > 0);

  const uniqueStopCommodities = [...new Set(stopCommodities)];

  for (const stopCommodity of uniqueStopCommodities) {
    await checkProhibitedCommodity(stopCommodity, input.organizationId, orgSettingsQuery);
  }
};

const validateCustomerExists = async (
  customerId: string | null | undefined,
  organizationId: string,
  customerQuery: CustomerQueryPort | undefined,
): Promise<void> => {
  if (customerId === undefined || customerId === null) {
    return;
  }

  if (customerQuery === undefined) {
    return;
  }

  const customer = await customerQuery.findById(customerId, organizationId);

  if (customer === null) {
    throw new NotFoundError('Customer not found.');
  }
};

const assertFinancialsNotChanged = (
  currentStatus: string,
  input: Record<string, unknown>,
): void => {
  if (!DISPATCHED_AND_BEYOND.has(currentStatus)) {
    return;
  }

  const changedFinancials = FINANCIAL_FIELDS.filter((field) => input[field] !== undefined);

  if (changedFinancials.length > 0) {
    throw new ValidationError(
      `Cannot modify financial fields after dispatch. Locked fields: ${changedFinancials.join(', ')}`,
    );
  }
};

interface LoadServiceDeps {
  loadRepository: LoadRepoPort;
  orgSettingsQuery: OrgSettingsQueryPort;
  carrierAssignmentQuery: CarrierAssignmentQueryPort;
  driverAssignmentQuery: DriverAssignmentQueryPort;
  vehicleAssignmentQuery: VehicleAssignmentQueryPort;
  customerQuery?: CustomerQueryPort;
  loadStatusRepo?: Pick<LoadStatusRepoPort, 'sumAccessorialCharges' | 'updateFinancials'>;
  vehicleCpmQuery?: VehicleCpmQueryPort;
  dispatcherProfileQuery?: DispatcherProfileQueryPort;
  eventBus?: EventBus;
  logger?: Logger;
}

interface ResolvedAssignmentState {
  carrierId: string | null;
  driverId: string | null;
  vehicleId: string | null;
}

const normalizeAssignmentValue = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  return trimmedValue;
};

const getNormalizedAssignmentInput = (input: LoadAssignmentInput): LoadAssignmentInput => ({
  carrierId: normalizeAssignmentValue(input.carrierId),
  driverId: normalizeAssignmentValue(input.driverId),
  vehicleId: normalizeAssignmentValue(input.vehicleId),
});

const hasAssignmentInput = (input: LoadAssignmentInput): boolean =>
  ASSIGNMENT_FIELD_NAMES.some((fieldName) => input[fieldName] !== undefined);

const resolveAssignmentState = (
  currentState: ResolvedAssignmentState,
  input: LoadAssignmentInput,
): ResolvedAssignmentState => {
  if (input.carrierId === null) {
    return {
      carrierId: null,
      driverId: input.driverId === undefined ? null : input.driverId,
      vehicleId: input.vehicleId === undefined ? null : input.vehicleId,
    };
  }

  return {
    carrierId: input.carrierId === undefined ? currentState.carrierId : input.carrierId,
    driverId: input.driverId === undefined ? currentState.driverId : input.driverId,
    vehicleId: input.vehicleId === undefined ? currentState.vehicleId : input.vehicleId,
  };
};

const getCurrentAssignmentState = (load: LoadWithRelations): ResolvedAssignmentState => ({
  carrierId: load.carrierId,
  driverId: load.driverId,
  vehicleId: load.vehicleId,
});

const validateAssignmentState = async (
  assignment: ResolvedAssignmentState,
  organizationId: string,
  loadId: string | undefined,
  deps: LoadServiceDeps,
): Promise<LoadAssignmentWarning[]> => {
  const blockers: {
    code: string;
    message: string;
    field?: string;
    blockingLoadIds?: string[];
  }[] = [];
  const warnings: LoadAssignmentWarning[] = [];

  let carrier: {
    id: string;
    name: string;
    type: CarrierType;
    dispatchAgreementOnFile: boolean;
    insuranceCertOnFile: boolean;
    insuranceExpiry: Date | null;
    w9OnFile: boolean;
  } | null = null;

  let driver: {
    id: string;
    carrierId: string;
    firstName: string;
    lastName: string;
    isAvailable: boolean;
  } | null = null;

  let vehicle: {
    id: string;
    carrierId: string;
    unitNumber: string;
    driverId: string | null;
    isActive: boolean;
  } | null = null;

  if (
    (assignment.driverId !== null || assignment.vehicleId !== null) &&
    assignment.carrierId === null
  ) {
    blockers.push({
      code: 'CARRIER_REQUIRED',
      field: 'carrierId',
      message: 'Carrier is required when assigning a driver or vehicle.',
    });
  }

  if (assignment.carrierId !== null) {
    carrier = await deps.carrierAssignmentQuery.findDispatchableById(
      assignment.carrierId,
      organizationId,
    );

    if (carrier === null) {
      blockers.push({
        code: 'CARRIER_NOT_DISPATCHABLE',
        field: 'carrierId',
        message: 'Selected carrier is not dispatchable by this organization.',
      });
    }
  }

  if (assignment.driverId !== null) {
    driver = await deps.driverAssignmentQuery.findAssignableById(
      assignment.driverId,
      organizationId,
    );

    if (driver === null) {
      blockers.push({
        code: 'DRIVER_NOT_FOUND',
        field: 'driverId',
        message: 'Selected driver was not found for this organization.',
      });
    }
  }

  if (assignment.vehicleId !== null) {
    vehicle = await deps.vehicleAssignmentQuery.findAssignableById(
      assignment.vehicleId,
      organizationId,
    );

    if (vehicle === null) {
      blockers.push({
        code: 'VEHICLE_NOT_FOUND',
        field: 'vehicleId',
        message: 'Selected vehicle was not found for this organization.',
      });
    }
  }

  if (carrier !== null) {
    const onboardingResult = checkCarrierOnboarding({
      carrierType: carrier.type,
      dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
      insuranceCertOnFile: carrier.insuranceCertOnFile,
      insuranceExpiry: carrier.insuranceExpiry,
      w9OnFile: carrier.w9OnFile,
    });

    if (!onboardingResult.allowed) {
      blockers.push({
        code: 'CARRIER_ONBOARDING_INCOMPLETE',
        field: 'carrierId',
        message: `${carrier.name} cannot be assigned until onboarding is complete.`,
      });
    }
  }

  if (carrier !== null && driver !== null && driver.carrierId !== carrier.id) {
    blockers.push({
      code: 'DRIVER_CARRIER_MISMATCH',
      field: 'driverId',
      message: 'Driver must belong to the selected carrier.',
    });
  }

  if (carrier !== null && vehicle !== null && vehicle.carrierId !== carrier.id) {
    blockers.push({
      code: 'VEHICLE_CARRIER_MISMATCH',
      field: 'vehicleId',
      message: 'Vehicle must belong to the selected carrier.',
    });
  }

  if (driver !== null && !driver.isAvailable) {
    blockers.push({
      code: 'DRIVER_UNAVAILABLE',
      field: 'driverId',
      message: `${driver.firstName} ${driver.lastName} is not available for dispatch.`,
    });
  }

  if (vehicle !== null && !vehicle.isActive) {
    blockers.push({
      code: 'VEHICLE_UNAVAILABLE',
      field: 'vehicleId',
      message: `Vehicle ${vehicle.unitNumber} is not active for dispatch.`,
    });
  }

  if (vehicle !== null) {
    const blockingLoadIds = await deps.loadRepository.findBlockingLoadIdsByVehicle(
      vehicle.id,
      BLOCKING_DELETE_STATUSES,
      MAX_BLOCKING_LOAD_IDS,
      loadId,
    );

    if (blockingLoadIds.length > 0) {
      warnings.push({
        code: 'VEHICLE_ACTIVE_LOADS',
        field: 'vehicleId',
        message: `Vehicle ${vehicle.unitNumber} is currently assigned to ${String(blockingLoadIds.length)} active load(s).`,
        detail: 'Assignment is allowed — dispatch will proceed with the vehicle on multiple loads.',
      });
    }
  }

  if (
    driver !== null &&
    vehicle !== null &&
    vehicle.driverId !== null &&
    vehicle.driverId !== driver.id
  ) {
    warnings.push({
      code: 'VEHICLE_HOME_DRIVER_MISMATCH',
      field: 'vehicleId',
      message: `Vehicle ${vehicle.unitNumber} has a different default fleet pairing.`,
      detail: 'Load assignment is allowed because dispatch assignment is tracked on the load.',
    });
  }

  if (blockers.length > 0) {
    throw new AssignmentValidationError('Load assignment blocked.', blockers);
  }

  return warnings;
};

const calculateDeadheadMiles = async (
  driverId: string,
  loadId: string,
  organizationId: string,
  loadRepository: LoadRepoPort,
): Promise<number | null> => {
  const [lastDeliveryCoords, firstPickupCoords] = await Promise.all([
    loadRepository.findLastDeliveryCoordinates(driverId, organizationId),
    loadRepository.findFirstPickupCoordinates(loadId),
  ]);

  if (lastDeliveryCoords === null || firstPickupCoords === null) {
    return null;
  }

  const distance = calculateRoadDistance(lastDeliveryCoords, firstPickupCoords);

  return Math.round(distance);
};

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

const hasFinancialRelevantFieldChanged = (
  input: UpdateLoadInput,
  existing: LoadWithRelations,
  resolvedAssignment: ResolvedAssignmentState | undefined,
): boolean => {
  if (
    input.customerRate !== undefined &&
    String(input.customerRate) !== String(existing.customerRate)
  ) {
    return true;
  }

  if (
    input.loadedMiles !== undefined &&
    input.loadedMiles !== (existing.loadedMiles ?? undefined)
  ) {
    return true;
  }

  if (
    input.totalMiles !== undefined &&
    input.loadedMiles === undefined &&
    input.totalMiles !== (existing.loadedMiles ?? undefined)
  ) {
    return true;
  }

  if (
    resolvedAssignment !== undefined &&
    resolvedAssignment.carrierId !== existing.carrierId
  ) {
    return true;
  }

  return false;
};

export const createLoadService = (deps: LoadServiceDeps): LoadService => ({
  createLoad: async ({ organizationId, input }: CreateLoadServiceInput) => {
    const normalizedAssignmentInput = getNormalizedAssignmentInput(input);
    const shouldValidateAssignment = hasAssignmentInput(normalizedAssignmentInput);
    const resolvedAssignment = resolveAssignmentState(
      { carrierId: null, driverId: null, vehicleId: null },
      normalizedAssignmentInput,
    );

    validateStops(input.stops);

    await checkProhibitedCommodities(
      {
        stops: input.stops,
        organizationId,
      },
      deps.orgSettingsQuery,
    );

    await validateCustomerExists(input.customerId, organizationId, deps.customerQuery);

    if (shouldValidateAssignment) {
      await validateAssignmentState(resolvedAssignment, organizationId, undefined, deps);
    }

    const loadedMiles = input.loadedMiles ?? input.totalMiles;

    const computedTotalMiles =
      loadedMiles !== undefined && loadedMiles !== null
        ? loadedMiles + (input.deadheadMiles ?? 0)
        : undefined;

    const loadNumber = await generateSequenceNumber('LOAD', organizationId);

    const load = await deps.loadRepository.create(organizationId, loadNumber, {
      ...input,
      ...resolvedAssignment,
      ...(loadedMiles !== undefined ? { loadedMiles } : {}),
      ...(computedTotalMiles !== undefined ? { totalMiles: computedTotalMiles } : {}),
    });

    // Calculate financials when carrier and customer rate are present at creation
    if (
      load.carrierId !== null &&
      load.customerRate !== null &&
      deps.loadStatusRepo !== undefined &&
      deps.logger !== undefined
    ) {
      await calculateAndPersistFinancials(load.id, {
        load,
        loadStatusRepo: deps.loadStatusRepo,
        logger: deps.logger,
        vehicleCpmQuery: deps.vehicleCpmQuery,
        dispatcherProfileQuery: deps.dispatcherProfileQuery,
        organizationId: load.organizationId,
      });

      return findLoadOrThrow(load.id, organizationId, deps);
    }

    return load;
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
    const normalizedAssignmentInput = getNormalizedAssignmentInput(input);
    const shouldValidateAssignment = hasAssignmentInput(normalizedAssignmentInput);

    assertFinancialsNotChanged(existing.status, input as Record<string, unknown>);

    if (input.stops !== undefined) {
      validateStops(input.stops);
    }

    await checkProhibitedCommodities(
      {
        stops: input.stops,
        organizationId,
      },
      deps.orgSettingsQuery,
    );

    await validateCustomerExists(input.customerId, organizationId, deps.customerQuery);

    const loadedMiles = input.loadedMiles ?? input.totalMiles ?? existing.loadedMiles ?? undefined;

    const existingDeadhead = existing.deadheadMiles ?? 0;
    const deadheadMiles = input.deadheadMiles ?? existingDeadhead;
    const computedTotalMiles =
      loadedMiles !== undefined
        ? loadedMiles + deadheadMiles
        : undefined;

    const mergedInput = {
      ...input,
      ...(loadedMiles !== undefined ? { loadedMiles } : {}),
      ...(computedTotalMiles !== undefined ? { totalMiles: computedTotalMiles } : {}),
    };

    let load: LoadWithRelations;
    let resolvedAssignment: ResolvedAssignmentState | undefined;

    if (!shouldValidateAssignment) {
      load = await deps.loadRepository.update(id, mergedInput);
    } else {
      resolvedAssignment = resolveAssignmentState(
        getCurrentAssignmentState(existing),
        normalizedAssignmentInput,
      );

      await validateAssignmentState(resolvedAssignment, organizationId, id, deps);

      load = await deps.loadRepository.update(id, {
        ...mergedInput,
        ...resolvedAssignment,
      });
    }

    const financialFieldChanged = hasFinancialRelevantFieldChanged(
      input,
      existing,
      resolvedAssignment,
    );

    if (
      financialFieldChanged &&
      load.carrierId !== null &&
      load.customerRate !== null &&
      deps.loadStatusRepo !== undefined &&
      deps.logger !== undefined
    ) {
      await calculateAndPersistFinancials(id, {
        load,
        loadStatusRepo: deps.loadStatusRepo,
        logger: deps.logger,
        vehicleCpmQuery: deps.vehicleCpmQuery,
        dispatcherProfileQuery: deps.dispatcherProfileQuery,
        organizationId: load.organizationId,
      });

      return findLoadOrThrow(id, organizationId, deps);
    }

    return load;
  },

  assignLoad: async ({ id, organizationId, input }: AssignLoadServiceInput) => {
    const existing = await findLoadOrThrow(id, organizationId, deps);
    const normalizedAssignmentInput = getNormalizedAssignmentInput(input);
    const resolvedAssignment = resolveAssignmentState(
      getCurrentAssignmentState(existing),
      normalizedAssignmentInput,
    );

    const warnings = await validateAssignmentState(resolvedAssignment, organizationId, id, deps);

    let deadheadMiles: number | undefined;

    if (resolvedAssignment.driverId !== null) {
      const calculated = await calculateDeadheadMiles(
        resolvedAssignment.driverId,
        id,
        organizationId,
        deps.loadRepository,
      );

      if (calculated !== null) {
        deadheadMiles = calculated;
      }
    }

    const totalMiles =
      deadheadMiles !== undefined && existing.loadedMiles !== null
        ? existing.loadedMiles + deadheadMiles
        : undefined;

    const load = await deps.loadRepository.update(id, {
      ...resolvedAssignment,
      ...(deadheadMiles !== undefined ? { deadheadMiles } : {}),
      ...(totalMiles !== undefined ? { totalMiles } : {}),
    });

    if (
      load.carrierId !== null &&
      load.customerRate !== null &&
      deps.loadStatusRepo !== undefined &&
      deps.logger !== undefined
    ) {
      await calculateAndPersistFinancials(id, {
        load,
        loadStatusRepo: deps.loadStatusRepo,
        logger: deps.logger,
        vehicleCpmQuery: deps.vehicleCpmQuery,
        dispatcherProfileQuery: deps.dispatcherProfileQuery,
        organizationId: load.organizationId,
      });
    }

    return { load, warnings };
  },

  deleteLoad: async ({ id, organizationId }: DeleteLoadServiceInput) => {
    await findLoadOrThrow(id, organizationId, deps);
    await deps.loadRepository.softDelete(id, new Date());
  },

  createCheckCall: async ({
    loadId,
    organizationId,
    userId,
    input,
  }: CreateCheckCallServiceInput) => {
    const load = await findLoadOrThrow(loadId, organizationId, deps);
    const checkCall = await deps.loadRepository.createCheckCall(loadId, userId, input);

    if (deps.eventBus !== undefined) {
      deps.eventBus
        .publish('load.checkcall.logged', {
          loadId,
          organizationId,
          loadNumber: load.loadNumber,
          checkCallId: checkCall.id,
          customerId: load.customerId ?? null,
          contactEmail: load.contact?.email ?? null,
          contactPhone: load.contact?.phone ?? null,
          location: input.location ?? null,
          status: input.status ?? null,
          eta: input.eta?.toISOString() ?? null,
        })
        .catch((error: unknown) => {
          deps.logger?.error('Failed to publish check call event', {
            loadId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }

    return checkCall;
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
