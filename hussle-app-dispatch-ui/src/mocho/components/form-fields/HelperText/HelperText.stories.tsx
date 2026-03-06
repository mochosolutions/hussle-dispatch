import type { Meta, StoryObj } from '@storybook/react';
import { HelperText } from './index';
import { Stack, Typography } from '@mui/material';

/**
 * HelperText displays helper/instructional text below form fields.
 * Supports different typography variants and colors.
 */
const meta: Meta<typeof HelperText> = {
  title: 'Components/Form Fields/HelperText',
  component: HelperText,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'Helper text content',
    },
    variant: {
      control: 'select',
      options: ['caption', 'body2'],
      description: 'Typography variant',
    },
    color: {
      control: 'text',
      description: 'Text color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HelperText>;

/**
 * Default helper text
 */
export const Default: Story = {
  args: {
    text: 'This field is optional.',
  },
};

/**
 * Caption variant (smaller, default)
 */
export const CaptionVariant: Story = {
  args: {
    text: 'Password must be at least 8 characters.',
    variant: 'caption',
  },
};

/**
 * Body2 variant (slightly larger)
 */
export const Body2Variant: Story = {
  args: {
    text: 'Password must be at least 8 characters.',
    variant: 'body2',
  },
};

/**
 * Custom color
 */
export const CustomColor: Story = {
  args: {
    text: 'Important: This action cannot be undone.',
    color: 'error.main',
  },
};

/**
 * Common helper texts
 */
export const CommonHelperTexts: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Common Helper Text Examples</Typography>

      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Password Requirements:</Typography>
          <HelperText text="Password must be at least 8 characters with one uppercase letter and number." />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Email Format:</Typography>
          <HelperText text="We'll never share your email with anyone else." />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Optional Field:</Typography>
          <HelperText text="This field is optional. Leave blank if not applicable." />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Character Limit:</Typography>
          <HelperText text="Maximum 500 characters." />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Date Format:</Typography>
          <HelperText text="Select a date in the future." />
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Helper Text Variants</Typography>

      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Caption (default):</Typography>
          <HelperText text="This is caption variant helper text." variant="caption" />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Body2:</Typography>
          <HelperText text="This is body2 variant helper text." variant="body2" />
        </Stack>
      </Stack>
    </Stack>
  ),
};
