import React from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { SectionLabel } from 'components/Typography';
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
          <SectionLabel sx={{ display: 'block' }}>
            Current Location
          </SectionLabel>
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
          <SectionLabel sx={{ display: 'block' }}>
            Home Base
          </SectionLabel>
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
          <SectionLabel sx={{ display: 'block' }}>
            Availability
          </SectionLabel>
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
