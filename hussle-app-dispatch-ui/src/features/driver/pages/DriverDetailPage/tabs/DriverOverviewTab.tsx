import { Box, Button, Card, Chip, Grid, Stack, Typography } from '@mui/material';

import { EmptyState } from '@mocho/ui/components';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import type { Driver } from 'features/carrier/types';
import { FieldRow } from 'features/carrier/components/FieldRow';
import { EditableSectionHeader } from 'features/carrier/components/EditableSectionHeader';

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
      <Card>
        <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <EditableSectionHeader title="Driver Information" onEdit={onEditInfo} />
        </Box>
        <Box sx={{ px: 3, py: 2 }}>
          <FieldRow label="Full Name" value={getDriverDisplayName(d)} />
          <FieldRow label="Phone" value={d.phone} />
          <FieldRow label="Email" value={d.email} isLink />
          <FieldRow label="CDL Number" value={d.cdlNumber} />
          <FieldRow label="CDL State" value={d.cdlState} />
          <FieldRow label="CDL Expiry" value={d.cdlExpiry} />
          <FieldRow label="Carrier" value={d.carrierName} />
          <FieldRow label="Vehicle" value={'\u2014'} />
          <FieldRow label="Home Base" value={formatLocation(d.homeBaseCity, d.homeBaseState)} />
          <FieldRow
            label="Dispatch Fee"
            value={d.dispatchFeePercent !== null ? `${d.dispatchFeePercent}%` : '\u2014'}
          />
        </Box>
      </Card>
    </Grid>

    {/* Center Column -- Performance + Weekly Gross */}
    <Grid item xs={5}>
      <Stack spacing={2}>
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
        </Card>

        <Card>
          <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
            >
              Weekly Gross History
            </Typography>
          </Box>
          <Box sx={{ px: 3, py: 4 }}>
            <EmptyState title="No load history data available" />
          </Box>
        </Card>
      </Stack>
    </Grid>

    {/* Right Column -- Status, Matching, Upcoming, Preferences */}
    <Grid item xs={3}>
      <Stack spacing={2}>
        {/* Status & Location */}
        <Card>
          <Box sx={{ px: 2.5, py: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
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
        </Card>

        {/* Find Matching Loads */}
        <Button variant="contained" color="success" disabled fullWidth>
          Find Matching Loads
        </Button>

        {/* Upcoming Load */}
        <Card>
          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.6875rem',
                color: 'text.disabled',
                mb: 1.5,
              }}
            >
              Upcoming Load
            </Typography>
            <EmptyState title="No upcoming load" />
          </Box>
        </Card>

        {/* Preferences Snapshot */}
        <Card>
          <Box sx={{ px: 2.5, py: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
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
        </Card>
      </Stack>
    </Grid>
  </Grid>
);
