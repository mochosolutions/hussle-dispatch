import * as Yup from 'yup';

export const passwordValidation = Yup.string()
  .min(8, 'Password must be at least 8 characters long')
  .matches(/[0-9]/, 'Password must contain at least one number')
  .matches(/[!@#$%^&*(),.?":{}|<>;]/, 'Password must contain at least one special character')
  .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
  .required('Password is required');

export const nameValidation = (fieldName: string) =>
  Yup.string()
    .trim()
    .min(2, `${fieldName} must be at least 2 characters long`)
    .max(50, `${fieldName} must be at most 50 characters long`);

export const longerNameValidation = (fieldName: string) =>
  Yup.string()
    .required(`${fieldName} is required`)
    .trim()
    .min(2, `${fieldName} must be at least 2 characters long`)
    .max(100, `${fieldName} must be at most 100 characters long`);

export const emailValidation = Yup.string()
  .email('Invalid email address')
  .trim()
  .lowercase()
  .required('Email is required');

export const signinValidator = Yup.object({
  body: Yup.object({
    email: emailValidation,
    password: passwordValidation,
  }),
});

export const newPasswordValidator = Yup.object({
  body: Yup.object({
    email: emailValidation,
    password: passwordValidation,
    session: Yup.string().required().trim(),
  }),
});

export const logoutValidator = Yup.object({
  body: Yup.object({
    accessToken: Yup.string().required().trim(),
  }),
});

export const refreshTokenValidator = Yup.object({
  body: Yup.object({
    refreshToken: Yup.string().required('Refresh token is required').trim(),
  }),
});

export const getUserValidator = Yup.object({
  params: Yup.object({
    userId: Yup.string().required('User ID param is required').trim(),
  }),
});

export const updateUserValidator = Yup.object({
  body: Yup.object({
    firstName: nameValidation('First Name').notRequired(),
    lastName: nameValidation('Last Name').notRequired(),
  }),
  params: Yup.object({
    userId: Yup.string().required('User ID param is required').trim(),
  }),
});

export type ValidationSchema = Yup.ObjectSchema<Record<string, unknown>>;
