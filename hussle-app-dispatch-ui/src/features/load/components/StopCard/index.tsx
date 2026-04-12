import { Box, Chip, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { formatAppointmentDateTime, formatTimestamp, getStopStatus } from '../../constants';
import type { LoadStatus, Stop } from '../../types';

interface StopCardProps {
  stop: Stop;
  allStops: Stop[];
  loadStatus: LoadStatus;
}

export const StopCard: React.FC<StopCardProps> = ({ stop, allStops, loadStatus }) => {
  const status = getStopStatus(stop, allStops, loadStatus);
  const isComplete = status.label === 'Complete';
  const isActive = status.color === 'info';

  const getDotColor = () => {
    if (isComplete) return 'success.main';
    if (isActive) return 'info.main';
    return 'grey.400';
  };
  const dotColor = getDotColor();

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
      }}
    >
      {/* Type indicator */}
      <Chip
        label={stop.type === 'PICKUP' ? 'P' : 'D'}
        size="small"
        sx={{
          fontWeight: 700,
          bgcolor: stop.type === 'PICKUP' ? 'primary.main' : 'success.main',
          color: '#fff',
          width: 24,
          height: 24,
          '.MuiChip-label': {
            textOverflow: 'unset',
          },
        }}
      />

      {/* Content */}
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: dotColor,
                flexShrink: 0,
              }}
            />
            {stop.facilityName && (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {stop.facilityName}
              </Typography>
            )}
          </Stack>
          {status.label !== 'Pending' && (
            <Chip
              icon={isComplete ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : undefined}
              label={status.label}
              size="small"
              color={status.color}
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          )}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {[stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ')}
        </Typography>

        {(stop.appointmentDate ?? stop.appointmentTime) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Appt: {formatAppointmentDateTime(stop.appointmentDate, stop.appointmentTime)}
          </Typography>
        )}

        {(stop.arrivalTime ?? stop.departureTime) && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
            {stop.arrivalTime ? `Arrived: ${formatTimestamp(stop.arrivalTime)}` : ''}
            {stop.arrivalTime && stop.departureTime ? '  ' : ''}
            {stop.departureTime ? `Departed: ${formatTimestamp(stop.departureTime)}` : ''}
          </Typography>
        )}

        {(stop.appointmentNumber ?? stop.notes) && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
            {stop.appointmentNumber ? `Ref: ${stop.appointmentNumber}` : ''}
            {stop.appointmentNumber && stop.notes ? ' — ' : ''}
            {stop.notes ?? ''}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
