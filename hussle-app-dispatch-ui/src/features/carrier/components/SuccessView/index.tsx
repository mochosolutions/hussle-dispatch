import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { CreateMode, SubmitStatus } from '../../types';

interface SuccessViewProps {
  companyName: string;
  mode: CreateMode;
  submitStatus: SubmitStatus;
  sendInvite: boolean;
  contactEmail: string;
  vehicleCount: number;
  driverCount: number;
  onAddAnother: () => void;
  onViewCarrier: () => void;
}

export const SuccessView = ({
  companyName,
  mode,
  submitStatus,
  sendInvite,
  contactEmail,
  vehicleCount,
  driverCount,
  onAddAnother,
  onViewCarrier,
}: SuccessViewProps) => {
  let statusLabel = 'Pending Review';

  if (mode === 'quick') {
    statusLabel = 'Draft';
  } else if (submitStatus === 'ACTIVE') {
    statusLabel = 'Active';
  }

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 480, px: 4 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: 'success.light', mx: 'auto', mb: 2.5 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 32, color: 'success.main' }} />
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Carrier Created
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
          <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {companyName}
          </Box>{' '}
          has been added as{' '}
          <Chip
            label={`● ${statusLabel}`}
            size="small"
            color={statusLabel === 'Approved' ? 'success' : 'warning'}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Typography>

        {mode === 'full' && (vehicleCount > 0 || driverCount > 0) && (
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            {vehicleCount > 0 && `${vehicleCount} vehicle${vehicleCount > 1 ? 's' : ''}`}
            {vehicleCount > 0 && driverCount > 0 && ' and '}
            {driverCount > 0 && `${driverCount} driver${driverCount > 1 ? 's' : ''}`}
            {' added to the roster.'}
          </Typography>
        )}

        {mode === 'quick' && sendInvite && contactEmail && (
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Onboarding invite sent to {contactEmail}
          </Typography>
        )}

        <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={onAddAnother}>
            + Add Another
          </Button>
          <Button variant="contained" onClick={onViewCarrier}>
            View Carrier →
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
