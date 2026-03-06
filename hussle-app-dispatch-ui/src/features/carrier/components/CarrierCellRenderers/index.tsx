import { Box, Chip, Stack, Typography } from '@mui/material';
import type { CarrierListItem } from '../../types';

export const CarrierNameCellRenderer = ({ data }: { data: CarrierListItem }) => {
  const initials = data.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return (
    // <Stack direction="column" justifyContent="center" sx={{ height: '100%' }}>
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.5 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1,
          backgroundColor: data.type === 'COMPANY_ASSET' ? 'primary.lighter' : 'success.lighter',
          color: data.type === 'COMPANY_ASSET' ? 'primary.main' : 'success.main',
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
          {data.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.mcNumber ?? '—'}
        </Typography>
      </Box>
    </Stack>
  );
};

export const CarrierTypeCellRenderer = ({ value }: { value: CarrierListItem['type'] }) => {
  const isCompanyAsset = value === 'COMPANY_ASSET';
  const label = isCompanyAsset ? 'Company Asset' : 'External Carrier';
  const color = isCompanyAsset ? 'secondary' : 'info';

  return (
    <Chip label={label} size="small" color={color} variant="outlined" sx={{ fontWeight: 600 }} />
  );
};

export const CarrierOnboardingTypeCellRenderer = ({ data }: { data: CarrierListItem }) => {
  if (data.type === 'COMPANY_ASSET') {
    return null;
  }

  return (
    <Chip
      label={data.onboardingComplete ? 'Complete' : 'Incomplete'}
      size="small"
      color={data.onboardingComplete ? 'success' : 'warning'}
      variant="outlined"
    />
  );
};

export const CarrierContactCellRenderer = ({ data }: { data: CarrierListItem }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        py: 0.5,
      }}
    >
      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
        {data.email}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {data.phone}
      </Typography>
    </Box>
  );
};

export const CarrierStatusCellRenderer = ({ data }: { data: CarrierListItem }) => {
  const status = 'UNKNOWN';
  const chipColor: 'success' | 'warning' | 'info' | 'default' = 'default';

  //   if (status === 'ACTIVE') {
  //     chipColor = 'success';
  //   } else if (status === 'PENDING') {
  //     chipColor = 'warning';
  //   } else if (status === 'ONBOARDING') {
  //     chipColor = 'info';
  //   }

  return (
    <Chip
      label={status.charAt(0) + status.slice(1).toLowerCase()}
      size="small"
      color={chipColor}
      variant="filled"
    />
  );
};
