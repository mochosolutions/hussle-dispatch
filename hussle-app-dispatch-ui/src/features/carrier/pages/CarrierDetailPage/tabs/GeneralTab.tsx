import { Box, Card, Grid, Typography } from '@mui/material';
import { EditableSectionHeader } from '../../../components/EditableSectionHeader';
import { FieldRow } from '../../../components/FieldRow';
import type { CarrierListItem } from '../../../types';

interface GeneralTabProps {
  carrier: CarrierListItem & {
    createdAt: string;
    updatedAt: string;
    insuranceExpiry: string | null;
  };
  onEditCompanyInfo: () => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ carrier, onEditCompanyInfo }) => {
  const fullAddress = [carrier.address, carrier.city, carrier.state, carrier.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Company Information */}
      <Card>
        <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <EditableSectionHeader title="Company Information" onEdit={onEditCompanyInfo} />
        </Box>
        <Box sx={{ px: 3, py: 2 }}>
          <Grid container>
            <Grid item xs={6}>
              <FieldRow label="Legal Name" value={carrier.name} />
              <FieldRow label="MC Number" value={carrier.mcNumber} />
              <FieldRow label="DOT Number" value={carrier.dotNumber} />
              <FieldRow label="EIN" value={carrier.ein} />
            </Grid>
            <Grid item xs={6}>
              <FieldRow label="Phone" value={carrier.phone} />
              <FieldRow label="Email" value={carrier.email} isLink />
              <FieldRow label="Address" value={fullAddress} />
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Performance (read-only) */}
      <Card>
        <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
          >
            Performance (All Time)
          </Typography>
        </Box>
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 2,
          }}
        >
          {[
            { value: '—', label: 'Total Loads' },
            { value: '—', label: 'Revenue' },
            { value: '—', label: 'Avg Rate/Mi' },
            { value: '—', label: 'On-Time %' },
            { value: '—', label: 'Avg Days Out' },
          ].map((stat) => (
            <Box
              key={stat.label}
              sx={{
                textAlign: 'center',
                py: 1.5,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {stat.value}
              </Typography>
              <Typography variant="caption">{stat.label}</Typography>
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  );
};
