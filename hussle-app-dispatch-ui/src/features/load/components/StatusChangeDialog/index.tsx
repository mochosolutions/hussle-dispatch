import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  TextField,
} from '@mui/material';
import { FieldLabel, Meta, MetaStrong } from 'components/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { StatusBadge } from 'components/Statusbadge';
import { SingleDocumentUpload } from 'components/SingleDocumentUpload';
import { SubmitButton } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import {
  transitionLoadStatusRequest,
  assignAndDispatchRequest,
  clearOnboardingBlock,
  fetchLoadDetailsRequest,
} from '../../store/reducers';
import { closeModal, openModal } from 'features/ui/store/reducers/uiSlice';
import {
  uploadDocumentRequest,
  clearUploadStatus,
} from 'features/documents/store/reducers/documentPageSlice';
import {
  selectUploadStatus,
  selectUploadError,
} from 'features/documents/store/selectors/documentSelectors';
import {
  selectLoadTransitionLoading,
  selectLoadTransitionFulfilled,
  selectLoadAssignAndDispatchLoading,
  selectLoadAssignAndDispatchFulfilled,
  selectOnboardingBlock,
} from '../../store/selectors/loadSelectors';
import { formattedCurrentUserSelector } from 'features/auth/store/selectors/authSelector';
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

type SingleUploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const toSingleUploadStatus = (status: string): SingleUploadStatus => {
  if (status === 'Pending') {
    return 'uploading';
  }
  if (status === 'Fulfilled') {
    return 'success';
  }
  if (status === 'Rejected') {
    return 'error';
  }
  return 'idle';
};

