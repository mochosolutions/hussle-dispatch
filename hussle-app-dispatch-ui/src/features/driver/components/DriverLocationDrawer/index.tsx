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
} from '@mui/material';
import { EditDrawer } from 'features/carrier/components/EditDrawer';
import { driverLocationSchema } from '../../validators/driverLocationSchema';
import type { Driver, UpdateDriverInput } from 'features/carrier/types';

interface DriverLocationDrawerProps {
  open: boolean;
  onClose: () => void;
  data: Driver;
  onSave: (values: UpdateDriverInput) => void;
}

export const DriverLocationDrawer: React.FC<DriverLocationDrawerProps> = ({
  open,
  onClose,
  data,
  onSave,
}) => (
  <EditDrawer
    open={open}
    onClose={onClose}
    title="Edit Driver Location"
    subtitle={data.name}
  >
    <Formik
      initialValues={{
        currentCity: data.currentCity ?? '',
        currentState: data.currentState ?? '',
        homeBaseCity: data.homeBaseCity ?? '',
        homeBaseState: data.homeBaseState ?? '',
        availableHours: data.availableHours ?? '',
        maxDaysOut: data.maxDaysOut ?? '',
      }}
      validationSchema={driverLocationSchema}
      onSubmit={(values, { setSubmitting }) => {
        const transformed: UpdateDriverInput = {
          currentCity: values.currentCity || null,
          currentState: values.currentState || null,
          homeBaseCity: values.homeBaseCity || null,
          homeBaseState: values.homeBaseState || null,
          availableHours: values.availableHours || null,
          maxDaysOut: values.maxDaysOut !== '' ? Number(values.maxDaysOut) : null,
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
            {/* Current Location */}
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
              Current Location
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="currentCity"
                  label="City"
                  value={values.currentCity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.currentCity && Boolean(errors.currentCity)}
                  helperText={touched.currentCity && errors.currentCity}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="currentState"
                  label="State"
                  value={values.currentState}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.currentState && Boolean(errors.currentState)}
                  helperText={touched.currentState && errors.currentState}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 0.5 }} />

            {/* Home Base */}
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
              Home Base
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="homeBaseCity"
                  label="City"
                  value={values.homeBaseCity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.homeBaseCity && Boolean(errors.homeBaseCity)}
                  helperText={touched.homeBaseCity && errors.homeBaseCity}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="homeBaseState"
                  label="State"
                  value={values.homeBaseState}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.homeBaseState && Boolean(errors.homeBaseState)}
                  helperText={touched.homeBaseState && errors.homeBaseState}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 0.5 }} />

            {/* Availability */}
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
              Availability
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="availableHours"
                  label="Available Hours"
                  value={values.availableHours}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.availableHours && Boolean(errors.availableHours)}
                  helperText={touched.availableHours && errors.availableHours}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="maxDaysOut"
                  label="Max Days Out"
                  value={values.maxDaysOut}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.maxDaysOut && Boolean(errors.maxDaysOut)}
                  helperText={touched.maxDaysOut && errors.maxDaysOut}
                />
              </Grid>
            </Grid>

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
