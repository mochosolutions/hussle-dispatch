import { useEffect, useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import { useSelector, useDispatch } from 'store';
import { carrierPortalV2Actions } from '../../store/reducers/carrierPortalSlice';
import {
  selectSession,
  selectCurrentStep,
} from '../../store/selectors/carrierPortalSelectors';
import { findPhaseOfStep, getPrevStepId } from '../../engine';
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

  // Sync Redux currentStepId → URL. Redux is authoritative (server cursor);
  // URL mirrors it so refresh/back/direct-paste resume on the right step.
  useEffect(() => {
    if (!token || !session?.currentStepId) return;
    if (urlStepId !== session.currentStepId) {
      navigate(`/carrier-portal/${token}/${session.currentStepId}`, { replace: true });
    }
  }, [token, session?.currentStepId, urlStepId, navigate]);

  const currentPhaseId = useMemo(() => {
    if (!currentStep) return null;
    return findPhaseOfStep(onboardingSchema, currentStep.id)?.id ?? null;
  }, [currentStep]);

  const phase = useMemo(() => {
    if (!currentStep) return null;
    return findPhaseOfStep(onboardingSchema, currentStep.id) ?? null;
  }, [currentStep]);

  const stepperPhases = useMemo(
    () => buildStepperPhases(currentPhaseId),
    [currentPhaseId],
  );

  const prevStepId = useMemo(() => {
    if (!session || !currentStep) return null;
    return getPrevStepId(onboardingSchema, session, currentStep.id);
  }, [session, currentStep]);

  const handleBack = () => {
    if (prevStepId) {
      dispatch(carrierPortalV2Actions.navigateToStep({ stepId: prevStepId }));
    }
  };

  const handleSaveExit = () => {
    window.location.href = '/';
  };

  const footer = currentStep && phase ? (
    <PortalFooterBar
      phaseLabel={phase.label}
      metaText={currentStep.title ?? currentStep.id}
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
