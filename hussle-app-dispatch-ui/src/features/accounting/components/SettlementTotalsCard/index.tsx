import { Stack } from '@mui/material';
import MainCard from 'components/MainCard';
import { BodyMuted, Body, BodyStrong, Amount } from 'components/Typography';
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
}

const TotalRow: React.FC<TotalRowProps> = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <BodyMuted>{label}</BodyMuted>
    <Body>{value}</Body>
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
        <BodyStrong>Net Earnings</BodyStrong>
        <Amount sx={{ color: 'primary.main' }}>{formatCurrency(settlement.netEarnings)}</Amount>
      </Stack>
    </Stack>
  </MainCard>
);
