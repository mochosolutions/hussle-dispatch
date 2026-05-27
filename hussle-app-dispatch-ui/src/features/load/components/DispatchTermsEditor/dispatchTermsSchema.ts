import * as Yup from 'yup';
import type { DispatchFeeType, DispatcherCommType, DriverPayType } from '../../types';

export const DISPATCH_FEE_TYPE_OPTIONS: { value: DispatchFeeType; label: string }[] = [
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'FLAT', label: 'Flat' },
];

export const DRIVER_PAY_TYPE_OPTIONS: { value: DriverPayType; label: string }[] = [
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'PER_MILE', label: 'Per Mile' },
  { value: 'PER_HOUR', label: 'Per Hour' },
  { value: 'FLAT_RATE', label: 'Flat Rate' },
];

export const DISPATCHER_COMM_TYPE_OPTIONS: { value: DispatcherCommType; label: string }[] = [
  { value: 'PERCENTAGE_OF_MARGIN', label: '% of Margin' },
  { value: 'PERCENTAGE_OF_GROSS', label: '% of Gross' },
  { value: 'FLAT_PER_LOAD', label: 'Flat per Load' },
];

/**
 * Per-load dispatch terms — mirrors the API's dispatchTermsValidator.
 *
 * `dispatchFeeAmount` is a dual-semantic field:
 *   - PERCENTAGE → 0-100 (percent)
 *   - FLAT       → dollar amount
 *
 * The drawer surfaces this by switching the field label/component based on
 * dispatchFeeType.
 */
export const dispatchTermsSchema = Yup.object({
  dispatchFeeType: Yup.mixed<DispatchFeeType>()
    .oneOf(['PERCENTAGE', 'FLAT'])
    .required('Dispatch fee type is required'),
  dispatchFeeAmount: Yup.number()
    .min(0, 'Dispatch fee must be non-negative')
    .when('dispatchFeeType', {
      is: 'PERCENTAGE',
      then: (schema) => schema.max(100, 'Percent must be 0-100'),
    })
    .required('Dispatch fee is required'),
  partnerSplitPercent: Yup.number()
    .min(0, 'Partner split must be 0-100')
    .max(100, 'Partner split must be 0-100')
    .nullable(),
  driverPayType: Yup.mixed<DriverPayType>()
    .oneOf(['PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE'])
    .nullable(),
  driverPayRate: Yup.number().min(0, 'Driver pay rate must be non-negative').nullable(),
  dispatcherCommissionType: Yup.mixed<DispatcherCommType>()
    .oneOf(['PERCENTAGE_OF_MARGIN', 'PERCENTAGE_OF_GROSS', 'FLAT_PER_LOAD'])
    .nullable(),
  dispatcherCommissionRate: Yup.number()
    .min(0, 'Dispatcher commission rate must be non-negative')
    .nullable(),
  feeIncludesAccessorials: Yup.boolean().required(),
  payFromNet: Yup.boolean().required(),
});

export type DispatchTermsFormValues = Yup.InferType<typeof dispatchTermsSchema>;
