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
export declare function ErrorState({ message, error, severity, title, onRetry, onGoBack, retryText, goBackText, hideRetry, hideGoBack, minHeight, showDetails, }: ErrorStateProps): JSX.Element;
export default ErrorState;
//# sourceMappingURL=ErrorState.d.ts.map