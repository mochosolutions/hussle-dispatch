import { Box, Card, Typography } from '@mui/material';

interface LoadHistoryTabProps {
  customerId: string;
}

export const LoadHistoryTab: React.FC<LoadHistoryTabProps> = ({ customerId: _customerId }) => (
  <Card>
    <Box
      sx={{
        px: 3,
        py: 2,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
      >
        Load History
      </Typography>
    </Box>
    <Box
      sx={{
        px: 3,
        py: 6,
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Load history will be available once loads are dispatched for this customer.
      </Typography>
    </Box>
  </Card>
);
