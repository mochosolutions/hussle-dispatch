import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { OTPField } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * OTPField is a one-time password input field.
 * Features multiple digit inputs using react18-input-otp with theme-aware styling.
 */
const meta: Meta<typeof OTPField> = {
  title: 'Components/Form Fields/OTPField',
  component: OTPField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Field name for Formik',
    },
    label: {
      control: 'text',
      description: 'Optional label text',
    },
    numDigits: {
      control: 'number',
      description: 'Number of OTP digits',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OTPField>;

/**
 * Default 6-digit OTP field
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ otp: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <OTPField
              name="otp"
              label="Enter OTP"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Without label
 */
export const NoLabel: Story = {
  render: () => (
    <Formik
      initialValues={{ code: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <OTPField
              name="code"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * 4-digit OTP
 */
export const FourDigits: Story = {
  render: () => (
    <Formik
      initialValues={{ pin: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 280 }}>
            <OTPField
              name="pin"
              label="Enter PIN"
              numDigits={4}
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * 8-digit OTP
 */
export const EightDigits: Story = {
  render: () => (
    <Formik
      initialValues={{ backup: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 450 }}>
            <OTPField
              name="backup"
              label="Enter Backup Code"
              numDigits={8}
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With pre-filled value
 */
export const PreFilled: Story = {
  render: () => (
    <Formik
      initialValues={{ otp: '123456' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <OTPField
              name="otp"
              label="Verification Code"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With validation error
 */
export const WithError: Story = {
  render: () => {
    const validationSchema = Yup.object({
      otp: Yup.string()
        .length(6, 'OTP must be exactly 6 digits')
        .required('OTP is required'),
    });

    return (
      <Formik
        initialValues={{ otp: '123' }}
        initialTouched={{ otp: true }}
        validationSchema={validationSchema}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <OTPField
                name="otp"
                label="Verification Code"
                formik={formik}
              />
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};

/**
 * Email verification form example
 */
export const EmailVerificationExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      verificationCode: Yup.string()
        .length(6, 'Enter all 6 digits')
        .required('Verification code is required'),
    });

    return (
      <Formik
        initialValues={{ verificationCode: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert(`Verifying code: ${values.verificationCode}`)}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }} alignItems="center">
              <Typography variant="h5">Verify Your Email</Typography>

              <Typography variant="body2" color="text.secondary" textAlign="center">
                We've sent a 6-digit code to your email.
                Please enter it below.
              </Typography>

              <OTPField
                name="verificationCode"
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                Verify
              </Button>

              <Typography variant="caption" color="text.secondary">
                Didn't receive the code? Resend
              </Typography>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};

/**
 * Two-factor authentication example
 */
export const TwoFactorAuthExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      authCode: Yup.string()
        .length(6, 'Enter all 6 digits')
        .required('Authentication code is required'),
    });

    return (
      <Formik
        initialValues={{ authCode: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert(`2FA code: ${values.authCode}`)}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }} alignItems="center">
              <Typography variant="h5">Two-Factor Authentication</Typography>

              <Typography variant="body2" color="text.secondary" textAlign="center">
                Enter the 6-digit code from your authenticator app.
              </Typography>

              <OTPField
                name="authCode"
                label="Authentication Code"
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                Authenticate
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};
