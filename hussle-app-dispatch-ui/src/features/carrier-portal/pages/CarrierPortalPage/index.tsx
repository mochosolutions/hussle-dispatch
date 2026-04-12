import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'store';
import {
  selectCurrentPhase,
  selectCompletedPhases,
  selectAnswers,
} from '../../store/selectors/portalSelectors';
import { carrierPortalActions } from '../../store/slices/carrierPortalSlice';
import PortalAuthGuard from '../../components/PortalAuthGuard';
import PortalLayout from '../../components/PortalLayout';
import {
  ConversationalFormProvider,
  QuestionThread,
  InputRenderer,
} from 'components/ConversationalForm';
import type { QuestionDefinition } from 'components/ConversationalForm';
import { companyQuestions } from '../../questions/companyQuestions';
import { equipmentQuestions } from '../../questions/equipmentQuestions';
import { driversQuestions } from '../../questions/driversQuestions';
import { costAnalysisQuestions } from '../../questions/costAnalysisQuestions';
import { lanePreferencesQuestions } from '../../questions/lanePreferencesQuestions';
import { documentsQuestions } from '../../questions/documentsQuestions';

const PHASES = [
  'Company',
  'Equipment',
  'Drivers',
  'Cost Analysis',
  'Lane Preferences',
  'Documents',
];

const allQuestions: QuestionDefinition[] = [
  ...companyQuestions,
  ...equipmentQuestions,
  ...driversQuestions,
  ...costAnalysisQuestions,
  ...lanePreferencesQuestions,
  ...documentsQuestions,
];

const CarrierPortalPage = () => {
  const dispatch = useDispatch();
  const currentPhase = useSelector(selectCurrentPhase);
  const completedPhases = useSelector(selectCompletedPhases);
  const answers = useSelector(selectAnswers);

  const handleAnswerChange = useCallback(
    (questionId: string, value: unknown) => {
      dispatch(
        carrierPortalActions.answerChanged({
          questionId,
          value,
        }),
      );
    },
    [dispatch],
  );

  const renderInput = useCallback(
    (question: QuestionDefinition, value: unknown, onChange: (v: unknown) => void) => (
      <InputRenderer
        inputType={question.inputType}
        value={value}
        onChange={onChange}
        options={question.options}
        label={question.label}
        required={question.required}
      />
    ),
    [],
  );

  const initialQuestionIndex = useMemo(() => {
    // Find the first unanswered question
    const idx = allQuestions.findIndex(
      (q) => answers[q.id] === undefined && (!q.condition || q.condition(answers)),
    );
    return idx >= 0 ? idx : 0;
  }, [answers]);

  return (
    <PortalAuthGuard>
      <PortalLayout currentPhase={currentPhase} completedPhases={completedPhases}>
        <ConversationalFormProvider
          phases={PHASES}
          initialAnswers={answers}
          initialQuestionIndex={initialQuestionIndex}
          onAnswerChange={handleAnswerChange}
        >
          <QuestionThread questions={allQuestions} renderInput={renderInput} />
        </ConversationalFormProvider>
      </PortalLayout>
    </PortalAuthGuard>
  );
};

export default CarrierPortalPage;
