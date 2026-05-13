import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Formik, yupToFormErrors } from 'formik';
import type { FormikErrors, FormikTouched } from 'formik';
import { enqueueSnackbar } from 'notistack';
import { useSelector, useDispatch } from 'store';

import type { QuestionDefinition } from 'components/ConversationalForm';

import PortalAuthGuard from '../../components/PortalAuthGuard';
import PortalLayout from '../../components/PortalLayout';
import PhaseForm from '../../components/PhaseForm';
import PortalCompleteView from '../../components/PortalCompleteView';
import { CostResultCard } from '../../components/CostResultCard';
import type { CostInputs } from '../../components/CostResultCard';
import {
  selectAnswers,
  selectCarrier,
  selectCurrentPhase,
  selectLastSavedPhase,
  selectSession,
} from '../../store/selectors/portalSelectors';
import { carrierPortalActions } from '../../store/slices/carrierPortalSlice';
import type {
  SaveCompanyRequest,
  SaveCostAnalysisRequest,
  SaveDriversRequest,
  SaveEquipmentRequest,
  SaveLanePreferencesRequest,
} from '../../types';
import { PHASE_LABELS, QUESTIONS_BY_PHASE, TOTAL_PHASES } from '../../constants';
import { buildPhaseSchema } from '../../validators/buildPhaseSchema';

const AUTOSAVE_DEBOUNCE_MS = 500;

// ---------------------------------------------------------------------------
// Phase-save helpers
// ---------------------------------------------------------------------------

/** Strip a namespace prefix from a flat form-values object (e.g. 'company.' → bare keys). */
const stripPrefix = (
  values: Record<string, unknown>,
  prefix: string,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  Object.entries(values).forEach(([key, value]) => {
    if (key.startsWith(prefix)) {
      result[key.slice(prefix.length)] = value;
    }
  });
  return result;
};

/** Returns the correct saga action creator call for the given phase + form values. */
const buildSaveActionForPhase = (phase: number, values: Record<string, unknown>) => {
  // Values come from Yup-validated Formik state; double-cast via unknown is safe here.
  switch (phase) {
    case 1:
      return carrierPortalActions.saveCompany(
        stripPrefix(values, 'company.') as unknown as SaveCompanyRequest,
      );
    case 2:
      return carrierPortalActions.saveEquipment(
        stripPrefix(values, 'equipment.') as unknown as SaveEquipmentRequest,
      );
    case 3:
      return carrierPortalActions.saveDrivers(
        stripPrefix(values, 'drivers.') as unknown as SaveDriversRequest,
      );
    case 4:
      return carrierPortalActions.saveCostAnalysis(
        stripPrefix(values, 'costAnalysis.') as unknown as SaveCostAnalysisRequest,
      );
    case 5:
      return carrierPortalActions.saveLanePreferences(
        stripPrefix(values, 'lanePreferences.') as unknown as SaveLanePreferencesRequest,
      );
    default:
      return carrierPortalActions.completeOnboarding();
  }
};

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
  const carrier = useSelector(selectCarrier);
  const currentPhase = useSelector(selectCurrentPhase);
  const lastSavedPhase = useSelector(selectLastSavedPhase);
  const answers = useSelector(selectAnswers);

  const phaseQuestions = QUESTIONS_BY_PHASE[currentPhase] ?? [];
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

  // STAB-01: Dispatch phase-save saga action; final phase dispatches completeOnboarding.
  // Formik calls onSubmit with the current form values after validation passes.
  const handleSubmit = useCallback(
    (values: Record<string, unknown>) => {
      if (currentPhase < TOTAL_PHASES) {
        dispatch(buildSaveActionForPhase(currentPhase, values));
      } else {
        dispatch(carrierPortalActions.completeOnboarding());
      }
    },
    [dispatch, currentPhase],
  );

  // STAB-01 rising-edge: advance phase once save saga signals success via lastSavedPhase.
  useEffect(() => {
    if (lastSavedPhase === null) return;
    if (lastSavedPhase !== currentPhase) return;

    if (currentPhase < TOTAL_PHASES) {
      dispatch(carrierPortalActions.setCurrentPhase(currentPhase + 1));
      if (typeof window !== 'undefined') {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }
    // For currentPhase === TOTAL_PHASES, completeOnboardingSuccess (Plan 02 reducer) sets
    // lastSavedPhase = 6 AND populates state.session.completedAt from the API payload.
    // The existing session.completedAt render branch swaps to PortalCompleteView (BLOCKER 2).
    dispatch(carrierPortalActions.phaseAdvanceConsumed());
  }, [lastSavedPhase, currentPhase, dispatch]);

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
            firstName={carrier?.name ?? undefined}
          />
        )}
      </Formik>
    </PortalAuthGuard>
  );
};

