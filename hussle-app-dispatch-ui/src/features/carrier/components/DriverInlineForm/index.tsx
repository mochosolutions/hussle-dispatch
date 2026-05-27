import { Box, Button, Grid } from '@mui/material';
import { CancelButton } from '@mocho/ui/components';
import { Formik } from 'formik';
import { DateField } from '../../../../mocho/components/form-fields/DateField';
import { EmailField } from '../../../../mocho/components/form-fields/EmailField';
import { PhoneField } from '../../../../mocho/components/form-fields/PhoneField';
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
        firstName: initial?.firstName ?? '',
        lastName: initial?.lastName ?? '',
        phone: initial?.phone ?? '',
        licenseNumber: initial?.licenseNumber ?? '',
        licenseExpiry: initial?.licenseExpiry ?? '',
        email: initial?.email ?? '',
      }}
      validationSchema={driverSchema}
      onSubmit={(values) => {
        onSave({
          localId: initial?.localId ?? `d-${Date.now()}`,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          licenseNumber: values.licenseNumber ?? '',
          licenseExpiry: values.licenseExpiry ?? '',
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
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField name="firstName" label="First Name" placeholder="First name" formik={formikProps} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="lastName" label="Last Name" placeholder="Last name" formik={formikProps} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <PhoneField name="phone" label="Phone" formik={formikProps} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <EmailField name="email" label="Email" placeholder="driver@email.com" formik={formikProps} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="licenseNumber" label="License Number" placeholder="A123456789" formik={formikProps} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateField name="licenseExpiry" label="License Expiry" formik={formikProps} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <CancelButton onClick={onCancel} size="small" />
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
