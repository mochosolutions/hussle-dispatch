import React from 'react';
import { Stack, TextField } from '@mui/material';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { vehicleTargetsSchema } from '../../validators/vehicleTargetsSchema';
import type { Vehicle, UpdateVehicleInput } from 'features/carrier/types';

interface VehicleTargetsDrawerProps {
  open: boolean;
  onClose: () => void;
  data: Vehicle;
  onSave: (values: UpdateVehicleInput) => void;
}

export const VehicleTargetsDrawer: React.FC<VehicleTargetsDrawerProps> = ({
  open,
  onClose,
  data,
  onSave,
}) => {
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
    onSave(transformed);
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Edit Vehicle Targets"
      subtitle={data.unitNumber}
      initialValues={{
        monthlyGrossTarget: data.monthlyGrossTarget ?? '',
        monthlyMilesTarget: data.monthlyMilesTarget ?? '',
        workingDaysPerMonth: data.workingDaysPerMonth ?? '',
      }}
      validationSchema={vehicleTargetsSchema}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, handleChange, handleBlur }) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
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
          <TextField
            fullWidth
            name="monthlyMilesTarget"
            label="Monthly Miles Target"
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
          <TextField
            fullWidth
            name="workingDaysPerMonth"
            label="Working Days Per Month"
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
        </Stack>
      )}
    </FormDrawer>
  );
};
