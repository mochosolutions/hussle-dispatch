import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  Grid,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { StatusBadge } from 'components/Statusbadge';
import { SubmitButton } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import { transitionLoadStatusRequest, assignAndDispatchRequest } from '../../store/reducers';
import { closeModal } from 'features/ui/store/reducers/uiSlice';
import {
  selectLoadDetailById,
  selectLoadTransitionLoading,
  selectLoadTransitionFulfilled,
  selectLoadAssignAndDispatchLoading,
  selectLoadAssignAndDispatchFulfilled,
} from '../../store/selectors/loadSelectors';
import { STATUS_LABELS, TRANSITION_PREREQUISITES } from '../../constants';
import type { LoadStatus } from '../../types';
import AssignmentFieldGroup from '../AssignmentFieldGroup';

interface StatusChangeDialogProps {
  loadId: string;
  targetStatus: LoadStatus;
}

const NOTES_REQUIRED_STATUSES: LoadStatus[] = ['EXCEPTION', 'CANCELED', 'TONU'];
const DESTRUCTIVE_STATUSES: LoadStatus[] = ['CANCELED', 'EXCEPTION', 'TONU'];

const ASSIGNMENT_FIELDS = ['carrierId', 'driverId', 'vehicleId'] as const;

export const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  loadId,
  targetStatus,
}) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(
    (state) => state.pages.ui?.modal?.modalType === 'statusChangeDialog',
  );
  const load = useSelector(selectLoadDetailById(loadId));

  const isTransitionLoading = useSelector(selectLoadTransitionLoading(loadId));
  const isAssignAndDispatchLoading = useSelector(selectLoadAssignAndDispatchLoading(loadId));
  const isTransitionFulfilled = useSelector(selectLoadTransitionFulfilled(loadId));
  const isAssignAndDispatchFulfilled = useSelector(selectLoadAssignAndDispatchFulfilled(loadId));

  const isSubmitting = isTransitionLoading || isAssignAndDispatchLoading;
  const isFulfilled = isTransitionFulfilled || isAssignAndDispatchFulfilled;

  // Close the modal on the Pending → Fulfilled edge.
  // Tracking the previous Pending state ensures we only fire on a real
  // transition, not when re-opening the dialog after a prior success
  // (whose Fulfilled state is still in Redux).
  const wasSubmittingRef = useRef(false);
  useEffect(() => {
    if (wasSubmittingRef.current && !isSubmitting && isFulfilled) {
      dispatch(closeModal());
    }
    wasSubmittingRef.current = isSubmitting;
  }, [isSubmitting, isFulfilled, dispatch]);

  const [notes, setNotes] = useState('');

  // Assignment form state for inline dispatch flow
  const [assignmentValues, setAssignmentValues] = useState({
    carrierId: load?.carrierId ?? '',
    driverId: load?.driverId ?? '',
    vehicleId: load?.vehicleId ?? '',
  });

  const prerequisites = useMemo(() => {
    if (!load) {
      return [];
    }
    return (TRANSITION_PREREQUISITES[targetStatus] ?? []).map((prereq) => ({
      label: prereq.label,
      met: Boolean(load[prereq.field as keyof typeof load]),
      field: prereq.field,
    }));
  }, [load, targetStatus]);

  const needsInlineAssignment =
    targetStatus === 'DISPATCHED' &&
    prerequisites.some(
      (p) => !p.met && p.field && ASSIGNMENT_FIELDS.includes(p.field as typeof ASSIGNMENT_FIELDS[number]),
    );

  // Dynamic prerequisites — check assignment form values instead of static load data
  const dynamicPrerequisites = useMemo(() => {
    if (!needsInlineAssignment) {
      return prerequisites;
    }

    return prerequisites.map((prereq) => {
      if (prereq.field && ASSIGNMENT_FIELDS.includes(prereq.field as typeof ASSIGNMENT_FIELDS[number])) {
        return {
          ...prereq,
          met: Boolean(assignmentValues[prereq.field as keyof typeof assignmentValues]),
        };
      }
      return prereq;
    });
  }, [prerequisites, needsInlineAssignment, assignmentValues]);

  const hasUnmetPrereqs = dynamicPrerequisites.some((p) => !p.met);
  const isNotesRequired = NOTES_REQUIRED_STATUSES.includes(targetStatus);
  const isConfirmDisabled =
    hasUnmetPrereqs || (isNotesRequired && notes.trim().length === 0);

  // Formik-compatible interface for AssignmentFieldGroup
  const assignmentFormik = useMemo(
    () => ({
      values: assignmentValues,
      setFieldValue: (field: string, value: unknown) => {
        setAssignmentValues((prev) => ({ ...prev, [field]: value }));
        return Promise.resolve();
      },
      getFieldMeta: (_field: string) => ({ touched: false, error: undefined }),
      setFieldTouched: (_field: string, _touched?: boolean) => Promise.resolve(),
    }),
    [assignmentValues],
  );

  const handleClose = (_event: object, reason?: 'backdropClick' | 'escapeKeyDown') => {
    if (reason === 'backdropClick') {
      return;
    }
    dispatch(closeModal());
  };

  const handleConfirm = useCallback(() => {
    if (needsInlineAssignment) {
      dispatch(
        assignAndDispatchRequest({
          loadId,
          assignment: {
            carrierId: assignmentValues.carrierId || undefined,
            driverId: assignmentValues.driverId || undefined,
            vehicleId: assignmentValues.vehicleId || undefined,
          },
          notes: notes.trim() || undefined,
        }),
      );
    } else {
      dispatch(
        transitionLoadStatusRequest({
          loadId,
          input: {
            status: targetStatus,
            notes: notes.trim() || undefined,
          },
        }),
      );
    }
    // Modal closes via the Pending → Fulfilled effect above, not here,
    // so the spinner stays visible until the saga resolves.
  }, [
    dispatch,
    loadId,
    targetStatus,
    notes,
    needsInlineAssignment,
    assignmentValues,
  ]);

  const handleNotesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNotes(event.target.value);
    },
    [],
  );

  if (!load) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Change Status: {load.loadNumber}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <StatusBadge status={load.status} />
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

          {dynamicPrerequisites.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                Prerequisites
              </Typography>
              <Stack spacing={0.5}>
                {dynamicPrerequisites.map((prereq) => (
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

          {needsInlineAssignment && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                Assign Driver & Vehicle
              </Typography>
              <Grid container spacing={2}>
                <AssignmentFieldGroup formik={assignmentFormik} />
              </Grid>
            </Box>
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
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <SubmitButton
          label={needsInlineAssignment ? 'Assign & Dispatch' : 'Confirm'}
          loading={isSubmitting}
          disabled={isConfirmDisabled}
          fullWidth={false}
          size="medium"
          type="button"
          onClick={handleConfirm}
        />
      </DialogActions>
    </Dialog>
  );
};
