import * as Yup from 'yup';
import { emailValidation } from '@/shared/validators';

export const acceptInviteValidator = Yup.object({
  body: Yup.object({
    email: emailValidation.required(),
    password: Yup.string().min(8, 'Password must be at least 8 characters').required(),
    firstName: Yup.string().trim().min(1, 'First name is required').required(),
    lastName: Yup.string().trim().min(1, 'Last name is required').required(),
    role: Yup.string().required(),
    invitationToken: Yup.string().required(),
    organizationId: Yup.string().required(),
    userOrganizationId: Yup.string().required(),
  }),
});
