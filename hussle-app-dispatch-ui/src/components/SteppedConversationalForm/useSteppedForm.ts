import { createContext, useContext } from 'react';

import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

interface SteppedFormContextValue {
  // Phase
  activePhase: number;
  phases: string[];
  completedPhases: number[];
  questionsForActivePhase: QuestionDefinition[];
  goToPhase: (phase: number) => void;
  isLastPhase: boolean;
  advancePhase: () => void;

  // Values (Formik-backed, flattened to dot-notation keys)
  values: Record<string, unknown>;
  setAnswer: (id: string, value: unknown) => void;
  updateAnswer: (id: string, value: unknown) => void;

  // Validation (use getError/getTouched for dot-notation support)
  getError: (id: string) => string | undefined;
  getTouched: (id: string) => boolean;
}

const SteppedFormContext = createContext<SteppedFormContextValue | null>(null);

const useSteppedForm = (): SteppedFormContextValue => {
  const context = useContext(SteppedFormContext);
  if (context === null) {
    throw new Error('useSteppedForm must be used within a SteppedFormProvider');
  }
  return context;
};

export { SteppedFormContext, useSteppedForm };
export type { SteppedFormContextValue };
