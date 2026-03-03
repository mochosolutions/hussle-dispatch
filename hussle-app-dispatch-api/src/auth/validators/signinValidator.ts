import * as Yup from 'yup';
import { emailValidation, passwordValidation } from '@/shared/validators';

export const signinSchema = Yup.object({
  email: emailValidation,
  password: passwordValidation,
});

export const signinObjValidator = Yup.object({
  body: signinSchema,
});
