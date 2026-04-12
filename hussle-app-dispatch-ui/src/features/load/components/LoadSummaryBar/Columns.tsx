import { Box, Grid, Stack, Typography, Link } from '@mui/material';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { FormattedLoadSummary, SummaryStopInfo } from '../../types';
// import { Box } from 'lucide-react';
// import { formatEquipmentType } from '../../constants';

const ICON_SX = { fontSize: 14, color: 'text.secondary' } as const;

const PRIMARY_SX = { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 } as const;

const SECONDARY_SX = {
  fontSize: '0.75rem',
  lineHeight: 1.4,
  textTransform: 'uppercase',
} as const;

const LABEL_SX = {
  textTransform: 'uppercase',
  fontWeight: 700,
  fontSize: '0.65rem',
  letterSpacing: 0.5,
} as const;

export const StopColumn: React.FC<{
  icon: React.ReactNode;
  label: string;
  stop: SummaryStopInfo;
}> = ({ icon, label, stop }) => (
  <>
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
      {icon}
      <Typography variant="body1" color="text.secondary" sx={LABEL_SX}>
        {label}
      </Typography>
    </Stack>

    <Typography sx={PRIMARY_SX} noWrap>
      {stop.facilityName || stop.cityState}
    </Typography>

    <Typography sx={PRIMARY_SX} noWrap>
      {stop.address}
    </Typography>
    <Typography sx={PRIMARY_SX} noWrap>
      {stop.cityState || stop.facilityName}
    </Typography>
    <Stack direction="row" spacing={0.5} alignItems="center">
      {stop.isCompleted && <CheckCircleIcon sx={{ fontSize: 12, color: 'success.main' }} />}
      <Typography variant="body1" color="text.secondary" sx={SECONDARY_SX} noWrap>
        {stop.dateTime}
      </Typography>
    </Stack>
  </>
);

export const ShipmentColumn = ({
  Icon,
  columnLabel,
  values,
}: {
  Icon: any;
  columnLabel: any;
  values: {
    label: string;
    value: string;
    link?: string;
  }[];
}) => (
  <>
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
      {Icon}
      <Typography variant="body1" color="text.secondary" sx={LABEL_SX}>
        {columnLabel}
      </Typography>
    </Stack>
    {values.map(({ value, label, link }, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          width: '100%',
          gap: 0.5,
          mb: 0.5,
        }}
      >
        <Typography key={index} sx={PRIMARY_SX} color="text.secondary">
          {label}:
        </Typography>

        {link ? (
          <Link
            sx={{
              ...PRIMARY_SX,
              cursor: 'pointer',
            }}
            noWrap
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            {value}
          </Link>
        ) : (
          <Typography
            key={index}
            sx={{
              ...PRIMARY_SX,
              ml: 0.5,
            }}
          >
            {value}
          </Typography>
        )}
      </Box>
    ))}
  </>
);
