import React, { useMemo } from 'react';
import { useFormik } from 'formik';
import { Box, Grid } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import { signupRequest } from '../../store/authSlice';
import { isSignupPageLoadingSelector } from '../../store/selectors/signupSelector';
import { registerValidation } from 'features/auth/validators/authValidators';

import {
  TextField,
  SelectField,
  EmailField,
  PasswordFieldWithChecklist,
  ConfirmPasswordField,
  SubmitButton,
  TermsNotice,
  FormError,
  type FormikFieldProps,
} from 'mocho/components/form-fields';

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  orgName: string;
  orgRole: string;
  mcNumber: string;
  dotNumber: string;
  password: string;
  confirmPassword: string;
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
      orgName: '',
      orgRole: '',
      mcNumber: '',
      dotNumber: '',
      password: '',
      confirmPassword: '',
      submit: null,
    },
    validationSchema: registerValidation,
    onSubmit: async (values) => {
      try {
        const { firstName, lastName, email, orgName, password, orgRole, mcNumber, dotNumber } = values;
        dispatch(
          signupRequest({
            email,
            password,
            firstName,
            lastName,
            orgName,
            orgRole,
            mcNumber,
            dotNumber,
          }),
        );
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
        {/* First Name */}
        <Grid item xs={12} md={6}>
          <TextField
            name="firstName"
            label="First Name"
            placeholder="John"
            autoComplete="given-name"
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
            autoComplete="family-name"
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
            autoComplete="email"
            required
            formik={formikProps}
          />
        </Grid>

        {/* Company Name */}
        <Grid item xs={12}>
          <TextField
            name="orgName"
            label="Company Name"
            placeholder="Demo Inc."
            autoComplete="organization"
            required
            formik={formikProps}
          />
        </Grid>

        {/* Organization Type */}
        <Grid item xs={12}>
          <SelectField
            name="orgRole"
            label="Organization Type"
            placeholder="Select organization type"
            required
            data={[
              { value: 'CARRIER', label: 'Carrier' },
              { value: 'BROKER', label: 'Broker' },
              { value: 'SHIPPER', label: 'Shipper' },
              { value: 'DISPATCH_COMPANY', label: 'Dispatch Company' },
            ]}
            formik={formikProps}
          />
        </Grid>

        {/* MC Number + DOT Number — shown only for CARRIER */}
        {formik.values.orgRole === 'CARRIER' && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                name="mcNumber"
                label="MC Number"
                placeholder="MC-123456"
                required
                formik={formikProps}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="dotNumber"
                label="DOT Number"
                placeholder="1234567"
                formik={formikProps}
              />
            </Grid>
          </>
        )}

        {/* Password with Validation Checklist */}
        <Grid item xs={12}>
          <PasswordFieldWithChecklist
            name="password"
            label="Password"
            placeholder="******"
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
            placeholder="Re-enter password"
            autoComplete="new-password"
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
            termsLink="/terms"
            privacyLink="/privacy"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthRegister;
