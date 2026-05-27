import { Box, CircularProgress, Stack } from '@mui/material';
import { format, parseISO } from 'date-fns';
import SectionCard from 'components/SectionCard';
import { BodyMuted } from 'components/Typography';
import { StatusBadge } from 'components/Statusbadge';
import type { ContactStats } from 'utils/api/fleet/contactApi';

interface LoadsTabProps {
  contactStats: ContactStats | null;
  statsLoading: boolean;
}

const LoadsTab = ({ contactStats, statsLoading }: LoadsTabProps) => (
  <SectionCard title="Load History">
    {statsLoading && (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    )}
    {!statsLoading && (!contactStats || contactStats.recentLoads.length === 0) && (
      <BodyMuted sx={{ p: 2 }}>No load history available</BodyMuted>
    )}
    {!statsLoading && contactStats && contactStats.recentLoads.length > 0 && (
      <Stack spacing={0} divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
        {contactStats.recentLoads.map((load) => (
          <Box
            key={load.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
            }}
          >
            <Box>
              <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{load.loadNumber}</Box>
              <BodyMuted>
                {load.pickupDate ? format(parseISO(load.pickupDate), 'MMM d, yyyy') : '\u2014'}
              </BodyMuted>
            </Box>
            <StatusBadge status={`LOAD_${load.status}`} size="small" />
          </Box>
        ))}
      </Stack>
    )}
  </SectionCard>
);

export default LoadsTab;
