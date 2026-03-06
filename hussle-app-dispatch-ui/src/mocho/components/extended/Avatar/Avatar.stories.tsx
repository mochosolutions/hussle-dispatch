import type { Meta, StoryObj } from '@storybook/react';
import Avatar from '../Avatar';
import { Stack, Typography } from '@mui/material';
import { UserOutlined, TeamOutlined, ShopOutlined } from '@ant-design/icons';

/**
 * Avatar displays user profile images or initials with customizable colors, sizes, and styles.
 * Extends MUI Avatar with additional type variants (filled, outlined, combined) and size options.
 */
const meta: Meta<typeof Avatar> = {
  title: 'Components/Extended/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'],
      description: 'Avatar color theme',
    },
    type: {
      control: 'select',
      options: ['filled', 'outlined', 'combined'],
      description: 'Avatar style type',
    },
    size: {
      control: 'select',
      options: ['badge', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Avatar size',
    },
    variant: {
      control: 'select',
      options: ['circular', 'rounded', 'square'],
      description: 'Avatar shape variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

/**
 * Default avatar with initials
 */
export const Default: Story = {
  args: {
    children: 'JD',
    color: 'primary',
    type: 'filled',
    size: 'md',
  },
};

/**
 * Avatar with an icon
 */
export const WithIcon: Story = {
  args: {
    children: <UserOutlined />,
    color: 'primary',
    type: 'filled',
    size: 'md',
  },
};

/**
 * Filled variant - solid background color
 */
export const Filled: Story = {
  args: {
    children: 'AB',
    type: 'filled',
    color: 'primary',
    size: 'lg',
  },
};

/**
 * Outlined variant - transparent background with border
 */
export const Outlined: Story = {
  args: {
    children: 'CD',
    type: 'outlined',
    color: 'secondary',
    size: 'lg',
  },
};

/**
 * Combined variant - light background with border
 */
export const Combined: Story = {
  args: {
    children: 'EF',
    type: 'combined',
    color: 'success',
    size: 'lg',
  },
};

/**
 * All size options
 */
export const AllSizes: Story = {
  render: () => (
    <Stack spacing={2} direction="row" alignItems="center">
      <Stack alignItems="center" spacing={0.5}>
        <Avatar size="badge" color="primary" type="filled">B</Avatar>
        <Typography variant="caption">badge</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <Avatar size="xs" color="primary" type="filled">XS</Avatar>
        <Typography variant="caption">xs</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <Avatar size="sm" color="primary" type="filled">SM</Avatar>
        <Typography variant="caption">sm</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <Avatar size="md" color="primary" type="filled">MD</Avatar>
        <Typography variant="caption">md</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <Avatar size="lg" color="primary" type="filled">LG</Avatar>
        <Typography variant="caption">lg</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <Avatar size="xl" color="primary" type="filled">XL</Avatar>
        <Typography variant="caption">xl</Typography>
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
      <Avatar color="primary" type="filled" size="lg">P</Avatar>
      <Avatar color="secondary" type="filled" size="lg">S</Avatar>
      <Avatar color="success" type="filled" size="lg">S</Avatar>
      <Avatar color="error" type="filled" size="lg">E</Avatar>
      <Avatar color="warning" type="filled" size="lg">W</Avatar>
      <Avatar color="info" type="filled" size="lg">I</Avatar>
    </Stack>
  ),
};

/**
 * All type variants
 */
export const AllTypes: Story = {
  render: () => (
    <Stack spacing={3}>
      <Stack spacing={2} direction="row" alignItems="center">
        <Typography variant="body2" sx={{ width: 80 }}>Filled:</Typography>
        <Avatar color="primary" type="filled" size="lg">A</Avatar>
        <Avatar color="secondary" type="filled" size="lg">B</Avatar>
        <Avatar color="success" type="filled" size="lg">C</Avatar>
      </Stack>
      <Stack spacing={2} direction="row" alignItems="center">
        <Typography variant="body2" sx={{ width: 80 }}>Outlined:</Typography>
        <Avatar color="primary" type="outlined" size="lg">A</Avatar>
        <Avatar color="secondary" type="outlined" size="lg">B</Avatar>
        <Avatar color="success" type="outlined" size="lg">C</Avatar>
      </Stack>
      <Stack spacing={2} direction="row" alignItems="center">
        <Typography variant="body2" sx={{ width: 80 }}>Combined:</Typography>
        <Avatar color="primary" type="combined" size="lg">A</Avatar>
        <Avatar color="secondary" type="combined" size="lg">B</Avatar>
        <Avatar color="success" type="combined" size="lg">C</Avatar>
      </Stack>
    </Stack>
  ),
};

/**
 * Shape variants (circular, rounded, square)
 */
export const ShapeVariants: Story = {
  render: () => (
    <Stack spacing={2} direction="row" alignItems="center">
      <Stack alignItems="center" spacing={0.5}>
        <Avatar variant="circular" color="primary" type="filled" size="lg">C</Avatar>
        <Typography variant="caption">circular</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <Avatar variant="rounded" color="primary" type="filled" size="lg">R</Avatar>
        <Typography variant="caption">rounded</Typography>
      </Stack>
      <Stack alignItems="center" spacing={0.5}>
        <Avatar variant="square" color="primary" type="filled" size="lg">S</Avatar>
        <Typography variant="caption">square</Typography>
      </Stack>
    </Stack>
  ),
};

/**
 * Avatars with icons
 */
export const WithIcons: Story = {
  render: () => (
    <Stack spacing={2} direction="row" alignItems="center">
      <Avatar color="primary" type="filled" size="lg">
        <UserOutlined />
      </Avatar>
      <Avatar color="success" type="filled" size="lg">
        <TeamOutlined />
      </Avatar>
      <Avatar color="warning" type="filled" size="lg">
        <ShopOutlined />
      </Avatar>
    </Stack>
  ),
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={4}>
      <Typography variant="h6">Avatar Component Showcase</Typography>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Sizes</Typography>
        <Stack spacing={2} direction="row" alignItems="center">
          <Avatar size="badge" type="filled">B</Avatar>
          <Avatar size="xs" type="filled">XS</Avatar>
          <Avatar size="sm" type="filled">SM</Avatar>
          <Avatar size="md" type="filled">MD</Avatar>
          <Avatar size="lg" type="filled">LG</Avatar>
          <Avatar size="xl" type="filled">XL</Avatar>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Colors (Filled)</Typography>
        <Stack spacing={2} direction="row" alignItems="center">
          <Avatar color="primary" type="filled" size="md">P</Avatar>
          <Avatar color="secondary" type="filled" size="md">S</Avatar>
          <Avatar color="success" type="filled" size="md">S</Avatar>
          <Avatar color="error" type="filled" size="md">E</Avatar>
          <Avatar color="warning" type="filled" size="md">W</Avatar>
          <Avatar color="info" type="filled" size="md">I</Avatar>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Colors (Outlined)</Typography>
        <Stack spacing={2} direction="row" alignItems="center">
          <Avatar color="primary" type="outlined" size="md">P</Avatar>
          <Avatar color="secondary" type="outlined" size="md">S</Avatar>
          <Avatar color="success" type="outlined" size="md">S</Avatar>
          <Avatar color="error" type="outlined" size="md">E</Avatar>
          <Avatar color="warning" type="outlined" size="md">W</Avatar>
          <Avatar color="info" type="outlined" size="md">I</Avatar>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Colors (Combined)</Typography>
        <Stack spacing={2} direction="row" alignItems="center">
          <Avatar color="primary" type="combined" size="md">P</Avatar>
          <Avatar color="secondary" type="combined" size="md">S</Avatar>
          <Avatar color="success" type="combined" size="md">S</Avatar>
          <Avatar color="error" type="combined" size="md">E</Avatar>
          <Avatar color="warning" type="combined" size="md">W</Avatar>
          <Avatar color="info" type="combined" size="md">I</Avatar>
        </Stack>
      </Stack>
    </Stack>
  ),
};
