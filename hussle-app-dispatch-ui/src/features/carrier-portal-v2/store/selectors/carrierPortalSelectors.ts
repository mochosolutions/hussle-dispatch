// ---------------------------------------------------------------------------
// Carrier Portal V2 — selectors
//
// 3-tier model:
//   1. Raw state — selectSession, selectCurrentStepId, etc.
//   2. Schema-resolved — selectCurrentStep walks `findStep(onboardingSchema, id)`.
//   3. Derived — selectIsLocked from agreement.signedFieldsLocked.
// ---------------------------------------------------------------------------

import type { RootState } from 'store';
import type {
  AgreementContext,
  InvitationContext,
  Session,
  Step,
} from 'features/carrier-portal-v2/engine';
import { findStep } from 'features/carrier-portal-v2/engine';
import { onboardingSchema } from 'features/carrier-portal-v2/schema/onboardingSchema';
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

export const selectAgreement = (state: RootState): AgreementContext | null =>
  state.pages.carrierPortalV2.session?.agreement ?? null;

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

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

export const selectIsLocked = (state: RootState): boolean =>
  state.pages.carrierPortalV2.session?.agreement?.signedFieldsLocked === true;

export const selectLoading =
  (key: string) =>
  (state: RootState): LoadingStatus =>
    state.pages.carrierPortalV2.loading[key] ?? 'idle';

export const selectError =
  (key: string) =>
  (state: RootState): string =>
    state.pages.carrierPortalV2.errors[key] ?? '';
