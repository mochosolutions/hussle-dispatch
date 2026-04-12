import React from 'react';
import { Grid, Stack } from '@mui/material';
import * as Yup from 'yup';
import { TextField, SelectField, DateField } from '@mocho/ui/components';
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

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];

const US_STATE_OPTIONS = US_STATES.map((code) => ({ value: code, label: code }));

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
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField name="gallons" label="Gallons" type="number" formik={formik} />
        </Grid>
        <Grid item xs={6}>
          <TextField name="pricePerGallon" label="Price / Gallon" type="number" formik={formik} />
        </Grid>
        <Grid item xs={6}>
          <SelectField name="state" label="State" data={US_STATE_OPTIONS} formik={formik} />
        </Grid>
        <Grid item xs={6}>
          <SelectField
            name="fuelType"
            label="Fuel Type"
            data={FUEL_TYPE_OPTIONS}
            formik={formik}
          />
        </Grid>
      </Grid>
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
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <SelectField
                  name="category"
                  label="Category"
                  data={EXPENSE_CATEGORIES}
                  required
                  placeholder="Select category"
                  formik={formik}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="amount"
                  label="Amount"
                  type="number"
                  required
                  placeholder="0.00"
                  formik={formik}
                />
              </Grid>
              <Grid item xs={6}>
                <DateField name="date" label="Date" required formik={formik} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="vehicleId"
                  label="Vehicle ID"
                  required
                  placeholder="Enter vehicle ID"
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  placeholder="Optional description"
                  multiline
                  minRows={2}
                  formik={formik}
                />
              </Grid>
            </Grid>
          </DrawerSection>

          <FuelFields formik={formik} />
        </Stack>
      )}
    </FormDrawer>
  );
};
