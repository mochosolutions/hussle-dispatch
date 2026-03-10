import React from 'react';
import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { TextField, SelectField, CheckboxField } from '@mocho/ui/components';
import { EditDrawer } from 'features/carrier/components/EditDrawer';
import { useDispatch } from 'store';
import { updateLoadRequest } from '../../store/reducers';
import type { LoadDetail } from '../../types';

const SECTION_LABEL_SX = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

const EQUIPMENT_OPTIONS = [
  { label: 'Dry Van', value: 'DRY_VAN' },
  { label: 'Reefer', value: 'REEFER' },
  { label: 'Flatbed', value: 'FLATBED' },
  { label: 'Step Deck', value: 'STEP_DECK' },
  { label: 'Box Truck', value: 'BOX_TRUCK' },
  { label: 'Hotshot', value: 'HOTSHOT' },
  { label: 'Power Only', value: 'POWER_ONLY' },
];

const cargoSchema = Yup.object().shape({
  equipmentType: Yup.string(),
  commodity: Yup.string(),
  weight: Yup.number().positive('Weight must be positive').nullable(),
  pieceCount: Yup.number().integer('Must be whole number').min(0).nullable(),
  isHazmat: Yup.boolean(),
  isTarp: Yup.boolean(),
});

type CargoFormValues = Yup.InferType<typeof cargoSchema>;

interface LoadCargoDrawerProps {
  load: LoadDetail;
  onClose: () => void;
}

export const LoadCargoDrawer: React.FC<LoadCargoDrawerProps> = ({ load, onClose }) => {
  const dispatch = useDispatch();

  const initialValues: CargoFormValues = {
    equipmentType: load.equipmentType ?? '',
    commodity: load.commodity ?? '',
    weight: load.weight ?? undefined,
    pieceCount: load.pieceCount ?? undefined,
    isHazmat: load.isHazmat,
    isTarp: load.isTarp,
  };

  const handleSubmit = (values: CargoFormValues) => {
    dispatch(
      updateLoadRequest({
        id: load.id,
        data: values,
      }),
    );
    onClose();
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={cargoSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      <LoadCargoDrawerContent loadNumber={load.loadNumber} onClose={onClose} />
    </Formik>
  );
};

interface LoadCargoDrawerContentProps {
  loadNumber: string;
  onClose: () => void;
}

const LoadCargoDrawerContent: React.FC<LoadCargoDrawerContentProps> = ({ loadNumber, onClose }) => {
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

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="load-cargo-form"
        variant="contained"
        disabled={!isValid || !dirty || isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </Box>
  );

  return (
    <EditDrawer
      open
      title="Edit Cargo"
      subtitle={loadNumber}
      onClose={onClose}
      isDirty={dirty}
      footer={footer}
    >
      <Form id="load-cargo-form">
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
            Cargo Details
          </Typography>
          <SelectField
            name="equipmentType"
            label="Equipment Type"
            data={EQUIPMENT_OPTIONS}
            formik={formikProps}
          />
          <TextField name="commodity" label="Commodity" formik={formikProps} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="weight" label="Weight (lbs)" formik={formikProps} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="pieceCount" label="Piece Count" formik={formikProps} />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2}>
            <CheckboxField name="isHazmat" label="Hazmat" formik={formikProps} />
            <CheckboxField name="isTarp" label="Tarp Required" formik={formikProps} />
          </Stack>
        </Stack>
      </Form>
    </EditDrawer>
  );
};
