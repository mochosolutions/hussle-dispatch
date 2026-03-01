import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { PageWrapper } from './index';
import { ListSkeleton } from '../SkeletonLoader';
import { ErrorState } from '../ErrorState';
import { EmptyState } from '../EmptyState';

/**
 * PageWrapper provides a consistent structure for page content with:
 * - Loading state handling
 * - Error state handling
 * - Empty state handling
 * - Built-in ErrorBoundary protection
 */
const meta: Meta<typeof PageWrapper> = {
  title: 'Components/Layout/PageWrapper',
  component: PageWrapper,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    isError: {
      control: 'boolean',
      description: 'Show error state',
    },
    isEmpty: {
      control: 'boolean',
      description: 'Show empty state',
    },
    errorContext: {
      control: 'text',
      description: 'Context string for error boundary',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageWrapper>;

const SampleContent = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>
      Page Content
    </Typography>
    <Typography variant="body1" paragraph>
      This is the main content of the page wrapped in PageWrapper.
    </Typography>
    <Button variant="contained">Action Button</Button>
  </Paper>
);

export const Default: Story = {
  args: {
    children: <SampleContent />,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: <SampleContent />,
  },
};

export const LoadingWithCustomComponent: Story = {
  args: {
    isLoading: true,
    loadingComponent: <ListSkeleton rows={5} />,
    children: <SampleContent />,
  },
};

export const Error: Story = {
  args: {
    isError: true,
    children: <SampleContent />,
  },
};

export const ErrorWithCustomComponent: Story = {
  args: {
    isError: true,
    errorComponent: (
      <ErrorState
        title="Failed to load page"
        message="An error occurred while loading the page content."
        onRetry={() => alert('Retry clicked')}
      />
    ),
    children: <SampleContent />,
  },
};

export const Empty: Story = {
  args: {
    isEmpty: true,
    children: <SampleContent />,
  },
};

export const EmptyWithCustomComponent: Story = {
  args: {
    isEmpty: true,
    emptyComponent: (
      <EmptyState
        title="No items found"
        description="Get started by creating your first item."
        actionLabel="Create Item"
        onAction={() => alert('Create clicked')}
      />
    ),
    children: <SampleContent />,
  },
};

export const WithErrorContext: Story = {
  args: {
    errorContext: 'DashboardPage',
    children: <SampleContent />,
  },
};

export const FullPageExample: Story = {
  name: 'Full Page Example',
  render: () => (
    <Box sx={{ minHeight: 400 }}>
      <PageWrapper errorContext="ExamplePage">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to your dashboard
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3].map((n) => (
              <Paper
                key={n}
                sx={{ p: 2, flex: 1, textAlign: 'center', bgcolor: 'action.hover' }}
              >
                <Typography variant="h4">{n * 100}</Typography>
                <Typography variant="body2">Metric {n}</Typography>
              </Paper>
            ))}
          </Box>
        </Paper>
      </PageWrapper>
    </Box>
  ),
};

export const LoadingToContent: Story = {
  name: 'Loading → Content Transition',
  render: () => {
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <Box sx={{ minHeight: 300 }}>
        <PageWrapper isLoading={isLoading} loadingComponent={<ListSkeleton />}>
          <SampleContent />
        </PageWrapper>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Content loads after 2 seconds
        </Typography>
      </Box>
    );
  },
};

// Import React for the LoadingToContent story
import React from 'react';
