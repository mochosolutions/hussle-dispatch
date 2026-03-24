import { useMemo } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { format, parseISO } from 'date-fns';
import type { LoadDetail, Stop, StopType } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriverTimelineProps {
  loads: LoadDetail[];
}

interface TimelineStop {
  loadNumber: string;
  stopType: StopType;
  city: string | null;
  state: string | null;
  appointmentDate: string;
  appointmentTime: string | null;
}

interface DateGroup {
  dateKey: string;
  dateLabel: string;
  stops: TimelineStop[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STOP_TYPE_LABELS: Record<string, string> = {
  PICKUP: 'PU',
  DELIVERY: 'DEL',
  STOP_OFF: 'STOP',
  DROP_HOOK: 'DROP',
  LIVE_UNLOAD: 'LIVE',
};

const STOP_TYPE_COLORS: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  PICKUP: 'info',
  DELIVERY: 'success',
  STOP_OFF: 'warning',
  DROP_HOOK: 'default',
  LIVE_UNLOAD: 'default',
};

const formatLocation = (city: string | null, state: string | null): string =>
  [city, state].filter(Boolean).join(', ') || '\u2014';

const formatTime = (time: string | null): string => {
  if (!time) {
    return '';
  }

  try {
    const today = '2000-01-01';
    const parsed = parseISO(`${today}T${time}`);
    return format(parsed, 'h:mm a');
  } catch {
    return time;
  }
};

const formatDateHeader = (dateStr: string): string => {
  try {
    const parsed = parseISO(dateStr);
    return format(parsed, 'EEE MMM d');
  } catch {
    return dateStr;
  }
};

const flattenStops = (loads: LoadDetail[]): TimelineStop[] =>
  loads.flatMap((load) =>
    (load.stops ?? [])
      .filter((stop: Stop) => stop.appointmentDate !== null)
      .map((stop: Stop) => ({
        loadNumber: load.loadNumber,
        stopType: stop.type,
        city: stop.city,
        state: stop.state,
        appointmentDate: stop.appointmentDate as string,
        appointmentTime: stop.appointmentTime,
      })),
  );

const sortStopsChronologically = (stops: TimelineStop[]): TimelineStop[] =>
  [...stops].sort((a, b) => {
    const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    const timeA = a.appointmentTime ?? '';
    const timeB = b.appointmentTime ?? '';
    return timeA.localeCompare(timeB);
  });

const groupStopsByDate = (stops: TimelineStop[]): DateGroup[] => {
  const groups: Record<string, TimelineStop[]> = {};

  stops.forEach((stop) => {
    const existing = groups[stop.appointmentDate];
    if (existing) {
      existing.push(stop);
    } else {
      groups[stop.appointmentDate] = [stop];
    }
  });

  return Object.entries(groups).map(([dateKey, dateStops]) => ({
    dateKey,
    dateLabel: formatDateHeader(dateKey),
    stops: dateStops,
  }));
};

const findLastDelivery = (stops: TimelineStop[]): TimelineStop | null => {
  const deliveries = stops.filter((stop) => stop.stopType === 'DELIVERY');
  return deliveries[deliveries.length - 1] ?? null;
};

// ---------------------------------------------------------------------------
// DriverTimeline
// ---------------------------------------------------------------------------

export const DriverTimeline: React.FC<DriverTimelineProps> = ({ loads }) => {
  const { dateGroups, lastDelivery } = useMemo(() => {
    const flattened = flattenStops(loads);
    const sorted = sortStopsChronologically(flattened);
    const grouped = groupStopsByDate(sorted);
    const last = findLastDelivery(sorted);
    return { dateGroups: grouped, lastDelivery: last };
  }, [loads]);

  if (dateGroups.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        No scheduled stops.
      </Typography>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      {dateGroups.map((group) => (
        <Box key={group.dateKey} sx={{ mb: 1.5 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}
          >
            {group.dateLabel}
          </Typography>
          <Stack spacing={0.5} sx={{ pl: 2 }}>
            {group.stops.map((stop, idx) => (
              <Box
                key={`${stop.loadNumber}-${stop.stopType}-${idx}`}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: 'primary.main', minWidth: 70 }}
                >
                  {stop.loadNumber}
                </Typography>
                <Chip
                  label={STOP_TYPE_LABELS[stop.stopType] ?? stop.stopType}
                  size="small"
                  color={STOP_TYPE_COLORS[stop.stopType] ?? 'default'}
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.625rem', height: 20, minWidth: 44 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {formatLocation(stop.city, stop.state)}
                </Typography>
                {stop.appointmentTime && (
                  <Typography variant="body2" color="text.disabled">
                    {formatTime(stop.appointmentTime)}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      ))}

      {lastDelivery && (
        <Typography variant="body2" sx={{ mt: 1, pl: 2, color: 'success.main', fontWeight: 600 }}>
          &rarr; Available in {formatLocation(lastDelivery.city, lastDelivery.state)}
        </Typography>
      )}
    </Box>
  );
};
