import { Box, Button, Skeleton, Stack } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import { BodyMuted, SectionTitle } from 'components/Typography';

interface ErrorLayoutProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onSignIn?: () => void;
}

// Full-screen error state shown when the load can't be displayed (no session,
// invalid link, or a fetch error). `onSignIn` routes to the universal login;
// `onRetry` re-fetches.
export const ErrorLayout: React.FC<ErrorLayoutProps> = ({ title, message, onRetry, onSignIn }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
    <Box sx={{ maxWidth: { xs: 480, md: 720 }, mx: 'auto', px: 3, py: 8, textAlign: 'center' }}>
      <LocalShippingIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <SectionTitle sx={{ fontSize: '1.5rem', mb: 1 }}>{title}</SectionTitle>
      <BodyMuted sx={{ mb: 3 }}>{message}</BodyMuted>
      <Stack direction="row" spacing={1.5} justifyContent="center">
        {onSignIn && (
          <Button variant="contained" onClick={onSignIn} sx={{ py: 1.5, px: 4 }}>
            Sign In
          </Button>
        )}
        {onRetry && (
          <Button
            variant={onSignIn ? 'outlined' : 'contained'}
            onClick={onRetry}
            sx={{ py: 1.5, px: 4 }}
          >
            Try Again
          </Button>
        )}
      </Stack>
    </Box>
  </Box>
);

// Full-screen skeleton shown while the load summary resolves.
export const LoadingSkeleton: React.FC = () => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
    <Box sx={{ maxWidth: { xs: 480, md: 720 }, mx: 'auto', px: 2, py: 3 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width={140} />
        <Skeleton variant="rounded" width={80} height={24} />
      </Stack>
      <Skeleton variant="rounded" height={56} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={160} />
    </Box>
  </Box>
);
