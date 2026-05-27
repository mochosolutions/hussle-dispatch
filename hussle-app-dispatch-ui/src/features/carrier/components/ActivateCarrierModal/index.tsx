import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { SubmitButton } from '@mocho/ui/components';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import { adminActivateCarrierRequest } from 'features/carrier/store/reducers/carrierNewPageSlice';

interface ActivateCarrierModalProps {
  carrierId: string;
  carrierName: string;
}

const ACTIVATION_REASON = 'Manual creation flow — all dispatch gate requirements met.';

export const ActivateCarrierModal: React.FC<ActivateCarrierModalProps> = ({
  carrierId,
  carrierName,
}) => {
  const isOpen = useSelector(
    (state) => state.pages.ui?.modal?.modalType === 'activateCarrier',
  );
  const { closeModal } = useModalActions();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    dispatch(adminActivateCarrierRequest({ id: carrierId, reason: ACTIVATION_REASON }));
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} maxWidth="sm" fullWidth>
      <DialogTitle>Activate {carrierName}?</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography>
            All compliance requirements are met for <strong>{carrierName}</strong>.
            Activating will mark the carrier as ready to receive load assignments.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={closeModal} disabled={isSubmitting}>
          Cancel
        </Button>
        <SubmitButton
          label="Activate Carrier"
          loading={isSubmitting}
          fullWidth={false}
          size="medium"
          type="button"
          onClick={handleConfirm}
        />
      </DialogActions>
    </Dialog>
  );
};
