import type { DispatchFeeType, DispatcherCommType, DriverPayType } from '@prisma/client';
import type { EventBus } from '@/shared/messaging/eventBus';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type { Logger } from '@/shared/utils/logger';
import type { LoadRepoPort, LoadWithRelations, SettlementFreezeQueryPort } from '../types/loadTypes';

type ScalarValue = string | number | boolean | null;

/**
 * The 9 input snapshot columns mutated via PATCH /loads/:id/dispatch-terms.
 *
 * `dispatchFeeAmount` carries a dual semantic per US-09/US-10:
 *   - when `dispatchFeeType === PERCENTAGE`, it's a percent value 0-100
 *   - when `dispatchFeeType === FLAT`,       it's a dollar amount
 *
 * Validation of that pairing lives in the Yup validator; the service treats
 * it as opaque Decimal-string input.
 */
export interface UpdateDispatchTermsFields {
  dispatchFeeType?: DispatchFeeType | null;
  dispatchFeeAmount?: string | number | null;
  partnerSplitPercent?: string | number | null;
  driverPayType?: DriverPayType | null;
  driverPayRate?: string | number | null;
  dispatcherCommissionType?: DispatcherCommType | null;
  dispatcherCommissionRate?: string | number | null;
  feeIncludesAccessorials?: boolean | null;
  payFromNet?: boolean | null;
}

export interface UpdateDispatchTermsInput {
  loadId: string;
  organizationId: string;
  requestingUserId: string;
  fields: UpdateDispatchTermsFields;
}

export interface UpdateDispatchTermsResult {
  load: LoadWithRelations;
}

export interface UpdateDispatchTermsDeps {
  loadRepository: LoadRepoPort;
  eventBus: EventBus;
  logger: Logger;
  settlementFreezeQuery?: SettlementFreezeQueryPort;
}

const DISPATCH_TERMS_FIELDS = [
  'dispatchFeeType',
  'dispatchFeeAmount',
  'partnerSplitPercent',
  'driverPayType',
  'driverPayRate',
  'dispatcherCommissionType',
  'dispatcherCommissionRate',
  'feeIncludesAccessorials',
  'payFromNet',
] as const;

const toScalar = (value: unknown): ScalarValue => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  // Prisma Decimal has toString(); also covers Date defensively though no Date here.
  if (typeof value === 'object' && 'toString' in value) {
    return (value as { toString(): string }).toString();
  }
  return String(value);
};

const isPresent = (value: unknown): boolean => value !== undefined;

const equalAsScalar = (a: unknown, b: unknown): boolean => toScalar(a) === toScalar(b);

export const updateDispatchTerms = async (
  input: UpdateDispatchTermsInput,
  deps: UpdateDispatchTermsDeps,
): Promise<UpdateDispatchTermsResult> => {
  const existing = await deps.loadRepository.findById(input.loadId, input.organizationId);
  if (!existing) {
    throw new NotFoundError(`Load with id ${input.loadId} not found`);
  }

  if (deps.settlementFreezeQuery !== undefined) {
    const isFrozen = await deps.settlementFreezeQuery.hasNonDraftSettlementForLoad(
      input.loadId,
      input.organizationId,
    );
    if (isFrozen) {
      throw new ConflictError(
        'Cannot modify dispatch terms: a settlement referencing this load has been approved or paid.',
      );
    }
  }

  // Only forward fields that the caller actually provided (undefined === skip).
  const provided: UpdateDispatchTermsFields = {};
  const changes: Record<string, { old: ScalarValue; new: ScalarValue }> = {};
  const existingRecord = existing as unknown as Record<string, unknown>;
  const inputRecord = input.fields as Record<string, unknown>;
  const providedRecord = provided as Record<string, unknown>;

  DISPATCH_TERMS_FIELDS.forEach((field) => {
    const next = inputRecord[field];
    if (!isPresent(next)) {
      return;
    }
    providedRecord[field] = next;
    const prev = existingRecord[field];
    if (!equalAsScalar(prev, next)) {
      changes[field] = { old: toScalar(prev), new: toScalar(next) };
    }
  });

  if (Object.keys(provided).length === 0) {
    // No-op — caller passed an empty fields object somehow. Return as-is.
    return { load: existing };
  }

  const updated = await deps.loadRepository.update(input.loadId, provided);

  deps.logger.info('Dispatch terms updated', {
    loadId: input.loadId,
    organizationId: input.organizationId,
    requestingUserId: input.requestingUserId,
    changedFields: Object.keys(changes),
  });

  if (Object.keys(changes).length > 0) {
    await deps.eventBus
      .publish('load.dispatch-terms.updated', {
        loadId: input.loadId,
        organizationId: input.organizationId,
        loadNumber: updated.loadNumber,
        requestingUserId: input.requestingUserId,
        changes,
      })
      .catch((error: unknown) => {
        deps.logger.error('Failed to publish load.dispatch-terms.updated', {
          loadId: input.loadId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }

  return { load: updated };
};
