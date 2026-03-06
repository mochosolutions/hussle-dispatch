import type { Meta, StoryObj } from '@storybook/react';
import { SubmitButton } from './index';
import { Stack, Typography } from '@mui/material';

/**
 * SubmitButton is the primary form submit button with loading state.
 * Features LoadingButton with spinner indicator and AnimateButton wrapper for visual feedback.
 */
const meta: Meta<typeof SubmitButton> = {
  title: 'Components/Form Fields/SubmitButton',
  component: SubmitButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Button label text',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    type: {
      control: 'select',
      options: ['submit', 'button'],
      description: 'Button type attribute',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SubmitButton>;

/**
 * Default submit button
 */
export const Default: Story = {
  args: {
    label: 'Submit',
    loading: false,
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    label: 'Submitting...',
    loading: true,
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    label: 'Submit',
    loading: false,
    disabled: true,
  },
};

/**
 * Small size
 */
export const Small: Story = {
  args: {
    label: 'Submit',
    loading: false,
    size: 'small',
    fullWidth: false,
  },
};

/**
 * Medium size
 */
export const Medium: Story = {
  args: {
    label: 'Submit',
    loading: false,
    size: 'medium',
    fullWidth: false,
  },
};

/**
 * Large size (default)
 */
export const Large: Story = {
  args: {
    label: 'Submit',
    loading: false,
    size: 'large',
    fullWidth: false,
  },
};

/**
 * Full width button
 */
export const FullWidth: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <SubmitButton label="Submit Form" loading={false} fullWidth />
    </div>
  ),
};

/**
 * Not full width
 */
export const NotFullWidth: Story = {
  args: {
    label: 'Submit',
    loading: false,
    fullWidth: false,
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <Stack spacing={2}>
      <Typography variant="h6">Button Sizes</Typography>
      <Stack spacing={2} direction="row" alignItems="center">
        <SubmitButton label="Small" loading={false} size="small" fullWidth={false} />
        <SubmitButton label="Medium" loading={false} size="medium" fullWidth={false} />
        <SubmitButton label="Large" loading={false} size="large" fullWidth={false} />
      </Stack>
    </Stack>
  ),
};

/**
 * All states comparison
 */
export const AllStates: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Button States</Typography>

      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Normal:</Typography>
          <SubmitButton label="Submit" loading={false} fullWidth={false} />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Loading:</Typography>
          <SubmitButton label="Submit" loading={true} fullWidth={false} />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Disabled:</Typography>
          <SubmitButton label="Submit" loading={false} disabled fullWidth={false} />
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * Common use cases
 */
export const UseCases: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Common Use Cases</Typography>

      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Login Form:</Typography>
          <SubmitButton label="Sign In" loading={false} fullWidth={false} />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Register Form:</Typography>
          <SubmitButton label="Create Account" loading={false} fullWidth={false} />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Save Changes:</Typography>
          <SubmitButton label="Save Changes" loading={false} fullWidth={false} />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Processing:</Typography>
          <SubmitButton label="Processing..." loading={true} fullWidth={false} />
        </Stack>
      </Stack>
    </Stack>
  ),
};
