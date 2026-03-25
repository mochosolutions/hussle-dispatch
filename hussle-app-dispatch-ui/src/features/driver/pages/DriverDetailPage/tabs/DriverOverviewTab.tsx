import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material';

import { EmptyState } from '@mocho/ui/components';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import type { Driver } from 'features/carrier/types';
import { FieldRow } from 'components/FieldRow';
import { EditableSectionHeader } from 'components/EditableSectionHeader';
import SectionCard from 'components/SectionCard';

interface DriverWithCarrierInfo extends Driver {
  carrierName: string | null;
  carrierType: string | null;
}

interface DriverOverviewTabProps {
  driver: DriverWithCarrierInfo;
  onEditInfo: () => void;
  onEditPreferences: () => void;
  onEditLocation: () => void;
}

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
    {/* Left Column -- Driver Information */}
    <Grid item xs={4}>
      <SectionCard
        title={<EditableSectionHeader title="Driver Information" onEdit={onEditInfo} />}
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <FieldRow label="Full Name" value={getDriverDisplayName(d)} />
          <FieldRow label="Phone" value={d.phone} />
          <FieldRow label="Email" value={d.email} isLink />
          <FieldRow label="License Type" value={d.licenseType} />
          <FieldRow label="License Number" value={d.licenseNumber} />
          <FieldRow label="License State" value={d.licenseState} />
          <FieldRow label="License Expiry" value={d.licenseExpiry} />
          <FieldRow
            label="Endorsements"
            value={d.endorsements && d.endorsements.length > 0 ? d.endorsements.join(', ') : null}
          />
          <FieldRow label="Carrier" value={d.carrierName} />
          <FieldRow label="Vehicle" value={'\u2014'} />
          <FieldRow label="Home Base" value={formatLocation(d.homeBaseCity, d.homeBaseState)} />
          <FieldRow
            label="Dispatch Fee"
            value={d.dispatchFeePercent !== null ? `${d.dispatchFeePercent}%` : '\u2014'}
          />
        </Box>
      </SectionCard>
    </Grid>

    {/* Center Column -- Performance + Weekly Gross */}
    <Grid item xs={5}>
      <Stack spacing={2}>
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
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption">{stat.label}</Typography>
              </Box>
            ))}
          </Box>
        </SectionCard>

        <SectionCard title="Weekly Gross History">
          <Box sx={{ px: 1.5, py: 2 }}>
            <EmptyState title="No load history data available" />
          </Box>
        </SectionCard>
      </Stack>
    </Grid>

    {/* Right Column -- Status, Matching, Upcoming, Preferences */}
    <Grid item xs={3}>
      <Stack spacing={2}>
        {/* Status & Location */}
        <SectionCard
          title={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.6875rem',
                  color: 'text.disabled',
                }}
              >
                Status & Location
              </Typography>
              <Button
                size="small"
                onClick={onEditLocation}
                sx={{ minWidth: 'auto', fontSize: '0.7rem' }}
              >
                Edit
              </Button>
            </Box>
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
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  {row.label}
                </Typography>
                {typeof row.value === 'string' ? (
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {row.value}
                  </Typography>
                ) : (
                  row.value
                )}
              </Box>
            ))}
          </Box>
        </SectionCard>

        {/* Find Matching Loads */}
        <Button variant="contained" color="success" disabled fullWidth>
          Find Matching Loads
        </Button>

        {/* Upcoming Load */}
        <SectionCard title="Upcoming Load">
          <Box sx={{ px: 1, py: 1 }}>
            <EmptyState title="No upcoming load" />
          </Box>
        </SectionCard>

        {/* Preferences Snapshot */}
        <SectionCard
          title={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.6875rem',
                  color: 'text.disabled',
                }}
              >
                Preferences Snapshot
              </Typography>
              <Button
                size="small"
                onClick={onEditPreferences}
                sx={{ minWidth: 'auto', fontSize: '0.7rem' }}
              >
                Edit
              </Button>
            </Box>
          }
        >
          <Box sx={{ px: 1, py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              Preferred Lanes
            </Typography>
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
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', mb: 1.5, display: 'block' }}
              >
                None set
              </Typography>
            )}

            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              No-Go Zones
            </Typography>
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
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', mb: 1.5, display: 'block' }}
              >
                None set
              </Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Max Days Out
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {d.maxDaysOut ?? '\u2014'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Home Base
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatLocation(d.homeBaseCity, d.homeBaseState)}
              </Typography>
            </Box>
          </Box>
        </SectionCard>
      </Stack>
    </Grid>
  </Grid>
);
