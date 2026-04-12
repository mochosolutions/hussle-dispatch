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
import { rejectCarrier } from 'utils/api/fleet/carrierApi';

interface RejectCarrierDialogProps {
  open: boolean;
  onClose: () => void;
  carrierId: string;
  carrierName: string;
  onRejected?: () => void;
}

const REASON_MAX_LENGTH = 1000;

export const RejectCarrierDialog: React.FC<RejectCarrierDialogProps> = ({
  open,
  onClose,
  carrierId,
  carrierName,
  onRejected,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setReason('');
    setError(null);
    onClose();
  }, [onClose]);

  const isReasonValid = reason.trim().length >= 1 && reason.trim().length <= REASON_MAX_LENGTH;

  const handleReject = useCallback(async () => {
    if (!isReasonValid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await rejectCarrier(carrierId, reason.trim());
      onRejected?.();
      handleClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to reject carrier. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [carrierId, reason, isReasonValid, onRejected, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reject {carrierName}?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please provide a reason for rejecting this carrier. This will be recorded and may be
          communicated to the carrier.
        </Typography>

        <TextField
          label="Reason for rejection"
          multiline
          minRows={3}
          maxRows={6}
          fullWidth
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          inputProps={{ maxLength: REASON_MAX_LENGTH }}
          helperText={`${reason.length}/${REASON_MAX_LENGTH}`}
          disabled={loading}
          error={reason.length > 0 && !isReasonValid}
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
          color="error"
          onClick={handleReject}
          loading={loading}
          disabled={!isReasonValid}
        >
          Reject
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
