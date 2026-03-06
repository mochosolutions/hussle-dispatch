import React, { useMemo } from 'react';
import { useFormik } from 'formik';
import { Box, Grid } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import { signupRequest } from '../../store/authSlice';
import { isSignupPageLoadingSelector } from '../../store/selectors/signupSelector';
import { registerValidation } from 'features/auth/validators/authValidators';

import {
  TextField,
  EmailField,
  PasswordFieldWithStrength,
  SubmitButton,
  TermsNotice,
  FormError,
  type FormikFieldProps,
} from 'mocho/components/form-fields';

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  name: string;
  password: string;
  submit: string | null;
}

const AuthRegister = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(isSignupPageLoadingSelector);

  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      name: '',
      password: '',
      submit: null,
    },
    validationSchema: registerValidation,
    onSubmit: async (values) => {
      try {
        const { firstName, lastName, email, name, password } = values;
        dispatch(
          signupRequest({
            email,
            password,
            firstName,
            lastName,
            name,
          }),
        );
      } catch (err) {
        console.error(err);
      }
    },
  });

  // Create formik props object for form-field components
  const formikProps = useMemo<FormikFieldProps>(
    () => ({
      values: formik.values as unknown as Record<string, unknown>,
      errors: formik.errors,
      touched: formik.touched,
      handleChange: formik.handleChange,
      handleBlur: formik.handleBlur,
      setFieldValue: formik.setFieldValue,
    }),
    [formik.values, formik.errors, formik.touched, formik.handleChange, formik.handleBlur, formik.setFieldValue]
  );

  return (
    <Box component="form" noValidate onSubmit={formik.handleSubmit}>
      <Grid container spacing={3}>
        {/* First Name */}
        <Grid item xs={12} md={6}>
          <TextField
            name="firstName"
            label="First Name"
            placeholder="John"
            required
            formik={formikProps}
          />
        </Grid>

        {/* Last Name */}
        <Grid item xs={12} md={6}>
          <TextField
            name="lastName"
            label="Last Name"
            placeholder="Doe"
            required
            formik={formikProps}
          />
        </Grid>

        {/* Company Name */}
        <Grid item xs={12}>
          <TextField
            name="name"
            label="Company Name"
            placeholder="Demo Inc."
            required
            formik={formikProps}
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12}>
          <EmailField
            name="email"
            label="Email Address"
            placeholder="demo@company.com"
            required
            formik={formikProps}
          />
        </Grid>

        {/* Password with Strength Meter */}
        <Grid item xs={12}>
          <PasswordFieldWithStrength
            name="password"
            label="Password"
            placeholder="******"
            required
            formik={formikProps}
          />
        </Grid>

        {/* Form Error */}
        <FormError error={formik.errors.submit as string | undefined} />

        {/* Submit Button */}
        <Grid item xs={12}>
          <SubmitButton
            label="Create Account"
            loading={isLoading}
            disabled={isLoading}
          />
        </Grid>

        {/* Terms Notice */}
        <Grid item xs={12}>
          <TermsNotice
            termsLink="#"
            privacyLink="#"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthRegister;
