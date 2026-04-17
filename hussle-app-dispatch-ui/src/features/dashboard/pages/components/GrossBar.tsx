import { LinearProgress, Stack } from '@mui/material';
import { BodyMuted, MetaStrong } from 'components/Typography';
import type { WeeklyGrossItem } from '../../types';

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const getBarColor = (revenue: number, target: number): string => {
  if (target <= 0) {
    return '#757575';
  }
  const pct = (revenue / target) * 100;
  if (pct >= 100) {
    return '#2e7d32';
  }
  if (pct >= 50) {
    return '#ed6c02';
  }
  return '#d32f2f';
};

interface GrossBarProps {
  item: WeeklyGrossItem;
  maxRevenue: number;
}

export const GrossBar: React.FC<GrossBarProps> = ({ item, maxRevenue }) => {
  const pct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
  const color = getBarColor(item.revenue, item.target);

  return (
    <Stack spacing={0.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <MetaStrong sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{item.unitNumber}</MetaStrong>
        <BodyMuted sx={{ fontSize: '0.75rem' }}>
          {currencyFormatter.format(item.revenue)}
          {item.target > 0 && ` / ${currencyFormatter.format(item.target)}`}
        </BodyMuted>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min(pct, 100)}
        sx={{
          height: 10,
          borderRadius: 1,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
            borderRadius: 1,
          },
        }}
      />
      {item.driverName && (
        <BodyMuted sx={{ fontSize: '0.6875rem' }}>
          {item.driverName} &middot; {item.loadCount} load{item.loadCount !== 1 ? 's' : ''}
        </BodyMuted>
      )}
    </Stack>
  );
};
