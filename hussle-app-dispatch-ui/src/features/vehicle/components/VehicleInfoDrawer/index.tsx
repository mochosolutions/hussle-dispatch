import React from 'react';
import { Divider, Grid, Stack } from '@mui/material';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { TextField } from '../../../../mocho/components/form-fields/TextField';
import { SelectField } from '../../../../mocho/components/form-fields/SelectField';
import { DrawerSection } from 'components/EditDrawer';
import { vehicleInfoSchema } from '../../validators/vehicleInfoSchema';
import type { Vehicle, UpdateVehicleInput } from 'features/carrier/types';
import { VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';

interface VehicleInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  data: Vehicle;
  onSave: (values: UpdateVehicleInput) => void;
}

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

  const vehicleTypeOptions = Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const ownershipOptions = Object.entries(OWNERSHIP_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

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
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          {/* Vehicle Details */}
          <DrawerSection label="Vehicle Details">
            <TextField name="unitNumber" label="Unit Number" formik={formik} />
            <SelectField name="type" label="Type" data={vehicleTypeOptions} formik={formik} />
            <SelectField
              name="ownership"
              label="Ownership"
              data={ownershipOptions}
              formik={formik}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField name="make" label="Make" formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <TextField name="model" label="Model" formik={formik} />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField name="year" label="Year" formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <TextField name="vin" label="VIN" formik={formik} />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField name="licensePlate" label="License Plate" formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <TextField name="licensePlateState" label="License Plate State" formik={formik} />
              </Grid>
            </Grid>
          </DrawerSection>

          <Divider sx={{ my: 0.5 }} />

          {/* Targets */}
          <DrawerSection label="Targets">
            <TextField
              name="monthlyGrossTarget"
              label="Monthly Gross Target ($)"
              formik={formik}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  name="monthlyMilesTarget"
                  label="Miles Target / Month"
                  type="number"
                  formik={formik}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="workingDaysPerMonth"
                  label="Working Days / Month"
                  type="number"
                  formik={formik}
                />
              </Grid>
            </Grid>
          </DrawerSection>

          <Divider sx={{ my: 0.5 }} />

          {/* Emergency Contact */}
          <DrawerSection label="Emergency Contact">
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField name="emergencyContactName" label="Contact Name" formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="emergencyContactPhone"
                  label="Contact Phone"
                  type="tel"
                  formik={formik}
                />
              </Grid>
            </Grid>
          </DrawerSection>

          <Divider sx={{ my: 0.5 }} />

          {/* Other */}
          <DrawerSection label="Other">
            <TextField name="warrantyInfo" label="Warranty Info" formik={formik} />
            <TextField name="notes" label="Notes" formik={formik} multiline minRows={3} />
          </DrawerSection>
        </Stack>
      )}
    </FormDrawer>
  );
};
