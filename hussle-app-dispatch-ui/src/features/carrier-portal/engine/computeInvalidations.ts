import type { Schema, Session } from './types';
import { evaluatePredicate } from './evaluatePredicate';
import { isQuestionLocked } from './isQuestionLocked';
import { LockViolationError } from './errors';
import { findStep, getVisibleSteps } from './getVisibleSteps';

// Given a trial state where `changedStepId`'s answers receive a partial patch
// (`newAnswers`), compute which previously-completed steps would become hidden
// (and therefore invalidated).
//
// Lock enforcement: schema-driven. If any question in `newAnswers` declares
// `locked: true` against the current session AND the incoming value differs
// from the persisted value, throws `LockViolationError`.
//
// Under today's shipping schema no questions declare `locked`, so this gate is
// dormant. The mid-signing identity-edit guard (frontend `ConfirmReSignDialog`
// + backend void-for-resign endpoint) is the actual mechanism for the 3
// identity fields embedded in the dispatch agreement.
export const computeInvalidations = (
  schema: Schema,
  session: Session,
  changedStepId: string,
  newAnswers: Record<string, unknown>,
): string[] => {
  const step = findStep(schema, changedStepId);
  if (step?.questions) {
    const existing = (session.answers[changedStepId] ?? {}) as Record<string, unknown>;
    const violated: string[] = [];
    for (const question of step.questions) {
      if (!(question.id in newAnswers)) continue;
      if (!isQuestionLocked(question, session)) continue;
      const incomingValue = newAnswers[question.id];
      const currentValue = existing[question.id];
      if (incomingValue !== currentValue) {
        violated.push(`${changedStepId}.${question.id}`);
      }
    }
    if (violated.length > 0) {
      throw new LockViolationError(changedStepId, violated);
    }
  }

  const trialSession: Session = {
    ...session,
    answers: {
      ...session.answers,
      [changedStepId]: {
        ...(session.answers[changedStepId] ?? {}),
        ...newAnswers,
      },
    },
  };

  const visibleNow = new Set(getVisibleSteps(schema, trialSession).map((s) => s.id));
  const invalidated: string[] = [];
  for (const completedId of session.completedStepIds) {
    if (completedId === changedStepId) continue;
    if (!visibleNow.has(completedId)) {
      invalidated.push(completedId);
    }
  }
  return invalidated;
};

// Re-evaluate visibility against the live session (no trial answers) — handy when callers
// want to check whether a step is currently visible without flattening the full list.
export const isStepVisible = (schema: Schema, session: Session, stepId: string): boolean => {
  const phase = schema.phases.find((p) => p.steps.some((s) => s.id === stepId));
  if (!phase) return false;
  if (!evaluatePredicate(phase.visibility, session)) return false;
  const step = phase.steps.find((s) => s.id === stepId);
  if (!step) return false;
  return evaluatePredicate(step.visibility, session);
};
