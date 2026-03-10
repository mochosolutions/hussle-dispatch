import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { MainCard } from '@mocho/ui/components';
import { useDispatch } from 'store';
import type { Vehicle, UpsertVehicleExpense } from 'features/carrier/types';
import { updateVehicleRequest } from '../../../store/reducers';
import { EXPENSE_CATEGORY_LABELS } from '../../../constants';

const EXPENSE_CATEGORIES = ['FIXED', 'VARIABLE', 'SERVICE', 'WAGE', 'DEDUCTION'] as const;

const EMPTY_EXPENSE: UpsertVehicleExpense = {
  category: 'FIXED',
  expenseKey: '',
  label: '',
  monthlyAmount: 0,
};

const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface VehicleExpenseTabProps {
  vehicle: Vehicle;
  onOpenTargetsDrawer: () => void;
}

export const VehicleExpenseTab: React.FC<VehicleExpenseTabProps> = ({
  vehicle,
  onOpenTargetsDrawer,
}) => {
  const dispatch = useDispatch();

  const [expenseRows, setExpenseRows] = useState<UpsertVehicleExpense[]>(() =>
    vehicle.expenses.map((exp) => ({
      category: exp.category,
      expenseKey: exp.expenseKey,
      label: exp.label,
      monthlyAmount: parseFloat(exp.monthlyAmount),
    })),
  );
  const [expensesSaved, setExpensesSaved] = useState(false);

  const targetMiles = vehicle.monthlyMilesTarget ?? 0;
  const workingDays = vehicle.workingDaysPerMonth ?? 0;

  const expenseTabTotals = useMemo(() => {
    const monthlyTotal = expenseRows.reduce((sum, row) => sum + (row.monthlyAmount ?? 0), 0);
    const cpm = targetMiles > 0 ? monthlyTotal / targetMiles : 0;
    const dailyMin = workingDays > 0 ? monthlyTotal / workingDays : 0;

    return { monthlyTotal, cpm, dailyMin };
  }, [expenseRows, targetMiles, workingDays]);

  const handleExpenseRowChange = useCallback(
    (index: number, field: keyof UpsertVehicleExpense, value: string | number) => {
      setExpenseRows((previous) =>
        previous.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
      );
      setExpensesSaved(false);
    },
    [],
  );

  const handleAddExpenseRow = useCallback(() => {
    setExpenseRows((previous) => [...previous, { ...EMPTY_EXPENSE }]);
    setExpensesSaved(false);
  }, []);

  const handleRemoveExpenseRow = useCallback((index: number) => {
    setExpenseRows((previous) => previous.filter((_, i) => i !== index));
    setExpensesSaved(false);
  }, []);

  const handleSaveExpenseRows = useCallback(() => {
    dispatch(updateVehicleRequest({ id: vehicle.id, data: { expenses: expenseRows } }));
    setExpensesSaved(true);
    setTimeout(() => setExpensesSaved(false), 2000);
  }, [dispatch, vehicle.id, expenseRows]);

  return (
    <Stack spacing={2}>
      {/* Guards */}
      {(vehicle.monthlyMilesTarget === null || vehicle.monthlyMilesTarget === 0) && (
        <Alert
          severity="warning"
          action={
            <Button color="warning" size="small" onClick={onOpenTargetsDrawer}>
              Set Miles Target
            </Button>
          }
        >
          Monthly miles target is not set. CPM cannot be calculated without it.
        </Alert>
      )}
      {(vehicle.workingDaysPerMonth === null || vehicle.workingDaysPerMonth === 0) && (
        <Alert
          severity="warning"
          action={
            <Button color="warning" size="small" onClick={onOpenTargetsDrawer}>
              Set Working Days
            </Button>
          }
        >
          Working days per month is not set. Daily minimum revenue cannot be calculated.
        </Alert>
      )}

      <MainCard>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ mb: 2 }}
        >
          <Typography variant="h5">Expense Rows</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddExpenseRow}
            >
              Add Row
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={expensesSaved ? undefined : <SaveOutlined />}
              color={expensesSaved ? 'success' : 'primary'}
              onClick={handleSaveExpenseRows}
            >
              {expensesSaved ? 'Saved' : 'Save All'}
            </Button>
          </Stack>
        </Stack>

        {/* Table Header */}
        <Box
          sx={{
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: '150px 1fr 1fr 120px 48px',
            gap: 1.5,
            px: 1.5,
            py: 1,
            borderBottom: 2,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Category
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Key
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Label
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, textAlign: 'right' }}
          >
            Monthly ($)
          </Typography>
          <Box />
        </Box>

        {/* Expense Rows */}
        {expenseRows.map((row, index) => (
          <Box
            key={index}
            sx={{
              display: { xs: 'flex', md: 'grid' },
              flexDirection: { xs: 'column' },
              gridTemplateColumns: '150px 1fr 1fr 120px 48px',
              gap: 1.5,
              px: 1.5,
              py: 1,
              borderBottom: 1,
              borderColor: 'divider',
              alignItems: { md: 'center' },
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <TextField
              select
              size="small"
              value={row.category}
              onChange={(event) => handleExpenseRowChange(index, 'category', event.target.value)}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {EXPENSE_CATEGORY_LABELS[cat] ?? cat}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              value={row.expenseKey}
              placeholder="e.g. truck_payment"
              onChange={(event) => handleExpenseRowChange(index, 'expenseKey', event.target.value)}
            />
            <TextField
              size="small"
              value={row.label}
              placeholder="e.g. Truck Payment"
              onChange={(event) => handleExpenseRowChange(index, 'label', event.target.value)}
            />
            <TextField
              size="small"
              type="number"
              value={row.monthlyAmount ?? 0}
              onChange={(event) =>
                handleExpenseRowChange(
                  index,
                  'monthlyAmount',
                  parseFloat(event.target.value) || 0,
                )
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                inputProps: {
                  style: { textAlign: 'right' },
                },
              }}
            />
            <IconButton
              aria-label={`Remove expense row ${index + 1}`}
              size="small"
              color="error"
              onClick={() => handleRemoveExpenseRow(index)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        {expenseRows.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No expense rows. Click &quot;Add Row&quot; to add one.
            </Typography>
          </Box>
        )}
      </MainCard>

      {/* Computed summary */}
      <MainCard
        sx={{
          bgcolor: 'primary.lighter',
          borderColor: 'primary.light',
        }}
      >
        <Typography
          variant="caption"
          sx={{ textTransform: 'uppercase', color: 'primary.main' }}
        >
          Auto-Computed Summary
        </Typography>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" color="text.secondary">
              Total Monthly Cost
            </Typography>
            <Typography variant="h4">
              {currencyCompact.format(expenseTabTotals.monthlyTotal)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" color="text.secondary">
              CPM (total / miles target)
            </Typography>
            <Typography variant="h4">${expenseTabTotals.cpm.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" color="text.secondary">
              Daily Minimum Revenue
            </Typography>
            <Typography variant="h4">${expenseTabTotals.dailyMin.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" color="text.secondary">
              Miles Target / Month
            </Typography>
            <Typography variant="h4">
              {(vehicle.monthlyMilesTarget ?? 0).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </MainCard>
    </Stack>
  );
};
