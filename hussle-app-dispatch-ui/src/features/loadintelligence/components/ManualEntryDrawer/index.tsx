import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import { Box, Button, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { TextField, SelectField, DateField } from '@mocho/ui/components';
import { EditDrawer } from '../../../carrier/components/EditDrawer';
import { manualEntrySchema } from '../../validators/manualEntrySchema';
import type { ManualEntryFormValues } from '../../validators/manualEntrySchema';
import { submitManualEntryRequest } from '../../store/reducers';
import { selectManualEntryLoading } from '../../store/selectors/intelSelectors';
import type { EquipmentType } from '../../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EQUIPMENT_OPTIONS = [
  { label: 'Dry Van', value: 'DV' },
  { label: 'Reefer', value: 'RF' },
  { label: 'Flatbed', value: 'FB' },
  { label: 'Step Deck', value: 'SD' },
];

const SECTION_LABEL_SX = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

// ---------------------------------------------------------------------------
// Drawer Props
// ---------------------------------------------------------------------------

interface ManualEntryDrawerProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Inner Content (uses Formik context)
// ---------------------------------------------------------------------------

interface ManualEntryContentProps {
  onClose: () => void;
}

const ManualEntryContent: React.FC<ManualEntryContentProps> = ({ onClose }) => {
  const isSubmitting = useSelector(selectManualEntryLoading);
  const { values, errors, touched, handleChange, handleBlur, setFieldValue, isValid, dirty } =
    useFormikContext<ManualEntryFormValues>();

  const formikProps = {
    values: values as unknown as Record<string, unknown>,
    errors: errors as Record<string, string>,
    touched: touched as Record<string, boolean>,
    handleChange,
    handleBlur,
    setFieldValue: (field: string, value: unknown) => {
      void setFieldValue(field, value);
    },
  };

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="manual-entry-form"
        variant="contained"
        disabled={!isValid || !dirty || isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {isSubmitting ? 'Adding...' : 'Add Entry'}
      </Button>
    </Box>
  );

  return (
    <EditDrawer
      open
      title="Add Manual Load Entry"
      onClose={onClose}
      isDirty={dirty}
      footer={footer}
    >
      <Form id="manual-entry-form">
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Origin
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <TextField name="originCity" label="City" formik={formikProps} required />
            </Grid>
            <Grid item xs={4}>
              <TextField name="originState" label="State" formik={formikProps} required />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Destination
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <TextField
                name="destinationCity"
                label="City"
                formik={formikProps}
                required
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                name="destinationState"
                label="State"
                formik={formikProps}
                required
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Load Details
          </Typography>
          <DateField name="pickupDate" label="Pickup Date" formik={formikProps} required />
          <SelectField
            name="equipmentType"
            label="Equipment Type"
            data={EQUIPMENT_OPTIONS}
            formik={formikProps}
            required
          />
          <TextField name="rate" label="Rate ($)" formik={formikProps} />
          <TextField name="loadedMiles" label="Loaded Miles" formik={formikProps} />
          <TextField name="brokerName" label="Broker Name" formik={formikProps} />
        </Stack>
      </Form>
    </EditDrawer>
  );
};

// ---------------------------------------------------------------------------
// Main Drawer Component
// ---------------------------------------------------------------------------

export const ManualEntryDrawer: React.FC<ManualEntryDrawerProps> = ({ onClose }) => {
  const dispatch = useDispatch();

  const initialValues: ManualEntryFormValues = {
    originCity: '',
    originState: '',
    destinationCity: '',
    destinationState: '',
    pickupDate: '',
    equipmentType: '' as EquipmentType,
    rate: undefined as unknown as number,
    loadedMiles: undefined as unknown as number,
    brokerName: '',
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={manualEntrySchema}
      onSubmit={(values) => {
        dispatch(
          submitManualEntryRequest({
            data: {
              originCity: values.originCity,
              originState: values.originState,
              destinationCity: values.destinationCity,
              destinationState: values.destinationState,
              pickupDate: values.pickupDate,
              equipmentType: values.equipmentType as EquipmentType,
              rate: values.rate ?? undefined,
              loadedMiles: values.loadedMiles ?? undefined,
              brokerName: values.brokerName ?? undefined,
            },
          }),
        );
        onClose();
      }}
      validateOnChange={false}
      validateOnBlur
    >
      <ManualEntryContent onClose={onClose} />
    </Formik>
  );
};
