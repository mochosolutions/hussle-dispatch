import { Chip } from '@mui/material';
import { StatusBadge } from 'components/Statusbadge';
import { INVOICE_TYPE_LABELS } from '../../constants';
import type { InvoiceListItem } from '../../types';

export const InvoiceStatusCellRenderer = ({
  data,
}: {
  data: InvoiceListItem & { isOverdue: boolean };
}) => <StatusBadge status={data.status} />;

export const InvoiceTypeCellRenderer = ({ data }: { data: InvoiceListItem }) => (
  <Chip
    label={INVOICE_TYPE_LABELS[data.type]}
    size="small"
    variant="filled"
    sx={{ fontWeight: 500 }}
  />
);

export const InvoiceBolFlagCellRenderer = ({ data }: { data: InvoiceListItem }) => {
  if (data.missingSignedBol) {
    return (
      <Chip
        label="Missing"
        size="small"
        color="warning"
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
    );
  }
  return (
    <Chip
      label="Present"
      size="small"
      color="success"
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
};
