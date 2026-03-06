import type { Meta, StoryObj } from '@storybook/react';
import IconButton from '../IconButton';
import { Stack, Typography } from '@mui/material';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  HeartOutlined,
} from '@ant-design/icons';

/**
 * IconButton is an enhanced MUI IconButton with additional variants,
 * color options, and shape configurations.
 */
const meta: Meta<typeof IconButton> = {
  title: 'Components/Extended/IconButton',
  component: IconButton,
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
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'info', 'inherit'],
      description: 'Button color',
    },
    shape: {
      control: 'select',
      options: ['square', 'rounded'],
      description: 'Button shape',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

/**
 * Default text variant icon button
 */
export const Default: Story = {
  args: {
    children: <EditOutlined />,
    variant: 'text',
    color: 'primary',
  },
};

/**
 * Contained variant - solid background
 */
export const Contained: Story = {
  args: {
    children: <PlusOutlined />,
    variant: 'contained',
    color: 'primary',
  },
};

/**
 * Outlined variant - transparent with border
 */
export const Outlined: Story = {
  args: {
    children: <SearchOutlined />,
    variant: 'outlined',
    color: 'primary',
  },
};

/**
 * Light variant - lighter background
 */
export const Light: Story = {
  args: {
    children: <SettingOutlined />,
    variant: 'light',
    color: 'primary',
  },
};

/**
 * Shadow variant - with box shadow
 */
export const Shadow: Story = {
  args: {
    children: <HeartOutlined />,
    variant: 'shadow',
    color: 'error',
  },
};

/**
 * Dashed variant - dashed border
 */
export const Dashed: Story = {
  args: {
    children: <PlusOutlined />,
    variant: 'dashed',
    color: 'primary',
  },
};

/**
 * Rounded shape
 */
export const Rounded: Story = {
  args: {
    children: <EditOutlined />,
    variant: 'contained',
    color: 'primary',
    shape: 'rounded',
  },
};

/**
 * All button sizes
 */
export const AllSizes: Story = {
  render: () => (
    <Stack spacing={2} direction="row" alignItems="center">
      <Stack alignItems="center" spacing={0.5}>
        <IconButton variant="contained" color="primary" size="small">
          <EditOutlined />
        </IconButton>
        <Typography variant="caption">small</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <IconButton variant="contained" color="primary" size="medium">
          <EditOutlined />
        </IconButton>
        <Typography variant="caption">medium</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <IconButton variant="contained" color="primary" size="large">
          <EditOutlined />
        </IconButton>
        <Typography variant="caption">large</Typography>
      </Stack>
    </Stack>
  ),
};

/**
 * All color options
 */
export const AllColors: Story = {
  render: () => (
    <Stack spacing={2} direction="row" alignItems="center">
      <IconButton variant="contained" color="primary">
        <EditOutlined />
      </IconButton>
      <IconButton variant="contained" color="secondary">
        <EditOutlined />
      </IconButton>
      <IconButton variant="contained" color="success">
        <EditOutlined />
      </IconButton>
      <IconButton variant="contained" color="error">
        <DeleteOutlined />
      </IconButton>
      <IconButton variant="contained" color="warning">
        <EditOutlined />
      </IconButton>
      <IconButton variant="contained" color="info">
        <EditOutlined />
      </IconButton>
    </Stack>
  ),
};

/**
 * All variant styles
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={4}>
      <Typography variant="h6">IconButton Variants</Typography>

      <Stack spacing={2}>
        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Text:</Typography>
          <IconButton variant="text" color="primary"><EditOutlined /></IconButton>
          <IconButton variant="text" color="secondary"><EditOutlined /></IconButton>
          <IconButton variant="text" color="success"><EditOutlined /></IconButton>
          <IconButton variant="text" color="error"><DeleteOutlined /></IconButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Contained:</Typography>
          <IconButton variant="contained" color="primary"><EditOutlined /></IconButton>
          <IconButton variant="contained" color="secondary"><EditOutlined /></IconButton>
          <IconButton variant="contained" color="success"><EditOutlined /></IconButton>
          <IconButton variant="contained" color="error"><DeleteOutlined /></IconButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Outlined:</Typography>
          <IconButton variant="outlined" color="primary"><EditOutlined /></IconButton>
          <IconButton variant="outlined" color="secondary"><EditOutlined /></IconButton>
          <IconButton variant="outlined" color="success"><EditOutlined /></IconButton>
          <IconButton variant="outlined" color="error"><DeleteOutlined /></IconButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Light:</Typography>
          <IconButton variant="light" color="primary"><EditOutlined /></IconButton>
          <IconButton variant="light" color="secondary"><EditOutlined /></IconButton>
          <IconButton variant="light" color="success"><EditOutlined /></IconButton>
          <IconButton variant="light" color="error"><DeleteOutlined /></IconButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Shadow:</Typography>
          <IconButton variant="shadow" color="primary"><EditOutlined /></IconButton>
          <IconButton variant="shadow" color="secondary"><EditOutlined /></IconButton>
          <IconButton variant="shadow" color="success"><EditOutlined /></IconButton>
          <IconButton variant="shadow" color="error"><DeleteOutlined /></IconButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 80 }}>Dashed:</Typography>
          <IconButton variant="dashed" color="primary"><PlusOutlined /></IconButton>
          <IconButton variant="dashed" color="secondary"><PlusOutlined /></IconButton>
          <IconButton variant="dashed" color="success"><PlusOutlined /></IconButton>
          <IconButton variant="dashed" color="error"><PlusOutlined /></IconButton>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Shapes (Contained)</Typography>
        <Stack spacing={2} direction="row" alignItems="center">
          <Stack alignItems="center" spacing={0.5}>
            <IconButton variant="contained" color="primary" shape="square">
              <EditOutlined />
            </IconButton>
            <Typography variant="caption">square</Typography>
          </Stack>
          <Stack alignItems="center" spacing={0.5}>
            <IconButton variant="contained" color="primary" shape="rounded">
              <EditOutlined />
            </IconButton>
            <Typography variant="caption">rounded</Typography>
          </Stack>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Disabled State</Typography>
        <Stack spacing={2} direction="row" alignItems="center">
          <IconButton variant="contained" color="primary" disabled>
            <EditOutlined />
          </IconButton>
          <IconButton variant="outlined" color="primary" disabled>
            <EditOutlined />
          </IconButton>
          <IconButton variant="text" color="primary" disabled>
            <EditOutlined />
          </IconButton>
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
        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Edit Action:</Typography>
          <IconButton variant="text" color="primary">
            <EditOutlined />
          </IconButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Delete Action:</Typography>
          <IconButton variant="text" color="error">
            <DeleteOutlined />
          </IconButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Add Item:</Typography>
          <IconButton variant="contained" color="primary">
            <PlusOutlined />
          </IconButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Search:</Typography>
          <IconButton variant="outlined" color="primary">
            <SearchOutlined />
          </IconButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Settings:</Typography>
          <IconButton variant="light" color="secondary">
            <SettingOutlined />
          </IconButton>
        </Stack>

        <Stack spacing={2} direction="row" alignItems="center">
          <Typography variant="body2" sx={{ width: 120 }}>Favorite:</Typography>
          <IconButton variant="shadow" color="error">
            <HeartOutlined />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  ),
};
