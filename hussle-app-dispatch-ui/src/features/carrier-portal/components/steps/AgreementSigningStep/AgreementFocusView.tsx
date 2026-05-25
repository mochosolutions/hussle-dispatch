import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Collapse, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import { useDispatch, useSelector } from 'store';

import type { DotTrailItem } from '../../DotTrail';
import {
  selectAgreement,
  selectLoading,
  selectSession,
  selectVisibleAgreementKeys,
} from '../../../store/selectors/carrierPortalSelectors';
import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import FocusHeader from '../../FocusHeader';
import FocusFooter from '../../FocusFooter';
import DocuSealStage from '../../DocuSealStage';
import Callout from '../../Callout';
import MockSigningPlaceholder from '../../MockSigningPlaceholder';
import AgreementPrefillSummary from '../../AgreementPrefillSummary';
import { useStepChromeOverride } from '../../StepNavContext';
import { useAgreementPolling } from './useAgreementPolling';
import { toEmbedUrl } from './toEmbedUrl';

const AGREEMENT_TITLES: Record<string, string> = {
  DISPATCH_AGREEMENT: 'Dispatch Services Agreement',
};

const titleForKey = (key: string): string => AGREEMENT_TITLES[key] ?? key;

interface AgreementFocusViewProps {
  agreementKey: string;
}

const AgreementFocusView: React.FC<AgreementFocusViewProps> = ({ agreementKey }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();
  const session = useSelector(selectSession);
  const agreement = useSelector(selectAgreement(agreementKey));
  const mockSignStatus = useSelector(selectLoading('agreementMockSign'));

  const visibleKeys = useMemo(() => selectVisibleAgreementKeys(session), [session]);
  useAgreementPolling(visibleKeys);

  const [inlineError, setInlineError] = useState<string | null>(null);
  const [showPrefill, setShowPrefill] = useState(false);

  // Defensive redirect: unknown key or key not in visibleKeys → list.
  useEffect(() => {
    if (!token) return;
    if (visibleKeys.length === 0) return;
    if (!visibleKeys.includes(agreementKey)) {
      navigate(`/carrier-portal/${token}/sign-agreement`, { replace: true });
    }
  }, [token, visibleKeys, agreementKey, navigate]);

  const handleBackToList = useCallback(() => {
    if (!token) return;
    navigate(`/carrier-portal/${token}/sign-agreement`);
  }, [navigate, token]);

  const handleMarkSigned = useCallback(() => {
    if (!agreement) return;
    dispatch(carrierPortalV2Actions.markAgreementSignedMock({ agreementId: agreement.id }));
  }, [dispatch, agreement]);

  const agreementStatus = agreement?.status;

  const handleSignComplete = useCallback(() => {
    if (!token) return;
    if (agreementStatus !== 'SIGNED') {
      setInlineError('Please complete signing in the document above before continuing.');
      return;
    }
    setInlineError(null);
    navigate(`/carrier-portal/${token}/sign-agreement/${agreementKey}/signed`);
  }, [agreementStatus, agreementKey, navigate, token]);

  const queuePosition = visibleKeys.indexOf(agreementKey) + 1;
  const queueLength = visibleKeys.length;
  const title = titleForKey(agreementKey);

  // Build dot trail from visibleKeys + signed status.
  const trail: DotTrailItem[] = useMemo(
    () =>
      visibleKeys.map((key) => {
        if (key === agreementKey) {
          return { id: key, state: 'current' as const };
        }
        const a = session?.agreements?.[key];
        return {
          id: key,
          state: a?.status === 'SIGNED' ? ('done' as const) : ('pending' as const),
        };
      }),
    [visibleKeys, agreementKey, session],
  );

  const focusHeaderElement = useMemo(
    () => (
      <FocusHeader
        onBack={handleBackToList}
        backLabel="All agreements"
        eyebrow={`Agreement ${queuePosition} of ${queueLength}`}
        title={title}
        trail={trail}
      />
    ),
    [handleBackToList, queuePosition, queueLength, title, trail],
  );

  const focusFooterElement = useMemo(
    () => (
      <FocusFooter
        lockNote="Signing locks your business identity"
        onSaveClose={handleBackToList}
        saveCloseLabel="Cancel"
        onSignComplete={handleSignComplete}
        signCompleteLabel="Sign & continue to next"
      />
    ),
    [handleBackToList, handleSignComplete],
  );

  useStepChromeOverride({
    stepperSlot: focusHeaderElement,
    footerSlot: focusFooterElement,
  });

  if (!agreement || !token) {
    return null;
  }

  // Stage content branches on mock / pending / signed / terminal.
  let stageContent: React.ReactNode;
  if (agreement.mock === true) {
    stageContent = (
      <MockSigningPlaceholder
        onMarkSigned={handleMarkSigned}
        isPending={mockSignStatus === 'pending'}
      />
    );
  } else if (agreement.status === 'PENDING' && agreement.embedUrl) {
    stageContent = (
      <Box
        component="iframe"
        src={toEmbedUrl(agreement.embedUrl)}
        title={title}
        sx={{
          width: '100%',
          height: { xs: 'calc(100vh - 320px)', md: 720 },
          minHeight: 480,
          border: 'none',
          bgcolor: 'background.paper',
        }}
      />
    );
  } else if (agreement.status === 'SIGNED') {
    stageContent = (
      <Box sx={{ p: 4 }}>
        <Callout variant="green">
          Already signed. Click <strong>Sign &amp; continue to next</strong> to proceed.
        </Callout>
      </Box>
    );
  } else {
    stageContent = (
      <Box sx={{ p: 4 }}>
        <Callout variant="red">
          This agreement is no longer valid. Contact your dispatcher to resend.
        </Callout>
      </Box>
    );
  }

  const variables = agreement.variables ?? {};
  const hasVariables = Object.keys(variables).length > 0;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 280px' },
        gap: 2,
        alignItems: 'start',
        width: '100%',
      }}
    >
      <Box>
        <DocuSealStage pageLabel={agreement.mock ? 'Mock mode' : undefined}>
          {stageContent}
        </DocuSealStage>
        {inlineError ? (
          <Box sx={{ mt: 2 }}>
            <Callout variant="red">{inlineError}</Callout>
          </Box>
        ) : null}
        {hasVariables ? (
          <Box sx={{ mt: 2, display: { xs: 'block', md: 'none' } }}>
            <Button
              variant="text"
              onClick={() => setShowPrefill((v) => !v)}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13 }}
            >
              {showPrefill ? 'Hide prefilled values' : 'Show prefilled values'}
            </Button>
            <Collapse in={showPrefill}>
              <Box sx={{ mt: 1 }}>
                <AgreementPrefillSummary variables={variables} />
              </Box>
            </Collapse>
          </Box>
        ) : null}
      </Box>

      {hasVariables ? (
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 16 }}>
          <AgreementPrefillSummary variables={variables} />
        </Box>
      ) : null}
    </Box>
  );
};

export default AgreementFocusView;
