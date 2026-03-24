import { Box, Chip, Stack, Typography } from '@mui/material';
import type { ChipColor } from 'types/chipColor';
import type { Customer, CustomerType, CustomerStatus } from '../../types';

const TYPE_LABELS: Record<CustomerType, string> = {
  BROKER: 'Broker',
  DIRECT_SHIPPER: 'Direct Shipper',
  THREE_PL: '3PL',
};

const TYPE_COLORS: Record<CustomerType, ChipColor> = {
  BROKER: 'secondary',
  DIRECT_SHIPPER: 'info',
  THREE_PL: 'warning',
};

const STATUS_COLORS: Record<CustomerStatus, ChipColor> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
};

export const CustomerNameCellRenderer = ({ data }: { data: Customer }) => {
  const initials = data.companyName
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.5 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
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
          {data.companyName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.mcNumber ?? '—'}
        </Typography>
      </Box>
    </Stack>
  );
};

export const CustomerTypeCellRenderer = ({ value }: { value: CustomerType }) => {
  const label = TYPE_LABELS[value] ?? value;
  const color = TYPE_COLORS[value] ?? 'default';

  return (
    <Chip label={label} size="small" color={color} variant="outlined" sx={{ fontWeight: 600 }} />
  );
};

export const CustomerContactCellRenderer = ({ data }: { data: Customer }) => (
  <Stack direction="column" justifyContent="center" sx={{ height: '100%' }}>
    <Typography variant="body2">{data.phone ?? '—'}</Typography>
    <Typography variant="caption" color="text.secondary">
      {data.email ?? ''}
    </Typography>
  </Stack>
);

export const CustomerStatusCellRenderer = ({ value }: { value: CustomerStatus }) => {
  const label = value === 'ACTIVE' ? 'Active' : 'Inactive';
  const color = STATUS_COLORS[value] ?? 'default';

  return (
    <Chip label={label} size="small" color={color} variant="outlined" sx={{ fontWeight: 600 }} />
  );
};
