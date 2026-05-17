import { useEffect, useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';

import { useSelector, useDispatch } from 'store';
import { carrierPortalV2Actions } from '../../store/reducers/carrierPortalSlice';
import {
  selectSession,
  selectCurrentStep,
} from '../../store/selectors/carrierPortalSelectors';
import { findPhaseOfStep } from '../../engine';
import { onboardingSchema } from '../../schema/onboardingSchema';
import PortalAuthGuard from '../../components/PortalAuthGuard';
import PortalShell from '../../components/PortalShell';
import PortalStepper from '../../components/PortalStepper';
import type { PortalStepperPhase } from '../../components/PortalStepper';
import StepDispatcher from './StepDispatcher';

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
// CarrierPortalPage
// ---------------------------------------------------------------------------

const CarrierPortalPage = () => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const currentStep = useSelector(selectCurrentStep);

  useEffect(() => {
    dispatch(carrierPortalV2Actions.loadSession());
  }, [dispatch]);

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

  return (
    <PortalAuthGuard>
      <PortalShell stepper={session ? <PortalStepper phases={stepperPhases} /> : undefined}>
        {currentStep ? (
          <StepDispatcher step={currentStep} phase={phase} />
        ) : (
          <SessionLoadingFallback />
        )}
      </PortalShell>
    </PortalAuthGuard>
  );
};

export default CarrierPortalPage;
