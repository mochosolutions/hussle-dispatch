import React, { useState, useCallback } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  Alert,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { StatusBadge } from 'components/Statusbadge';
import { useDispatch } from 'store';
import { transitionLoadStatusRequest } from '../../store/reducers';
import { STATUS_LABELS } from '../../constants';
import type { LoadStatus, StatusTransitionWarning } from '../../types';

interface PrerequisiteCheck {
  label: string;
  met: boolean;
}

interface StatusChangeDialogProps {
  open: boolean;
  onClose: () => void;
  loadId: string;
  loadNumber: string;
  currentStatus: LoadStatus;
  targetStatus: LoadStatus;
  warnings?: StatusTransitionWarning[];
  prerequisites?: PrerequisiteCheck[];
  isLoading?: boolean;
}

const NOTES_REQUIRED_STATUSES: LoadStatus[] = ['EXCEPTION', 'CANCELED', 'TONU'];
const DESTRUCTIVE_STATUSES: LoadStatus[] = ['CANCELED', 'EXCEPTION', 'TONU'];

export const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  open,
  onClose,
  loadId,
  loadNumber,
  currentStatus,
  targetStatus,
  warnings = [],
  prerequisites = [],
  isLoading = false,
}) => {
  const dispatch = useDispatch();
  const [notes, setNotes] = useState('');
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  const hasUnmetPrereqs = prerequisites.some((p) => !p.met);
  const isNotesRequired = NOTES_REQUIRED_STATUSES.includes(targetStatus);
  const isConfirmDisabled =
    isLoading ||
    hasUnmetPrereqs ||
    (isNotesRequired && notes.trim().length === 0) ||
    (warnings.length > 0 && !warningAcknowledged);

  const handleConfirm = useCallback(() => {
    dispatch(
      transitionLoadStatusRequest({
        loadId,
        input: {
          status: targetStatus,
          notes: notes.trim() || undefined,
          overrideWarnings: warningAcknowledged,
        },
      }),
    );
    onClose();
  }, [dispatch, loadId, targetStatus, notes, warningAcknowledged, onClose]);

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
            <StatusBadge status={currentStatus} />
            <Typography variant="body2" color="text.secondary">
              &rarr;
            </Typography>
            <StatusBadge status={targetStatus} />
          </Stack>

          {DESTRUCTIVE_STATUSES.includes(targetStatus) && (
            <Alert severity="error">
              This action cannot be easily reversed. The load will be marked
              as {STATUS_LABELS[targetStatus]}.
            </Alert>
          )}

          {prerequisites.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                Prerequisites
              </Typography>
              <Stack spacing={0.5}>
                {prerequisites.map((prereq) => (
                  <Box key={prereq.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {prereq.met ? (
                      <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                    <Typography
                      variant="body2"
                      color={prereq.met ? 'text.secondary' : 'error.main'}
                    >
                      {prereq.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={warningAcknowledged}
                    onChange={(e) => setWarningAcknowledged(e.target.checked)}
                    size="small"
                  />
                }
                label="I understand these warnings and want to proceed"
                sx={{ mt: 0.5 }}
              />
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
