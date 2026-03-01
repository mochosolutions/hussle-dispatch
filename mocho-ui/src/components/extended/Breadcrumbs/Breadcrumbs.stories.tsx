import type { Meta, StoryObj } from '@storybook/react';
import Breadcrumbs from '../Breadcrumbs';
import { Stack, Typography } from '@mui/material';
import { RightOutlined, HomeOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';

/**
 * Breadcrumbs provide navigation hierarchy showing the current page location.
 * Supports customizable icons, card wrapper, divider, and title positioning.
 */
const meta: Meta<typeof Breadcrumbs> = {
  title: 'Components/Extended/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    card: {
      control: 'boolean',
      description: 'Show breadcrumbs in a card wrapper',
    },
    divider: {
      control: 'boolean',
      description: 'Show divider after breadcrumbs',
    },
    icon: {
      control: 'boolean',
      description: 'Show icon for home item only',
    },
    icons: {
      control: 'boolean',
      description: 'Show icons for all items',
    },
    title: {
      control: 'boolean',
      description: 'Show page title',
    },
    titleBottom: {
      control: 'boolean',
      description: 'Show title below breadcrumbs',
    },
    rightAlign: {
      control: 'boolean',
      description: 'Align breadcrumbs to the right',
    },
    maxItems: {
      control: 'number',
      description: 'Maximum number of breadcrumbs to show',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

const basicItems = [
  { title: 'Dashboard', url: '/dashboard' },
  { title: 'Users', url: '/users' },
  { title: 'Profile' },
];

const itemsWithIcons = [
  { title: 'Dashboard', url: '/dashboard', icon: HomeOutlined },
  { title: 'Users', url: '/users', icon: UserOutlined },
  { title: 'Settings', icon: SettingOutlined },
];

/**
 * Default breadcrumbs with card wrapper
 */
export const Default: Story = {
  args: {
    items: basicItems,
    card: true,
  },
};

/**
 * Breadcrumbs without card wrapper
 */
export const WithoutCard: Story = {
  args: {
    items: basicItems,
    card: false,
  },
};

/**
 * Breadcrumbs with page title
 */
export const WithTitle: Story = {
  args: {
    items: basicItems,
    card: true,
    title: true,
  },
};

/**
 * Breadcrumbs with title at bottom
 */
export const WithTitleBottom: Story = {
  args: {
    items: basicItems,
    card: true,
    title: true,
    titleBottom: true,
  },
};

/**
 * Breadcrumbs with home icon only
 */
export const WithHomeIcon: Story = {
  args: {
    items: basicItems,
    card: true,
    icon: true,
  },
};

/**
 * Breadcrumbs with all icons
 */
export const WithAllIcons: Story = {
  args: {
    items: itemsWithIcons,
    card: true,
    icons: true,
  },
};

/**
 * Breadcrumbs with custom separator
 */
export const WithCustomSeparator: Story = {
  args: {
    items: basicItems,
    card: true,
    separator: RightOutlined,
  },
};

/**
 * Breadcrumbs without divider
 */
export const WithoutDivider: Story = {
  args: {
    items: basicItems,
    card: false,
    divider: false,
  },
};

/**
 * Right-aligned breadcrumbs with title
 */
export const RightAligned: Story = {
  args: {
    items: basicItems,
    card: true,
    title: true,
    rightAlign: true,
  },
};

/**
 * Long breadcrumb path with max items
 */
export const WithMaxItems: Story = {
  args: {
    items: [
      { title: 'Home', url: '/' },
      { title: 'Products', url: '/products' },
      { title: 'Electronics', url: '/products/electronics' },
      { title: 'Computers', url: '/products/electronics/computers' },
      { title: 'Laptops', url: '/products/electronics/computers/laptops' },
      { title: 'Gaming Laptops' },
    ],
    card: true,
    maxItems: 4,
  },
};

/**
 * Single item breadcrumb
 */
export const SingleItem: Story = {
  args: {
    items: [{ title: 'Dashboard' }],
    card: true,
    title: true,
  },
};

/**
 * Breadcrumbs with active item marked explicitly
 */
export const WithExplicitActiveItem: Story = {
  args: {
    items: [
      { title: 'Dashboard', url: '/dashboard' },
      { title: 'Users', url: '/users', active: true },
      { title: 'Profile', url: '/profile' },
    ],
    card: true,
  },
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={4}>
      <Typography variant="h6">Breadcrumbs Component Showcase</Typography>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Default (in card)</Typography>
        <Breadcrumbs items={basicItems} card />
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Without Card</Typography>
        <Breadcrumbs items={basicItems} card={false} />
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">With Title</Typography>
        <Breadcrumbs items={basicItems} card title />
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">With Title Bottom</Typography>
        <Breadcrumbs items={basicItems} card title titleBottom />
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">With Home Icon</Typography>
        <Breadcrumbs items={basicItems} card icon />
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">With All Icons</Typography>
        <Breadcrumbs items={itemsWithIcons} card icons />
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Right Aligned with Title</Typography>
        <Breadcrumbs items={basicItems} card title rightAlign />
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Custom Separator</Typography>
        <Breadcrumbs items={basicItems} card separator={RightOutlined} />
      </Stack>
    </Stack>
  ),
};
