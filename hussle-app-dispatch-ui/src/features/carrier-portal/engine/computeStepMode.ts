import type { Schema, Session } from './types';
import { findStep } from './getVisibleSteps';
import { isQuestionLocked } from './isQuestionLocked';

// Runtime mode of a step for a given URL position.
//
// - `active`: URL points at the cursor — user can edit, submit, advance.
// - `review`: URL points at a completed step that isn't the cursor and no
//             gating event applies. Step auto-advance should not fire; the
//             shell supplies the Continue button.
// - `locked`: at least one visible question on the step has its `locked`
//             predicate evaluating to `true`. Step is read-only. Today's
//             schema declares no `locked` predicates, so this mode is
//             dormant — kept for future schema variants that opt in.
export type StepMode = 'active' | 'review' | 'locked';

export const computeStepMode = (
  schema: Schema,
  session: Session,
  urlStepId: string | null | undefined,
): StepMode => {
  if (!urlStepId) {
    return 'active';
  }
  if (urlStepId === session.currentStepId) {
    return 'active';
  }
  if (!session.completedStepIds.includes(urlStepId)) {
    return 'active';
  }
  if (hasLockedQuestion(schema, session, urlStepId)) {
    return 'locked';
  }
  return 'review';
};

// A step is locked iff any of its visible questions declares `locked: true`
// (or a predicate that evaluates to true against the current session).
// Today's shipping schema declares no `locked` predicates, so this returns
// false for every step.
const hasLockedQuestion = (schema: Schema, session: Session, stepId: string): boolean => {
  const step = findStep(schema, stepId);
  if (!step || !step.questions) {
    return false;
  }
  return step.questions.some((q) => isQuestionLocked(q, session));
};
