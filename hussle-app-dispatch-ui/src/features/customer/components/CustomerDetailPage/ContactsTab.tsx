import { Box } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { Meta } from 'components/Typography';

interface ContactsTabProps {
  customerId: string;
}

export const ContactsTab: React.FC<ContactsTabProps> = ({ customerId: _customerId }) => (
  <SectionCard title="Contacts">
    <Box
      sx={{
        px: 3,
        py: 6,
        textAlign: 'center',
      }}
    >
      <Meta>Contacts associated with this customer will appear here.</Meta>
    </Box>
  </SectionCard>
);
