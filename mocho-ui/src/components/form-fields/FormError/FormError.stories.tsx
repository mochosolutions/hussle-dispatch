import type { Meta, StoryObj } from '@storybook/react';
import { FormError } from './index';
import { Stack, Typography } from '@mui/material';

/**
 * FormError displays form-level error messages (e.g., API errors, authentication failures).
 * Shows errors prominently with appropriate styling.
 */
const meta: Meta<typeof FormError> = {
  title: 'Components/Form Fields/FormError',
  component: FormError,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: 'text',
      description: 'Error message to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormError>;

/**
 * Default with error message
 */
export const Default: Story = {
  args: {
    error: 'Invalid email or password. Please try again.',
  },
};

/**
 * No error (renders nothing)
 */
export const NoError: Story = {
  args: {
    error: undefined,
  },
};

/**
 * Long error message
 */
export const LongMessage: Story = {
  args: {
    error: 'Your session has expired due to inactivity. Please sign in again to continue using the application. If you continue to experience issues, please contact support.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Common error messages
 */
export const CommonErrors: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Common Form Errors</Typography>

      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Authentication Error:</Typography>
          <FormError error="Invalid email or password. Please try again." />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Session Expired:</Typography>
          <FormError error="Your session has expired. Please sign in again." />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Server Error:</Typography>
          <FormError error="An unexpected error occurred. Please try again later." />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Validation Error:</Typography>
          <FormError error="Please correct the errors in the form and try again." />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Network Error:</Typography>
          <FormError error="Unable to connect to the server. Please check your internet connection." />
        </Stack>
      </Stack>
    </Stack>
  ),
};
