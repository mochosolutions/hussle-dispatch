import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { findPhaseOfStep, findStep } from 'features/carrier-portal/engine';
import { onboardingSchema } from 'features/carrier-portal/schema/onboardingSchema';

import InputStep from '../../components/steps/InputStep';
import SegmentationStep from '../../components/steps/SegmentationStep';
import StepDispatcher from './StepDispatcher';

interface StepRouteParams extends Record<string, string | undefined> {
  stepId?: string;
}

const StepRouter: React.FC = () => {
  const { stepId } = useParams<StepRouteParams>();

  const step = useMemo(() => (stepId ? findStep(onboardingSchema, stepId) : null), [stepId]);
  const phase = useMemo(
    () => (stepId ? (findPhaseOfStep(onboardingSchema, stepId) ?? null) : null),
    [stepId],
  );

  if (!step) {
    return null;
  }

  if (step.id === 'welcome-segmentation') {
    return <SegmentationStep step={step} />;
  }

  // B2 — company step uses a dedicated saveCompany action (dispatched from
  // InputStep). Routed explicitly so future StepDispatcher refactors don't
  // accidentally reroute it through the generic submitStep path.
  if (step.id === 'company-authority-question') {
    return <InputStep step={step} />;
  }

  return <StepDispatcher step={step} phase={phase} />;
};

export default StepRouter;
