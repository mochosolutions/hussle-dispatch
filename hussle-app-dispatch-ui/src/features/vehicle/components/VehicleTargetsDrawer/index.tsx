import React from 'react';
import { Stack } from '@mui/material';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { CurrencyField, NumericField } from '@mocho/ui/components';
import { vehicleTargetsSchema } from '../../validators/vehicleTargetsSchema';
import type { UpdateVehicleInput } from 'features/carrier/types';
import { useDispatch, useSelector } from 'store';
import { selectVehicleById } from '../../store/selectors/vehicleSelectors';
import { updateVehicleRequest } from '../../store/reducers';

interface VehicleTargetsDrawerProps {
  vehicleId: string;
  onClose: () => void;
}

export const VehicleTargetsDrawer: React.FC<VehicleTargetsDrawerProps> = ({
  vehicleId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const vehicle = useSelector(selectVehicleById(vehicleId));

  if (!vehicle) {
    return null;
  }

  const handleSubmit = (values: {
    monthlyGrossTarget: string | null | undefined;
    monthlyMilesTarget: number | null | undefined;
    workingDaysPerMonth: number | null | undefined;
  }) => {
    const transformed: UpdateVehicleInput = {
      monthlyGrossTarget:
        values.monthlyGrossTarget !== '' ? String(values.monthlyGrossTarget) : null,
      monthlyMilesTarget:
        values.monthlyMilesTarget !== '' ? Number(values.monthlyMilesTarget) : null,
      workingDaysPerMonth:
        values.workingDaysPerMonth !== '' ? Number(values.workingDaysPerMonth) : null,
    };
    dispatch(updateVehicleRequest({ id: vehicleId, data: transformed }));
    onClose();
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Vehicle Targets"
      subtitle={vehicle.unitNumber}
      initialValues={{
        monthlyGrossTarget: vehicle.monthlyGrossTarget ?? '',
        monthlyMilesTarget: vehicle.monthlyMilesTarget ?? '',
        workingDaysPerMonth: vehicle.workingDaysPerMonth ?? '',
      }}
      validationSchema={vehicleTargetsSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <CurrencyField name="monthlyGrossTarget" label="Monthly Gross Target" formik={formik} />
          <NumericField
            name="monthlyMilesTarget"
            label="Monthly Miles Target"
            suffix="mi"
            formik={formik}
          />
          <NumericField name="workingDaysPerMonth" label="Working Days Per Month" formik={formik} />
        </Stack>
      )}
    </FormDrawer>
  );
};
