import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import type { DispatchBlocker } from '../../types';

interface OverrideDispatchDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** The overridable blockers being bypassed — rendered as a list for context */
  blockers: DispatchBlocker[];

  /** Whether the override re-submit is in flight (disables actions) */
  submitting?: boolean;

  /** Called with the typed reason when the admin confirms the override */
  onConfirm: (reason: string) => void;

  /** Called when the admin cancels or dismisses the dialog */
  onCancel: () => void;
}

/**
 * Admin-only confirmation for bypassing overridable dispatch requirements.
 *
 * Requires a typed reason — the "Dispatch anyway" button stays disabled until
 * the reason is non-empty. On confirm, the trimmed reason is passed back so the
 * caller can re-submit the original payload with overrideDispatch + reason.
 */
export const OverrideDispatchDialog: React.FC<OverrideDispatchDialogProps> = ({
  open,
  blockers,
  submitting = false,
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState('');

  const handleClose = (_event: object, dismissReason?: 'backdropClick' | 'escapeKeyDown') => {
    if (dismissReason === 'backdropClick' || submitting) {
      return;
    }
    onCancel();
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Override dispatch requirements?</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          The following requirement{blockers.length > 1 ? 's are' : ' is'} not met. As an admin you
          may dispatch anyway. This action is logged.
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2.5 }}>
            {blockers.map((blocker) => (
              <li key={blocker.code}>{blocker.message}</li>
            ))}
          </Box>
        </DialogContentText>
        <TextField
          label="Reason for override"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          multiline
          minRows={2}
          fullWidth
          required
          autoFocus
          disabled={submitting}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={submitting || reason.trim().length === 0}
        >
          Dispatch anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OverrideDispatchDialog;