// ---------------------------------------------------------------------------
// Cost-analysis field IDs (prefixed, as they appear in formik.values)
// ---------------------------------------------------------------------------

const COST_FIELD_IDS = [
  'costAnalysis.truckPayment',
  'costAnalysis.insuranceCost',
  'costAnalysis.fuelCostPerGallon',
  'costAnalysis.milesPerGallon',
  'costAnalysis.maintenanceMonthlyCost',
  'costAnalysis.otherMonthlyCosts',
] as const;

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
  firstName?: string;
}

const PortalPhaseRunner: React.FC<PortalPhaseRunnerProps> = ({
  formik,
  phaseQuestions,
  phaseLabel,
  currentPhase,
  onBack,
  token,
  firstName,
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

  // STAB-02: surface validation failures via snackbar + scroll-to-first-error.
  const handleContinue = useCallback(async () => {
    const errors = await formik.validateForm();
    const allTouched: FormikTouched<Record<string, unknown>> = {};
    collectFieldIds(phaseQuestions).forEach((id) => {
      allTouched[id] = true;
    });
    await formik.setTouched(allTouched, false);

    if (Object.keys(errors).length > 0) {
      enqueueSnackbar('Please answer the highlighted questions before continuing.', {
        variant: 'warning',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 4000,
        preventDuplicate: true,
        key: 'phase-validation-error',
      });

      const firstErrorId = Object.keys(errors)[0];
      if (firstErrorId !== undefined) {
        const el = document.querySelector(`[data-question-id="${firstErrorId}"]`);
        if (el) {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          el.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'center',
          });
          const input = el.querySelector('input, textarea, [role="button"]');
          if (input instanceof HTMLElement) {
            input.focus({ preventScroll: true });
          }
        }
      }
      return;
    }
    await formik.submitForm();
  }, [formik, phaseQuestions]);

  // STAB-08 / BLOCKER 3: Phase 4 cost-analysis field extraction for CostResultCard.
  // All 6 fields must be non-empty for the result card to replace the question thread.
  const allCostFieldsPopulated =
    currentPhase === 4 &&
    COST_FIELD_IDS.every((id) => {
      const v = formik.values[id];
      return typeof v === 'number' || (typeof v === 'string' && v.trim() !== '');
    });

  const costInputs: CostInputs = {
    truckPayment: Number(formik.values['costAnalysis.truckPayment'] ?? 0),
    insuranceCost: Number(formik.values['costAnalysis.insuranceCost'] ?? 0),
    fuelCostPerGallon: Number(formik.values['costAnalysis.fuelCostPerGallon'] ?? 0),
    // Guard against 0 to prevent divide-by-zero in computeCostAnalysis.
    milesPerGallon: Number(formik.values['costAnalysis.milesPerGallon'] ?? 1) || 1,
    maintenanceMonthlyCost: Number(formik.values['costAnalysis.maintenanceMonthlyCost'] ?? 0),
    otherMonthlyCosts: Number(formik.values['costAnalysis.otherMonthlyCosts'] ?? 0),
    ownsOutright: Boolean(formik.values['costAnalysis.ownsOutright']),
  };

  // BLOCKER 3: Phase 4 — swap question thread for CostResultCard when all fields answered.
  // onContinue dispatches saveCostAnalysis via the existing Formik.onSubmit (handleSubmit)
  // path: submitForm() → handleSubmit(values) → buildSaveActionForPhase(4, values).
  if (currentPhase === 4 && allCostFieldsPopulated) {
    return (
      <CostResultCard
        inputs={costInputs}
        firstName={firstName}
        onContinue={() => void formik.submitForm()}
      />
    );
  }

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
