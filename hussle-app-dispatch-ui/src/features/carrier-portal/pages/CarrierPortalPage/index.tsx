import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Formik, yupToFormErrors } from 'formik';
import type { FormikErrors, FormikTouched } from 'formik';
import { useSelector, useDispatch } from 'store';

import type { QuestionDefinition } from 'components/ConversationalForm';

import PortalAuthGuard from '../../components/PortalAuthGuard';
import PortalLayout from '../../components/PortalLayout';
import PhaseForm from '../../components/PhaseForm';
import PortalCompleteView from '../../components/PortalCompleteView';
import {
  selectAnswers,
  selectCurrentPhase,
  selectSession,
} from '../../store/selectors/portalSelectors';
import { carrierPortalActions } from '../../store/slices/carrierPortalSlice';
import { companyQuestions } from '../../questions/companyQuestions';
import { equipmentQuestions } from '../../questions/equipmentQuestions';
import { driversQuestions } from '../../questions/driversQuestions';
import { documentsQuestions } from '../../questions/documentsQuestions';
import { buildPhaseSchema } from '../../validators/buildPhaseSchema';

const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Documents'];
const TOTAL_PHASES = PHASE_LABELS.length;

const questionsByPhase: Record<number, QuestionDefinition[]> = {
  1: companyQuestions,
  2: equipmentQuestions,
  3: driversQuestions,
  4: documentsQuestions,
};

const AUTOSAVE_DEBOUNCE_MS = 500;

const collectFieldIds = (questions: QuestionDefinition[]): string[] => {
  const ids: string[] = [];
  questions.forEach((q) => {
    ids.push(q.id);
    if (q.inputType === 'address') {
      const prefix = q.id.replace(/\.address$/, '');
      ids.push(`${prefix}.city`, `${prefix}.state`, `${prefix}.zip`, `${prefix}.lat`, `${prefix}.lng`);
    }
    (q.subQuestions ?? []).forEach((sub) => ids.push(sub.id));
  });
  return ids;
};

const CarrierPortalPage = () => {
  const dispatch = useDispatch();
  const { token = '' } = useParams<{ token: string }>();
  const session = useSelector(selectSession);
  const currentPhase = useSelector(selectCurrentPhase);
  const answers = useSelector(selectAnswers);

  const phaseQuestions = questionsByPhase[currentPhase] ?? [];
  const phaseLabel = PHASE_LABELS[currentPhase - 1] ?? PHASE_LABELS[0];
  const isComplete = Boolean(session?.completedAt);

  const initialValues = useMemo<Record<string, unknown>>(() => {
    const seed: Record<string, unknown> = {};
    collectFieldIds(phaseQuestions).forEach((id) => {
      seed[id] = answers[id];
    });
    return seed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase]);

  const handleBack = useCallback(() => {
    if (currentPhase > 1) {
      dispatch(carrierPortalActions.setCurrentPhase(currentPhase - 1));
    }
  }, [dispatch, currentPhase]);

  const handleSubmit = useCallback(() => {
    dispatch(carrierPortalActions.markPhaseCompleted(currentPhase));
    if (currentPhase < TOTAL_PHASES) {
      dispatch(carrierPortalActions.setCurrentPhase(currentPhase + 1));
    } else {
      dispatch(
        carrierPortalActions.sessionCompleted({ completedAt: new Date().toISOString() }),
      );
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [dispatch, currentPhase]);

  const validate = useCallback(
    (values: Record<string, unknown>) => {
      try {
        buildPhaseSchema(phaseQuestions, values).validateSync(values, { abortEarly: false });
        return {};
      } catch (error: unknown) {
        return yupToFormErrors(error);
      }
    },
    [phaseQuestions],
  );

  if (isComplete) {
    return (
      <PortalAuthGuard>
        <PortalLayout showFooter={false}>
          <PortalCompleteView />
        </PortalLayout>
      </PortalAuthGuard>
    );
  }

  return (
    <PortalAuthGuard>
      <Formik
        key={currentPhase}
        initialValues={initialValues}
        validate={validate}
        onSubmit={handleSubmit}
      >
        {(formik) => (
          <PortalPhaseRunner
            formik={formik}
            phaseQuestions={phaseQuestions}
            phaseLabel={phaseLabel}
            currentPhase={currentPhase}
            onBack={handleBack}
            token={token}
          />
        )}
      </Formik>
    </PortalAuthGuard>
  );
};

interface PortalPhaseRunnerProps {
  formik: {
    values: Record<string, unknown>;
    errors: FormikErrors<Record<string, unknown>>;
    touched: FormikTouched<Record<string, unknown>>;
    isSubmitting: boolean;
    isValid: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    setFieldValue: (field: string, value: unknown) => void;
    setTouched: (
      touched: FormikTouched<Record<string, unknown>>,
      shouldValidate?: boolean,
    ) => void | Promise<unknown>;
    validateForm: () => Promise<FormikErrors<Record<string, unknown>>>;
    submitForm: () => void | Promise<unknown>;
  };
  phaseQuestions: QuestionDefinition[];
  phaseLabel: string;
  currentPhase: number;
  onBack: () => void;
  token: string;
}

const PortalPhaseRunner: React.FC<PortalPhaseRunnerProps> = ({
  formik,
  phaseQuestions,
  phaseLabel,
  currentPhase,
  onBack,
  token,
}) => {
  const dispatch = useDispatch();
  const lastDispatched = useRef<Record<string, unknown>>({});

  useEffect(() => {
    const id = window.setTimeout(() => {
      Object.entries(formik.values).forEach(([key, value]) => {
        if (lastDispatched.current[key] !== value) {
          lastDispatched.current[key] = value;
          dispatch(
            carrierPortalActions.answerChanged({
              questionId: key,
              value,
              phase: currentPhase,
            }),
          );
        }
      });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [dispatch, formik.values, currentPhase]);

  const handleContinue = useCallback(async () => {
    const errors = await formik.validateForm();
    const allTouched: FormikTouched<Record<string, unknown>> = {};
    collectFieldIds(phaseQuestions).forEach((id) => {
      allTouched[id] = true;
    });
    await formik.setTouched(allTouched, false);
    if (Object.keys(errors).length === 0) {
      await formik.submitForm();
    }
  }, [formik, phaseQuestions]);

  return (
    <PortalLayout
      phaseNumber={currentPhase}
      totalPhases={TOTAL_PHASES}
      onBack={currentPhase > 1 ? onBack : undefined}
      onContinue={handleContinue}
      isContinuing={formik.isSubmitting}
      canContinue={formik.isValid}
    >
      <PhaseForm
        questions={phaseQuestions}
        phaseLabel={phaseLabel}
        formik={formik}
        token={token}
      />
    </PortalLayout>
  );
};

export default CarrierPortalPage;
