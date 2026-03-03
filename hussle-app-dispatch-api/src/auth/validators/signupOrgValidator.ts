import * as Yup from 'yup';
import { OrganizationRole, OrganizationVertical } from '@prisma/client';
import { emailValidation, passwordValidation } from '@/shared/validators';

export const signupOrganizationSchema = Yup.object({
  email: emailValidation.required(),
  password: passwordValidation.required(),
  firstName: Yup.string().trim().required(),
  lastName: Yup.string().trim().required(),
  orgName: Yup.string().trim().required(),
  orgRole: Yup.string()
    .trim()
    .oneOf(Object.values(OrganizationRole), 'Invalid organization role')
    .optional(),
  orgVertical: Yup.string()
    .trim()
    .oneOf(Object.values(OrganizationVertical), 'Invalid organization vertical')
    .optional(),
  customMetadata: Yup.object().optional(),
});

export const signupRequestObjValidator = Yup.object({
  body: signupOrganizationSchema,
});
