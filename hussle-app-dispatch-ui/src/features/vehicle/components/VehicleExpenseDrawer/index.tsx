import React from 'react';
import { FieldArray } from 'formik';
import type { FieldArrayRenderProps, FormikProps } from 'formik';
import { Box, Typography, Button, Stack, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { SelectField, TypeaheadField, CurrencyField } from '@mocho/ui/components';
import type { TypeaheadOption } from '@mocho/ui/forms';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { vehicleExpenseSchema } from '../../validators/vehicleExpenseSchema';
import type { VehicleExpenseFormValues } from '../../validators/vehicleExpenseSchema';
import { useDispatch, useSelector } from 'store';
import { selectVehicleById } from '../../store/selectors/vehicleSelectors';
import { updateVehicleRequest } from '../../store/reducers';
import * as Yup from 'yup';

const EXPENSE_CATEGORIES = ['FIXED', 'VARIABLE', 'SERVICE', 'WAGE', 'DEDUCTION'] as const;

const EXPENSE_CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((cat) => ({ value: cat, label: cat }));

const EXPENSE_LABEL_OPTIONS: TypeaheadOption[] = [
  { value: 'Truck Payment', label: 'Truck Payment' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Fuel', label: 'Fuel' },
  { value: 'Tires', label: 'Tires' },
  { value: 'Oil Change', label: 'Oil Change' },
  { value: 'DEF Fluid', label: 'DEF Fluid' },
  { value: 'Truck Wash', label: 'Truck Wash' },
  { value: 'Trailer Rental', label: 'Trailer Rental' },
  { value: 'Permits & Tags', label: 'Permits & Tags' },
  { value: 'Tolls', label: 'Tolls' },
  { value: 'Parking', label: 'Parking' },
  { value: 'ELD Service', label: 'ELD Service' },
  { value: 'Dispatch Fee', label: 'Dispatch Fee' },
  { value: 'Factoring Fee', label: 'Factoring Fee' },
  { value: 'Driver Pay', label: 'Driver Pay' },
  { value: 'Escrow', label: 'Escrow' },
];

const expensesFormSchema = Yup.object({
  expenses: Yup.array().of(vehicleExpenseSchema).required().min(0),
}).required();

type ExpenseFormValues = Yup.InferType<typeof expensesFormSchema>;

const EMPTY_EXPENSE: VehicleExpenseFormValues = {
  category: 'FIXED',
  expenseKey: '',
  label: '',
  monthlyAmount: 0,
};

const toExpenseKey = (label: string): string =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

type ExpenseFieldsProps = {
  formikProps: FormikProps<ExpenseFormValues>;
  initialExpenseCount: number;
};

const ExpenseFields: React.FC<ExpenseFieldsProps> = ({ formikProps, initialExpenseCount }) => {
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
            {formikProps.values.expenses.map((_expense, index) => (
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
                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <SelectField
                      name={`expenses.${index}.category`}
                      label="Category"
                      data={EXPENSE_CATEGORY_OPTIONS}
                      formik={formikProps}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', pt: 3.5 }}>
                    <IconButton
                      aria-label={`Delete expense row ${index + 1}`}
                      size="small"
                      color="error"
                      onClick={() => arrayHelpers.remove(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <TypeaheadField
                      name={`expenses.${index}.label`}
                      label="Expense Type"
                      options={EXPENSE_LABEL_OPTIONS}
                      allowFreeText
                      placeholder="Select or type custom..."
                      disabled={index < initialExpenseCount}
                      formik={formikProps}
                      onOptionSelect={(option) => {
                        if (index >= initialExpenseCount) {
                          const labelValue = option?.value ?? '';
                          void formikProps.setFieldValue(
                            `expenses.${index}.expenseKey`,
                            toExpenseKey(labelValue),
                          );
                        }
                      }}
                      onInputValueChange={(inputValue) => {
                        if (index >= initialExpenseCount) {
                          void formikProps.setFieldValue(
                            `expenses.${index}.expenseKey`,
                            toExpenseKey(inputValue),
                          );
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <CurrencyField
                      name={`expenses.${index}.monthlyAmount`}
                      label="Monthly Amount"
                      formik={formikProps}
                    />
                  </Box>
                </Box>
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

interface VehicleExpenseDrawerProps {
  vehicleId: string;
  onClose: () => void;
}

export const VehicleExpenseDrawer: React.FC<VehicleExpenseDrawerProps> = ({
  vehicleId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const vehicle = useSelector(selectVehicleById(vehicleId));

  if (!vehicle) {
    return null;
  }

  const initialExpenses: VehicleExpenseFormValues[] = vehicle.expenses.map((exp) => ({
    category: exp.category,
    expenseKey: exp.expenseKey,
    label: exp.label,
    monthlyAmount: parseFloat(exp.monthlyAmount),
  }));

  return (
    <FormDrawer<ExpenseFormValues>
      open
      onClose={onClose}
      title="Edit Vehicle Expenses"
      subtitle={vehicle.unitNumber}
      initialValues={{ expenses: initialExpenses }}
      validationSchema={expensesFormSchema}
      onSubmit={(values) => {
        dispatch(updateVehicleRequest({ id: vehicleId, data: { expenses: values.expenses } }));
        onClose();
      }}
    >
      {(formikProps) => (
        <ExpenseFields formikProps={formikProps} initialExpenseCount={initialExpenses.length} />
      )}
    </FormDrawer>
  );
};
