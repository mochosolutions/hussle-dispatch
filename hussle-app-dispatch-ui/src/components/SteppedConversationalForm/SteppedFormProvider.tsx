import { useCallback, useMemo, useState } from 'react';

import { getIn, useFormik } from 'formik';
import type { Schema } from 'yup';

import type { QuestionDefinition } from 'components/ConversationalForm/questionSchema';

import {
  buildInitialValues,
  getPhaseNumbers,
  getVisibleQuestions,
  groupByPhase,
} from './buildPhaseSchema';
import { SteppedFormContext } from './useSteppedForm';

interface SteppedFormProviderProps {
  children: React.ReactNode;
  questions: QuestionDefinition[];
  phases: string[];
  validationSchemas?: Record<number, Schema>;
  initialValues?: Record<string, unknown>;
  initialPhase?: number;
  onAnswerChange?: (questionId: string, value: unknown, allValues: Record<string, unknown>) => void;
  onPhaseComplete?: (phase: number, values: Record<string, unknown>) => void;
  onSubmit?: (values: Record<string, unknown>) => void;
}

/**
 * Flatten Formik's nested values into a flat Record keyed by dot-notation paths.
 * This allows reading `equipment.box.gvwr` from `{ equipment: { box: { gvwr: 26500 } } }`.
 */
const flattenValues = (
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenValues(val as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = val;
    }
  });
  return result;
};

const SteppedFormProvider: React.FC<SteppedFormProviderProps> = ({
  children,
  questions,
  phases,
  validationSchemas,
  initialValues,
  initialPhase,
  onAnswerChange,
  onPhaseComplete,
  onSubmit,
}) => {
  const phaseQuestionMap = useMemo(() => groupByPhase(questions), [questions]);
  const phaseNumbers = useMemo(() => getPhaseNumbers(questions), [questions]);
  const startPhase = initialPhase ?? phaseNumbers[0] ?? 1;

  const [activePhase, setActivePhase] = useState(startPhase);

  const mergedInitialValues = useMemo(
    () => buildInitialValues(questions, initialValues),
    [questions, initialValues],
  );

  const activeSchema = validationSchemas?.[activePhase];

  const formik = useFormik({
    initialValues: mergedInitialValues,
    validationSchema: activeSchema,
    validateOnChange: false,
    validateOnBlur: true,
    enableReinitialize: false,
    onSubmit: (formValues) => {
      onSubmit?.(formValues);
    },
  });

  // Flatten Formik's nested values for condition() callbacks and context consumers
  const flatValues = useMemo(() => flattenValues(formik.values), [formik.values]);

  const questionsForActivePhase = useMemo(() => {
    const phaseQuestions = phaseQuestionMap.get(activePhase) ?? [];
    return getVisibleQuestions(phaseQuestions, flatValues);
  }, [phaseQuestionMap, activePhase, flatValues]);

  const isLastPhase = activePhase === phaseNumbers[phaseNumbers.length - 1];

  const completedPhases = useMemo(() => {
    const completed: number[] = [];
    phaseNumbers.forEach((phaseNum) => {
      if (phaseNum === activePhase) {
        return;
      }
      const phaseQuestions = phaseQuestionMap.get(phaseNum) ?? [];
      const visible = getVisibleQuestions(phaseQuestions, flatValues);
      const allRequiredAnswered = visible
        .filter((q) => q.required)
        .every((q) => {
          const val = flatValues[q.id];
          return val !== undefined && val !== '' && val !== null;
        });
      if (allRequiredAnswered && visible.length > 0) {
        completed.push(phaseNum);
      }
    });
    return completed;
  }, [phaseNumbers, phaseQuestionMap, activePhase, flatValues]);

  const advancePhase = useCallback(() => {
    const currentIdx = phaseNumbers.indexOf(activePhase);
    if (currentIdx < phaseNumbers.length - 1) {
      onPhaseComplete?.(activePhase, flatValues);
      const nextPhase = phaseNumbers[currentIdx + 1];
      setActivePhase(nextPhase);
    } else {
      onPhaseComplete?.(activePhase, flatValues);
      formik.handleSubmit();
    }
  }, [activePhase, phaseNumbers, formik, onPhaseComplete, flatValues]);

  const setAnswer = useCallback(
    (id: string, value: unknown) => {
      formik.setFieldValue(id, value);
      formik.setFieldTouched(id, true, false);
      onAnswerChange?.(id, value, { ...flatValues, [id]: value });
    },
    [formik, onAnswerChange, flatValues],
  );

  const updateAnswer = useCallback(
    (id: string, value: unknown) => {
      formik.setFieldValue(id, value);
    },
    [formik],
  );

  const goToPhase = useCallback(
    (phase: number) => {
      const isCompleted = completedPhases.includes(phase);
      const isCurrent = phase === activePhase;
      if (!isCompleted && !isCurrent) {
        return;
      }
      setActivePhase(phase);
    },
    [completedPhases, activePhase],
  );

  // Read errors/touched using getIn for dot-notation support
  const getError = useCallback(
    (id: string): string | undefined => {
      const err = getIn(formik.errors, id);
      return typeof err === 'string' ? err : undefined;
    },
    [formik.errors],
  );

  const getTouched = useCallback(
    (id: string): boolean => {
      const t = getIn(formik.touched, id);
      return t === true;
    },
    [formik.touched],
  );

  const contextValue = useMemo(
    () => ({
      activePhase,
      phases,
      completedPhases,
      questionsForActivePhase,
      goToPhase,
      isLastPhase,
      currentQuestionIndex: questionsForActivePhase.length - 1,
      values: flatValues,
      setAnswer,
      updateAnswer,
      advancePhase,
      getError,
      getTouched,
    }),
    [
      activePhase,
      phases,
      completedPhases,
      questionsForActivePhase,
      goToPhase,
      isLastPhase,
      flatValues,
      setAnswer,
      updateAnswer,
      advancePhase,
      getError,
      getTouched,
    ],
  );

  return <SteppedFormContext.Provider value={contextValue}>{children}</SteppedFormContext.Provider>;
};

export { SteppedFormProvider };
export type { SteppedFormProviderProps };
