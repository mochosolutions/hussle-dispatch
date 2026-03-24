import { Box, Chip, CircularProgress, Typography } from '@mui/material';
import { EmptyState, MainCard } from '@mocho/ui/components';
import { VEHICLE_LOAD_STATUS_COLORS } from '../../../constants';
import type { VehicleLoad } from 'utils/api/fleet/vehicleApi';

const currencyFull = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

interface VehicleLoadHistoryTabProps {
  vehicleLoads: VehicleLoad[];
  isLoading?: boolean;
}

export const VehicleLoadHistoryTab: React.FC<VehicleLoadHistoryTabProps> = ({
  vehicleLoads,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
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
                            VEHICLE_LOAD_STATUS_COLORS[load.status] ?? 'default'
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
  );
};
