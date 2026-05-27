import React from 'react';
import { Dialog, DialogContent, Button, Box } from '@mui/material';
import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';

import { ModalTitle, BodyMuted } from 'components/Typography';

interface UpgradePlanDialogProps {
  resourceType: 'team members' | 'vehicles';
  limit: number;
  onClose: () => void;
}

const UpgradePlanDialog: React.FC<UpgradePlanDialogProps> = ({
  resourceType,
  limit,
  onClose,
}) => (
  <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
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

      <ModalTitle sx={{ mb: 1 }}>Plan Limit Reached</ModalTitle>

      <BodyMuted>
        You&apos;ve reached your plan limit of{' '}
        <Box component="strong">
          {limit} {resourceType}
        </Box>
        . Upgrade your plan to add more.
      </BodyMuted>

      <Button variant="contained" color="primary" fullWidth onClick={onClose} sx={{ mt: 3 }}>
        Got It
      </Button>
    </DialogContent>
  </Dialog>
);

export default UpgradePlanDialog;
