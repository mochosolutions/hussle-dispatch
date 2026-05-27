import * as Yup from 'yup';
import { emailValidation } from '@/shared/validators';
import type { CreateOrganizationInput } from '../types/organizationTypes';

// Slug validation pattern: lowercase letters, numbers, and hyphens
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reservedSlugs = [
  'admin',
  'api',
  'auth',
  'health',
  'www',
  'app',
  'dashboard',
  'login',
  'logout',
  'register',
  'signup',
  'settings',
  'profile',
  'account',
  'billing',
  'support',
  'help',
  'docs',
  'blog',
];

export const createOrganizationSchema = Yup.object({
  name: Yup.string().min(2).required(),
  slug: Yup.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .matches(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .notOneOf(reservedSlugs, 'This slug is reserved')
    .required('Slug is required'),
  email: emailValidation.required(),
  role: Yup.string().required(),
  vertical: Yup.string().required(),
  subscriptionTier: Yup.string().optional(),
  status: Yup.string().optional(),
  customFields: Yup.object().optional(),
  website: Yup.string().url('Invalid URL format').optional().trim(),
  description: Yup.string().optional().trim(),
  logo: Yup.string().optional().trim(),
  phoneNumber: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .trim(),
  address: Yup.string().optional().trim(),
  resources: Yup.object({
    userPoolId: Yup.string().optional(),
    appClientId: Yup.string().optional(),
    apiGatewayUrl: Yup.string().optional(),
  }).optional(),
});

export const validateCreateOrganization = async (
  input: unknown
): Promise<CreateOrganizationInput> =>
  await createOrganizationSchema.validate(input, {
    abortEarly: false,
    stripUnknown: true,
  });

export const updateOrganizationSchema = Yup.object({
  name: Yup.string().min(2).optional(),
  description: Yup.string().optional().trim(),
  logo: Yup.string().optional().trim(),
  phoneNumber: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .trim(),
  address: Yup.string().optional().trim(),
  website: Yup.string().url('Invalid URL format').optional().trim(),
  customFields: Yup.object().optional(),
});

export const organizationIdSchema = Yup.object({
  organizationId: Yup.string().required('Organization ID is required').trim(),
});

export const membershipParamsSchema = Yup.object({
  organizationId: Yup.string().required('Organization ID is required').trim(),
  membershipId: Yup.string().required('Membership ID is required').trim(),
});

export const createMembershipSchema = Yup.object({
  userId: Yup.string().required(),
  organizationId: Yup.string().required(),
  role: Yup.string().required(),
  status: Yup.string().required(),
});

export const createOrganizationValidator = Yup.object({
  body: createOrganizationSchema,
});

export const updateOrganizationValidator = Yup.object({
  body: updateOrganizationSchema,
  params: organizationIdSchema,
});

export const createMembershipValidator = Yup.object({
  body: Yup.object({
    userId: Yup.string().required(),
    //   organizationId: Yup.string().required(),
    role: Yup.string().required(),
    status: Yup.string().required(),
  }),
  params: organizationIdSchema,
});

export const getMembershipValidator = Yup.object({
  params: organizationIdSchema,
});

export const deleteOrganizationValidator = Yup.object({
  params: organizationIdSchema,
});

export const getOrganizationsByIdValidator = Yup.object({
  params: organizationIdSchema,
});

export const inviteUserSchema = Yup.object({
  users: Yup.array()
    .of(
      Yup.object({
        email: Yup.string().email().required(),
        firstName: Yup.string().min(1).max(50).required(),
        lastName: Yup.string().min(1).max(50).required(),
        role: Yup.string().required(),
      })
    )
    .required(),
});

export const inviteUserValidator = Yup.object({
  body: inviteUserSchema,
  params: organizationIdSchema,
});

export const verifyInviteValidator = Yup.object({
  params: organizationIdSchema,
});

export const updateMembershipValidator = Yup.object({
  body: Yup.object({
    role: Yup.string().optional(),
    status: Yup.string().optional(),
  }),
  params: membershipParamsSchema,
});

export const deleteMembershipValidator = Yup.object({
  params: membershipParamsSchema,
});
