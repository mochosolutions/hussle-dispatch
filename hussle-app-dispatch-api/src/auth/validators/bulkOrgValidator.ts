/**
 * Organization Bulk Operations Validators
 *
 * Yup schemas for validating bulk organization operation payloads.
 */

import * as yup from 'yup';
import type { AuthEnumConfig } from '../types/authEnumConfig';

export const createBulkOrgValidators = (enumConfig: AuthEnumConfig) => {
  /**
   * Schema for bulk status update
   * Validates organizationIds array and status value
   */
  const bulkUpdateOrgStatusSchema = yup
    .object({
      organizationIds: yup
        .array()
        .of(yup.string().required('Organization ID is required'))
        .min(1, 'At least one organization ID is required')
        .required('Organization IDs array is required'),
      status: yup
        .string()
        .oneOf(['PENDING', 'ACTIVE', 'SUSPENDED'], 'Status must be PENDING, ACTIVE, or SUSPENDED')
        .required('Status is required'),
    })
    .strict();

  /**
   * Schema for bulk field update
   * Validates organizationIds array and field/value pair
   */
  const bulkUpdateOrgFieldSchema = yup
    .object({
      organizationIds: yup
        .array()
        .of(yup.string().required('Organization ID is required'))
        .min(1, 'At least one organization ID is required')
        .required('Organization IDs array is required'),
      field: yup
        .string()
        .oneOf(['vertical', 'subscriptionTier'], 'Field must be vertical or subscriptionTier')
        .required('Field is required'),
      value: yup
        .string()
        .required('Value is required')
        .when('field', {
          is: 'vertical',
          then: (schema) =>
            schema.oneOf(
              [...enumConfig.organizationVertical.values],
              'Invalid organization vertical'
            ),
        })
        .when('field', {
          is: 'subscriptionTier',
          then: (schema) =>
            schema.oneOf(
              [...enumConfig.subscriptionTier.values],
              'Invalid subscription tier'
            ),
        }),
    })
    .strict();

  /**
   * Schema for bulk delete organizations
   * Validates organizationIds array
   */
  const bulkDeleteOrgsSchema = yup
    .object({
      organizationIds: yup
        .array()
        .of(yup.string().required('Organization ID is required'))
        .min(1, 'At least one organization ID is required')
        .required('Organization IDs array is required'),
    })
    .strict();

  return {
    bulkUpdateOrgStatusSchema,
    bulkUpdateOrgFieldSchema,
    bulkDeleteOrgsSchema,
  };
};

/** Re-export types for consumers that need the inferred types */
export interface BulkUpdateOrgStatusInput {
  organizationIds: string[];
  status: string;
}

export interface BulkUpdateOrgFieldInput {
  organizationIds: string[];
  field: string;
  value: string;
}

export interface BulkDeleteOrgsInput {
  organizationIds: string[];
}
