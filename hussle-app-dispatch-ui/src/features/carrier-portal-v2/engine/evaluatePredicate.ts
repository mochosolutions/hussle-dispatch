import type { Predicate, Session } from './types';
import { resolveContext } from './resolveContext';

// Recursively evaluates a Predicate against the session context. Returns true when the
// predicate is undefined (i.e. no condition = always visible). Unknown operators return
// true conservatively so a malformed schema never hides steps.

export const evaluatePredicate = (
  predicate: Predicate | undefined,
  session: Session,
): boolean => {
  if (!predicate) {
    return true;
  }
  switch (predicate.op) {
    case 'eq':
      return resolveContext(session, predicate.field) === predicate.value;
    case 'in':
      return predicate.values.includes(resolveContext(session, predicate.field));
    case 'and':
      return predicate.clauses.every((c) => evaluatePredicate(c, session));
    case 'or':
      return predicate.clauses.some((c) => evaluatePredicate(c, session));
    case 'not':
      return !evaluatePredicate(predicate.clause, session);
    default: {
      // Unreachable when the union is exhaustive; if a future operator is added without
      // updating this switch, fall through to "always visible" so the carrier isn't blocked.
      const exhaust: never = predicate;
      void exhaust;
      return true;
    }
  }
};
