import { Box, Button, Chip, Grid, Stack } from '@mui/material';
import { BodyMedium, BodyStrong, KpiLabel, Meta } from 'components/Typography';
import { EmptyState } from '@mocho/ui/components';
import EditIcon from '@mui/icons-material/Edit';
import { format, parseISO } from 'date-fns';
import { FieldRow } from 'components/FieldRow';
import SectionCard from 'components/SectionCard';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import type { Driver } from 'features/carrier/types';
import { PAY_TYPE_LABELS } from '../../constants';

interface DriverWithCarrierInfo extends Driver {
  carrierName: string | null;
  carrierType: string | null;
  companyMarginPercent: number | null;
}

interface DriverOverviewTabProps {
  driver: DriverWithCarrierInfo;
  onEditInfo: () => void;
  onEditPreferences: () => void;
  onEditLocation: () => void;
}

const formatPayRate = (
  payType: Driver['payType'],
  payRate: Driver['payRate'],
): string => {
  if (!payType || payRate === null) return '—';
  const rate = parseFloat(payRate);
  if (payType === 'PERCENTAGE') return `${rate}%`;
  if (payType === 'PER_MILE') return `$${rate}/mi`;
  if (payType === 'PER_HOUR') return `$${rate}/hr`;
  return `$${rate}`;
};

const formatExpiryDate = (iso: string | null): string => {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
};

const formatLocation = (city: string | null, state: string | null): string => {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return '\u2014';
};

export const DriverOverviewTab: React.FC<DriverOverviewTabProps> = ({
  driver: d,
  onEditInfo,
  onEditPreferences,
  onEditLocation,
}) => (
  <Grid container spacing={2.5} sx={{ p: 3, maxWidth: 1200 }}>
    <Grid item xs={12} md={8}>
      <SectionCard
        title="Driver Information"
        actions={
          <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={onEditInfo}>
            Edit
          </Button>
        }
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <FieldRow label="Full Name" value={getDriverDisplayName(d)} />
          <FieldRow label="Phone" value={d.phone} />
          <FieldRow label="Email" value={d.email} isLink />
          <FieldRow label="License Type" value={d.licenseType} />
          <FieldRow label="License Number" value={d.licenseNumber} />
          <FieldRow label="License State" value={d.licenseState} />
          <FieldRow label="License Expiry" value={formatExpiryDate(d.licenseExpiry)} />
          <FieldRow
            label="Endorsements"
            value={d.endorsements && d.endorsements.length > 0 ? d.endorsements.join(', ') : null}
          />
          <FieldRow label="Carrier" value={d.carrierName} />
          <FieldRow label="Vehicle" value={'\u2014'} />
          <FieldRow label="Home Base" value={formatLocation(d.homeBaseCity, d.homeBaseState)} />
          <FieldRow
            label="Pay Type"
            value={d.payType ? (PAY_TYPE_LABELS[d.payType] ?? d.payType) : '\u2014'}
          />
          <FieldRow label="Pay Rate" value={formatPayRate(d.payType, d.payRate)} />
          <FieldRow
            label="Company Margin"
            value={d.companyMarginPercent !== null ? `${d.companyMarginPercent}%` : '\u2014'}
          />
        </Box>
      </SectionCard>

      <SectionCard title="Performance (All Time)">
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
          }}
        >
          {[
            { value: '\u2014', label: 'Total Loads' },
            { value: '\u2014', label: 'Revenue' },
            { value: '\u2014', label: 'Avg Rate/Mi' },
            { value: '\u2014', label: 'On-Time %' },
            { value: '\u2014', label: 'Avg Days Out' },
            { value: '\u2014', label: 'Weekly Avg' },
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
              <BodyStrong sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'text.primary' }}>
                {stat.value}
              </BodyStrong>
              <KpiLabel>{stat.label}</KpiLabel>
            </Box>
          ))}
        </Box>
      </SectionCard>

      <SectionCard title="Weekly Gross History">
        <Box sx={{ px: 1.5, py: 2 }}>
          <EmptyState title="No load history data available" />
        </Box>
      </SectionCard>
    </Grid>

    <Grid item xs={12} md={4}>
      <Stack spacing={2}>
        <SectionCard
          title="Status & Location"
          actions={
            <Button
              startIcon={<EditIcon fontSize="small" />}
              size="small"
              onClick={onEditLocation}
              sx={{ minWidth: 'auto', fontSize: '0.7rem' }}
            >
              Edit
            </Button>
          }
        >
          <Box sx={{ px: 1, py: 0.5 }}>
            {[
              {
                label: 'Status',
                value: (
                  <Chip
                    label={d.isAvailable ? 'Available' : 'Unavailable'}
                    size="small"
                    color={d.isAvailable ? 'success' : 'default'}
                    sx={{ height: 22, fontSize: '0.75rem' }}
                  />
                ),
              },
              {
                label: 'Location',
                value: formatLocation(d.currentCity, d.currentState),
              },
              {
                label: 'Hours Remaining',
                value: d.availableHours ? `${d.availableHours}h` : '\u2014',
              },
              { label: 'Days From Home', value: '\u2014' },
              { label: 'Last Delivered', value: '\u2014' },
            ].map((row) => (
              <Box
                key={row.label}
                sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}
              >
                <Meta sx={{ color: 'text.disabled' }}>{row.label}</Meta>
                {typeof row.value === 'string' ? (
                  <Meta sx={{ color: 'text.primary', fontWeight: 500 }}>{row.value}</Meta>
                ) : (
                  row.value
                )}
              </Box>
            ))}
          </Box>
        </SectionCard>

        <SectionCard
          title="Preferences Snapshot"
          actions={
            <Button
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={onEditPreferences}
              sx={{ minWidth: 'auto', fontSize: '0.7rem' }}
            >
              Edit
            </Button>
          }
        >
          <Box sx={{ px: 1, py: 0.5 }}>
            <BodyMedium sx={{ mb: 0.5 }}>Preferred Lanes</BodyMedium>
            {d.preferredLanes.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                {d.preferredLanes.map((lane, i) => (
                  <Chip
                    key={`lane-${String(i)}`}
                    label={`${lane.originState} \u2192 ${lane.destState}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            ) : (
              <Meta sx={{ color: 'text.disabled', mb: 1.5, display: 'block' }}>None set</Meta>
            )}

            <BodyMedium sx={{ mb: 0.5 }}>No-Go Zones</BodyMedium>
            {d.noGoZones.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                {d.noGoZones.map((zone, i) => (
                  <Chip
                    key={`zone-${String(i)}`}
                    label={zone.city ? `${zone.city}, ${zone.state}` : zone.state}
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            ) : (
              <Meta sx={{ color: 'text.disabled', mb: 1.5, display: 'block' }}>None set</Meta>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Meta sx={{ color: 'text.disabled' }}>Max Days Out</Meta>
              <Meta sx={{ color: 'text.primary', fontWeight: 500 }}>
                {d.maxDaysOut ?? '\u2014'}
              </Meta>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Meta sx={{ color: 'text.disabled' }}>Home Base</Meta>
              <Meta sx={{ color: 'text.primary', fontWeight: 500 }}>
                {formatLocation(d.homeBaseCity, d.homeBaseState)}
              </Meta>
            </Box>
          </Box>
        </SectionCard>
      </Stack>
    </Grid>
  </Grid>
);
