import React, { useMemo } from 'react';
import { useFormik } from 'formik';
import { Box, Grid } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import { initiatePasswordResetRequest } from '../../store/authSlice';
import { isInitatePassResetLoadingSelector } from '../../store/selectors';
import { initiatePasswordResetValidation } from 'features/auth/validators/authValidators';

import {
  EmailField,
  SubmitButton,
  FormError,
  HelperText,
  type FormikFieldProps,
} from 'mocho/components/form-fields';

interface ForgotPasswordFormValues {
  email: string;
  submit: string | null;
}

const AuthForgotPassword = () => {
  const dispatch = useDispatch();
  const submitting = useSelector(isInitatePassResetLoadingSelector);

  const formik = useFormik<ForgotPasswordFormValues>({
    initialValues: {
      email: '',
      submit: null,
    },
    validationSchema: initiatePasswordResetValidation,
    onSubmit: async (values) => {
      try {
        dispatch(initiatePasswordResetRequest({ email: values.email }));
      } catch (_err: unknown) {
        // Error handled by saga
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
        {/* Email Field */}
        <Grid item xs={12}>
          <EmailField
            name="email"
            label="Email Address"
            autoComplete="email"
            required
            formik={formikProps}
          />
        </Grid>

        {/* Form Error */}
        <FormError error={formik.errors.submit as string | undefined} />

        {/* Helper Text */}
        <Grid item xs={12} sx={{ mb: -2 }}>
          <HelperText text="Do not forget to check SPAM box." />
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <SubmitButton
            label="Send Password Reset Email"
            loading={submitting}
            disabled={submitting}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthForgotPassword;
