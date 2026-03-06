import type { Meta, StoryObj } from '@storybook/react';
import { Button, Typography, Box, Stack } from '@mui/material';
import MainCard from './index';

/**
 * MainCard is a styled card wrapper component that provides consistent styling
 * for card-based content areas in admin dashboards. It supports title, subtitle,
 * actions, and various styling options.
 */
const meta: Meta<typeof MainCard> = {
  title: 'Components/Layout/MainCard',
  component: MainCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Card title displayed in the header',
    },
    subheader: {
      control: 'text',
      description: 'Subtitle text displayed below the title',
    },
    darkTitle: {
      control: 'boolean',
      description: 'Use larger h4 typography variant for title',
    },
    divider: {
      control: 'boolean',
      description: 'Show divider between header and content',
    },
    border: {
      control: 'boolean',
      description: 'Show border around the card',
    },
    content: {
      control: 'boolean',
      description: 'Wrap children in CardContent component',
    },
    elevation: {
      control: { type: 'number', min: 0, max: 24 },
      description: 'Material-UI elevation level (0-24)',
    },
    boxShadow: {
      control: 'boolean',
      description: 'Apply box shadow to the card',
    },
    modal: {
      control: 'boolean',
      description: 'Position card as a centered modal overlay',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MainCard>;

/**
 * Default MainCard with title and basic content
 */
export const Default: Story = {
  args: {
    title: 'Card Title',
    children: (
      <Typography>
        This is the card content. MainCard wraps content with consistent styling
        and optional header, making it ideal for dashboard sections.
      </Typography>
    ),
  },
};

/**
 * Card with title and subheader
 */
export const WithSubheader: Story = {
  args: {
    title: 'Blog Posts',
    subheader: 'Manage your published and draft articles',
    children: (
      <Typography>
        Content goes here. The subheader provides additional context about the
        card&apos;s purpose.
      </Typography>
    ),
  },
};

/**
 * Card with a secondary action button in the header
 */
export const WithSecondaryAction: Story = {
  args: {
    title: 'Authors',
    secondary: (
      <Button variant="contained" size="small">
        Add Author
      </Button>
    ),
    children: (
      <Typography>
        The secondary action appears in the card header, typically used for
        create/add buttons.
      </Typography>
    ),
  },
};

/**
 * Card using dark title variant (h4 typography)
 */
export const DarkTitle: Story = {
  args: {
    title: 'Dark Title Variant',
    darkTitle: true,
    children: (
      <Typography>
        The dark title variant uses h4 typography for a more prominent heading
        style.
      </Typography>
    ),
  },
};

/**
 * Card without divider between header and content
 */
export const NoDivider: Story = {
  args: {
    title: 'No Divider',
    divider: false,
    children: (
      <Typography>
        When divider is set to false, there&apos;s no line between the header
        and content.
      </Typography>
    ),
  },
};

/**
 * Card without border
 */
export const NoBorder: Story = {
  args: {
    title: 'No Border',
    border: false,
    boxShadow: true,
    children: (
      <Typography>
        Cards without borders rely on shadow for definition. This style works
        well on colored backgrounds.
      </Typography>
    ),
  },
};

/**
 * Card with elevation shadow
 */
export const WithElevation: Story = {
  args: {
    title: 'Elevated Card',
    elevation: 3,
    border: false,
    children: (
      <Typography>
        Using Material-UI elevation creates a layered shadow effect. Higher
        values create more prominent shadows.
      </Typography>
    ),
  },
};

/**
 * Card without CardContent wrapper (raw children)
 */
export const NoContentWrapper: Story = {
  args: {
    title: 'No Content Wrapper',
    content: false,
    children: (
      <Box sx={{ p: 2, bgcolor: 'grey.100' }}>
        <Typography>
          When content prop is false, children are rendered directly without
          CardContent padding. Useful for full-width content like tables or
          data grids.
        </Typography>
      </Box>
    ),
  },
};

/**
 * Card with custom content padding
 */
export const CustomContentPadding: Story = {
  args: {
    title: 'Custom Padding',
    contentSX: { p: 4 },
    children: (
      <Typography>
        The contentSX prop allows customizing the CardContent styling,
        including padding, background color, and more.
      </Typography>
    ),
  },
};

/**
 * Card styled as a modal
 */
export const ModalStyle: Story = {
  args: {
    title: 'Edit Item',
    modal: true,
    secondary: (
      <Button variant="text" size="small">
        Close
      </Button>
    ),
    children: (
      <Typography>
        When modal prop is true, the card is positioned as a centered overlay.
        This is useful for dialog-style content within the same page context.
      </Typography>
    ),
  },
  decorators: [
    (Story) => (
      <Box
        sx={{
          position: 'relative',
          height: 400,
          bgcolor: 'rgba(0,0,0,0.1)',
        }}
      >
        <Story />
      </Box>
    ),
  ],
};

/**
 * Card without any title (content only)
 */
export const ContentOnly: Story = {
  args: {
    children: (
      <Typography>
        Cards can also be used without a title for simple content containers.
        No header or divider is rendered.
      </Typography>
    ),
  },
};

/**
 * Complex card with form-like content
 */
export const ComplexContent: Story = {
  args: {
    title: 'User Settings',
    subheader: 'Manage your account preferences',
    secondary: (
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" size="small">
          Cancel
        </Button>
        <Button variant="contained" size="small">
          Save Changes
        </Button>
      </Stack>
    ),
    children: (
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update your personal information and avatar.
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure how and when you receive notifications.
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Security
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage password and two-factor authentication.
          </Typography>
        </Box>
      </Stack>
    ),
  },
};

/**
 * All MainCard variants displayed together for comparison
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={2}>
      <MainCard title="Default Card">
        <Typography>Standard card with default settings.</Typography>
      </MainCard>

      <MainCard title="Dark Title" darkTitle>
        <Typography>Card with prominent h4 title.</Typography>
      </MainCard>

      <MainCard title="No Border" border={false} boxShadow>
        <Typography>Card without border, using shadow instead.</Typography>
      </MainCard>

      <MainCard
        title="With Action"
        secondary={<Button size="small">Action</Button>}
      >
        <Typography>Card with header action button.</Typography>
      </MainCard>

      <MainCard title="With Subheader" subheader="Supporting text">
        <Typography>Card with descriptive subheader.</Typography>
      </MainCard>
    </Stack>
  ),
};
