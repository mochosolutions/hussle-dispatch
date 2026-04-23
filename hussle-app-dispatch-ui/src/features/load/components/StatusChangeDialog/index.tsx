import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { StatusBadge } from 'components/Statusbadge';
import { SubmitButton } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import { transitionLoadStatusRequest, assignAndDispatchRequest } from '../../store/reducers';
import { closeModal } from 'features/ui/store/reducers/uiSlice';
import { uploadDocumentRequest } from 'features/documents/store/reducers/documentPageSlice';
import {
  selectUploadStatus,
  selectUploadError,
} from 'features/documents/store/selectors/documentSelectors';
import {
  selectLoadTransitionLoading,
  selectLoadTransitionFulfilled,
  selectLoadAssignAndDispatchLoading,
  selectLoadAssignAndDispatchFulfilled,
} from '../../store/selectors/loadSelectors';
import { DocumentType } from 'features/documents/types';
import { STATUS_LABELS, TRANSITION_PREREQUISITES } from '../../constants';
import type { LoadDetail, LoadStatus } from '../../types';
import AssignmentFieldGroup from '../AssignmentFieldGroup';

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);

interface StatusChangeDialogProps {
  load: LoadDetail;
  targetStatus: LoadStatus;
}

const NOTES_REQUIRED_STATUSES: LoadStatus[] = ['EXCEPTION', 'CANCELED', 'TONU'];
const DESTRUCTIVE_STATUSES: LoadStatus[] = ['CANCELED', 'EXCEPTION', 'TONU'];

const ASSIGNMENT_FIELDS = [
  'assignment.carrier.id',
  'assignment.driver.id',
  'assignment.vehicle.id',
] as const;

const RATE_CON_FIELD = 'tracking.rateConReceivedAt';

const ASSIGNMENT_FIELD_TO_KEY: Record<string, 'carrierId' | 'driverId' | 'vehicleId'> = {
  'assignment.carrier.id': 'carrierId',
  'assignment.driver.id': 'driverId',
  'assignment.vehicle.id': 'vehicleId',
};

export const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({ load, targetStatus }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.pages.ui?.modal?.modalType === 'statusChangeDialog');

  const loadId = load.id;

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

  // Inline rate con upload state
  const [rateConUpload, setRateConUpload] = useState<{
    clientId: string;
    fileName: string;
  } | null>(null);
  const rateConInputRef = useRef<HTMLInputElement>(null);
  const rateConUploadStatus = useSelector(
    selectUploadStatus(rateConUpload?.clientId ?? ''),
  );
  const rateConUploadError = useSelector(
    selectUploadError(rateConUpload?.clientId ?? ''),
  );
  const isRateConUploaded = rateConUploadStatus === 'Fulfilled';

  // Assignment form state for inline dispatch flow
  const [assignmentValues, setAssignmentValues] = useState({
    carrierId: load?.assignment.carrier?.id ?? '',
    driverId: load?.assignment.driver?.id ?? '',
    vehicleId: load?.assignment.vehicle?.id ?? '',
  });

  const prerequisites = useMemo(
    () =>
      (TRANSITION_PREREQUISITES[targetStatus] ?? []).map((prereq) => ({
        label: prereq.label,
        met: Boolean(getNestedValue(load as unknown as Record<string, unknown>, prereq.field)),
        field: prereq.field,
      })),
    [load, targetStatus],
  );

  const needsInlineAssignment =
    targetStatus === 'DISPATCHED' &&
    prerequisites.some(
      (p) =>
        !p.met &&
        p.field &&
        ASSIGNMENT_FIELDS.includes(p.field as (typeof ASSIGNMENT_FIELDS)[number]),
    );

  const needsRateConUpload =
    targetStatus === 'DISPATCHED' &&
    prerequisites.some((p) => !p.met && p.field === RATE_CON_FIELD);

  // Dynamic prerequisites — check assignment form values and rate con upload status
  const dynamicPrerequisites = useMemo(() => {
    if (!needsInlineAssignment && !needsRateConUpload) {
      return prerequisites;
    }

    return prerequisites.map((prereq) => {
      if (
        prereq.field &&
        ASSIGNMENT_FIELDS.includes(prereq.field as (typeof ASSIGNMENT_FIELDS)[number])
      ) {
        const key = ASSIGNMENT_FIELD_TO_KEY[prereq.field];
        return {
          ...prereq,
          met: Boolean(key && assignmentValues[key]),
        };
      }
      if (prereq.field === RATE_CON_FIELD && isRateConUploaded) {
        return { ...prereq, met: true };
      }
      return prereq;
    });
  }, [prerequisites, needsInlineAssignment, needsRateConUpload, assignmentValues, isRateConUploaded]);

  const hasUnmetPrereqs = dynamicPrerequisites.some((p) => !p.met);
  const isNotesRequired = NOTES_REQUIRED_STATUSES.includes(targetStatus);
  const isConfirmDisabled = hasUnmetPrereqs || (isNotesRequired && notes.trim().length === 0);

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

  const handleRateConFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const clientId = crypto.randomUUID();
      setRateConUpload({ clientId, fileName: file.name });
      dispatch(
        uploadDocumentRequest({
          file,
          documentType: DocumentType.BROKER_RATE_CON,
          entityType: 'load',
          entityId: loadId,
          clientId,
        }),
      );
      e.target.value = '';
    },
    [dispatch, loadId],
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
  }, [dispatch, loadId, targetStatus, notes, needsInlineAssignment, assignmentValues]);

  const handleNotesChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(event.target.value);
  }, []);

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Status: {load.loadNumber}</DialogTitle>
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
              This action cannot be easily reversed. The load will be marked as{' '}
              {STATUS_LABELS[targetStatus]}.
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

          {needsRateConUpload && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                Upload Rate Confirmation
              </Typography>
              {!rateConUpload ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CloudUploadOutlinedIcon />}
                    onClick={() => rateConInputRef.current?.click()}
                  >
                    Select Rate Con
                  </Button>
                  <input
                    ref={rateConInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleRateConFileChange}
                    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
                  />
                </>
              ) : (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ px: 1.5, py: 1, borderRadius: 1, backgroundColor: 'action.hover' }}
                >
                  {rateConUploadStatus === 'Pending' && (
                    <LinearProgress
                      sx={{ width: 24, height: 4, borderRadius: 1, flexShrink: 0 }}
                    />
                  )}
                  {rateConUploadStatus === 'Fulfilled' && (
                    <CheckCircleOutlineIcon sx={{ fontSize: 20, color: 'success.main' }} />
                  )}
                  {rateConUploadStatus === 'Rejected' && (
                    <ErrorOutlineIcon sx={{ fontSize: 20, color: 'error.main' }} />
                  )}
                  <Chip label="Rate Con" size="small" variant="outlined" color="primary" />
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {rateConUpload.fileName}
                  </Typography>
                  {rateConUploadStatus === 'Rejected' && rateConUploadError && (
                    <Typography variant="caption" color="error.main">
                      {rateConUploadError}
                    </Typography>
                  )}
                  {rateConUploadStatus === 'Rejected' && (
                    <IconButton
                      size="small"
                      aria-label="Remove failed upload"
                      onClick={() => setRateConUpload(null)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              )}
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
