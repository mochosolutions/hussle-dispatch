import { Box, Chip, Stack } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Body, BodyMuted, Meta } from 'components/Typography';
import {
  formatTimestamp,
  getStopStatus,
  SCHEDULING_TYPE_LABELS,
  STOP_TYPE_CONFIG,
} from '../../../constants';
import type { LoadStatus, Stop } from '../../../types';

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

  const timeDisplay = formatTimestamp(stop.appointmentStart);

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
        label={STOP_TYPE_CONFIG[stop.type]?.abbr ?? stop.type[0]}
        size="small"
        sx={{
          fontWeight: 700,
          bgcolor: STOP_TYPE_CONFIG[stop.type]?.color ?? 'grey.500',
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
            {stop.facilityName && <Body sx={{ fontWeight: 600 }}>{stop.facilityName}</Body>}
            {stop.schedulingType && (
              <Chip
                label={SCHEDULING_TYPE_LABELS[stop.schedulingType] ?? stop.schedulingType}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem', mt: 0.25 }}
              />
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

        <BodyMuted sx={{ mt: 0.25 }}>
          {[stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ')}
        </BodyMuted>

        {/* Schedule — prominent display */}
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
          <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Body sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
            {timeDisplay}
          </Body>
        </Stack>

        {/* Arrival / departure times */}
        {(stop.arrivalTime ?? stop.departureTime) && (
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.25 }}>
            {stop.arrivalTime && (
              <Meta>Arrived: {formatTimestamp(stop.arrivalTime)}</Meta>
            )}
            {stop.departureTime && (
              <Meta>Departed: {formatTimestamp(stop.departureTime)}</Meta>
            )}
          </Stack>
        )}

        {(stop.appointmentNumber ?? stop.notes) && (
          <Meta sx={{ display: 'block', mt: 0.25 }}>
            {stop.appointmentNumber ? `Ref: ${stop.appointmentNumber}` : ''}
            {stop.appointmentNumber && stop.notes ? ' — ' : ''}
            {stop.notes ?? ''}
          </Meta>
        )}
        {(stop.contactName ?? stop.contactPhone) && (
          <Meta sx={{ display: 'block', mt: 0.25 }}>
            Contact: {[stop.contactName, stop.contactPhone].filter(Boolean).join(' — ')}
          </Meta>
        )}
      </Box>
    </Box>
  );
};
