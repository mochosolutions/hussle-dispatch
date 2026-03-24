import { Box, Divider, Stack, Typography } from '@mui/material';
import { DarkSectionCard } from 'components/SectionCard';
import { formatCurrency } from '../../constants';
import type { LoadDetail } from '../../types';

interface FinancialsCardProps {
  load: LoadDetail;
}

const LABEL_SX = { color: 'grey.400', fontSize: '0.75rem' } as const;
const VALUE_SX = { fontWeight: 600, fontSize: '0.875rem', color: 'common.white' } as const;

const InfoRow: React.FC<{ label: string; value: string; secondary?: string }> = ({
  label,
  value,
  secondary,
}) => (
  <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
    <Typography sx={LABEL_SX}>{label}</Typography>
    <Stack direction="row" spacing={0.75} alignItems="baseline">
      <Typography sx={VALUE_SX}>{value}</Typography>
      {secondary && (
        <Typography sx={{ color: 'grey.500', fontSize: '0.7rem' }}>{secondary}</Typography>
      )}
    </Stack>
  </Stack>
);

const computePercentage = (part: string | null, whole: string | null): string => {
  if (!part || !whole) return '';
  const p = parseFloat(part);
  const w = parseFloat(whole);
  if (w === 0 || Number.isNaN(p) || Number.isNaN(w)) return '';
  return `${((p / w) * 100).toFixed(1)}%`;
};

export const FinancialsCard: React.FC<FinancialsCardProps> = ({ load }) => {
  const accessorialTotal = load.accessorialCharges.reduce(
    (sum, charge) => sum + parseFloat(charge.amount),
    0,
  );

  const customerRate = load.customerRate ? parseFloat(load.customerRate) : 0;
  const dispatchFee = load.dispatchFee ? parseFloat(load.dispatchFee) : 0;
  const partnerSplit = load.partnerSplit ? parseFloat(load.partnerSplit) : 0;
  const companyShare = customerRate - dispatchFee - partnerSplit;

  return (
    <DarkSectionCard title="Financials">
      <InfoRow label="Customer Rate" value={formatCurrency(load.customerRate)} />
      {accessorialTotal > 0 && (
        <InfoRow
          label={`Accessorials (${load.accessorialCharges.length})`}
          value={formatCurrency(accessorialTotal)}
        />
      )}

      <Divider sx={{ borderColor: 'grey.700', my: 1 }} />

      <InfoRow
        label="Dispatch Fee"
        value={formatCurrency(load.dispatchFee)}
        secondary={computePercentage(load.dispatchFee, load.customerRate)}
      />
      <InfoRow
        label="Partner Split"
        value={formatCurrency(load.partnerSplit)}
        secondary={computePercentage(load.partnerSplit, load.customerRate)}
      />

      <Divider sx={{ borderColor: 'grey.700', my: 1 }} />

      <InfoRow label="Company Share" value={formatCurrency(companyShare)} />

      <Box
        sx={{
          mt: 1.5,
          p: 1.5,
          bgcolor: 'grey.800',
          borderRadius: 1,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: 'grey.500', fontSize: '0.7rem', textTransform: 'uppercase' }}>
          Rate / Mile
        </Typography>
        <Typography
          sx={{
            color: 'success.light',
            fontWeight: 700,
            fontSize: '1.5rem',
            lineHeight: 1.2,
          }}
        >
          {load.ratePerMile ? `$${parseFloat(load.ratePerMile).toFixed(2)}` : '\u2014'}
        </Typography>
      </Box>
    </DarkSectionCard>
  );
};
