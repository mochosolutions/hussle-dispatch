import { Box, Chip, LinearProgress, Stack } from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import { StatusBadge } from 'components/Statusbadge';
import { BodyStrong, Meta, TwoLineCell } from 'components/Typography';
import type { CarrierListItem, CarrierType } from '../../types';

export const CARRIER_TYPE_LABELS: Record<CarrierType, string> = {
  COMPANY_ASSET: 'Company Asset',
  EXTERNAL_CARRIER: 'External Carrier',
  LEASED_CARRIER: 'Leased Carrier',
};

export const CarrierNameCellRenderer = ({ data }: { data: CarrierListItem }) => {
  const initials = data.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return (
    <Stack direction="row" gap={1.5} alignItems="center" sx={{ py: 0.5 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
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
        <BodyStrong>{data.name}</BodyStrong>
        <Meta>{data.mcNumber ?? '—'}</Meta>
      </Box>
    </Stack>
  );
};

export const CarrierTypeCellRenderer = ({ value }: { value: CarrierListItem['type'] }) => {
  const label = CARRIER_TYPE_LABELS[value] ?? 'Unknown';

  return (
    <StatusBadge status={value} label={label} size="small" />
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
  const name = data.primaryContactName;
  const email = data.primaryContactEmail;

  if (!name && !email) {
    return <Meta>—</Meta>;
  }

  return (
    <TwoLineCell
      primary={name ?? '—'}
      secondary={email ?? ''}
    />
  );
};

import { CARRIER_STATUS_COLORS, CARRIER_STATUS_LABELS } from '../../constants';

const TOTAL_PHASES = 6;

export const CarrierStatusCellRenderer = ({ data }: { data: CarrierListItem }) => {
  const status = data.status ?? 'DRAFT';
  const chipColor = CARRIER_STATUS_COLORS[status] ?? 'default';
  const label = CARRIER_STATUS_LABELS[status] ?? status;

  return (
    <Chip
      label={label}
      size="small"
      color={chipColor}
      variant="filled"
    />
  );
};

export const InvitedAtCellRenderer = ({ data }: { data: CarrierListItem }) => {
  if (!data.inviteSentAt) {
    return <Meta>—</Meta>;
  }
  const date = new Date(data.inviteSentAt);
  return <Meta>{format(date, 'MMM d, yyyy')}</Meta>;
};

export const LastActivityCellRenderer = ({ data }: { data: CarrierListItem }) => {
  const ts = data.onboardingSession?.lastActiveAt;
  if (!ts) {
    return <Meta>—</Meta>;
  }
  return <Meta>{formatDistanceToNow(new Date(ts), { addSuffix: true })}</Meta>;
};

export const PhaseProgressCellRenderer = ({ data }: { data: CarrierListItem }) => {
  const completed = data.onboardingSession?.completedPhases.length ?? 0;
  const pct = Math.min(100, Math.round((completed / TOTAL_PHASES) * 100));
  return (
    <Box sx={{ width: '100%' }}>
      <Meta sx={{ display: 'block', mb: 0.5 }}>
        {completed} / {TOTAL_PHASES}
      </Meta>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ height: 4, borderRadius: 2 }}
      />
    </Box>
  );
};
