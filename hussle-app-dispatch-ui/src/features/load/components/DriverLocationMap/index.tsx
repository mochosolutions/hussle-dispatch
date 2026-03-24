import { useMemo } from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import { MapView } from '../MapView';
import type { CheckCall } from '../../types';

interface DriverLocationMapProps {
  stops: {
    type: string;
    sequence: number;
    lat?: number | null;
    lng?: number | null;
    city?: string;
    state?: string;
    facilityName?: string;
  }[];
  checkCalls: CheckCall[];
  height?: number | string;
}

const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const DriverLocationMap: React.FC<DriverLocationMapProps> = ({
  stops,
  checkCalls,
  height = 300,
}) => {
  const driverLocation = useMemo(() => {
    const withCoords = checkCalls.find(
      (cc) => cc.latitude !== null && cc.longitude !== null,
    );
    if (!withCoords || withCoords.latitude === null || withCoords.longitude === null) {
      return null;
    }
    return {
      lat: parseFloat(withCoords.latitude),
      lng: parseFloat(withCoords.longitude),
      time: withCoords.createdAt,
    };
  }, [checkCalls]);

  const allMarkers = useMemo(() => {
    const markers = [...stops];
    if (driverLocation) {
      markers.push({
        type: 'DRIVER',
        sequence: 999,
        lat: driverLocation.lat,
        lng: driverLocation.lng,
      });
    }
    return markers;
  }, [stops, driverLocation]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Driver Location
        </Typography>
        {driverLocation && (
          <Chip
            icon={<PersonPinCircleIcon />}
            label={`Last update: ${formatRelativeTime(driverLocation.time)}`}
            size="small"
            variant="outlined"
            color="primary"
          />
        )}
      </Stack>
      <MapView stops={allMarkers} height={height} />
      {!driverLocation && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          No driver location data available yet
        </Typography>
      )}
    </Box>
  );
};
