import { Box, Card, Typography } from '@mui/material';

interface ContactsTabProps {
  customerId: string;
}

export const ContactsTab: React.FC<ContactsTabProps> = ({ customerId: _customerId }) => (
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
        Contacts
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
        Contacts associated with this customer will appear here.
      </Typography>
    </Box>
  </Card>
);
