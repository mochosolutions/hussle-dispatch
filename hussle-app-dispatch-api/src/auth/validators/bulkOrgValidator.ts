/**
 * Organization Bulk Operations Validators
 *
 * Yup schemas for validating bulk organization operation payloads.
 */

import * as yup from 'yup';

/**
 * Schema for bulk status update
 * Validates organizationIds array and status value
 */
export const bulkUpdateOrgStatusSchema = yup
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
export const bulkUpdateOrgFieldSchema = yup
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
            ['LOGISTICS', 'HEALTHCARE', 'STAFFING'],
            'Vertical must be LOGISTICS, HEALTHCARE, or STAFFING'
          ),
      })
      .when('field', {
        is: 'subscriptionTier',
        then: (schema) =>
          schema.oneOf(
            ['FREE', 'PRO', 'ENTERPRISE'],
            'Subscription tier must be FREE, PRO, or ENTERPRISE'
          ),
      }),
  })
  .strict();

/**
 * Schema for bulk delete organizations
 * Validates organizationIds array
 */
export const bulkDeleteOrgsSchema = yup
  .object({
    organizationIds: yup
      .array()
      .of(yup.string().required('Organization ID is required'))
      .min(1, 'At least one organization ID is required')
      .required('Organization IDs array is required'),
  })
  .strict();

export type BulkUpdateOrgStatusInput = yup.InferType<typeof bulkUpdateOrgStatusSchema>;
export type BulkUpdateOrgFieldInput = yup.InferType<typeof bulkUpdateOrgFieldSchema>;
export type BulkDeleteOrgsInput = yup.InferType<typeof bulkDeleteOrgsSchema>;
