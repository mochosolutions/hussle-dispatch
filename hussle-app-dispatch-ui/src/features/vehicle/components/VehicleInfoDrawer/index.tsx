import React from 'react';
import { Typography, TextField, Divider, Grid, Stack, MenuItem } from '@mui/material';
import { FormDrawer } from 'mocho/components/FormDrawer';
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
}) => {
  const initialValues = {
    unitNumber: data.unitNumber,
    make: data.make ?? '',
    model: data.model ?? '',
    year: data.year ?? '',
    vin: data.vin ?? '',
    licensePlate: data.licensePlate ?? '',
    licensePlateState: data.licensePlateState ?? '',
    type: data.type,
    ownership: data.ownership,
    monthlyGrossTarget: data.monthlyGrossTarget ?? '',
    monthlyMilesTarget: data.monthlyMilesTarget ?? '',
    workingDaysPerMonth: data.workingDaysPerMonth ?? '',
    emergencyContactName: data.emergencyContactName ?? '',
    emergencyContactPhone: data.emergencyContactPhone ?? '',
    warrantyInfo: data.warrantyInfo ?? '',
    notes: data.notes ?? '',
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Edit Vehicle Information"
      subtitle={data.unitNumber}
      initialValues={initialValues}
      validationSchema={vehicleInfoSchema}
      onSubmit={(values) => {
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
          monthlyGrossTarget:
            values.monthlyGrossTarget !== '' ? String(values.monthlyGrossTarget) : null,
          monthlyMilesTarget:
            values.monthlyMilesTarget !== '' ? Number(values.monthlyMilesTarget) : null,
          workingDaysPerMonth:
            values.workingDaysPerMonth !== '' ? Number(values.workingDaysPerMonth) : null,
          emergencyContactName: values.emergencyContactName || null,
          emergencyContactPhone: values.emergencyContactPhone || null,
          warrantyInfo: values.warrantyInfo || null,
          notes: values.notes || null,
        };
        onSave(transformed);
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur }) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
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
            error={Boolean(touched.unitNumber && errors.unitNumber)}
            helperText={touched.unitNumber ? (errors.unitNumber as string | undefined) : undefined}
          />
          <TextField
            fullWidth
            select
            name="type"
            label="Type"
            value={values.type}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touched.type && errors.type)}
            helperText={touched.type ? (errors.type as string | undefined) : undefined}
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
            error={Boolean(touched.ownership && errors.ownership)}
            helperText={touched.ownership ? (errors.ownership as string | undefined) : undefined}
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
                error={Boolean(touched.make && errors.make)}
                helperText={touched.make ? (errors.make as string | undefined) : undefined}
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
                error={Boolean(touched.model && errors.model)}
                helperText={touched.model ? (errors.model as string | undefined) : undefined}
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
                error={Boolean(touched.year && errors.year)}
                helperText={touched.year ? (errors.year as string | undefined) : undefined}
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
                error={Boolean(touched.vin && errors.vin)}
                helperText={touched.vin ? (errors.vin as string | undefined) : undefined}
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
                error={Boolean(touched.licensePlate && errors.licensePlate)}
                helperText={
                  touched.licensePlate
                    ? (errors.licensePlate as string | undefined)
                    : undefined
                }
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
                error={Boolean(touched.licensePlateState && errors.licensePlateState)}
                helperText={
                  touched.licensePlateState
                    ? (errors.licensePlateState as string | undefined)
                    : undefined
                }
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }} />

          {/* Targets */}
          <Typography variant="subtitle2" sx={sectionHeaderSx}>
            Targets
          </Typography>
          <TextField
            fullWidth
            name="monthlyGrossTarget"
            label="Monthly Gross Target ($)"
            value={values.monthlyGrossTarget}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(touched.monthlyGrossTarget && errors.monthlyGrossTarget)}
            helperText={
              touched.monthlyGrossTarget
                ? (errors.monthlyGrossTarget as string | undefined)
                : undefined
            }
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="monthlyMilesTarget"
                label="Miles Target / Month"
                type="number"
                value={values.monthlyMilesTarget}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.monthlyMilesTarget && errors.monthlyMilesTarget)}
                helperText={
                  touched.monthlyMilesTarget
                    ? (errors.monthlyMilesTarget as string | undefined)
                    : undefined
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="workingDaysPerMonth"
                label="Working Days / Month"
                type="number"
                value={values.workingDaysPerMonth}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.workingDaysPerMonth && errors.workingDaysPerMonth)}
                helperText={
                  touched.workingDaysPerMonth
                    ? (errors.workingDaysPerMonth as string | undefined)
                    : undefined
                }
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
                error={Boolean(touched.emergencyContactName && errors.emergencyContactName)}
                helperText={
                  touched.emergencyContactName
                    ? (errors.emergencyContactName as string | undefined)
                    : undefined
                }
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
                error={Boolean(
                  touched.emergencyContactPhone && errors.emergencyContactPhone,
                )}
                helperText={
                  touched.emergencyContactPhone
                    ? (errors.emergencyContactPhone as string | undefined)
                    : undefined
                }
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
            error={Boolean(touched.warrantyInfo && errors.warrantyInfo)}
            helperText={
              touched.warrantyInfo
                ? (errors.warrantyInfo as string | undefined)
                : undefined
            }
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
            error={Boolean(touched.notes && errors.notes)}
            helperText={touched.notes ? (errors.notes as string | undefined) : undefined}
          />
        </Stack>
      )}
    </FormDrawer>
  );
};
