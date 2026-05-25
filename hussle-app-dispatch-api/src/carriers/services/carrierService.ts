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
import type { CarrierInviteTokenRepoPort } from '@/carrier-portal/types/carrierInviteTokenRepoPort';
import type { DerivedComplianceDeps } from './derivedCompliance';
import { computeCompliancesForCarriers } from './derivedComplianceBatch';
import type { ComplianceForCarrier } from './derivedComplianceBatch';
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

const listSortableFields = ['createdAt', 'updatedAt', 'name'] as const;

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

const toInsuranceWarningEnum = (
  warning: ComplianceForCarrier['insurance']['warning'],
): InsuranceWarning | null =>
  warning === '30_DAY' || warning === '7_DAY' || warning === 'EXPIRED' ? warning : null;

const enrichCarrierFromCompliance = (
  carrier: CarrierWithCounts,
  role: string,
  compliance: ComplianceForCarrier,
): CarrierServiceOutput => {
  const onboarding = checkCarrierOnboarding({
    carrierType: carrier.type,
    dispatchAgreementOnFile: compliance.agreement.onFile,
    insuranceCertOnFile: compliance.insurance.onFile,
    insuranceExpiry: compliance.insurance.expiresAt,
    tinOnFile: carrier.tin != null,
  });

  const { partnerSplitPercent: _partnerSplitPercent, ...carrierWithoutPartnerSplit } = carrier;

  const base: CarrierServiceOutput = {
    ...carrierWithoutPartnerSplit,
    driverCount: carrier._count.drivers,
    vehicleCount: carrier._count.vehicles,
    onboardingComplete: onboarding.allowed,
    dispatchableStatus: {
      ready: onboarding.allowed,
      missing: onboarding.missingDocuments,
    },
    insuranceWarning: toInsuranceWarningEnum(compliance.insurance.warning),
  };

  if (!isAdminRole(role)) {
    return base;
  }

  return {
    ...base,
    partnerSplitPercent: carrier.partnerSplitPercent,
  };
};

const computeComplianceForOne = async (
  carrierId: string,
  deps: DerivedComplianceDeps,
): Promise<ComplianceForCarrier> => {
  const byId = await computeCompliancesForCarriers([carrierId], deps);
  const compliance = byId.get(carrierId);
  if (compliance === undefined) {
    // computeCompliancesForCarriers seeds every input id with a default — this is
    // defensive only and should be unreachable.
    return {
      insurance: { onFile: false, expiresAt: null, warning: null },
      w9: { onFile: false },
      carrierPacket: { onFile: false },
      agreement: { onFile: false, signedAgreementId: null, signedAt: null },
    };
  }
  return compliance;
};

const enrichCarrier = async (
  carrier: CarrierWithCounts,
  role: string,
  deps: DerivedComplianceDeps,
): Promise<CarrierServiceOutput> => {
  const compliance = await computeComplianceForOne(carrier.id, deps);
  return enrichCarrierFromCompliance(carrier, role, compliance);
};

const enrichCarrierWithAssets = async (
  carrier: CarrierWithAssets,
  role: string,
  deps: DerivedComplianceDeps,
): Promise<CarrierWithAssetsServiceOutput> => {
  const enriched = await enrichCarrier(carrier, role, deps);
  return {
    ...enriched,
    drivers: carrier.drivers,
    vehicles: carrier.vehicles,
  };
};

interface CarrierServiceDeps {
  carrierRepository: CarrierRepositoryPort;
  loadRepository: LoadRepositoryPort;
  noteRepository: CarrierNoteRepositoryPort;
  auditLog: CarrierAuditPort;
  inviteTokenRepo: CarrierInviteTokenRepoPort;
  derivedComplianceDeps: DerivedComplianceDeps;
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

    return enrichCarrier(carrier, role, deps.derivedComplianceDeps);
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

    return enrichCarrierWithAssets(carrier, role, deps.derivedComplianceDeps);
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

    // Batch-compute compliance once for the whole page (exactly 2 queries) and
    // pair each carrier with its derived projection before enriching.
    const complianceById = await computeCompliancesForCarriers(
      result.data.map((carrier) => carrier.id),
      deps.derivedComplianceDeps,
    );

    return {
      data: result.data.map((carrier) =>
        enrichCarrierFromCompliance(
          carrier,
          role,
          complianceById.get(carrier.id) ?? {
            insurance: { onFile: false, expiresAt: null, warning: null },
            w9: { onFile: false },
            carrierPacket: { onFile: false },
            agreement: { onFile: false, signedAgreementId: null, signedAt: null },
          },
        ),
      ),
      meta: result.meta,
    };
  },

  getCarrierById: async ({ id, organizationId, role }: GetCarrierByIdServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    const carrier = await findCarrierOrThrow(id, organizationId, deps);
    return enrichCarrier(carrier, role, deps.derivedComplianceDeps);
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
    return enrichCarrier(carrier, role, deps.derivedComplianceDeps);
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
    await deps.inviteTokenRepo.revokeByCarrierId(id);
  },

  getCarrierOnboardingStatus: async ({
    id,
    organizationId,
    role,
  }: GetCarrierOnboardingServiceInput) => {
    assertOwnerOperatorIsBlocked(role);
    const carrier = await findCarrierOrThrow(id, organizationId, deps);
    const compliance = await computeComplianceForOne(carrier.id, deps.derivedComplianceDeps);

    return checkCarrierOnboarding({
      carrierType: carrier.type,
      dispatchAgreementOnFile: compliance.agreement.onFile,
      insuranceCertOnFile: compliance.insurance.onFile,
      insuranceExpiry: compliance.insurance.expiresAt,
      tinOnFile: carrier.tin != null,
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
