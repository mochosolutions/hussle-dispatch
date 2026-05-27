import { Stack } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { BodyMuted } from 'components/Typography';

export const LoadHistoryTab: React.FC = () => (
  <SectionCard title="Load History">
    <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
      <BodyMuted>No loads have been assigned to this facility yet.</BodyMuted>
    </Stack>
  </SectionCard>
);

export default LoadHistoryTab;
