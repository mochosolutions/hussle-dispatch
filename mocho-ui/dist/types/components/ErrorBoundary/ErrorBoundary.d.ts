import { Component, ErrorInfo, ReactNode } from 'react';
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
export declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    resetErrorBoundary: () => void;
    render(): ReactNode;
}
export default ErrorBoundary;
//# sourceMappingURL=ErrorBoundary.d.ts.map