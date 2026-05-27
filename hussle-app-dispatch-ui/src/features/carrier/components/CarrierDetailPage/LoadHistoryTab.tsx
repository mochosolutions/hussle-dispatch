import { Box } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { Meta } from 'components/Typography';

interface LoadHistoryTabProps {
  carrierId: string;
}

export const LoadHistoryTab: React.FC<LoadHistoryTabProps> = ({ carrierId: _carrierId }) => (
  <SectionCard title="Load History">
    <Box
      sx={{
        px: 3,
        py: 6,
        textAlign: 'center',
      }}
    >
      <Meta>Load history will be available once loads are dispatched for this carrier.</Meta>
    </Box>
  </SectionCard>
);
