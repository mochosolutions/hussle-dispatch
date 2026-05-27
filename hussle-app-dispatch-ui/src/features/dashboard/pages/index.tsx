import { useEffect, useMemo } from 'react';
import { Box, Chip, Grid, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { MainCard, PageWrapper } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import SectionCard from 'components/SectionCard';
import { BodyMedium, BodyMuted, KpiCell, SectionTitle } from 'components/Typography';
import { useSelector, useDispatch } from 'store';
import { fetchDashboardRequest } from '../store/reducers/dashboardSlice';
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
import type { AttentionCategory } from '../types';
import { ATTENTION_CATEGORY_LABELS } from '../types';
import { GrossBar } from './components/GrossBar';

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

// ---------------------------------------------------------------------------
// Constants
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
  const attentionByCategory = useSelector(selectAttentionItemsByCategory);
  const totalAttentionCount = useSelector(selectTotalAttentionCount);
  const kpisLoading = useSelector(selectKpisLoading);
  const weeklyGrossLoading = useSelector(selectWeeklyGrossLoading);
  const attentionLoading = useSelector(selectAttentionItemsLoading);

  const isLoading = kpisLoading || weeklyGrossLoading || attentionLoading;

  useEffect(() => {
    dispatch(fetchDashboardRequest());
  }, [dispatch]);

  // Build KPI data
  const kpiCards = useMemo(() => {
    if (!kpis) {
      return [];
    }

    const activeTotal =
      (kpis.kanbanCounts.NEW ?? 0) +
      (kpis.kanbanCounts.BOOKED ?? 0) +
      (kpis.kanbanCounts.ACTIVE ?? 0) +
      (kpis.kanbanCounts.ISSUES ?? 0);

    const kanbanBreakdown = Object.entries(kpis.kanbanCounts ?? {})
      .filter(([, count]) => count > 0)
      .map(([group, count]) => `${count} ${group}`)
      .join(', ');

    const overdueTotal = Number(kpis.overdueInvoices?.total ?? 0);

    return [
      {
        label: 'Active Loads',
        value: String(activeTotal),
        sub: kanbanBreakdown || undefined,
      },
      {
        label: 'Weekly Revenue',
        value: currencyFormatter.format(Number(kpis.revenue?.revenueThisWeek ?? 0)),
      },
      {
        label: 'Monthly Revenue',
        value: currencyFormatter.format(Number(kpis.revenue?.revenueThisMonth ?? 0)),
      },
      {
        label: 'Company Margin',
        value: currencyFormatter.format(Number(kpis.revenue?.companyMarginThisMonth ?? 0)),
      },
      {
        label: 'Overdue Invoices',
        value: String(kpis.overdueInvoices?.count ?? 0),
        sub: overdueTotal > 0 ? currencyFormatter.format(overdueTotal) : undefined,
      },
    ];
  }, [kpis]);

  // Max revenue for bar chart scaling
  const maxRevenue = useMemo(
    () => weeklyGross.reduce((max, item) => Math.max(max, item.revenue, item.target), 0),
    [weeklyGross],
  );

  // Non-empty attention categories
  const activeCategories = useMemo(
    () => CATEGORY_ORDER.filter((cat) => (attentionByCategory[cat]?.length ?? 0) > 0),
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
            <SectionCard title="Weekly Gross Tracker">
              {weeklyGross.length > 0 ? (
                <Stack spacing={2}>
                  {weeklyGross.map((item) => (
                    <GrossBar key={item.vehicleId} item={item} maxRevenue={maxRevenue} />
                  ))}
                </Stack>
              ) : (
                <BodyMuted>No weekly gross data available</BodyMuted>
              )}
            </SectionCard>
          </Grid>

          {/* Pending Carriers */}
          <Grid item xs={12} lg={4}>
            <PendingCarriersCard />
          </Grid>

          {/* Needs Attention */}
          <Grid item xs={12} lg={4}>
            <SectionCard
              title={<SectionTitle>Needs Attention</SectionTitle>}
              actions={
                totalAttentionCount > 0 ? (
                  <Chip
                    label={totalAttentionCount}
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 700 }}
                  />
                ) : undefined
              }
            >
              {totalAttentionCount === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <BodyMuted>All clear &mdash; no items need attention</BodyMuted>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {activeCategories.map((category) => {
                    const items = attentionByCategory[category];
                    return (
                      <Box key={category}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <BodyMuted sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                            {ATTENTION_CATEGORY_LABELS[category]}
                          </BodyMuted>
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
                              <BodyMedium>{item.title}</BodyMedium>
                              {item.subtitle && <BodyMuted>{item.subtitle}</BodyMuted>}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </SectionCard>
          </Grid>
        </Grid>
      </ListLayout>
    </PageWrapper>
  );
};

export default DashboardPage;
