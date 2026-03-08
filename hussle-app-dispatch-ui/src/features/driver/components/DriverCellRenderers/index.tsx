import { Box, Chip, Stack, Typography } from '@mui/material';

import type { Driver } from 'features/carrier/types';

import { DRIVER_STATUS_LABELS } from '../../constants';

export const DriverNameCellRenderer = ({ data }: { data: Driver }) => {
  const nameParts = data.name.split(' ');
  const initials = [nameParts[0]?.charAt(0), nameParts[nameParts.length - 1]?.charAt(0)]
    .filter(Boolean)
    .map((c) => c.toUpperCase())
    .join('');

  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.5 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          backgroundColor: 'primary.lighter',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          typography: 'caption',
          fontWeight: 700,
          flexShrink: 0,
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
          {data.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.cdlNumber ? `CDL# ${data.cdlNumber}` : '\u2014'}
        </Typography>
      </Box>
    </Stack>
  );
};

export const DriverStatusCellRenderer = ({ data }: { data: Driver }) => {
  if (data.isAvailable) {
    return <Chip label="Available" size="small" color="success" variant="filled" />;
  }

  const label = DRIVER_STATUS_LABELS[data.status] ?? 'Unavailable';

  return <Chip label={label} size="small" color="default" variant="filled" />;
};

export const DriverLocationCellRenderer = ({ data }: { data: Driver }) => {
  if (!data.currentCity && !data.currentState) {
    return (
      <Typography variant="body2" color="text.secondary">
        {'\u2014'}
      </Typography>
    );
  }

  const parts = [data.currentCity, data.currentState].filter(Boolean).join(', ');

  return <Typography variant="body2">{parts}</Typography>;
};

export const DriverCarrierCellRenderer = ({ value }: { value: string | null }) => (
  <Typography variant="body2" color={value ? 'text.primary' : 'text.secondary'}>
    {value ?? '\u2014'}
  </Typography>
);
