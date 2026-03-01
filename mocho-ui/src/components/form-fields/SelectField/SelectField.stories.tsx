import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Formik, Form } from 'formik';
import { SelectField } from './index';
import { Stack, Typography, Button } from '@mui/material';
import * as Yup from 'yup';

/**
 * SelectField is a dropdown select field with validation and error handling.
 * Uses MUI Select with MenuItem options and BaseFieldWrapper for consistent layout.
 */
const meta: Meta<typeof SelectField> = {
  title: 'Components/Form Fields/SelectField',
  component: SelectField,
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
  },
};

export default meta;
type Story = StoryObj<typeof SelectField>;

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

const roleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'guest', label: 'Guest' },
];

/**
 * Default select field
 */
export const Default: Story = {
  render: () => (
    <Formik
      initialValues={{ country: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <SelectField
              name="country"
              label="Country"
              data={countryOptions}
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
      initialValues={{ role: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <SelectField
              name="role"
              label="User Role"
              data={roleOptions}
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
 * Pre-selected value
 */
export const PreSelected: Story = {
  render: () => (
    <Formik
      initialValues={{ status: 'active' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <SelectField
              name="status"
              label="Status"
              data={statusOptions}
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
      country: Yup.string().required('Please select a country'),
    });

    return (
      <Formik
        initialValues={{ country: '' }}
        initialTouched={{ country: true }}
        validationSchema={validationSchema}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <SelectField
                name="country"
                label="Country"
                data={countryOptions}
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
 * Few options
 */
export const FewOptions: Story = {
  render: () => (
    <Formik
      initialValues={{ status: '' }}
      onSubmit={() => {}}
    >
      {(formik) => (
        <Form>
          <Stack spacing={2} sx={{ width: 350 }}>
            <SelectField
              name="status"
              label="Status"
              data={statusOptions}
              formik={formik}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  ),
};

/**
 * Many options
 */
export const ManyOptions: Story = {
  render: () => {
    const manyOptions = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
      { value: '4', label: 'Option 4' },
      { value: '5', label: 'Option 5' },
      { value: '6', label: 'Option 6' },
      { value: '7', label: 'Option 7' },
      { value: '8', label: 'Option 8' },
      { value: '9', label: 'Option 9' },
      { value: '10', label: 'Option 10' },
    ];

    return (
      <Formik
        initialValues={{ option: '' }}
        onSubmit={() => {}}
      >
        {(formik) => (
          <Form>
            <Stack spacing={2} sx={{ width: 350 }}>
              <SelectField
                name="option"
                label="Select Option"
                data={manyOptions}
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
 * User profile form example
 */
export const ProfileFormExample: Story = {
  render: () => {
    const validationSchema = Yup.object({
      country: Yup.string().required('Country is required'),
      role: Yup.string().required('Role is required'),
    });

    return (
      <Formik
        initialValues={{ country: '', role: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => alert(JSON.stringify(values, null, 2))}
      >
        {(formik) => (
          <Form>
            <Stack spacing={3} sx={{ width: 350 }}>
              <Typography variant="h6">User Profile</Typography>

              <SelectField
                name="country"
                label="Country"
                data={countryOptions}
                required
                formik={formik}
              />

              <SelectField
                name="role"
                label="User Role"
                data={roleOptions}
                required
                formik={formik}
              />

              <Button type="submit" variant="contained" fullWidth>
                Save Profile
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    );
  },
};
