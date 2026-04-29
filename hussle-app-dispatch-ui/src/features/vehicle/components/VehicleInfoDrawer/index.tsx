import React from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { FormDrawer } from 'mocho/components/FormDrawer';
import {
  TextField,
  SelectField,
  StateField,
  CurrencyField,
  NumericField,
  PhoneField,
} from '../../../../mocho/components';
import { DrawerSection } from 'components/EditDrawer';
import { vehicleInfoSchema } from '../../validators/vehicleInfoSchema';
import type { VehicleInfoFormValues } from '../../validators/vehicleInfoSchema';
import type { UpdateVehicleInput } from 'features/carrier/types';
import { VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';
import { useDispatch, useSelector } from 'store';
import { selectVehicleById } from '../../store/selectors/vehicleSelectors';
import { updateVehicleRequest } from '../../store/reducers';

interface VehicleInfoDrawerProps {
  vehicleId: string;
  onClose: () => void;
}

export const VehicleInfoDrawer: React.FC<VehicleInfoDrawerProps> = ({ vehicleId, onClose }) => {
  const dispatch = useDispatch();
  const vehicle = useSelector(selectVehicleById(vehicleId));

  if (!vehicle) {
    return null;
  }

  const initialValues: VehicleInfoFormValues = {
    unitNumber: vehicle.unitNumber,
    make: vehicle.make ?? '',
    model: vehicle.model ?? '',
    year: vehicle.year ?? '',
    vin: vehicle.vin ?? '',
    licensePlate: vehicle.licensePlate ?? '',
    licensePlateState: vehicle.licensePlateState ?? '',
    type: vehicle.type,
    ownership: vehicle.ownership,
    monthlyGrossTarget: vehicle.monthlyGrossTarget ?? '',
    monthlyMilesTarget: vehicle.monthlyMilesTarget ?? '',
    workingDaysPerMonth: vehicle.workingDaysPerMonth ?? '',
    emergencyContactName: vehicle.emergencyContactName ?? '',
    emergencyContactPhone: vehicle.emergencyContactPhone ?? '',
    warrantyInfo: vehicle.warrantyInfo ?? '',
    notes: vehicle.notes ?? '',
    carrierId: '',
  };

  const vehicleTypeOptions = Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const ownershipOptions = Object.entries(OWNERSHIP_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const handleSubmit = (values: typeof initialValues) => {
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
    dispatch(updateVehicleRequest({ id: vehicleId, data: transformed }));
    onClose();
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Vehicle Information"
      subtitle={vehicle.unitNumber}
      initialValues={initialValues}
      validationSchema={vehicleInfoSchema}
      onSubmit={handleSubmit}
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField name="make" label="Make" formik={formik} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField name="model" label="Model" formik={formik} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField name="year" label="Year" formik={formik} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField name="vin" label="VIN" formik={formik} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField name="licensePlate" label="License Plate" formik={formik} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <StateField name="licensePlateState" label="License Plate State" formik={formik} />
              </Box>
            </Box>
          </DrawerSection>

          <Divider sx={{ my: 0.5 }} />

          {/* Targets */}
          <DrawerSection label="Targets">
            <CurrencyField
              name="monthlyGrossTarget"
              label="Monthly Gross Target"
              formik={formik}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <NumericField
                  name="monthlyMilesTarget"
                  label="Miles Target / Month"
                  suffix="mi"
                  formik={formik}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <NumericField
                  name="workingDaysPerMonth"
                  label="Working Days / Month"
                  formik={formik}
                />
              </Box>
            </Box>
          </DrawerSection>

          <Divider sx={{ my: 0.5 }} />

          {/* Emergency Contact */}
          <DrawerSection label="Emergency Contact">
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField name="emergencyContactName" label="Contact Name" formik={formik} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <PhoneField
                  name="emergencyContactPhone"
                  label="Contact Phone"
                  formik={formik}
                />
              </Box>
            </Box>
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
