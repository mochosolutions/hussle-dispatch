import type { Phase, Step } from 'features/carrier-portal-v2/engine';
import AgreementSigningStep from '../../components/steps/AgreementSigningStep';
import CheckpointStep from '../../components/steps/CheckpointStep';
import CompleteStep from '../../components/steps/CompleteStep';
import CostAnalysisStep from '../../components/steps/CostAnalysisStep';
import InputStep from '../../components/steps/InputStep';
import LanePreferencesStep from '../../components/steps/LanePreferencesStep';
import ReviewStep from '../../components/steps/ReviewStep';
import SegmentationStep from '../../components/steps/SegmentationStep';
import UploadStep from '../../components/steps/UploadStep';
import VerificationStep from '../../components/steps/VerificationStep';

interface StepDispatcherProps {
  step: Step;
  phase: Phase | null;
}

const EMPTY_PHASE: Phase = { id: '', label: '', steps: [] };

const StepDispatcher: React.FC<StepDispatcherProps> = ({ step, phase }) => {
  switch (step.type) {
    case 'segmentation':
      return <SegmentationStep step={step} />;
    case 'input':
      return <InputStep step={step} />;
    case 'verification':
      return <VerificationStep step={step} />;
    case 'signing':
      return <AgreementSigningStep step={step} />;
    case 'upload':
      return <UploadStep step={step} />;
    case 'review':
      return <ReviewStep step={step} />;
    case 'checkpoint':
      return <CheckpointStep step={step} phase={phase ?? EMPTY_PHASE} />;
    case 'complete':
      return <CompleteStep step={step} />;
    case 'costAnalysis':
      return <CostAnalysisStep step={step} />;
    case 'lanePreferences':
      return <LanePreferencesStep step={step} />;
    default:
      return null;
  }
};

export default StepDispatcher;
