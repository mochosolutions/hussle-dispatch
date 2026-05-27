import { Box } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { Meta } from 'components/Typography';

interface LoadHistoryTabProps {
  customerId: string;
}

export const LoadHistoryTab: React.FC<LoadHistoryTabProps> = ({ customerId: _customerId }) => (
  <SectionCard title="Load History">
    <Box
      sx={{
        px: 3,
        py: 6,
        textAlign: 'center',
      }}
    >
      <Meta>Load history will be available once loads are dispatched for this customer.</Meta>
    </Box>
  </SectionCard>
);
