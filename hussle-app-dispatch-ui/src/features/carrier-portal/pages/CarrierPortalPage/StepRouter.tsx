import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { findPhaseOfStep, findStep } from 'features/carrier-portal/engine';
import { onboardingSchema } from 'features/carrier-portal/schema/onboardingSchema';

import AgreementSigningStep from '../../components/steps/AgreementSigningStep';
import CompleteStep from '../../components/steps/CompleteStep';
import CostAnalysisStep from '../../components/steps/CostAnalysisStep';
import DriversListStep from '../../components/steps/DriversListStep';
import DriversSoloConfirmStep from '../../components/steps/DriversSoloConfirmStep';
import EquipmentListStep from '../../components/steps/EquipmentListStep';
import InputStep from '../../components/steps/InputStep';
import LanePreferencesStep from '../../components/steps/LanePreferencesStep';
import SegmentationStep from '../../components/steps/SegmentationStep';
import UploadStep from '../../components/steps/UploadStep';
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

  // B3 — equipment step uses a dedicated saveEquipment action. Routed
  // explicitly so future StepDispatcher refactors don't accidentally reroute
  // it through the generic submitStep path.
  if (step.id === 'equipment-entry') {
    return <EquipmentListStep step={step} />;
  }

  // B4 — drivers steps use a dedicated saveDrivers action. Routed explicitly
  // so future StepDispatcher refactors don't accidentally reroute them
  // through the generic submitStep path.
  if (step.id === 'drivers-list') {
    return <DriversListStep step={step} />;
  }
  if (step.id === 'drivers-solo-confirm') {
    return <DriversSoloConfirmStep step={step} />;
  }

  // B5 — cost-analysis uses a dedicated saveCostAnalysis action. Routed
  // explicitly so future StepDispatcher refactors don't accidentally reroute
  // it through the generic submitStep path.
  if (step.id === 'cost-analysis') {
    return <CostAnalysisStep step={step} />;
  }

  // B6 — lane-preferences uses a dedicated saveLanePreferences action.
  // Routed explicitly so future StepDispatcher refactors don't accidentally
  // reroute it through the generic submitStep path.
  if (step.id === 'lane-preferences') {
    return <LanePreferencesStep step={step} />;
  }

  // B7 — sign-agreement has no Continue submit; it fetches the agreement and
  // auto-advances on SIGNED. Routed explicitly to keep the routing surface
  // declarative.
  if (step.id === 'sign-agreement') {
    return <AgreementSigningStep step={step} />;
  }

  // B8 — documents-upload dispatches uploadDocument per file. Routed
  // explicitly to keep the routing surface declarative.
  if (step.id === 'documents-upload') {
    return <UploadStep step={step} />;
  }

  // B9 — complete is the terminal step. CompleteStep dispatches
  // `completeSession` on mount (BUG-12). Routed explicitly so the migration
  // off StepDispatcher is finished.
  if (step.id === 'complete') {
    return <CompleteStep step={step} />;
  }

  return <StepDispatcher step={step} phase={phase} />;
};

export default StepRouter;
