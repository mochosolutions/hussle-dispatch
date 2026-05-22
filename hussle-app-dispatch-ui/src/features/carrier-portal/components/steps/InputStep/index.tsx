// ---------------------------------------------------------------------------
// InputStep — generic Formik+Yup renderer for any engine `input` step.
//
// Behavior (US-17 AC-7):
//   - Renders each `step.questions[]` using the right mocho form field by
//     `question.fieldType`.
//   - Builds the Yup schema inline via `buildYupFromQuestions` (no reuse of
//     the legacy `buildPhaseSchema`).
//   - Resolves `prefillFrom` dot-paths via the engine `resolveContext` helper
//     when no existing answer is present.
//   - Skips invisible questions (visibility predicate evaluated against the
//     trial session with current Formik values stitched in).
//   - When the session is locked AND the question id maps to a path in
//     `LOCKS_FIELDS`, the field is wrapped in `<LockableField>` so it renders
//     as a read-only display instead of an editable input.
//
// Step submission dispatches `carrierPortalV2Actions.submitStep` with only
// the visible-field answers — hidden fields are filtered out so they don't
// pollute the persisted answer tree.
// ---------------------------------------------------------------------------

import { useMemo } from 'react';
import { Box, Stack } from '@mui/material';
import { Formik, Form } from 'formik';
import type { FormikProps } from 'formik';
import { AnimatePresence, motion } from 'framer-motion';

import { useDispatch, useSelector } from 'store';
import {
  CheckboxField,
  DateField,
  EmailField,
  NumericField,
  SelectField,
  TextField,
} from 'mocho/components/form-fields';
import { PageTitle, BodyMuted } from 'components/Typography';

import type { Question, Session, Step } from 'features/carrier-portal/engine';
import {
  LOCKS_FIELDS,
  evaluatePredicate,
  resolveContext,
} from 'features/carrier-portal/engine';
import AddressTypeaheadField from 'features/carrier-portal/components/AddressTypeaheadField';
import LockableField from 'features/carrier-portal/components/LockableField';
import TinField from 'features/carrier-portal/components/TinField';
import FieldHint from 'features/carrier-portal/components/FieldHint';
import SelectionCardGrid from 'features/carrier-portal/components/SelectionCardGrid';
import type { SelectionCardOption } from 'features/carrier-portal/components/SelectionCardGrid';
import ToggleCardGrid from 'features/carrier-portal/components/ToggleCardGrid';
import type { ToggleCardOption } from 'features/carrier-portal/components/ToggleCardGrid';
import { useStepNavigation } from 'features/carrier-portal/components/StepNavContext';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import {
  selectIsLocked,
  selectLoading,
  selectSession,
} from '../../../store/selectors/carrierPortalSelectors';
import { buildYupFromQuestions } from './buildYupFromQuestions';

interface InputStepProps {
  step: Step;
}

type FormikLike = FormikProps<Record<string, unknown>>;
type FormValues = Record<string, unknown>;

const defaultValueForFieldType = (q: Question): unknown => {
  switch (q.fieldType) {
    case 'checkbox':
      return false;
    case 'address':
      return {};
    case 'number':
      return '';
    default:
      return '';
  }
};

const buildInitialValues = (questions: Question[], session: Session, stepId: string): FormValues => {
  const existing = (session.answers[stepId] ?? {}) as Record<string, unknown>;
  const values: FormValues = {};
  for (const q of questions) {
    if (existing[q.id] !== undefined) {
      values[q.id] = existing[q.id];
    } else if (q.prefillFrom) {
      const resolved = resolveContext(session, q.prefillFrom);
      values[q.id] = resolved ?? defaultValueForFieldType(q);
    } else {
      values[q.id] = defaultValueForFieldType(q);
    }
  }
  return values;
};

const buildTrialSession = (
  session: Session,
  stepId: string,
  values: FormValues,
): Session => ({
  ...session,
  answers: {
    ...session.answers,
    [stepId]: { ...(session.answers[stepId] ?? {}), ...values },
  },
});

