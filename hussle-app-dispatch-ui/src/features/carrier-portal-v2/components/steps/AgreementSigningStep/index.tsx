// ---------------------------------------------------------------------------
// AgreementSigningStep — renders the dispatch agreement signing experience.
//
// Behavior (US-19 AC-6 + AC-15):
//   1. On mount, dispatches `fetchAgreement({ templateKey: 'DISPATCH_AGREEMENT' })`.
//      The saga (US-15) calls `GET /carrier-portal/agreements?templateKey=...`
//      (invite-token auth) and projects the result into `session.agreement`.
//   2. Branches on the resolved `AgreementContext`:
//        - null           → "Contact dispatcher" Callout (GAP: portal cannot
//                            self-create; dispatcher must send via dispatcher UI).
//        - PENDING        → `<DocusealForm src={embedUrl} onComplete={...} />`.
//        - SIGNED         → auto-advance via submitStep (no embed render).
//        - VOIDED/DECLINED/EXPIRED → "Agreement no longer valid" Callout.
//   3. `onComplete` dispatches navigation only. Server-side persistence is the
//      webhook's responsibility — the embed never calls a write endpoint.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { DocusealForm } from '@docuseal/react';

import { useDispatch, useSelector } from 'store';
import { PageTitle, BodyMuted } from 'components/Typography';

import type { Step } from 'features/carrier-portal-v2/engine';
import Callout from 'features/carrier-portal-v2/components/Callout';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import {
  selectAgreement,
  selectLoading,
  selectSession,
} from '../../../store/selectors/carrierPortalSelectors';

interface AgreementSigningStepProps {
  step: Step;
}

const TEMPLATE_KEY = 'DISPATCH_AGREEMENT';

const AgreementSigningStep: React.FC<AgreementSigningStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const agreement = useSelector(selectAgreement);
  const fetchStatus = useSelector(selectLoading('agreement'));

  const fetchDispatched = useRef(false);
  const advanceDispatched = useRef(false);

  // Fire fetchAgreement once on mount.
  useEffect(() => {
    if (fetchDispatched.current) {
      return;
    }
    fetchDispatched.current = true;
    dispatch(carrierPortalV2Actions.fetchAgreement({ templateKey: TEMPLATE_KEY }));
  }, [dispatch]);

  // Auto-advance once when SIGNED is observed.
  useEffect(() => {
    if (advanceDispatched.current) {
      return;
    }
    if (agreement?.status === 'SIGNED') {
      advanceDispatched.current = true;
      dispatch(
        carrierPortalV2Actions.submitStep({
          stepId: step.id,
          answers: { acknowledged: true },
        }),
      );
    }
  }, [agreement?.status, dispatch, step.id]);

  if (!session) {
    return null;
  }

  const handleSigned = (): void => {
    // Navigation only — webhook owns server-side persistence (no API write).
    dispatch(
      carrierPortalV2Actions.submitStep({
        stepId: step.id,
        answers: { signed: true },
      }),
    );
  };

  const header = (
    <>
      {step.title ? <PageTitle sx={{ mb: 1 }}>{step.title}</PageTitle> : null}
      {step.subtitle ? <BodyMuted sx={{ mb: 3 }}>{step.subtitle}</BodyMuted> : null}
    </>
  );

  // SIGNED — no embed; useEffect above dispatches advance.
  if (agreement?.status === 'SIGNED') {
    return (
      <Box sx={{ width: '100%', maxWidth: 640 }}>
        {header}
        <Callout variant="green">Agreement signed. Continuing…</Callout>
      </Box>
    );
  }

  // VOIDED / DECLINED / EXPIRED — terminal failure states.
  if (
    agreement?.status === 'VOIDED' ||
    agreement?.status === 'DECLINED' ||
    agreement?.status === 'EXPIRED'
  ) {
    return (
      <Box sx={{ width: '100%', maxWidth: 640 }}>
        {header}
        <Callout variant="red">
          This agreement is no longer valid. Contact your dispatcher to resend.
        </Callout>
      </Box>
    );
  }

  // PENDING (or DRAFT) with embedUrl — render the embed.
  if (agreement?.status === 'PENDING' && agreement.embedUrl) {
    return (
      <Box sx={{ width: '100%', maxWidth: 640 }}>
        {header}
        <DocusealForm src={agreement.embedUrl} onComplete={handleSigned} />
      </Box>
    );
  }

  // No agreement yet — GAP: portal cannot self-create. Wait for dispatcher.
  if (agreement === null && fetchStatus === 'success') {
    return (
      <Box sx={{ width: '100%', maxWidth: 640 }}>
        {header}
        <Callout variant="amber">
          Your dispatcher hasn&apos;t sent the agreement yet. Contact them to
          send it.
        </Callout>
      </Box>
    );
  }

  // Loading / pending fetch — render header only.
  return (
    <Box sx={{ width: '100%', maxWidth: 640 }}>
      {header}
    </Box>
  );
};

export default AgreementSigningStep;
