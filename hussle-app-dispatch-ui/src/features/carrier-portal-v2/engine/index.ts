// Engine barrel — re-exports the public surface of the pure-function engine.
// Engine internals are still subject to the no-impure-engine-imports rule; this barrel
// is the canonical import site for all non-engine callers.

export type {
  AgreementContext,
  AgreementStatus,
  Answers,
  DocumentSlot,
  FieldType,
  FmcsaSnapshot,
  InvitationContext,
  LockedFieldPath,
  Phase,
  PhaseCheckpoint,
  Predicate,
  PredicateAnd,
  PredicateEq,
  PredicateIn,
  PredicateNot,
  PredicateOr,
  Question,
  Schema,
  SchemaMetadata,
  Session,
  SideEffect,
  Step,
  StepType,
  YupSchemaFragment,
} from './types';

export { LOCKS_FIELDS } from './types';
export { LockViolationError } from './errors';
export { resolveContext } from './resolveContext';
export { evaluatePredicate } from './evaluatePredicate';
export { getVisibleSteps, findStep, findPhaseOfStep } from './getVisibleSteps';
export type { VisibleStep } from './getVisibleSteps';
export { getNextStepId } from './getNextStepId';
export { getPrevStepId } from './getPrevStepId';
export { computeInvalidations, isStepVisible } from './computeInvalidations';
