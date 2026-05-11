import { BadRequestError } from '@mocho/common';
import { CarrierStatus, CarrierType, DispatchFeeType } from '@prisma/client';
import { OWNER_OPERATOR_ROLE } from '@/shared/constants/roles';
import { CARRIER_BLOCKING_DELETE_STATUSES } from '@/shared/constants/loadStatuses';
import {
  ActiveLoadsConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/shared/errors';
import { checkCarrierOnboarding } from '@/shared/onboardingGate';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import type {
  CarrierNoteRepositoryPort,
  CarrierRepositoryPort,
  CarrierServiceOutput,
  CarrierWithAssets,
  CarrierWithAssetsServiceOutput,
  CarrierWithCounts,
  InsuranceWarning,
  LoadRepositoryPort,
} from '../types/carrierTypes';
import type { CarrierAuditPort } from '../types/carrierAuditPort';
import type {
  CarrierService,
  CreateCarrierNoteServiceInput,
  CreateCarrierServiceInput,
  CreateCarrierWithAssetsServiceInput,
  DeleteCarrierServiceInput,
  GetCarrierByIdServiceInput,
  GetCarrierOnboardingServiceInput,
  ListCarrierNotesServiceInput,
  ListCarriersServiceInput,
  UpdateCarrierServiceInput,
} from '../types/carrierServiceTypes';

const listSortableFields = ['createdAt', 'updatedAt', 'name', 'insuranceExpiry'] as const;

const assertOwnerOperatorIsBlocked = (role: string): void => {
  if (role === OWNER_OPERATOR_ROLE) {
    throw new ForbiddenError('Owner-operator access to fleet management is not supported.');
  }
};

const toNumericFee = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === 'number' ? value : Number(value);
};

const assertExternalCarrierHasNonZeroFee = (
  carrierType: CarrierType,
  feeType: DispatchFeeType,
  dispatchFeePercent: string | number | null | undefined,
  dispatchFeeAmount: string | number | null | undefined,
): void => {
  if (carrierType !== CarrierType.EXTERNAL_CARRIER) {
    return;
  }

  const resolvedFee =
    feeType === DispatchFeeType.FLAT
      ? toNumericFee(dispatchFeeAmount)
      : toNumericFee(dispatchFeePercent);

  if (resolvedFee <= 0) {
    throw new BadRequestError('EXTERNAL_CARRIER requires a non-zero dispatch fee');
  }
};

const getSafeSortField = (field: string): (typeof listSortableFields)[number] => {
  const matched = listSortableFields.find((allowedField) => allowedField === field);
  if (matched !== undefined) {
    return matched;
  }
  return 'createdAt';
};

const isAdminRole = (role: string): boolean => role === 'admin';

const daysUntil = (date: Date): number => {
  const now = new Date();
  const millis = date.getTime() - now.getTime();
  return Math.ceil(millis / (1000 * 60 * 60 * 24));
};

const getInsuranceWarning = (insuranceExpiry: Date | null): InsuranceWarning | null => {
  if (insuranceExpiry === null) {
    return null;
  }

  const daysRemaining = daysUntil(insuranceExpiry);
  if (daysRemaining < 0) {
    return 'EXPIRED';
  }
  if (daysRemaining <= 7) {
    return '7_DAY';
  }
  if (daysRemaining <= 30) {
    return '30_DAY';
  }
  return null;
};

const enrichCarrier = (carrier: CarrierWithCounts, role: string): CarrierServiceOutput => {
  const onboarding = checkCarrierOnboarding({
    carrierType: carrier.type,
    dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
    insuranceCertOnFile: carrier.insuranceCertOnFile,
    insuranceExpiry: carrier.insuranceExpiry,
    w9OnFile: carrier.w9OnFile,
  });

  const { partnerSplitPercent: _partnerSplitPercent, ...carrierWithoutPartnerSplit } = carrier;

  const base: CarrierServiceOutput = {
    ...carrierWithoutPartnerSplit,
    driverCount: carrier._count.drivers,
    vehicleCount: carrier._count.vehicles,
    onboardingComplete: onboarding.allowed,
    insuranceWarning: getInsuranceWarning(carrier.insuranceExpiry),
  };

  if (!isAdminRole(role)) {
    return base;
  }

  return {
    ...base,
    partnerSplitPercent: carrier.partnerSplitPercent,
  };
};

const enrichCarrierWithAssets = (
  carrier: CarrierWithAssets,
  role: string,
): CarrierWithAssetsServiceOutput => ({
  ...enrichCarrier(carrier, role),
  drivers: carrier.drivers,
  vehicles: carrier.vehicles,
});

interface CarrierServiceDeps {
  carrierRepository: CarrierRepositoryPort;
  loadRepository: LoadRepositoryPort;
  noteRepository: CarrierNoteRepositoryPort;
  auditLog: CarrierAuditPort;
}

