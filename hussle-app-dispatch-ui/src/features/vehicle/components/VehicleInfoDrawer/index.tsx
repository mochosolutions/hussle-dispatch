import React from 'react';
import { Formik, Form } from 'formik';
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Grid,
  Stack,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { EditDrawer } from 'features/carrier/components/EditDrawer';
import { vehicleInfoSchema } from '../../validators/vehicleInfoSchema';
import type { Vehicle, UpdateVehicleInput } from 'features/carrier/types';
import { VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';

interface VehicleInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  data: Vehicle;
  onSave: (values: UpdateVehicleInput) => void;
}

const sectionHeaderSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

export const VehicleInfoDrawer: React.FC<VehicleInfoDrawerProps> = ({
  open,
  onClose,
  data,
  onSave,
}) => (
  <EditDrawer
    open={open}
    onClose={onClose}
    title="Edit Vehicle Information"
    subtitle={data.unitNumber}
  >
    <Formik
      initialValues={{
        unitNumber: data.unitNumber,
        make: data.make ?? '',
        model: data.model ?? '',
        year: data.year ?? '',
        vin: data.vin ?? '',
        licensePlate: data.licensePlate ?? '',
        licensePlateState: data.licensePlateState ?? '',
        type: data.type,
        ownership: data.ownership,
        emergencyContactName: data.emergencyContactName ?? '',
        emergencyContactPhone: data.emergencyContactPhone ?? '',
        warrantyInfo: data.warrantyInfo ?? '',
        notes: data.notes ?? '',
      }}
      validationSchema={vehicleInfoSchema}
      onSubmit={(values, { setSubmitting }) => {
        const transformed: UpdateVehicleInput = {
          unitNumber: values.unitNumber,
          make: values.make || null,
          model: values.model || null,
          year: values.year !== '' ? Number(values.year) : null,
          vin: values.vin || null,
          licensePlate: values.licensePlate || null,
          licensePlateState: values.licensePlateState || null,
          type: values.type,
          ownership: values.ownership,
          emergencyContactName: values.emergencyContactName || null,
          emergencyContactPhone: values.emergencyContactPhone || null,
          warrantyInfo: values.warrantyInfo || null,
          notes: values.notes || null,
        };
        onSave(transformed);
        setSubmitting(false);
        onClose();
      }}
      enableReinitialize
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting, isValid, dirty }) => (
        <Form>
          <Stack spacing={2.5}>
            {/* Vehicle Details */}
            <Typography variant="subtitle2" sx={sectionHeaderSx}>
              Vehicle Details
            </Typography>
            <TextField
              fullWidth
              name="unitNumber"
              label="Unit Number"
              value={values.unitNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.unitNumber && Boolean(errors.unitNumber)}
              helperText={touched.unitNumber && errors.unitNumber}
            />
            <TextField
              fullWidth
              select
              name="type"
              label="Type"
              value={values.type}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.type && Boolean(errors.type)}
              helperText={touched.type && errors.type}
            >
              {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              name="ownership"
              label="Ownership"
              value={values.ownership}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.ownership && Boolean(errors.ownership)}
              helperText={touched.ownership && errors.ownership}
            >
              {Object.entries(OWNERSHIP_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="make"
                  label="Make"
                  value={values.make}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.make && Boolean(errors.make)}
                  helperText={touched.make && errors.make}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="model"
                  label="Model"
                  value={values.model}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.model && Boolean(errors.model)}
                  helperText={touched.model && errors.model}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="year"
                  label="Year"
                  value={values.year}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.year && Boolean(errors.year)}
                  helperText={touched.year && errors.year}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="vin"
                  label="VIN"
                  value={values.vin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.vin && Boolean(errors.vin)}
                  helperText={touched.vin && errors.vin}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="licensePlate"
                  label="License Plate"
                  value={values.licensePlate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.licensePlate && Boolean(errors.licensePlate)}
                  helperText={touched.licensePlate && errors.licensePlate}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="licensePlateState"
                  label="License Plate State"
                  value={values.licensePlateState}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.licensePlateState && Boolean(errors.licensePlateState)}
                  helperText={touched.licensePlateState && errors.licensePlateState}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 0.5 }} />

            {/* Emergency Contact */}
            <Typography variant="subtitle2" sx={sectionHeaderSx}>
              Emergency Contact
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="emergencyContactName"
                  label="Contact Name"
                  value={values.emergencyContactName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.emergencyContactName && Boolean(errors.emergencyContactName)}
                  helperText={touched.emergencyContactName && errors.emergencyContactName}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="emergencyContactPhone"
                  label="Contact Phone"
                  type="tel"
                  value={values.emergencyContactPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.emergencyContactPhone && Boolean(errors.emergencyContactPhone)}
                  helperText={touched.emergencyContactPhone && errors.emergencyContactPhone}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 0.5 }} />

            {/* Other */}
            <Typography variant="subtitle2" sx={sectionHeaderSx}>
              Other
            </Typography>
            <TextField
              fullWidth
              name="warrantyInfo"
              label="Warranty Info"
              value={values.warrantyInfo}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.warrantyInfo && Boolean(errors.warrantyInfo)}
              helperText={touched.warrantyInfo && errors.warrantyInfo}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              name="notes"
              label="Notes"
              value={values.notes}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.notes && Boolean(errors.notes)}
              helperText={touched.notes && errors.notes}
            />

            {/* Footer */}
            <Box
              sx={{
                pt: 2,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1.5,
                borderTop: 1,
                borderColor: 'divider',
                mt: 1,
              }}
            >
              <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!isValid || !dirty || isSubmitting}
                startIcon={
                  isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
                }
              >
                {isSubmitting ? 'Saving\u2026' : 'Save Changes'}
              </Button>
            </Box>
          </Stack>
        </Form>
      )}
    </Formik>
  </EditDrawer>
);
