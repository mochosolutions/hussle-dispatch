import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import {
  Box,
  Typography,
  Button,
  Divider,
  Grid,
  Stack,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useDispatch, useSelector } from 'store';
import {
  TextField,
  EmailField,
  SelectField,
  CheckboxField,
} from '../../../../mocho/components';
import { EditDrawer } from 'components/EditDrawer';
import { placeSchema } from '../../validators/placeSchema';
import type { PlaceFormValues } from '../../validators/placeSchema';
import { selectPlaceById } from '../../store/selectors/placeSelectors';
import {
  createPlaceRequest,
  updatePlaceRequest,
} from '../../store/reducers';
import { FACILITY_TYPE_OPTIONS, DOCK_TYPE_OPTIONS } from '../../constants';

const SECTION_LABEL_SX = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

const GEO_SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  GEOCODED: 'Geocoded',
  GPS: 'GPS',
};

interface PlaceInfoDrawerProps {
  placeId?: string;
  onClose: () => void;
}

export const PlaceInfoDrawer: React.FC<PlaceInfoDrawerProps> = ({ placeId, onClose }) => {
  const dispatch = useDispatch();
  const place = useSelector(placeId ? selectPlaceById(placeId) : () => undefined);
  const isEditMode = Boolean(placeId && place);

  const initialValues: PlaceFormValues = {
    name: place?.name ?? '',
    address: place?.address ?? '',
    address2: place?.address2 ?? '',
    city: place?.city ?? '',
    state: place?.state ?? '',
    zip: place?.zip ?? '',
    facilityType: place?.facilityType ?? null,
    dockType: place?.dockType ?? null,
    operatingHours: place?.operatingHours ?? '',
    receivingHours: place?.receivingHours ?? '',
    appointmentRequired: place?.appointmentRequired ?? false,
    lumperRequired: place?.lumperRequired ?? false,
    ppeRequired: place?.ppeRequired ?? false,
    contactName: place?.contactName ?? '',
    contactPhone: place?.contactPhone ?? '',
    contactEmail: place?.contactEmail ?? '',
    checkInProcedures: place?.checkInProcedures ?? '',
    notes: place?.notes ?? '',
  };

  const handleSubmit = (values: PlaceFormValues) => {
    if (isEditMode && placeId) {
      dispatch(updatePlaceRequest({ id: placeId, data: values }));
    } else {
      dispatch(createPlaceRequest({ data: values }));
    }
    onClose();
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={placeSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      <PlaceInfoDrawerContent
        isEditMode={isEditMode}
        placeName={place?.name}
        latitude={place?.latitude ?? null}
        longitude={place?.longitude ?? null}
        geoSource={place?.geoSource ?? null}
        onClose={onClose}
      />
    </Formik>
  );
};

interface PlaceInfoDrawerContentProps {
  isEditMode: boolean;
  placeName?: string;
  latitude: number | null;
  longitude: number | null;
  geoSource: string | null;
  onClose: () => void;
}

const PlaceInfoDrawerContent: React.FC<PlaceInfoDrawerContentProps> = ({
  isEditMode,
  placeName,
  latitude,
  longitude,
  geoSource,
  onClose,
}) => {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    isSubmitting,
    isValid,
    dirty,
  } = useFormikContext<Record<string, unknown>>();

  const formikProps = { values, errors, touched, handleChange, handleBlur, setFieldValue };

  let submitLabel = isEditMode ? 'Save Changes' : 'Create Place';
  if (isSubmitting) {
    submitLabel = 'Saving\u2026';
  }

  const facilityTypeData = FACILITY_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const dockTypeData = DOCK_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="place-info-form"
        variant="contained"
        disabled={!isValid || !dirty || isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {submitLabel}
      </Button>
    </Box>
  );

  const title = isEditMode ? 'Edit Place' : 'Create Place';
  const subtitle = isEditMode ? placeName : undefined;

  return (
    <EditDrawer
      open
      title={title}
      onClose={onClose}
      subtitle={subtitle}
      isDirty={dirty}
      footer={footer}
    >
      <Form id="place-info-form">
        <Stack spacing={2.5} sx={{ p: 3 }}>
          {/* Location Section */}
          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Location
          </Typography>
          <TextField name="name" label="Name" formik={formikProps} required />
          <TextField name="address" label="Address" formik={formikProps} />
          <TextField name="address2" label="Address Line 2" formik={formikProps} />
          <Grid container spacing={2}>
            <Grid item xs={5}>
              <TextField name="city" label="City" formik={formikProps} required />
            </Grid>
            <Grid item xs={3}>
              <TextField name="state" label="State" formik={formikProps} required />
            </Grid>
            <Grid item xs={4}>
              <TextField name="zip" label="ZIP" formik={formikProps} />
            </Grid>
          </Grid>

          {/* Lat/Lng display (read-only) */}
          {isEditMode && (latitude !== null || longitude !== null) && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {latitude?.toFixed(6) ?? '--'}, {longitude?.toFixed(6) ?? '--'}
              </Typography>
              {geoSource && (
                <Chip
                  label={GEO_SOURCE_LABELS[geoSource] ?? geoSource}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.625rem' }}
                />
              )}
            </Box>
          )}

          <Divider sx={{ my: 0.5 }} />

          {/* Facility Details Section */}
          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Facility Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <SelectField
                name="facilityType"
                label="Facility Type"
                data={facilityTypeData}
                formik={formikProps}
              />
            </Grid>
            <Grid item xs={6}>
              <SelectField
                name="dockType"
                label="Dock Type"
                data={dockTypeData}
                formik={formikProps}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="operatingHours" label="Operating Hours" formik={formikProps} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="receivingHours" label="Receiving Hours" formik={formikProps} />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2}>
            <CheckboxField
              name="appointmentRequired"
              label="Appointment Required"
              formik={formikProps}
            />
            <CheckboxField
              name="lumperRequired"
              label="Lumper Required"
              formik={formikProps}
            />
            <CheckboxField
              name="ppeRequired"
              label="PPE Required"
              formik={formikProps}
            />
          </Stack>

          <Divider sx={{ my: 0.5 }} />

          {/* Contact Section */}
          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Contact
          </Typography>
          <TextField name="contactName" label="Contact Name" formik={formikProps} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="contactPhone" label="Phone" formik={formikProps} />
            </Grid>
            <Grid item xs={6}>
              <EmailField name="contactEmail" label="Email" formik={formikProps} />
            </Grid>
          </Grid>
          <TextField name="checkInProcedures" label="Check-in Procedures" formik={formikProps} />
          <TextField name="notes" label="Notes" formik={formikProps} />
        </Stack>
      </Form>
    </EditDrawer>
  );
};