const auditCarrierCreated = async (
  deps: CarrierServiceDeps,
  args: {
    organizationId: string;
    userId: string | null;
    carrierId: string;
    carrierType: CarrierType;
    initialStatus: CarrierStatus;
    source: string;
  },
): Promise<void> => {
  await deps.auditLog
    .create(args.organizationId, {
      userId: args.userId,
      action: 'CARRIER_CREATED',
      entityType: 'CARRIER',
      entityId: args.carrierId,
      changes: { status: { old: null, new: args.initialStatus } },
      metadata: { source: args.source, carrierType: args.carrierType },
    })
    .catch(() => undefined);
};

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
  createCarrier: async ({ organizationId, role, userId, input }: CreateCarrierServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    assertExternalCarrierHasNonZeroFee(
      input.type,
      input.dispatchFeeType ?? DispatchFeeType.PERCENTAGE,
      input.dispatchFeePercent,
      input.dispatchFeeAmount,
    );

    const carrier = await deps.carrierRepository.create(organizationId, input);

    await auditCarrierCreated(deps, {
      organizationId,
      userId: userId ?? null,
      carrierId: carrier.id,
      carrierType: carrier.type,
      initialStatus: carrier.status,
      source: 'manual',
    });

    return enrichCarrier(carrier, role);
  },

  createCarrierWithAssets: async ({
    organizationId,
    role,
    userId,
    input,
  }: CreateCarrierWithAssetsServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    assertExternalCarrierHasNonZeroFee(
      input.type,
      input.dispatchFeeType ?? DispatchFeeType.PERCENTAGE,
      input.dispatchFeePercent,
      input.dispatchFeeAmount,
    );

    const carrier = await deps.carrierRepository.createWithAssets(organizationId, {
      carrier: input,
      drivers: input.drivers,
      vehicles: input.vehicles,
    });

    await auditCarrierCreated(deps, {
      organizationId,
      userId: userId ?? null,
      carrierId: carrier.id,
      carrierType: carrier.type,
      initialStatus: carrier.status,
      source: 'manual_with_assets',
    });

    return enrichCarrierWithAssets(carrier, role);
  },

  listCarriers: async ({ query, organizationId, filters, role }: ListCarriersServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    const params = parsePaginationParams(query);
    const sort = getSafeSortField(params.sort);

    const result = await paginateQuery(
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

    return {
      data: result.data.map((carrier) => enrichCarrier(carrier, role)),
      meta: result.meta,
    };
  },

  getCarrierById: async ({ id, organizationId, role }: GetCarrierByIdServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    const carrier = await findCarrierOrThrow(id, organizationId, deps);
    return enrichCarrier(carrier, role);
  },

  updateCarrier: async ({ id, organizationId, input, role }: UpdateCarrierServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    const existing = await findCarrierOrThrow(id, organizationId, deps);

    const typeChanged = input.type !== undefined && input.type !== existing.type;
    const feeTypeChanged =
      input.dispatchFeeType !== undefined && input.dispatchFeeType !== existing.dispatchFeeType;
    const feePercentChanged = input.dispatchFeePercent !== undefined;
    const feeAmountChanged = input.dispatchFeeAmount !== undefined;

    if (typeChanged || feeTypeChanged || feePercentChanged || feeAmountChanged) {
      const effectiveType = input.type ?? existing.type;
      const effectiveFeeType = input.dispatchFeeType ?? existing.dispatchFeeType;
      const effectivePercent =
        input.dispatchFeePercent ?? (existing.dispatchFeePercent as unknown as string | number | null);
      const effectiveAmount =
        input.dispatchFeeAmount ?? (existing.dispatchFeeAmount as unknown as string | number | null);

      assertExternalCarrierHasNonZeroFee(
        effectiveType,
        effectiveFeeType,
        effectivePercent,
        effectiveAmount,
      );
    }

    const carrier = await deps.carrierRepository.update(id, organizationId, input);
    return enrichCarrier(carrier, role);
  },

  deleteCarrier: async ({ id, organizationId, role }: DeleteCarrierServiceInput) => {
    assertOwnerOperatorIsBlocked(role);

    await findCarrierOrThrow(id, organizationId, deps);

    const blockingLoadIds = await deps.loadRepository.findBlockingLoadIds(
      id,
      CARRIER_BLOCKING_DELETE_STATUSES,
      10,
    );

    if (blockingLoadIds.length > 0) {
      throw new ActiveLoadsConflictError(
        'Carrier has active loads and cannot be deleted.',
        blockingLoadIds,
      );
    }

    await deps.carrierRepository.softDelete(id, organizationId, new Date());
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

  listNotes: async ({ carrierId, organizationId, role, query }: ListCarrierNotesServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await findCarrierOrThrow(carrierId, organizationId, deps);

    const params = parsePaginationParams(query);
    const skip = (params.page - 1) * params.limit;

    const [notes, total] = await Promise.all([
      deps.noteRepository.listNotes(carrierId, skip, params.limit),
      deps.noteRepository.countNotes(carrierId),
    ]);

    const meta = {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
      hasMore: params.page < Math.ceil(total / params.limit),
    };

    return { data: notes, meta };
  },

  createNote: async ({ carrierId, organizationId, role, input }: CreateCarrierNoteServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    await findCarrierOrThrow(carrierId, organizationId, deps);

    return deps.noteRepository.createNote(carrierId, input);
  },
});
