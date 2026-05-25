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

/**
 * Schema-declared lock predicate for a question. When evaluated against the
 * live session, returning `true` renders the field read-only (via
 * `<LockableField>`) and contributes to step-level locked mode.
 *
 * Today's shipping schema declares no `locked` predicates — the lock primitive
 * is dormant. Future schema variants can opt-in (e.g. lock signatory fields
 * after a particular agreement is signed) without touching engine code.
 */
export type LockPredicate = boolean | ((ctx: { session: Session }) => boolean);

export interface Question {
  id: string;
  label: string;
  fieldType: FieldType;
  validation?: YupSchemaFragment;
  visibility?: Predicate;
  prefillFrom?: string; // dot-path into context
  optional?: boolean;
  helpText?: string;
  options?: { value: string; label: string; description?: string; disabled?: boolean }[];
  /**
   * When set and evaluates to `true` against the current session, the field
   * renders as read-only and contributes to step-level `locked` mode.
   * Omitted ⇒ never locked.
   */
  locked?: LockPredicate;
}

export interface DocumentSlot {
  id: string;
  label: string;
  required: boolean;
  // Prisma DocumentType enum value sent to the documents API on presign/confirm.
  // Mirrored locally as a string to keep the engine free of cross-feature imports.
  documentType: string;
}

export interface SideEffect {
  id: string;
  type: string;
}

/**
 * Schema-declared entry for an agreement template the signing step should
 * surface. `visibility` (optional) is a Predicate evaluated against the live
 * Session — entries whose predicate evaluates to false are hidden from
 * selectVisibleAgreementKeys. Today: one entry for DISPATCH_AGREEMENT with
 * no visibility predicate.
 */
export interface TemplateEntry {
  key: string;
  visibility?: Predicate;
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
  // Signing step only — schema-declared list of agreement templates this step surfaces.
  // Empty / undefined → step has no agreements to sign (degenerate).
  templates?: TemplateEntry[];
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
  templateKey: string;
  status: AgreementStatus;
  embedUrl?: string | null;
  signedAt?: string | null;
  signedFieldsLocked?: boolean;
  mock?: boolean;
  variables?: Record<string, string>;
}

export interface InvitationContext {
  email: string | null;
  phone?: string | null;
  organizationName?: string | null;
  dispatcher?: { firstName?: string | null; lastName?: string | null } | null;
}

// Typed Carrier columns projected onto the session response so per-step pages
// can `prefillFrom: 'company.<field>'` when the user navigates back. The
// answers JSON blob no longer carries these for migrated steps (B2+).
export interface CompanyContext {
  legalName?: string | null;
  dbaName?: string | null;
  taxClassification?: string | null;
  tinType?: string | null;
  tin?: string | null;
  mcNumber?: string | null;
  dotNumber?: string | null;
  ein?: string | null;
  phone?: string | null;
  email?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
}

// Per-vehicle prefill projected from the Vehicle Prisma table so the
// equipment-entry list builder can seed its initial state on back-nav.
export interface VehicleContext {
  id: string;
  category: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  licensePlate: string | null;
  gvwr: number | null;
}

// Per-driver prefill projected from the Driver Prisma table.
export interface DriverContext {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  payType: string | null;
  // Decimal — wire format is string after the API JSON replacer.
  payRate: string | number | null;
}

// Mirror of the cost-analysis ledger written by the API. Opaque shape — the
// cost-analysis step is responsible for projecting it into form values.
export type CostAnalysisContext = Record<string, unknown>;

// Lane preferences — typed Carrier columns plus a `mirror` of the full saved
// payload (fleet defaults + per-driver overrides).
export interface LanePreferencesContext {
  homeBaseCity: string | null;
  homeBaseState: string | null;
  maxDaysOut: number | null;
  preferredLanes: unknown;
  weeklySchedule: unknown;
  freightPreferences: unknown;
  mirror: Record<string, unknown> | null;
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

export interface DocumentContext {
  id: string;
  // Prisma DocumentType enum value (e.g., 'INSURANCE_CERT'). Matches the
  // `documentType` declared on schema DocumentSlots.
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Session {
  id: string;
  carrierId: string;
  currentStepId: string | null;
  completedStepIds: string[];
  // Set when the terminal `complete` step has been confirmed server-side
  // (POST /carrier-portal/session/complete). Null until the round-trip lands.
  completedAt?: string | null;
  answers: Answers;
  fmcsaSnapshot?: FmcsaSnapshot;
  company?: CompanyContext;
  vehicles?: VehicleContext[];
  drivers?: DriverContext[];
  costAnalysis?: CostAnalysisContext;
  lanePreferences?: LanePreferencesContext;
  agreements?: Record<string, AgreementContext>;
  // Documents the carrier has uploaded via the portal (INSURANCE_CERT, W9, etc).
  // Projected by GET /carrier-portal/session so the signing+upload step can
  // render upload state on cold load.
  documents?: DocumentContext[];
  invitation: InvitationContext;
}

// ---------- engine-level constants ----------

// Identity fields that are embedded in the signed dispatch agreement PDF.
// Source of truth: `hussle-app-dispatch-api/src/agreements/templates/templateRegistry.ts`
// (DISPATCH_AGREEMENT entry). Editing any of these post-sign triggers the
// mid-signing re-sign confirmation flow (ConfirmReSignDialog + voidAndReSignSaga).
//
// Not a `locked` declaration — this is a runtime guard, not a schema lock. The
// schema-level `Question.locked` predicate is a separate, dormant mechanism.
export const IDENTITY_FIELDS = ['legalName', 'mcNumber', 'dotNumber'] as const;

export type IdentityField = (typeof IDENTITY_FIELDS)[number];
