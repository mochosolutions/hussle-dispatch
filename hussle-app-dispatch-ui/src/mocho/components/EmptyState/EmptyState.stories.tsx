import type { Meta, StoryObj } from '@storybook/react';
import EmptyState from './EmptyState';
import { Stack } from '@mui/material';

/**
 * EmptyState component for displaying empty states with different variants.
 * Used when there's no data to display or when an error occurs.
 */
const meta: Meta<typeof EmptyState> = {
  title: 'Components/Feedback/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['no-data', 'no-results', 'error', 'loading'],
      description: 'The type of empty state to display',
    },
    title: {
      control: 'text',
      description: 'Main heading text',
    },
    message: {
      control: 'text',
      description: 'Descriptive message',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * Default no-data state
 */
export const NoData: Story = {
  args: {
    variant: 'no-data',
    title: 'No Data Available',
    message: 'There is currently no data to display. Try adding some items first.',
  },
};

/**
 * No search results state
 */
export const NoResults: Story = {
  args: {
    variant: 'no-results',
    title: 'No Results Found',
    message: 'We couldn\'t find anything matching your search. Try different keywords.',
  },
};

/**
 * Error state
 */
export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Something Went Wrong',
    message: 'We encountered an error while loading the data. Please try again later.',
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    variant: 'loading',
    title: 'Loading...',
    message: 'Please wait while we fetch your data.',
  },
};

/**
 * Custom message
 */
export const CustomMessage: Story = {
  args: {
    variant: 'no-data',
    title: 'No Blog Posts Yet',
    message: 'Start creating your first blog post to share your thoughts with the world!',
  },
};

/**
 * Multiple states in a grid (for comparison)
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={3} sx={{ p: 2 }}>
      <EmptyState
        variant="no-data"
        title="No Data"
        message="No data available"
      />
      <EmptyState
        variant="no-results"
        title="No Results"
        message="No results found"
      />
      <EmptyState
        variant="error"
        title="Error"
        message="An error occurred"
      />
      <EmptyState
        variant="loading"
        title="Loading"
        message="Loading data..."
      />
    </Stack>
  ),
};
