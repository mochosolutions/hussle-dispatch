import * as Yup from 'yup';
import { emailValidation } from '@/shared/validators';

export const forgotPasswordObjValidator = Yup.object({
  body: Yup.object({
    email: emailValidation,
  }),
});
