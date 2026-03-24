import { Box, Stack, Typography } from '@mui/material';
import type { Stop } from '../../types';

interface LoadMapPlaceholderProps {
  stops: Stop[];
}

export const LoadMapPlaceholder: React.FC<LoadMapPlaceholderProps> = ({ stops }) => {
  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);
  const origin = sorted.find((s) => s.type === 'PICKUP');
  const deliveries = sorted.filter((s) => s.type === 'DELIVERY');
  const destination = deliveries[deliveries.length - 1];

  const originLabel = origin
    ? [origin.city, origin.state].filter(Boolean).join(', ')
    : 'Origin';
  const destLabel = destination
    ? [destination.city, destination.state].filter(Boolean).join(', ')
    : 'Destination';

  return (
    <Box
      sx={{
        bgcolor: 'grey.800',
        borderRadius: 1,
        height: 160,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Route visualization */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}
      >
        {/* Origin marker */}
        <Stack alignItems="center" spacing={0.5}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          >
            P
          </Box>
          <Typography sx={{ color: 'grey.400', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
            {originLabel}
          </Typography>
        </Stack>

        {/* Dashed route line */}
        <Box
          sx={{
            flex: 1,
            borderBottom: '2px dashed',
            borderColor: 'grey.600',
          }}
        />

        {/* Destination marker */}
        <Stack alignItems="center" spacing={0.5}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          >
            D
          </Box>
          <Typography sx={{ color: 'grey.400', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
            {destLabel}
          </Typography>
        </Stack>
      </Stack>

      {/* Overlay */}
      <Typography
        sx={{
          color: 'grey.500',
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Map — Coming Soon
      </Typography>
    </Box>
  );
};
