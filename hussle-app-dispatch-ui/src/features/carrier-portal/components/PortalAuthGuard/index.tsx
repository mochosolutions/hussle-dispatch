import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { useSelector, useDispatch } from 'store';
import { carrierPortalActions } from '../../store/slices/carrierPortalSlice';
import { selectSession, selectIsLoading, selectError } from '../../store/selectors/portalSelectors';

interface PortalAuthGuardProps {
  children: ReactNode;
}

const PortalAuthGuard: React.FC<PortalAuthGuardProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { token } = useParams<{ token: string }>();
  const session = useSelector(selectSession);
  const loading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  useEffect(() => {
    if (token) {
      dispatch(carrierPortalActions.setToken(token));
      dispatch(carrierPortalActions.fetchSession());
    }
  }, [dispatch, token]);

  if (!token) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'primary.dark',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: 480,
            width: '100%',
            bgcolor: 'background.paper',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            p: 5,
            textAlign: 'center',
          }}
        >
          <ErrorOutline sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Invalid Link
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No token was provided. Please check the link you received.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'primary.dark',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <CircularProgress sx={{ color: 'common.white' }} />
        <Typography variant="body1" sx={{ color: 'common.white' }}>
          Loading your onboarding...
        </Typography>
      </Box>
    );
  }

  if (error) {
    const isExpired = error.toLowerCase().includes('expired');
    const title = isExpired ? 'Link Expired' : 'Unable to Load';
    const message = isExpired
      ? 'This onboarding link has expired. Please contact your dispatcher for a new link.'
      : error;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'primary.dark',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: 480,
            width: '100%',
            bgcolor: 'background.paper',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            p: 5,
            textAlign: 'center',
          }}
        >
          <ErrorOutline sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {message}
          </Typography>
          {!isExpired && (
            <Button
              variant="contained"
              onClick={() => {
                dispatch(carrierPortalActions.fetchSession());
              }}
              sx={{ borderRadius: '24px', px: 4 }}
            >
              Try Again
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
};

export default PortalAuthGuard;
