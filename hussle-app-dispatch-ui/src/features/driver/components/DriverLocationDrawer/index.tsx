import React from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { TextField as MochoTextField, StateField, NumericField } from '@mocho/ui/components';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { useDispatch, useSelector } from 'store';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import { driverLocationSchema } from '../../validators/driverLocationSchema';
import type { DriverLocationFormValues } from '../../validators/driverLocationSchema';
import { selectDriverWithCarrier } from '../../store/selectors/driverSelectors';
import { updateDriverRequest } from '../../store/reducers';

interface DriverLocationDrawerProps {
  driverId: string;
  onClose: () => void;
}

const sectionLabelSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

export const DriverLocationDrawer: React.FC<DriverLocationDrawerProps> = ({
  driverId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const driverSelector = React.useMemo(() => selectDriverWithCarrier(driverId), [driverId]);
  const driver = useSelector(driverSelector);

  if (!driver) {
    return null;
  }

  const initialValues: DriverLocationFormValues = {
    currentCity: driver.currentCity ?? '',
    currentState: driver.currentState ?? '',
    homeBaseCity: driver.homeBaseCity ?? '',
    homeBaseState: driver.homeBaseState ?? '',
    availableHours: driver.availableHours ?? '',
    maxDaysOut: driver.maxDaysOut ?? null,
  };

  const handleSubmit = (values: DriverLocationFormValues) => {
    dispatch(
      updateDriverRequest({
        id: driverId,
        data: {
          currentCity: values.currentCity || null,
          currentState: values.currentState || null,
          homeBaseCity: values.homeBaseCity || null,
          homeBaseState: values.homeBaseState || null,
          availableHours: values.availableHours || null,
          maxDaysOut: values.maxDaysOut ?? null,
        },
      }),
    );
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Driver Location"
      subtitle={getDriverDisplayName(driver)}
      initialValues={initialValues}
      validationSchema={driverLocationSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          {/* Current Location */}
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Current Location
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <MochoTextField name="currentCity" label="City" formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <StateField name="currentState" label="State" formik={formik} />
            </Box>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* Home Base */}
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Home Base
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <MochoTextField name="homeBaseCity" label="City" formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <StateField name="homeBaseState" label="State" formik={formik} />
            </Box>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* Availability */}
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Availability
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <MochoTextField name="availableHours" label="Available Hours" formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <NumericField name="maxDaysOut" label="Max Days Out" formik={formik} />
            </Box>
          </Box>
        </Stack>
      )}
    </FormDrawer>
  );
};
