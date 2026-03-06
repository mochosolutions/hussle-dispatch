import React, { useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Grid, Stack, Typography } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import { codeConfirmationRequest, resendCodeRequest } from 'features/auth/store/authSlice';
import { isConfirmCodeLoadingSelector } from 'features/auth/store/selectors';

import {
  OTPField,
  SubmitButton,
  SecondaryButton,
  type FormikFieldProps,
} from 'mocho/components/form-fields';

const validationSchema = Yup.object().shape({
  confirmationCode: Yup.string().required('OTP is required').length(6, 'OTP must be 6 digits'),
});

interface CodeVerificationFormValues {
  confirmationCode: string;
}

const AuthCodeVerification = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(isConfirmCodeLoadingSelector);

  const formik = useFormik<CodeVerificationFormValues>({
    initialValues: {
      confirmationCode: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        dispatch(
          codeConfirmationRequest({
            confirmationCode: values.confirmationCode,
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
    [
      formik.values,
      formik.errors,
      formik.touched,
      formik.handleChange,
      formik.handleBlur,
      formik.setFieldValue,
    ],
  );

  const handleResendCode = () => {
    dispatch(resendCodeRequest());
  };

  return (
    <Box component="form" noValidate onSubmit={formik.handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <OTPField name="confirmationCode" numDigits={6} formik={formikProps} />
        </Grid>

        <Grid item xs={12}>
          <SubmitButton label="Continue" loading={isLoading} disabled={isLoading} />
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography>Did not receive the email? Check your spam filter, or</Typography>
            <SecondaryButton label="Resend code" onClick={handleResendCode} />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthCodeVerification;
