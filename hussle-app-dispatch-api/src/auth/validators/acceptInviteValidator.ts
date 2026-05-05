import * as Yup from 'yup';
import { passwordValidation } from '@/shared/validators';

export const acceptInviteValidator = Yup.object({
  body: Yup.object({
    invitationToken: Yup.string().required(),
    password: passwordValidation,
  }),
});
