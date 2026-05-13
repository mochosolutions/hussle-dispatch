import { useMemo } from 'react';
import { Alert, Box, Button, Grid, Stack } from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';

import {
  CancelButton,
  NumericField,
  SelectField,
  TextField,
} from 'mocho/components/form-fields';

import { VehicleCategory } from 'features/carrier-portal/types';
import type { VehicleEntry } from 'features/carrier-portal/types';

interface EquipmentVehicleFormEntry {
  localId: string;
  entry: VehicleEntry;
}

interface EquipmentVehicleFormProps {
  initial?: EquipmentVehicleFormEntry | null;
  onSave: (vehicle: EquipmentVehicleFormEntry) => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = [
  { value: VehicleCategory.SEMI_TRUCK, label: 'Semi Truck' },
  { value: VehicleCategory.BOX_TRUCK, label: 'Box Truck' },
  { value: VehicleCategory.CARGO_VAN, label: 'Cargo Van' },
  { value: VehicleCategory.PERSONAL_VEHICLE, label: 'Personal Vehicle' },
];

const VEHICLE_MAKES = [
  'Freightliner',
  'Kenworth',
  'Peterbilt',
  'Volvo',
  'International',
  'Mack',
  'Western Star',
  'Hino',
  'Isuzu',
  'Ford',
  'Mercedes-Benz',
  'Ram',
  'Chevrolet',
  'GMC',
  'Other',
];

const vehicleSchema = Yup.object({
  category: Yup.string().required('Vehicle type is required'),
  year: Yup.number().nullable(),
  make: Yup.string().required('Make is required'),
  model: Yup.string().required('Model is required'),
  vin: Yup.string().required('VIN is required'),
  licensePlate: Yup.string().required('License plate is required'),
  gvwr: Yup.number().nullable(),
});

interface FormValues {
  category: VehicleCategory | '';
  year: number | null;
  make: string;
  model: string;
  vin: string;
  licensePlate: string;
  gvwr: number | null;
}

const EquipmentVehicleForm: React.FC<EquipmentVehicleFormProps> = ({
  initial,
  onSave,
  onCancel,
}) => {
  const isEdit = Boolean(initial);

  const initialValues = useMemo<FormValues>(
    () => ({
      category: (initial?.entry.category as VehicleCategory) ?? '',
      year: initial?.entry.year ?? null,
      make: initial?.entry.make ?? '',
      model: initial?.entry.model ?? '',
      vin: initial?.entry.vin ?? '',
      licensePlate: initial?.entry.licensePlate ?? '',
      gvwr: initial?.entry.gvwr ?? null,
    }),
    [initial],
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={vehicleSchema}
      enableReinitialize
      onSubmit={(values) => {
        if (!values.category) {
          return;
        }
        const entry: VehicleEntry = {
          category: values.category,
          year: values.year ?? undefined,
          make: values.make,
          model: values.model,
          vin: values.vin,
          licensePlate: values.licensePlate,
          gvwr: values.gvwr ?? undefined,
        };
        onSave({
          localId: initial?.localId ?? `v-${Date.now()}`,
          entry,
        });
      }}
    >
      {({ values, errors, touched, handleBlur, handleChange, setFieldValue, isValid, submitForm }) => {
        const formikProps = { values, errors, touched, handleChange, handleBlur, setFieldValue };
        const showGvwr =
          values.category === VehicleCategory.SEMI_TRUCK ||
          values.category === VehicleCategory.BOX_TRUCK;
        const gvwrAlert: { severity: 'success' | 'warning' | 'error'; message: string } | null = (() => {
          if (values.category !== VehicleCategory.BOX_TRUCK || values.gvwr == null) {
            return null;
          }
          if (values.gvwr <= 10000) {
            return { severity: 'success', message: 'Under 10,001 lbs — no DOT registration needed.' };
          }
          if (values.gvwr <= 26000) {
            return {
              severity: 'warning',
              message: '10,001–26,000 lbs — DOT registration optional for intrastate.',
            };
          }
          return {
            severity: 'error',
            message: 'Over 26,001 lbs — DOT registration required by federal law.',
          };
        })();

        return (
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <SelectField
                  name="category"
                  label="Vehicle Type"
                  required
                  data={[{ value: '', label: 'Select type' }, ...CATEGORY_OPTIONS]}
                  formik={formikProps}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <NumericField name="year" label="Year" placeholder="2022" formik={formikProps} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SelectField
                  name="make"
                  label="Make"
                  required
                  data={[
                    { value: '', label: 'Select make' },
                    ...VEHICLE_MAKES.map((m) => ({ value: m, label: m })),
                  ]}
                  formik={formikProps}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="model"
                  label="Model"
                  required
                  placeholder="Cascadia"
                  formik={formikProps}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="vin"
                  label="VIN"
                  required
                  placeholder="1FUJGLDR..."
                  formik={formikProps}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="licensePlate"
                  label="License Plate"
                  required
                  placeholder="ABC-1234"
                  formik={formikProps}
                />
              </Grid>

              {showGvwr ? (
                <Grid item xs={12} sm={6}>
                  <NumericField
                    name="gvwr"
                    label="GVWR"
                    placeholder="26000"
                    suffix="lbs"
                    formik={formikProps}
                  />
                </Grid>
              ) : null}
            </Grid>

            {gvwrAlert ? (
              <Alert severity={gvwrAlert.severity} sx={{ mb: 2 }}>
                {gvwrAlert.message}
              </Alert>
            ) : null}

            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <CancelButton onClick={onCancel} size="small" />
              <Button
                type="button"
                variant="contained"
                size="small"
                disabled={!isValid || !values.category}
                onClick={() => void submitForm()}
              >
                {isEdit ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
            </Stack>
          </Box>
        );
      }}
    </Formik>
  );
};

export type { EquipmentVehicleFormEntry };
export default EquipmentVehicleForm;
