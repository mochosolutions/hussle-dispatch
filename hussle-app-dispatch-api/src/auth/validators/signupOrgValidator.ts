import * as Yup from 'yup';
import type { AuthEnumConfig } from '../types/authEnumConfig';
import { emailValidation, passwordValidation } from '@/shared/validators';

export const createSignupOrgValidator = (enumConfig: AuthEnumConfig) => {
  const signupOrganizationSchema = Yup.object({
    email: emailValidation.required(),
    password: passwordValidation.required(),
    firstName: Yup.string().trim().required(),
    lastName: Yup.string().trim().required(),
    orgName: Yup.string().trim().required(),
    orgRole: Yup.string()
      .trim()
      .oneOf([...enumConfig.organizationRole.values], 'Invalid organization role')
      .optional(),
    orgVertical: Yup.string()
      .trim()
      .oneOf([...enumConfig.organizationVertical.values], 'Invalid organization vertical')
      .optional(),
    customMetadata: Yup.object().optional(),
  });

  const signupRequestObjValidator = Yup.object({
    body: signupOrganizationSchema,
  });

  return { signupOrganizationSchema, signupRequestObjValidator };
};
