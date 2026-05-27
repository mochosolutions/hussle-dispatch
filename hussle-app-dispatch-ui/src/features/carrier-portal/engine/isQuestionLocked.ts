import type { Question, Session } from './types';

/**
 * Evaluate a question's `locked` predicate against the live session.
 *
 *   - Undefined / no declaration → false (default unlocked).
 *   - Static boolean → returned as-is.
 *   - Function predicate → invoked with `{ session }`.
 *
 * Schema authors opt fields into the locked treatment by declaring
 * `locked: true` or `locked: ({ session }) => …` on the question. Today's
 * shipping schema declares no `locked` predicates, so this always returns
 * false in the current configuration.
 */
export const isQuestionLocked = (question: Question, session: Session): boolean => {
  const declaration = question.locked;
  if (declaration === undefined) {
    return false;
  }
  if (typeof declaration === 'boolean') {
    return declaration;
  }
  return declaration({ session });
};
