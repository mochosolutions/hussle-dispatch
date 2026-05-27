import { Stack, Grid } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { SectionTitle, BodyMuted } from 'components/Typography';
import { TextField } from 'mocho/components/form-fields';
import type { FormikFieldProps } from 'mocho/components/form-fields';

interface DriverCommunicationsSettingsProps {
  formikProps: FormikFieldProps;
}

export const DriverCommunicationsSettings: React.FC<DriverCommunicationsSettingsProps> = ({
  formikProps,
}) => (
  <SectionCard title={<SectionTitle>Driver Communications</SectionTitle>}>
    <Stack spacing={2.5}>
      <BodyMuted>
        Controls when the dispatch service schedules SMS check-ins to drivers on active loads.
      </BodyMuted>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="smsPrePickupLeadMinutes"
            label="Pre-pickup lead time (minutes)"
            type="number"
            formik={formikProps}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="smsTransitIntervalMinutes"
            label="Transit check-in interval (minutes)"
            type="number"
            formik={formikProps}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="smsPostPickupEscalationMinutes"
            label="Post-pickup escalation (minutes)"
            type="number"
            formik={formikProps}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="smsCooldownMinutes"
            label="Cooldown between prompts (minutes)"
            type="number"
            formik={formikProps}
            required
          />
        </Grid>
      </Grid>
    </Stack>
  </SectionCard>
);

export default DriverCommunicationsSettings;
