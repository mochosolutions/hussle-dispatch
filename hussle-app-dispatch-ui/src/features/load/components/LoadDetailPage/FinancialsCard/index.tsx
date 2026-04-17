import { Button, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SectionCard from 'components/SectionCard';
import { DetailRow } from 'components/Typography';
import { formatCurrency } from '../../constants';
import type { LoadDetail } from '../../types';

interface FinancialsCardProps {
  load: LoadDetail;
  onViewDetails?: () => void;
  onEditRoute?: () => void;
}

export const FinancialsCard: React.FC<FinancialsCardProps> = ({
  load,
  onViewDetails,
  onEditRoute,
}) => {
  const marginPercent = load.marginPercent ? `${parseFloat(load.marginPercent).toFixed(1)}%` : '';

  return (
    <SectionCard
      title="Financials"
      contentSX={{ p: 0 }}
      actions={
        <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={onEditRoute}>
          Edit
        </Button>
      }
    >
      <DetailRow label="Customer Rate" value={formatCurrency(load.customerRate)} />
      <Divider />
      <DetailRow
        label={`Company Margin${marginPercent ? ` (${marginPercent})` : ''}`}
        value={formatCurrency(load.companyMargin)}
      />
      <Divider />
      <DetailRow label="Company Net" value={formatCurrency(load.companyNet)} />
      {load.ratePerMile && (
        <DetailRow
          label="Rate / Mile"
          value={`$${parseFloat(load.ratePerMile).toFixed(2)}`}
          noBorder
        />
      )}
      {!load.ratePerMile && <DetailRow label="Rate / Mile" value={'\u2014'} noBorder />}
      {onViewDetails && (
        <Button
          size="small"
          onClick={onViewDetails}
          sx={{ mx: 2, mb: 1.5, mt: 0.5, textTransform: 'none' }}
        >
          View details →
        </Button>
      )}
    </SectionCard>
  );
};
