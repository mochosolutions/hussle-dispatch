// ---------------------------------------------------------------------------
// Carrier Portal V2 — selectors
//
// 3-tier model:
//   1. Raw state — selectSession, selectCurrentStepId, selectAgreements, etc.
//   2. Schema-resolved — selectCurrentStep, selectVisibleAgreementKeys.
//   3. Derived — selectIsLocked, selectAllAgreementsSigned,
//                selectFirstUnsignedAgreement.
// ---------------------------------------------------------------------------

import type { RootState } from 'store';
import type {
  AgreementContext,
  DocumentContext,
  InvitationContext,
  Predicate,
  Session,
  Step,
} from 'features/carrier-portal/engine';
import { evaluatePredicate, findStep } from 'features/carrier-portal/engine';
import { onboardingSchema } from 'features/carrier-portal/schema/onboardingSchema';
import type { LoadingStatus } from '../reducers/carrierPortalSlice';

// ---------------------------------------------------------------------------
// Raw state
// ---------------------------------------------------------------------------

export const selectToken = (state: RootState): string | null =>
  state.pages.carrierPortalV2.token;

export const selectSession = (state: RootState): Session | null =>
  state.pages.carrierPortalV2.session;

export const selectCurrentStepId = (state: RootState): string | null =>
  state.pages.carrierPortalV2.session?.currentStepId ?? null;

export const selectLastSavedAt = (state: RootState): string | null =>
  state.pages.carrierPortalV2.lastSavedAt;

export const selectInvitation = (state: RootState): InvitationContext | null =>
  state.pages.carrierPortalV2.session?.invitation ?? null;

// ---------------------------------------------------------------------------
// Agreement selectors (multi-key)
// ---------------------------------------------------------------------------

const EMPTY_AGREEMENTS: Record<string, AgreementContext> = {};

export const selectAgreements = (state: RootState): Record<string, AgreementContext> =>
  state.pages.carrierPortalV2.session?.agreements ?? EMPTY_AGREEMENTS;

/**
 * Parameterized: returns the agreement under the given templateKey, or null
 * when the agreement hasn't been fetched yet (or the key is unknown).
 *
 * Usage: `useSelector(selectAgreement('DISPATCH_AGREEMENT'))`.
 */
export const selectAgreement =
  (templateKey: string) =>
  (state: RootState): AgreementContext | null =>
    state.pages.carrierPortalV2.session?.agreements?.[templateKey] ?? null;

/**
 * True iff at least one agreement in the record has status === 'SIGNED'.
 * Used by the mid-signing edit guard — when any agreement is signed, edits to
 * identity fields (legalName / mcNumber / dotNumber) trigger a void+re-sign
 * confirmation dialog.
 */
export const selectAnyAgreementSigned = (state: RootState): boolean => {
  const agreements = state.pages.carrierPortalV2.session?.agreements;
  if (!agreements) {
    return false;
  }
  return Object.values(agreements).some((a) => a.status === 'SIGNED');
};

/**
 * True iff the agreements record is non-empty AND every entry has
 * status === 'SIGNED'. Empty record → false (the carrier hasn't even fetched
 * agreements yet).
 */
export const selectAllAgreementsSigned = (state: RootState): boolean => {
  const agreements = state.pages.carrierPortalV2.session?.agreements;
  if (!agreements) {
    return false;
  }
  const values = Object.values(agreements);
  if (values.length === 0) {
    return false;
  }
  return values.every((a) => a.status === 'SIGNED');
};

/**
 * Returns the first AgreementContext in `visibleKeys` order whose
 * status !== 'SIGNED', or null if all visible agreements are signed (or
 * visibleKeys is empty).
 *
 * Pass the visible-keys list explicitly — selectors don't read schema
 * themselves.
 */
export const selectFirstUnsignedAgreement =
  (visibleKeys: string[]) =>
  (state: RootState): AgreementContext | null => {
    const agreements = state.pages.carrierPortalV2.session?.agreements;
    if (!agreements) {
      return null;
    }
    for (const key of visibleKeys) {
      const agreement = agreements[key];
      if (agreement && agreement.status !== 'SIGNED') {
        return agreement;
      }
    }
    return null;
  };

