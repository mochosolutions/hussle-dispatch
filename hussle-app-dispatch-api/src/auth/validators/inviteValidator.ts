import * as Yup from 'yup';
import { emailValidation, longerNameValidation, passwordValidation } from '@/shared/validators';
import { CreateOrganizationInput } from '../types/organizationTypes';

export const organizationIdSchema = Yup.object({
  organizationId: Yup.string().required('Organization ID is required').trim(),
});

export const inviteUserSchema = Yup.object({
  email: Yup.string().email().required(),
  role: Yup.string().required(),
});

export const signupInvitedUserValidator = Yup.object({
  email: Yup.string().email().required(),
  password: Yup.string().min(8).max(128).required(),
  firstName: Yup.string().min(1).max(50).required(),
  lastName: Yup.string().min(1).max(50).required(),
  role: Yup.string().min(1).max(50).required(),
  invitationToken: Yup.string().min(10).max(256).required(),
  organizationId: Yup.string().required(),
  userOrganizationId: Yup.string().required(),
});

export const inviteUserValidator = Yup.object({
  body: inviteUserSchema,
  params: organizationIdSchema,
});

export const verifyInviteValidator = Yup.object({
  params: organizationIdSchema,
});
