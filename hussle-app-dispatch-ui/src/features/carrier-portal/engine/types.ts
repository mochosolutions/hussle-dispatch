// Engine module — pure types and value contracts.
//
// PURITY CONTRACT: this file imports NOTHING. The engine itself imports only from this file.
// Enforced by `.dependency-cruiser.cjs` rule `no-impure-engine-imports`.

// ---------- step types ----------

export type StepType =
  | 'segmentation'
  | 'input'
  | 'verification'
  | 'signing'
  | 'upload'
  | 'review'
  | 'checkpoint'
  | 'complete'
  | 'costAnalysis'
  | 'lanePreferences'
  | 'equipmentList'
  | 'driversList'
  | 'driversSoloConfirm';

// ---------- predicate ----------

export interface PredicateEq {
  op: 'eq';
  field: string; // dot-path into session context (e.g. 'answers.company.hasMcAuthority')
  value: unknown;
}

export interface PredicateIn {
  op: 'in';
  field: string;
  values: unknown[];
}

export interface PredicateAnd {
  op: 'and';
  clauses: Predicate[];
}

export interface PredicateOr {
  op: 'or';
  clauses: Predicate[];
}

export interface PredicateNot {
  op: 'not';
  clause: Predicate;
}

export type Predicate =
  | PredicateEq
  | PredicateIn
  | PredicateAnd
  | PredicateOr
  | PredicateNot;

// ---------- schema definition ----------

export type FieldType =
  | 'text'
  | 'mc'
  | 'tin'
  | 'select'
  | 'number'
  | 'address'
  | 'cards'
  | 'toggle'
  | 'date'
  | 'checkbox'
  | 'email';

// A Yup schema fragment. The engine doesn't depend on Yup — it carries opaque references
// that step renderers may evaluate. Typed as `unknown` keeps the engine portable.
export type YupSchemaFragment = unknown;

export interface Question {
  id: string;
  label: string;
  fieldType: FieldType;
  validation?: YupSchemaFragment;
  visibility?: Predicate;
  prefillFrom?: string; // dot-path into context
  optional?: boolean;
  helpText?: string;
  options?: { value: string; label: string; description?: string }[];
}

export interface DocumentSlot {
  id: string;
  label: string;
  required: boolean;
}

export interface SideEffect {
  id: string;
  type: string;
}

export interface Step {
  id: string;
  type: StepType;
  title?: string;
  subtitle?: string;
  questions?: Question[];
  documents?: DocumentSlot[];
  sideEffects?: SideEffect[];
  visibility?: Predicate;
  // Signing step only — declarative list of dot-paths locked after this step completes.
  locksFields?: string[];
  // Signing step only.
  template?: 'dispatch_v1';
  // Verification step only — name of the session field the step waits on (e.g. 'fmcsaSnapshot').
  waitingFor?: string;
  // CompleteStep optional summary line generator.
  completeSummary?: (answers: Session['answers']) => string;
}

export interface PhaseCheckpoint {
  title: string;
  body: string;
  upcoming?: string[];
}

export interface Phase {
  id: string;
  label: string;
  steps: Step[];
  checkpoint?: PhaseCheckpoint;
  visibility?: Predicate;
  estimatedMinutes?: number;
}

export interface SchemaMetadata {
  name: string;
  estimatedMinutes: number;
}

export interface Schema {
  version: number;
  metadata: SchemaMetadata;
  phases: Phase[];
}

// ---------- session ----------

export type AgreementStatus = 'PENDING' | 'SIGNED' | 'VOIDED' | 'EXPIRED' | 'DECLINED' | 'DRAFT';

export interface AgreementContext {
  id: string;
  status: AgreementStatus;
  embedUrl?: string | null;
  signedFieldsLocked?: boolean;
}

export interface InvitationContext {
  email: string | null;
  phone?: string | null;
  organizationName?: string | null;
  dispatcher?: { firstName?: string | null; lastName?: string | null } | null;
}

export interface FmcsaSnapshot {
  legalName?: string;
  dba?: string;
  address?: string;
  dotNumber?: string;
  fleetSize?: number;
  safetyRating?: string;
  authorityStatus?: string;
  officerName?: string;
}

// Answers are namespaced by stepId so step renderers carry isolated answer trees.
export type Answers = Record<string, Record<string, unknown>>;

export interface Session {
  id: string;
  carrierId: string;
  currentStepId: string | null;
  completedStepIds: string[];
  answers: Answers;
  fmcsaSnapshot?: FmcsaSnapshot;
  agreement?: AgreementContext;
  invitation: InvitationContext;
}

// ---------- engine-level constants ----------

// Dot-paths (relative to the company step's answers) that lock after the signing step completes.
// Mirrors `hussle-app-dispatch-api/src/carrier-portal/constants/locksFields.ts`. A CI test
// asserts the two lists carry identical paths.
export const LOCKS_FIELDS = [
  'company.legalName',
  'company.mcNumber',
  'company.dotNumber',
  'company.signatoryName',
  'company.signatoryTitle',
  'company.taxClassification',
  'company.tinType',
  'company.tin',
] as const;

export type LockedFieldPath = (typeof LOCKS_FIELDS)[number];
