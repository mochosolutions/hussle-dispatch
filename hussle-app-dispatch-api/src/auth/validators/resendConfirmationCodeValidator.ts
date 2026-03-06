import * as Yup from 'yup';
import { emailValidation } from '@/shared/validators';

export const resendConfirmationCodeValidator = Yup.object({
  email: emailValidation.required(),
});

export const resendConfirmationCodeObjValidator = Yup.object({
  body: resendConfirmationCodeValidator,
});
