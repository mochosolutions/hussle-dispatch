import { Box, Button } from '@mui/material';
import { CancelButton } from '@mocho/ui/components';
import { Formik } from 'formik';
import { SelectField } from '../../../../mocho/components/form-fields/SelectField';
import { TextField } from '../../../../mocho/components/form-fields/TextField';
import { EQUIPMENT_OPTIONS, VEHICLE_MAKES } from '../../constants';
import type { VehicleFormEntry } from '../../types';
import { vehicleSchema } from '../../validators/vehicleSchema';

interface VehicleInlineFormProps {
  initial?: VehicleFormEntry | null;
  onSave: (vehicle: VehicleFormEntry) => void;
  onCancel: () => void;
}

export const VehicleInlineForm = ({
  initial,
  onSave,
  onCancel,
}: VehicleInlineFormProps) => {
  const isEdit = Boolean(initial?.localId);

  return (
    <Formik
      initialValues={{
        unitNumber: initial?.unitNumber ?? '',
        year: initial?.year ?? '',
        make: initial?.make ?? '',
        model: initial?.model ?? '',
        vin: initial?.vin ?? '',
        type: initial?.type ?? '',
        licensePlate: initial?.licensePlate ?? '',
      }}
      validationSchema={vehicleSchema}
      onSubmit={(values) => {
        onSave({
          localId: initial?.localId ?? `v-${Date.now()}`,
          unitNumber: values.unitNumber,
          year: values.year,
          make: values.make,
          model: values.model ?? '',
          vin: values.vin ?? '',
          type: (values.type as VehicleFormEntry['type']) || 'DRY_VAN',
          licensePlate: values.licensePlate ?? '',
        });
      }}
      enableReinitialize
    >
      {({ values, errors, touched, handleBlur, handleChange, handleSubmit, setFieldValue, isValid }) => {
        const formikProps = { values, errors, touched, handleChange, handleBlur, setFieldValue };

        return (
        <Box
          sx={{
            p: 2.5,
            bgcolor: 'primary.light',
            border: 1,
            borderColor: 'primary.main',
            borderRadius: 1,
            opacity: 0.95,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Box sx={{ flex: 3 }}>
              <TextField name="unitNumber" label="Unit #" placeholder="TRK-001" formik={formikProps} />
            </Box>
            <Box sx={{ flex: 2 }}>
              <TextField name="year" label="Year" placeholder="2022" formik={formikProps} />
            </Box>
            <Box sx={{ flex: 4 }}>
              <SelectField
                name="make"
                label="Make"
                data={[{ value: '', label: 'Select make' }, ...VEHICLE_MAKES.map((m) => ({ value: m, label: m }))]}
                formik={formikProps}
              />
            </Box>
            <Box sx={{ flex: 3 }}>
              <TextField name="model" label="Model" placeholder="Cascadia" formik={formikProps} />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField name="vin" label="VIN" placeholder="1FUJGLDR..." formik={formikProps} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <SelectField
                name="type"
                label="Equipment Type"
                data={[{ value: '', label: '—' }, ...EQUIPMENT_OPTIONS]}
                formik={formikProps}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField name="licensePlate" label="License Plate" placeholder="ABC-1234" formik={formikProps} />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <CancelButton onClick={onCancel} size="small" />
            <Button
              type="button"
              variant="contained"
              size="small"
              disabled={!isValid}
              onClick={() => void handleSubmit()}
            >
              {isEdit ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </Box>
        </Box>
        );
      }}
    </Formik>
  );
};
