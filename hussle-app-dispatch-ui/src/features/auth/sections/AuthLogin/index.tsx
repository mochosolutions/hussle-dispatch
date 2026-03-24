import React, { useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Grid, Stack, Box } from '@mui/material';
import { useFormik } from 'formik';

import { useDispatch, useSelector } from 'store';
import { loginRequest } from 'features/auth/store/authSlice';
import { isLoginPageLoadingSelector } from 'features/auth/store/selectors';
import { loginValidation } from 'features/auth/validators/authValidators';

import {
  EmailField,
  PasswordField,
  CheckboxField,
  SubmitButton,
  FormLink,
  FormError,
  type FormikFieldProps,
} from 'mocho/components/form-fields';

interface LocationState {
  from?: { pathname: string };
}

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
  submit: string | null;
}

const AuthLogin = () => {
  const dispatch = useDispatch();

  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Prefer query param returnTo, fall back to router state from AuthGuard redirect
  const locationState = location.state as LocationState | null;
  const returnTo = searchParams.get('returnTo') ?? locationState?.from?.pathname ?? null;
  const submitting = useSelector(isLoginPageLoadingSelector);

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
      submit: null,
    },
    validationSchema: loginValidation,
    onSubmit: async (values) => {
      const { email, password, rememberMe } = values;
      try {
        dispatch(
          loginRequest({
            data: { email, password, rememberMe },
            returnTo,
          }),
        );
      } catch {
        // Login errors are handled by the saga via loginFailure action
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
    [
      formik.values,
      formik.errors,
      formik.touched,
      formik.handleChange,
      formik.handleBlur,
      formik.setFieldValue,
    ],
  );

  return (
    <Box component="form" noValidate onSubmit={formik.handleSubmit}>
      <Grid container spacing={3}>
        {/* Email Field */}
        <Grid item xs={12}>
          <EmailField name="email" label="Email Address" autoComplete="email" required formik={formikProps} />
        </Grid>

        {/* Password Field */}
        <Grid item xs={12}>
          <PasswordField name="password" label="Password" autoComplete="current-password" required formik={formikProps} />
        </Grid>

        {/* Remember Me & Create Account Link */}
        <Grid item xs={12} sx={{ mt: -1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <CheckboxField name="rememberMe" label="Remember Me" formik={formikProps} />
            <FormLink label="Create an account" to="/register" underline />
          </Stack>
        </Grid>

        {/* Forgot Password Link */}
        <Grid item xs={12} sx={{ mt: -1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <FormLink label="Forgot Password?" to="/forgot-password" color="text.primary" />
          </Stack>
        </Grid>

        {/* Form Error */}
        <FormError error={formik.errors.submit as string | undefined} />

        {/* Submit Button */}
        <Grid item xs={12}>
          <SubmitButton label="Login" loading={submitting} disabled={submitting} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthLogin;
