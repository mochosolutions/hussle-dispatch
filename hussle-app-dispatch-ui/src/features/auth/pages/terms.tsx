import { useNavigate } from 'react-router';
import { Box, Button, Container } from '@mui/material';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { BodyMuted, PageTitle } from 'components/Typography';

const Terms = () => {
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
        <PageTitle sx={{ mb: 2 }}>Terms of Service</PageTitle>
        <BodyMuted>Terms of service coming soon.</BodyMuted>
      </Box>
    </Container>
  );
};

export default Terms;
