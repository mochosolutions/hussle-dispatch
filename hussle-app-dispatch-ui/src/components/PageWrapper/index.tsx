import type { ReactNode } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import ErrorBoundary from 'components/ErrorBoundary';

interface PageWrapperProps {
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  errorContext?: string;
}

/** Wraps pages with loading state, error handling, and ErrorBoundary. */
export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  isLoading = false,
  error = null,
  errorContext: _errorContext,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box role="alert" sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};
