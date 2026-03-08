import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from './index';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('ErrorState', () => {
  describe('rendering', () => {
    it('renders with default error message when no message provided', () => {
      renderWithTheme(<ErrorState />);

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      renderWithTheme(<ErrorState message="Failed to load data" />);

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('renders error object message', () => {
      const error = new Error('Network error');
      renderWithTheme(<ErrorState error={error} />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('renders string error', () => {
      renderWithTheme(<ErrorState error="Something went wrong" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('prefers message prop over error message', () => {
      const error = new Error('Error message');
      renderWithTheme(<ErrorState message="Custom message" error={error} />);

      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });
  });

  describe('title', () => {
    it('renders default title for error severity', () => {
      renderWithTheme(<ErrorState severity="error" />);

      expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    });

    it('renders default title for warning severity', () => {
      renderWithTheme(<ErrorState severity="warning" />);

      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('renders default title for info severity', () => {
      renderWithTheme(<ErrorState severity="info" />);

      expect(screen.getByText('Information')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      renderWithTheme(<ErrorState title="Loading Failed" />);

      expect(screen.getByText('Loading Failed')).toBeInTheDocument();
    });
  });

  describe('buttons', () => {
    it('renders retry button when onRetry is provided', () => {
      renderWithTheme(<ErrorState onRetry={jest.fn()} />);

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      renderWithTheme(<ErrorState />);

      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    });

    it('renders go back button when onGoBack is provided', () => {
      renderWithTheme(<ErrorState onGoBack={jest.fn()} />);

      expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    });

    it('does not render go back button when onGoBack is not provided', () => {
      renderWithTheme(<ErrorState />);

      expect(screen.queryByRole('button', { name: 'Go Back' })).not.toBeInTheDocument();
    });

    it('hides retry button when hideRetry is true', () => {
      renderWithTheme(<ErrorState onRetry={jest.fn()} hideRetry />);

      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    });

    it('hides go back button when hideGoBack is true', () => {
      renderWithTheme(<ErrorState onGoBack={jest.fn()} hideGoBack />);

      expect(screen.queryByRole('button', { name: 'Go Back' })).not.toBeInTheDocument();
    });

    it('renders custom retry text', () => {
      renderWithTheme(<ErrorState onRetry={jest.fn()} retryText="Try Again" />);

      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('renders custom go back text', () => {
      renderWithTheme(<ErrorState onGoBack={jest.fn()} goBackText="Return" />);

      expect(screen.getByRole('button', { name: 'Return' })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();
      renderWithTheme(<ErrorState onRetry={onRetry} />);

      await user.click(screen.getByRole('button', { name: 'Retry' }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onGoBack when go back button is clicked', async () => {
      const user = userEvent.setup();
      const onGoBack = jest.fn();
      renderWithTheme(<ErrorState onGoBack={onGoBack} />);

      await user.click(screen.getByRole('button', { name: 'Go Back' }));

      expect(onGoBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has role alert', () => {
      renderWithTheme(<ErrorState />);

      // Component has both outer Box and inner MUI Alert with role="alert"
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('has aria-live assertive', () => {
      renderWithTheme(<ErrorState />);

      // The outer container has aria-live="assertive"
      const alerts = screen.getAllByRole('alert');
      const alertWithAriaLive = alerts.find(
        (alert) => alert.getAttribute('aria-live') === 'assertive'
      );
      expect(alertWithAriaLive).toBeInTheDocument();
    });
  });

  describe('error details', () => {
    it('shows error details in development mode when showDetails is true', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at TestComponent';

      renderWithTheme(<ErrorState error={error} showDetails />);

      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
    });

    it('does not show error details when showDetails is false', () => {
      const error = new Error('Test error');
      renderWithTheme(<ErrorState error={error} showDetails={false} />);

      expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();
    });
  });
});
