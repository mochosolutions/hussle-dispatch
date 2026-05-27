import { useState } from 'react';
import { Box, Button, IconButton, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { DetailLayout } from 'components/DetailLayout';
import { KpiCell, DetailRow, SectionTitle, Body, HintText } from 'components/Typography';
import SectionCard from 'components/SectionCard';
import { AvatarChip } from 'components/AvatarChip';
import { FileUploadRow } from 'components/FileUploadRow';

const TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Financials', value: 'financials' },
  { label: 'Documents', value: 'documents' },
];

const noop = () => {
  // placeholder for demo callbacks
};

const mockFile = new File(['data'], 'rate_confirmation.pdf', { type: 'application/pdf' });

const OverviewTab = () => (
  <Stack spacing={3}>
    <SectionCard
      title={<SectionTitle>Route Information</SectionTitle>}
      actions={
        <IconButton size="small" aria-label="Edit route">
          <EditIcon fontSize="small" />
        </IconButton>
      }
    >
      <DetailRow label="Origin" value="Newark, NJ 07102" />
      <DetailRow label="Destination" value="Dallas, TX 75207" />
      <DetailRow label="Distance" value="1,547 mi" />
      <DetailRow label="Rate per mile" value="$2.75" valueColor="primary.main" />
      <DetailRow label="Equipment" value="Dry Van (53')" noBorder />
    </SectionCard>

    <SectionCard title={<SectionTitle>Assignment</SectionTitle>}>
      <Box sx={{ py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Body sx={{ color: 'text.secondary', mb: 0.5 }}>Carrier</Body>
        <AvatarChip name="Swift Transport LLC" />
      </Box>
      <Box sx={{ py: 1.25, px: 2 }}>
        <Body sx={{ color: 'text.secondary', mb: 0.5 }}>Driver</Body>
        <AvatarChip name="John Rodriguez" />
      </Box>
    </SectionCard>

    <SectionCard
      title={<SectionTitle>Highlight Variants</SectionTitle>}
    >
      <DetailRow label="Standard row" value="Normal" />
      <DetailRow
        label="Warning highlight"
        value="Expiring Soon"
        sx={{ bgcolor: 'warning.lighter' }}
      />
      <DetailRow
        label="Error highlight"
        value="Expired"
        valueColor="error.main"
        sx={{ bgcolor: 'error.lighter' }}
      />
      <DetailRow label="No border" value="Last item" noBorder />
    </SectionCard>
  </Stack>
);

const FinancialsTab = () => (
  <Stack spacing={3}>
    <SectionCard title={<SectionTitle>Revenue</SectionTitle>}>
      <DetailRow label="Line Haul" value="$4,254.25" />
      <DetailRow label="Fuel Surcharge" value="$212.71" />
      <DetailRow label="Detention" value="$150.00" />
      <DetailRow
        label="Total Revenue"
        value="$4,616.96"
        valueColor="secondary.main"
        noBorder
      />
    </SectionCard>

    <SectionCard title={<SectionTitle>Carrier Pay</SectionTitle>}>
      <DetailRow label="Line Haul" value="$3,500.00" />
      <DetailRow label="Fuel Surcharge" value="$175.00" />
      <DetailRow label="Total Pay" value="$3,675.00" noBorder />
    </SectionCard>

    <SectionCard title={<SectionTitle>Margin</SectionTitle>}>
      <DetailRow
        label="Gross Profit"
        value="$941.96"
        valueColor="secondary.main"
        noBorder
      />
    </SectionCard>
  </Stack>
);

const DocumentsTab = () => (
  <Stack spacing={3}>
    <SectionCard title={<SectionTitle>Required Documents</SectionTitle>}>
      <FileUploadRow
        label="Rate Confirmation"
        required
        file={mockFile}
        status="done"
        onUpload={noop}
        onRemove={noop}
      />
      <FileUploadRow
        label="Bill of Lading"
        required
        status="idle"
        onUpload={noop}
        onRemove={noop}
      />
      <FileUploadRow
        label="Proof of Delivery"
        required
        status="idle"
        onUpload={noop}
        onRemove={noop}
      />
    </SectionCard>

    <SectionCard title={<SectionTitle>Optional Documents</SectionTitle>}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <HintText>No optional documents uploaded yet</HintText>
      </Box>
    </SectionCard>
  </Stack>
);

const DetailLayoutDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab />,
    financials: <FinancialsTab />,
    documents: <DocumentsTab />,
  };

  return (
    <DetailLayout
      id="LD-2026-000007"
      status="IN_TRANSIT"
      breadcrumb={{ label: 'Loads', href: '/dev/list-layout' }}
      actions={
        <Button variant="contained" size="small" sx={{ bgcolor: 'common.white', color: 'primary.dark' }}>
          Create Invoice
        </Button>
      }
      summary={
        <>
          <KpiCell label="Pickup" value="Newark, NJ" sub="Mar 18, 8:00 AM" />
          <KpiCell label="Delivery" value="Dallas, TX" sub="Mar 20, 5:00 PM" />
          <KpiCell label="Rate" value="$4,254.25" valueProps={{ color: 'secondary.main' }} />
          <KpiCell label="Distance" value="1,547 mi" />
        </>
      }
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {tabContent[activeTab]}
    </DetailLayout>
  );
};

export default DetailLayoutDemo;
