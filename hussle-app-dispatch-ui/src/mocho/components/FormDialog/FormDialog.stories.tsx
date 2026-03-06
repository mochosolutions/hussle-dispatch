import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import * as Yup from 'yup';
import FormDialog from './index';
import { FormStructure } from '../DynamicForm/types';

/**
 * FormDialog - A dialog wrapper for forms with Formik integration and DynamicForm rendering.
 *
 * Use this component when you need to present a form within a modal dialog.
 * It handles form state, validation, and submission with loading states.
 */
const meta: Meta<typeof FormDialog> = {
  title: 'Components/Feedback/FormDialog',
  component: FormDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    dialogTitle: {
      control: 'text',
      description: 'Title displayed in the dialog header',
    },
    actionTitle: {
      control: 'text',
      description: 'Text for the submit button',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the form is in a loading/submitting state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormDialog>;

// Simple form structure for basic examples
const simpleFormStructure: FormStructure = {
  fields: [
    {
      type: 'input',
      name: 'name',
      label: 'Name',
      placeholder: 'Enter your name',
      required: true,
    },
    {
      type: 'input',
      name: 'email',
      label: 'Email',
      inputType: 'email',
      placeholder: 'Enter your email',
      required: true,
    },
  ],
};

const simpleValidationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const simpleInitialValues = {
  name: '',
  email: '',
};

/**
 * Default form dialog with simple inputs
 */
export const Default: Story = {
  args: {
    open: true,
    dialogTitle: 'Add New Contact',
    actionTitle: 'Add Contact',
    structure: simpleFormStructure,
    validationSchema: simpleValidationSchema,
    initialValues: simpleInitialValues,
    isLoading: false,
    onSubmit: action('form-submitted'),
    onClose: action('dialog-closed'),
  },
};

/**
 * Form dialog in loading state
 */
export const Loading: Story = {
  args: {
    open: true,
    dialogTitle: 'Add New Contact',
    actionTitle: 'Adding...',
    structure: simpleFormStructure,
    validationSchema: simpleValidationSchema,
    initialValues: simpleInitialValues,
    isLoading: true,
    onSubmit: action('form-submitted'),
    onClose: action('dialog-closed'),
  },
};

// Category form structure
const categoryFormStructure: FormStructure = {
  fields: [
    {
      type: 'input',
      name: 'name',
      label: 'Category Name',
      placeholder: 'Enter category name',
      required: true,
    },
    {
      type: 'textarea',
      name: 'description',
      label: 'Description',
      placeholder: 'Enter category description',
      rows: 3,
    },
  ],
};

const categoryValidationSchema = Yup.object({
  name: Yup.string().required('Category name is required').min(2, 'Name must be at least 2 characters'),
  description: Yup.string().max(500, 'Description must be less than 500 characters'),
});

/**
 * Create category form dialog
 */
export const CreateCategory: Story = {
  args: {
    open: true,
    dialogTitle: 'Create Category',
    actionTitle: 'Create',
    structure: categoryFormStructure,
    validationSchema: categoryValidationSchema,
    initialValues: { name: '', description: '' },
    isLoading: false,
    onSubmit: action('category-created'),
    onClose: action('dialog-closed'),
  },
};

// Author form structure
const authorFormStructure: FormStructure = {
  fields: [
    {
      type: 'input',
      name: 'firstName',
      label: 'First Name',
      placeholder: 'Enter first name',
      required: true,
      grid: { xs: 12, sm: 6 },
    },
    {
      type: 'input',
      name: 'lastName',
      label: 'Last Name',
      placeholder: 'Enter last name',
      required: true,
      grid: { xs: 12, sm: 6 },
    },
    {
      type: 'input',
      name: 'email',
      label: 'Email',
      inputType: 'email',
      placeholder: 'Enter email address',
      required: true,
    },
    {
      type: 'textarea',
      name: 'bio',
      label: 'Bio',
      placeholder: 'Enter author bio',
      rows: 4,
    },
  ],
};

const authorValidationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  bio: Yup.string().max(1000, 'Bio must be less than 1000 characters'),
});

/**
 * Create author form dialog with grid layout
 */
export const CreateAuthor: Story = {
  args: {
    open: true,
    dialogTitle: 'Add New Author',
    actionTitle: 'Add Author',
    structure: authorFormStructure,
    validationSchema: authorValidationSchema,
    initialValues: { firstName: '', lastName: '', email: '', bio: '' },
    isLoading: false,
    onSubmit: action('author-created'),
    onClose: action('dialog-closed'),
  },
};

/**
 * Edit form dialog with pre-filled values
 */
export const EditMode: Story = {
  args: {
    open: true,
    dialogTitle: 'Edit Author',
    actionTitle: 'Save Changes',
    structure: authorFormStructure,
    validationSchema: authorValidationSchema,
    initialValues: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      bio: 'A passionate writer with over 10 years of experience in technical documentation.',
    },
    isLoading: false,
    onSubmit: action('author-updated'),
    onClose: action('dialog-closed'),
  },
};

// Form with select field
const roleFormStructure: FormStructure = {
  fields: [
    {
      type: 'input',
      name: 'username',
      label: 'Username',
      placeholder: 'Enter username',
      required: true,
    },
    {
      type: 'select',
      name: 'role',
      label: 'Role',
      required: true,
      options: [
        { value: 'admin', label: 'Administrator' },
        { value: 'editor', label: 'Editor' },
        { value: 'author', label: 'Author' },
        { value: 'viewer', label: 'Viewer' },
      ],
    },
  ],
};

const roleValidationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  role: Yup.string().required('Role is required'),
});

/**
 * Form dialog with select dropdown
 */
export const WithSelectField: Story = {
  args: {
    open: true,
    dialogTitle: 'Assign Role',
    actionTitle: 'Assign',
    structure: roleFormStructure,
    validationSchema: roleValidationSchema,
    initialValues: { username: '', role: '' },
    isLoading: false,
    onSubmit: action('role-assigned'),
    onClose: action('dialog-closed'),
  },
};

/**
 * Interactive example with trigger button
 */
export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (values: any) => {
      setIsLoading(true);
      action('form-submitted')(values);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsLoading(false);
      setOpen(false);
    };

    return (
      <Stack spacing={2} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Click the button to open the form dialog
        </Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add New Category
        </Button>

        <FormDialog
          open={open}
          onClose={() => setOpen(false)}
          dialogTitle="Add New Category"
          actionTitle={isLoading ? 'Creating...' : 'Create'}
          structure={categoryFormStructure}
          validationSchema={categoryValidationSchema}
          initialValues={{ name: '', description: '' }}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      </Stack>
    );
  },
};
