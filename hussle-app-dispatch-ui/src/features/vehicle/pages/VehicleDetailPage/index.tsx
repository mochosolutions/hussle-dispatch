import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import { EmptyState, DataGuard, MainCard, PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import type { VehicleExpense } from 'features/carrier/types';
import { fetchVehicleDetailsRequest, updateVehicleRequest } from '../../store/reducers';
import {
  selectVehicleWithCarrier,
  selectVehicleDetailLoading,
} from '../../store/selectors/vehicleSelectors';
import { VEHICLE_TABS, VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';
import { EditableSectionHeader } from 'features/carrier/components/EditableSectionHeader';
import { FieldRow } from 'features/carrier/components/FieldRow';

interface WeeklyGross {
  week: string;
  amount: number;
}

const weeklyGrossData: WeeklyGross[] = [
  { week: 'Jan 20', amount: 4200 },
  { week: 'Jan 27', amount: 5100 },
  { week: 'Feb 3', amount: 3800 },
  { week: 'Feb 10', amount: 5400 },
  { week: 'Feb 17', amount: 4700 },
  { week: 'Feb 24', amount: 3900 },
];

const parseNumber = (value: string): number => {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const VehicleDetailPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const vehicle = useSelector(selectVehicleWithCarrier(id ?? ''));
  const isLoading = useSelector(selectVehicleDetailLoading(id ?? ''));

  const [activeTab, setActiveTab] = useState('overview');
  const [_infoDrawerOpen, setInfoDrawerOpen] = useState(false);

  const [targetMiles, setTargetMiles] = useState(10000);
  const [workingDays, setWorkingDays] = useState(22);
  const [expenses, setExpenses] = useState<Record<string, number>>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchVehicleDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  // Initialize expense state from vehicle data
  useEffect(() => {
    if (vehicle) {
      const expenseMap: Record<string, number> = {};
      vehicle.expenses.forEach((exp) => {
        expenseMap[exp.expenseKey] = parseFloat(exp.monthlyAmount);
      });
      setExpenses(expenseMap);
      if (vehicle.monthlyMilesTarget) {
        setTargetMiles(vehicle.monthlyMilesTarget);
      }
      if (vehicle.workingDaysPerMonth) {
        setWorkingDays(vehicle.workingDaysPerMonth);
      }
    }
    // Only re-init when vehicle identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id]);

  const expensesByCategory = useMemo(() => {
    if (!vehicle) {
      return { FIXED: [] as VehicleExpense[], VARIABLE: [] as VehicleExpense[], SERVICE: [] as VehicleExpense[] };
    }
    const grouped: Record<string, VehicleExpense[]> = { FIXED: [], VARIABLE: [], SERVICE: [] };
    vehicle.expenses.forEach((exp) => {
      const cat = exp.category;
      if (grouped[cat]) {
        grouped[cat].push(exp);
      }
    });
    return grouped;
  }, [vehicle]);

  const totals = useMemo(() => {
    const sumCategory = (items: VehicleExpense[]) =>
      items.reduce((sum, item) => sum + (expenses[item.expenseKey] ?? 0), 0);

    const totalFixed = sumCategory(expensesByCategory.FIXED);
    const totalVariable = sumCategory(expensesByCategory.VARIABLE);
    const totalService = sumCategory(expensesByCategory.SERVICE);
    const monthlyTotal = totalFixed + totalVariable + totalService;
    const cpm = targetMiles > 0 ? monthlyTotal / targetMiles : 0;
    const dailyMin = workingDays > 0 ? monthlyTotal / workingDays : 0;
    const weeklyMin = dailyMin * (workingDays > 0 ? Math.min(workingDays / 4.33, 7) : 5);
    const minBookRate = Math.round(cpm * 1000 * 1.15);

    return {
      totalFixed,
      totalVariable,
      totalService,
      monthlyTotal,
      cpm,
      dailyMin,
      weeklyMin,
      minBookRate,
    };
  }, [expenses, expensesByCategory, targetMiles, workingDays]);

  const revenueAverage = useMemo(
    () =>
      Math.round(
        weeklyGrossData.reduce((sum, item) => sum + item.amount, 0) / weeklyGrossData.length,
      ),
    [],
  );

  const maxWeeklyValue = useMemo(
    () => Math.max(...weeklyGrossData.map((item) => item.amount), 5000) * 1.15,
    [],
  );

  const handleExpenseChange = useCallback((key: string, value: number) => {
    setExpenses((previous) => ({
      ...previous,
      [key]: value,
    }));
    setIsSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    if (id && vehicle) {
      const expenseUpdates = vehicle.expenses.map((exp) => ({
        category: exp.category,
        expenseKey: exp.expenseKey,
        label: exp.label,
        monthlyAmount: expenses[exp.expenseKey] ?? 0,
      }));
      dispatch(updateVehicleRequest({ id, data: { expenses: expenseUpdates } }));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  }, [dispatch, expenses, id, vehicle]);

  const subtitle = vehicle
    ? `${vehicle.year ?? ''} ${vehicle.make ?? ''} ${vehicle.model ?? ''} - VIN: ${vehicle.vin ?? '—'}`.trim()
    : '';

  const categorySections = useMemo(
    () =>
      [
        { key: 'FIXED', label: 'Fixed Costs (monthly)', total: totals.totalFixed },
        { key: 'VARIABLE', label: 'Variable Costs (monthly)', total: totals.totalVariable },
        { key: 'SERVICE', label: 'Service / Wage', total: totals.totalService },
      ] as const,
    [totals.totalFixed, totals.totalVariable, totals.totalService],
  );

  return (
    <PageWrapper isLoading={isLoading} errorContext="VehicleDetailPage">
      <DataGuard
        data={vehicle}
        emptyComponent={<Typography p={4}>Vehicle not found.</Typography>}
      >
        {(v) => (
          <>
            {/* Header */}
            <Box
              sx={{
                backgroundColor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                px: { xs: 2, sm: 3 },
                py: 1.75,
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                spacing={1.5}
              >
                <Stack spacing={0.75}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    useFlexGap
                    sx={{ flexWrap: 'wrap' }}
                  >
                    <Button
                      variant="text"
                      color="inherit"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => navigate('/vehicles')}
                      sx={{ minWidth: 0, px: 0, color: 'text.secondary' }}
                    >
                      Vehicles
                    </Button>
                    <Typography variant="h4" color="text.primary">
                      {v.unitNumber}
                    </Typography>
                    {v.carrierName && (
                      <Chip
                        label={v.carrierName}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {v.carrierType && (
                      <Chip
                        label={v.carrierType}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    justifyContent: { xs: 'flex-start', md: 'flex-end' },
                  }}
                >
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<EditIcon />}
                    onClick={() => setInfoDrawerOpen(true)}
                  >
                    Edit
                  </Button>
                </Stack>
              </Stack>
            </Box>

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
                    value: `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`.trim() || '—',
                  },
                  { label: 'Equipment', value: VEHICLE_TYPE_LABELS[v.type] },
                  { label: 'Ownership', value: OWNERSHIP_LABELS[v.ownership], owned: v.ownership === 'OWNED' },
                  { label: 'Driver', value: '—' },
                  { label: 'CPM', value: `$${totals.cpm.toFixed(2)}/mi`, bold: true },
                  {
                    label: 'Monthly Cost',
                    value: currencyCompact.format(totals.monthlyTotal),
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
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
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
                    label={
                      <Typography variant="body2">{tab.label}</Typography>
                    }
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
                <Grid container spacing={{ xs: 2, lg: 2.5 }} alignItems="flex-start">
                  {/* Left Column */}
                  <Grid item xs={12} lg={9}>
                    <Stack spacing={2}>
                      {/* Vehicle Information Card */}
                      <Card>
                        <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
                          <EditableSectionHeader
                            title="Vehicle Information"
                            onEdit={() => setInfoDrawerOpen(true)}
                          />
                        </Box>
                        <Box sx={{ px: 3, py: 2 }}>
                          <Grid container>
                            <Grid item xs={6}>
                              <FieldRow label="Unit #" value={v.unitNumber} />
                              <FieldRow label="VIN" value={v.vin} />
                              <FieldRow
                                label="License Plate"
                                value={
                                  v.licensePlate
                                    ? `${v.licensePlateState ? `${v.licensePlateState} ` : ''}${v.licensePlate}`
                                    : null
                                }
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <FieldRow
                                label="Year/Make/Model"
                                value={
                                  `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`.trim() || null
                                }
                              />
                              <FieldRow label="Ownership" value={OWNERSHIP_LABELS[v.ownership]} />
                              <FieldRow label="Equipment Type" value={VEHICLE_TYPE_LABELS[v.type]} />
                            </Grid>
                          </Grid>
                        </Box>
                      </Card>

                      {/* Emergency / Roadside */}
                      {(v.emergencyContactName ?? v.emergencyContactPhone) && (
                        <Alert severity="success" sx={{ alignItems: 'flex-start' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Emergency / Roadside Contact
                          </Typography>
                          <Typography variant="body2">
                            {v.emergencyContactName}
                            {v.emergencyContactName && v.emergencyContactPhone ? ' — ' : ''}
                            {v.emergencyContactPhone}
                          </Typography>
                        </Alert>
                      )}

                      {/* Warranty / Notes */}
                      {v.warrantyInfo && (
                        <Card sx={{ px: 3, py: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Warranty / Notes
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {v.warrantyInfo}
                          </Typography>
                        </Card>
                      )}

                      {/* CPM Expense Editor */}
                      <MainCard sx={{ height: '100%' }}>
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'flex-start', md: 'center' }}
                          sx={{ mb: 2 }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="h5">CPM Expense Editor</Typography>
                            <Chip label="KEY FEATURE" color="primary" size="small" />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Drives min book rates
                          </Typography>
                        </Stack>

                        {categorySections.map((section) => (
                          <Box
                            key={section.key}
                            sx={{ mb: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}
                          >
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              justifyContent="space-between"
                              alignItems={{ xs: 'flex-start', sm: 'center' }}
                              sx={{
                                px: 1.5,
                                py: 1,
                                borderBottom: 1,
                                borderColor: 'divider',
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ textTransform: 'uppercase' }}
                              >
                                {section.label}
                              </Typography>
                              <Typography variant="subtitle2">
                                {currencyCompact.format(section.total)}
                              </Typography>
                            </Stack>

                            <Stack>
                              {expensesByCategory[section.key].map((item) => (
                                <Stack
                                  key={item.expenseKey}
                                  direction={{ xs: 'column', sm: 'row' }}
                                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                                  justifyContent="space-between"
                                  spacing={1}
                                  sx={{
                                    px: 1.5,
                                    py: 1,
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    '&:last-of-type': { borderBottom: 0 },
                                  }}
                                >
                                  <Stack direction="row" spacing={0.75} alignItems="center">
                                    <Typography variant="body2">{item.label}</Typography>
                                  </Stack>
                                  <TextField
                                    size="small"
                                    value={(expenses[item.expenseKey] ?? 0).toLocaleString()}
                                    onChange={(event) => {
                                      handleExpenseChange(
                                        item.expenseKey,
                                        parseNumber(event.target.value),
                                      );
                                    }}
                                    sx={{ width: { xs: '100%', sm: 140 } }}
                                    InputProps={{
                                      startAdornment: (
                                        <Typography sx={{ mr: 1 }}>$</Typography>
                                      ),
                                      inputProps: {
                                        style: {
                                          textAlign: 'right',
                                          fontWeight: 600,
                                        },
                                      },
                                    }}
                                  />
                                </Stack>
                              ))}
                            </Stack>
                          </Box>
                        ))}

                        {/* Monthly Total */}
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          justifyContent="space-between"
                          spacing={1}
                          sx={{ mb: 2, mt: 1, pt: 1, borderTop: 2, borderColor: 'divider' }}
                        >
                          <Typography variant="h5">Monthly Total</Typography>
                          <Typography variant="h4">
                            {currencyCompact.format(totals.monthlyTotal)}
                          </Typography>
                        </Stack>

                        {/* Target inputs */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Target Miles / Month"
                              size="small"
                              fullWidth
                              value={targetMiles.toLocaleString()}
                              onChange={(event) => {
                                setTargetMiles(parseNumber(event.target.value));
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Working Days / Month"
                              size="small"
                              fullWidth
                              value={String(workingDays)}
                              onChange={(event) => {
                                setWorkingDays(parseNumber(event.target.value));
                              }}
                            />
                          </Grid>
                        </Grid>

                        {/* Computed values */}
                        <MainCard
                          sx={{ bgcolor: 'primary.lighter', borderColor: 'primary.light', mb: 2 }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ textTransform: 'uppercase', color: 'primary.main' }}
                          >
                            Calculated — Auto-computed
                          </Typography>
                          <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="text.secondary">
                                Cost Per Mile
                              </Typography>
                              <Typography variant="h4">${totals.cpm.toFixed(2)}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="text.secondary">
                                Daily Min Revenue
                              </Typography>
                              <Typography variant="h4">${totals.dailyMin.toFixed(2)}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="text.secondary">
                                Weekly Min Revenue
                              </Typography>
                              <Typography variant="h4">${totals.weeklyMin.toFixed(2)}</Typography>
                            </Grid>
                          </Grid>
                        </MainCard>

                        {/* Save button */}
                        <Stack direction="row" justifyContent="flex-end">
                          <Button
                            variant="contained"
                            startIcon={isSaved ? undefined : <SaveOutlined />}
                            color={isSaved ? 'success' : 'primary'}
                            onClick={handleSave}
                          >
                            {isSaved ? 'Saved' : 'Save Expenses'}
                          </Button>
                        </Stack>
                      </MainCard>
                    </Stack>
                  </Grid>

                  {/* Right Column */}
                  <Grid item xs={12} lg={3}>
                    <Stack spacing={2}>
                      {/* Revenue Performance */}
                      <MainCard>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 1.5 }}
                        >
                          <Typography variant="h5">Revenue Performance</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last 6 weeks
                          </Typography>
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="flex-end"
                          sx={{
                            height: 118,
                            borderBottom: 1,
                            borderColor: 'divider',
                            pb: 1,
                          }}
                        >
                          {weeklyGrossData.map((item) => {
                            const height = (item.amount / maxWeeklyValue) * 100;
                            const isAboveTarget = item.amount >= 5000;

                            return (
                              <Box key={item.week} sx={{ flex: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    textAlign: 'center',
                                    color: isAboveTarget ? 'success.main' : 'warning.main',
                                    mb: 0.5,
                                  }}
                                >
                                  ${(item.amount / 1000).toFixed(1)}K
                                </Typography>
                                <Box
                                  sx={{
                                    borderRadius: 1,
                                    width: '100%',
                                    height: `${Math.max(height, 4)}%`,
                                    bgcolor: isAboveTarget ? 'success.main' : 'warning.main',
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', mt: 0.5 }}
                                >
                                  {item.week}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Stack>

                        <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1, bgcolor: 'grey.100' }}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              6-week avg:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {currencyCompact.format(revenueAverage)}
                            </Typography>
                          </Stack>
                        </Box>
                      </MainCard>

                      {/* Current Assignment */}
                      <MainCard>
                        <Typography variant="h5" sx={{ mb: 2 }}>
                          Current Assignment
                        </Typography>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                          sx={{ mb: 1.5 }}
                        >
                          <Avatar
                            sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}
                          >
                            --
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1">Unassigned</Typography>
                            <Typography variant="caption" color="text.secondary">
                              No driver assigned
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack spacing={1.25}>
                          {[
                            { label: 'Status', value: 'Available', color: 'success.main' },
                            { label: 'Location', value: '—' },
                            { label: 'Hours Available', value: '—' },
                            { label: 'Days Out', value: '—' },
                            { label: 'Last Delivered', value: '—' },
                          ].map((row) => (
                            <Stack
                              key={row.label}
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                {row.label}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'color' in row ? row.color : 'text.primary',
                                  fontWeight: 600,
                                }}
                              >
                                {row.value}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>

                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<SearchOutlined />}
                          sx={{ mt: 1.5 }}
                        >
                          Find Matching Loads
                        </Button>
                      </MainCard>

                      {/* Min Book Rate */}
                      <MainCard
                        sx={{ bgcolor: 'primary.lighter', borderColor: 'primary.light' }}
                      >
                        <Typography variant="h5">Min Book Rate</Typography>
                        <Typography variant="h2" sx={{ mt: 1 }}>
                          {currencyCompact.format(totals.minBookRate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          ${totals.cpm.toFixed(2)} CPM + 15% margin
                        </Typography>
                        <Alert severity="info" sx={{ mt: 1.5 }}>
                          Used in Load Intelligence scoring to filter out unprofitable loads.
                        </Alert>
                      </MainCard>
                    </Stack>
                  </Grid>
                </Grid>
              )}

              {activeTab === 'load-history' && (
                <MainCard>
                  <EmptyState
                    title="Load history coming soon"
                    message="This section will be wired to API data in the next iteration."
                  />
                </MainCard>
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
          </>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default VehicleDetailPage;
