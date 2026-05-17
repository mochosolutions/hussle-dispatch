import type { Phase, Schema, Session, Step } from './types';
import { evaluatePredicate } from './evaluatePredicate';

export interface VisibleStep extends Step {
  phaseId: string;
  phaseLabel: string;
}

// Flattens schema.phases × steps in order, filtering by phase + step visibility predicates.
// Phase visibility short-circuits: a hidden phase contributes zero steps.
export const getVisibleSteps = (schema: Schema, session: Session): VisibleStep[] => {
  const result: VisibleStep[] = [];
  for (const phase of schema.phases) {
    if (!evaluatePredicate(phase.visibility, session)) {
      continue;
    }
    for (const step of phase.steps) {
      if (!evaluatePredicate(step.visibility, session)) {
        continue;
      }
      result.push({ ...step, phaseId: phase.id, phaseLabel: phase.label });
    }
  }
  return result;
};

// Convenience: find a step by id without re-flattening every time.
export const findStep = (schema: Schema, stepId: string): Step | undefined => {
  for (const phase of schema.phases) {
    const found = phase.steps.find((s) => s.id === stepId);
    if (found) return found;
  }
  return undefined;
};

// Convenience: find the phase containing a step.
export const findPhaseOfStep = (schema: Schema, stepId: string): Phase | undefined =>
  schema.phases.find((p) => p.steps.some((s) => s.id === stepId));
