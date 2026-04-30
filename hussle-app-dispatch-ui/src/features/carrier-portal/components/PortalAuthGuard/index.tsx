import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Button } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { useSelector, useDispatch } from 'store';
import { Body, BodyMuted, SectionTitle } from 'components/Typography';
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
          <SectionTitle sx={{ mb: 1 }}>Invalid Link</SectionTitle>
          <BodyMuted>No token was provided. Please check the link you received.</BodyMuted>
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
        <Body sx={{ color: 'common.white' }}>Loading your onboarding...</Body>
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
          <SectionTitle sx={{ mb: 1 }}>{title}</SectionTitle>
          <BodyMuted sx={{ mb: 3 }}>{message}</BodyMuted>
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
