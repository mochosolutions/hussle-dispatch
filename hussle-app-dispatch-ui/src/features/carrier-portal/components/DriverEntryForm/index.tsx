import { useMemo } from 'react';
import { Box, Button, Grid, Stack } from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';

import {
  CancelButton,
  CurrencyField,
  EmailField,
  PercentField,
  PhoneField,
  SelectField,
  TextField,
} from 'mocho/components/form-fields';

import { PayType } from 'features/carrier-portal/types';
import type { DriverEntry } from 'features/carrier-portal/types';

interface DriverEntryFormValue {
  localId: string;
  entry: DriverEntry;
}

interface DriverEntryFormProps {
  initial?: DriverEntryFormValue | null;
  onSave: (driver: DriverEntryFormValue) => void;
  onCancel: () => void;
}

const PAY_TYPE_OPTIONS = [
  { value: PayType.PERCENTAGE, label: 'Percentage of gross' },
  { value: PayType.PER_MILE, label: 'Per mile' },
  { value: PayType.FLAT_RATE, label: 'Flat rate per load' },
];

const driverSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phone: Yup.string(),
  email: Yup.string().email('Invalid email'),
  payType: Yup.string(),
  payRate: Yup.number().nullable(),
});

interface FormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  payType: PayType | '';
  payRate: number | null;
}

const DriverEntryForm: React.FC<DriverEntryFormProps> = ({ initial, onSave, onCancel }) => {
  const isEdit = Boolean(initial);

  const initialValues = useMemo<FormValues>(
    () => ({
      firstName: initial?.entry.firstName ?? '',
      lastName: initial?.entry.lastName ?? '',
      phone: initial?.entry.phone ?? '',
      email: initial?.entry.email ?? '',
      payType: (initial?.entry.payType as PayType) ?? '',
      payRate: initial?.entry.payRate ?? null,
    }),
    [initial],
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={driverSchema}
      enableReinitialize
      onSubmit={(values) => {
        const entry: DriverEntry = {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || undefined,
          email: values.email || undefined,
          payType: (values.payType as PayType) || undefined,
          payRate: values.payRate ?? undefined,
        };
        onSave({
          localId: initial?.localId ?? `d-${Date.now()}`,
          entry,
        });
      }}
    >
      {({ values, errors, touched, handleBlur, handleChange, setFieldValue, isValid, submitForm }) => {
        const formikProps = { values, errors, touched, handleChange, handleBlur, setFieldValue };
        const isPercent = values.payType === PayType.PERCENTAGE;

        return (
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label="First Name"
                  required
                  placeholder="Isaiah"
                  formik={formikProps}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label="Last Name"
                  required
                  placeholder="Williams"
                  formik={formikProps}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <PhoneField name="phone" label="Phone" formik={formikProps} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EmailField name="email" label="Email" formik={formikProps} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SelectField
                  name="payType"
                  label="Pay Type"
                  data={[{ value: '', label: 'Select type' }, ...PAY_TYPE_OPTIONS]}
                  formik={formikProps}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                {isPercent ? (
                  <PercentField name="payRate" label="Pay Rate" formik={formikProps} />
                ) : (
                  <CurrencyField name="payRate" label="Pay Rate" formik={formikProps} />
                )}
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <CancelButton onClick={onCancel} size="small" />
              <Button
                type="button"
                variant="contained"
                size="small"
                disabled={!isValid || !values.firstName || !values.lastName}
                onClick={() => void submitForm()}
              >
                {isEdit ? 'Update Driver' : 'Add Driver'}
              </Button>
            </Stack>
          </Box>
        );
      }}
    </Formik>
  );
};

export type { DriverEntryFormValue };
export default DriverEntryForm;
