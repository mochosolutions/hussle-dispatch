import { Box, Typography, LinearProgress, Skeleton, Tooltip } from '@mui/material';
import { MainCard } from '@mocho/ui/components';
import type { WeeklyGrossItem } from 'features/dashboard/types';

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const MIN_TARGET_THRESHOLD = 0.4;

interface WeeklyGrossStripProps {
  items: WeeklyGrossItem[];
  isLoading: boolean;
}

const getBarColor = (revenue: number, target: number): string => {
  if (revenue >= target) return 'success.main';
  if (target > 0 && revenue / target < MIN_TARGET_THRESHOLD) return 'warning.main';
  return 'primary.main';
};

export const WeeklyGrossStrip: React.FC<WeeklyGrossStripProps> = ({ items, isLoading }) => {
  if (isLoading) {
    return (
      <MainCard>
        <Skeleton variant="text" width={200} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ flex: 1, minWidth: 150 }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="rectangular" height={6} sx={{ borderRadius: 3 }} />
            </Box>
          ))}
        </Box>
      </MainCard>
    );
  }

  if (items.length === 0) {
    return (
      <MainCard sx={{ mb: 2, px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Weekly Gross
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No vehicle data yet
          </Typography>
        </Box>
      </MainCard>
    );
  }

  const fleetTotal = items.reduce((sum, item) => sum + item.revenue, 0);
  const fleetTarget = items.reduce((sum, item) => sum + item.target, 0);

  return (
    <MainCard>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Weekly Gross
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Revenue vs weekly vehicle targets
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="caption" color="text.disabled">On target</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <Typography variant="caption" color="text.disabled">In progress</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
            <Typography variant="caption" color="text.disabled">Below 40%</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700, ml: 1 }}>
            {currencyFmt.format(fleetTotal)} / {currencyFmt.format(fleetTarget)}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0, overflow: 'auto', mt: 2, mb: 2 }}>
        {items.map((item, i) => {
          const pct = item.target > 0 ? Math.min((item.revenue / item.target) * 100, 100) : 0;
          const barColor = getBarColor(item.revenue, item.target);
          const atTarget = item.revenue >= item.target;

          return (
            <Box
              key={item.vehicleId}
              sx={{
                flex: 1,
                minWidth: 164,
                px: 1.5,
                borderRight: i < items.length - 1 ? 1 : 0,
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Truck #{item.unitNumber}{' '}
                  <Typography component="span" variant="caption" color="text.disabled">
                    ({item.driverName ?? 'Unassigned'})
                  </Typography>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: atTarget ? 'success.main' : 'text.primary',
                    ml: 4,
                  }}
                >
                  {currencyFmt.format(item.revenue)}
                </Typography>
              </Box>
              <Tooltip title={`${Math.round(pct)}% of ${currencyFmt.format(item.target)} target`} arrow>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: barColor,
                      borderRadius: 3,
                    },
                  }}
                />
              </Tooltip>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.625rem' }}>
                {currencyFmt.format(item.target)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </MainCard>
  );
};
