import React from 'react';
import { Box, Stack } from '@mui/material';
import { useDispatch } from 'store';
import {
  TextField,
  SelectField,
  DateField,
  CurrencyField,
  NumericField,
  StateField,
} from '@mocho/ui/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { manualEntrySchema } from '../../validators/manualEntrySchema';
import type { ManualEntryFormValues } from '../../validators/manualEntrySchema';
import { submitManualEntryRequest } from '../../store/reducers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EQUIPMENT_OPTIONS = [
  { label: 'Dry Van', value: 'DV' },
  { label: 'Reefer', value: 'RF' },
  { label: 'Flatbed', value: 'FB' },
  { label: 'Step Deck', value: 'SD' },
];

const INITIAL_VALUES: ManualEntryFormValues = {
  originCity: '',
  originState: '',
  destinationCity: '',
  destinationState: '',
  pickupDate: '',
  equipmentType: '',
  rate: undefined,
  loadedMiles: undefined,
  brokerName: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ManualEntryDrawerProps {
  onClose: () => void;
}

export const ManualEntryDrawer: React.FC<ManualEntryDrawerProps> = ({ onClose }) => {
  const dispatch = useDispatch();

  const handleSubmit = (values: ManualEntryFormValues) => {
    dispatch(
      submitManualEntryRequest({
        data: {
          originCity: values.originCity,
          originState: values.originState,
          destinationCity: values.destinationCity,
          destinationState: values.destinationState,
          pickupDate: values.pickupDate,
          equipmentType: values.equipmentType,
          rate: values.rate ?? undefined,
          loadedMiles: values.loadedMiles ?? undefined,
          brokerName: values.brokerName ?? undefined,
        },
      }),
    );
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Add Manual Load Entry"
      initialValues={INITIAL_VALUES}
      validationSchema={manualEntrySchema}
      onSubmit={handleSubmit}
      saveLabel="Add Entry"
      savingLabel="Adding..."
      enableReinitialize={false}
      validateOnChange={false}
      validateOnBlur
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <DrawerSection label="Origin">
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 2 }}>
                <TextField name="originCity" label="City" formik={formik} required />
              </Box>
              <Box sx={{ flex: 1 }}>
                <StateField name="originState" label="State" formik={formik} required />
              </Box>
            </Box>
          </DrawerSection>

          <DrawerSection label="Destination">
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 2 }}>
                <TextField name="destinationCity" label="City" formik={formik} required />
              </Box>
              <Box sx={{ flex: 1 }}>
                <StateField name="destinationState" label="State" formik={formik} required />
              </Box>
            </Box>
          </DrawerSection>

          <DrawerSection label="Load Details">
            <DateField name="pickupDate" label="Pickup Date" formik={formik} required />
            <SelectField
              name="equipmentType"
              label="Equipment Type"
              data={EQUIPMENT_OPTIONS}
              formik={formik}
              required
            />
            <CurrencyField name="rate" label="Rate" formik={formik} />
            <NumericField name="loadedMiles" label="Loaded Miles" suffix="mi" formik={formik} />
            <TextField name="brokerName" label="Broker Name" formik={formik} />
          </DrawerSection>
        </Stack>
      )}
    </FormDrawer>
  );
};
