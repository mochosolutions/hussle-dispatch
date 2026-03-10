import { useMemo } from 'react';
import { Box, Chip, Grid, Stack, Typography } from '@mui/material';
import { EmptyState, MainCard } from '@mocho/ui/components';
import type { VehicleLoad } from 'utils/api/fleet/vehicleApi';

const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const currencyFull = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

interface VehicleLoadHistoryTabProps {
  vehicleLoads: VehicleLoad[];
}

export const VehicleLoadHistoryTab: React.FC<VehicleLoadHistoryTabProps> = ({ vehicleLoads }) => {
  const loadMetrics = useMemo(() => {
    const totalLoads = vehicleLoads.length;
    const deliveredLoads = vehicleLoads.filter((load) => load.status === 'DELIVERED');
    const totalRevenue = deliveredLoads.reduce(
      (sum, load) => sum + parseFloat(load.rate),
      0,
    );
    const totalMiles = deliveredLoads.reduce((sum, load) => sum + load.miles, 0);
    const avgRpm = totalMiles > 0 ? totalRevenue / totalMiles : 0;

    return { totalLoads, totalRevenue, totalMiles, avgRpm };
  }, [vehicleLoads]);

  return (
    <Stack spacing={2}>
      {/* Performance Metrics */}
      <Grid container spacing={2}>
        {[
          {
            label: 'Total Loads',
            value: String(loadMetrics.totalLoads),
          },
          {
            label: 'Total Revenue',
            value: currencyCompact.format(loadMetrics.totalRevenue),
          },
          {
            label: 'Total Miles',
            value: loadMetrics.totalMiles.toLocaleString(),
          },
          {
            label: 'Avg RPM',
            value: `$${loadMetrics.avgRpm.toFixed(2)}`,
          },
        ].map((metric) => (
          <Grid key={metric.label} item xs={12} sm={6} md={3}>
            <MainCard>
              <Typography variant="caption" color="text.secondary">
                {metric.label}
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5 }}>
                {metric.value}
              </Typography>
            </MainCard>
          </Grid>
        ))}
      </Grid>

      {/* Load History DataGrid */}
      <MainCard content={false}>
        <Box sx={{ minHeight: 300 }}>
          {vehicleLoads.length > 0 ? (
            <Box sx={{ height: 400 }}>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h5">Load History</Typography>
              </Box>
              <Box sx={{ height: 350 }}>
                {/* Render loads as a simple table since NewDataGrid may not be available in this context */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr 1fr 100px 100px 80px 80px 120px',
                    gap: 0,
                    px: 2,
                  }}
                >
                  {/* Header */}
                  {[
                    'Reference',
                    'Origin',
                    'Destination',
                    'Status',
                    'Rate',
                    'Miles',
                    'RPM',
                    'Pickup',
                  ].map((header) => (
                    <Typography
                      key={header}
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 600,
                        py: 1,
                        borderBottom: 2,
                        borderColor: 'divider',
                      }}
                    >
                      {header}
                    </Typography>
                  ))}

                  {/* Rows */}
                  {vehicleLoads.map((load) => {
                    const rate = parseFloat(load.rate);
                    const rpm =
                      load.miles > 0
                        ? `$${(rate / load.miles).toFixed(2)}`
                        : '\u2014';
                    const statusColorMap: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
                      DELIVERED: 'success',
                      IN_TRANSIT: 'warning',
                      BOOKED: 'info',
                    };

                    return [
                      <Typography
                        key={`${load.id}-ref`}
                        variant="body2"
                        sx={{
                          py: 1.25,
                          borderBottom: 1,
                          borderColor: 'divider',
                          fontWeight: 600,
                          color: 'primary.main',
                        }}
                      >
                        {load.referenceNumber}
                      </Typography>,
                      <Typography
                        key={`${load.id}-orig`}
                        variant="body2"
                        sx={{
                          py: 1.25,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        {load.origin}
                      </Typography>,
                      <Typography
                        key={`${load.id}-dest`}
                        variant="body2"
                        sx={{
                          py: 1.25,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        {load.destination}
                      </Typography>,
                      <Box
                        key={`${load.id}-status`}
                        sx={{
                          py: 1.25,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Chip
                          label={load.status.replace('_', ' ')}
                          size="small"
                          color={
                            statusColorMap[load.status] ?? 'default'
                          }
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.675rem' }}
                        />
                      </Box>,
                      <Typography
                        key={`${load.id}-rate`}
                        variant="body2"
                        sx={{
                          py: 1.25,
                          borderBottom: 1,
                          borderColor: 'divider',
                          fontWeight: 600,
                        }}
                      >
                        {currencyFull.format(rate)}
                      </Typography>,
                      <Typography
                        key={`${load.id}-miles`}
                        variant="body2"
                        sx={{
                          py: 1.25,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        {load.miles.toLocaleString()}
                      </Typography>,
                      <Typography
                        key={`${load.id}-rpm`}
                        variant="body2"
                        sx={{
                          py: 1.25,
                          borderBottom: 1,
                          borderColor: 'divider',
                          color:
                            parseFloat(rpm.replace('$', '')) >= 2
                              ? 'success.main'
                              : 'warning.main',
                          fontWeight: 600,
                        }}
                      >
                        {rpm}
                      </Typography>,
                      <Typography
                        key={`${load.id}-pickup`}
                        variant="body2"
                        sx={{
                          py: 1.25,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        {new Date(load.pickupDate).toLocaleDateString(
                          'en-US',
                        )}
                      </Typography>,
                    ];
                  })}
                </Box>
              </Box>
            </Box>
          ) : (
            <EmptyState
              title="No load history"
              message="This vehicle has no load history yet."
            />
          )}
        </Box>
      </MainCard>
    </Stack>
  );
};
