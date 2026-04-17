import { Grid } from '@mui/material';
import { TextField } from '@mocho/ui/components';
import SectionCard from 'components/SectionCard';
import type { LoadFormValues } from '../../../../../../validators/loadSchema';
import type { FormikProps } from 'formik';

interface NotesSectionProps {
  formik: FormikProps<LoadFormValues>;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ formik }) => {
  return (
    <SectionCard
      title="Notes"
      subheader="Internal dispatcher notes and instructions for the driver"
    >
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={12}>
          <TextField
            name="dispatcherNotes"
            label="Dispatcher Notes"
            formik={formik}
            multiline
            minRows={4}
          />
        </Grid>
        <Grid item xs={12} md={12}>
          <TextField
            name="driverInstructions"
            label="Driver Instructions"
            formik={formik}
            multiline
            minRows={4}
          />
        </Grid>
      </Grid>
    </SectionCard>
  );
};
