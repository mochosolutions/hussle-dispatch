import { useState, useCallback } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { approveCarrier } from 'utils/api/fleet/carrierApi';

interface ApproveCarrierDialogProps {
  open: boolean;
  onClose: () => void;
  carrierId: string;
  carrierName: string;
  minimumRatePerMile?: number | null;
  onApproved?: () => void;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const ApproveCarrierDialog: React.FC<ApproveCarrierDialogProps> = ({
  open,
  onClose,
  carrierId,
  carrierName,
  minimumRatePerMile,
  onApproved,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleApprove = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await approveCarrier(carrierId);
      onApproved?.();
      handleClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to approve carrier. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [carrierId, onApproved, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Approve {carrierName}?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          This will mark the carrier as approved and set their status to active.
        </Typography>

        {minimumRatePerMile !== undefined && minimumRatePerMile !== null && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Minimum rate per mile: {formatCurrency(minimumRatePerMile)}/mi
          </Alert>
        )}

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
        <LoadingButton variant="contained" color="success" onClick={handleApprove} loading={loading}>
          Approve
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
