import { Box } from '@mui/material';
import type { Schema } from 'yup';

import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

import { PhaseStepBar } from './PhaseStepBar';
import { RevealThread } from './RevealThread';
import { SteppedFormProvider } from './SteppedFormProvider';

interface SteppedConversationalFormProps {
  questions: QuestionDefinition[];
  phases: string[];
  validationSchemas?: Record<number, Schema>;
  initialValues?: Record<string, unknown>;
  initialPhase?: number;
  onAnswerChange?: (questionId: string, value: unknown, allValues: Record<string, unknown>) => void;
  onPhaseComplete?: (phase: number, values: Record<string, unknown>) => void;
  onSubmit?: (values: Record<string, unknown>) => void;
}

const SteppedConversationalForm: React.FC<SteppedConversationalFormProps> = ({
  questions,
  phases,
  validationSchemas,
  initialValues,
  initialPhase,
  onAnswerChange,
  onPhaseComplete,
  onSubmit,
}) => (
  <SteppedFormProvider
    questions={questions}
    phases={phases}
    validationSchemas={validationSchemas}
    initialValues={initialValues}
    initialPhase={initialPhase}
    onAnswerChange={onAnswerChange}
    onPhaseComplete={onPhaseComplete}
    onSubmit={onSubmit}
  >
    <PhaseStepBar />
    <Box sx={{ mt: 2 }}>
      <RevealThread />
    </Box>
  </SteppedFormProvider>
);

export { SteppedConversationalForm };
export type { SteppedConversationalFormProps };
