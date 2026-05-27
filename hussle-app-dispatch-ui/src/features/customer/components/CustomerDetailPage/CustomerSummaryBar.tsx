import { Grid } from '@mui/material';
import { KpiCell } from 'components/Typography';
import type { Customer } from '../../types';
import type { CustomerStats } from 'utils/api/fleet/customerApi';

const formatCurrency = (value: string): string =>
  `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const ELLIPSIS = '\u2026';
const EM_DASH = '\u2014';

const resolveAvgDaysToPay = (statsLoading: boolean, stats: CustomerStats | null): string => {
  if (statsLoading) {
    return ELLIPSIS;
  }
  if (stats?.avgDaysToPay !== null && stats?.avgDaysToPay !== undefined) {
    return `${stats.avgDaysToPay} days`;
  }
  return EM_DASH;
};

const resolveStatValue = (
  statsLoading: boolean,
  stats: CustomerStats | null,
  field: keyof Pick<CustomerStats, 'outstandingAR' | 'totalRevenue'>,
): string => {
  if (statsLoading) {
    return ELLIPSIS;
  }
  return stats ? formatCurrency(stats[field]) : EM_DASH;
};

interface CustomerSummaryBarProps {
  customer: Customer;
  stats: CustomerStats | null;
  statsLoading: boolean;
}

export const CustomerSummaryBar: React.FC<CustomerSummaryBarProps> = ({
  customer,
  stats,
  statsLoading,
}) => {
  const avgDaysToPayValue = resolveAvgDaysToPay(statsLoading, stats);
  const outstandingARValue = resolveStatValue(statsLoading, stats, 'outstandingAR');
  const totalRevenueValue = resolveStatValue(statsLoading, stats, 'totalRevenue');
  const loadCountSub = statsLoading ? '' : `${stats?.loadCount ?? customer._count.loads} loads`;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCell
          label="MC / DOT"
          value={customer.mcNumber ?? EM_DASH}
          sub={customer.dotNumber ?? EM_DASH}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCell
          label="PRIMARY CONTACT"
          value={customer.phone ?? EM_DASH}
          sub={customer.email ?? EM_DASH}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCell
          label="PAYMENT TERMS"
          value={customer.paymentTerms}
          sub={customer.quickPayDiscount ? `Quick Pay ${customer.quickPayDiscount}%` : EM_DASH}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCell label="AVG DAYS TO PAY" value={avgDaysToPayValue} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCell
          label="OUTSTANDING AR"
          value={outstandingARValue}
          valueProps={
            stats && Number(stats.outstandingAR) > 0 ? { color: 'warning.main' } : undefined
          }
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCell
          label="TOTAL REVENUE"
          value={totalRevenueValue}
          sub={loadCountSub}
          valueProps={
            stats && Number(stats.totalRevenue) > 0 ? { color: 'success.main' } : undefined
          }
        />
      </Grid>
    </Grid>
  );
};
