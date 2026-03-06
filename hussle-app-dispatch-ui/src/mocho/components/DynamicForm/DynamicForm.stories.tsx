import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Box, Button, Paper, Typography, Stack } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import DynamicForm from './index';
import type { FormStructure } from './types';

/**
 * DynamicForm renders form fields dynamically based on a configuration object.
 * Supports flat layouts and sectioned layouts with collapsible accordions.
 *
 * Field types:
 * - input: Standard text input
 * - textarea: Multiline text input
 * - select: Dropdown selection
 * - slug: Auto-generating slug field
 * - charCounter: Textarea with character counter
 */
const meta: Meta<typeof DynamicForm> = {
  title: 'Components/Complex/DynamicForm',
  component: DynamicForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DynamicForm>;

interface BasicFormValues {
  name: string;
  email: string;
  message: string;
}

interface AdvancedFormValues {
  title: string;
  slug: string;
  category: string;
  description: string;
  content: string;
}

const basicStructure: FormStructure = {
  fields: [
    { type: 'input', name: 'name', label: 'Name', required: true, grid: { xs: 12, md: 6 } },
    { type: 'input', name: 'email', label: 'Email', inputType: 'email', required: true, grid: { xs: 12, md: 6 } },
    { type: 'textarea', name: 'message', label: 'Message', rows: 4, grid: { xs: 12 } },
  ],
};

const advancedStructure: FormStructure = {
  fields: [
    { type: 'input', name: 'title', label: 'Title', required: true, grid: { xs: 12, md: 8 } },
    {
      type: 'select',
      name: 'category',
      label: 'Category',
      required: true,
      options: [
        { value: 'tech', label: 'Technology' },
        { value: 'business', label: 'Business' },
        { value: 'lifestyle', label: 'Lifestyle' },
      ],
      grid: { xs: 12, md: 4 },
    },
    {
      type: 'charCounter',
      name: 'description',
      label: 'Description',
      maxLength: 200,
      rows: 3,
      helperText: 'Brief description for SEO',
      grid: { xs: 12 },
    },
    { type: 'textarea', name: 'content', label: 'Content', rows: 6, grid: { xs: 12 } },
  ],
};

const sectionedStructure: FormStructure = {
  sections: [
    {
      title: 'Basic Information',
      fields: [
        { type: 'input', name: 'firstName', label: 'First Name', required: true, grid: { xs: 12, md: 6 } },
        { type: 'input', name: 'lastName', label: 'Last Name', required: true, grid: { xs: 12, md: 6 } },
        { type: 'input', name: 'email', label: 'Email', inputType: 'email', required: true, grid: { xs: 12 } },
      ],
    },
    {
      title: 'Address',
      collapsible: true,
      defaultExpanded: true,
      fields: [
        { type: 'input', name: 'street', label: 'Street Address', grid: { xs: 12 } },
        { type: 'input', name: 'city', label: 'City', grid: { xs: 12, md: 6 } },
        { type: 'input', name: 'zip', label: 'ZIP Code', grid: { xs: 12, md: 6 } },
      ],
    },
    {
      title: 'Preferences',
      collapsible: true,
      defaultExpanded: false,
      fields: [
        {
          type: 'select',
          name: 'theme',
          label: 'Theme',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ],
          grid: { xs: 12, md: 6 },
        },
        { type: 'textarea', name: 'bio', label: 'Biography', rows: 3, grid: { xs: 12 } },
      ],
    },
  ],
};

const BasicFormExample = () => {
  const formik = useFormik<BasicFormValues>({
    initialValues: { name: '', email: '', message: '' },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email').required('Email is required'),
    }),
    onSubmit: (values) => {
      alert(JSON.stringify(values, null, 2));
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <DynamicForm
        structure={basicStructure}
        values={formik.values}
        touched={formik.touched}
        errors={formik.errors}
        handleChange={formik.handleChange}
        handleBlur={formik.handleBlur}
        setFieldValue={formik.setFieldValue}
      />
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button type="submit" variant="contained">
          Submit
        </Button>
        <Button variant="outlined" onClick={() => formik.resetForm()}>
          Reset
        </Button>
      </Stack>
    </Box>
  );
};

export const BasicForm: Story = {
  name: 'Basic Form',
  render: () => <BasicFormExample />,
};

const AdvancedFormExample = () => {
  const formik = useFormik<AdvancedFormValues>({
    initialValues: {
      title: '',
      slug: '',
      category: '',
      description: '',
      content: '',
    },
    validationSchema: Yup.object({
      title: Yup.string().required('Title is required'),
      category: Yup.string().required('Category is required'),
      description: Yup.string().max(200, 'Max 200 characters'),
    }),
    onSubmit: (values) => {
      alert(JSON.stringify(values, null, 2));
    },
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Create New Post
      </Typography>
      <Box component="form" onSubmit={formik.handleSubmit}>
        <DynamicForm
          structure={advancedStructure}
          values={formik.values}
          touched={formik.touched}
          errors={formik.errors}
          handleChange={formik.handleChange}
          handleBlur={formik.handleBlur}
          setFieldValue={formik.setFieldValue}
        />
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button type="submit" variant="contained">
            Publish
          </Button>
          <Button variant="outlined">Save Draft</Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export const AdvancedForm: Story = {
  name: 'Advanced Form with Select',
  render: () => <AdvancedFormExample />,
};

const SectionedFormExample = () => {
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      street: '',
      city: '',
      zip: '',
      theme: 'system',
      bio: '',
    },
    onSubmit: (values) => {
      alert(JSON.stringify(values, null, 2));
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <DynamicForm
        structure={sectionedStructure}
        values={formik.values}
        touched={formik.touched}
        errors={formik.errors}
        handleChange={formik.handleChange}
        handleBlur={formik.handleBlur}
        setFieldValue={formik.setFieldValue}
      />
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button type="submit" variant="contained">
          Save Profile
        </Button>
      </Stack>
    </Box>
  );
};

export const SectionedForm: Story = {
  name: 'Sectioned Form with Accordions',
  render: () => <SectionedFormExample />,
};

export const WithValidationErrors: Story = {
  name: 'With Validation Errors',
  render: () => {
    const formik = useFormik<BasicFormValues>({
      initialValues: { name: '', email: 'invalid-email', message: '' },
      validationSchema: Yup.object({
        name: Yup.string().required('Name is required'),
        email: Yup.string().email('Invalid email').required('Email is required'),
      }),
      onSubmit: () => {},
      validateOnMount: true,
    });

    // Mark fields as touched to show errors
    const touchedFields = { name: true, email: true };

    return (
      <DynamicForm
        structure={basicStructure}
        values={formik.values}
        touched={touchedFields}
        errors={formik.errors}
        handleChange={formik.handleChange}
        handleBlur={formik.handleBlur}
        setFieldValue={formik.setFieldValue}
      />
    );
  },
};
