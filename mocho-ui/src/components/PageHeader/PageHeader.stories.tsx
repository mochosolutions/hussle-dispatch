import type { Meta, StoryObj } from '@storybook/react';
import { Box, Button, Stack, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import { PageHeader } from './index';

/**
 * PageHeader provides a consistent header structure for pages with:
 * - Title and optional subtitle
 * - Optional back navigation button
 * - Slot for header actions (buttons, icons, etc.)
 */
const meta: Meta<typeof PageHeader> = {
  title: 'Components/Layout/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Page title (required)',
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle',
    },
    showBackButton: {
      control: 'boolean',
      description: 'Show back navigation button',
    },
    onNavigate: {
      action: 'navigate',
      description: 'Callback when back button is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Dashboard',
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Dashboard',
    subtitle: 'Welcome back! Here is what is happening today.',
  },
};

export const WithBackButton: Story = {
  args: {
    title: 'Edit User',
    showBackButton: true,
    onNavigate: () => alert('Navigate back'),
  },
};

export const WithBackButtonAndSubtitle: Story = {
  args: {
    title: 'Edit User',
    subtitle: 'Update user information and permissions',
    showBackButton: true,
    onNavigate: () => alert('Navigate back'),
  },
};

export const WithSingleAction: Story = {
  args: {
    title: 'Users',
    subtitle: 'Manage user accounts',
    headerActions: (
      <Button variant="contained" startIcon={<AddIcon />}>
        Add User
      </Button>
    ),
  },
};

export const WithMultipleActions: Story = {
  args: {
    title: 'Blog Posts',
    subtitle: 'Manage your content',
    headerActions: (
      <Stack direction="row" spacing={1}>
        <IconButton>
          <RefreshIcon />
        </IconButton>
        <IconButton>
          <SettingsIcon />
        </IconButton>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Post
        </Button>
      </Stack>
    ),
  },
};

export const FullExample: Story = {
  args: {
    title: 'Project Details',
    subtitle: 'View and edit project information',
    showBackButton: true,
    onNavigate: () => alert('Go back to projects'),
    headerActions: (
      <Stack direction="row" spacing={1}>
        <Button variant="outlined">Cancel</Button>
        <Button variant="contained">Save</Button>
      </Stack>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    title: 'This is a very long page title that might wrap on smaller screens',
    subtitle: 'With an equally long subtitle to test layout behavior',
    headerActions: <Button variant="contained">Action</Button>,
  },
};

export const InPageContext: Story = {
  name: 'In Page Context',
  render: () => (
    <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 1 }}>
      <PageHeader
        title="Users"
        subtitle="Manage user accounts and permissions"
        headerActions={
          <Button variant="contained" startIcon={<AddIcon />}>
            Add User
          </Button>
        }
      />
      <Box
        sx={{
          mt: 3,
          p: 3,
          bgcolor: 'action.hover',
          borderRadius: 1,
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Page content goes here
      </Box>
    </Box>
  ),
};

export const FormPageContext: Story = {
  name: 'Form Page Context',
  render: () => (
    <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 1 }}>
      <PageHeader
        title="Create New Post"
        showBackButton
        onNavigate={() => alert('Go back')}
        headerActions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="inherit">
              Save Draft
            </Button>
            <Button variant="contained">Publish</Button>
          </Stack>
        }
      />
      <Box
        sx={{
          mt: 3,
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ mb: 2 }}>Form content goes here...</Box>
      </Box>
    </Box>
  ),
};
