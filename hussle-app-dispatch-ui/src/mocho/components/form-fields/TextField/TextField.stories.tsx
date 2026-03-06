import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { TextField } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * TextField is a generic text/number input field with validation and error handling.
 * Uses BaseFieldWrapper for consistent layout and supports full Formik integration.
 */
const meta: Meta<typeof TextField> = {
  title: 'Components/Form Fields/TextField',
  component: TextField,
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
    type: {
      control: 'select',
      options: ['text', 'number'],
      description: 'Input type',
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
type Story = StoryObj<typeof TextField>;

// Wrapper component for Formik integration
const FormikWrapper = ({
  children,
  initialValues = { field: '' },
  validationSchema,
}: {
  children: React.ReactNode;
  initialValues?: Record<string, unknown>;
  validationSchema?: Yup.AnyObjectSchema;
}) => (
  <Formik
    initialValues={initialValues}
    validationSchema={validationSchema}
    onSubmit={(values) => console.log('Submitted:', values)}
  >
    {(formik) => (
      <Form>
        <Stack spacing={2} sx={{ width: 350 }}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { formik });
            }
            return child;
          })}
        </Stack>
      </Form>
    )}
  </Formik>
);

/**
 * Default text field
 */
export const Default: Story = {
  render: () => (
    <FormikWrapper initialValues={{ username: '' }}>
      <TextField name="username" label="Username" placeholder="Enter username" />
    </FormikWrapper>
  ),
};

/**
 * Required field
 */
export const Required: Story = {
  render: () => (
    <FormikWrapper initialValues={{ email: '' }}>
      <TextField
        name="email"
        label="Email Address"
        placeholder="Enter email"
        required
      />
    </FormikWrapper>
  ),
};

/**
 * With placeholder
 */
export const WithPlaceholder: Story = {
  render: () => (
    <FormikWrapper initialValues={{ name: '' }}>
      <TextField
        name="name"
        label="Full Name"
        placeholder="John Doe"
      />
    </FormikWrapper>
  ),
};

/**
 * Number type
 */
export const NumberType: Story = {
  render: () => (
    <FormikWrapper initialValues={{ age: '' }}>
      <TextField
        name="age"
        label="Age"
        type="number"
        placeholder="25"
      />
    </FormikWrapper>
  ),
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  render: () => (
    <FormikWrapper initialValues={{ disabled: 'Cannot edit' }}>
      <TextField
        name="disabled"
        label="Disabled Field"
        disabled
      />
    </FormikWrapper>
  ),
};

/**
 * With validation error
 */
export const WithError: Story = {
  render: () => {
    const validationSchema = Yup.object({
      email: Yup.string()
        .email('Invalid email address')
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
              <TextField
                name="email"
                label="Email"
                placeholder="Enter email"
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
    <FormikWrapper initialValues={{ company: 'Acme Corporation' }}>
      <TextField
        name="company"
        label="Company Name"
      />
    </FormikWrapper>
  ),
};

/**
 * All input types
 */
export const AllTypes: Story = {
  render: () => (
    <Formik
      initialValues={{ text: '', number: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={3} sx={{ width: 350 }}>
            <Typography variant="h6">Input Types</Typography>

            <TextField
              name="text"
              label="Text Input"
              type="text"
              placeholder="Enter text"
              formik={formik}
            />

            <TextField
              name="number"
              label="Number Input"
              type="number"
              placeholder="Enter number"
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Form example with validation
 */
export const FormExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
      phone: Yup.string()
        .matches(/^\d{10}$/, 'Phone must be 10 digits')
        .required('Phone is required'),
    });

    return (
      <Formik
        initialValues={{ firstName: '', lastName: '', phone: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert(JSON.stringify(values, null, 2))}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <Typography variant="h6">User Information</Typography>

              <TextField
                name="firstName"
                label="First Name"
                placeholder="John"
                required
                formik={formik}
              />

              <TextField
                name="lastName"
                label="Last Name"
                placeholder="Doe"
                required
                formik={formik}
              />

              <TextField
                name="phone"
                label="Phone Number"
                placeholder="1234567890"
                required
                formik={formik}
              />

              <Button type="submit" variant="contained">
                Submit
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};
