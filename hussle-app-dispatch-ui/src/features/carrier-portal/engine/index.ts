// Engine barrel — re-exports the public surface of the pure-function engine.
// Engine internals are still subject to the no-impure-engine-imports rule; this barrel
// is the canonical import site for all non-engine callers.

export type {
  AgreementContext,
  AgreementStatus,
  Answers,
  CompanyContext,
  CostAnalysisContext,
  DocumentContext,
  DocumentSlot,
  DriverContext,
  FieldType,
  FmcsaSnapshot,
  IdentityField,
  InvitationContext,
  LanePreferencesContext,
  LockPredicate,
  VehicleContext,
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
  TemplateEntry,
  StepType,
  YupSchemaFragment,
} from './types';

export { IDENTITY_FIELDS } from './types';
export { LockViolationError } from './errors';
export { resolveContext } from './resolveContext';
export { evaluatePredicate } from './evaluatePredicate';
export { getVisibleSteps, findStep, findPhaseOfStep } from './getVisibleSteps';
export type { VisibleStep } from './getVisibleSteps';
export { getNextStepId } from './getNextStepId';
export { getPrevStepId } from './getPrevStepId';
export { computeInvalidations, isStepVisible } from './computeInvalidations';
export { computeStepMode } from './computeStepMode';
export type { StepMode } from './computeStepMode';
export { isQuestionLocked } from './isQuestionLocked';
