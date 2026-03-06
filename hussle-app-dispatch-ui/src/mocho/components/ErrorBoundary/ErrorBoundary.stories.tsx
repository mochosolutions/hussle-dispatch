import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from './index';
import { Button, Typography, Stack, Box } from '@mui/material';

/**
 * ErrorBoundary catches React errors in child components and displays fallback UI.
 * Supports custom fallback rendering, error callbacks, and context labeling.
 */
const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/Feedback/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

/**
 * Component that throws an error when clicked
 */
const BuggyComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('This is a simulated error for testing the ErrorBoundary!');
  }

  return (
    <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Typography>Component is working normally.</Typography>
    </Box>
  );
};

/**
 * Interactive demo with error trigger
 */
const ErrorDemo = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [key, setKey] = useState(0);

  const triggerError = () => {
    setShouldThrow(true);
  };

  const resetDemo = () => {
    setShouldThrow(false);
    setKey((k) => k + 1); // Force remount of ErrorBoundary
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" color="error" onClick={triggerError}>
          Trigger Error
        </Button>
        <Button variant="outlined" onClick={resetDemo}>
          Reset Demo
        </Button>
      </Stack>

      <ErrorBoundary key={key}>
        <BuggyComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </Stack>
  );
};

/**
 * Default error boundary with auto-triggered error
 */
export const Default: Story = {
  render: () => <ErrorDemo />,
};

/**
 * With context label
 */
export const WithContext: Story = {
  render: () => {
    const BuggyButton = () => {
      throw new Error('Button component failed to render');
    };

    return (
      <ErrorBoundary context="UserDashboard">
        <BuggyButton />
      </ErrorBoundary>
    );
  },
};

/**
 * With custom fallback
 */
export const CustomFallback: Story = {
  render: () => {
    const BuggyContent = () => {
      throw new Error('Content failed to load');
    };

    return (
      <ErrorBoundary
        fallback={(error, reset) => (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: 'error.light',
              borderRadius: 2,
              color: 'error.contrastText',
            }}
          >
            <Typography variant="h5" gutterBottom>
              Custom Error Display
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {error.message}
            </Typography>
            <Button variant="contained" color="inherit" onClick={reset}>
              Try Again
            </Button>
          </Box>
        )}
      >
        <BuggyContent />
      </ErrorBoundary>
    );
  },
};

/**
 * With error callback
 */
export const WithErrorCallback: Story = {
  render: () => {
    const BuggyWidget = () => {
      throw new Error('Widget initialization failed');
    };

    return (
      <ErrorBoundary
        context="WidgetContainer"
        onError={(error, errorInfo) => {
          console.log('Error caught by boundary:', error.message);
          console.log('Component stack:', errorInfo.componentStack);
          // In production, you would send this to your error monitoring service
        }}
      >
        <BuggyWidget />
      </ErrorBoundary>
    );
  },
};

/**
 * Working component (no error)
 */
export const WorkingComponent: Story = {
  render: () => (
    <ErrorBoundary context="ProfileSection">
      <Box sx={{ p: 3, border: 1, borderColor: 'success.main', borderRadius: 1 }}>
        <Typography variant="h6" color="success.main">
          Everything is working!
        </Typography>
        <Typography color="text.secondary">
          This component is wrapped in an ErrorBoundary but works correctly.
        </Typography>
      </Box>
    </ErrorBoundary>
  ),
};

/**
 * Nested error boundaries
 */
export const NestedBoundaries: Story = {
  render: () => {
    const BuggySection = () => {
      throw new Error('Section A failed');
    };

    return (
      <ErrorBoundary context="App">
        <Stack spacing={2}>
          <Typography variant="h6">Parent Boundary (App)</Typography>

          <Stack direction="row" spacing={2}>
            <ErrorBoundary context="SectionA">
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, flex: 1 }}>
                <BuggySection />
              </Box>
            </ErrorBoundary>

            <ErrorBoundary context="SectionB">
              <Box sx={{ p: 2, border: 1, borderColor: 'success.main', borderRadius: 1, flex: 1 }}>
                <Typography color="success.main">Section B works!</Typography>
              </Box>
            </ErrorBoundary>
          </Stack>
        </Stack>
      </ErrorBoundary>
    );
  },
};
