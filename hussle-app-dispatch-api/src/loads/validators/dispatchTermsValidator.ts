import {
  DispatchFeeType,
  DispatcherCommType,
  DriverPayType,
} from '@prisma/client';
import * as Yup from 'yup';

const dispatchFeeTypeValues = Object.values(DispatchFeeType);
const driverPayTypeValues = Object.values(DriverPayType);
const dispatcherCommTypeValues = Object.values(DispatcherCommType);

const optionalNonNegativeDecimal = Yup.number()
  .min(0, 'must be non-negative')
  .nullable()
  .notRequired();

/**
 * PATCH /loads/:id/dispatch-terms — body validator.
 *
 * All 9 fields are optional (partial update). Note the dual semantic on
 * `dispatchFeeAmount`:
 *   - PERCENTAGE → percent value 0-100 (e.g. 10 = 10%)
 *   - FLAT       → dollar amount (e.g. 250 = $250)
 *
 * Convention is established by US-09/US-10. The drawer surfaces it via the
 * field label switching between "Percent (%)" and "Amount ($)".
 */
const dispatchTermsBody = Yup.object({
  dispatchFeeType: Yup.mixed<DispatchFeeType>()
    .oneOf(dispatchFeeTypeValues, 'dispatchFeeType must be PERCENTAGE or FLAT')
    .nullable()
    .notRequired(),
  dispatchFeeAmount: Yup.number()
    .min(0, 'dispatchFeeAmount must be non-negative')
    .when('dispatchFeeType', {
      is: DispatchFeeType.PERCENTAGE,
      then: (schema) =>
        schema.max(100, 'dispatchFeeAmount must be 0-100 when dispatchFeeType is PERCENTAGE'),
    })
    .nullable()
    .notRequired(),
  partnerSplitPercent: Yup.number()
    .min(0, 'partnerSplitPercent must be 0-100')
    .max(100, 'partnerSplitPercent must be 0-100')
    .nullable()
    .notRequired(),
  driverPayType: Yup.mixed<DriverPayType>()
    .oneOf(
      driverPayTypeValues,
      'driverPayType must be one of PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE',
    )
    .nullable()
    .notRequired(),
  driverPayRate: optionalNonNegativeDecimal,
  dispatcherCommissionType: Yup.mixed<DispatcherCommType>()
    .oneOf(
      dispatcherCommTypeValues,
      'dispatcherCommissionType must be one of PERCENTAGE_OF_MARGIN, PERCENTAGE_OF_GROSS, FLAT_PER_LOAD',
    )
    .nullable()
    .notRequired(),
  dispatcherCommissionRate: optionalNonNegativeDecimal,
  feeIncludesAccessorials: Yup.boolean().nullable().notRequired(),
  payFromNet: Yup.boolean().nullable().notRequired(),
}).test('has-any-field', 'At least one field must be provided', (value) => {
  if (value === undefined) {
    return false;
  }
  return Object.keys(value).length > 0;
});

export const dispatchTermsValidator = Yup.object({
  body: dispatchTermsBody,
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});
