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
} from '@mui/material';
import { Body, KpiLabel, Meta, TableHeaderLabel } from 'components/Typography';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SectionCard from 'components/SectionCard';
import { useDispatch } from 'store';
import type { Vehicle, UpsertVehicleExpense } from 'features/carrier/types';
import { updateVehicleRequest } from '../../store/reducers';
import { EXPENSE_CATEGORY_LABELS } from '../../constants';

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

      <SectionCard
        title="Expense Rows"
        actions={
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
        }
      >
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
          <TableHeaderLabel>Category</TableHeaderLabel>
          <TableHeaderLabel>Key</TableHeaderLabel>
          <TableHeaderLabel>Label</TableHeaderLabel>
          <TableHeaderLabel sx={{ textAlign: 'right' }}>Monthly ($)</TableHeaderLabel>
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
                startAdornment: <Body sx={{ mr: 0.5 }}>$</Body>,
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
            <Meta>No expense rows. Click &quot;Add Row&quot; to add one.</Meta>
          </Box>
        )}
      </SectionCard>

      {/* Computed summary */}
      <SectionCard
        title="Auto-Computed Summary"
        sx={{
          bgcolor: 'primary.lighter',
          borderColor: 'primary.light',
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <KpiLabel>Total Monthly Cost</KpiLabel>
            <Body sx={{ fontSize: '1.5rem', fontWeight: 700, mt: 0.5 }}>
              {currencyCompact.format(expenseTabTotals.monthlyTotal)}
            </Body>
          </Grid>
          <Grid item xs={12} sm={3}>
            <KpiLabel>CPM (total / miles target)</KpiLabel>
            <Body sx={{ fontSize: '1.5rem', fontWeight: 700, mt: 0.5 }}>${expenseTabTotals.cpm.toFixed(2)}</Body>
          </Grid>
          <Grid item xs={12} sm={3}>
            <KpiLabel>Daily Minimum Revenue</KpiLabel>
            <Body sx={{ fontSize: '1.5rem', fontWeight: 700, mt: 0.5 }}>${expenseTabTotals.dailyMin.toFixed(2)}</Body>
          </Grid>
          <Grid item xs={12} sm={3}>
            <KpiLabel>Miles Target / Month</KpiLabel>
            <Body sx={{ fontSize: '1.5rem', fontWeight: 700, mt: 0.5 }}>
              {(vehicle.monthlyMilesTarget ?? 0).toLocaleString()}
            </Body>
          </Grid>
        </Grid>
      </SectionCard>
    </Stack>
  );
};
