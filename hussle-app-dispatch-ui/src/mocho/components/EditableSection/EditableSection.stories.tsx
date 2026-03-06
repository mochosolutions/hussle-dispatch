import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack } from '@mui/material';
import * as Yup from 'yup';
import { EditableSection, EditableSectionField } from './index';

/**
 * EditableSection provides inline editing capability within a card.
 * Features toggle between view and edit modes, form validation,
 * and support for read-only fields within the same section.
 */
const meta: Meta<typeof EditableSection> = {
  title: 'Components/Layout/EditableSection',
  component: EditableSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Section title',
    },
    canEdit: {
      control: 'boolean',
      description: 'Whether editing is allowed',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EditableSection>;

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  bio: string;
  createdAt: string;
}

const sampleData: UserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  role: 'admin',
  bio: 'A software developer with 10 years of experience.',
  createdAt: '2024-01-15T10:30:00Z',
};

const basicFields: EditableSectionField[] = [
  { name: 'firstName', label: 'First Name', type: 'text' },
  { name: 'lastName', label: 'Last Name', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
];

const fullFields: EditableSectionField[] = [
  { name: 'firstName', label: 'First Name', type: 'text', gridSize: 6 },
  { name: 'lastName', label: 'Last Name', type: 'text', gridSize: 6 },
  { name: 'email', label: 'Email', type: 'email', gridSize: 6 },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    gridSize: 6,
    options: [
      { value: 'admin', label: 'Administrator' },
      { value: 'editor', label: 'Editor' },
      { value: 'viewer', label: 'Viewer' },
    ],
  },
  { name: 'bio', label: 'Bio', type: 'textarea', gridSize: 12, rows: 3 },
  {
    name: 'createdAt',
    label: 'Member Since',
    type: 'text',
    editable: false,
    gridSize: 6,
    format: (value: unknown) => new Date(value as string).toLocaleDateString(),
  },
];

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
});

export const Default: Story = {
  args: {
    title: 'Personal Information',
    fields: basicFields,
    data: sampleData,
    onSave: async (values) => {
      console.log('Saving:', values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const WithValidation: Story = {
  args: {
    title: 'Personal Information',
    fields: basicFields,
    data: sampleData,
    validationSchema,
    onSave: async (values) => {
      console.log('Saving:', values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const FullProfile: Story = {
  name: 'Full Profile with Mixed Fields',
  args: {
    title: 'User Profile',
    fields: fullFields,
    data: sampleData,
    validationSchema,
    onSave: async (values) => {
      console.log('Saving:', values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const ReadOnly: Story = {
  args: {
    title: 'Account Information',
    fields: basicFields,
    data: sampleData,
    canEdit: false,
    onSave: async () => {},
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading Section',
    fields: basicFields,
    data: sampleData,
    loading: true,
    onSave: async () => {},
  },
};

export const WithSelectField: Story = {
  args: {
    title: 'Role Settings',
    fields: [
      {
        name: 'role',
        label: 'User Role',
        type: 'select',
        gridSize: 6,
        options: [
          { value: 'admin', label: 'Administrator' },
          { value: 'editor', label: 'Editor' },
          { value: 'viewer', label: 'Viewer' },
        ],
      },
    ],
    data: sampleData,
    onSave: async (values) => {
      console.log('Saving role:', values);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};

export const WithTextarea: Story = {
  args: {
    title: 'About',
    fields: [
      {
        name: 'bio',
        label: 'Biography',
        type: 'textarea',
        gridSize: 12,
        rows: 4,
        placeholder: 'Tell us about yourself...',
      },
    ],
    data: sampleData,
    onSave: async (values) => {
      console.log('Saving bio:', values);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};

export const WithReadOnlyField: Story = {
  args: {
    title: 'Account Details',
    fields: [
      { name: 'email', label: 'Email', type: 'email', gridSize: 6 },
      {
        name: 'createdAt',
        label: 'Created At',
        type: 'text',
        editable: false,
        gridSize: 6,
        format: (value: unknown) => new Date(value as string).toLocaleDateString(),
      },
    ],
    data: sampleData,
    onSave: async (values) => {
      console.log('Saving:', values);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};

export const MultipleSections: Story = {
  name: 'Multiple Sections Example',
  render: () => (
    <Stack spacing={3}>
      <EditableSection
        title="Personal Information"
        fields={[
          { name: 'firstName', label: 'First Name', type: 'text', gridSize: 6 },
          { name: 'lastName', label: 'Last Name', type: 'text', gridSize: 6 },
        ]}
        data={sampleData}
        onSave={async (values) => {
          console.log('Personal:', values);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }}
      />
      <EditableSection
        title="Contact Information"
        fields={[
          { name: 'email', label: 'Email', type: 'email', gridSize: 12 },
        ]}
        data={sampleData}
        validationSchema={Yup.object({
          email: Yup.string().email('Invalid email').required('Email required'),
        })}
        onSave={async (values) => {
          console.log('Contact:', values);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }}
      />
      <EditableSection
        title="About"
        fields={[
          { name: 'bio', label: 'Bio', type: 'textarea', gridSize: 12 },
        ]}
        data={sampleData}
        onSave={async (values) => {
          console.log('About:', values);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }}
      />
    </Stack>
  ),
};
