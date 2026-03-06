import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Error Boundary Props
 */
export interface ErrorBoundaryProps {
  /**
   * Child components to wrap with error boundary
   */
  children: ReactNode;

  /**
   * Custom fallback UI renderer
   * @param error - The error that was caught
   * @param reset - Function to reset the error boundary
   */
  fallback?: (error: Error, reset: () => void) => ReactNode;

  /**
   * Callback when an error is caught
   * @param error - The error object
   * @param errorInfo - React error info with component stack
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Context string for error logging (e.g., "CrudListPage", "CrudFormPage")
   */
  context?: string;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches React errors in child components and displays fallback UI
 *
 * @example
 * <ErrorBoundary
 *   context="CrudListPage"
 *   onError={(error, errorInfo) => {
 *     console.error('Error caught:', error, errorInfo);
 *     // Log to monitoring service
 *   }}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, context } = this.props;

    // Log error to monitoring service
    if (onError) {
      onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `ErrorBoundary caught error${context ? ` in ${context}` : ''}:`,
        error,
        errorInfo
      );
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, context } = this.props;

    if (hasError && error) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback(error, this.resetErrorBoundary);
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={error}
          context={context}
          onReset={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

/**
 * Default Error Fallback Props
 */
interface DefaultErrorFallbackProps {
  error: Error;
  context?: string;
  onReset: () => void;
}

/**
 * Default Error Fallback Component
 * Displays a user-friendly error message with retry option
 */
function DefaultErrorFallback({ error, context, onReset }: DefaultErrorFallbackProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        minHeight: '400px',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
        {context ? `Error in ${context}` : 'Something went wrong'}
      </h2>
      <p style={{ marginBottom: '1.5rem', color: '#666', maxWidth: '500px' }}>
        An unexpected error occurred. Please try refreshing the page or contact support if the
        problem persists.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginBottom: '1.5rem', textAlign: 'left', maxWidth: '600px' }}>
          <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 500 }}>
            Error Details (Development)
          </summary>
          <pre
            style={{
              padding: '1rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem',
            }}
          >
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}

      <button
        onClick={onReset}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 500,
          color: 'white',
          backgroundColor: '#1976d2',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1565c0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1976d2';
        }}
      >
        Try Again
      </button>
    </div>
  );
}

export default ErrorBoundary;
