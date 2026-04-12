import React from 'react';
import { Box, Chip, Divider, Grid, Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import {
  TextField,
  EmailField,
  SelectField,
  CheckboxField,
} from '../../../../mocho/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { placeSchema } from '../../validators/placeSchema';
import type { PlaceFormValues } from '../../validators/placeSchema';
import { selectPlaceById } from '../../store/selectors/placeSelectors';
import {
  createPlaceRequest,
  updatePlaceRequest,
} from '../../store/reducers';
import { FACILITY_TYPE_OPTIONS, DOCK_TYPE_OPTIONS } from '../../constants';

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
  };

  const title = isEditMode ? 'Edit Place' : 'Create Place';
  const subtitle = isEditMode ? place?.name : undefined;
  const saveLabel = isEditMode ? 'Save Changes' : 'Create Place';

  const facilityTypeData = FACILITY_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const dockTypeData = DOCK_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <FormDrawer
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      initialValues={initialValues}
      validationSchema={placeSchema}
      onSubmit={handleSubmit}
      saveLabel={saveLabel}
      enableReinitialize
    >
      {(formik) => {
        const formikProps = {
          values: formik.values,
          errors: formik.errors,
          touched: formik.touched,
          handleChange: formik.handleChange,
          handleBlur: formik.handleBlur,
          setFieldValue: formik.setFieldValue,
        };

        return (
          <Stack spacing={2.5} sx={{ p: 3 }}>
            {/* Location Section */}
            <DrawerSection label="Location">
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
              {isEditMode && (place?.latitude !== null || place?.longitude !== null) && (
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
                    {place?.latitude?.toFixed(6) ?? '--'}, {place?.longitude?.toFixed(6) ?? '--'}
                  </Typography>
                  {place?.geoSource && (
                    <Chip
                      label={GEO_SOURCE_LABELS[place.geoSource] ?? place.geoSource}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.625rem' }}
                    />
                  )}
                </Box>
              )}
            </DrawerSection>

            <Divider sx={{ my: 0.5 }} />

            {/* Facility Details Section */}
            <DrawerSection label="Facility Details">
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
            </DrawerSection>

            <Divider sx={{ my: 0.5 }} />

            {/* Contact Section */}
            <DrawerSection label="Contact">
              <TextField name="contactName" label="Contact Name" formik={formikProps} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField name="contactPhone" label="Phone" formik={formikProps} />
                </Grid>
                <Grid item xs={6}>
                  <EmailField name="contactEmail" label="Email" formik={formikProps} />
                </Grid>
              </Grid>
              <TextField
                name="checkInProcedures"
                label="Check-in Procedures"
                formik={formikProps}
              />
              <TextField name="notes" label="Notes" formik={formikProps} />
            </DrawerSection>
          </Stack>
        );
      }}
    </FormDrawer>
  );
};
