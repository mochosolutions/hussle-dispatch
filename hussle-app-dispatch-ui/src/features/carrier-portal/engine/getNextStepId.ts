import type { Schema, Session } from './types';
import { getVisibleSteps } from './getVisibleSteps';

// Linear forward walk: given currentStepId, return the next visible step's id, or null
// when at the end of the flow or currentStepId is unknown.
export const getNextStepId = (
  schema: Schema,
  session: Session,
  currentStepId: string,
): string | null => {
  const visible = getVisibleSteps(schema, session);
  const idx = visible.findIndex((s) => s.id === currentStepId);
  if (idx < 0 || idx === visible.length - 1) {
    return null;
  }
  return visible[idx + 1]?.id ?? null;
};
