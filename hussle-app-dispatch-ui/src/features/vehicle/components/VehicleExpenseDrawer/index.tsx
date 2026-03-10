import React from 'react';
import { FieldArray } from 'formik';
import type { FieldArrayRenderProps, FormikErrors, FormikProps, FormikTouched } from 'formik';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  MenuItem,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { vehicleExpenseSchema } from '../../validators/vehicleExpenseSchema';
import type { Vehicle, UpdateVehicleInput, UpsertVehicleExpense } from 'features/carrier/types';
import * as Yup from 'yup';

const EXPENSE_CATEGORIES = ['FIXED', 'VARIABLE', 'SERVICE', 'WAGE', 'DEDUCTION'] as const;

const expensesFormSchema = Yup.object({
  expenses: Yup.array().of(vehicleExpenseSchema).required().min(0),
}).required();

interface ExpenseFormValues {
  expenses: UpsertVehicleExpense[];
}

interface VehicleExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  data: Vehicle;
  onSave: (values: UpdateVehicleInput) => void;
}

const EMPTY_EXPENSE: UpsertVehicleExpense = {
  category: 'FIXED',
  expenseKey: '',
  label: '',
  monthlyAmount: 0,
};

const getExpenseError = (
  errors: FormikErrors<ExpenseFormValues>,
  touched: FormikTouched<ExpenseFormValues>,
  index: number,
  field: keyof UpsertVehicleExpense,
): string | undefined => {
  const expenseErrors = errors.expenses;
  const expenseTouched = touched.expenses;

  if (!expenseErrors || !expenseTouched) {
    return undefined;
  }

  const rowErrors = expenseErrors[index];
  const rowTouched = expenseTouched[index];

  if (
    typeof rowErrors !== 'object' ||
    rowErrors === null ||
    typeof rowTouched !== 'object' ||
    rowTouched === null
  ) {
    return undefined;
  }

  const fieldError = (rowErrors as FormikErrors<UpsertVehicleExpense>)[field];
  const fieldTouched = (rowTouched as FormikTouched<UpsertVehicleExpense>)[field];

  if (fieldTouched && typeof fieldError === 'string') {
    return fieldError;
  }

  return undefined;
};

interface ExpenseFieldsProps {
  formikProps: FormikProps<ExpenseFormValues>;
  initialExpenseCount: number;
}

const ExpenseFields: React.FC<ExpenseFieldsProps> = ({ formikProps, initialExpenseCount }) => {
  const { values, errors, touched, handleChange, handleBlur } = formikProps;

  return (
    <Stack spacing={2.5} sx={{ p: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: '0.6875rem',
          letterSpacing: 0.5,
        }}
      >
        Expenses
      </Typography>

      <FieldArray name="expenses">
        {(arrayHelpers: FieldArrayRenderProps) => (
          <Stack spacing={2}>
            {values.expenses.map((expense, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                }}
              >
                <Grid container spacing={1.5}>
                  <Grid item xs={5}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      name={`expenses.${index}.category`}
                      label="Category"
                      value={expense.category}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(getExpenseError(errors, touched, index, 'category'))}
                      helperText={getExpenseError(errors, touched, index, 'category')}
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      size="small"
                      name={`expenses.${index}.expenseKey`}
                      label="Expense Key"
                      value={expense.expenseKey}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(getExpenseError(errors, touched, index, 'expenseKey'))}
                      helperText={getExpenseError(errors, touched, index, 'expenseKey')}
                      InputProps={{
                        readOnly: index < initialExpenseCount,
                      }}
                    />
                  </Grid>
                  <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      aria-label={`Delete expense row ${index + 1}`}
                      size="small"
                      color="error"
                      onClick={() => arrayHelpers.remove(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      name={`expenses.${index}.label`}
                      label="Label"
                      value={expense.label}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(getExpenseError(errors, touched, index, 'label'))}
                      helperText={getExpenseError(errors, touched, index, 'label')}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      name={`expenses.${index}.monthlyAmount`}
                      label="Monthly Amount"
                      type="number"
                      value={expense.monthlyAmount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(getExpenseError(errors, touched, index, 'monthlyAmount'))}
                      helperText={getExpenseError(errors, touched, index, 'monthlyAmount')}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => arrayHelpers.push({ ...EMPTY_EXPENSE })}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Expense
            </Button>
          </Stack>
        )}
      </FieldArray>
    </Stack>
  );
};

export const VehicleExpenseDrawer: React.FC<VehicleExpenseDrawerProps> = ({
  open,
  onClose,
  data,
  onSave,
}) => {
  const initialExpenses: UpsertVehicleExpense[] = data.expenses.map((exp) => ({
    category: exp.category,
    expenseKey: exp.expenseKey,
    label: exp.label,
    monthlyAmount: parseFloat(exp.monthlyAmount),
  }));

  return (
    <FormDrawer<ExpenseFormValues>
      open={open}
      onClose={onClose}
      title="Edit Vehicle Expenses"
      subtitle={data.unitNumber}
      initialValues={{ expenses: initialExpenses }}
      validationSchema={expensesFormSchema}
      onSubmit={(values) => {
        onSave({ expenses: values.expenses });
      }}
    >
      {(formikProps) => (
        <ExpenseFields formikProps={formikProps} initialExpenseCount={initialExpenses.length} />
      )}
    </FormDrawer>
  );
};
