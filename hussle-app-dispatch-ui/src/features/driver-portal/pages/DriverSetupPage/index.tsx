import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Alert, Box, Stack } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import PortalLayout from 'components/PortalLayout';
import PortalFooter from 'components/PortalFooter';
import { Body, SectionTitle } from 'components/Typography';
import {
  EmailField,
  PasswordFieldWithChecklist,
  ConfirmPasswordField,
  SubmitButton,
} from 'mocho/components/form-fields';
import type { FormikFieldProps } from 'mocho/components/form-fields';
import { passwordValidation } from 'features/auth/validators/authValidators';
import {
  acceptDriverInviteRequest,
  clearDriverPortalError,
} from '../../store/reducers/driverPortalPageSlice';
import {
  selectDriverSetupSubmitting,
  selectDriverSetupError,
} from '../../store/selectors/driverPortalSelectors';

interface DriverSetupFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

const setupSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').optional(),
  password: passwordValidation,
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

const DriverSetupPage = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const submitting = useSelector(selectDriverSetupSubmitting);
  const error = useSelector(selectDriverSetupError);

  // Drop any stale setup error when leaving the page.
  useEffect(
    () => () => {
      dispatch(clearDriverPortalError());
    },
    [dispatch],
  );

  const formik = useFormik<DriverSetupFormValues>({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validationSchema: setupSchema,
    onSubmit: (values) => {
      if (!token) {
        return;
      }
      // Preserve a loadId hint from the link so setup lands on that load.
      const loadId = searchParams.get('loadId');
      const redirectTo = loadId ? `/driver-portal?loadId=${loadId}` : '/driver-portal';
      dispatch(
        acceptDriverInviteRequest({
          token,
          password: values.password,
          email: values.email.trim() === '' ? undefined : values.email.trim(),
          redirectTo,
        }),
      );
    },
  });

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
    <PortalLayout brandSubtitle="Driver portal" contentMaxWidth={480} footer={<PortalFooter />}>
      <Box>
        <SectionTitle sx={{ fontSize: '1.5rem', mb: 0.5 }}>Set up your account</SectionTitle>
        <Body sx={{ color: 'text.secondary', mb: 3 }}>
          Create a password to access your loads.
        </Body>

        <Box component="form" noValidate onSubmit={formik.handleSubmit}>
          <Stack spacing={2.5}>
            <EmailField
              name="email"
              label="Email (optional)"
              placeholder="you@example.com"
              formik={formikProps}
            />
            <PasswordFieldWithChecklist
              name="password"
              label="Password"
              placeholder="Create a password"
              autoComplete="new-password"
              required
              formik={formikProps}
            />
            <ConfirmPasswordField
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
              formik={formikProps}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <SubmitButton label="Complete Setup" loading={submitting} disabled={submitting} />
          </Stack>
        </Box>
      </Box>
    </PortalLayout>
  );
};

export default DriverSetupPage;
