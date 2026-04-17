import React from 'react';
import { Box, Stack } from '@mui/material';
import * as Yup from 'yup';
import { TextField, SelectField, DateField, CurrencyField, NumericField, StateField } from '@mocho/ui/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { createExpense } from 'utils/api/accounting/expenseApi';
import { enqueueSnackbar } from 'notistack';
import type { FormikProps } from 'formik';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXPENSE_CATEGORIES = [
  { value: 'FUEL', label: 'Fuel' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'TOLLS', label: 'Tolls' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'MEALS', label: 'Meals' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'TRUCK_PAYMENT', label: 'Truck Payment' },
  { value: 'TRAILER_RENTAL', label: 'Trailer Rental' },
  { value: 'PERMITS_TAGS', label: 'Permits & Tags' },
  { value: 'SCALES', label: 'Scales' },
  { value: 'LUMPER', label: 'Lumper' },
  { value: 'TIRES', label: 'Tires' },
  { value: 'OIL_CHANGE', label: 'Oil Change' },
  { value: 'DEF_FLUID', label: 'DEF Fluid' },
  { value: 'TRUCK_WASH', label: 'Truck Wash' },
];

const FUEL_TYPE_OPTIONS = [
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'DEF', label: 'DEF' },
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const expenseSchema = Yup.object({
  category: Yup.string().required('Category is required'),
  amount: Yup.number().positive('Must be positive').required('Amount is required'),
  date: Yup.string().required('Date is required'),
  vehicleId: Yup.string().required('Vehicle is required'),
  description: Yup.string().defined(),
  gallons: Yup.number().positive('Must be positive').nullable().defined(),
  state: Yup.string().nullable().defined(),
  pricePerGallon: Yup.number().positive('Must be positive').nullable().defined(),
  fuelType: Yup.string().nullable().defined(),
});

type ExpenseFormValues = Yup.InferType<typeof expenseSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const todayString = (): string => new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExpenseQuickAddDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FuelFields: React.FC<{ formik: FormikProps<ExpenseFormValues> }> = ({ formik }) => {
  const isFuel = formik.values.category === 'FUEL';

  if (!isFuel) {
    return null;
  }

  return (
    <DrawerSection label="Fuel Details">
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <NumericField name="gallons" label="Gallons" suffix="gal" decimalScale={1} formik={formik} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <CurrencyField name="pricePerGallon" label="Price / Gallon" formik={formik} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <StateField name="state" label="State" formik={formik} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <SelectField
              name="fuelType"
              label="Fuel Type"
              data={FUEL_TYPE_OPTIONS}
              formik={formik}
            />
          </Box>
        </Box>
      </Stack>
    </DrawerSection>
  );
};

export const ExpenseQuickAddDrawer: React.FC<ExpenseQuickAddDrawerProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const initialValues: ExpenseFormValues = {
    category: '',
    amount: undefined as unknown as number,
    date: todayString(),
    vehicleId: '',
    description: '',
    gallons: null,
    state: null,
    pricePerGallon: null,
    fuelType: 'DIESEL',
  };

  const handleSubmit = async (values: ExpenseFormValues) => {
    try {
      await createExpense({
        category: values.category,
        amount: values.amount,
        date: values.date,
        vehicleId: values.vehicleId,
        description: values.description || undefined,
        gallons: values.gallons ?? undefined,
        state: values.state ?? undefined,
        pricePerGallon: values.pricePerGallon ?? undefined,
        fuelType: values.fuelType ?? undefined,
      });
      enqueueSnackbar('Expense created', { variant: 'success' });
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create expense';
      enqueueSnackbar(message, { variant: 'error' });
      throw error;
    }
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Add Expense"
      initialValues={initialValues}
      validationSchema={expenseSchema}
      onSubmit={handleSubmit}
      saveLabel="Add Expense"
      savingLabel="Adding..."
    >
      {(formik) => (
        <Stack spacing={3} sx={{ p: 3 }}>
          <DrawerSection label="Expense Details">
            <Stack spacing={2}>
              <SelectField
                name="category"
                label="Category"
                data={EXPENSE_CATEGORIES}
                required
                placeholder="Select category"
                formik={formik}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <CurrencyField name="amount" label="Amount" required formik={formik} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <DateField name="date" label="Date" required formik={formik} />
                </Box>
              </Box>
              <TextField
                name="vehicleId"
                label="Vehicle ID"
                required
                placeholder="Enter vehicle ID"
                formik={formik}
              />
              <TextField
                name="description"
                label="Description"
                placeholder="Optional description"
                multiline
                minRows={2}
                formik={formik}
              />
            </Stack>
          </DrawerSection>

          <FuelFields formik={formik} />
        </Stack>
      )}
    </FormDrawer>
  );
};
