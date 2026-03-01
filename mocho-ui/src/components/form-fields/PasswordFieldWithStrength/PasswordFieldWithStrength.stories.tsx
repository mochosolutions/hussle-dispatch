import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { PasswordFieldWithStrength } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * PasswordFieldWithStrength is a password field with visual strength indicator.
 * Shows a colored bar and label (Poor/Weak/Normal/Good/Strong) based on password strength.
 */
const meta: Meta<typeof PasswordFieldWithStrength> = {
  title: 'Components/Form Fields/PasswordFieldWithStrength',
  component: PasswordFieldWithStrength,
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
    showStrengthMeter: {
      control: 'boolean',
      description: 'Show the strength indicator',
    },
    required: {
      control: 'boolean',
      description: 'Mark as required',
    },
    enableToggle: {
      control: 'boolean',
      description: 'Enable visibility toggle',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PasswordFieldWithStrength>;

/**
 * Default password field with strength meter
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
            <PasswordFieldWithStrength
              name="password"
              label="Password"
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
      initialValues={{ password: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordFieldWithStrength
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
 * Weak password example
 */
export const WeakPassword: Story = {
  render: () => (
    <Formik
      initialValues={{ password: '123' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordFieldWithStrength
              name="password"
              label="Password"
              formik={formik}
            />
            <Typography variant="caption" color="text.secondary">
              Try typing different passwords to see strength change
            </Typography>
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Normal password example
 */
export const NormalPassword: Story = {
  render: () => (
    <Formik
      initialValues={{ password: 'password1' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordFieldWithStrength
              name="password"
              label="Password"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Strong password example
 */
export const StrongPassword: Story = {
  render: () => (
    <Formik
      initialValues={{ password: 'MyStr0ng!Pass#2024' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordFieldWithStrength
              name="password"
              label="Password"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Without strength meter
 */
export const HiddenStrengthMeter: Story = {
  render: () => (
    <Formik
      initialValues={{ password: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordFieldWithStrength
              name="password"
              label="Password"
              showStrengthMeter={false}
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
            <PasswordFieldWithStrength
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
 * With custom placeholder
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
            <PasswordFieldWithStrength
              name="password"
              label="Create Password"
              placeholder="Enter a strong password"
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
              <PasswordFieldWithStrength
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
 * Registration form example
 */
export const RegistrationFormExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Must contain at least one number')
        .required('Password is required'),
    });

    return (
      <Formik
        initialValues={{ password: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert('Registration successful!')}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }}>
              <Typography variant="h6">Create Your Account</Typography>

              <Typography variant="caption" color="text.secondary">
                [Email field would go here]
              </Typography>

              <PasswordFieldWithStrength
                name="password"
                label="Password"
                placeholder="Create a strong password"
                required
                formik={formik}
              />

              <Typography variant="caption" color="text.secondary">
                [Confirm password field would go here]
              </Typography>

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
