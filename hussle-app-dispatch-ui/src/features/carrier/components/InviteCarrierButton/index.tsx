import { useState, useCallback } from 'react';
import { Button } from '@mui/material';
import SendOutlined from '@mui/icons-material/SendOutlined';
import { InviteCarrierDialog } from '../InviteCarrierDialog';

interface InviteCarrierButtonProps {
  carrierId: string;
  carrierName: string;
  carrierEmail: string | null;
  onboardingStatus?: string;
  inviteSentAt?: string | null;
}

const HIDDEN_STATUSES = new Set(['ACTIVE', 'ACTION_REQUIRED', 'SUSPENDED']);

export const InviteCarrierButton: React.FC<InviteCarrierButtonProps> = ({
  carrierId,
  carrierName,
  carrierEmail,
  onboardingStatus,
  inviteSentAt,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  if (onboardingStatus && HIDDEN_STATUSES.has(onboardingStatus)) {
    return null;
  }

  const isResend = Boolean(inviteSentAt);
  const label = isResend ? 'Resend Invite' : 'Invite to Onboard';

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<SendOutlined />}
        onClick={handleOpen}
        sx={{ color: 'common.white', borderColor: 'grey.400', '&:hover': { borderColor: 'grey.200' } }}
      >
        {label}
      </Button>
      <InviteCarrierDialog
        open={dialogOpen}
        onClose={handleClose}
        carrierId={carrierId}
        carrierName={carrierName}
        carrierEmail={carrierEmail}
        isResend={isResend}
      />
    </>
  );
};
