import React from 'react';
import { Grid, Stack } from '@mui/material';
import { TextField, SelectField } from '@mocho/ui/components';
import { useDispatch } from 'store';
import type { VehicleType, VehicleOwnership } from 'features/carrier/types';
import { createVehicleRequest } from '../../store/reducers';
import { vehicleInfoSchema } from '../../validators/vehicleInfoSchema';
import { VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';
import CarrierAutocomplete from 'features/carrier/components/CarrierAutocomplete';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';

interface VehicleCreateDrawerProps {
  onClose: () => void;
  initialCarrierId?: string;
}

const vehicleTypeOptions = Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const ownershipOptions = Object.entries(OWNERSHIP_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const INITIAL_VALUES = {
  carrierId: '',
  unitNumber: '',
  type: 'DRY_VAN' as VehicleType,
  ownership: 'OWNED' as VehicleOwnership,
  make: '',
  model: '',
  year: '',
  vin: '',
};

export const VehicleCreateDrawer: React.FC<VehicleCreateDrawerProps> = ({
  onClose,
  initialCarrierId,
}) => {
  const dispatch = useDispatch();

  const initialValues = initialCarrierId
    ? { ...INITIAL_VALUES, carrierId: initialCarrierId }
    : INITIAL_VALUES;

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Create Vehicle"
      initialValues={initialValues}
      validationSchema={vehicleInfoSchema}
      onSubmit={(values) => {
        const { carrierId, year, ...rest } = values;
        dispatch(
          createVehicleRequest({
            data: {
              ...rest,
              ...(carrierId ? { carrierId } : {}),
              ...(year ? { year: Number(year) } : {}),
            },
          }),
        );
      }}
      saveLabel="Create"
      savingLabel="Creating…"
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <CarrierAutocomplete
            value={formik.values.carrierId}
            onChange={(carrierId) => {
              void formik.setFieldValue('carrierId', carrierId);
            }}
            onBlur={() => {
              void formik.setFieldTouched('carrierId', true);
            }}
            label="Carrier"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="unitNumber" label="Unit Number" formik={formik} required />
            </Grid>
            <Grid item xs={6}>
              <SelectField
                name="type"
                label="Vehicle Type"
                data={vehicleTypeOptions}
                formik={formik}
              />
            </Grid>
          </Grid>
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
        </Stack>
      )}
    </FormDrawer>
  );
};
