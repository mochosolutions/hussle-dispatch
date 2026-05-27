import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';
import type {
  UpdateDispatchTermsFields,
  UpdateDispatchTermsInput,
} from '../../services/updateDispatchTermsService';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { getRequiredLoadIdMapper } from './getRequiredLoadIdMapper';

const FIELD_NAMES: (keyof UpdateDispatchTermsFields)[] = [
  'dispatchFeeType',
  'dispatchFeeAmount',
  'partnerSplitPercent',
  'driverPayType',
  'driverPayRate',
  'dispatcherCommissionType',
  'dispatcherCommissionRate',
  'feeIncludesAccessorials',
  'payFromNet',
];

export const dispatchTermsMapper = (req: Request): UpdateDispatchTermsInput => {
  const { organizationId } = getRequestContextMapper(req);
  const loadId = getRequiredLoadIdMapper(req);
  const userId = req.user?.userId;
  if (userId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const fields: UpdateDispatchTermsFields = {};

  FIELD_NAMES.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      (fields as Record<string, unknown>)[field] = body[field];
    }
  });

  return {
    loadId,
    organizationId,
    requestingUserId: userId,
    fields,
  };
};
