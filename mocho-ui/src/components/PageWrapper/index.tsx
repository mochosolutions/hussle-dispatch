import React, { ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";
import {styled} from '@mui/material/styles';
import { ErrorBoundary } from "../ErrorBoundary/ErrorBoundary";

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

const LoaderWrapper = styled('div')(({theme}) => ({
  zIndex: 2001,
  width: '100%',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& > * + *': {
    marginTop: theme.spacing(2),
  },
}));

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
export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  // title,
  isLoading = false,
  loadingComponent,
  isEmpty,
  emptyComponent,
  errorComponent,
  isError,
  errorContext,
  onBoundaryError,
  ...boxProps
}) => {
  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <LoaderWrapper>
        {loadingComponent ?? <CircularProgress color="primary" />}
      </LoaderWrapper>
    );
  } else if (isError) {
    content = (
      <LoaderWrapper>
        {errorComponent ?? <div>Something went wrong.</div>}
      </LoaderWrapper>
    );
  } else if (isEmpty) {
    content = (
      <LoaderWrapper>
        {emptyComponent ?? <div>No data found.</div>}
      </LoaderWrapper>
    );
  } else {
    content = (
        <Box
          sx={{
            height: "100%",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
          {...boxProps}
        >
          {children}
        </Box>
    );
  }

  return (
    <ErrorBoundary
      context={errorContext}
      onError={onBoundaryError}
      fallback={() => (
        <div>
          This page failed to load. Please try refreshing the page.
        </div>
      )}
    >
      {content}
    </ErrorBoundary>
  );
};


export default PageWrapper;