/**
 * True iff the server has stamped `OnboardingSession.completedAt` — the
 * authoritative "you actually finished" signal, written only when the
 * complete-API call succeeded (all gates satisfied: COI uploaded, agreement
 * signed, status transition legal).
 *
 * NOT keyed on `currentStepId === 'complete'`. The cursor can advance to
 * 'complete' client-side (via advanceCurrentStep on cold load) when
 * 'sign-agreement' is in completedStepIds, but completedStepIds membership
 * doesn't guarantee the API will accept completion — a carrier could have
 * the step marked done from a pre-Phase-1 lax-requirements era while still
 * missing the COI. Trusting only completedAt prevents an infinite loop
 * between the route guard (redirect to /complete) and CompleteStep's
 * failure-recovery (redirect to /sign-agreement when the API rejects).
 */
export const selectOnboardingComplete = (state: RootState): boolean => {
  const session = state.pages.carrierPortalV2.session;
  if (!session) return false;
  return Boolean(session.completedAt);
};

// ---------------------------------------------------------------------------
// Document selectors
// ---------------------------------------------------------------------------

const EMPTY_DOCUMENTS: DocumentContext[] = [];

export const selectDocuments = (state: RootState): DocumentContext[] =>
  state.pages.carrierPortalV2.session?.documents ?? EMPTY_DOCUMENTS;

/**
 * Set of documentType strings the carrier has uploaded successfully.
 * Used by the signing+upload step to render which document slots are filled.
 */
export const selectUploadedDocumentTypes = (state: RootState): Set<string> => {
  const docs = state.pages.carrierPortalV2.session?.documents ?? EMPTY_DOCUMENTS;
  return new Set(docs.map((d) => d.documentType));
};

/**
 * True iff every required documentType in `requiredTypes` appears in the
 * carrier's uploaded documents. Empty `requiredTypes` → true (no docs needed).
 */
export const selectAllDocumentsUploaded =
  (requiredTypes: string[]) =>
  (state: RootState): boolean => {
    if (requiredTypes.length === 0) {
      return true;
    }
    const uploaded = selectUploadedDocumentTypes(state);
    return requiredTypes.every((t) => uploaded.has(t));
  };

// ---------------------------------------------------------------------------
// Schema-resolved
// ---------------------------------------------------------------------------

export const selectCurrentStep = (state: RootState): Step | null => {
  const id = selectCurrentStepId(state);
  if (!id) {
    return null;
  }
  return findStep(onboardingSchema, id) ?? null;
};

/**
 * Returns the ordered list of agreement template keys the signing step should
 * surface, after evaluating each TemplateEntry's optional `visibility`
 * predicate against the live session.
 *
 * Pure function — accepts Session directly (not RootState) so it can be called
 * from sagas / hooks that already hold the session reference.
 */
export const selectVisibleAgreementKeys = (session: Session | null): string[] => {
  if (!session) {
    return [];
  }
  const step = findStep(onboardingSchema, 'sign-agreement');
  const templates = step?.templates ?? [];
  const result: string[] = [];
  for (const entry of templates) {
    if (evaluatePredicate(entry.visibility as Predicate | undefined, session)) {
      result.push(entry.key);
    }
  }
  return result;
};

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

/**
 * True iff at least one agreement in the record has signedFieldsLocked === true.
 * Semantics: when any agreement locks fields, the company-phase steps freeze.
 * (Today there's only one agreement; semantics generalize cleanly when more
 * land.)
 */
export const selectIsLocked = (state: RootState): boolean => {
  const agreements = state.pages.carrierPortalV2.session?.agreements;
  if (!agreements) {
    return false;
  }
  return Object.values(agreements).some((a) => a.signedFieldsLocked === true);
};

export const selectLoading =
  (key: string) =>
  (state: RootState): LoadingStatus =>
    state.pages.carrierPortalV2.loading[key] ?? 'idle';

export const selectError =
  (key: string) =>
  (state: RootState): string =>
    state.pages.carrierPortalV2.errors[key] ?? '';
