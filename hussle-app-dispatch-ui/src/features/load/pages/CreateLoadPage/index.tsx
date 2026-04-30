import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Chip, Divider, Fade, Stack } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import { DetailLayout } from 'components/DetailLayout';
import { useFormRef } from '../../../../mocho/hooks/useFormRef';
import { useDirtyFormBlocker } from '../../../../mocho/forms/hooks/useDirtyFormBlocker';
import { useModalActions } from '../../../ui/hooks/useModalActions';
import { closeModal as closeModalAction } from '../../../ui/store/reducers/uiSlice';
import { createLoadRequest } from '../../store/reducers';
import { selectLoadCreateLoading } from '../../store/selectors/loadSelectors';
import type {
  CreateLoadInput,
  FinancialSummary,
  IntelLocationState,
  LoadTemplate,
  QueuedDocument,
} from '../../types';
import { KpiCell, Meta } from 'components/Typography';
import type { LoadFormValues } from '../../validators/loadSchema';
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
  const hasSubmittedRef = useRef(false);

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

  const locationState = location.state as IntelLocationState | null;
  const intelPrefill = locationState?.intelPrefill;

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
      dispatch(
        createLoadRequest({
          data: {
            ...payload.data,
            status: 'BOOKED',
          },
          queuedDocuments: payload.queuedDocuments,
        }),
      );
    },
    [dispatch],
  );

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

  const headerActions = loadType ? (
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
  ) : null;

  return (
    <PageWrapper errorContext="CreateLoadPage">
      <DetailLayout
        id="New Load"
        breadcrumb={{ label: 'Loads', href: '/loads' }}
        onBack={handleBack}
        actions={headerActions}
        summary={<CreateLoadSummaryBar financials={financials} />}
      >
        <CreateLoadForm
          ref={formRef}
          onSubmit={handleSubmit}
          onStateChange={handleFormStateChange}
          onFinancialsChange={handleFinancialsChange}
          initialLoadType={loadType}
          template={template}
          intelPrefill={intelPrefill}
        />
      </DetailLayout>
    </PageWrapper>
  );
};

export default CreateLoadPage;
