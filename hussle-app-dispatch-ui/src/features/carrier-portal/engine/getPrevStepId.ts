import type { Schema, Session } from './types';
import { getVisibleSteps } from './getVisibleSteps';

// Linear backward walk: given currentStepId, return the previous visible step's id, or
// null when at the start of the flow or currentStepId is unknown.
export const getPrevStepId = (
  schema: Schema,
  session: Session,
  currentStepId: string,
): string | null => {
  const visible = getVisibleSteps(schema, session);
  const idx = visible.findIndex((s) => s.id === currentStepId);
  if (idx <= 0) {
    return null;
  }
  return visible[idx - 1]?.id ?? null;
};
