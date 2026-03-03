import * as Yup from 'yup';
import { SubscriptionTier } from '@prisma/client';
import { emailValidation, longerNameValidation } from '@/shared/validators';

export const getOrganizationValidator = Yup.object({
  params: Yup.object({
    tenantId: Yup.string().required('Tenant ID param is required').trim(),
  }),
});

export const updateOrganizationValidator = Yup.object({
  body: Yup.object({
    email: emailValidation.optional(),
    name: longerNameValidation('Organization Name').notRequired(),
    subscriptionTier: Yup.mixed<SubscriptionTier>()
      .oneOf(Object.values(SubscriptionTier), 'Invalid subscription tier')
      .optional(),
    tenantPhone: Yup.string()
      .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional(),
  }),
});

export const deleteOrganizationValidator = Yup.object({
  params: Yup.object({
    tenantId: Yup.string().required('Tenant ID param is required').trim(),
  }),
});
