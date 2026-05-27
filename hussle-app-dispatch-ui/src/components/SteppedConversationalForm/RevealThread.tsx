import { Box, Button, Stack } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';

import { ContextualAlert } from 'components/ContextualAlert';
import { InputRendererWithError } from 'components/ConversationalForm/InputRenderer';
import { QuestionCard } from 'components/ConversationalForm/QuestionCard';
import { SubQuestion } from 'components/ConversationalForm/SubQuestion';
import type { SubQuestionDefinition } from 'components/ConversationalForm/questionSchema';

import { getVisibleSubQuestions } from './buildPhaseSchema';
import { useSteppedForm } from './useSteppedForm';

const revealVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const phaseVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const SubQuestionRenderer: React.FC<{
  sub: SubQuestionDefinition;
  values: Record<string, unknown>;
  getError: (id: string) => string | undefined;
  getTouched: (id: string) => boolean;
  onChange: (id: string, value: unknown) => void;
}> = ({ sub, values, getError, getTouched, onChange }) => {
  const alertResult = sub.alert ? sub.alert(values[sub.id], values) : null;

  return (
    <motion.div variants={revealVariants} initial="hidden" animate="visible" exit="exit">
      <SubQuestion
        borderColor={sub.borderColor ?? 'grey'}
        questionId={sub.id}
        label={sub.label}
        hint={sub.hint}
        categoryTag={sub.categoryTag}
      >
        <InputRendererWithError
          inputType={sub.inputType}
          value={values[sub.id]}
          onChange={(val) => onChange(sub.id, val)}
          options={sub.options}
          required={sub.required}
          startAdornment={sub.startAdornment}
          endAdornment={sub.endAdornment}
          yesLabel={sub.yesLabel}
          noLabel={sub.noLabel}
          badgeText={sub.badgeText}
          error={getError(sub.id)}
          touched={getTouched(sub.id)}
        />
        {alertResult ? (
          <Box sx={{ mt: 2 }}>
            <ContextualAlert severity={alertResult.severity} title={alertResult.message} />
          </Box>
        ) : null}
      </SubQuestion>
    </motion.div>
  );
};

const RevealThread: React.FC = () => {
  const {
    activePhase,
    questionsForActivePhase,
    values,
    getError,
    getTouched,
    updateAnswer,
    advancePhase,
    isLastPhase,
  } = useSteppedForm();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`phase-${activePhase}`}
        variants={phaseVariants}
        initial="enter"
        animate="center"
        exit="exit"
      >
        <Stack spacing={0}>
          {questionsForActivePhase.map((question) => {
            const visibleSubs = getVisibleSubQuestions(question, values);

            return (
              <Box key={question.id}>
                <QuestionCard
                  questionId={question.id}
                  label={question.label}
                  hint={question.hint}
                  onNext={advancePhase}
                  hideButton
                  afterInput={
                    visibleSubs.length > 0 ? (
                      <Box sx={{ mt: 3 }}>
                        <AnimatePresence>
                          {visibleSubs.map((sub) => (
                            <SubQuestionRenderer
                              key={sub.id}
                              sub={sub}
                              values={values}
                              getError={getError}
                              getTouched={getTouched}
                              onChange={updateAnswer}
                            />
                          ))}
                        </AnimatePresence>
                      </Box>
                    ) : undefined
                  }
                >
                  <InputRendererWithError
                    inputType={question.inputType}
                    value={values[question.id]}
                    onChange={(val) => updateAnswer(question.id, val)}
                    options={question.options}
                    required={question.required}
                    startAdornment={question.startAdornment}
                    endAdornment={question.endAdornment}
                    error={getError(question.id)}
                    touched={getTouched(question.id)}
                  />
                </QuestionCard>
              </Box>
            );
          })}
        </Stack>

        {/* Phase advance button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={advancePhase}
            sx={{
              borderRadius: 24,
              px: 5,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '15px',
            }}
          >
            {isLastPhase ? 'Complete' : 'Complete & Continue'}
          </Button>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export { RevealThread };
