import { Stack, Typography } from '@mui/material';
import MainCard from 'components/MainCard';
import type { SettlementDetail } from '../../types';

interface SettlementTotalsCardProps {
  settlement: SettlementDetail;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: string | number): string =>
  currencyFormatter.format(Number(value));

interface TotalRowProps {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}

const TotalRow: React.FC<TotalRowProps> = ({ label, value, bold, color }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontWeight: bold ? 700 : 400,
        color: color ?? 'text.primary',
      }}
    >
      {value}
    </Typography>
  </Stack>
);

export const SettlementTotalsCard: React.FC<SettlementTotalsCardProps> = ({ settlement }) => (
  <MainCard title="Totals">
    <Stack spacing={1.5}>
      <TotalRow label="Gross Revenue" value={formatCurrency(settlement.grossRevenue)} />
      <TotalRow label="Dispatch Fee" value={formatCurrency(settlement.dispatchFeeTotal)} />
      <TotalRow label="Expenses" value={formatCurrency(settlement.expensesTotal)} />
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ pt: 1.5, borderTop: 1, borderColor: 'divider' }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          Net Earnings
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {formatCurrency(settlement.netEarnings)}
        </Typography>
      </Stack>
    </Stack>
  </MainCard>
);
