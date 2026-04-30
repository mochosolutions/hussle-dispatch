import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  CircularProgress,
  Grid,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import { BodyMuted, SectionTitle } from 'components/Typography';
import { AccessTime, ErrorOutline } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useDispatch } from 'store';
import { notify } from 'features/ui/store/reducers/notificationSlice';

import AuthWrapper from 'features/auth/sections/AuthWrapper';
import AuthFormWrapper from 'features/auth/sections/AuthFormWrapper';
import { passwordValidation } from 'features/auth/validators/authValidators';
import {
  TextField,
  PasswordFieldWithChecklist,
  ConfirmPasswordField,
  SubmitButton,
  FormError,
} from 'mocho/components/form-fields';
import type { FormikFieldProps } from 'mocho/components/form-fields';
import type { InvitationVerification } from 'utils/api/team/teamApi';
import { verifyInvitation, acceptInvitation } from 'utils/api/team/teamApi';

type VerifyStatus = 'loading' | 'valid' | 'expired' | 'invalid';

interface AcceptInviteFormValues {
  password: string;
  confirmPassword: string;
  submit: string | null;
}

const acceptInviteSchema = Yup.object({
  password: passwordValidation,
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

const AcceptInvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [invitation, setInvitation] = useState<InvitationVerification | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    const verify = async () => {
      try {
        const data = await verifyInvitation(token);
        setInvitation(data);
        setStatus('valid');
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('expired')
        ) {
          setStatus('expired');
        } else {
          setStatus('invalid');
        }
      }
    };

    verify();
  }, [token]);

  const formik = useFormik<AcceptInviteFormValues>({
    initialValues: {
      password: '',
      confirmPassword: '',
      submit: null,
    },
    validationSchema: acceptInviteSchema,
    onSubmit: async (values, { setErrors }) => {
      if (!token || !invitation) {
        return;
      }

      try {
        await acceptInvitation({
          invitationToken: token,
          email: invitation.email,
          password: values.password,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          role: invitation.role,
          organizationId: invitation.organizationId,
        });

        dispatch(notify({ message: 'Invitation accepted! Please log in.', variant: 'success' }));
        navigate('/login');
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to accept invitation';
        setErrors({ submit: message });
      }
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

  if (status === 'loading') {
    return (
      <AuthWrapper>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
          }}
        >
          <CircularProgress />
        </Box>
      </AuthWrapper>
    );
  }

  if (status === 'expired') {
    return (
      <AuthWrapper>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            py: 4,
            px: 3,
          }}
        >
          <AccessTime sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <SectionTitle sx={{ fontSize: '1.5rem', mb: 1 }}>Invitation Expired</SectionTitle>
          <BodyMuted sx={{ mb: 3 }}>
            This invitation has expired. Please ask your admin to send a new one.
          </BodyMuted>
          <Typography
            component={Link}
            to="/login"
            variant="body1"
            color="primary"
            sx={{ textDecoration: 'none' }}
          >
            Back to Login
          </Typography>
        </Box>
      </AuthWrapper>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthWrapper>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            py: 4,
            px: 3,
          }}
        >
          <ErrorOutline sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <SectionTitle sx={{ fontSize: '1.5rem', mb: 1 }}>Invalid Invitation</SectionTitle>
          <BodyMuted sx={{ mb: 3 }}>
            This invitation link is not valid. It may have been revoked or already used.
          </BodyMuted>
          <Typography
            component={Link}
            to="/login"
            variant="body1"
            color="primary"
            sx={{ textDecoration: 'none' }}
          >
            Back to Login
          </Typography>
        </Box>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <AuthFormWrapper
        title={`Join ${invitation?.organizationName ?? ''}`}
        subTitle={`You've been invited as a ${invitation?.role ?? ''}`}
        actionLink={{ label: 'Already have an account? Log in', to: '/login' }}
      >
        <Box component="form" noValidate onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Name"
                formik={{
                  ...formikProps,
                  values: {
                    ...formikProps.values,
                    name: `${invitation?.firstName ?? ''} ${invitation?.lastName ?? ''}`,
                  },
                }}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email"
                formik={{
                  ...formikProps,
                  values: {
                    ...formikProps.values,
                    email: invitation?.email ?? '',
                  },
                }}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <PasswordFieldWithChecklist
                name="password"
                label="Password"
                placeholder="Enter your password"
                autoComplete="new-password"
                required
                formik={formikProps}
              />
            </Grid>

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

            <FormError error={formik.errors.submit as string | undefined} />

            {formik.errors.submit && (
              <Grid item xs={12}>
                <Alert severity="error">{formik.errors.submit}</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <SubmitButton
                label="Accept Invitation"
                loading={formik.isSubmitting}
                disabled={formik.isSubmitting}
              />
            </Grid>
          </Grid>
        </Box>
      </AuthFormWrapper>
    </AuthWrapper>
  );
};

export default AcceptInvitePage;
