import { useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import { KpiLabel, BodyStrong, BodyMuted } from 'components/Typography';
import type { Vehicle } from 'features/carrier/types';
import type { VehicleLoad } from 'utils/api/fleet/vehicleApi';
import { VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';

interface VehicleKPIProps {
  vehicle: Vehicle & {
    driverName: string | null;
  };
  vehicleLoads?: VehicleLoad[];
}

const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const VehicleKPI: React.FC<VehicleKPIProps> = ({ vehicle, vehicleLoads = [] }) => {
  const revenueMetrics = useMemo(() => {
    const deliveredLoads = vehicleLoads.filter((load) => load.status === 'DELIVERED');
    const totalRevenue = deliveredLoads.reduce((sum, load) => sum + parseFloat(load.rate), 0);
    return { totalRevenue, loadCount: vehicleLoads.length };
  }, [vehicleLoads]);

  const typeValue =
    `${vehicle.year ?? ''} ${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() || '—';

  return (
    <Grid container spacing={2}>
      <Grid item sm={6} md={4}>
        <KpiLabel>VEHICLE INFO</KpiLabel>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
          <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Type:</BodyMuted>
          <BodyStrong sx={{ lineHeight: 1.3 }}>{typeValue}</BodyStrong>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
          <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Equipment:</BodyMuted>
          <BodyStrong sx={{ lineHeight: 1.3 }}>{VEHICLE_TYPE_LABELS[vehicle.type] ?? '—'}</BodyStrong>
        </Box>
      </Grid>

      <Grid item sm={6} md={4}>
        <KpiLabel>ASSIGNMENT</KpiLabel>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
          <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Ownership:</BodyMuted>
          <BodyStrong sx={{ lineHeight: 1.3 }}>{OWNERSHIP_LABELS[vehicle.ownership] ?? '—'}</BodyStrong>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
          <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Driver:</BodyMuted>
          <BodyStrong sx={{ lineHeight: 1.3 }}>{vehicle.driverName ?? 'Unassigned'}</BodyStrong>
        </Box>
      </Grid>

      <Grid item sm={6} md={4}>
        <KpiLabel>FINANCIALS</KpiLabel>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
          <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Revenue:</BodyMuted>
          <BodyStrong sx={{ lineHeight: 1.3 }}>
            {revenueMetrics.totalRevenue > 0
              ? currencyCompact.format(revenueMetrics.totalRevenue)
              : '$0'}
          </BodyStrong>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
          <BodyMuted sx={{ minWidth: 80, flexShrink: 0 }}>Total Loads:</BodyMuted>
          <BodyStrong sx={{ lineHeight: 1.3 }}>
            {revenueMetrics.loadCount > 0 ? `${revenueMetrics.loadCount}` : '—'}
          </BodyStrong>
        </Box>
      </Grid>
    </Grid>
  );
};
