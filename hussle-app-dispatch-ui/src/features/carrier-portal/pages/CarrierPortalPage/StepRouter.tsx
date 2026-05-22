import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { findPhaseOfStep, findStep } from 'features/carrier-portal/engine';
import { onboardingSchema } from 'features/carrier-portal/schema/onboardingSchema';

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

  return <StepDispatcher step={step} phase={phase} />;
};

export default StepRouter;
