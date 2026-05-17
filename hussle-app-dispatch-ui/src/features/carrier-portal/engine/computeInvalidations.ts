import type { Schema, Session } from './types';
import { LOCKS_FIELDS } from './types';
import { evaluatePredicate } from './evaluatePredicate';
import { LockViolationError } from './errors';
import { findStep, getVisibleSteps } from './getVisibleSteps';

// Given a trial state where `changedStepId`'s answers receive a partial patch (`newAnswers`),
// compute which previously-completed steps would become hidden (and therefore invalidated).
//
// Lock enforcement: if `changedStepId` is in the company phase AND the carrier's agreement
// is SIGNED AND the patch touches any path in LOCKS_FIELDS that ALSO differs from the
// existing value, throws LockViolationError. Back-edits to non-locked fields proceed
// normally even after signing.
//
// Returns the list of completed step ids that flip from visible → hidden under the trial.
export const computeInvalidations = (
  schema: Schema,
  session: Session,
  changedStepId: string,
  newAnswers: Record<string, unknown>,
): string[] => {
  // Lock check — only fires when the agreement is signed and the change touches a locked path.
  const isLocked = session.agreement?.status === 'SIGNED';
  if (isLocked && isCompanyStep(schema, changedStepId)) {
    const existing = session.answers[changedStepId] ?? {};
    const violated: string[] = [];
    for (const [questionId, incomingValue] of Object.entries(newAnswers)) {
      const dotPath = `company.${questionId}` as (typeof LOCKS_FIELDS)[number];
      if (!(LOCKS_FIELDS as readonly string[]).includes(dotPath)) continue;
      const currentValue = (existing as Record<string, unknown>)[questionId];
      if (incomingValue !== currentValue) {
        violated.push(dotPath);
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

const isCompanyStep = (schema: Schema, stepId: string): boolean => {
  const step = findStep(schema, stepId);
  if (!step) return false;
  // A step lives in the company phase iff one of those phases contains it. The company
  // phase id is conventionally 'company' in onboardingSchema.ts; we additionally guard
  // against arbitrary external schemas by name-prefix matching the stepId.
  if (stepId.startsWith('company-')) return true;
  const phase = schema.phases.find((p) => p.steps.some((s) => s.id === stepId));
  return phase?.id === 'company';
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
