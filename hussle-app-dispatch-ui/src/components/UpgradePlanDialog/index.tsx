import React from 'react';
import { Dialog, DialogContent, Typography, Button, Box } from '@mui/material';
import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';

interface UpgradePlanDialogProps {
  open: boolean;
  onClose: () => void;
  resourceType: 'team members' | 'vehicles';
  limit: number;
}

const UpgradePlanDialog: React.FC<UpgradePlanDialogProps> = ({
  open,
  onClose,
  resourceType,
  limit,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogContent
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <WarningAmberIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Plan Limit Reached
      </Typography>

      <Typography variant="body2" color="text.secondary">
        You&apos;ve reached your plan limit of{' '}
        <strong>
          {limit} {resourceType}
        </strong>
        . Upgrade your plan to add more.
      </Typography>

      <Button variant="contained" color="primary" fullWidth onClick={onClose} sx={{ mt: 3 }}>
        Got It
      </Button>
    </DialogContent>
  </Dialog>
);

export default UpgradePlanDialog;
