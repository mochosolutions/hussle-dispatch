import type { QuestionDefinition, SubQuestionDefinition } from 'components/ConversationalForm/questionSchema';

/**
 * Build initial values from question definitions.
 * Sets each question ID (including sub-questions) to undefined,
 * then merges with provided initial values (which take precedence).
 */
const buildInitialValues = (
  questions: QuestionDefinition[],
  provided?: Record<string, unknown>,
): Record<string, unknown> => {
  const defaults: Record<string, unknown> = {};

  const addQuestion = (id: string) => {
    defaults[id] = undefined;
  };

  const addSubQuestions = (subs?: SubQuestionDefinition[]) => {
    if (!subs) {
      return;
    }
    subs.forEach((sub) => addQuestion(sub.id));
  };

  questions.forEach((q) => {
    addQuestion(q.id);
    addSubQuestions(q.subQuestions);
  });

  return { ...defaults, ...provided };
};

/**
 * Group questions by their phase number.
 */
const groupByPhase = (questions: QuestionDefinition[]): Map<number, QuestionDefinition[]> => {
  const map = new Map<number, QuestionDefinition[]>();
  questions.forEach((q) => {
    const existing = map.get(q.phase) ?? [];
    existing.push(q);
    map.set(q.phase, existing);
  });
  return map;
};

/**
 * Get the distinct phase numbers from questions, in order.
 */
const getPhaseNumbers = (questions: QuestionDefinition[]): number[] => {
  const seen = new Set<number>();
  const result: number[] = [];
  questions.forEach((q) => {
    if (!seen.has(q.phase)) {
      seen.add(q.phase);
      result.push(q.phase);
    }
  });
  return result;
};

/**
 * Get visible questions for a phase based on current values (evaluating conditions).
 */
const getVisibleQuestions = (
  questions: QuestionDefinition[],
  values: Record<string, unknown>,
): QuestionDefinition[] => questions.filter((q) => !q.condition || q.condition(values));

/**
 * Get visible sub-questions for a question based on current values.
 */
const getVisibleSubQuestions = (
  question: QuestionDefinition,
  values: Record<string, unknown>,
): SubQuestionDefinition[] => {
  if (!question.subQuestions) {
    return [];
  }
  return question.subQuestions.filter((sub) => !sub.condition || sub.condition(values));
};

export {
  buildInitialValues,
  getPhaseNumbers,
  getVisibleQuestions,
  getVisibleSubQuestions,
  groupByPhase,
};
