import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useDispatch } from 'store';
import { transitionLoadStatusRequest } from '../../store/reducers';
import { STATUS_LABELS } from '../../constants';
import type { LoadStatus, StatusTransitionWarning } from '../../types';

interface StatusChangeDialogProps {
  open: boolean;
  onClose: () => void;
  loadId: string;
  loadNumber: string;
  currentStatus: LoadStatus;
  targetStatus: LoadStatus;
  warnings?: StatusTransitionWarning[];
  isLoading?: boolean;
}

const NOTES_REQUIRED_STATUSES: LoadStatus[] = ['EXCEPTION', 'CANCELED', 'TONU'];

export const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  open,
  onClose,
  loadId,
  loadNumber,
  currentStatus,
  targetStatus,
  warnings = [],
  isLoading = false,
}) => {
  const dispatch = useDispatch();
  const [notes, setNotes] = useState('');

  const isNotesRequired = NOTES_REQUIRED_STATUSES.includes(targetStatus);
  const isConfirmDisabled = isLoading || (isNotesRequired && notes.trim().length === 0);

  const handleConfirm = useCallback(() => {
    dispatch(
      transitionLoadStatusRequest({
        loadId,
        input: {
          targetStatus,
          notes: notes.trim() || undefined,
          overrideWarnings: warnings.length > 0,
        },
      }),
    );
    onClose();
  }, [dispatch, loadId, targetStatus, notes, warnings, onClose]);

  const handleNotesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNotes(event.target.value);
    },
    [],
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Change Status: {loadNumber}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={STATUS_LABELS[currentStatus]}
              size="small"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              &rarr;
            </Typography>
            <Chip
              label={STATUS_LABELS[targetStatus]}
              size="small"
              color="primary"
            />
          </Stack>

          {warnings.length > 0 && (
            <Stack spacing={1}>
              {warnings.map((warning) => (
                <Alert key={warning.code} severity="warning">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {warning.message}
                  </Typography>
                  {warning.detail && (
                    <Typography variant="caption" color="text.secondary">
                      {warning.detail}
                    </Typography>
                  )}
                </Alert>
              ))}
            </Stack>
          )}

          <TextField
            label="Notes"
            multiline
            rows={3}
            value={notes}
            onChange={handleNotesChange}
            fullWidth
            required={isNotesRequired}
            helperText={
              isNotesRequired
                ? `Notes are required when changing status to ${STATUS_LABELS[targetStatus]}`
                : 'Optional notes for this status change'
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={isConfirmDisabled}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
