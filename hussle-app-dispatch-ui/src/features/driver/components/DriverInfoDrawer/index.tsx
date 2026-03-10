import React from 'react';
import { TextField, Divider, Grid, Stack, Typography } from '@mui/material';
import type { FormikProps } from 'formik';
import { FormDrawer } from 'mocho/components/FormDrawer';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import { driverInfoSchema } from '../../validators/driverInfoSchema';
import type { DriverInfoFormValues } from '../../validators/driverInfoSchema';
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
  <FormDrawer
    open={open}
    onClose={onClose}
    title="Edit Driver Information"
    subtitle={getDriverDisplayName(data)}
    initialValues={{
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? '',
      email: data.email ?? '',
      cdlNumber: data.cdlNumber ?? '',
      cdlState: data.cdlState ?? '',
      cdlExpiry: data.cdlExpiry ?? '',
      homeBaseCity: data.homeBaseCity ?? '',
      homeBaseState: data.homeBaseState ?? '',
      notes: data.notes ?? '',
    }}
    validationSchema={driverInfoSchema}
    onSubmit={(values) => {
      onSave(values);
    }}
  >
    {({ values, errors, touched, handleChange, handleBlur }: FormikProps<DriverInfoFormValues>) => (
      <Stack spacing={2.5} sx={{ p: 3 }}>
        {/* Personal Info */}
        <Typography variant="subtitle2" sx={sectionLabelSx}>
          Personal Info
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="firstName"
              label="First Name"
              value={values.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.firstName && Boolean(errors.firstName)}
              helperText={touched.firstName && errors.firstName}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="lastName"
              label="Last Name"
              value={values.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.lastName && Boolean(errors.lastName)}
              helperText={touched.lastName && errors.lastName}
            />
          </Grid>
        </Grid>
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

        {/* Home Base */}
        <Typography variant="subtitle2" sx={sectionLabelSx}>
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
      </Stack>
    )}
  </FormDrawer>
);
