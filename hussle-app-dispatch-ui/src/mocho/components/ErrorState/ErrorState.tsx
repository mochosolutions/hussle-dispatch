import { Box, Button, Typography, Alert, AlertTitle } from '@mui/material';
import { ErrorOutline, Refresh, ArrowBack } from '@mui/icons-material';

/**
 * Error Severity Levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Error State Props
 */
export interface ErrorStateProps {
  /**
   * Error message to display
   */
  message?: string;

  /**
   * Error object (optional)
   */
  error?: Error | string | null;

  /**
   * Error severity level
   * @default 'error'
   */
  severity?: ErrorSeverity;

  /**
   * Title/heading for the error
   */
  title?: string;

  /**
   * Callback when retry button is clicked
   */
  onRetry?: () => void;

  /**
   * Callback when go back button is clicked
   */
  onGoBack?: () => void;

  /**
   * Custom retry button text
   * @default 'Retry'
   */
  retryText?: string;

  /**
   * Custom go back button text
   * @default 'Go Back'
   */
  goBackText?: string;

  /**
   * Hide retry button
   * @default false
   */
  hideRetry?: boolean;

  /**
   * Hide go back button
   * @default false
   */
  hideGoBack?: boolean;

  /**
   * Minimum height for the error container
   * @default 300
   */
  minHeight?: number;

  /**
   * Show error details (development mode)
   * @default process.env.NODE_ENV === 'development'
   */
  showDetails?: boolean;
}

/**
 * Error State Component
 * Displays error messages with optional retry and navigation actions
 *
 * @example
 * <ErrorState
 *   title="Failed to load data"
 *   message="An error occurred while fetching authors."
 *   error={error}
 *   onRetry={handleRetry}
 *   onGoBack={handleGoBack}
 * />
 */
export function ErrorState({
  message,
  error,
  severity = 'error',
  title,
  onRetry,
  onGoBack,
  retryText = 'Retry',
  goBackText = 'Go Back',
  hideRetry = false,
  hideGoBack = false,
  minHeight = 300,
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorStateProps): JSX.Element {
  const errorMessage = typeof error === 'string' ? error : error?.message;
  const displayMessage = message || errorMessage || 'An unexpected error occurred';
  const displayTitle = title || getDefaultTitle(severity);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        padding: 3,
        textAlign: 'center',
      }}
      role="alert"
      aria-live="assertive"
    >
      <Alert
        severity={severity}
        icon={<ErrorOutline fontSize="large" />}
        sx={{
          width: '100%',
          maxWidth: 600,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
          {displayTitle}
        </AlertTitle>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {displayMessage}
        </Typography>

        {showDetails && error && typeof error !== 'string' && (
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 500 }}>
              Error Details (Development)
            </summary>
            <Box
              component="pre"
              sx={{
                padding: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
              {'\n\n'}
              {error.stack}
            </Box>
          </details>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!hideRetry && onRetry && (
            <Button
              variant="contained"
              color={severity === 'error' ? 'error' : 'primary'}
              startIcon={<Refresh />}
              onClick={onRetry}
              aria-label={retryText}
            >
              {retryText}
            </Button>
          )}

          {!hideGoBack && onGoBack && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBack />}
              onClick={onGoBack}
              aria-label={goBackText}
            >
              {goBackText}
            </Button>
          )}
        </Box>
      </Alert>
    </Box>
  );
}

/**
 * Get default title based on severity
 */
function getDefaultTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case 'error':
      return 'Error Occurred';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Information';
    default:
      return 'Error Occurred';
  }
}

export default ErrorState;
