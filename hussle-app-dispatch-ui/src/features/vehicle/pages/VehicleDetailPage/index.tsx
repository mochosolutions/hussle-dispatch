import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Grid, Stack, Tab, Tabs, Typography } from '@mui/material';
import { EmptyState, DataGuard, MainCard, PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import {
  fetchVehicleDetailsRequest,
  updateVehicleRequest,
} from '../../store/reducers';
import {
  selectVehicleWithCarrier,
  selectVehicleDetailLoading,
  selectDriversByCarrierId,
} from '../../store/selectors/vehicleSelectors';
import { VEHICLE_TABS, VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';
import { MOCK_VEHICLE_LOADS } from '../../mockData';
import VehiclePageHeader from '../../components/VehiclePageHeader';
import { VehicleInfoDrawer } from '../../components/VehicleInfoDrawer';
import { VehicleExpenseDrawer } from '../../components/VehicleExpenseDrawer';
import { VehicleTargetsDrawer } from '../../components/VehicleTargetsDrawer';
import type { VehicleLoad } from 'utils/api/fleet/vehicleApi';
import { VehicleOverviewTab } from './tabs/VehicleOverviewTab';
import { VehicleExpenseTab } from './tabs/VehicleExpenseTab';
import { VehicleLoadHistoryTab } from './tabs/VehicleLoadHistoryTab';

const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const VehicleDetailPage = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const vehicle = useSelector(selectVehicleWithCarrier(id ?? ''));
  const isLoading = useSelector(selectVehicleDetailLoading(id ?? ''));
  const carrierDrivers = useSelector(selectDriversByCarrierId(vehicle?.carrierId ?? null));

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Drawer state
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [targetsDrawerOpen, setTargetsDrawerOpen] = useState(false);

  // Load history state (mock data until API is wired)
  const [vehicleLoads] = useState<VehicleLoad[]>(MOCK_VEHICLE_LOADS);

  useEffect(() => {
    if (id) {
      dispatch(fetchVehicleDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  // KPI strip computed values
  const kpiCpm = useMemo(() => {
    if (!vehicle) return 0;
    const monthlyTotal = vehicle.expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.monthlyAmount),
      0,
    );
    const target = vehicle.monthlyMilesTarget ?? 0;
    return target > 0 ? monthlyTotal / target : 0;
  }, [vehicle]);

  const kpiMonthlyTotal = useMemo(() => {
    if (!vehicle) return 0;
    return vehicle.expenses.reduce((sum, exp) => sum + parseFloat(exp.monthlyAmount), 0);
  }, [vehicle]);

  const handleDrawerSave = useCallback(
    (values: Record<string, unknown>) => {
      if (id) {
        dispatch(updateVehicleRequest({ id, data: values }));
      }
    },
    [dispatch, id],
  );

  const subtitle = vehicle
    ? `${vehicle.year ?? ''} ${vehicle.make ?? ''} ${vehicle.model ?? ''} - VIN: ${vehicle.vin ?? '\u2014'}`.trim()
    : '';

  return (
    <PageWrapper isLoading={isLoading} errorContext="VehicleDetailPage">
      <DataGuard
        data={vehicle}
        emptyComponent={<Typography p={4}>Vehicle not found.</Typography>}
      >
        {(v) => (
          <>
            {/* Header */}
            <VehiclePageHeader
              vehicle={v}
              subtitle={subtitle}
              carrierName={v.carrierName ?? undefined}
              carrierType={v.carrierType ?? undefined}
              onEdit={() => setInfoDrawerOpen(true)}
            />

            {/* KPI Strip */}
            <Box
              sx={{
                backgroundColor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                px: { xs: 2, sm: 3 },
                py: 1.25,
              }}
            >
              <Grid container sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {[
                  {
                    label: 'Type',
                    value:
                      `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`.trim() || '\u2014',
                  },
                  { label: 'Equipment', value: VEHICLE_TYPE_LABELS[v.type] },
                  {
                    label: 'Ownership',
                    value: OWNERSHIP_LABELS[v.ownership],
                    owned: v.ownership === 'OWNED',
                  },
                  { label: 'Driver', value: v.driverName ?? '\u2014' },
                  { label: 'CPM', value: `$${kpiCpm.toFixed(2)}/mi`, bold: true },
                  {
                    label: 'Monthly Cost',
                    value: currencyCompact.format(kpiMonthlyTotal),
                    bold: true,
                  },
                ].map((item, index) => (
                  <Grid
                    item
                    xs={12}
                    md={2}
                    key={item.label}
                    sx={{
                      px: 1.75,
                      py: 1,
                      borderRight: { md: index < 5 ? 1 : 0 },
                      borderBottom: { xs: 1, md: 0 },
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase' }}
                    >
                      {item.label}
                    </Typography>
                    {'owned' in item && item.owned ? (
                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        sx={{ mt: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: 'success.main' }}
                        >
                          {item.value}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          color: 'text.primary',
                          fontWeight: 'bold' in item && item.bold ? 700 : 500,
                        }}
                      >
                        {item.value}
                      </Typography>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Tabs */}
            <Box
              sx={{
                backgroundColor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                px: { xs: 2, sm: 3 },
                pt: 0.25,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_event, value: string) => setActiveTab(value)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{ minHeight: 44 }}
              >
                {VEHICLE_TABS.map((tab) => (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                    sx={{ minHeight: 44 }}
                    label={<Typography variant="body2">{tab.label}</Typography>}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Content Area */}
            <Box
              sx={{
                flex: 1,
                backgroundColor: 'background.default',
                px: { xs: 2, sm: 3 },
                py: 2,
              }}
            >
              {activeTab === 'overview' && (
                <VehicleOverviewTab
                  vehicle={v}
                  carrierDrivers={carrierDrivers}
                  onOpenInfoDrawer={() => setInfoDrawerOpen(true)}
                />
              )}

              {activeTab === 'expenses' && (
                <VehicleExpenseTab
                  vehicle={v}
                  onOpenTargetsDrawer={() => setTargetsDrawerOpen(true)}
                />
              )}

              {activeTab === 'load-history' && (
                <VehicleLoadHistoryTab vehicleLoads={vehicleLoads} />
              )}

              {activeTab === 'documents' && (
                <MainCard>
                  <EmptyState
                    title="Documents coming soon"
                    message="This section will be wired to API data in the next iteration."
                  />
                </MainCard>
              )}
            </Box>

            {/* Drawers */}
            {infoDrawerOpen && (
              <VehicleInfoDrawer
                open={infoDrawerOpen}
                onClose={() => setInfoDrawerOpen(false)}
                data={v}
                onSave={handleDrawerSave}
              />
            )}
            {expenseDrawerOpen && (
              <VehicleExpenseDrawer
                open={expenseDrawerOpen}
                onClose={() => setExpenseDrawerOpen(false)}
                data={v}
                onSave={handleDrawerSave}
              />
            )}
            {targetsDrawerOpen && (
              <VehicleTargetsDrawer
                open={targetsDrawerOpen}
                onClose={() => setTargetsDrawerOpen(false)}
                data={v}
                onSave={handleDrawerSave}
              />
            )}
          </>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default VehicleDetailPage;
