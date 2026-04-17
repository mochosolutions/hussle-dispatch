import { Box, Typography } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { DetailRow, KpiCell } from 'components/Typography';
import { EditableSectionHeader } from 'components/EditableSectionHeader';
import { FieldRow } from 'components/FieldRow';
import { CUSTOMER_TYPE_LABELS } from '../../constants';
import type { Customer } from '../../types';

interface OverviewTabProps {
  customer: Customer;
  onEditCompanyInfo: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ customer, onEditCompanyInfo }) => {
  const fullAddress = [customer.address, customer.city, customer.state, customer.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Company Information */}
      <SectionCard
        title={<EditableSectionHeader title="Company Information" onEdit={onEditCompanyInfo} />}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <Box>
            <FieldRow label="Company" value={customer.companyName} />
            <FieldRow label="Type" value={CUSTOMER_TYPE_LABELS[customer.type]} />
            <FieldRow label="MC Number" value={customer.mcNumber} />
            <FieldRow label="DOT Number" value={customer.dotNumber} />
          </Box>
          <Box>
            <FieldRow label="Phone" value={customer.phone} />
            <FieldRow label="Email" value={customer.email} isLink />
            <FieldRow label="Website" value={customer.website} isLink />
            <FieldRow label="Address" value={fullAddress} />
          </Box>
        </Box>
      </SectionCard>

      {/* Billing & Payment */}
      <SectionCard title="Billing & Payment">
        <DetailRow label="Payment Terms" value={customer.paymentTerms} />
        <DetailRow label="Terms Days" value={`${customer.paymentTermsDays} days`} />
        <DetailRow
          label="Quick Pay Rate"
          value={customer.quickPayDiscount ? `${customer.quickPayDiscount}%` : '—'}
        />
        <DetailRow label="Billing Method" value={'—'} noBorder />
      </SectionCard>

      {/* Performance — All Time */}
      <SectionCard title={'Performance \u2014 All Time'}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 2,
            p: 1,
          }}
        >
          <KpiCell label="Total Loads" value={String(customer._count.loads)} />
          <KpiCell label="Revenue" value={'—'} />
          <KpiCell label="Outstanding" value={'—'} />
          <KpiCell label="Avg Rate/Load" value={'—'} />
          <KpiCell label="On-Time %" value={'—'} />
        </Box>
      </SectionCard>
    </Box>
  );
};
