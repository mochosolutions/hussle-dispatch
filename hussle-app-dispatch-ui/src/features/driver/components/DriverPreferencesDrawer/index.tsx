import React from 'react';
import { FieldArray } from 'formik';
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { NumericField, TextField as MochoTextField, StateField } from '@mocho/ui/components';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { useDispatch, useSelector } from 'store';
import getDriverDisplayName from 'utils/getDriverDisplayName';
import { driverPreferencesSchema } from '../../validators/driverPreferencesSchema';
import type { DriverPreferencesFormValues } from '../../validators/driverPreferencesSchema';
import { selectDriverWithCarrier } from '../../store/selectors/driverSelectors';
import { updateDriverRequest } from '../../store/reducers';

interface DriverPreferencesDrawerProps {
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

export const DriverPreferencesDrawer: React.FC<DriverPreferencesDrawerProps> = ({
  driverId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const driverSelector = React.useMemo(() => selectDriverWithCarrier(driverId), [driverId]);
  const driver = useSelector(driverSelector);

  if (!driver) {
    return null;
  }

  const initialValues: DriverPreferencesFormValues = {
    preferredLanes: driver.preferredLanes.map((lane) => ({
      originState: lane.originState,
      destState: lane.destState,
      originCity: lane.originCity ?? '',
      destCity: lane.destCity ?? '',
    })),
    noGoZones: driver.noGoZones.map((zone) => ({
      state: zone.state,
      city: zone.city ?? '',
    })),
    maxDaysOut: driver.maxDaysOut ?? null,
  };

  const handleSubmit = (values: DriverPreferencesFormValues) => {
    dispatch(
      updateDriverRequest({
        id: driverId,
        data: {
          preferredLanes: values.preferredLanes.map((lane) => ({
            originState: lane.originState,
            destState: lane.destState,
            originCity: lane.originCity || null,
            destCity: lane.destCity || null,
          })),
          noGoZones: values.noGoZones.map((zone) => ({
            state: zone.state,
            city: zone.city || null,
          })),
          maxDaysOut: values.maxDaysOut,
        },
      }),
    );
  };

  return (
    <FormDrawer<DriverPreferencesFormValues>
      open
      onClose={onClose}
      title="Edit Driver Preferences"
      subtitle={getDriverDisplayName(driver)}
      initialValues={initialValues}
      validationSchema={driverPreferencesSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          {/* Preferred Lanes */}
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Preferred Lanes
          </Typography>
          <FieldArray name="preferredLanes">
            {({ push, remove }) => (
              <Stack spacing={2}>
                {formik.values.preferredLanes.map((_lane, index) => (
                  <Box key={`lane-${String(index)}`}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ flex: 3 }}>
                        <MochoTextField
                          name={`preferredLanes.${index}.originCity`}
                          label="Origin City"
                          formik={formik}
                        />
                      </Box>
                      <Box sx={{ flex: 2.5 }}>
                        <StateField
                          name={`preferredLanes.${index}.originState`}
                          label="Origin State"
                          formik={formik}
                        />
                      </Box>
                      <Box sx={{ flex: 3 }}>
                        <MochoTextField
                          name={`preferredLanes.${index}.destCity`}
                          label="Dest City"
                          formik={formik}
                        />
                      </Box>
                      <Box sx={{ flex: 2.5 }}>
                        <StateField
                          name={`preferredLanes.${index}.destState`}
                          label="Dest State"
                          formik={formik}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 1 }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => remove(index)}
                          aria-label={`Remove lane ${index + 1}`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                ))}
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    push({ originState: '', destState: '', originCity: '', destCity: '' })
                  }
                >
                  Add Lane
                </Button>
              </Stack>
            )}
          </FieldArray>

          <Divider sx={{ my: 0.5 }} />

          {/* No-Go Zones */}
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            No-Go Zones
          </Typography>
          <FieldArray name="noGoZones">
            {({ push, remove }) => (
              <Stack spacing={2}>
                {formik.values.noGoZones.map((_zone, index) => (
                  <Box key={`zone-${String(index)}`}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ flex: 5 }}>
                        <StateField
                          name={`noGoZones.${index}.state`}
                          label="State"
                          formik={formik}
                        />
                      </Box>
                      <Box sx={{ flex: 5 }}>
                        <MochoTextField
                          name={`noGoZones.${index}.city`}
                          label="City"
                          formik={formik}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 1 }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => remove(index)}
                          aria-label={`Remove zone ${index + 1}`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                ))}
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => push({ state: '', city: '' })}
                >
                  Add Zone
                </Button>
              </Stack>
            )}
          </FieldArray>

          <Divider sx={{ my: 0.5 }} />

          {/* Availability */}
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Availability
          </Typography>
          <NumericField name="maxDaysOut" label="Max Days Out" formik={formik} />
        </Stack>
      )}
    </FormDrawer>
  );
};
