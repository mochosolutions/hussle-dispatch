import { Box, Button, Grid, MenuItem, TextField } from '@mui/material';
import { Formik } from 'formik';
import { EQUIPMENT_OPTIONS, VEHICLE_MAKES } from '../../constants';
import type { DriverFormEntry, VehicleFormEntry } from '../../types';
import { vehicleSchema } from '../../validators/vehicleSchema';

interface VehicleInlineFormProps {
  initial?: VehicleFormEntry | null;
  drivers: DriverFormEntry[];
  onSave: (vehicle: VehicleFormEntry) => void;
  onCancel: () => void;
}

export const VehicleInlineForm = ({
  initial,
  drivers,
  onSave,
  onCancel,
}: VehicleInlineFormProps) => {
  const isEdit = Boolean(initial?.localId);

  return (
    <Formik
      initialValues={{
        year: initial?.year ?? '',
        make: initial?.make ?? '',
        model: initial?.model ?? '',
        vin: initial?.vin ?? '',
        type: initial?.type ?? '',
        licensePlate: initial?.licensePlate ?? '',
        assignedDriverLocalId: initial?.assignedDriverLocalId ?? '',
      }}
      validationSchema={vehicleSchema}
      onSubmit={(values) => {
        onSave({
          localId: initial?.localId ?? `v-${Date.now()}`,
          year: values.year,
          make: values.make,
          model: values.model ?? '',
          vin: values.vin ?? '',
          type: (values.type as VehicleFormEntry['type']) || 'DRY_VAN',
          licensePlate: values.licensePlate ?? '',
          assignedDriverLocalId: values.assignedDriverLocalId || null,
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
            <Grid item xs={2}>
              <TextField
                fullWidth
                name="year"
                label="Year"
                placeholder="2022"
                value={values.year}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.year && errors.year)}
                helperText={touched.year ? errors.year : undefined}
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                fullWidth
                select
                name="make"
                label="Make"
                value={values.make}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.make && errors.make)}
                helperText={touched.make ? errors.make : undefined}
              >
                <MenuItem value="" disabled>
                  Select make
                </MenuItem>
                {VEHICLE_MAKES.map((make) => (
                  <MenuItem key={make} value={make}>
                    {make}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={5}>
              <TextField
                fullWidth
                name="model"
                label="Model"
                placeholder="Cascadia"
                value={values.model}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                name="vin"
                label="VIN"
                placeholder="1FUJGLDR..."
                value={values.vin}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                select
                name="type"
                label="Equipment Type"
                value={values.type}
                onChange={handleChange}
              >
                <MenuItem value="">—</MenuItem>
                {EQUIPMENT_OPTIONS.map((equipment) => (
                  <MenuItem key={equipment.value} value={equipment.value}>
                    {equipment.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                name="licensePlate"
                label="License Plate"
                placeholder="ABC-1234"
                value={values.licensePlate}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          {drivers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                select
                name="assignedDriverLocalId"
                label="Assign Driver"
                value={values.assignedDriverLocalId}
                onChange={handleChange}
                helperText="You can also assign later"
              >
                <MenuItem value="">Assign later</MenuItem>
                {drivers.map((driver) => (
                  <MenuItem key={driver.localId} value={driver.localId}>
                    {driver.firstName} {driver.lastName}
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
              {isEdit ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </Box>
        </Box>
      )}
    </Formik>
  );
};
