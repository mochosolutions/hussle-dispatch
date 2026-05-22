import { useEffect, useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import { useSelector, useDispatch } from 'store';
import { carrierPortalV2Actions } from '../../store/reducers/carrierPortalSlice';
import {
  selectSession,
  selectCurrentStep,
} from '../../store/selectors/carrierPortalSelectors';
import { findPhaseOfStep, findStep, getPrevStepId } from '../../engine';
import { onboardingSchema } from '../../schema/onboardingSchema';
import PortalAuthGuard from '../../components/PortalAuthGuard';
import PortalShell from '../../components/PortalShell';
import PortalStepper from '../../components/PortalStepper';
import type { PortalStepperPhase } from '../../components/PortalStepper';
import PortalFooterBar from '../../components/PortalFooterBar';
import {
  StepNavProvider,
  useStepNavHandler,
} from '../../components/StepNavContext';

// ---------------------------------------------------------------------------
// Phase-state derivation — maps schema phases to PortalStepper display states.
// ---------------------------------------------------------------------------

const buildStepperPhases = (
  currentPhaseId: string | null,
): PortalStepperPhase[] => {
  let passed = true;

  return onboardingSchema.phases.map((phase) => {
    let state: PortalStepperPhase['state'];

    if (phase.id === currentPhaseId) {
      state = 'active';
      passed = false;
    } else if (passed) {
      state = 'done';
    } else {
      state = 'pending';
    }

    return { id: phase.id, label: phase.label, state };
  });
};

// ---------------------------------------------------------------------------
// Loading fallback — shown while session resolves before guard passes.
// ---------------------------------------------------------------------------

const SessionLoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    }}
  >
    <CircularProgress size={32} />
  </Box>
);

// ---------------------------------------------------------------------------
// PortalPageContent
// ---------------------------------------------------------------------------
// Lives inside <StepNavProvider> so it can both render <StepDispatcher>
// (whose children call `useStepNavigation` to register their submit handler)
// AND read the registered handler via `useStepNavHandler()` to drive the
// single Continue button in the footer. The split is necessary because the
// provider must wrap both the children and the footer prop of PortalShell.
// ---------------------------------------------------------------------------

interface PortalRouteParams extends Record<string, string | undefined> {
  token?: string;
  stepId?: string;
}

const PortalPageContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, stepId: urlStepId } = useParams<PortalRouteParams>();
  const session = useSelector(selectSession);
  const currentStep = useSelector(selectCurrentStep);
  const stepNav = useStepNavHandler();

  // URL ↔ Redux sync.
  // Rules:
  //   1. No :stepId in URL (initial cold load) → push the server cursor
  //      (session.currentStepId) into the URL.
  //   2. URL :stepId is unknown to the schema → snap to the server cursor.
  //   3. URL :stepId is a completed step → leave the user there (review
  //      mode). After the agreement is signed, the form renders in locked
  //      display, but the user can still see what they entered.
  //   4. URL :stepId matches a real step that hasn't been completed and
  //      isn't the server cursor → user is trying to skip ahead; snap back
  //      to the cursor.
  useEffect(() => {
    if (!token || !session?.currentStepId) return;
    if (!urlStepId) {
      navigate(`/carrier-portal/${token}/${session.currentStepId}`, { replace: true });
      return;
    }
    if (urlStepId === session.currentStepId) {
      return;
    }
    const stepExists = findStep(onboardingSchema, urlStepId) !== null;
    const isCompleted = session.completedStepIds.includes(urlStepId);
    if (!stepExists || (!isCompleted && urlStepId !== session.currentStepId)) {
      navigate(`/carrier-portal/${token}/${session.currentStepId}`, { replace: true });
    }
  }, [token, session?.currentStepId, session?.completedStepIds, urlStepId, navigate]);

  // The "active step" for chrome (footer phase label, stepper highlighting)
  // is driven by the URL — so when the user navigates back to a completed
  // step for review, the chrome reflects that step (not the server cursor).
  const activeStep = useMemo(
    () => (urlStepId ? findStep(onboardingSchema, urlStepId) : currentStep),
    [urlStepId, currentStep],
  );

  const currentPhaseId = useMemo(() => {
    if (!activeStep) return null;
    return findPhaseOfStep(onboardingSchema, activeStep.id)?.id ?? null;
  }, [activeStep]);

  const phase = useMemo(() => {
    if (!activeStep) return null;
    return findPhaseOfStep(onboardingSchema, activeStep.id) ?? null;
  }, [activeStep]);

  const stepperPhases = useMemo(
    () => buildStepperPhases(currentPhaseId),
    [currentPhaseId],
  );

  const prevStepId = useMemo(() => {
    if (!session || !activeStep) return null;
    return getPrevStepId(onboardingSchema, session, activeStep.id);
  }, [session, activeStep]);

  const handleBack = () => {
    if (prevStepId && token) {
      // Navigate the URL directly. Don't dispatch navigateToStep — that
      // would rewind the server cursor in Redux, which breaks review-mode
      // and clobbers the locked state for already-signed agreements.
      navigate(`/carrier-portal/${token}/${prevStepId}`);
    }
  };

  const handleSaveExit = () => {
    window.location.href = '/';
  };

  const footer = activeStep && phase ? (
    <PortalFooterBar
      phaseLabel={phase.label}
      metaText={activeStep.title ?? activeStep.id}
      helperText="✓ Progress saved"
      onBack={prevStepId ? handleBack : undefined}
      secondaryAction={{ label: 'Save & Exit', onClick: handleSaveExit }}
      onContinue={stepNav?.onContinue}
      continueLabel={stepNav?.continueLabel ?? 'Continue'}
      continueDisabled={stepNav?.isPending ?? false}
      isContinuing={stepNav?.isPending ?? false}
    />
  ) : undefined;

  return (
    <PortalShell
      stepper={session ? <PortalStepper phases={stepperPhases} /> : undefined}
      footer={footer}
    >
      {currentStep ? <Outlet /> : <SessionLoadingFallback />}
    </PortalShell>
  );
};

// ---------------------------------------------------------------------------
// CarrierPortalPage — owns session loading; wraps content in StepNavProvider.
// ---------------------------------------------------------------------------

const CarrierPortalPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(carrierPortalV2Actions.loadSession());
  }, [dispatch]);

  return (
    <PortalAuthGuard>
      <StepNavProvider>
        <PortalPageContent />
      </StepNavProvider>
    </PortalAuthGuard>
  );
};

export default CarrierPortalPage;
