import { Grid, Stack, Typography } from '@mui/material';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { FormattedLoadSummary, SummaryStopInfo } from '../../types';

interface LoadSummaryBarProps {
  summary: FormattedLoadSummary;
}

const ICON_SX = { fontSize: 14, color: 'text.secondary' } as const;
const PRIMARY_SX = { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 } as const;
const SECONDARY_SX = { fontSize: '0.75rem', lineHeight: 1.4 } as const;
const LABEL_SX = {
  textTransform: 'uppercase',
  fontWeight: 700,
  fontSize: '0.65rem',
  letterSpacing: 0.5,
} as const;

const StopColumn: React.FC<{
  icon: React.ReactNode;
  label: string;
  stop: SummaryStopInfo;
}> = ({ icon, label, stop }) => (
  <Grid item xs={12} sm={6} md={3}>
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
      {icon}
      <Typography variant="body1" color="text.secondary" sx={LABEL_SX}>
        {label}
      </Typography>
    </Stack>
    <Typography sx={PRIMARY_SX} noWrap>
      {stop.cityState || stop.facilityName}
    </Typography>
    <Stack direction="row" spacing={0.5} alignItems="center">
      {stop.isCompleted && (
        <CheckCircleIcon sx={{ fontSize: 12, color: 'success.main' }} />
      )}
      <Typography variant="body1" color="text.secondary" sx={SECONDARY_SX} noWrap>
        {stop.dateTime}
      </Typography>
    </Stack>
  </Grid>
);

export const LoadSummaryBar: React.FC<LoadSummaryBarProps> = ({ summary }) => (
  <Grid container spacing={2}>
    {/* Pickup */}
    <StopColumn
      icon={<WarehouseOutlinedIcon sx={ICON_SX} />}
      label="Pickup"
      stop={summary.pickup}
    />

    {/* Delivery */}
    <StopColumn
      icon={<PlaceOutlinedIcon sx={ICON_SX} />}
      label="Delivery"
      stop={summary.delivery}
    />

    {/* Load */}
    <Grid item xs={12} sm={6} md={3}>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
        <InventoryOutlinedIcon sx={ICON_SX} />
        <Typography variant="body1" color="text.secondary" sx={LABEL_SX}>
          Load
        </Typography>
      </Stack>
      <Typography sx={PRIMARY_SX} noWrap>
        {[summary.load.miles, summary.driver.equipment].filter(Boolean).join(' \u00B7 ') ||
          summary.load.routeLabel}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={SECONDARY_SX} noWrap>
        {[summary.load.rate, summary.load.ratePerMile].filter(Boolean).join(' \u00B7 ')}
      </Typography>
    </Grid>

    {/* Driver */}
    <Grid item xs={12} sm={6} md={3}>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
        <PersonOutlinedIcon sx={ICON_SX} />
        <Typography variant="body1" color="text.secondary" sx={LABEL_SX}>
          Driver
        </Typography>
      </Stack>
      <Typography sx={PRIMARY_SX} noWrap>
        {summary.driver.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={SECONDARY_SX} noWrap>
        {summary.driver.vehicle}
      </Typography>
    </Grid>
  </Grid>
);
