import React, { useMemo } from 'react';
import { useFormik } from 'formik';
import { Box, Grid, Typography } from '@mui/material';
import { useLocation, Navigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'store';
import { confirmPasswordResetRequest } from '../../store/authSlice';
import { isConfirmPasswordResetLoadingSelector } from '../../store/selectors';
import { currentUserEmailSelector } from '../../store/selectors/authSelector';
import { confirmationCodeValidation } from 'features/auth/validators/authValidators';

import {
  TextField,
  PasswordFieldWithStrength,
  ConfirmPasswordField,
  SubmitButton,
  FormError,
  type FormikFieldProps,
} from 'mocho/components/form-fields';

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
  confirmationCode: string;
  submit: string | null;
}

interface LocationState {
  email?: string;
}

const AuthResetPassword = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const submitting = useSelector(isConfirmPasswordResetLoadingSelector);
  const reduxEmail = useSelector(currentUserEmailSelector);

  const locationState = location.state as LocationState | null;
  const email = locationState?.email ?? reduxEmail ?? '';

  const formik = useFormik<ResetPasswordFormValues>({
    initialValues: {
      password: '',
      confirmPassword: '',
      confirmationCode: '',
      submit: null,
    },
    validationSchema: confirmationCodeValidation,
    onSubmit: (values) => {
      dispatch(
        confirmPasswordResetRequest({
          confirmationCode: values.confirmationCode,
          newPassword: values.password,
        }),
      );
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
    [formik.values, formik.errors, formik.touched, formik.handleChange, formik.handleBlur, formik.setFieldValue],
  );

  // Redirect to forgot-password if no email is available
  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <Box component="form" noValidate onSubmit={formik.handleSubmit}>
      <Grid container spacing={3}>
        {/* Email Display */}
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            Enter the code sent to <strong>{email}</strong>
          </Typography>
        </Grid>

        {/* Confirmation Code */}
        <Grid item xs={12}>
          <TextField
            name="confirmationCode"
            label="Code"
            placeholder="Enter code"
            autoComplete="one-time-code"
            required
            formik={formikProps}
          />
        </Grid>

        {/* Password with Strength Meter */}
        <Grid item xs={12}>
          <PasswordFieldWithStrength
            name="password"
            label="Password"
            placeholder="Enter password"
            autoComplete="new-password"
            required
            formik={formikProps}
          />
        </Grid>

        {/* Confirm Password */}
        <Grid item xs={12}>
          <ConfirmPasswordField
            name="confirmPassword"
            label="Confirm Password"
            autoComplete="new-password"
            required
            enableToggle={false}
            formik={formikProps}
          />
        </Grid>

        {/* Form Error */}
        <FormError error={formik.errors.submit as string | undefined} />

        {/* Submit Button */}
        <Grid item xs={12}>
          <SubmitButton
            label="Reset Password"
            loading={submitting}
            disabled={submitting}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthResetPassword;
