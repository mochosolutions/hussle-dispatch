import * as yup from 'yup';

export const inviteDriverSchema = yup.object({
  params: yup.object({
    driverId: yup.string().uuid().required(),
  }),
});

export const acceptDriverInviteSchema = yup.object({
  params: yup.object({
    token: yup.string().required(),
  }),
  body: yup.object({
    password: yup.string().required().min(8),
    email: yup.string().email().optional(),
  }),
});

export const loginDriverSchema = yup.object({
  body: yup.object({
    email: yup.string().email().required(),
    password: yup.string().required(),
  }),
});
