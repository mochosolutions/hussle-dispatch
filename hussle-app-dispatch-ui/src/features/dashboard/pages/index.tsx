import { useEffect, useMemo } from 'react';
import {
  Box,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageWrapper, MainCard } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { KpiCell, SectionLabel } from 'components/Typography';
import { useSelector, useDispatch } from 'store';
import { fetchDashboardRequest } from '../store/sagas/dashboardSagaWatcher';
import {
  selectDashboardKpis,
  selectWeeklyGross,
  selectKpisLoading,
  selectWeeklyGrossLoading,
  selectAttentionItemsLoading,
  selectAttentionItemsByCategory,
  selectTotalAttentionCount,
} from '../store/selectors/dashboardSelectors';
import { PendingCarriersCard } from 'features/carrier/components/PendingCarriersCard';
import type { AttentionCategory, WeeklyGrossItem } from '../types';
import { ATTENTION_CATEGORY_LABELS } from '../types';

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

// ---------------------------------------------------------------------------
// Weekly Gross Bar
// ---------------------------------------------------------------------------

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

const GrossBar: React.FC<GrossBarProps> = ({ item, maxRevenue }) => {
  const pct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
  const color = getBarColor(item.revenue, item.target);

  return (
    <Stack spacing={0.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
          {item.unitNumber}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {currencyFormatter.format(item.revenue)}
          {item.target > 0 && ` / ${currencyFormatter.format(item.target)}`}
        </Typography>
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
        <Typography variant="caption" color="text.disabled">
          {item.driverName} &middot; {item.loadCount} load{item.loadCount !== 1 ? 's' : ''}
        </Typography>
      )}
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Attention Items Section
// ---------------------------------------------------------------------------

const CATEGORY_ORDER: AttentionCategory[] = [
  'EXCEPTIONS',
  'OVERDUE_INVOICES',
  'MISSING_RATE_CON',
  'MISSING_BOL',
  'EXPIRING_INSURANCE',
  'UNCONFIRMED_PICKUPS',
];

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

const DashboardPage = () => {
  const dispatch = useDispatch();

  const kpis = useSelector(selectDashboardKpis);
  const weeklyGross = useSelector(selectWeeklyGross);
  const kpisLoading = useSelector(selectKpisLoading);
  const weeklyGrossLoading = useSelector(selectWeeklyGrossLoading);
  const attentionLoading = useSelector(selectAttentionItemsLoading);
  const attentionByCategory = useSelector(selectAttentionItemsByCategory);
  const totalAttentionCount = useSelector(selectTotalAttentionCount);

  useEffect(() => {
    dispatch(fetchDashboardRequest());
  }, [dispatch]);

  const isLoading = kpisLoading || weeklyGrossLoading || attentionLoading;

  // Build KPI data
  const kpiCards = useMemo(() => {
    if (!kpis) {
      return [];
    }

    const activeTotal = (kpis?.kanbanCounts?.NEW ?? 0) + (kpis?.kanbanCounts?.BOOKED ?? 0)
      + (kpis?.kanbanCounts?.ACTIVE ?? 0) + (kpis?.kanbanCounts?.ISSUES ?? 0);

    const kanbanBreakdown = Object.entries(kpis?.kanbanCounts ?? {})
      .filter(([, count]) => count > 0)
      .map(([group, count]) => `${count} ${group}`)
      .join(', ');

    const overdueTotal = Number(kpis?.overdueInvoices?.total ?? 0);

    return [
      {
        label: 'Active Loads',
        value: String(activeTotal),
        sub: kanbanBreakdown || undefined,
      },
      {
        label: 'Weekly Revenue',
        value: currencyFormatter.format(Number(kpis?.revenue?.revenueThisWeek ?? 0)),
      },
      {
        label: 'Monthly Revenue',
        value: currencyFormatter.format(Number(kpis?.revenue?.revenueThisMonth ?? 0)),
      },
      {
        label: 'Company Margin',
        value: currencyFormatter.format(Number(kpis?.revenue?.companyMarginThisMonth ?? 0)),
      },
      {
        label: 'Overdue Invoices',
        value: String(kpis?.overdueInvoices?.count ?? 0),
        sub: overdueTotal > 0
          ? currencyFormatter.format(overdueTotal)
          : undefined,
      },
    ];
  }, [kpis]);

  // Max revenue for bar chart scaling
  const maxRevenue = useMemo(
    () =>
      weeklyGross.reduce((max, item) => Math.max(max, item.revenue, item.target), 0),
    [weeklyGross],
  );

  // Non-empty attention categories
  const activeCategories = useMemo(
    () =>
      CATEGORY_ORDER.filter(
        (cat) => (attentionByCategory[cat]?.length ?? 0) > 0,
      ),
    [attentionByCategory],
  );

  return (
    <PageWrapper isLoading={isLoading} errorContext="DashboardPage" sx={{ gap: 2 }}>
      <ListLayout title="Dashboard">
        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 4, px: { xs: 2, sm: 3 }, pt: 2 }}>
          {kpiCards.map((card) => (
            <Grid key={card.label} item xs={12} sm={6} md={4} xl={2}>
              <MainCard sx={{ height: '100%' }}>
                <KpiCell label={card.label} value={card.value} sub={card.sub} />
              </MainCard>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2} sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
          {/* Weekly Gross Tracker */}
          <Grid item xs={12} lg={8}>
            <MainCard>
              <SectionLabel sx={{ mb: 2 }}>Weekly Gross Tracker</SectionLabel>
              {weeklyGross.length > 0 ? (
                <Stack spacing={2}>
                  {weeklyGross.map((item) => (
                    <GrossBar key={item.vehicleId} item={item} maxRevenue={maxRevenue} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.disabled">
                  No weekly gross data available
                </Typography>
              )}
            </MainCard>
          </Grid>

          {/* Pending Carriers */}
          <Grid item xs={12} lg={4}>
            <PendingCarriersCard />
          </Grid>

          {/* Attention Items */}
          <Grid item xs={12} lg={4}>
            <MainCard>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <SectionLabel>Needs Attention</SectionLabel>
                {totalAttentionCount > 0 && (
                  <Chip
                    label={totalAttentionCount}
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Stack>

              {totalAttentionCount === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    All clear &mdash; no items need attention
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {activeCategories.map((category) => {
                    const items = attentionByCategory[category];
                    return (
                      <Box key={category}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                          >
                            {ATTENTION_CATEGORY_LABELS[category]}
                          </Typography>
                          <Chip
                            label={items.length}
                            size="small"
                            color={items.some((i) => i.severity === 'error') ? 'error' : 'warning'}
                            sx={{ height: 18, fontSize: '0.6875rem' }}
                          />
                        </Stack>
                        <Stack spacing={0.5}>
                          {items.map((item) => (
                            <Box
                              key={item.id}
                              component={RouterLink}
                              to={item.linkTo}
                              sx={{
                                display: 'block',
                                textDecoration: 'none',
                                color: 'inherit',
                                p: 1,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider',
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                },
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.title}
                              </Typography>
                              {item.subtitle && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.subtitle}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </MainCard>
          </Grid>
        </Grid>
      </ListLayout>
    </PageWrapper>
  );
};

export default DashboardPage;
