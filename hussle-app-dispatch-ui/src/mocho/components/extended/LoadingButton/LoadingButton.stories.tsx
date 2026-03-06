import type { Meta, StoryObj } from '@storybook/react';
import LoadingButton from '../LoadingButton';
import { Stack, Typography } from '@mui/material';
import { SaveOutlined, SendOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';

/**
 * LoadingButton extends MUI LoadingButton with additional variants, colors, and shapes.
 * Supports loading states with customizable indicator positions.
 */
const meta: Meta<typeof LoadingButton> = {
  title: 'Components/Extended/LoadingButton',
  component: LoadingButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'contained', 'outlined', 'light', 'shadow', 'dashed'],
      description: 'Button variant style',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'],
      description: 'Button color',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    loadingPosition: {
      control: 'select',
      options: ['start', 'end', 'center'],
      description: 'Position of loading indicator',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingButton>;

/**
 * Default loading button
 */
export const Default: Story = {
  args: {
    children: 'Submit',
    variant: 'contained',
    color: 'primary',
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    children: 'Saving...',
    variant: 'contained',
    color: 'primary',
    loading: true,
  },
};

/**
 * Loading at start position
 */
export const LoadingStart: Story = {
  args: {
    children: 'Save',
    variant: 'contained',
    color: 'primary',
    loading: true,
    loadingPosition: 'start',
    startIcon: <SaveOutlined />,
  },
};

/**
 * Loading at end position
 */
export const LoadingEnd: Story = {
  args: {
    children: 'Send',
    variant: 'contained',
    color: 'primary',
    loading: true,
    loadingPosition: 'end',
    endIcon: <SendOutlined />,
  },
};

/**
 * Loading at center position
 */
export const LoadingCenter: Story = {
  args: {
    children: 'Processing',
    variant: 'contained',
    color: 'primary',
    loading: true,
    loadingPosition: 'center',
  },
};

/**
 * With start icon
 */
export const WithStartIcon: Story = {
  args: {
    children: 'Save',
    variant: 'contained',
    color: 'primary',
    startIcon: <SaveOutlined />,
  },
};

/**
 * With end icon
 */
export const WithEndIcon: Story = {
  args: {
    children: 'Send',
    variant: 'contained',
    color: 'primary',
    endIcon: <SendOutlined />,
  },
};

/**
 * All button variants
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={4}>
      <Typography variant="h6">LoadingButton Variants</Typography>

      <Stack spacing={2}>
        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Text:</Typography>
          <LoadingButton variant="text" color="primary">Text</LoadingButton>
          <LoadingButton variant="text" color="primary" loading>Loading</LoadingButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Contained:</Typography>
          <LoadingButton variant="contained" color="primary">Contained</LoadingButton>
          <LoadingButton variant="contained" color="primary" loading>Loading</LoadingButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Outlined:</Typography>
          <LoadingButton variant="outlined" color="primary">Outlined</LoadingButton>
          <LoadingButton variant="outlined" color="primary" loading>Loading</LoadingButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Light:</Typography>
          <LoadingButton variant="light" color="primary">Light</LoadingButton>
          <LoadingButton variant="light" color="primary" loading>Loading</LoadingButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Shadow:</Typography>
          <LoadingButton variant="shadow" color="primary">Shadow</LoadingButton>
          <LoadingButton variant="shadow" color="primary" loading>Loading</LoadingButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Dashed:</Typography>
          <LoadingButton variant="dashed" color="primary">Dashed</LoadingButton>
          <LoadingButton variant="dashed" color="primary" loading>Loading</LoadingButton>
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * All color options
 */
export const AllColors: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Colors (Contained)</Typography>
      <Stack spacing={2} direction="row" flexWrap="wrap">
        <LoadingButton variant="contained" color="primary">Primary</LoadingButton>
        <LoadingButton variant="contained" color="secondary">Secondary</LoadingButton>
        <LoadingButton variant="contained" color="success">Success</LoadingButton>
        <LoadingButton variant="contained" color="error">Error</LoadingButton>
        <LoadingButton variant="contained" color="warning">Warning</LoadingButton>
        <LoadingButton variant="contained" color="info">Info</LoadingButton>
      </Stack>

      <Typography variant="h6">Colors Loading</Typography>
      <Stack spacing={2} direction="row" flexWrap="wrap">
        <LoadingButton variant="contained" color="primary" loading>Primary</LoadingButton>
        <LoadingButton variant="contained" color="secondary" loading>Secondary</LoadingButton>
        <LoadingButton variant="contained" color="success" loading>Success</LoadingButton>
        <LoadingButton variant="contained" color="error" loading>Error</LoadingButton>
        <LoadingButton variant="contained" color="warning" loading>Warning</LoadingButton>
        <LoadingButton variant="contained" color="info" loading>Info</LoadingButton>
      </Stack>
    </Stack>
  ),
};

