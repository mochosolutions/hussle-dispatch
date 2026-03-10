import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { MainCard } from '@mocho/ui/components';
import { useDispatch } from 'store';
import type { VehicleExpense } from 'features/carrier/types';
import { EditableSectionHeader } from 'features/carrier/components/EditableSectionHeader';
import { FieldRow } from 'features/carrier/components/FieldRow';
import {
  updateVehicleRequest,
  assignDriverRequest,
  unassignDriverRequest,
} from '../../../store/reducers';
import { VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../../constants';

interface WeeklyGross {
  week: string;
  amount: number;
}

interface CarrierDriver {
  id: string;
  firstName: string;
  lastName: string;
}

interface VehicleOverviewTabProps {
  vehicle: {
    id: string;
    unitNumber: string;
    vin: string | null;
    licensePlate: string | null;
    licensePlateState: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
    ownership: 'OWNED' | 'LEASED';
    type: keyof typeof VEHICLE_TYPE_LABELS;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    warrantyInfo: string | null;
    driverId: string | null;
    driverName: string | null;
    carrierName: string | null;
    carrierType: string | null;
    monthlyMilesTarget: number | null;
    workingDaysPerMonth: number | null;
    expenses: VehicleExpense[];
  };
  carrierDrivers: CarrierDriver[];
  onOpenInfoDrawer: () => void;
}

const WEEKLY_GROSS_DATA: WeeklyGross[] = [
  { week: 'Jan 20', amount: 4200 },
  { week: 'Jan 27', amount: 5100 },
  { week: 'Feb 3', amount: 3800 },
  { week: 'Feb 10', amount: 5400 },
  { week: 'Feb 17', amount: 4700 },
  { week: 'Feb 24', amount: 3900 },
];

const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const parseNumber = (value: string): number => {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const VehicleOverviewTab: React.FC<VehicleOverviewTabProps> = ({
  vehicle: v,
  carrierDrivers,
  onOpenInfoDrawer,
}) => {
  const dispatch = useDispatch();

  // CPM inline editor state
  const [targetMiles, setTargetMiles] = useState(v.monthlyMilesTarget ?? 10000);
  const [workingDays, setWorkingDays] = useState(v.workingDaysPerMonth ?? 22);
  const [expenses, setExpenses] = useState<Record<string, number>>(() => {
    const expenseMap: Record<string, number> = {};
    v.expenses.forEach((exp) => {
      expenseMap[exp.expenseKey] = parseFloat(exp.monthlyAmount);
    });
    return expenseMap;
  });
  const [isSaved, setIsSaved] = useState(false);

  // Driver assignment state
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, VehicleExpense[]> = {
      FIXED: [],
      VARIABLE: [],
      SERVICE: [],
    };
    v.expenses.forEach((exp) => {
      const cat = exp.category;
      if (grouped[cat]) {
        grouped[cat].push(exp);
      }
    });
    return grouped;
  }, [v.expenses]);

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

    return { totalFixed, totalVariable, totalService, monthlyTotal, cpm, dailyMin, weeklyMin, minBookRate };
  }, [expenses, expensesByCategory, targetMiles, workingDays]);

  const categorySections = useMemo(
    () =>
      [
        { key: 'FIXED', label: 'Fixed Costs (monthly)', total: totals.totalFixed },
        { key: 'VARIABLE', label: 'Variable Costs (monthly)', total: totals.totalVariable },
        { key: 'SERVICE', label: 'Service / Wage', total: totals.totalService },
      ] as const,
    [totals.totalFixed, totals.totalVariable, totals.totalService],
  );

  const revenueAverage = useMemo(
    () =>
      Math.round(
        WEEKLY_GROSS_DATA.reduce((sum, item) => sum + item.amount, 0) / WEEKLY_GROSS_DATA.length,
      ),
    [],
  );

  const maxWeeklyValue = useMemo(
    () => Math.max(...WEEKLY_GROSS_DATA.map((item) => item.amount), 5000) * 1.15,
    [],
  );

  const handleExpenseChange = useCallback((key: string, value: number) => {
    setExpenses((previous) => ({ ...previous, [key]: value }));
    setIsSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    const expenseUpdates = v.expenses.map((exp) => ({
      category: exp.category,
      expenseKey: exp.expenseKey,
      label: exp.label,
      monthlyAmount: expenses[exp.expenseKey] ?? 0,
    }));
    dispatch(updateVehicleRequest({ id: v.id, data: { expenses: expenseUpdates } }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [dispatch, expenses, v.id, v.expenses]);

  const handleAssignDriver = useCallback(() => {
    if (selectedDriverId) {
      dispatch(assignDriverRequest({ vehicleId: v.id, driverId: selectedDriverId }));
      setSelectedDriverId('');
    }
  }, [dispatch, v.id, selectedDriverId]);

  const handleUnassignDriver = useCallback(() => {
    dispatch(unassignDriverRequest({ vehicleId: v.id }));
  }, [dispatch, v.id]);

  return (
    <Grid container spacing={{ xs: 2, lg: 2.5 }} alignItems="flex-start">
      {/* Left Column */}
      <Grid item xs={12} lg={9}>
        <Stack spacing={2}>
          {/* Vehicle Information Card */}
          <Card>
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <EditableSectionHeader title="Vehicle Information" onEdit={onOpenInfoDrawer} />
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
                    value={`${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`.trim() || null}
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
                {v.emergencyContactName && v.emergencyContactPhone ? ' \u2014 ' : ''}
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
                sx={{
                  mb: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
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
                          handleExpenseChange(item.expenseKey, parseNumber(event.target.value));
                        }}
                        sx={{ width: { xs: '100%', sm: 140 } }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
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
              sx={{
                mb: 2,
                mt: 1,
                pt: 1,
                borderTop: 2,
                borderColor: 'divider',
              }}
            >
              <Typography variant="h5">Monthly Total</Typography>
              <Typography variant="h4">{currencyCompact.format(totals.monthlyTotal)}</Typography>
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

            {/* Guards */}
            {targetMiles === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Set miles target to calculate CPM. Division by zero is prevented.
              </Alert>
            )}
            {workingDays === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Set working days to calculate daily minimum revenue.
              </Alert>
            )}

            {/* Computed values */}
            <MainCard
              sx={{
                bgcolor: 'primary.lighter',
                borderColor: 'primary.light',
                mb: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{ textTransform: 'uppercase', color: 'primary.main' }}
              >
                Calculated &mdash; Auto-computed
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
              {WEEKLY_GROSS_DATA.map((item) => {
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

            <Box
              sx={{
                mt: 1.5,
                p: 1.25,
                borderRadius: 1,
                bgcolor: 'grey.100',
              }}
            >
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
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: v.driverName ? 'primary.main' : 'primary.lighter',
                  color: v.driverName ? 'white' : 'primary.main',
                }}
              >
                {v.driverName
                  ? v.driverName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                  : '--'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">{v.driverName ?? 'Unassigned'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {v.driverName ? 'Currently assigned' : 'No driver assigned'}
                </Typography>
              </Box>
              {v.driverId && (
                <IconButton
                  aria-label="Unassign driver"
                  size="small"
                  color="error"
                  onClick={handleUnassignDriver}
                  sx={{ ml: 'auto' }}
                >
                  <PersonRemoveIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>

            {/* Assign Driver */}
            {!v.driverId && (
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Select Driver"
                  value={selectedDriverId}
                  onChange={(event) => setSelectedDriverId(event.target.value)}
                >
                  {carrierDrivers.length === 0 && (
                    <MenuItem disabled value="">
                      No drivers available
                    </MenuItem>
                  )}
                  {carrierDrivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  size="small"
                  disabled={!selectedDriverId}
                  onClick={handleAssignDriver}
                  sx={{ minWidth: 80 }}
                >
                  Assign
                </Button>
              </Stack>
            )}

            <Stack spacing={1.25}>
              {[
                {
                  label: 'Status',
                  value: v.driverId ? 'Assigned' : 'Available',
                  color: 'success.main',
                },
                { label: 'Location', value: '\u2014' },
                { label: 'Hours Available', value: '\u2014' },
                { label: 'Days Out', value: '\u2014' },
                { label: 'Last Delivered', value: '\u2014' },
              ].map((row) => (
                <Stack
                  key={row.label}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    pb: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
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
            sx={{
              bgcolor: 'primary.lighter',
              borderColor: 'primary.light',
            }}
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
  );
};
