import { useCallback, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';

import { useDispatch } from 'store';
import { voidAgreementRequest } from '../../store/reducers/agreementsSlice';

interface VoidAgreementModalProps {
  agreementId: string;
  templateLabel: string;
  onClose: () => void;
}

export const VoidAgreementModal: React.FC<VoidAgreementModalProps> = ({
  agreementId,
  templateLabel,
  onClose,
}) => {
  const dispatch = useDispatch();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = reason.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) {
      return;
    }
    setIsSubmitting(true);
    dispatch(voidAgreementRequest({ id: agreementId, reason: reason.trim() }));
    onClose();
  }, [agreementId, canSubmit, dispatch, onClose, reason]);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Void agreement</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Voiding the {templateLabel} requires a reason and cannot be undone. The carrier
          will need to re-sign before they can proceed.
        </DialogContentText>
        <TextField
          autoFocus
          multiline
          minRows={3}
          fullWidth
          label="Reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          Void agreement
        </Button>
      </DialogActions>
    </Dialog>
  );
};
