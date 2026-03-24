import { Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate('/');
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
        <Button variant="contained" size="large" onClick={handleGoToDashboard} sx={{ mt: 2 }}>
          Go to Dashboard
        </Button>
      </Stack>
    </Container>
  );
};

export default ErrorPage;
