import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { ConfirmPasswordField } from './index';
import { PasswordField } from '../PasswordField';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * ConfirmPasswordField is a password confirmation field.
 * A wrapper around PasswordField with default label/placeholder for confirm password use case.
 */
const meta: Meta<typeof ConfirmPasswordField> = {
  title: 'Components/Form Fields/ConfirmPasswordField',
  component: ConfirmPasswordField,
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
      description: 'Field label (default: "Confirm Password")',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    enableToggle: {
      control: 'boolean',
      description: 'Enable visibility toggle',
    },
    required: {
      control: 'boolean',
      description: 'Mark as required',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmPasswordField>;

/**
 * Default confirm password field
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ confirmPassword: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <ConfirmPasswordField
              name="confirmPassword"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Required field
 */
export const Required: Story = {
  render: () => (
    <Formik
      initialValues={{ confirmPassword: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <ConfirmPasswordField
              name="confirmPassword"
              required
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Custom label
 */
export const CustomLabel: Story = {
  render: () => (
    <Formik
      initialValues={{ reenterPassword: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <ConfirmPasswordField
              name="reenterPassword"
              label="Re-enter Password"
              placeholder="Type your password again"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Without visibility toggle
 */
export const NoToggle: Story = {
  render: () => (
    <Formik
      initialValues={{ confirmPassword: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <ConfirmPasswordField
              name="confirmPassword"
              enableToggle={false}
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
      initialValues={{ confirmPassword: 'mypassword123' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <ConfirmPasswordField
              name="confirmPassword"
              formik={formik}
            />
            <Typography variant="caption" color="text.secondary">
              Click the eye icon to reveal the password
            </Typography>
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * With validation error (passwords don't match)
 */
export const WithMismatchError: Story = {
  render: () => {
    const validationSchema = Yup.object({
      password: Yup.string().required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
    });

    return (
      <Formik
        initialValues={{ password: 'password123', confirmPassword: 'different' }}
        initialTouched={{ password: true, confirmPassword: true }}
        validationSchema={validationSchema}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <PasswordField
                name="password"
                label="Password"
                formik={formik}
              />
              <ConfirmPasswordField
                name="confirmPassword"
                required
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
 * Registration form example
 */
export const RegistrationFormExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
    });

    return (
      <Formik
        initialValues={{ password: '', confirmPassword: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert('Registration successful!')}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }}>
              <Typography variant="h6">Create Account</Typography>

              <Typography variant="caption" color="text.secondary">
                [Email field would go here]
              </Typography>

              <PasswordField
                name="password"
                label="Password"
                required
                formik={formik}
              />

              <ConfirmPasswordField
                name="confirmPassword"
                required
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                Create Account
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};

/**
 * Password reset form example
 */
export const PasswordResetExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('New password is required'),
      confirmNewPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm your new password'),
    });

    return (
      <Formik
        initialValues={{ newPassword: '', confirmNewPassword: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert('Password reset successful!')}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }}>
              <Typography variant="h6">Reset Password</Typography>

              <Typography variant="body2" color="text.secondary">
                Enter your new password below.
              </Typography>

              <PasswordField
                name="newPassword"
                label="New Password"
                required
                formik={formik}
              />

              <ConfirmPasswordField
                name="confirmNewPassword"
                label="Confirm New Password"
                required
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                Reset Password
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};
