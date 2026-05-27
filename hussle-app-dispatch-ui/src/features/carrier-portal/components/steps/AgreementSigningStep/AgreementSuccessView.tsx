import { useCallback, useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import { useSelector } from 'store';

import type { DotTrailItem } from '../../DotTrail';
import {
  selectAgreement,
  selectFirstUnsignedAgreement,
  selectSession,
  selectVisibleAgreementKeys,
} from '../../../store/selectors/carrierPortalSelectors';
import AgreementSignedInterstitial from '../../AgreementSignedInterstitial';
import FocusHeader from '../../FocusHeader';
import { useStepChromeOverride } from '../../StepNavContext';
import { useAgreementPolling } from './useAgreementPolling';

const AGREEMENT_TITLES: Record<string, string> = {
  DISPATCH_AGREEMENT: 'Dispatch Services Agreement',
};

const titleForKey = (key: string): string => AGREEMENT_TITLES[key] ?? key;

interface AgreementSuccessViewProps {
  agreementKey: string;
}

const AgreementSuccessView: React.FC<AgreementSuccessViewProps> = ({ agreementKey }) => {
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();
  const session = useSelector(selectSession);
  const agreement = useSelector(selectAgreement(agreementKey));

  const visibleKeys = useMemo(() => selectVisibleAgreementKeys(session), [session]);
  const nextUnsigned = useSelector(selectFirstUnsignedAgreement(visibleKeys));

  useAgreementPolling(visibleKeys);

  // Defensive: if the agreement isn't signed, send the user back to focus.
  useEffect(() => {
    if (!token) return;
    if (agreement && agreement.status !== 'SIGNED') {
      navigate(`/carrier-portal/${token}/sign-agreement/${agreementKey}`, { replace: true });
    }
  }, [agreement, agreementKey, navigate, token]);

  const handleBackToList = useCallback(() => {
    if (!token) return;
    navigate(`/carrier-portal/${token}/sign-agreement`);
  }, [navigate, token]);

  const signedAgreementName = titleForKey(agreementKey);
  const queuePosition = visibleKeys.indexOf(agreementKey) + 1;
  const queueLength = visibleKeys.length;
  const nextUnsignedKey =
    nextUnsigned && nextUnsigned.templateKey !== agreementKey
      ? nextUnsigned.templateKey
      : null;

  // Trail: current agreement is DONE, next-unsigned is CURRENT, others reflect
  // their actual signed status. Matches State D in the dev preview.
  const trail: DotTrailItem[] = useMemo(
    () =>
      visibleKeys.map((key) => {
        if (key === agreementKey) {
          return { id: key, state: 'done' as const };
        }
        if (key === nextUnsignedKey) {
          return { id: key, state: 'current' as const };
        }
        const a = session?.agreements?.[key];
        return {
          id: key,
          state: a?.status === 'SIGNED' ? ('done' as const) : ('pending' as const),
        };
      }),
    [visibleKeys, agreementKey, nextUnsignedKey, session],
  );

  const focusHeaderElement = useMemo(
    () => (
      <FocusHeader
        onBack={handleBackToList}
        backLabel="All agreements"
        eyebrow={`Agreement ${queuePosition} of ${queueLength} · Signed`}
        title={signedAgreementName}
        trail={trail}
      />
    ),
    [handleBackToList, queuePosition, queueLength, signedAgreementName, trail],
  );

  useStepChromeOverride({
    stepperSlot: focusHeaderElement,
    footerSlot: undefined,
  });

  if (!agreement || !token) {
    return null;
  }

  const nextAgreementName = nextUnsignedKey ? titleForKey(nextUnsignedKey) : undefined;
  const onAutoAdvance = nextUnsignedKey
    ? () => navigate(`/carrier-portal/${token}/sign-agreement/${nextUnsignedKey}`)
    : undefined;

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <AgreementSignedInterstitial
        signedAt={agreement.signedAt ?? null}
        signedAgreementName={signedAgreementName}
        nextAgreementName={nextAgreementName}
        onAutoAdvance={onAutoAdvance}
        onBackToList={handleBackToList}
      />
    </Box>
  );
};

export default AgreementSuccessView;
