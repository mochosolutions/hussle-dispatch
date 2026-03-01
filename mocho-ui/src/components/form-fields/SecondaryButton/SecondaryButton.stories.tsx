import type { Meta, StoryObj } from '@storybook/react';
import { SecondaryButton } from './index';
import { Stack, Typography } from '@mui/material';
import { action } from '@storybook/addon-actions';

/**
 * SecondaryButton is a secondary action button for forms.
 * Supports text and outlined variants for cancel, back, or alternative actions.
 */
const meta: Meta<typeof SecondaryButton> = {
  title: 'Components/Form Fields/SecondaryButton',
  component: SecondaryButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Button label text',
    },
    variant: {
      control: 'select',
      options: ['text', 'outlined'],
      description: 'Button variant',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler function',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SecondaryButton>;

/**
 * Default text variant
 */
export const Default: Story = {
  args: {
    label: 'Cancel',
    onClick: action('clicked'),
  },
};

/**
 * Text variant (default)
 */
export const TextVariant: Story = {
  args: {
    label: 'Go Back',
    variant: 'text',
    onClick: action('clicked'),
  },
};

/**
 * Outlined variant
 */
export const OutlinedVariant: Story = {
  args: {
    label: 'Cancel',
    variant: 'outlined',
    onClick: action('clicked'),
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Button Variants</Typography>

      <Stack spacing={2} direction="row">
        <SecondaryButton label="Text" variant="text" onClick={action('text-clicked')} />
        <SecondaryButton label="Outlined" variant="outlined" onClick={action('outlined-clicked')} />
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
          <Typography variant="body2" sx={{ width: 120 }}>Cancel Action:</Typography>
          <SecondaryButton label="Cancel" variant="outlined" onClick={action('cancel')} />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Go Back:</Typography>
          <SecondaryButton label="Go Back" variant="text" onClick={action('go-back')} />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Skip Step:</Typography>
          <SecondaryButton label="Skip for Now" variant="text" onClick={action('skip')} />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Reset Form:</Typography>
          <SecondaryButton label="Reset" variant="outlined" onClick={action('reset')} />
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * Button pair example (Submit + Cancel)
 */
export const ButtonPair: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Form Button Layout</Typography>

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <SecondaryButton label="Cancel" variant="outlined" onClick={action('cancel')} />
        {/* Note: SubmitButton would go here in actual form */}
      </Stack>
    </Stack>
  ),
};