export const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({ load, targetStatus }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.pages.ui?.modal?.modalType === 'statusChangeDialog');

  const loadId = load.id;

  const isTransitionLoading = useSelector(selectLoadTransitionLoading(loadId));
  const isAssignAndDispatchLoading = useSelector(selectLoadAssignAndDispatchLoading(loadId));
  const isTransitionFulfilled = useSelector(selectLoadTransitionFulfilled(loadId));
  const isAssignAndDispatchFulfilled = useSelector(selectLoadAssignAndDispatchFulfilled(loadId));

  const onboardingBlock = useSelector(selectOnboardingBlock);
  const currentUserFormatted = useSelector(formattedCurrentUserSelector);
  const isAdmin = currentUserFormatted.role === 'admin' || currentUserFormatted.role === 'ADMIN';

  const isSubmitting = isTransitionLoading || isAssignAndDispatchLoading;
  const isFulfilled = isTransitionFulfilled || isAssignAndDispatchFulfilled;

  // Clear onboarding block when dialog opens
  useEffect(() => {
    dispatch(clearOnboardingBlock());
  }, [dispatch]);

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

  // Independent clientIds for the rate-con and BOL upload slots
  const rateConClientId = useMemo(() => crypto.randomUUID(), []);
  const bolClientId = useMemo(() => crypto.randomUUID(), []);

  const [rateConFileName, setRateConFileName] = useState<string | undefined>(undefined);
  const [bolFileName, setBolFileName] = useState<string | undefined>(undefined);

  const rateConUploadStatus = useSelector(selectUploadStatus(rateConClientId));
  const rateConUploadError = useSelector(selectUploadError(rateConClientId));
  const bolUploadStatus = useSelector(selectUploadStatus(bolClientId));
  const bolUploadError = useSelector(selectUploadError(bolClientId));

  const isRateConUploaded = rateConUploadStatus === 'Fulfilled';
  const isBolUploaded = bolUploadStatus === 'Fulfilled';

  // Refetch load detail once BOL upload settles so tracking.bolSignedAt
  // reflects the loadTimestampSubscriber-stamped value. Section will then
  // self-hide on next render.
  const bolRefetchedRef = useRef(false);
  useEffect(() => {
    if (isBolUploaded && !bolRefetchedRef.current) {
      bolRefetchedRef.current = true;
      dispatch(fetchLoadDetailsRequest({ id: loadId }));
    }
  }, [isBolUploaded, dispatch, loadId]);

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

  const needsOptionalBolUpload =
    targetStatus === 'DELIVERED' && !load.tracking?.hasSignedBol;

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

  const handleRateConUpload = useCallback(
    (file: File, expiresAt: string, metadata: Record<string, string>) => {
      setRateConFileName(file.name);
      dispatch(
        uploadDocumentRequest({
          file,
          documentType: DocumentType.BROKER_RATE_CON,
          entityType: 'load',
          entityId: loadId,
          clientId: rateConClientId,
          expiresAt: expiresAt || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        }),
      );
    },
    [dispatch, loadId, rateConClientId],
  );

  const handleRateConReset = useCallback(() => {
    setRateConFileName(undefined);
    dispatch(clearUploadStatus({ clientId: rateConClientId }));
  }, [dispatch, rateConClientId]);

  const handleBolUpload = useCallback(
    (file: File, expiresAt: string, metadata: Record<string, string>) => {
      setBolFileName(file.name);
      bolRefetchedRef.current = false;
      dispatch(
        uploadDocumentRequest({
          file,
          documentType: DocumentType.BOL_SIGNED,
          entityType: 'load',
          entityId: loadId,
          clientId: bolClientId,
          expiresAt: expiresAt || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        }),
      );
    },
    [dispatch, loadId, bolClientId],
  );

  const handleBolReset = useCallback(() => {
    setBolFileName(undefined);
    dispatch(clearUploadStatus({ clientId: bolClientId }));
  }, [dispatch, bolClientId]);

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

  const handleDispatchOverride = useCallback(() => {
    if (!onboardingBlock) return;
    dispatch(closeModal());
    dispatch(
      openModal({
        modalType: 'dispatchOverride',
        modalProps: {
          carrierId: onboardingBlock.carrierId,
          carrierName: onboardingBlock.carrierName,
          loadId: onboardingBlock.loadId,
          missingDocuments: onboardingBlock.missingDocuments,
        },
      }),
    );
  }, [dispatch, onboardingBlock]);

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Status: {load.loadNumber}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <StatusBadge status={load.status} />
            <Meta>
              &rarr;
            </Meta>
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
              <FieldLabel sx={{ mb: 0.5, display: 'block' }}>
                Prerequisites
              </FieldLabel>
              <Stack spacing={0.5}>
                {dynamicPrerequisites.map((prereq) => (
                  <Box key={prereq.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {prereq.met ? (
                      <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                    <Meta sx={{ color: prereq.met ? 'text.secondary' : 'error.main' }}>
                      {prereq.label}
                    </Meta>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {needsInlineAssignment && (
            <Box>
              <FieldLabel sx={{ mb: 1, display: 'block' }}>
                Assign Driver & Vehicle
              </FieldLabel>
              <Grid container spacing={2}>
                <AssignmentFieldGroup formik={assignmentFormik} />
              </Grid>
            </Box>
          )}

          {needsRateConUpload && (
            <Box>
              <FieldLabel sx={{ mb: 1, display: 'block' }}>
                Upload Rate Confirmation
              </FieldLabel>
              <SingleDocumentUpload
                documentType={DocumentType.BROKER_RATE_CON}
                status={toSingleUploadStatus(rateConUploadStatus)}
                errorMessage={rateConUploadError ?? undefined}
                fileName={rateConFileName}
                onUpload={handleRateConUpload}
                onReset={handleRateConReset}
              />
            </Box>
          )}

          {needsOptionalBolUpload && (
            <Alert
              severity="info"
              icon={<CloudUploadOutlinedIcon />}
              sx={{ alignItems: 'flex-start' }}
            >
              <MetaStrong sx={{ mb: 0.5, color: 'text.primary' }}>
                Signed BOL (optional)
              </MetaStrong>
              <Meta sx={{ display: 'block', mb: 1, color: 'text.primary' }}>
                Upload now to start the invoice. You can mark delivered without it; the
                invoice will be created automatically once the signed BOL is on file.
              </Meta>
              <SingleDocumentUpload
                documentType={DocumentType.BOL_SIGNED}
                status={toSingleUploadStatus(bolUploadStatus)}
                errorMessage={bolUploadError ?? undefined}
                fileName={bolFileName}
                onUpload={handleBolUpload}
                onReset={handleBolReset}
              />
            </Alert>
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

          {onboardingBlock && onboardingBlock.loadId === loadId && (
            <Alert
              severity="warning"
              action={
                isAdmin ? (
                  <Button
                    color="warning"
                    variant="outlined"
                    size="small"
                    onClick={handleDispatchOverride}
                  >
                    Dispatch Anyway
                  </Button>
                ) : undefined
              }
            >
              {onboardingBlock.carrierName} has incomplete onboarding.
              {!isAdmin && ' Contact an admin to override.'}
            </Alert>
          )}
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
