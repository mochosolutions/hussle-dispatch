import { useNavigate } from 'react-router';
import { Box, Button, Container, Typography } from '@mui/material';
import { ArrowLeftOutlined } from '@ant-design/icons';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Button
          startIcon={<ArrowLeftOutlined />}
          onClick={() => navigate('/login')}
          sx={{ mb: 3 }}
        >
          Back to Login
        </Button>
        <Typography variant="h3" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Privacy policy coming soon.
        </Typography>
      </Box>
    </Container>
  );
};

export default Privacy;
