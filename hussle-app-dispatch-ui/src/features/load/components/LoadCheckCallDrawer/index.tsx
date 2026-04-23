import React from 'react';
import { Stack } from '@mui/material';
import * as Yup from 'yup';
import type { InferType } from 'yup';
import { TextField, CheckboxField, DateTimePickerField } from '@mocho/ui/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { useDispatch } from 'store';
import { createCheckCallRequest } from '../../store/reducers/loadPageSlice';

const NOTES_MAX_LENGTH = 2000;

const checkCallSchema = Yup.object({
  location: Yup.string().trim().max(255, 'Location must be 255 characters or fewer'),
  eta: Yup.date().nullable(),
  notes: Yup.string()
    .required('Notes are required')
    .trim()
    .max(NOTES_MAX_LENGTH, `Notes must be ${NOTES_MAX_LENGTH} characters or fewer`),
  brokerNotified: Yup.boolean().required(),
}).required();

type CheckCallFormValues = InferType<typeof checkCallSchema>;

interface LoadCheckCallDrawerProps {
  loadId: string;
  onClose: () => void;
}

export const LoadCheckCallDrawer: React.FC<LoadCheckCallDrawerProps> = ({ loadId, onClose }) => {
  const dispatch = useDispatch();

  const initialValues: CheckCallFormValues = {
    location: '',
    eta: null,
    notes: '',
    brokerNotified: false,
  };

  const handleSubmit = (values: CheckCallFormValues) => {
    const trimmedLocation = values.location?.trim() ?? '';
    const trimmedNotes = values.notes.trim();
    const etaIso = values.eta ? values.eta.toISOString() : undefined;

    dispatch(
      createCheckCallRequest({
        loadId,
        data: {
          ...(trimmedLocation ? { location: trimmedLocation } : {}),
          ...(etaIso ? { eta: etaIso } : {}),
          notes: trimmedNotes,
          brokerNotified: values.brokerNotified ?? false,
        },
      }),
    );

    onClose();
  };

  return (
    <FormDrawer<CheckCallFormValues>
      open
      onClose={onClose}
      title="Log Check Call"
      initialValues={initialValues}
      validationSchema={checkCallSchema}
      onSubmit={handleSubmit}
      saveLabel="Log Check Call"
      savingLabel="Logging..."
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <DrawerSection label="Status">
            <TextField
              name="location"
              label="Location"
              formik={formik}
              placeholder="City, State or landmark"
            />
            <DateTimePickerField name="eta" label="Estimated Time of Arrival" formik={formik} />
          </DrawerSection>

          <DrawerSection label="Notes">
            <TextField
              name="notes"
              label="Notes"
              formik={formik}
              required
              multiline
              minRows={4}
              placeholder="What happened on this check call?"
            />
          </DrawerSection>

          <DrawerSection label="Broker Notification">
            <CheckboxField
              name="brokerNotified"
              label="Notify broker with these details"
              formik={formik}
            />
          </DrawerSection>
        </Stack>
      )}
    </FormDrawer>
  );
};
