import { Box, Stack } from '@mui/material';

import type { Driver } from 'features/carrier/types';
import { StatusCell } from 'components/Statusbadge';
import { Body, BodyStrong, Meta } from 'components/Typography';
import getDriverDisplayName from 'utils/getDriverDisplayName';

export const DriverNameCellRenderer = ({ data }: { data: Driver }) => {
  const displayName = getDriverDisplayName(data);
  const initials = [data.firstName.charAt(0), data.lastName.charAt(0)]
    .filter(Boolean)
    .map((c) => c.toUpperCase())
    .join('');

  return (
    <Stack direction="row" alignItems="center" sx={{ py: 0.5, gap: 1.5 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
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
        <BodyStrong sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          {displayName}
        </BodyStrong>
        <Meta>
          {data.licenseNumber ? `${data.licenseType} · ${data.licenseNumber}` : '\u2014'}
        </Meta>
      </Box>
    </Stack>
  );
};

export const DriverStatusCellRenderer = ({ data }: { data: Driver }) => {
  if (data.isAvailable) {
    return <StatusCell status="DRIVER_AVAILABLE" />;
  }

  const statusKey = data.status === 'on_load' ? 'DRIVER_ON_LOAD' : 'DRIVER_UNAVAILABLE';

  return <StatusCell status={statusKey} />;
};

export const DriverLocationCellRenderer = ({ data }: { data: Driver }) => {
  if (!data.currentCity && !data.currentState) {
    return <Meta>{'\u2014'}</Meta>;
  }

  const parts = [data.currentCity, data.currentState].filter(Boolean).join(', ');

  return <Body>{parts}</Body>;
};

export const DriverCarrierCellRenderer = ({ value }: { value: string | null }) => (
  value ? <Body sx={{ color: 'text.primary' }}>{value}</Body> : <Meta>{'\u2014'}</Meta>
);
