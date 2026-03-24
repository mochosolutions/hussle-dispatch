import { Stack, Typography } from '@mui/material';
import { ContextualAlert } from 'components/ContextualAlert';

const noop = () => {
  // placeholder for demo callbacks
};

const AlertSection = () => (
  <Stack spacing={3}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
      ContextualAlert — all severities with left border accent
    </Typography>

    <ContextualAlert
      severity="info"
      title="New feature available"
      description="Invoice auto-generation is now enabled for all delivered loads."
      action={{ label: 'Learn More', onClick: noop }}
    />

    <ContextualAlert
      severity="warning"
      title="Insurance expiring soon"
      description="Carrier Swift Transport LLC insurance expires in 30 days. Update documentation to avoid service interruption."
      action={{ label: 'Update Now', onClick: noop }}
      onDismiss={noop}
    />

    <ContextualAlert
      severity="error"
      title="Payment overdue"
      description="Invoice INV-2026-0042 is 15 days overdue. Total outstanding: $4,250.00."
      action={{ label: 'Send Reminder', onClick: noop }}
    />

    <ContextualAlert
      severity="success"
      title="Load delivered successfully"
      description="Load LD-2026-000007 was delivered at destination. All documents received."
      onDismiss={noop}
    />
  </Stack>
);

export default AlertSection;
