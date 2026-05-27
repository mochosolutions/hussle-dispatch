import * as Yup from 'yup';

export const passwordValidation = Yup.string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters long')
  .matches(/[0-9]/, 'Password must contain at least one number')
  .matches(
    /[!@#$%^&*(),.?":{}|<>]/,
    'Password must contain at least one special character',
  )
  .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .matches(/[a-z]/, 'Password must contain at least one lowercase letter');

export const nameValidation = (fieldName: string) =>
  Yup.string()
    .required(`${fieldName} is required`)
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
  .required('Email is required')
  .trim()
  .lowercase();

export const registerValidation = Yup.object({
  email: emailValidation,
  password: passwordValidation,
  firstName: nameValidation('First Name'),
  lastName: nameValidation('Last Name'),
  name: longerNameValidation('Company Name'),
});

export const updateValidation = Yup.object({
  contactEmail: emailValidation.optional().nullable().notOneOf(['', null], 'Email cannot be empty or null'),
  name: longerNameValidation('Company Name').optional().nullable().notOneOf(['', null], 'Company Name cannot be empty or null'),
});


export const loginValidation = Yup.object().shape({
  email: emailValidation,
  password: passwordValidation,
  rememberMe: Yup.boolean().optional(),
});

export const confirmationCodeValidation = Yup.object({
  password: passwordValidation,
  confirmPassword: Yup.string()
    .required('Confirm Password is required')
    .test(
      'confirmPassword',
      'Both Password must be match!',
      (confirmationCode, yup) => yup.parent.password === confirmationCode,
    ),

  confirmationCode: Yup.string()
    .required('OTP is required')
    .length(6, 'OTP must be 6 digits'),
});

export const initiatePasswordResetValidation = Yup.object().shape({
  email: emailValidation,
});
