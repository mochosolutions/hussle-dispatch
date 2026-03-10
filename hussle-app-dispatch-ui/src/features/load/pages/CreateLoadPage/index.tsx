import { useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import type { FormikProps, FieldArrayRenderProps } from 'formik';
import type { FormikFieldProps } from '@mocho/ui/forms';
import {
  MainCard,
  PageHeader,
  PageWrapper,
  TextField as MochoTextField,
  SelectField,
  DateField,
  TimeField,
  CheckboxField,
} from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import { createLoadRequest } from '../../store/reducers';
import { selectLoadCreateLoading } from '../../store/selectors/loadSelectors';
import { loadSchema } from '../../validators/loadSchema';
import type { LoadFormValues } from '../../validators/loadSchema';
import type { StopType } from '../../types';

// ---------------------------------------------------------------------------
// Intel Prefill type (from Load Intelligence booking flow)
// ---------------------------------------------------------------------------

interface IntelPrefill {
  originCity?: string;
  originState?: string;
  destinationCity?: string;
  destinationState?: string;
  rate?: number | null;
  miles?: number | null;
  equipmentType?: string;
  brokerName?: string | null;
  pickupDate?: string | null;
  minBookRate?: number | null;
}

interface IntelLocationState {
  intelPrefill?: IntelPrefill;
  intelLoadId?: string;
  backhaulData?: {
    route: string;
    rate: number | null;
    brokerName: string | null;
    pickupDate: string | null;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EQUIPMENT_OPTIONS = [
  { label: 'Dry Van', value: 'DRY_VAN' },
  { label: 'Reefer', value: 'REEFER' },
  { label: 'Flatbed', value: 'FLATBED' },
  { label: 'Step Deck', value: 'STEP_DECK' },
  { label: 'Box Truck', value: 'BOX_TRUCK' },
  { label: 'Hotshot', value: 'HOTSHOT' },
  { label: 'Power Only', value: 'POWER_ONLY' },
];

const STOP_TYPE_OPTIONS = [
  { label: 'Pickup', value: 'PICKUP' },
  { label: 'Delivery', value: 'DELIVERY' },
  { label: 'Stop Off', value: 'STOP_OFF' },
  { label: 'Drop Hook', value: 'DROP_HOOK' },
  { label: 'Live Unload', value: 'LIVE_UNLOAD' },
];

const SECTION_LABEL_SX = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
  mb: 1.5,
} as const;

const EMPTY_STOP = {
  type: 'PICKUP' as StopType,
  sequence: 0,
  facilityName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  appointmentDate: '',
  appointmentTime: '',
  appointmentNumber: '',
  contactName: '',
  contactPhone: '',
  notes: '',
};

// ---------------------------------------------------------------------------
// Stop Section
// ---------------------------------------------------------------------------

interface StopSectionProps {
  arrayHelpers: FieldArrayRenderProps;
  formikProps: FormikFieldProps<Record<string, unknown>>;
  stops: LoadFormValues['stops'];
}

const StopSection: React.FC<StopSectionProps> = ({ arrayHelpers, formikProps, stops }) => {
  const handleAddStop = useCallback(
    (type: StopType) => {
      arrayHelpers.push({
        ...EMPTY_STOP,
        type,
        sequence: (stops?.length ?? 0),
      });
    },
    [arrayHelpers, stops],
  );

  return (
    <MainCard>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Stops
          </Typography>
          <Chip label={stops?.length ?? 0} size="small" />
        </Stack>

        {stops?.map((_stop, index) => {
          const prefix = `stops[${index}]`;
          const stopFormik: FormikFieldProps<Record<string, unknown>> = {
            values: {
              type: formikProps.values[`stops[${index}].type`] ?? _stop.type,
              facilityName: formikProps.values[`stops[${index}].facilityName`] ?? _stop.facilityName,
              address: formikProps.values[`stops[${index}].address`] ?? _stop.address,
              city: formikProps.values[`stops[${index}].city`] ?? _stop.city,
              state: formikProps.values[`stops[${index}].state`] ?? _stop.state,
              zip: formikProps.values[`stops[${index}].zip`] ?? _stop.zip,
              appointmentDate: formikProps.values[`stops[${index}].appointmentDate`] ?? _stop.appointmentDate,
              appointmentTime: formikProps.values[`stops[${index}].appointmentTime`] ?? _stop.appointmentTime,
              appointmentNumber: formikProps.values[`stops[${index}].appointmentNumber`] ?? _stop.appointmentNumber,
              contactName: formikProps.values[`stops[${index}].contactName`] ?? _stop.contactName,
              contactPhone: formikProps.values[`stops[${index}].contactPhone`] ?? _stop.contactPhone,
              notes: formikProps.values[`stops[${index}].notes`] ?? _stop.notes,
            },
            errors: {},
            touched: {},
            handleChange: formikProps.handleChange,
            handleBlur: formikProps.handleBlur,
            setFieldValue: formikProps.setFieldValue,
          };

          const isPickup = _stop.type === 'PICKUP';
          const accentColor = isPickup ? 'primary.main' : 'success.main';

          const stopTypeLabels: Record<string, string> = {
            PICKUP: 'Pickup',
            DELIVERY: 'Delivery',
            STOP_OFF: 'Stop Off',
            DROP_HOOK: 'Drop Hook',
            LIVE_UNLOAD: 'Live Unload',
          };
          const stopLabel = stopTypeLabels[_stop.type] ?? String(_stop.type);

          return (
            <Box
              key={index}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderLeft: `3px solid`,
                borderLeftColor: accentColor,
                borderRadius: 1,
                p: 2,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={`#${index + 1}`}
                    size="small"
                    sx={{ fontWeight: 600, bgcolor: accentColor, color: '#fff' }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {stopLabel}
                  </Typography>
                </Stack>
                {(stops?.length ?? 0) > 2 && (
                  <IconButton
                    size="small"
                    onClick={() => arrayHelpers.remove(index)}
                    aria-label={`Remove stop ${index + 1}`}
                  >
                    <DeleteOutlineIcon fontSize="small" color="error" />
                  </IconButton>
                )}
              </Stack>

              <Grid container spacing={1.5}>
                <Grid item xs={12} md={3}>
                  <SelectField
                    name={`${prefix}.type`}
                    label="Type"
                    data={STOP_TYPE_OPTIONS}
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={12} md={4.5}>
                  <MochoTextField
                    name={`${prefix}.facilityName`}
                    label="Facility"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={12} md={4.5}>
                  <MochoTextField
                    name={`${prefix}.address`}
                    label="Address"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={4} md={3}>
                  <MochoTextField
                    name={`${prefix}.city`}
                    label="City"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={4} md={1.5}>
                  <MochoTextField
                    name={`${prefix}.state`}
                    label="State"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={4} md={1.5}>
                  <MochoTextField
                    name={`${prefix}.zip`}
                    label="ZIP"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <DateField
                    name={`${prefix}.appointmentDate`}
                    label="Date"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TimeField
                    name={`${prefix}.appointmentTime`}
                    label="Time"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <MochoTextField
                    name={`${prefix}.appointmentNumber`}
                    label="Ref #"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={6} md={4.5}>
                  <MochoTextField
                    name={`${prefix}.contactName`}
                    label="Contact Name"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={6} md={4.5}>
                  <MochoTextField
                    name={`${prefix}.contactPhone`}
                    label="Contact Phone"
                    formik={stopFormik}
                  />
                </Grid>
                <Grid item xs={12}>
                  <MochoTextField
                    name={`${prefix}.notes`}
                    label="Notes"
                    formik={stopFormik}
                  />
                </Grid>
              </Grid>
            </Box>
          );
        })}

        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleAddStop('PICKUP')}
          >
            Add Pickup
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => handleAddStop('DELIVERY')}
          >
            Add Delivery
          </Button>
        </Stack>
      </Stack>
    </MainCard>
  );
};

// ---------------------------------------------------------------------------
// Create Load Page
// ---------------------------------------------------------------------------

const CreateLoadPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreating = useSelector(selectLoadCreateLoading);

  // Read intel prefill data from route state (from Load Intelligence booking flow)
  const locationState = location.state as IntelLocationState | null;
  const intelPrefill = locationState?.intelPrefill;
  const backhaulData = locationState?.backhaulData;

  const initialValues: LoadFormValues = useMemo(() => {
    const pickupStop = {
      ...EMPTY_STOP,
      type: 'PICKUP' as StopType,
      sequence: 0,
      city: intelPrefill?.originCity ?? '',
      state: intelPrefill?.originState ?? '',
      appointmentDate: intelPrefill?.pickupDate ?? '',
    };

    const deliveryStop = {
      ...EMPTY_STOP,
      type: 'DELIVERY' as StopType,
      sequence: 1,
      city: intelPrefill?.destinationCity ?? '',
      state: intelPrefill?.destinationState ?? '',
    };

    // Map intel equipment types to load equipment types
    const equipmentTypeMap: Record<string, string> = {
      DV: 'DRY_VAN',
      RF: 'REEFER',
      FB: 'FLATBED',
      SD: 'STEP_DECK',
    };

    const mappedEquipment = intelPrefill?.equipmentType
      ? equipmentTypeMap[intelPrefill.equipmentType] ?? intelPrefill.equipmentType
      : undefined;

    return {
      carrierId: undefined,
      driverId: undefined,
      vehicleId: undefined,
      brokerId: undefined,
      shipperId: undefined,
      consigneeId: undefined,
      brokerRefNumber: undefined,
      equipmentType: mappedEquipment,
      isHazmat: false,
      isTarp: false,
      isTeamDriver: false,
      commodity: undefined,
      weight: undefined,
      pieceCount: undefined,
      loadedMiles: intelPrefill?.miles ?? undefined,
      deadheadMiles: undefined,
      totalMiles: intelPrefill?.miles ?? undefined,
      customerRate: intelPrefill?.rate ?? undefined,
      carrierRate: undefined,
      dispatchFee: undefined,
      partnerSplit: undefined,
      ratePerMile: undefined,
      dispatcherNotes: backhaulData
        ? `Planned backhaul: ${backhaulData.route}${backhaulData.rate !== null ? ` ($${backhaulData.rate})` : ''}`
        : undefined,
      driverInstructions: undefined,
      stops: [pickupStop, deliveryStop],
    };
  }, [intelPrefill, backhaulData]);

  const handleSubmit = useCallback(
    (values: LoadFormValues, status: 'QUOTED' | 'BOOKED') => {
      const stops = (values.stops ?? []).map((stop, index) => ({
        ...stop,
        sequence: index,
      }));

      dispatch(
        createLoadRequest({
          data: {
            ...values,
            status,
            stops,
          },
        }),
      );
    },
    [dispatch],
  );

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <PageWrapper errorContext="CreateLoadPage">
      <Formik
        initialValues={initialValues}
        validationSchema={loadSchema}
        onSubmit={(values) => handleSubmit(values, 'BOOKED')}
        validateOnChange={false}
        validateOnBlur
      >
        {(formik: FormikProps<LoadFormValues>) => {
          const formikProps = {
            values: formik.values as unknown as Record<string, unknown>,
            errors: formik.errors as unknown as FormikFieldProps<Record<string, unknown>>['errors'],
            touched: formik.touched as unknown as FormikFieldProps<Record<string, unknown>>['touched'],
            handleChange: formik.handleChange,
            handleBlur: formik.handleBlur,
            setFieldValue: (field: string, value: unknown) => {
              void formik.setFieldValue(field, value);
            },
          };

          return (
            <Form>
              <PageHeader
                title="Create New Load"
                subtitle="Build and assign a load"
                showBackButton
                onNavigate={handleBack}
                headerActions={
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => handleSubmit(formik.values, 'QUOTED')}
                      disabled={isCreating}
                    >
                      Create as Quoted
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isCreating}
                    >
                      Create as Booked
                    </Button>
                  </Stack>
                }
              />

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { lg: '1fr', xs: '1fr' },
                }}
              >
                {/* Route & Broker Section */}
                <MainCard>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Route & Broker
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={4}>
                      <MochoTextField
                        name="brokerId"
                        label="Broker"
                        formik={formikProps}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <MochoTextField
                        name="brokerRefNumber"
                        label="Broker Ref #"
                        formik={formikProps}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <SelectField
                        name="equipmentType"
                        label="Equipment Type"
                        data={EQUIPMENT_OPTIONS}
                        formik={formikProps}
                      />
                    </Grid>
                  </Grid>
                </MainCard>

                {/* Stops */}
                <FieldArray name="stops">
                  {(arrayHelpers) => (
                    <StopSection
                      arrayHelpers={arrayHelpers}
                      formikProps={formikProps}
                      stops={formik.values.stops}
                    />
                  )}
                </FieldArray>

                {/* Cargo Section */}
                <MainCard>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Cargo
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={4}>
                      <MochoTextField name="commodity" label="Commodity" formik={formikProps} />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <MochoTextField name="weight" label="Weight (lbs)" formik={formikProps} />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <MochoTextField name="pieceCount" label="Pieces" formik={formikProps} />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <CheckboxField name="isHazmat" label="Hazmat" formik={formikProps} />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <CheckboxField name="isTarp" label="Tarp Required" formik={formikProps} />
                    </Grid>
                  </Grid>
                </MainCard>

                {/* Assignment & Rate */}
                <MainCard>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Assignment & Rate
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={4}>
                      <MochoTextField name="carrierId" label="Carrier" formik={formikProps} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <MochoTextField name="driverId" label="Driver" formik={formikProps} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <MochoTextField name="vehicleId" label="Vehicle" formik={formikProps} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <MochoTextField
                        name="customerRate"
                        label="Customer Rate"
                        formik={formikProps}
                        helperText={
                          intelPrefill?.minBookRate !== null && intelPrefill?.minBookRate !== undefined
                            ? `Min book rate: $${intelPrefill.minBookRate.toLocaleString()}`
                            : undefined
                        }
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <MochoTextField name="carrierRate" label="Carrier Rate" formik={formikProps} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <MochoTextField name="dispatchFee" label="Dispatch Fee" formik={formikProps} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <MochoTextField name="totalMiles" label="Total Miles" formik={formikProps} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <CheckboxField name="isTeamDriver" label="Team Driver" formik={formikProps} />
                    </Grid>
                  </Grid>
                </MainCard>

                {/* Notes */}
                <MainCard>
                  <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
                    Notes
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <MochoTextField
                        name="dispatcherNotes"
                        label="Dispatcher Notes"
                        formik={formikProps}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MochoTextField
                        name="driverInstructions"
                        label="Driver Instructions"
                        formik={formikProps}
                      />
                    </Grid>
                  </Grid>
                </MainCard>
              </Box>
            </Form>
          );
        }}
      </Formik>
    </PageWrapper>
  );
};

export default CreateLoadPage;