const renderField = (q: Question, formik: FormikLike, disabled: boolean) => {
  const baseProps = {
    name: q.id,
    label: q.label,
    required: !q.optional,
    disabled,
    formik,
  };

  switch (q.fieldType) {
    case 'email':
      return <EmailField {...baseProps} />;
    case 'number':
      return <NumericField {...baseProps} />;
    case 'select':
      return (
        <SelectField
          name={q.id}
          label={q.label}
          required={!q.optional}
          data={q.options ?? []}
          formik={formik}
        />
      );
    case 'cards': {
      const cardOptions: SelectionCardOption[] = (q.options ?? []).map((opt) => ({
        id: opt.value,
        title: opt.label,
        subline: opt.description,
        disabled: opt.disabled,
      }));
      const currentValue = (formik.values[q.id] as string | undefined) ?? null;
      return (
        <SelectionCardGrid
          name={q.id}
          options={cardOptions}
          value={currentValue}
          onChange={(id) => formik.setFieldValue(q.id, id)}
          columns={cardOptions.length <= 3 ? 2 : 3}
          locked={disabled}
        />
      );
    }
    case 'toggle': {
      const toggleOptions: ToggleCardOption[] = (q.options ?? []).map((opt) => ({
        id: opt.value,
        label: opt.label,
        subline: opt.description,
      }));
      const currentValue = (formik.values[q.id] as string | undefined) ?? null;
      return (
        <ToggleCardGrid
          name={q.id}
          options={toggleOptions}
          value={currentValue}
          onChange={(id) => formik.setFieldValue(q.id, id)}
          size="sm"
          locked={disabled}
        />
      );
    }
    case 'date':
      return <DateField name={q.id} label={q.label} required={!q.optional} formik={formik} />;
    case 'checkbox':
      return <CheckboxField name={q.id} label={q.label} formik={formik} />;
    case 'tin':
      return <TinField name={q.id} label={q.label} required={!q.optional} disabled={disabled} />;
    case 'address':
      return (
        <AddressTypeaheadField
          name={q.id}
          label={q.label}
          required={!q.optional}
          disabled={disabled}
        />
      );
    case 'mc':
    case 'text':
    default:
      return <TextField {...baseProps} />;
  }
};

const formatLockedValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return JSON.stringify(value);
};

const InputStep: React.FC<InputStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const sessionLocked = useSelector(selectIsLocked);
  const submitStatus = useSelector(selectLoading('submitStep'));

  const questions = useMemo<Question[]>(() => step.questions ?? [], [step.questions]);

  const initialValues = useMemo<FormValues>(() => {
    if (!session) {
      return {};
    }
    return buildInitialValues(questions, session, step.id);
  }, [questions, session, step.id]);

  const validationSchema = useMemo(() => {
    if (!session) {
      return undefined;
    }
    const trialSession = buildTrialSession(session, step.id, initialValues);
    return buildYupFromQuestions({ questions, session: trialSession });
  }, [questions, session, step.id, initialValues]);

  if (!session) {
    return null;
  }

  const handleSubmit = (values: FormValues): void => {
    const trialSession = buildTrialSession(session, step.id, values);
    const visibleAnswers: FormValues = {};
    for (const q of questions) {
      const visible = !q.visibility || evaluatePredicate(q.visibility, trialSession);
      if (visible) {
        visibleAnswers[q.id] = values[q.id];
      }
    }
    dispatch(
      carrierPortalV2Actions.submitStep({
        stepId: step.id,
        answers: visibleAnswers,
      }),
    );
  };

  const isPending = submitStatus === 'pending';
  const isCompanyPhaseStep = step.id.startsWith('company');

  return (
    <Box sx={{ width: '100%', maxWidth: 640 }}>
      {step.title ? <PageTitle sx={{ mb: 1 }}>{step.title}</PageTitle> : null}
      {step.subtitle ? <BodyMuted sx={{ mb: 3 }}>{step.subtitle}</BodyMuted> : null}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {(formik) => {
          const trialSession = buildTrialSession(session, step.id, formik.values);
          return (
            <Form noValidate>
              <InputStepNavRegister formik={formik} isPending={isPending} />
              <Stack spacing={2.5}>
                <AnimatePresence initial={false}>
                  {questions.map((q) => {
                    const visible =
                      !q.visibility || evaluatePredicate(q.visibility, trialSession);
                    if (!visible) {
                      return null;
                    }
                    const lockKey = isCompanyPhaseStep ? `company.${q.id}` : null;
                    const isLockableField =
                      lockKey !== null && (LOCKS_FIELDS as readonly string[]).includes(lockKey);
                    const isLocked = sessionLocked && isLockableField;
                    const fieldNode = renderField(q, formik, isLocked);
                    return (
                      <motion.div
                        key={q.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.32, ease: 'easeOut' },
                        }}
                        exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
                      >
                        <Box>
                          <LockableField
                            locked={isLocked}
                            value={formatLockedValue(formik.values[q.id])}
                          >
                            {fieldNode}
                          </LockableField>
                          {q.helpText ? <FieldHint>{q.helpText}</FieldHint> : null}
                        </Box>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </Stack>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// InputStepNavRegister — inner component lets us call `useStepNavigation`
// with the current formik instance, since the hook must run inside Formik's
// render-prop where `formik.submitForm` and validity flags are available.
// ---------------------------------------------------------------------------

interface InputStepNavRegisterProps {
  formik: FormikLike;
  isPending: boolean;
}

const InputStepNavRegister: React.FC<InputStepNavRegisterProps> = ({ formik, isPending }) => {
  const { submitForm } = formik;
  useStepNavigation({
    // Continue is always clickable — submitForm() touches all fields and runs
    // Yup validation, so inline errors surface only on click for an invalid form.
    canContinue: !isPending,
    onContinue: submitForm,
    isPending,
  });
  return null;
};

export default InputStep;
