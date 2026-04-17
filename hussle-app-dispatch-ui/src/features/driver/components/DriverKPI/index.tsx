import { Box, Grid } from '@mui/material';
import { KpiLabel, BodyStrong, BodyMuted } from 'components/Typography';
import type { Driver } from 'features/carrier/types';

interface DriverWithCarrierInfo extends Driver {
  carrierName: string | null;
  carrierType: string | null;
}

interface DriverKPIProps {
  driver: DriverWithCarrierInfo;
}

const formatLocation = (city: string | null, state: string | null): string => {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return '—';
};

export const DriverKPI: React.FC<DriverKPIProps> = ({ driver: d }) => (
  <Grid container spacing={2}>
    <Grid item sm={6} md={3}>
      <KpiLabel>STATUS &amp; LOCATION</KpiLabel>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
        <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Status:</BodyMuted>
        <BodyStrong sx={{ lineHeight: 1.3 }}>{d.isAvailable ? 'Available' : 'Unavailable'}</BodyStrong>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
        <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Location:</BodyMuted>
        <BodyStrong sx={{ lineHeight: 1.3 }}>{formatLocation(d.currentCity, d.currentState)}</BodyStrong>
      </Box>
    </Grid>

    <Grid item sm={6} md={3}>
      <KpiLabel>ASSIGNMENT</KpiLabel>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
        <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Carrier:</BodyMuted>
        <BodyStrong sx={{ lineHeight: 1.3 }}>{d.carrierName ?? '—'}</BodyStrong>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
        <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Vehicle:</BodyMuted>
        <BodyStrong sx={{ lineHeight: 1.3 }}>—</BodyStrong>
      </Box>
    </Grid>

    <Grid item sm={6} md={3}>
      <KpiLabel>AVAILABILITY</KpiLabel>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
        <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Hours Avail:</BodyMuted>
        <BodyStrong sx={{ lineHeight: 1.3 }}>{d.availableHours ? `${d.availableHours}h` : '—'}</BodyStrong>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
        <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Days Out:</BodyMuted>
        <BodyStrong sx={{ lineHeight: 1.3 }}>{d.maxDaysOut !== null ? `${d.maxDaysOut}` : '—'}</BodyStrong>
      </Box>
    </Grid>

    <Grid item sm={6} md={3}>
      <KpiLabel>PERFORMANCE</KpiLabel>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
        <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Weekly Gross:</BodyMuted>
        <BodyStrong sx={{ lineHeight: 1.3 }}>—</BodyStrong>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
        <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Last Delivered:</BodyMuted>
        <BodyStrong sx={{ lineHeight: 1.3 }}>—</BodyStrong>
      </Box>
    </Grid>
  </Grid>
);
