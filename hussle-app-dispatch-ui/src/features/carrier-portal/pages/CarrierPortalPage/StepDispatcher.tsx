import type { Phase, Step } from 'features/carrier-portal/engine';
import CheckpointStep from '../../components/steps/CheckpointStep';
import InputStep from '../../components/steps/InputStep';
import ReviewStep from '../../components/steps/ReviewStep';
import VerificationStep from '../../components/steps/VerificationStep';

interface StepDispatcherProps {
  step: Step;
  phase: Phase | null;
}

const EMPTY_PHASE: Phase = { id: '', label: '', steps: [] };

const StepDispatcher: React.FC<StepDispatcherProps> = ({ step, phase }) => {
  switch (step.type) {
    case 'input':
      return <InputStep step={step} />;
    case 'verification':
      return <VerificationStep step={step} />;
    case 'review':
      return <ReviewStep step={step} />;
    case 'checkpoint':
      return <CheckpointStep step={step} phase={phase ?? EMPTY_PHASE} />;
    default:
      return null;
  }
};

export default StepDispatcher;
