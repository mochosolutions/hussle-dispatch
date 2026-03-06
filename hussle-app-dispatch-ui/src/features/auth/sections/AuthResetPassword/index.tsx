import React, { useMemo } from 'react';
import { useFormik } from 'formik';
import { Box, Grid } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import { confirmPasswordResetRequest } from '../../store/authSlice';
import { isConfirmPasswordResetLoadingSelector } from '../../store/selectors';
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

const AuthResetPassword = () => {
  const dispatch = useDispatch();
  const submitting = useSelector(isConfirmPasswordResetLoadingSelector);

  const formik = useFormik<ResetPasswordFormValues>({
    initialValues: {
      password: '',
      confirmPassword: '',
      confirmationCode: '',
      submit: null,
    },
    validationSchema: confirmationCodeValidation,
    onSubmit: async (values) => {
      try {
        dispatch(
          confirmPasswordResetRequest({
            confirmationCode: values.confirmationCode,
            newPassword: values.password,
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
        {/* Confirmation Code */}
        <Grid item xs={12}>
          <TextField
            name="confirmationCode"
            label="Code"
            placeholder="Enter code"
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
            required
            formik={formikProps}
          />
        </Grid>

        {/* Confirm Password */}
        <Grid item xs={12}>
          <ConfirmPasswordField
            name="confirmPassword"
            label="Confirm Password"
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
