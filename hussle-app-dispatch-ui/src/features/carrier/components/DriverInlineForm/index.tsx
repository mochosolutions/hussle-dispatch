import { Box, Button, Grid } from '@mui/material';
import { Formik } from 'formik';
import { DateField } from '../../../../mocho/components/form-fields/DateField';
import { EmailField } from '../../../../mocho/components/form-fields/EmailField';
import { TextField } from '../../../../mocho/components/form-fields/TextField';
import type { DriverFormEntry } from '../../types';
import { driverSchema } from '../../validators/driverSchema';

interface DriverInlineFormProps {
  initial?: DriverFormEntry | null;
  onSave: (driver: DriverFormEntry) => void;
  onCancel: () => void;
}

export const DriverInlineForm = ({
  initial,
  onSave,
  onCancel,
}: DriverInlineFormProps) => {
  const isEdit = Boolean(initial?.localId);

  return (
    <Formik
      initialValues={{
        name: initial?.name ?? '',
        phone: initial?.phone ?? '',
        cdlNumber: initial?.cdlNumber ?? '',
        cdlExpiry: initial?.cdlExpiry ?? '',
        email: initial?.email ?? '',
      }}
      validationSchema={driverSchema}
      onSubmit={(values) => {
        onSave({
          localId: initial?.localId ?? `d-${Date.now()}`,
          name: values.name,
          phone: values.phone,
          cdlNumber: values.cdlNumber ?? '',
          cdlExpiry: values.cdlExpiry ?? '',
          email: values.email ?? '',
        });
      }}
      enableReinitialize
    >
      {({ values, errors, touched, handleBlur, handleChange, handleSubmit, setFieldValue, isValid }) => {
        const formikProps = { values, errors, touched, handleChange, handleBlur, setFieldValue };

        return (
        <Box
          sx={{
            p: 2.5,
            bgcolor: 'primary.light',
            border: 1,
            borderColor: 'primary.main',
            borderRadius: 1,
            opacity: 0.95,
          }}
        >
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField name="name" label="Driver Name" placeholder="Full name" formik={formikProps} />
            </Grid>
          </Grid>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField name="phone" label="Phone" placeholder="(555) 123-4567" formik={formikProps} />
            </Grid>
            <Grid item xs={6}>
              <EmailField name="email" label="Email" placeholder="driver@email.com" formik={formikProps} />
            </Grid>
          </Grid>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField name="cdlNumber" label="CDL Number" placeholder="A123456789" formik={formikProps} />
            </Grid>
            <Grid item xs={6}>
              <DateField name="cdlExpiry" label="CDL Expiry" formik={formikProps} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" size="small" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="contained"
              size="small"
              disabled={!isValid}
              onClick={() => void handleSubmit()}
            >
              {isEdit ? 'Update Driver' : 'Add Driver'}
            </Button>
          </Box>
        </Box>
        );
      }}
    </Formik>
  );
};
