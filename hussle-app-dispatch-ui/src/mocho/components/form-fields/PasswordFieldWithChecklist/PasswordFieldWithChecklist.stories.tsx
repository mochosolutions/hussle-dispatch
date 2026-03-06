import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { PasswordFieldWithChecklist } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * PasswordFieldWithChecklist is a password field with live validation checklist.
 * Shows check/X icons for each validation rule as the user types.
 */
const meta: Meta<typeof PasswordFieldWithChecklist> = {
  title: 'Components/Form Fields/PasswordFieldWithChecklist',
  component: PasswordFieldWithChecklist,
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
type Story = StoryObj<typeof PasswordFieldWithChecklist>;

/**
 * Default password field with checklist (default rules)
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
            <PasswordFieldWithChecklist
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
            <PasswordFieldWithChecklist
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
 * Partial password (some rules pass)
 */
export const PartialPassword: Story = {
  render: () => (
    <Formik
      initialValues={{ password: 'Password1' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordFieldWithChecklist
              name="password"
              label="Password"
              formik={formik}
            />
            <Typography variant="caption" color="text.secondary">
              Has length, number, and mixed case. Missing special character.
            </Typography>
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Strong password (all rules pass)
 */
export const StrongPassword: Story = {
  render: () => (
    <Formik
      initialValues={{ password: 'MyPassword1!' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <PasswordFieldWithChecklist
              name="password"
              label="Password"
              formik={formik}
            />
            <Typography variant="caption" color="text.secondary">
              All requirements met
            </Typography>
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Custom validation rules
 */
export const CustomRules: Story = {
  render: () => {
    const customRules = [
      {
        test: (str: string) => str.length >= 12,
        label: '12-character minimum',
      },
      {
        test: (str: string) => /[!@#$%^&*(),.?":{}|<>]/.test(str),
        label: 'Contains a special character',
      },
      {
        test: (str: string) => !/password/i.test(str),
        label: 'Does not contain "password"',
      },
      {
        test: (str: string) => !/123|abc/i.test(str),
        label: 'No sequential patterns (123, abc)',
      },
    ];

    return (
      <Formik
        initialValues={{ password: '' }}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <PasswordFieldWithChecklist
                name="password"
                label="Password"
                validationRules={customRules}
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
            <PasswordFieldWithChecklist
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
            <PasswordFieldWithChecklist
              name="password"
              label="Create Password"
              placeholder="Enter a secure password"
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
              <PasswordFieldWithChecklist
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
        .matches(/[0-9]/, 'Must contain at least one number')
        .matches(/[a-z]/, 'Must contain at least one lowercase letter')
        .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
        .matches(/[!#@$%^&*)(+=._-]/, 'Must contain at least one special character')
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
            <Stack spacing={3} sx={{ width: 380 }}>
              <Typography variant="h6">Create Your Account</Typography>

              <Typography variant="caption" color="text.secondary">
                [Email field would go here]
              </Typography>

              <PasswordFieldWithChecklist
                name="password"
                label="Password"
                placeholder="Create a secure password"
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

/**
 * Security-focused rules example
 */
export const SecurityFocusedRules: Story = {
  render: () => {
    const securityRules = [
      {
        test: (str: string) => str.length >= 16,
        label: '16+ characters for maximum security',
      },
      {
        test: (str: string) => /[A-Z].*[A-Z]/.test(str),
        label: 'At least 2 uppercase letters',
      },
      {
        test: (str: string) => /[0-9].*[0-9]/.test(str),
        label: 'At least 2 numbers',
      },
      {
        test: (str: string) => /[!@#$%^&*].*[!@#$%^&*]/.test(str),
        label: 'At least 2 special characters',
      },
      {
        test: (str: string) => !/(.)\1{2,}/.test(str),
        label: 'No repeated characters (aaa, 111)',
      },
    ];

    return (
      <Formik
        initialValues={{ password: '' }}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 380 }}>
              <Typography variant="subtitle2">High Security Password</Typography>
              <PasswordFieldWithChecklist
                name="password"
                label="Password"
                validationRules={securityRules}
                formik={formik}
              />
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};