/**
 * Loading positions
 */
export const LoadingPositions: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Loading Indicator Positions</Typography>

      <Stack spacing={2}>
        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 100 }}>Start:</Typography>
          <LoadingButton
            variant="contained"
            color="primary"
            loading
            loadingPosition="start"
            startIcon={<SaveOutlined />}
          >
            Save
          </LoadingButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 100 }}>End:</Typography>
          <LoadingButton
            variant="contained"
            color="primary"
            loading
            loadingPosition="end"
            endIcon={<SendOutlined />}
          >
            Send
          </LoadingButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 100 }}>Center:</Typography>
          <LoadingButton
            variant="contained"
            color="primary"
            loading
            loadingPosition="center"
          >
            Processing
          </LoadingButton>
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <Stack spacing={2} direction="row" alignItems="center">
      <Stack alignItems="center" spacing={0.5}>
        <LoadingButton variant="contained" color="primary" size="small">
          Small
        </LoadingButton>
        <Typography variant="caption">small</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <LoadingButton variant="contained" color="primary" size="medium">
          Medium
        </LoadingButton>
        <Typography variant="caption">medium</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <LoadingButton variant="contained" color="primary" size="large">
          Large
        </LoadingButton>
        <Typography variant="caption">large</Typography>
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
        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Form Submit:</Typography>
          <LoadingButton variant="contained" color="primary" startIcon={<SaveOutlined />}>
            Save Changes
          </LoadingButton>
          <LoadingButton variant="contained" color="primary" loading loadingPosition="start" startIcon={<SaveOutlined />}>
            Saving...
          </LoadingButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Send Email:</Typography>
          <LoadingButton variant="contained" color="primary" endIcon={<SendOutlined />}>
            Send
          </LoadingButton>
          <LoadingButton variant="contained" color="primary" loading loadingPosition="end" endIcon={<SendOutlined />}>
            Sending...
          </LoadingButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Create:</Typography>
          <LoadingButton variant="contained" color="success" startIcon={<PlusOutlined />}>
            Create New
          </LoadingButton>
          <LoadingButton variant="contained" color="success" loading loadingPosition="start" startIcon={<PlusOutlined />}>
            Creating...
          </LoadingButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Download:</Typography>
          <LoadingButton variant="outlined" color="primary" startIcon={<DownloadOutlined />}>
            Download
          </LoadingButton>
          <LoadingButton variant="outlined" color="primary" loading loadingPosition="start" startIcon={<DownloadOutlined />}>
            Downloading...
          </LoadingButton>
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * Disabled states
 */
export const DisabledStates: Story = {
  render: () => (
    <Stack spacing={2} direction="row">
      <LoadingButton variant="contained" color="primary" disabled>
        Disabled
      </LoadingButton>
      <LoadingButton variant="outlined" color="primary" disabled>
        Disabled
      </LoadingButton>
      <LoadingButton variant="text" color="primary" disabled>
        Disabled
      </LoadingButton>
    </Stack>
  ),
};
