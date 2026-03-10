import { useCallback } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import MainCard from 'components/MainCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BackhaulInfo {
  route: string;
  rate: number | null;
  brokerName: string | null;
  pickupDate: string | null;
  isActive: boolean;
}

interface PlannedBackhaulPanelProps {
  backhaul: BackhaulInfo;
  loadDestinationCity?: string | null;
  loadDestinationState?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTION_LABEL_SX = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
  mb: 1,
} as const;

const LABEL_SX = { color: 'text.secondary', fontSize: '0.75rem' } as const;
const VALUE_SX = { fontWeight: 600, fontSize: '0.875rem' } as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PlannedBackhaulPanel: React.FC<PlannedBackhaulPanelProps> = ({
  backhaul,
  loadDestinationCity,
  loadDestinationState,
}) => {
  const navigate = useNavigate();

  const handleConvertToLoad = useCallback(() => {
    // Parse route into origin/destination (e.g. "Dallas, TX -> Chicago, IL")
    const parts = backhaul.route.split('->').map((s) => s.trim());
    const originParts = parts[0]?.split(',').map((s) => s.trim()) ?? [];
    const destParts = parts[1]?.split(',').map((s) => s.trim()) ?? [];

    navigate('/loads/new', {
      state: {
        intelPrefill: {
          originCity: originParts[0] ?? '',
          originState: originParts[1] ?? '',
          destinationCity: destParts[0] ?? '',
          destinationState: destParts[1] ?? '',
          rate: backhaul.rate,
          pickupDate: backhaul.pickupDate,
          brokerName: backhaul.brokerName,
        },
      },
    });
  }, [navigate, backhaul]);

  const handleFindNewBackhaul = useCallback(() => {
    const destParam = [loadDestinationCity, loadDestinationState].filter(Boolean).join(', ');
    navigate(`/load-intelligence${destParam ? `?destination=${encodeURIComponent(destParam)}` : ''}`);
  }, [navigate, loadDestinationCity, loadDestinationState]);

  return (
    <MainCard sx={{ mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
          Planned Backhaul
        </Typography>
        <Chip
          label={backhaul.isActive ? 'Active' : 'Expired'}
          size="small"
          sx={{
            fontWeight: 600,
            bgcolor: backhaul.isActive ? '#e8f5e9' : '#fff3e0',
            color: backhaul.isActive ? '#2e7d32' : '#ef6c00',
          }}
        />
      </Stack>

      {/* Route */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {backhaul.route}
        </Typography>
      </Stack>

      {/* Details */}
      <Stack spacing={0.5} sx={{ mb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={LABEL_SX}>Rate</Typography>
          <Typography sx={VALUE_SX}>
            {backhaul.rate !== null ? `$${backhaul.rate.toLocaleString()}` : '\u2014'}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={LABEL_SX}>Broker</Typography>
          <Typography sx={VALUE_SX}>{backhaul.brokerName ?? '\u2014'}</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={LABEL_SX}>Pickup Date</Typography>
          <Typography sx={VALUE_SX}>{backhaul.pickupDate ?? '\u2014'}</Typography>
        </Stack>
      </Stack>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {backhaul.isActive && (
          <Button variant="contained" size="small" onClick={handleConvertToLoad}>
            Convert to Load
          </Button>
        )}
        {!backhaul.isActive && (
          <Button variant="outlined" size="small" onClick={handleFindNewBackhaul}>
            Find New Backhaul
          </Button>
        )}
      </Box>
    </MainCard>
  );
};
