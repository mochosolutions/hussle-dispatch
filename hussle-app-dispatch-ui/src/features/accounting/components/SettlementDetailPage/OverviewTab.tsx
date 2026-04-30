import { Grid, Stack } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { StatusBadge } from 'components/Statusbadge';
import { Body, BodyMuted, ErrorText, BodyStrong } from 'components/Typography';
import { SettlementTotalsCard } from '../../components/SettlementTotalsCard';
import type { SettlementDetail } from '../../types';

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
    <BodyMuted>{label}</BodyMuted>
    <Body>{children}</Body>
  </Stack>
);

export const OverviewTab: React.FC<OverviewTabProps> = ({ settlement }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <SettlementTotalsCard settlement={settlement} />
    </Grid>
    <Grid item xs={12} md={6}>
      <SectionCard title="Settlement Info">
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
                <ErrorText sx={{ fontWeight: 600 }}>Dispute Reason</ErrorText>
              </Stack>
              <BodyMuted>{settlement.disputeReason}</BodyMuted>
            </>
          )}
        </Stack>
      </SectionCard>
    </Grid>
  </Grid>
);
