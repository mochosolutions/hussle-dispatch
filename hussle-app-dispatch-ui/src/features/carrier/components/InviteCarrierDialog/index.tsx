import { useState, useCallback } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { inviteCarrier, resendCarrierInvite } from 'utils/api/fleet/carrierApi';

interface InviteCarrierDialogProps {
  open: boolean;
  onClose: () => void;
  carrierId: string;
  carrierName: string;
  carrierEmail: string | null;
  isResend: boolean;
}

const MESSAGE_MAX_LENGTH = 500;

export const InviteCarrierDialog: React.FC<InviteCarrierDialogProps> = ({
  open,
  onClose,
  carrierId,
  carrierName,
  carrierEmail,
  isResend,
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClose = useCallback(() => {
    setMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = message.trim() ? { message: message.trim() } : undefined;

      if (isResend) {
        await resendCarrierInvite(carrierId, payload);
      } else {
        await inviteCarrier(carrierId, payload);
      }

      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send invite. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [carrierId, isResend, message]);

  const title = isResend ? `Resend Invite to ${carrierName}` : `Invite ${carrierName}`;

  if (success) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mt: 1 }}>
            {isResend ? 'Invite resent successfully.' : 'Invite sent successfully.'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {carrierEmail ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            An onboarding invite will be sent to <strong>{carrierEmail}</strong>.
          </Typography>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This carrier does not have an email address on file. Please add one before sending an
            invite.
          </Alert>
        )}

        <TextField
          label="Personal message (optional)"
          multiline
          minRows={3}
          maxRows={6}
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          inputProps={{ maxLength: MESSAGE_MAX_LENGTH }}
          helperText={`${message.length}/${MESSAGE_MAX_LENGTH}`}
          disabled={loading}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSubmit}
          loading={loading}
          disabled={!carrierEmail}
        >
          {isResend ? 'Resend' : 'Send Invite'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
