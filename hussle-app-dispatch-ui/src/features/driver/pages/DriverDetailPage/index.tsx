import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';

import { EmptyState, DataGuard, PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import { fetchDriverDetailsRequest } from '../../store/reducers';
import {
  selectDriverWithCarrier,
  selectDriverDetailLoading,
} from '../../store/selectors/driverSelectors';
import { DRIVER_TABS } from '../../constants';
import { FieldRow } from 'features/carrier/components/FieldRow';
import { EditableSectionHeader } from 'features/carrier/components/EditableSectionHeader';

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

const formatLocation = (city: string | null, state: string | null): string => {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return '\u2014';
};

const DriverDetailPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const driver = useSelector(selectDriverWithCarrier(id ?? ''));
  const isLoading = useSelector(selectDriverDetailLoading(id ?? ''));
  const [activeTab, setActiveTab] = useState('overview');
  const [_infoDrawerOpen, setInfoDrawerOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchDriverDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  const kpiItems = [
    {
      label: 'LOCATION',
      value: driver ? formatLocation(driver.currentCity, driver.currentState) : '\u2014',
    },
    { label: 'VEHICLE', value: '\u2014' },
    {
      label: 'HOURS AVAILABLE',
      value: driver?.availableHours ? `${driver.availableHours}h` : '\u2014',
    },
    { label: 'DAYS OUT', value: '\u2014' },
    { label: 'WEEKLY GROSS', value: '\u2014' },
    { label: 'LAST DELIVERED', value: '\u2014' },
  ];

  const renderOverviewTab = (d: NonNullable<typeof driver>) => (
    <Grid container spacing={2.5} sx={{ p: 3, maxWidth: 1200 }}>
      {/* Left Column — Driver Information */}
      <Grid item xs={4}>
        <Card>
          <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <EditableSectionHeader
              title="Driver Information"
              onEdit={() => setInfoDrawerOpen(true)}
            />
          </Box>
          <Box sx={{ px: 3, py: 2 }}>
            <FieldRow label="Full Name" value={d.name} />
            <FieldRow label="Phone" value={d.phone} />
            <FieldRow label="Email" value={d.email} isLink />
            <FieldRow label="CDL Number" value={d.cdlNumber} />
            <FieldRow label="CDL State" value={d.cdlState} />
            <FieldRow label="CDL Expiry" value={d.cdlExpiry} />
            <FieldRow label="Carrier" value={d.carrierName} />
            <FieldRow label="Vehicle" value={'\u2014'} />
            <FieldRow
              label="Home Base"
              value={formatLocation(d.homeBaseCity, d.homeBaseState)}
            />
            <FieldRow
              label="Dispatch Fee"
              value={d.dispatchFeePercent !== null ? `${d.dispatchFeePercent}%` : '\u2014'}
            />
          </Box>
        </Card>
      </Grid>

      {/* Center Column — Performance + Weekly Gross */}
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

      {/* Right Column — Status, Matching, Upcoming, Preferences */}
      <Grid item xs={3}>
        <Stack spacing={2}>
          {/* Status & Location */}
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
                Status & Location
              </Typography>
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
                Preferences Snapshot
              </Typography>

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
                <Typography variant="caption" sx={{ color: 'text.disabled', mb: 1.5, display: 'block' }}>
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
                <Typography variant="caption" sx={{ color: 'text.disabled', mb: 1.5, display: 'block' }}>
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

  const renderPreferencesTab = (d: NonNullable<typeof driver>) => (
    <Box sx={{ p: 3, maxWidth: 1200 }}>
      <Stack spacing={2.5}>
        {/* Preferred Lanes */}
        <Card>
          <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
            >
              Preferred Lanes
            </Typography>
          </Box>
          <Box sx={{ px: 3, py: 2 }}>
            {d.preferredLanes.length > 0 ? (
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr">
                    {['Origin', 'Destination'].map((header) => (
                      <Box
                        component="th"
                        key={header}
                        sx={{
                          textAlign: 'left',
                          py: 1,
                          px: 1.5,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {header}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {d.preferredLanes.map((lane, i) => (
                    <Box component="tr" key={`lane-row-${String(i)}`}>
                      <Box component="td" sx={{ py: 1, px: 1.5 }}>
                        <Typography variant="body2">
                          {lane.originCity ? `${lane.originCity}, ${lane.originState}` : lane.originState}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{ py: 1, px: 1.5 }}>
                        <Typography variant="body2">
                          {lane.destCity ? `${lane.destCity}, ${lane.destState}` : lane.destState}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <EmptyState title="No preferred lanes configured" />
            )}
          </Box>
        </Card>

        {/* No-Go Zones */}
        <Card>
          <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
            >
              No-Go Zones
            </Typography>
          </Box>
          <Box sx={{ px: 3, py: 2 }}>
            {d.noGoZones.length > 0 ? (
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr">
                    {['State', 'City'].map((header) => (
                      <Box
                        component="th"
                        key={header}
                        sx={{
                          textAlign: 'left',
                          py: 1,
                          px: 1.5,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {header}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {d.noGoZones.map((zone, i) => (
                    <Box component="tr" key={`zone-row-${String(i)}`}>
                      <Box component="td" sx={{ py: 1, px: 1.5 }}>
                        <Typography variant="body2">{zone.state}</Typography>
                      </Box>
                      <Box component="td" sx={{ py: 1, px: 1.5 }}>
                        <Typography variant="body2">{zone.city ?? '\u2014'}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <EmptyState title="No no-go zones configured" />
            )}
          </Box>
        </Card>

        {/* Max Days Out */}
        <Card>
          <Box sx={{ px: 3, py: 2 }}>
            <FieldRow label="Max Days Out" value={d.maxDaysOut ?? '\u2014'} />
          </Box>
        </Card>
      </Stack>
    </Box>
  );

  return (
    <PageWrapper isLoading={isLoading}>
      <DataGuard
        data={driver}
        emptyComponent={<Typography sx={{ p: 4 }}>Driver not found.</Typography>}
      >
        {(d) => (
          <>
            {/* Header */}
            <Box
              sx={{
                px: 4,
                pt: 2,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => {
                      navigate('/drivers');
                    }}
                    size="small"
                    sx={{ color: 'primary.main' }}
                  >
                    Drivers
                  </Button>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'primary.light',
                      color: 'primary.main',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {getInitials(d.name)}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="h5">{d.name}</Typography>
                      <Chip
                        label={d.isAvailable ? 'Available' : 'Unavailable'}
                        size="small"
                        color={d.isAvailable ? 'success' : 'default'}
                        sx={{ height: 22, fontSize: '0.75rem' }}
                      />
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      {d.carrierName && (
                        <Chip
                          label={d.carrierName}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      {d.carrierType && (
                        <Chip
                          label={d.carrierType}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setInfoDrawerOpen(true)}
                >
                  Edit
                </Button>
              </Box>

              {/* KPI Strip */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'grey.50',
                }}
              >
                {kpiItems.map((kpi, i) => (
                  <Box
                    key={kpi.label}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderRight: i < 5 ? 1 : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: 'text.disabled',
                        fontSize: '0.625rem',
                      }}
                    >
                      {kpi.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {kpi.value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Tabs */}
              <Box sx={{ mt: 1 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_event, value: string) => setActiveTab(value)}
                  variant="scrollable"
                  allowScrollButtonsMobile
                  sx={{ minHeight: 44 }}
                >
                  {DRIVER_TABS.map((tab) => (
                    <Tab
                      key={tab.value}
                      value={tab.value}
                      label={tab.label}
                      sx={{ minHeight: 44 }}
                    />
                  ))}
                </Tabs>
              </Box>
            </Box>

            {/* Tab Content */}
            {activeTab === 'overview' && renderOverviewTab(d)}
            {activeTab === 'load-history' && (
              <Box sx={{ p: 3 }}>
                <EmptyState title="Load history coming soon" />
              </Box>
            )}
            {activeTab === 'preferences' && renderPreferencesTab(d)}
            {activeTab === 'documents' && (
              <Box sx={{ p: 3 }}>
                <EmptyState title="Documents coming soon" />
              </Box>
            )}
          </>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default DriverDetailPage;
