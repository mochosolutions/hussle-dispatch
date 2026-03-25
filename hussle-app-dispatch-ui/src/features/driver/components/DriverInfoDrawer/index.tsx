import React from 'react';
import {
  Autocomplete,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import type { FormikProps } from 'formik';
import { FormDrawer } from 'mocho/components/FormDrawer';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import { driverInfoSchema } from '../../validators/driverInfoSchema';
import type { DriverInfoFormValues } from '../../validators/driverInfoSchema';
import {
  DRIVER_LICENSE_TYPE_OPTIONS,
  ENDORSEMENT_OPTIONS,
} from 'features/carrier/types';
import type { Driver, EndorsementCode, UpdateDriverInput } from 'features/carrier/types';

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
      licenseType: data.licenseType ?? 'CLASS_D',
      licenseNumber: data.licenseNumber ?? '',
      licenseState: data.licenseState ?? '',
      licenseExpiry: data.licenseExpiry ?? '',
      endorsements: data.endorsements ?? ([] as EndorsementCode[]),
      homeBaseCity: data.homeBaseCity ?? '',
      homeBaseState: data.homeBaseState ?? '',
      notes: data.notes ?? '',
    }}
    validationSchema={driverInfoSchema}
    onSubmit={(values) => {
      onSave(values);
    }}
  >
    {({ values, errors, touched, handleChange, handleBlur, setFieldValue }: FormikProps<DriverInfoFormValues>) => (
      <Stack spacing={2.5} sx={{ p: 3 }}>
        {/* Personal Info */}
        <Typography variant="subtitle2" sx={sectionLabelSx}>
          Personal Info
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <MuiTextField
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
            <MuiTextField
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
            <MuiTextField
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
            <MuiTextField
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

        {/* License Information */}
        <Typography variant="subtitle2" sx={sectionLabelSx}>
          License Information
        </Typography>
        <Select
          fullWidth
          name="licenseType"
          value={values.licenseType}
          onChange={handleChange}
          onBlur={handleBlur}
        >
          {DRIVER_LICENSE_TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <MuiTextField
              fullWidth
              name="licenseNumber"
              label="License Number"
              value={values.licenseNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.licenseNumber && Boolean(errors.licenseNumber)}
              helperText={touched.licenseNumber && errors.licenseNumber}
            />
          </Grid>
          <Grid item xs={6}>
            <MuiTextField
              fullWidth
              name="licenseState"
              label="License State"
              value={values.licenseState}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.licenseState && Boolean(errors.licenseState)}
              helperText={touched.licenseState && errors.licenseState}
            />
          </Grid>
        </Grid>
        <MuiTextField
          fullWidth
          name="licenseExpiry"
          label="License Expiry"
          type="date"
          value={values.licenseExpiry}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.licenseExpiry && Boolean(errors.licenseExpiry)}
          helperText={touched.licenseExpiry && errors.licenseExpiry}
          InputLabelProps={{ shrink: true }}
        />
        {String(values.licenseType).startsWith('CDL_') && (
          <Autocomplete
            multiple
            options={ENDORSEMENT_OPTIONS}
            getOptionLabel={(opt) => `${opt.value} — ${opt.label}`}
            value={ENDORSEMENT_OPTIONS.filter((o) =>
              ((values.endorsements as EndorsementCode[]) ?? []).includes(o.value),
            )}
            onChange={(_, selected) => {
              void setFieldValue(
                'endorsements',
                selected.map((s) => s.value),
              );
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.value}
                  label={option.value}
                  size="small"
                />
              ))
            }
            renderInput={(params) => <MuiTextField {...params} label="Endorsements" />}
          />
        )}

        <Divider sx={{ my: 0.5 }} />

        {/* Home Base */}
        <Typography variant="subtitle2" sx={sectionLabelSx}>
          Home Base
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <MuiTextField
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
            <MuiTextField
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
        <MuiTextField
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
