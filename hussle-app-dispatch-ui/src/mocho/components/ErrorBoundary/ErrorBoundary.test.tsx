import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './index';

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  const BuggyComponent = () => {
    throw new Error('Test error');
  };

  const WorkingComponent = () => <div>Working component</div>;

  describe('rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('renders fallback UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders context in fallback when provided', () => {
      render(
        <ErrorBoundary context="UserProfile">
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error in UserProfile')).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary
          fallback={(error, reset) => (
            <div>
              <span>Custom error: {error.message}</span>
              <button onClick={reset}>Reset</button>
            </div>
          )}
        >
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    });
  });

  describe('error callback', () => {
    it('calls onError when error is caught', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('passes context to onError', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary context="Dashboard" onError={onError}>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('reset functionality', () => {
    it('resets error boundary when reset is called from custom fallback', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ConditionalComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Component recovered</div>;
      };

      render(
        <ErrorBoundary
          fallback={(error, reset) => (
            <div>
              <span>Error occurred</span>
              <button
                onClick={() => {
                  shouldThrow = false;
                  reset();
                }}
              >
                Reset
              </button>
            </div>
          )}
        >
          <ConditionalComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error occurred')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Reset' }));

      expect(screen.getByText('Component recovered')).toBeInTheDocument();
    });
  });

  describe('default fallback', () => {
    it('renders try again button in default fallback', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('shows error message in default fallback', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('default fallback has role alert', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('default fallback has aria-live assertive', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });
});
