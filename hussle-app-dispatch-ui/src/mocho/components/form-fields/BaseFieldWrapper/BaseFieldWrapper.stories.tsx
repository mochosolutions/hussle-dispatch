import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BaseFieldWrapper } from './index';
import { TextField, Stack } from '@mui/material';

/**
 * BaseFieldWrapper is a reusable container for form fields with label and error handling.
 * Provides consistent layout pattern with InputLabel, children, and error/helper text.
 */
const meta: Meta<typeof BaseFieldWrapper> = {
  title: 'Components/Form Fields/BaseFieldWrapper',
  component: BaseFieldWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Field name for htmlFor binding',
    },
    label: {
      control: 'text',
      description: 'Field label text',
    },
    required: {
      control: 'boolean',
      description: 'Show required indicator',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    touched: {
      control: 'boolean',
      description: 'Whether field has been touched',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BaseFieldWrapper>;

/**
 * Default wrapper with a text input
 */
export const Default: Story = {
  render: () => (
    <Stack sx={{ width: 350 }}>
      <BaseFieldWrapper name="username" label="Username">
        <TextField id="username" placeholder="Enter username" fullWidth />
      </BaseFieldWrapper>
    </Stack>
  ),
};

/**
 * Required field indicator
 */
export const Required: Story = {
  render: () => (
    <Stack sx={{ width: 350 }}>
      <BaseFieldWrapper name="email" label="Email Address" required>
        <TextField id="email" placeholder="Enter email" fullWidth />
      </BaseFieldWrapper>
    </Stack>
  ),
};

/**
 * With helper text
 */
export const WithHelperText: Story = {
  render: () => (
    <Stack sx={{ width: 350 }}>
      <BaseFieldWrapper
        name="phone"
        label="Phone Number"
        helperText="Include country code (e.g., +1)"
      >
        <TextField id="phone" placeholder="Enter phone" fullWidth />
      </BaseFieldWrapper>
    </Stack>
  ),
};

/**
 * With validation error (touched and error)
 */
export const WithError: Story = {
  render: () => (
    <Stack sx={{ width: 350 }}>
      <BaseFieldWrapper
        name="password"
        label="Password"
        required
        touched={true}
        error="Password must be at least 8 characters"
      >
        <TextField
          id="password"
          type="password"
          placeholder="Enter password"
          fullWidth
          error
        />
      </BaseFieldWrapper>
    </Stack>
  ),
};

/**
 * Error takes precedence over helper text
 */
export const ErrorOverridesHelperText: Story = {
  render: () => (
    <Stack sx={{ width: 350 }}>
      <BaseFieldWrapper
        name="username"
        label="Username"
        helperText="Choose a unique username"
        touched={true}
        error="Username is already taken"
      >
        <TextField id="username" defaultValue="admin" fullWidth error />
      </BaseFieldWrapper>
    </Stack>
  ),
};

/**
 * Untouched field with error does not show error
 */
export const UntouchedWithError: Story = {
  render: () => (
    <Stack sx={{ width: 350 }}>
      <BaseFieldWrapper
        name="field"
        label="Field with error but not touched"
        touched={false}
        error="This error should not appear"
        helperText="This helper text shows instead"
      >
        <TextField id="field" placeholder="Enter value" fullWidth />
      </BaseFieldWrapper>
    </Stack>
  ),
};

/**
 * Multiple wrapped fields
 */
export const MultipleFields: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: 350 }}>
      <BaseFieldWrapper name="firstName" label="First Name" required>
        <TextField id="firstName" placeholder="John" fullWidth />
      </BaseFieldWrapper>

      <BaseFieldWrapper name="lastName" label="Last Name" required>
        <TextField id="lastName" placeholder="Doe" fullWidth />
      </BaseFieldWrapper>

      <BaseFieldWrapper
        name="bio"
        label="Bio"
        helperText="Tell us about yourself"
      >
        <TextField
          id="bio"
          placeholder="Enter bio"
          multiline
          rows={3}
          fullWidth
        />
      </BaseFieldWrapper>
    </Stack>
  ),
};
