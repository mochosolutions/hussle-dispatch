import { Box, Chip, Stack, Typography } from '@mui/material';

import type { Vehicle } from 'features/carrier/types';

import { VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';

export const VehicleUnitCellRenderer = ({ data }: { data: Vehicle }) => {
  const initials = data.unitNumber.slice(0, 2).toUpperCase();
  const details = [data.year, data.make, data.model].filter(Boolean).join(' ');

  return (
    <Stack direction="row" alignItems="center" sx={{ py: 0.5, gap: 1.5 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: 1,
          backgroundColor: 'primary.lighter',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          typography: 'caption',
          fontWeight: 700,
        }}
      >
        {initials}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Typography
          variant="subtitle2"
          color="primary.main"
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        >
          {data.unitNumber}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {details || '—'}
        </Typography>
      </Box>
    </Stack>
  );
};

export const VehicleTypeCellRenderer = ({ value }: { value: Vehicle['type'] }) => (
  <Chip
    label={VEHICLE_TYPE_LABELS[value]}
    size="small"
    color="primary"
    variant="outlined"
    sx={{ fontWeight: 600 }}
  />
);

export const VehicleOwnershipCellRenderer = ({ value }: { value: Vehicle['ownership'] }) => {
  const color = value === 'OWNED' ? 'success' : 'info';

  return (
    <Chip
      label={OWNERSHIP_LABELS[value]}
      size="small"
      color={color}
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
};

export const VehicleCarrierCellRenderer = ({ value }: { value: string | null }) => (
  <Typography variant="body2" color="text.primary">
    {value ?? '—'}
  </Typography>
);
