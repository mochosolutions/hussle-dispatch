import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SectionCard from 'components/SectionCard';
import { DetailRow } from 'components/Typography';
import { useDispatch } from 'store';
import type { VehicleExpense } from 'features/carrier/types';
import EditIcon from '@mui/icons-material/Edit';
import { FieldRow } from 'components/FieldRow';
import {
  assignDriverRequest,
  unassignDriverRequest,
} from '../../store/reducers';
import { VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';

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

const WEEKLY_GROSS_DATA: WeeklyGross[] = [];

const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const VehicleOverviewTab: React.FC<VehicleOverviewTabProps> = ({
  vehicle: v,
  carrierDrivers,
  onOpenInfoDrawer,
}) => {
  const dispatch = useDispatch();

  // Driver assignment state
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const costSummary = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    v.expenses.forEach((exp) => {
      expenseMap[exp.expenseKey] = parseFloat(exp.monthlyAmount);
    });

    const monthlyTotal = v.expenses.reduce(
      (sum, exp) => sum + (expenseMap[exp.expenseKey] ?? 0),
      0,
    );
    const targetMiles = v.monthlyMilesTarget ?? 0;
    const workingDays = v.workingDaysPerMonth ?? 0;
    const cpm = targetMiles > 0 ? monthlyTotal / targetMiles : 0;
    const dailyMin = workingDays > 0 ? monthlyTotal / workingDays : 0;
    const weeklyMin = dailyMin * (workingDays > 0 ? Math.min(workingDays / 4.33, 7) : 5);
    const minBookRate = Math.round(cpm * 1000 * 1.15);

    return { monthlyTotal, cpm, dailyMin, weeklyMin, minBookRate };
  }, [v.expenses, v.monthlyMilesTarget, v.workingDaysPerMonth]);

  const hasExpenseData = v.expenses.length > 0;

  const revenueAverage = useMemo(() => {
    if (WEEKLY_GROSS_DATA.length === 0) return 0;
    return Math.round(
      WEEKLY_GROSS_DATA.reduce((sum, item) => sum + item.amount, 0) / WEEKLY_GROSS_DATA.length,
    );
  }, []);

  const maxWeeklyValue = useMemo(
    () => Math.max(...WEEKLY_GROSS_DATA.map((item) => item.amount), 5000) * 1.15,
    [],
  );

  const hasRevenueData = WEEKLY_GROSS_DATA.length > 0;

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
          <SectionCard
            title="Vehicle Information"
            actions={
              <IconButton
                aria-label="Edit vehicle information"
                size="small"
                onClick={onOpenInfoDrawer}
                sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            }
          >
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
          </SectionCard>

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
            <SectionCard title="Warranty / Notes">
              <Typography variant="body2" color="text.secondary">
                {v.warrantyInfo}
              </Typography>
            </SectionCard>
          )}

          {/* Cost Summary (read-only) */}
          <SectionCard title="Cost Summary">
            <DetailRow
              label="Monthly Cost"
              value={hasExpenseData ? currencyCompact.format(costSummary.monthlyTotal) : '\u2014'}
            />
            <DetailRow
              label="CPM"
              value={hasExpenseData && costSummary.cpm > 0 ? `$${costSummary.cpm.toFixed(2)}` : '\u2014'}
            />
            <DetailRow
              label="Daily Min"
              value={hasExpenseData && costSummary.dailyMin > 0 ? `$${costSummary.dailyMin.toFixed(2)}` : '\u2014'}
            />
            <DetailRow
              label="Weekly Min"
              value={hasExpenseData && costSummary.weeklyMin > 0 ? `$${costSummary.weeklyMin.toFixed(2)}` : '\u2014'}
              noBorder
            />
          </SectionCard>
        </Stack>
      </Grid>

      {/* Right Column */}
      <Grid item xs={12} lg={3}>
        <Stack spacing={2}>
          {/* Revenue Performance */}
          <SectionCard
            title="Revenue Performance"
            actions={
              <Typography variant="caption" color="text.secondary">
                Last 6 weeks
              </Typography>
            }
          >

            {hasRevenueData ? (
              <>
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
              </>
            ) : (
              <Box
                sx={{
                  height: 118,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No revenue data yet
                </Typography>
              </Box>
            )}
          </SectionCard>

          {/* Current Assignment */}
          <SectionCard title="Current Assignment">
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
          </SectionCard>

          {/* Min Book Rate */}
          <SectionCard
            title="Min Book Rate"
            sx={{
              bgcolor: 'primary.lighter',
              borderColor: 'primary.light',
            }}
          >
            <Typography variant="h2" sx={{ mt: 1 }}>
              {currencyCompact.format(costSummary.minBookRate)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              ${costSummary.cpm.toFixed(2)} CPM + 15% margin
            </Typography>
            <Alert severity="info" sx={{ mt: 1.5 }}>
              Used in Load Intelligence scoring to filter out unprofitable loads.
            </Alert>
          </SectionCard>
        </Stack>
      </Grid>
    </Grid>
  );
};
