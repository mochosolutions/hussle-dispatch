import { useCallback, useEffect, useRef } from 'react';

import { Box, Collapse, Fade, Stack } from '@mui/material';

import { ContextualAlert } from 'components/ContextualAlert';

import { AnsweredCard } from './AnsweredCard';
import { useConversationalForm } from './ConversationalFormProvider';
import { InputRenderer } from './InputRenderer';
import { PhaseDivider } from './PhaseDivider';
import { QuestionCard } from './QuestionCard';
import { SubQuestion } from './SubQuestion';
import type { QuestionDefinition, SubQuestionDefinition } from './questionSchema';

interface QuestionThreadProps {
  questions: QuestionDefinition[];
  renderInput: (
    question: QuestionDefinition,
    value: unknown,
    onChange: (value: unknown) => void,
  ) => React.ReactNode;
  formatAnswer?: (question: QuestionDefinition, value: unknown) => string;
}

const defaultFormatAnswer = (_question: QuestionDefinition, value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

const SubQuestionRenderer: React.FC<{
  sub: SubQuestionDefinition;
  answers: Record<string, unknown>;
  onChange: (questionId: string, value: unknown) => void;
}> = ({ sub, answers, onChange }) => {
  const alertResult = sub.alert ? sub.alert(answers[sub.id], answers) : null;

  return (
    <SubQuestion
      borderColor={sub.borderColor ?? 'grey'}
      questionId={sub.id}
      label={sub.label}
      hint={sub.hint}
      categoryTag={sub.categoryTag}
    >
      <InputRenderer
        inputType={sub.inputType}
        value={answers[sub.id]}
        onChange={(value) => onChange(sub.id, value)}
        options={sub.options}
        required={sub.required}
        startAdornment={sub.startAdornment}
        endAdornment={sub.endAdornment}
        yesLabel={sub.yesLabel}
        noLabel={sub.noLabel}
        badgeText={sub.badgeText}
      />
      {alertResult ? (
        <Box sx={{ mt: 2 }}>
          <ContextualAlert severity={alertResult.severity} title={alertResult.message} />
        </Box>
      ) : null}
    </SubQuestion>
  );
};

export const QuestionThread: React.FC<QuestionThreadProps> = ({
  questions,
  renderInput,
  formatAnswer = defaultFormatAnswer,
}) => {
  const {
    currentQuestionIndex,
    answers,
    phases,
    setAnswer,
    updateAnswer,
    editQuestion,
    editingIndex,
  } = useConversationalForm();

  const activeQuestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeQuestionRef.current) {
      activeQuestionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentQuestionIndex, editingIndex]);

  const handleNext = useCallback(
    (questionId: string) => {
      const currentValue = answers[questionId];
      setAnswer(questionId, currentValue);
    },
    [answers, setAnswer],
  );

  const handleChange = useCallback(
    (questionId: string, value: unknown) => {
      updateAnswer(questionId, value);
    },
    [updateAnswer],
  );

  // Build list of visible questions (respecting conditions)
  const visibleQuestions = questions.filter((q) => !q.condition || q.condition(answers));

  // Get visible sub-questions for a parent question
  const getVisibleSubQuestions = useCallback(
    (question: QuestionDefinition): SubQuestionDefinition[] => {
      if (!question.subQuestions) {
        return [];
      }
      return question.subQuestions.filter((sub) => !sub.condition || sub.condition(answers));
    },
    [answers],
  );

  return (
    <Stack spacing={1}>
      {visibleQuestions.map((question, visibleIndex) => {
        // Find the actual index in the full question list for comparison
        const actualIndex = questions.indexOf(question);
        const isAnswered =
          actualIndex < currentQuestionIndex &&
          editingIndex !== actualIndex &&
          answers[question.id] !== undefined;
        const isActive = actualIndex === currentQuestionIndex || editingIndex === actualIndex;
        const isBeyondCurrent = actualIndex > currentQuestionIndex && editingIndex !== actualIndex;

        if (isBeyondCurrent) {
          return null;
        }

        // Phase divider — compare with previous visible question's phase
        const prevQuestion = visibleIndex > 0 ? visibleQuestions[visibleIndex - 1] : null;
        const showPhaseDivider = prevQuestion !== null && question.phase !== prevQuestion.phase;

        const isLastVisible =
          visibleIndex === visibleQuestions.length - 1 ||
          visibleQuestions.slice(visibleIndex + 1).every((q) => {
            const idx = questions.indexOf(q);
            return idx > currentQuestionIndex;
          });

        const visibleSubs = isActive ? getVisibleSubQuestions(question) : [];

        return (
          <div key={question.id}>
            {showPhaseDivider ? <PhaseDivider phaseName={phases[question.phase] ?? ''} /> : null}

            {isAnswered ? (
              <Collapse in timeout={300}>
                <AnsweredCard
                  questionId={question.id}
                  label={question.label}
                  displayValue={formatAnswer(question, answers[question.id])}
                  onEdit={() => editQuestion(actualIndex)}
                />
              </Collapse>
            ) : null}

            {isActive ? (
              <Fade in timeout={400}>
                <div ref={activeQuestionRef}>
                  <QuestionCard
                    questionId={question.id}
                    label={question.label}
                    hint={question.hint}
                    onNext={() => handleNext(question.id)}
                    isLastQuestion={isLastVisible}
                    afterInput={
                      visibleSubs.length > 0 ? (
                        <Box sx={{ mt: 3 }}>
                          {visibleSubs.map((sub) => (
                            <SubQuestionRenderer
                              key={sub.id}
                              sub={sub}
                              answers={answers}
                              onChange={handleChange}
                            />
                          ))}
                        </Box>
                      ) : undefined
                    }
                  >
                    {renderInput(question, answers[question.id], (value) =>
                      handleChange(question.id, value),
                    )}
                  </QuestionCard>
                </div>
              </Fade>
            ) : null}
          </div>
        );
      })}
    </Stack>
  );
};

export type { QuestionThreadProps };
