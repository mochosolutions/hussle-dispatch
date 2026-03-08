import React from 'react';
import { Formik, Form, FieldArray } from 'formik';
import type { FormikErrors, FormikTouched } from 'formik';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  CircularProgress,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { EditDrawer } from 'features/carrier/components/EditDrawer';
import { driverPreferencesSchema } from '../../validators/driverPreferencesSchema';
import type { Driver, UpdateDriverInput, DriverPreferredLane, DriverNoGoZone } from 'features/carrier/types';

interface DriverPreferencesDrawerProps {
  open: boolean;
  onClose: () => void;
  data: Driver;
  onSave: (values: UpdateDriverInput) => void;
}

interface PreferencesFormValues {
  preferredLanes: DriverPreferredLane[];
  noGoZones: DriverNoGoZone[];
  maxDaysOut: number | '';
}

const sectionLabelSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

const getLaneError = (
  errors: FormikErrors<PreferencesFormValues>,
  index: number,
  field: keyof DriverPreferredLane,
): string | undefined => {
  const lanesErrors = errors.preferredLanes;
  if (!Array.isArray(lanesErrors)) {
    return undefined;
  }
  const laneError = lanesErrors[index];
  if (typeof laneError === 'object' && laneError !== null) {
    const value = (laneError as FormikErrors<DriverPreferredLane>)[field];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
};

const getLaneTouched = (
  touched: FormikTouched<PreferencesFormValues>,
  index: number,
  field: keyof DriverPreferredLane,
): boolean => {
  const lanesTouched = touched.preferredLanes;
  if (!Array.isArray(lanesTouched)) {
    return false;
  }
  const laneTouched = lanesTouched[index];
  if (typeof laneTouched === 'object' && laneTouched !== null) {
    return Boolean(laneTouched[field]);
  }
  return false;
};

const getZoneError = (
  errors: FormikErrors<PreferencesFormValues>,
  index: number,
  field: keyof DriverNoGoZone,
): string | undefined => {
  const zonesErrors = errors.noGoZones;
  if (!Array.isArray(zonesErrors)) {
    return undefined;
  }
  const zoneError = zonesErrors[index];
  if (typeof zoneError === 'object' && zoneError !== null) {
    const value = (zoneError as FormikErrors<DriverNoGoZone>)[field];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
};

const getZoneTouched = (
  touched: FormikTouched<PreferencesFormValues>,
  index: number,
  field: keyof DriverNoGoZone,
): boolean => {
  const zonesTouched = touched.noGoZones;
  if (!Array.isArray(zonesTouched)) {
    return false;
  }
  const zoneTouched = zonesTouched[index];
  if (typeof zoneTouched === 'object' && zoneTouched !== null) {
    return Boolean(zoneTouched[field]);
  }
  return false;
};

export const DriverPreferencesDrawer: React.FC<DriverPreferencesDrawerProps> = ({
  open,
  onClose,
  data,
  onSave,
}) => (
  <EditDrawer
    open={open}
    onClose={onClose}
    title="Edit Driver Preferences"
    subtitle={data.name}
  >
    <Formik<PreferencesFormValues>
      initialValues={{
        preferredLanes: data.preferredLanes.map((lane) => ({
          originState: lane.originState,
          destState: lane.destState,
          originCity: lane.originCity ?? '',
          destCity: lane.destCity ?? '',
        })),
        noGoZones: data.noGoZones.map((zone) => ({
          state: zone.state,
          city: zone.city ?? '',
        })),
        maxDaysOut: data.maxDaysOut ?? '',
      }}
      validationSchema={driverPreferencesSchema}
      onSubmit={(values, { setSubmitting }) => {
        onSave({
          preferredLanes: values.preferredLanes,
          noGoZones: values.noGoZones,
          maxDaysOut: values.maxDaysOut === '' ? null : values.maxDaysOut,
        });
        setSubmitting(false);
        onClose();
      }}
      enableReinitialize
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting, isValid, dirty }) => (
        <Form>
          <Stack spacing={2.5}>
            {/* Preferred Lanes */}
            <Typography variant="subtitle2" sx={sectionLabelSx}>
              Preferred Lanes
            </Typography>
            <FieldArray name="preferredLanes">
              {({ push, remove }) => (
                <Stack spacing={2}>
                  {values.preferredLanes.map((lane, index) => (
                    <Box key={index}>
                      <Grid container spacing={1} alignItems="flex-start">
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            size="small"
                            name={`preferredLanes.${index}.originCity`}
                            label="Origin City"
                            value={lane.originCity}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={
                              getLaneTouched(touched, index, 'originCity') &&
                              Boolean(getLaneError(errors, index, 'originCity'))
                            }
                            helperText={
                              getLaneTouched(touched, index, 'originCity') &&
                              getLaneError(errors, index, 'originCity')
                            }
                          />
                        </Grid>
                        <Grid item xs={2.5}>
                          <TextField
                            fullWidth
                            size="small"
                            name={`preferredLanes.${index}.originState`}
                            label="Origin State"
                            value={lane.originState}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={
                              getLaneTouched(touched, index, 'originState') &&
                              Boolean(getLaneError(errors, index, 'originState'))
                            }
                            helperText={
                              getLaneTouched(touched, index, 'originState') &&
                              getLaneError(errors, index, 'originState')
                            }
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            size="small"
                            name={`preferredLanes.${index}.destCity`}
                            label="Dest City"
                            value={lane.destCity}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={
                              getLaneTouched(touched, index, 'destCity') &&
                              Boolean(getLaneError(errors, index, 'destCity'))
                            }
                            helperText={
                              getLaneTouched(touched, index, 'destCity') &&
                              getLaneError(errors, index, 'destCity')
                            }
                          />
                        </Grid>
                        <Grid item xs={2.5}>
                          <TextField
                            fullWidth
                            size="small"
                            name={`preferredLanes.${index}.destState`}
                            label="Dest State"
                            value={lane.destState}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={
                              getLaneTouched(touched, index, 'destState') &&
                              Boolean(getLaneError(errors, index, 'destState'))
                            }
                            helperText={
                              getLaneTouched(touched, index, 'destState') &&
                              getLaneError(errors, index, 'destState')
                            }
                          />
                        </Grid>
                        <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => remove(index)}
                            aria-label={`Remove lane ${index + 1}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
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
                  {values.noGoZones.map((zone, index) => (
                    <Box key={index}>
                      <Grid container spacing={1} alignItems="flex-start">
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            size="small"
                            name={`noGoZones.${index}.state`}
                            label="State"
                            value={zone.state}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={
                              getZoneTouched(touched, index, 'state') &&
                              Boolean(getZoneError(errors, index, 'state'))
                            }
                            helperText={
                              getZoneTouched(touched, index, 'state') &&
                              getZoneError(errors, index, 'state')
                            }
                          />
                        </Grid>
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            size="small"
                            name={`noGoZones.${index}.city`}
                            label="City"
                            value={zone.city}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={
                              getZoneTouched(touched, index, 'city') &&
                              Boolean(getZoneError(errors, index, 'city'))
                            }
                            helperText={
                              getZoneTouched(touched, index, 'city') &&
                              getZoneError(errors, index, 'city')
                            }
                          />
                        </Grid>
                        <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => remove(index)}
                            aria-label={`Remove zone ${index + 1}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
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
            <TextField
              fullWidth
              name="maxDaysOut"
              label="Max Days Out"
              type="number"
              value={values.maxDaysOut}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.maxDaysOut && Boolean(errors.maxDaysOut)}
              helperText={touched.maxDaysOut && errors.maxDaysOut}
            />

            {/* Footer */}
            <Box
              sx={{
                pt: 2,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1.5,
                borderTop: 1,
                borderColor: 'divider',
                mt: 1,
              }}
            >
              <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!isValid || !dirty || isSubmitting}
                startIcon={
                  isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
                }
              >
                {isSubmitting ? 'Saving\u2026' : 'Save Changes'}
              </Button>
            </Box>
          </Stack>
        </Form>
      )}
    </Formik>
  </EditDrawer>
);
