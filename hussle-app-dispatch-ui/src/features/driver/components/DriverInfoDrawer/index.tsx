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
import { driverInfoSchema } from '../../validators/driverInfoSchema';
import type { Driver, UpdateDriverInput } from 'features/carrier/types';

interface DriverInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  data: Driver;
  onSave: (values: UpdateDriverInput) => void;
}

const sectionLabelSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

export const DriverInfoDrawer: React.FC<DriverInfoDrawerProps> = ({
  open,
  onClose,
  data,
  onSave,
}) => (
  <EditDrawer
    open={open}
    onClose={onClose}
    title="Edit Driver Information"
    subtitle={data.name}
  >
    <Formik
      initialValues={{
        name: data.name,
        phone: data.phone ?? '',
        email: data.email ?? '',
        cdlNumber: data.cdlNumber ?? '',
        cdlState: data.cdlState ?? '',
        cdlExpiry: data.cdlExpiry ?? '',
        notes: data.notes ?? '',
      }}
      validationSchema={driverInfoSchema}
      onSubmit={(values, { setSubmitting }) => {
        onSave(values);
        setSubmitting(false);
        onClose();
      }}
      enableReinitialize
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting, isValid, dirty }) => (
        <Form>
          <Stack spacing={2.5}>
            {/* Personal Info */}
            <Typography variant="subtitle2" sx={sectionLabelSx}>
              Personal Info
            </Typography>
            <TextField
              fullWidth
              name="name"
              label="Full Name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.name && Boolean(errors.name)}
              helperText={touched.name && errors.name}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Phone"
                  type="tel"
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.phone && Boolean(errors.phone)}
                  helperText={touched.phone && errors.phone}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 0.5 }} />

            {/* CDL Information */}
            <Typography variant="subtitle2" sx={sectionLabelSx}>
              CDL Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="cdlNumber"
                  label="CDL Number"
                  value={values.cdlNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.cdlNumber && Boolean(errors.cdlNumber)}
                  helperText={touched.cdlNumber && errors.cdlNumber}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="cdlState"
                  label="CDL State"
                  value={values.cdlState}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.cdlState && Boolean(errors.cdlState)}
                  helperText={touched.cdlState && errors.cdlState}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              name="cdlExpiry"
              label="CDL Expiry"
              type="date"
              value={values.cdlExpiry}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.cdlExpiry && Boolean(errors.cdlExpiry)}
              helperText={touched.cdlExpiry && errors.cdlExpiry}
              InputLabelProps={{ shrink: true }}
            />

            <Divider sx={{ my: 0.5 }} />

            {/* Notes */}
            <Typography variant="subtitle2" sx={sectionLabelSx}>
              Notes
            </Typography>
            <TextField
              fullWidth
              name="notes"
              label="Notes"
              multiline
              minRows={3}
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
