// ---------------------------------------------------------------------------
// VerificationStep — renders 4 FMCSA-lookup states from session.fmcsaSnapshot.
//
//   1. loading          — snapshot undefined; "Looking up your authority…"
//   2. found            — snapshot has legalName; auto-advances on mount
//   3. not_found        — snapshot empty (no legalName, no error); amber callout
//                         + "Try a different number" + "Continue without FMCSA"
//   4. service_problem  — snapshot.authorityStatus === 'SERVICE_UNAVAILABLE';
//                         red callout + "Retry" + "Skip and enter manually"
//
// The actual FMCSA lookup is dispatched by the engine's `sideEffects`
// pipeline (wired in US-21). This component only READS the snapshot and
// renders the right state.
//
// NOTE (deferred to US-23): the retry and advance actions are placeholders
// that dispatch `submitStep` with a sentinel `answers` payload. The real
// retryFmcsaLookup / advanceStep actions will be added to the slice in a
// later story; this component should be updated then to use them.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { Box, Button, CircularProgress, Link, Stack } from '@mui/material';

import { useDispatch, useSelector } from 'store';
import { BodyMuted } from 'components/Typography';

import type { FmcsaSnapshot, Step } from 'features/carrier-portal/engine';
import Callout from 'features/carrier-portal/components/Callout';
import OnboardingCard from 'features/carrier-portal/components/OnboardingCard';
import { useStepMode } from 'features/carrier-portal/components/StepNavContext';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import { selectSession } from '../../../store/selectors/carrierPortalSelectors';

interface VerificationStepProps {
  step: Step;
}

type VerificationState = 'loading' | 'found' | 'not_found' | 'service_problem';

const detectState = (snapshot?: FmcsaSnapshot): VerificationState => {
  if (!snapshot) {
    return 'loading';
  }
  if (snapshot.authorityStatus === 'SERVICE_UNAVAILABLE') {
    return 'service_problem';
  }
  if (snapshot.legalName && snapshot.legalName.trim().length > 0) {
    return 'found';
  }
  return 'not_found';
};

const VerificationStep: React.FC<VerificationStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const snapshot = session?.fmcsaSnapshot;
  const state = detectState(snapshot);
  const mode = useStepMode();

  // Auto-advance when FMCSA returns a hit. The advance is fire-and-forget;
  // saga wiring (US-21/US-23) will refine the exact action shape. Suppressed
  // in review/locked modes — the user navigated back to this step; the shell
  // footer drives forward navigation instead.
  useEffect(() => {
    if (mode !== 'active') {
      return;
    }
    if (state === 'found') {
      dispatch(
        carrierPortalV2Actions.submitStep({
          stepId: step.id,
          answers: { acknowledged: true },
        }),
      );
    }
  }, [mode, state, step.id, dispatch]);

  // Placeholder dispatch: "advance past this step without an FMCSA hit".
  // US-23 will replace with a dedicated `skipFmcsaLookup` action.
  const handleAdvance = () => {
    dispatch(
      carrierPortalV2Actions.submitStep({
        stepId: step.id,
        answers: { skippedFmcsa: true },
      }),
    );
  };

  // Placeholder dispatch: "user wants to retry / change MC number".
  // US-23 will replace with a dedicated `retryFmcsaLookup` action.
  const handleRetry = () => {
    dispatch(
      carrierPortalV2Actions.submitStep({
        stepId: step.id,
        answers: { __retry: true },
      }),
    );
  };

  if (state === 'loading') {
    return (
      <OnboardingCard
        phase="Company"
        title="Looking up your authority…"
        subtitle="This usually takes a few seconds. We're checking FMCSA's records."
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} aria-label="Loading FMCSA results" />
        </Box>
      </OnboardingCard>
    );
  }

  if (state === 'found') {
    const legalName = snapshot?.legalName ?? '';
    return (
      <OnboardingCard phase="Company" title="Authority confirmed">
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CircularProgress size={20} aria-label="Advancing" />
          <BodyMuted>Found {legalName}, advancing…</BodyMuted>
        </Stack>
      </OnboardingCard>
    );
  }

  if (state === 'not_found') {
    return (
      <OnboardingCard phase="Company" title="We couldn't find your authority">
        <Callout variant="amber">
          We couldn't find an authority matching that MC number. Double-check the number on
          your FMCSA paperwork.
        </Callout>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 3 }}>
          <Button variant="contained" onClick={handleRetry}>
            Try a different number
          </Button>
          <Link
            component="button"
            type="button"
            onClick={handleAdvance}
            sx={{ fontSize: 13.5 }}
          >
            Continue without FMCSA
          </Link>
        </Stack>
      </OnboardingCard>
    );
  }

  // service_problem
  return (
    <OnboardingCard phase="Company" title="FMCSA is temporarily unavailable">
      <Callout variant="red">
        We couldn't reach FMCSA right now. This sometimes happens during their nightly
        maintenance window.
      </Callout>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleRetry}>
          Retry
        </Button>
        <Link
          component="button"
          type="button"
          onClick={handleAdvance}
          sx={{ fontSize: 13.5 }}
        >
          Skip and enter manually
        </Link>
      </Stack>
    </OnboardingCard>
  );
};

export default VerificationStep;
