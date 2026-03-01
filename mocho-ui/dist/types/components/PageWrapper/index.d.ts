import { default as React, ReactNode } from 'react';
import { Box } from '@mui/material';
interface PageWrapperProps extends React.ComponentProps<typeof Box> {
    children: React.ReactNode;
    isLoading?: boolean;
    loadingComponent?: ReactNode;
    isEmpty?: boolean;
    emptyComponent?: ReactNode;
    errorComponent?: ReactNode;
    isError?: boolean;
    errorContext?: string;
    onBoundaryError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
/**
 * PageWrapper - Wraps page content with loading state and error boundary
 *
 * @example
 * <PageWrapper
 *   title="Dashboard"
 *   loading={isLoading}
 *   loadingComponent={<CustomSkeleton />}
 *   errorContext="DashboardPage"
 *   onBoundaryError={(error, info) => {
 *     // handle error logging here
 *   }}
 * >
 *   <DashboardContent />
 * </PageWrapper>
 */
export declare const PageWrapper: React.FC<PageWrapperProps>;
export default PageWrapper;
//# sourceMappingURL=index.d.ts.map