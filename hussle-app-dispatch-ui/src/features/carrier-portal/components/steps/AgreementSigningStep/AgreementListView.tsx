import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import {
  ArrowForwardOutlined,
  CheckCircleOutline,
  CloudUploadOutlined,
  ErrorOutline,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

import { useDispatch, useSelector } from 'store';
import { Body, BodyStrong } from 'components/Typography';

import type { DocumentSlot, Step } from 'features/carrier-portal/engine';
import {
  selectAgreements,
  selectAllAgreementsSigned,
  selectDocuments,
  selectLoading,
  selectSession,
  selectVisibleAgreementKeys,
} from '../../../store/selectors/carrierPortalSelectors';
import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import { useStepNavigation } from '../../StepNavContext';
import OnboardingCard from '../../OnboardingCard';
import ProgressStrip from '../../ProgressStrip';
import DocumentRow from '../../DocumentRow';
import AgreementsCompleteBanner from '../../AgreementsCompleteBanner';
import AgreementsErrorBanner from '../../AgreementsErrorBanner';
import AgreementsFootNote from '../../AgreementsFootNote';

const AGREEMENT_TITLES: Record<string, string> = {
  DISPATCH_AGREEMENT: 'Dispatch Services Agreement',
};

const titleForKey = (key: string): string => AGREEMENT_TITLES[key] ?? key;

const TERMINAL_FAILURE_STATUSES = new Set(['VOIDED', 'DECLINED', 'EXPIRED']);

const formatTs = (ts: string | null | undefined): string => {
  if (!ts) return '';
  try {
    return format(parseISO(ts), 'PPpp');
  } catch {
    return ts;
  }
};

interface AgreementListViewProps {
  step: Step;
}

const AgreementListView: React.FC<AgreementListViewProps> = ({ step }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();

  const session = useSelector(selectSession);
  const agreements = useSelector(selectAgreements);
  const sessionDocuments = useSelector(selectDocuments);
  const allAgreementsSigned = useSelector(selectAllAgreementsSigned);
  const submitStatus = useSelector(selectLoading('submitStep'));
  const uploadStatus = useSelector(selectLoading('upload'));

  const visibleKeys = useMemo(() => selectVisibleAgreementKeys(session), [session]);
  const documentSlots: DocumentSlot[] = useMemo(() => step.documents ?? [], [step.documents]);
  const requiredDocSlots = useMemo(
    () => documentSlots.filter((d) => d.required),
    [documentSlots],
  );

  const uploadedDocumentTypes = useMemo(
    () => new Set(sessionDocuments.map((d) => d.documentType)),
    [sessionDocuments],
  );

  // Local mirror of in-flight + just-uploaded documents — covers the gap
  // between uploadDocumentSuccess and the next /session refresh that
  // populates session.documents authoritatively.
  const [localUploadedTypes, setLocalUploadedTypes] = useState<Set<string>>(new Set());
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadErrorType, setUploadErrorType] = useState<string | null>(null);
  const prevUploadStatus = useRef(uploadStatus);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (prevUploadStatus.current === 'pending' && uploadStatus === 'success') {
      if (uploadingType !== null) {
        setLocalUploadedTypes((prev) => {
          const next = new Set(prev);
          next.add(uploadingType);
          return next;
        });
        setUploadingType(null);
        setUploadErrorType(null);
      }
    } else if (prevUploadStatus.current === 'pending' && uploadStatus === 'failure') {
      setUploadErrorType(uploadingType);
      setUploadingType(null);
    }
    prevUploadStatus.current = uploadStatus;
  }, [uploadStatus, uploadingType]);

  const isUploaded = useCallback(
    (documentType: string): boolean =>
      uploadedDocumentTypes.has(documentType) || localUploadedTypes.has(documentType),
    [uploadedDocumentTypes, localUploadedTypes],
  );

  const [errorRequested, setErrorRequested] = useState(false);
  const firstIncompleteRef = useRef<HTMLDivElement | null>(null);

  // Walk: first unuploaded required doc → first unsigned required agreement.
  const { firstIncompleteId, uploadedDocCount, signedAgreementCount, allComplete } = useMemo(() => {
    let firstId: string | null = null;
    let uploadedCount = 0;
    for (const slot of documentSlots) {
      if (isUploaded(slot.documentType)) {
        uploadedCount += 1;
      } else if (slot.required && firstId === null) {
        firstId = `doc:${slot.id}`;
      }
    }

    let signedCount = 0;
    for (const key of visibleKeys) {
      if (agreements[key]?.status === 'SIGNED') {
        signedCount += 1;
      } else if (firstId === null) {
        firstId = `agreement:${key}`;
      }
    }

    const allRequiredDocsUploaded = requiredDocSlots.every((d) => isUploaded(d.documentType));
    return {
      firstIncompleteId: firstId,
      uploadedDocCount: uploadedCount,
      signedAgreementCount: signedCount,
      allComplete: allRequiredDocsUploaded && allAgreementsSigned && visibleKeys.length > 0,
    };
  }, [documentSlots, visibleKeys, agreements, requiredDocSlots, isUploaded, allAgreementsSigned]);

  const totalRequired = requiredDocSlots.length + visibleKeys.length;
  const totalComplete = uploadedDocCount + signedAgreementCount;
  const showErrorBanner = errorRequested && !allComplete;

  const handleContinue = useCallback(() => {
    if (allComplete) {
      const signedAgreementIds = visibleKeys
        .map((key) => agreements[key]?.id)
        .filter((id): id is string => typeof id === 'string');
      const uploadedDocumentTypesList = documentSlots
        .map((slot) => slot.documentType)
        .filter((dt) => isUploaded(dt));
      dispatch(
        carrierPortalV2Actions.submitStep({
          stepId: step.id,
          answers: {
            acknowledged: true,
            uploadedDocumentTypes: uploadedDocumentTypesList,
            signedAgreementIds,
          },
        }),
      );
      return;
    }
    setErrorRequested(true);
    window.requestAnimationFrame(() => {
      const el = firstIncompleteRef.current;
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, [allComplete, visibleKeys, agreements, documentSlots, isUploaded, dispatch, step.id]);

  useStepNavigation({
    canContinue: true,
    onContinue: handleContinue,
    isPending: submitStatus === 'pending',
    continueLabel: 'Continue',
  });

  const handleChooseFile = useCallback((docId: string): void => {
    fileInputs.current[docId]?.click();
  }, []);

  const handleFileChange = useCallback(
    (slot: DocumentSlot) =>
      (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (file) {
          setUploadingType(slot.documentType);
          setUploadErrorType(null);
          dispatch(
            carrierPortalV2Actions.uploadDocument({
              documentType: slot.documentType,
              file,
            }),
          );
        }
        // Reset so re-selecting the same file re-fires onChange.
        event.target.value = '';
      },
    [dispatch],
  );

  if (visibleKeys.length === 0 && documentSlots.length === 0) {
    return null;
  }

  // -------- Row builders --------

  const documentRows = documentSlots.map((slot, index) => {
    const rowNumber = index + 1;
    const rowId = `doc:${slot.id}`;
    const uploaded = isUploaded(slot.documentType);
    const inFlight = uploadingType === slot.documentType;
    const hasError = uploadErrorType === slot.documentType;
    const isFirstIncomplete = firstIncompleteId === rowId;

    let rowState: 'signed' | 'next' | 'pending' = 'pending';
    if (uploaded) {
      rowState = 'signed';
    } else if (isFirstIncomplete) {
      rowState = 'next';
    }

    const meta: React.ReactNode[] = [];
    if (uploaded) {
      const sessionDoc = sessionDocuments.find((d) => d.documentType === slot.documentType);
      if (sessionDoc) {
        meta.push(
          <BodyStrong key="uploadedAt" sx={{ fontSize: 11.5 }}>
            {formatTs(sessionDoc.uploadedAt)}
          </BodyStrong>,
        );
      } else {
        meta.push(
          <BodyStrong key="justUploaded" sx={{ fontSize: 11.5 }}>
            Uploaded
          </BodyStrong>,
        );
      }
    }
    if (hasError) {
      meta.push(
        <Body
          key="uploadError"
          sx={{
            fontSize: 11.5,
            color: 'error.main',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <ErrorOutline sx={{ fontSize: 12 }} />
          Upload failed — try again
        </Body>,
      );
    }

    let actions: React.ReactNode = null;
    if (uploaded) {
      actions = (
        <Box
          aria-label="Uploaded"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'success.main',
            fontSize: 13,
            fontWeight: 600,
            px: 1,
          }}
        >
          <CheckCircleOutline sx={{ fontSize: 16 }} />
          Uploaded
        </Box>
      );
    } else if (inFlight) {
      actions = (
        <Box
          aria-label="Uploading"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            color: 'text.secondary',
            fontSize: 13,
            fontWeight: 600,
            px: 1,
          }}
        >
          Uploading…
        </Box>
      );
    } else {
      actions = (
        <button
          type="button"
          onClick={() => handleChooseFile(slot.id)}
          aria-label={`Upload ${slot.label}`}
          style={{
            background: rowState === 'next' ? 'rgb(37, 99, 235)' : 'white',
            color: rowState === 'next' ? 'white' : 'rgb(15, 23, 42)',
            border: rowState === 'next' ? 'none' : '1px solid rgb(226, 232, 240)',
            borderRadius: 6,
            padding: '8px 14px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CloudUploadOutlined sx={{ fontSize: 14 }} />
          Upload
        </button>
      );
    }

    const refProp = isFirstIncomplete
      ? { ref: firstIncompleteRef as React.RefObject<HTMLDivElement | null> }
      : {};

    return (
      <Box key={rowId} {...refProp}>
        <input
          ref={(node) => {
            fileInputs.current[slot.id] = node;
          }}
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          aria-label={`File picker for ${slot.label}`}
          onChange={handleFileChange(slot)}
          style={{ display: 'none' }}
        />
        <DocumentRow
          state={rowState}
          number={rowNumber}
          name={slot.label}
          tag={
            slot.required
              ? { label: 'Required', variant: 'required' }
              : { label: 'Optional', variant: 'optional' }
          }
          meta={meta}
          actions={actions}
        />
      </Box>
    );
  });

  const agreementRows = visibleKeys.map((key, index) => {
    const rowNumber = documentSlots.length + index + 1;
    const rowId = `agreement:${key}`;
    const agreement = agreements[key];
    const name = titleForKey(key);
    const isFirstIncomplete = firstIncompleteId === rowId;

    let rowState: 'signed' | 'next' | 'pending' = 'pending';
    if (agreement?.status === 'SIGNED') {
      rowState = 'signed';
    } else if (isFirstIncomplete) {
      rowState = 'next';
    }

    const isBlocked =
      agreement?.status !== undefined && TERMINAL_FAILURE_STATUSES.has(agreement.status);

    const meta: React.ReactNode[] = [];
    if (rowState === 'signed' && agreement?.signedAt) {
      meta.push(
        <BodyStrong key="signedAt" sx={{ fontSize: 11.5 }}>
          {formatTs(agreement.signedAt)}
        </BodyStrong>,
      );
    }
    if (isBlocked) {
      meta.push(
        <Body
          key="blocked"
          sx={{
            fontSize: 11.5,
            color: 'error.main',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <ErrorOutline sx={{ fontSize: 12 }} />
          Contact your dispatcher
        </Body>,
      );
    }

    let actions: React.ReactNode = null;
    if (rowState === 'next' && token) {
      actions = (
        <button
          type="button"
          onClick={() => navigate(`/carrier-portal/${token}/sign-agreement/${key}`)}
          aria-label={`Sign ${name}`}
          style={{
            background: 'rgb(37, 99, 235)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '8px 14px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Sign agreement
          <ArrowForwardOutlined sx={{ fontSize: 13 }} />
        </button>
      );
    } else if (rowState === 'pending' && !isBlocked && token) {
      actions = (
        <button
          type="button"
          onClick={() => navigate(`/carrier-portal/${token}/sign-agreement/${key}`)}
          aria-label={`Sign ${name} now`}
          style={{
            background: 'white',
            color: 'rgb(15, 23, 42)',
            border: '1px solid rgb(226, 232, 240)',
            borderRadius: 6,
            padding: '8px 14px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Sign now
        </button>
      );
    }

    const refProp = isFirstIncomplete
      ? { ref: firstIncompleteRef as React.RefObject<HTMLDivElement | null> }
      : {};

    return (
      <Box
        key={rowId}
        {...refProp}
        sx={
          isBlocked
            ? {
                border: '1.5px solid',
                borderColor: 'error.main',
                borderRadius: 1,
                boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.08)',
              }
            : {}
        }
      >
        <DocumentRow
          state={rowState}
          number={rowNumber}
          name={name}
          description={
            rowState === 'pending' && isBlocked ? 'This agreement is no longer valid.' : undefined
          }
          meta={meta}
          actions={actions ?? <Box />}
        />
      </Box>
    );
  });

  return (
    <OnboardingCard
      phase="Sign & upload"
      title="Complete your onboarding."
      subtitle="Upload your supporting documents, then sign your agreement."
      width="lg"
    >
      {allComplete ? (
        <AgreementsCompleteBanner
          title="All documents uploaded and agreements signed."
          subtitle={`${totalComplete} of ${totalRequired} required complete`}
        />
      ) : null}
      {showErrorBanner ? (
        <AgreementsErrorBanner
          message="Please upload all required documents and sign all required agreements before continuing."
          onDismiss={() => setErrorRequested(false)}
        />
      ) : null}

      <ProgressStrip
        title={`${totalComplete} of ${totalRequired} required complete`}
        subtitle={
          allComplete ? 'Tap Continue to proceed.' : 'Continue unlocks after all required complete.'
        }
        value={totalComplete}
        total={totalRequired}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 2 }}>
        {documentRows}
        {agreementRows}
      </Box>

      <AgreementsFootNote>
        <strong>Heads up:</strong> Signing the Dispatch Services Agreement locks your business
        identity — legal name, MC#, DOT#, and signatory.
      </AgreementsFootNote>
    </OnboardingCard>
  );
};

export default AgreementListView;
