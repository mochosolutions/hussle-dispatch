import * as Yup from 'yup';
import { emailValidation } from '@/shared/validators';

export const confirmUserValidator = Yup.object({
  email: emailValidation.required(),
  confirmationCode: Yup.string().required().trim(),
});

export const confirmUserObjValidator = Yup.object({
  body: confirmUserValidator,
});
