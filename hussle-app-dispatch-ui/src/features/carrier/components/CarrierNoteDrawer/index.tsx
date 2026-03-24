import React from 'react';
import { Stack } from '@mui/material';
import * as Yup from 'yup';
import type { InferType } from 'yup';
import { useDispatch } from 'store';
import { CharCounterField } from '../../../../mocho/components/form-fields/CharCounterField';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { createCarrierNoteRequest } from '../../store/reducers';

const NOTE_MAX_LENGTH = 2000;

const carrierNoteSchema = Yup.object({
  content: Yup.string()
    .required('Note content is required')
    .max(NOTE_MAX_LENGTH, `Note must be ${NOTE_MAX_LENGTH} characters or fewer`)
    .trim(),
}).required();

type CarrierNoteFormValues = InferType<typeof carrierNoteSchema>;

interface CarrierNoteDrawerProps {
  carrierId: string;
  onClose: () => void;
}

export const CarrierNoteDrawer: React.FC<CarrierNoteDrawerProps> = ({ carrierId, onClose }) => {
  const dispatch = useDispatch();

  const initialValues: CarrierNoteFormValues = {
    content: '',
  };

  const handleSubmit = (values: CarrierNoteFormValues) => {
    dispatch(createCarrierNoteRequest({ carrierId, data: { content: values.content } }));
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Add Note"
      initialValues={initialValues}
      validationSchema={carrierNoteSchema}
      onSubmit={handleSubmit}
      saveLabel="Add Note"
      savingLabel="Adding..."
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <CharCounterField
            name="content"
            label="Note"
            formik={formik}
            maxLength={NOTE_MAX_LENGTH}
            rows={6}
            placeholder="Write a note about this carrier..."
            required
          />
        </Stack>
      )}
    </FormDrawer>
  );
};
