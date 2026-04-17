import { Grid, Stack, Typography } from '@mui/material';
import MainCard from 'components/MainCard';
import { StatusBadge } from 'components/Statusbadge';
import { SettlementTotalsCard } from '../../../components/SettlementTotalsCard';
import type { SettlementDetail } from '../../../types';

interface OverviewTabProps {
  settlement: SettlementDetail;
}

const formatDate = (value: string | null): string => {
  if (!value) {
    return '\u2014';
  }
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const toSettlementStatusKey = (status: string): string => `SETTLEMENT_${status}`;

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, children }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2">{children}</Typography>
  </Stack>
);

export const OverviewTab: React.FC<OverviewTabProps> = ({ settlement }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <SettlementTotalsCard settlement={settlement} />
    </Grid>
    <Grid item xs={12} md={6}>
      <MainCard title="Settlement Info">
        <Stack spacing={1.5}>
          <InfoRow label="Settlement #">{settlement.settlementNumber}</InfoRow>
          <InfoRow label="Status">
            <StatusBadge status={toSettlementStatusKey(settlement.status)} size="small" />
          </InfoRow>
          <InfoRow label="Created">{formatDate(settlement.createdAt)}</InfoRow>
          {settlement.paymentMethod && (
            <InfoRow label="Payment Method">{settlement.paymentMethod}</InfoRow>
          )}
          {settlement.paymentReference && (
            <InfoRow label="Payment Reference">{settlement.paymentReference}</InfoRow>
          )}
          {settlement.paidAt && (
            <InfoRow label="Paid Date">{formatDate(settlement.paidAt)}</InfoRow>
          )}
          {settlement.disputeReason && (
            <>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                sx={{ pt: 1.5, borderTop: 1, borderColor: 'divider' }}
              >
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  Dispute Reason
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {settlement.disputeReason}
              </Typography>
            </>
          )}
        </Stack>
      </MainCard>
    </Grid>
  </Grid>
);
