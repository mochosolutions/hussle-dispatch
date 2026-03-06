import { Box, Button, Grid, MenuItem, TextField } from '@mui/material';
import { Formik } from 'formik';
import { CDL_CLASSES } from '../../constants';
import type { DriverFormEntry, VehicleFormEntry } from '../../types';
import { driverSchema } from '../../validators/driverSchema';

interface DriverInlineFormProps {
  initial?: DriverFormEntry | null;
  vehicles: VehicleFormEntry[];
  onSave: (driver: DriverFormEntry) => void;
  onCancel: () => void;
}

export const DriverInlineForm = ({
  initial,
  vehicles,
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
        cdlNumber: initial?.cdlNumber ?? '',
        cdlClass: initial?.cdlClass ?? '',
        cdlExpiry: initial?.cdlExpiry ?? '',
        email: initial?.email ?? '',
        assignedVehicleLocalId: initial?.assignedVehicleLocalId ?? '',
      }}
      validationSchema={driverSchema}
      onSubmit={(values) => {
        onSave({
          localId: initial?.localId ?? `d-${Date.now()}`,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          cdlNumber: values.cdlNumber ?? '',
          cdlClass: values.cdlClass ?? '',
          cdlExpiry: values.cdlExpiry ?? '',
          email: values.email ?? '',
          assignedVehicleLocalId: values.assignedVehicleLocalId || null,
        });
      }}
      enableReinitialize
    >
      {({ values, errors, touched, handleBlur, handleChange, handleSubmit, isValid }) => (
        <Box
          component="form"
          onSubmit={handleSubmit}
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
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="firstName"
                label="First Name"
                placeholder="John"
                value={values.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.firstName && errors.firstName)}
                helperText={touched.firstName ? errors.firstName : undefined}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="lastName"
                label="Last Name"
                placeholder="Smith"
                value={values.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.lastName && errors.lastName)}
                helperText={touched.lastName ? errors.lastName : undefined}
              />
            </Grid>
          </Grid>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="phone"
                label="Phone"
                placeholder="(555) 123-4567"
                type="tel"
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.phone && errors.phone)}
                helperText={touched.phone ? errors.phone : undefined}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="email"
                label="Email"
                placeholder="driver@email.com"
                type="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.email && errors.email)}
                helperText={touched.email ? errors.email : undefined}
              />
            </Grid>
          </Grid>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={5}>
              <TextField
                fullWidth
                name="cdlNumber"
                label="CDL Number"
                placeholder="A123456789"
                value={values.cdlNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                select
                name="cdlClass"
                label="CDL Class"
                value={values.cdlClass}
                onChange={handleChange}
              >
                <MenuItem value="">—</MenuItem>
                {CDL_CLASSES.map((cdlClass) => (
                  <MenuItem key={cdlClass.value} value={cdlClass.value}>
                    {cdlClass.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                name="cdlExpiry"
                label="CDL Expiry"
                type="date"
                value={values.cdlExpiry}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {vehicles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                select
                name="assignedVehicleLocalId"
                label="Assign Vehicle"
                value={values.assignedVehicleLocalId}
                onChange={handleChange}
              >
                <MenuItem value="">Assign later</MenuItem>
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.localId} value={vehicle.localId}>
                    {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" size="small" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={!isValid}>
              {isEdit ? 'Update Driver' : 'Add Driver'}
            </Button>
          </Box>
        </Box>
      )}
    </Formik>
  );
};
