import * as Yup from 'yup';
import { emailValidation, passwordValidation } from '@/shared/validators';

export const confirmForgotPasswordObjValidator = Yup.object({
  body: Yup.object({
    email: emailValidation,
    confirmationCode: Yup.string().required().trim(),
    newPassword: passwordValidation,
  }),
});
