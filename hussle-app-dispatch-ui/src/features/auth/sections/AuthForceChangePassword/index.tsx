import React, { useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Grid } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import { forceChangePasswordRequest } from 'features/auth/store/authSlice';
import { isForceChangePasswordLoadingSelector } from 'features/auth/store/selectors';

import {
  PasswordFieldWithChecklist,
  ConfirmPasswordField,
  SubmitButton,
  FormError,
  type FormikFieldProps,
} from 'mocho/components/form-fields';

const validationSchema = Yup.object().shape({
  password: Yup.string()
    .trim()
    .max(255)
    .required('Password is required')
    .min(8, 'Password is too short'),
  confirmPassword: Yup.string()
    .trim()
    .required('Confirm Password is required')
    .test(
      'confirmPassword',
      'Both Password must be match!',
      (confirmPassword, yup) => yup.parent.password === confirmPassword,
    ),
});

interface ForceChangePasswordFormValues {
  password: string;
  confirmPassword: string;
  submit: string | null;
}

const AuthForceChangePassword = () => {
  const dispatch = useDispatch();
  const submitting = useSelector(isForceChangePasswordLoadingSelector);

  const formik = useFormik<ForceChangePasswordFormValues>({
    initialValues: {
      password: '',
      confirmPassword: '',
      submit: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const { password } = values;
        dispatch(forceChangePasswordRequest({ password }));
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

  return (
    <Box component="form" noValidate onSubmit={formik.handleSubmit}>
      <Grid container spacing={3}>
        {/* Password with Checklist */}
        <Grid item xs={12}>
          <PasswordFieldWithChecklist
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
            formik={formikProps}
          />
        </Grid>

        {/* Form Error */}
        <FormError error={formik.errors.submit as string | undefined} />

        {/* Submit Button */}
        <Grid item xs={12}>
          <SubmitButton label="Change Password" loading={submitting} disabled={submitting} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthForceChangePassword;
