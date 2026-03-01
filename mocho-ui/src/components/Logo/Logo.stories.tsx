import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack } from '@mui/material';
import { Logo } from './index';

/**
 * Logo component for displaying brand identity.
 * Supports image logos, text logos, or a combination of both.
 * Can also display a mini/icon version for collapsed sidebars.
 */
const meta: Meta<typeof Logo> = {
  title: 'Components/Layout/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alt text for the image',
    },
    text: {
      control: 'text',
      description: 'Text to display',
    },
    width: {
      control: { type: 'number' },
      description: 'Logo width',
    },
    height: {
      control: { type: 'number' },
      description: 'Logo height',
    },
    textOnly: {
      control: 'boolean',
      description: 'Show text only (no image)',
    },
    isIcon: {
      control: 'boolean',
      description: 'Mini/icon version for collapsed sidebars',
    },
    to: {
      control: 'text',
      description: 'Link URL when clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  args: {},
};

export const WithText: Story = {
  args: {
    text: 'Mocho Solutions',
  },
};

export const TextOnly: Story = {
  args: {
    text: 'Mocho Solutions',
    textOnly: true,
  },
};

export const WithImageUrl: Story = {
  args: {
    src: 'https://via.placeholder.com/150x40?text=Logo',
    alt: 'Company Logo',
  },
};

export const ImageWithText: Story = {
  args: {
    src: 'https://via.placeholder.com/40x40?text=M',
    alt: 'Company Logo',
    text: 'Mocho',
  },
};

export const IconVersion: Story = {
  args: {
    isIcon: true,
  },
};

export const IconWithImage: Story = {
  args: {
    src: 'https://via.placeholder.com/40x40?text=M',
    alt: 'Logo Icon',
    isIcon: true,
  },
};

export const WithLink: Story = {
  args: {
    text: 'Mocho Solutions',
    to: '/',
  },
};

export const CustomDimensions: Story = {
  args: {
    src: 'https://via.placeholder.com/200x60?text=Wide+Logo',
    width: 200,
    height: 60,
  },
};

export const AllVariants: Story = {
  name: 'All Variants Comparison',
  render: () => (
    <Stack spacing={4} alignItems="flex-start">
      <Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 1 }}>
          Default (no props)
        </Box>
        <Logo />
      </Box>
      <Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 1 }}>
          Text Only
        </Box>
        <Logo text="Mocho Solutions" textOnly />
      </Box>
      <Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 1 }}>
          With Image
        </Box>
        <Logo src="https://via.placeholder.com/40x40?text=M" text="Mocho" />
      </Box>
      <Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 1 }}>
          Icon Version
        </Box>
        <Logo isIcon />
      </Box>
      <Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 1 }}>
          With Link
        </Box>
        <Logo text="Click Me" to="#" />
      </Box>
    </Stack>
  ),
};

export const InHeader: Story = {
  name: 'In Header Context',
  render: () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        minWidth: 400,
      }}
    >
      <Logo text="Mocho Solutions" to="/" />
      <Box sx={{ typography: 'body2' }}>Navigation items...</Box>
    </Box>
  ),
};

export const InSidebar: Story = {
  name: 'In Sidebar Context',
  render: () => (
    <Stack spacing={2}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          width: 240,
        }}
      >
        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 1 }}>
          Expanded Sidebar
        </Box>
        <Logo text="Mocho" src="https://via.placeholder.com/32x32?text=M" />
      </Box>
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          width: 64,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 1, display: 'none' }}>
          Collapsed Sidebar
        </Box>
        <Logo isIcon src="https://via.placeholder.com/32x32?text=M" />
      </Box>
    </Stack>
  ),
};
