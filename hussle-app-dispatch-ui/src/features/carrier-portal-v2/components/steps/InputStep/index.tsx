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
import { Box, Button, Stack } from '@mui/material';
import { Formik, Form } from 'formik';
import type { FormikProps } from 'formik';

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

import type { Question, Session, Step } from 'features/carrier-portal-v2/engine';
import {
  LOCKS_FIELDS,
  evaluatePredicate,
  resolveContext,
} from 'features/carrier-portal-v2/engine';
import AddressTypeaheadField from 'features/carrier-portal-v2/components/AddressTypeaheadField';
import LockableField from 'features/carrier-portal-v2/components/LockableField';
import TinField from 'features/carrier-portal-v2/components/TinField';
import FieldHint from 'features/carrier-portal-v2/components/FieldHint';

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
    case 'cards':
      return (
        <SelectField
          name={q.id}
          label={q.label}
          required={!q.optional}
          data={q.options ?? []}
          formik={formik}
        />
      );
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
              <Stack spacing={2.5}>
                {questions.map((q) => {
                  const visible = !q.visibility || evaluatePredicate(q.visibility, trialSession);
                  if (!visible) {
                    return null;
                  }
                  const lockKey = isCompanyPhaseStep ? `company.${q.id}` : null;
                  const isLockableField =
                    lockKey !== null && (LOCKS_FIELDS as readonly string[]).includes(lockKey);
                  const isLocked = sessionLocked && isLockableField;
                  const fieldNode = renderField(q, formik, isLocked);
                  return (
                    <Box key={q.id}>
                      <LockableField
                        locked={isLocked}
                        value={formatLockedValue(formik.values[q.id])}
                      >
                        {fieldNode}
                      </LockableField>
                      {q.helpText ? <FieldHint>{q.helpText}</FieldHint> : null}
                    </Box>
                  );
                })}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isPending}
                  >
                    Continue
                  </Button>
                </Box>
              </Stack>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
};

export default InputStep;
