import * as Yup from 'yup';
import { emailValidation, passwordValidation } from '@/shared/validators';

export const passwordChallengeSchema = Yup.object({
  email: emailValidation.required(),
  password: passwordValidation.required(),
  session: Yup.string().required().trim().required(),
});

export const passwordChallengeObjValidator = Yup.object({
  body: passwordChallengeSchema,
});
