import type { Meta, StoryObj } from '@storybook/react';
import Dot from '../Dot';
import { Stack, Typography, Box } from '@mui/material';

/**
 * Dot is a simple indicator component for status, notifications, or visual markers.
 * Supports different colors, sizes, and outline variants.
 */
const meta: Meta<typeof Dot> = {
  title: 'Components/Extended/Dot',
  component: Dot,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'],
      description: 'Dot color',
    },
    size: {
      control: 'number',
      description: 'Dot size in pixels',
    },
    variant: {
      control: 'select',
      options: ['filled', 'outlined'],
      description: 'Dot variant style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dot>;

/**
 * Default dot
 */
export const Default: Story = {
  args: {
    color: 'primary',
  },
};

/**
 * Primary color dot
 */
export const Primary: Story = {
  args: {
    color: 'primary',
  },
};

/**
 * Secondary color dot
 */
export const Secondary: Story = {
  args: {
    color: 'secondary',
  },
};

/**
 * Success color dot
 */
export const Success: Story = {
  args: {
    color: 'success',
  },
};

/**
 * Error color dot
 */
export const Error: Story = {
  args: {
    color: 'error',
  },
};

/**
 * Warning color dot
 */
export const Warning: Story = {
  args: {
    color: 'warning',
  },
};

/**
 * Info color dot
 */
export const Info: Story = {
  args: {
    color: 'info',
  },
};

/**
 * Outlined variant
 */
export const Outlined: Story = {
  args: {
    color: 'primary',
    variant: 'outlined',
  },
};

/**
 * Custom size (larger)
 */
export const LargeSize: Story = {
  args: {
    color: 'primary',
    size: 16,
  },
};

/**
 * Custom size (smaller)
 */
export const SmallSize: Story = {
  args: {
    color: 'primary',
    size: 4,
  },
};

/**
 * All colors showcase
 */
export const AllColors: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Dot Colors</Typography>

      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Primary:</Typography>
          <Dot color="primary" />
          <Dot color="primary" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Secondary:</Typography>
          <Dot color="secondary" />
          <Dot color="secondary" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Success:</Typography>
          <Dot color="success" />
          <Dot color="success" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Error:</Typography>
          <Dot color="error" />
          <Dot color="error" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Warning:</Typography>
          <Dot color="warning" />
          <Dot color="warning" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Info:</Typography>
          <Dot color="info" />
          <Dot color="info" variant="outlined" />
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * Size variations
 */
export const AllSizes: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Dot Sizes</Typography>

      <Stack direction="row" spacing={3} alignItems="center">
        <Stack alignItems="center" spacing={1}>
          <Dot color="primary" size={4} />
          <Typography variant="caption">4px</Typography>
        </Stack>
        <Stack alignItems="center" spacing={1}>
          <Dot color="primary" size={6} />
          <Typography variant="caption">6px</Typography>
        </Stack>
        <Stack alignItems="center" spacing={1}>
          <Dot color="primary" size={8} />
          <Typography variant="caption">8px (default)</Typography>
        </Stack>
        <Stack alignItems="center" spacing={1}>
          <Dot color="primary" size={10} />
          <Typography variant="caption">10px</Typography>
        </Stack>
        <Stack alignItems="center" spacing={1}>
          <Dot color="primary" size={12} />
          <Typography variant="caption">12px</Typography>
        </Stack>
        <Stack alignItems="center" spacing={1}>
          <Dot color="primary" size={16} />
          <Typography variant="caption">16px</Typography>
        </Stack>
        <Stack alignItems="center" spacing={1}>
          <Dot color="primary" size={20} />
          <Typography variant="caption">20px</Typography>
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
    <Stack spacing={4}>
      <Typography variant="h6">Common Use Cases</Typography>

      <Stack spacing={3}>
        {/* Status indicators */}
        <Stack spacing={1}>
          <Typography variant="subtitle2">Status Indicators</Typography>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Dot color="success" />
              <Typography variant="body2">Online</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Dot color="warning" />
              <Typography variant="body2">Away</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Dot color="error" />
              <Typography variant="body2">Offline</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Dot color="secondary" />
              <Typography variant="body2">Do Not Disturb</Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* Notification badges */}
        <Stack spacing={1}>
          <Typography variant="subtitle2">Notification Indicators</Typography>
          <Stack direction="row" spacing={3}>
            <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <Typography>Messages</Typography>
              <Box sx={{ position: 'absolute', top: -2, right: -10 }}>
                <Dot color="error" size={8} />
              </Box>
            </Box>
            <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <Typography>Alerts</Typography>
              <Box sx={{ position: 'absolute', top: -2, right: -10 }}>
                <Dot color="warning" size={8} />
              </Box>
            </Box>
          </Stack>
        </Stack>

        {/* List markers */}
        <Stack spacing={1}>
          <Typography variant="subtitle2">List Markers</Typography>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Dot color="primary" size={6} />
              <Typography variant="body2">First item</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Dot color="primary" size={6} />
              <Typography variant="body2">Second item</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Dot color="primary" size={6} />
              <Typography variant="body2">Third item</Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* Legend indicators */}
        <Stack spacing={1}>
          <Typography variant="subtitle2">Chart Legend</Typography>
          <Stack direction="row" spacing={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Dot color="primary" size={10} />
              <Typography variant="body2">Sales</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Dot color="success" size={10} />
              <Typography variant="body2">Revenue</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Dot color="warning" size={10} />
              <Typography variant="body2">Costs</Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* Progress steps */}
        <Stack spacing={1}>
          <Typography variant="subtitle2">Step Indicators</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Dot color="success" size={12} />
            <Box sx={{ width: 40, height: 2, bgcolor: 'success.main' }} />
            <Dot color="success" size={12} />
            <Box sx={{ width: 40, height: 2, bgcolor: 'success.main' }} />
            <Dot color="primary" size={12} />
            <Box sx={{ width: 40, height: 2, bgcolor: 'grey.300' }} />
            <Dot color="secondary" variant="outlined" size={12} />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ pl: 0.5 }}>
            <Typography variant="caption" sx={{ width: 54 }}>Start</Typography>
            <Typography variant="caption" sx={{ width: 54 }}>Review</Typography>
            <Typography variant="caption" sx={{ width: 54 }}>Current</Typography>
            <Typography variant="caption">Complete</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={4}>
      <Typography variant="h6">Dot Component Showcase</Typography>

      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="subtitle2">Filled (Default)</Typography>
          <Stack direction="row" spacing={2}>
            <Dot color="primary" />
            <Dot color="secondary" />
            <Dot color="success" />
            <Dot color="error" />
            <Dot color="warning" />
            <Dot color="info" />
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">Outlined</Typography>
          <Stack direction="row" spacing={2}>
            <Dot color="primary" variant="outlined" />
            <Dot color="secondary" variant="outlined" />
            <Dot color="success" variant="outlined" />
            <Dot color="error" variant="outlined" />
            <Dot color="warning" variant="outlined" />
            <Dot color="info" variant="outlined" />
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">Various Sizes</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Dot color="primary" size={4} />
            <Dot color="primary" size={8} />
            <Dot color="primary" size={12} />
            <Dot color="primary" size={16} />
            <Dot color="primary" size={20} />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  ),
};
