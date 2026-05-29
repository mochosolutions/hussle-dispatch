import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, AlertTitle, Box, Button, Chip, Divider, Fade, Stack } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import { DetailLayout } from 'components/DetailLayout';
import { useFormRef } from '../../../../mocho/hooks/useFormRef';
import { useDirtyFormBlocker } from '../../../../mocho/forms/hooks/useDirtyFormBlocker';
import { useModalActions } from '../../../ui/hooks/useModalActions';
import { closeModal as closeModalAction } from '../../../ui/store/reducers/uiSlice';
import { isAdminSelector } from 'features/auth/store/selectors/authSelector';
import { createLoadRequest } from '../../store/reducers';
import {
  selectLoadCreateLoading,
  selectCreateBlockers,
} from '../../store/selectors/loadSelectors';
import type {
  CreateLoadInput,
  FinancialSummary,
  IntelLocationState,
  LoadTemplate,
  QueuedDocument,
} from '../../types';
import { OverrideDispatchDialog } from '../../components/OverrideDispatchDialog';
import { KpiCell, Meta } from 'components/Typography';
import type { LoadFormValues } from '../../validators/loadSchema';
import type { RateconReviewLocationState } from 'features/ratecon-imports/types';
import {
  LOAD_TYPE_OPTIONS,
  formatCurrency,
  formatCurrencyCompact,
  MARGIN_THRESHOLDS,
} from '../../constants';
import { stripUiOnlyFields } from '../../utils/stripUiOnlyFields';
import { CreateLoadActions } from '../../components/CreateLoadPage/CreateLoadActions';
import { CreateLoadForm } from '../../components/CreateLoadPage/CreateLoadForm';
import { KpiGroup, CreateLoadSummaryBar } from '../../components/CreateLoadPage/CreateLoadKpiGroup';

const CreateLoadPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { formRef, formState, handleFormStateChange, submitForm } = useFormRef();
  const { openModal } = useModalActions();
  const isCreating = useSelector(selectLoadCreateLoading);
  const isAdmin = useSelector(isAdminSelector);
  const createBlockers = useSelector(selectCreateBlockers);
  const hasSubmittedRef = useRef(false);
  // Preserve the exact last-submitted payload so an admin override re-submits
  // the identical request plus the two override fields.
  const lastSubmittedPayloadRef = useRef<{
    data: CreateLoadInput;
    queuedDocuments: QueuedDocument[];
    rateconImportId?: string;
  } | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  useDirtyFormBlocker({
    isDirty: formState.isDirty && !hasSubmittedRef.current,
    isSubmitting: formState.isSubmitting,
    onBlock: (blocker, _title, _message) => {
      openModal('dirtyFormConfirm', {
        onConfirm: () => blocker.proceed?.(),
        onCancel: () => blocker.reset?.(),
      });
    },
  });

  const locationState = location.state as
    | (IntelLocationState & Partial<RateconReviewLocationState>)
    | null;
  const intelPrefill = locationState?.intelPrefill;
  const rateconPrefill = locationState?.rateconPrefill ?? undefined;
  const rateconImportId = locationState?.rateconImportId;
  const rateconCustomerHint = locationState?.rateconCustomerHint ?? null;
  const rateconRequiresReview = locationState?.rateconRequiresReview ?? false;
  const rateconWarnings = locationState?.rateconWarnings ?? [];

  const loadType = 'std';
  // const [loadType, setLoadType] = useState<string | null>(intelPrefill ? 'std' : null);
  const [template, setTemplate] = useState<LoadTemplate | undefined>();
  const [cancelled, setCancelled] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [financials, setFinancials] = useState<FinancialSummary>({
    customerRate: 0,
    grossMargin: 0,
    marginPct: 0,
    ratePerMile: 0,
    tripMiles: 0,
    deadheadMiles: 0,
    totalMiles: 0,
    ratePerTotalMile: 0,
    minBookRate: null,
    avgCostPerMile: null,
    carrierPay: 0,
  });
  const draftSaveInitiated = useRef(false);
  const wasCreating = useRef(false);

  const loadTypeLabel = useMemo(() => {
    if (!loadType) {
      return '';
    }
    const option = LOAD_TYPE_OPTIONS.find((opt) => opt.key === loadType);
    return option?.label ?? loadType;
  }, [loadType]);

  useEffect(() => {
    if (wasCreating.current && !isCreating && draftSaveInitiated.current) {
      setDraftSaved(true);
      draftSaveInitiated.current = false;
    }
    wasCreating.current = isCreating;
  }, [isCreating]);

  const handleSubmit = useCallback(
    (payload: { data: CreateLoadInput; queuedDocuments: QueuedDocument[] }) => {
      hasSubmittedRef.current = true;
      const requestPayload = {
        data: {
          ...payload.data,
          status: 'BOOKED' as const,
        },
        queuedDocuments: payload.queuedDocuments,
        rateconImportId,
      };
      lastSubmittedPayloadRef.current = requestPayload;
      dispatch(createLoadRequest(requestPayload));
    },
    [dispatch, rateconImportId],
  );

  const handleOverrideConfirm = useCallback(
    (reason: string) => {
      const original = lastSubmittedPayloadRef.current;
      if (!original) {
        return;
      }
      setOverrideDialogOpen(false);
      const overridePayload = {
        ...original,
        data: {
          ...original.data,
          overrideDispatch: true,
          overrideReason: reason,
        },
      };
      lastSubmittedPayloadRef.current = overridePayload;
      dispatch(createLoadRequest(overridePayload));
    },
    [dispatch],
  );

  const canOverrideCreate =
    isAdmin && createBlockers.length > 0 && createBlockers.every((blocker) => blocker.overridable);

  const handleSaveDraft = useCallback(() => {
    if (formRef.current) {
      const formValues = formRef.current.getValues() as LoadFormValues;
      const stripped = stripUiOnlyFields(formValues);
      draftSaveInitiated.current = true;
      dispatch(
        createLoadRequest({
          data: { ...stripped, status: 'QUOTED' },
        }),
      );
    }
  }, [dispatch, formRef]);

  const handleFinancialsChange = useCallback((data: FinancialSummary) => {
    setFinancials(data);
  }, []);

  const handleBack = useCallback(() => {
    navigate('/loads');
  }, [navigate]);

  const draftSavedIndicator = draftSaved ? (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <FiberManualRecordIcon sx={{ fontSize: 8, color: 'success.main' }} />
      <Meta sx={{ color: 'grey.300' }}>Draft saved</Meta>
    </Box>
  ) : null;

  const headerActions = (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      {loadType && (
        <Chip
          label={loadTypeLabel}
          size="small"
          variant="outlined"
          sx={{ color: 'grey.300', borderColor: 'grey.500' }}
        />
      )}
      {draftSavedIndicator}
      <CreateLoadActions
        formState={formState}
        isCreating={isCreating}
        onSaveDraft={handleSaveDraft}
        onCreateBooked={submitForm}
      />
    </Stack>
  );

  return (
    <PageWrapper errorContext="CreateLoadPage">
      <DetailLayout
        id="Create New Load"
        breadcrumb={{ label: 'Loads', href: '/loads' }}
        onBack={handleBack}
        actions={headerActions}
        summary={<CreateLoadSummaryBar financials={financials} />}
      >
        {rateconPrefill && (
          <Alert severity={rateconRequiresReview ? 'warning' : 'info'} sx={{ mb: 2 }}>
            <AlertTitle>Prefilled from rate confirmation</AlertTitle>
            Review the details below before creating the load.
            {rateconCustomerHint?.companyName && (
              <Box sx={{ mt: 1 }}>
                Detected customer: <strong>{rateconCustomerHint.companyName}</strong>
                {rateconCustomerHint.mcNumber && ` (MC# ${rateconCustomerHint.mcNumber})`} — search
                and select or create it below.
              </Box>
            )}
            {rateconRequiresReview && rateconWarnings.length > 0 && (
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2.5 }}>
                {rateconWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </Box>
            )}
          </Alert>
        )}
        {createBlockers.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Cannot dispatch this load</AlertTitle>
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.5 }}>
              {createBlockers.map((blocker) => (
                <li key={blocker.code}>{blocker.message}</li>
              ))}
            </Box>
            {canOverrideCreate && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                sx={{ mt: 1.5 }}
                onClick={() => setOverrideDialogOpen(true)}
              >
                Override & dispatch anyway
              </Button>
            )}
          </Alert>
        )}
        <CreateLoadForm
          ref={formRef}
          onSubmit={handleSubmit}
          onStateChange={handleFormStateChange}
          onFinancialsChange={handleFinancialsChange}
          initialLoadType={loadType}
          template={template}
          intelPrefill={intelPrefill}
          rateconPrefill={rateconPrefill}
          rateconCustomerHint={rateconCustomerHint}
        />
      </DetailLayout>
      <OverrideDispatchDialog
        open={overrideDialogOpen}
        blockers={createBlockers}
        submitting={isCreating}
        onConfirm={handleOverrideConfirm}
        onCancel={() => setOverrideDialogOpen(false)}
      />
    </PageWrapper>
  );
};

export default CreateLoadPage;
