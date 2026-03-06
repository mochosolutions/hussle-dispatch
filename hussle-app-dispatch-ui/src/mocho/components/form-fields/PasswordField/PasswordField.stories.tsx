import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { PasswordField } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * PasswordField is a password input field with visibility toggle.
 * Features eye icons for show/hide state and uses BaseFieldWrapper for consistent layout.
 */
const meta: Meta<typeof PasswordField> = {
  title: 'Components/Form Fields/PasswordField',
  component: PasswordField,
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
      description: 'Field label',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    required: {
      control: 'boolean',
      description: 'Mark as required',
    },
    enableToggle: {
      control: 'boolean',
      description: 'Enable visibility toggle button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PasswordField>;

/**
 * Default password field with toggle
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ password: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordField name="password" label="Password" formik={formik} />
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
      initialValues={{ password: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordField
              name="password"
              label="Password"
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
 * Without visibility toggle
 */
export const NoToggle: Story = {
  render: () => (
    <Formik
      initialValues={{ password: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordField
              name="password"
              label="Password"
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
 * Custom placeholder
 */
export const CustomPlaceholder: Story = {
  render: () => (
    <Formik
      initialValues={{ password: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordField
              name="password"
              label="Password"
              placeholder="••••••••"
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
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    });

    return (
      <Formik
        initialValues={{ password: '123' }}
        initialTouched={{ password: true }}
        validationSchema={validationSchema}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <PasswordField
                name="password"
                label="Password"
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
 * Pre-filled value (hidden by default)
 */
export const PreFilled: Story = {
  render: () => (
    <Formik
      initialValues={{ password: 'secretpassword123' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordField
              name="password"
              label="Current Password"
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
 * Login form example
 */
export const LoginFormExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    });

    return (
      <Formik
        initialValues={{ password: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert('Login submitted')}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }}>
              <Typography variant="h6">Sign In</Typography>

              <Typography variant="caption" color="text.secondary">
                [Email field would go here]
              </Typography>

              <PasswordField
                name="password"
                label="Password"
                required
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                Sign In
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};

/**
 * Password change form example
 */
export const ChangePasswordExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      currentPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm your password'),
    });

    return (
      <Formik
        initialValues={{
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert('Password changed')}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }}>
              <Typography variant="h6">Change Password</Typography>

              <PasswordField
                name="currentPassword"
                label="Current Password"
                required
                formik={formik}
              />

              <PasswordField
                name="newPassword"
                label="New Password"
                required
                formik={formik}
              />

              <PasswordField
                name="confirmPassword"
                label="Confirm New Password"
                required
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                Update Password
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};
