import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { EmailField } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * EmailField is an email input field with validation and error handling.
 * Uses type="email" for browser validation and BaseFieldWrapper for consistent layout.
 */
const meta: Meta<typeof EmailField> = {
  title: 'Components/Form Fields/EmailField',
  component: EmailField,
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
    disabled: {
      control: 'boolean',
      description: 'Disable the field',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmailField>;

/**
 * Default email field
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ email: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <EmailField name="email" label="Email Address" formik={formik} />
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
      initialValues={{ email: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <EmailField
              name="email"
              label="Email Address"
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
 * Custom placeholder
 */
export const CustomPlaceholder: Story = {
  render: () => (
    <Formik
      initialValues={{ email: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <EmailField
              name="email"
              label="Work Email"
              placeholder="you@company.com"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  render: () => (
    <Formik
      initialValues={{ email: 'user@example.com' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <EmailField
              name="email"
              label="Email Address"
              disabled
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
      email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    });

    return (
      <Formik
        initialValues={{ email: 'invalid-email' }}
        initialTouched={{ email: true }}
        validationSchema={validationSchema}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <EmailField
                name="email"
                label="Email Address"
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
 * Pre-filled value
 */
export const PreFilled: Story = {
  render: () => (
    <Formik
      initialValues={{ email: 'john.doe@example.com' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <EmailField
              name="email"
              label="Email Address"
              formik={formik}
            />
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
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    });

    return (
      <Formik
        initialValues={{ email: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert(`Login attempt: ${values.email}`)}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }}>
              <Typography variant="h6">Sign In</Typography>

              <EmailField
                name="email"
                label="Email Address"
                required
                formik={formik}
              />

              <Typography variant="caption" color="text.secondary">
                [Password field would go here]
              </Typography>

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
