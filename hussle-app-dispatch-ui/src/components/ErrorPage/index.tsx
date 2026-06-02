import { Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useSelector } from 'store';
import { isDriverSelector } from '../../features/auth/store/selectors';

const ErrorPage = () => {
  const navigate = useNavigate();
  const isDriver = useSelector(isDriverSelector);

  // Drivers have no dashboard — send them back to their own loads list so the
  // 404 CTA can't loop them into the gated internal app.
  const ctaLabel = isDriver ? 'Go to my loads' : 'Go to Dashboard';
  const ctaTarget = isDriver ? '/driver-portal' : '/';

  const handleGoHome = () => {
    navigate(ctaTarget);
  };

  return (
    <Container maxWidth="sm">
      <Stack
        sx={{
          minHeight: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h1" color="text.secondary" sx={{ fontWeight: 700 }}>
          404
        </Typography>
        <Typography variant="h4" color="text.primary">
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          The page you are looking for does not exist or has been moved.
        </Typography>
        <Button variant="contained" size="large" onClick={handleGoHome} sx={{ mt: 2 }}>
          {ctaLabel}
        </Button>
      </Stack>
    </Container>
  );
};

export default ErrorPage;
