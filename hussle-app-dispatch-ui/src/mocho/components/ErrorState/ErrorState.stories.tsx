import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Stack } from '@mui/material';
import ErrorState from './ErrorState';

/**
 * ErrorState - Displays error messages with optional retry and navigation actions.
 *
 * Use this component when you need to show error states with user-friendly messages
 * and action buttons for retry or navigation. Supports different severity levels.
 */
const meta: Meta<typeof ErrorState> = {
  title: 'Components/Feedback/ErrorState',
  component: ErrorState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'Error message to display',
    },
    error: {
      control: 'object',
      description: 'Error object (message will be extracted)',
    },
    severity: {
      control: 'select',
      options: ['error', 'warning', 'info'],
      description: 'Severity level (affects styling and default title)',
    },
    title: {
      control: 'text',
      description: 'Title/heading for the error (auto-generated if not provided)',
    },
    retryText: {
      control: 'text',
      description: 'Custom retry button text (default: "Retry")',
    },
    goBackText: {
      control: 'text',
      description: 'Custom go back button text (default: "Go Back")',
    },
    hideRetry: {
      control: 'boolean',
      description: 'Hide the retry button',
    },
    hideGoBack: {
      control: 'boolean',
      description: 'Hide the go back button',
    },
    minHeight: {
      control: 'number',
      description: 'Minimum height for the error container',
    },
    showDetails: {
      control: 'boolean',
      description: 'Show error details (stack trace) - useful in development',
    },
    onRetry: {
      action: 'retry-clicked',
      description: 'Callback when retry button is clicked',
    },
    onGoBack: {
      action: 'go-back-clicked',
      description: 'Callback when go back button is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

/**
 * Default error state with retry and go back actions
 */
export const Default: Story = {
  args: {
    message: 'An error occurred while loading the data. Please try again.',
    onRetry: action('retry-clicked'),
    onGoBack: action('go-back-clicked'),
  },
};

/**
 * Error severity (default) - for critical errors
 */
export const ErrorSeverity: Story = {
  args: {
    severity: 'error',
    title: 'Failed to Load Data',
    message: 'We encountered an error while fetching your data. This might be a temporary issue.',
    onRetry: action('retry-clicked'),
    onGoBack: action('go-back-clicked'),
  },
};

/**
 * Warning severity - for non-critical issues
 */
export const WarningSeverity: Story = {
  args: {
    severity: 'warning',
    title: 'Connection Unstable',
    message: 'Your connection appears to be slow. Some features may not work as expected.',
    onRetry: action('retry-clicked'),
    onGoBack: action('go-back-clicked'),
  },
};

/**
 * Info severity - for informational messages
 */
export const InfoSeverity: Story = {
  args: {
    severity: 'info',
    title: 'Service Maintenance',
    message: 'This service is temporarily unavailable due to scheduled maintenance.',
    onRetry: action('retry-clicked'),
    onGoBack: action('go-back-clicked'),
  },
};

/**
 * With Error object - extracts message from Error
 */
export const WithErrorObject: Story = {
  args: {
    error: new Error('Network request failed: Unable to connect to server'),
    onRetry: action('retry-clicked'),
    onGoBack: action('go-back-clicked'),
  },
};

/**
 * With error details visible (development mode)
 */
export const WithDetails: Story = {
  args: {
    title: 'API Error',
    error: (() => {
      const err = new Error('TypeError: Cannot read properties of undefined');
      err.stack = `TypeError: Cannot read properties of undefined
    at fetchData (src/api/client.ts:42:15)
    at async loadPosts (src/pages/blog/index.tsx:28:5)
    at async renderPage (src/lib/router.ts:156:3)`;
      return err;
    })(),
    showDetails: true,
    onRetry: action('retry-clicked'),
    onGoBack: action('go-back-clicked'),
  },
};

/**
 * Retry only - no go back button
 */
export const RetryOnly: Story = {
  args: {
    title: 'Failed to Save',
    message: 'Your changes could not be saved. Please try again.',
    hideGoBack: true,
    onRetry: action('retry-clicked'),
  },
};

/**
 * Go back only - no retry button
 */
export const GoBackOnly: Story = {
  args: {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    hideRetry: true,
    onGoBack: action('go-back-clicked'),
  },
};

/**
 * No action buttons
 */
export const NoActions: Story = {
  args: {
    title: 'Access Denied',
    message: 'You do not have permission to view this content. Please contact your administrator.',
    hideRetry: true,
    hideGoBack: true,
  },
};

/**
 * Custom button labels
 */
export const CustomLabels: Story = {
  args: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again to continue.',
    retryText: 'Log In Again',
    goBackText: 'Return Home',
    onRetry: action('login-clicked'),
    onGoBack: action('home-clicked'),
  },
};

/**
 * Network error scenario
 */
export const NetworkError: Story = {
  args: {
    title: 'Network Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    severity: 'error',
    retryText: 'Try Again',
    onRetry: action('retry-clicked'),
    onGoBack: action('go-back-clicked'),
  },
};

/**
 * 404 Not Found scenario
 */
export const NotFound: Story = {
  args: {
    title: 'Resource Not Found',
    message: 'The blog post you are looking for may have been moved or deleted.',
    severity: 'warning',
    hideRetry: true,
    goBackText: 'Back to Blog',
    onGoBack: action('go-back-clicked'),
  },
};

/**
 * Custom minimum height
 */
export const CustomHeight: Story = {
  args: {
    message: 'An error occurred',
    minHeight: 150,
    onRetry: action('retry-clicked'),
    onGoBack: action('go-back-clicked'),
  },
};

/**
 * All severities comparison
 */
export const AllSeverities: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: 600 }}>
      <ErrorState
        severity="error"
        title="Error Occurred"
        message="This is an error severity message"
        onRetry={action('error-retry')}
        onGoBack={action('error-goback')}
        minHeight={200}
      />
      <ErrorState
        severity="warning"
        title="Warning"
        message="This is a warning severity message"
        onRetry={action('warning-retry')}
        onGoBack={action('warning-goback')}
        minHeight={200}
      />
      <ErrorState
        severity="info"
        title="Information"
        message="This is an info severity message"
        onRetry={action('info-retry')}
        onGoBack={action('info-goback')}
        minHeight={200}
      />
    </Stack>
  ),
};
