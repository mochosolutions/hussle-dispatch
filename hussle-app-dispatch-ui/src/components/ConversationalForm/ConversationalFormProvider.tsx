import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ConversationalFormContextValue {
  currentQuestionIndex: number;
  answers: Record<string, unknown>;
  activePhase: number;
  phases: string[];
  setAnswer: (questionId: string, value: unknown) => void;
  updateAnswer: (questionId: string, value: unknown) => void;
  goToQuestion: (index: number) => void;
  editQuestion: (index: number) => void;
  isEditing: boolean;
  editingIndex: number | null;
}

interface ConversationalFormProviderProps {
  children: React.ReactNode;
  initialAnswers?: Record<string, unknown>;
  initialPhase?: number;
  initialQuestionIndex?: number;
  phases: string[];
  onAnswerChange?: (questionId: string, value: unknown) => void;
}

const ConversationalFormContext = createContext<ConversationalFormContextValue | null>(null);

export const useConversationalForm = (): ConversationalFormContextValue => {
  const context = useContext(ConversationalFormContext);
  if (context === null) {
    throw new Error('useConversationalForm must be used within a ConversationalFormProvider');
  }
  return context;
};

export const ConversationalFormProvider: React.FC<ConversationalFormProviderProps> = ({
  children,
  initialAnswers,
  initialPhase = 0,
  initialQuestionIndex = 0,
  phases,
  onAnswerChange,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers ?? {});
  const [activePhase, setActivePhase] = useState(initialPhase);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const setAnswer = useCallback(
    (questionId: string, value: unknown) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));

      if (onAnswerChange) {
        onAnswerChange(questionId, value);
      }

      if (editingIndex !== null) {
        setEditingIndex(null);
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    },
    [editingIndex, onAnswerChange],
  );

  const updateAnswer = useCallback(
    (questionId: string, value: unknown) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    [],
  );

  const goToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  const editQuestion = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  const isEditing = editingIndex !== null;

  const value = useMemo<ConversationalFormContextValue>(
    () => ({
      currentQuestionIndex,
      answers,
      activePhase,
      phases,
      setAnswer,
      updateAnswer,
      goToQuestion,
      editQuestion,
      isEditing,
      editingIndex,
    }),
    [
      currentQuestionIndex,
      answers,
      activePhase,
      phases,
      setAnswer,
      updateAnswer,
      goToQuestion,
      editQuestion,
      isEditing,
      editingIndex,
    ],
  );

  return (
    <ConversationalFormContext.Provider value={value}>{children}</ConversationalFormContext.Provider>
  );
};
