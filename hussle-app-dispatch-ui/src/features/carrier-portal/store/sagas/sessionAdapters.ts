// ---------------------------------------------------------------------------
// Helpers shared by carrier-portal sagas.
//
// `toEngineSession`           — projects the GET /carrier-portal/session
//                                response into the engine `Session` shape.
// `mergeSubmitStepResponse`   — projects a Prisma OnboardingSession row from
//                                POST /session/submit-step into engine Session,
//                                preserving the previously-loaded invitation +
//                                agreement context.
// `extractFieldLockError`     — type guard for axios 422 FIELD_LOCKED errors.
// `extractErrorMessage`       — uniform error → string projection.
// ---------------------------------------------------------------------------

import type {
  AgreementContext,
  AgreementStatus,
  InvitationContext,
  Session,
} from 'features/carrier-portal/engine';
import { getNextStepId } from 'features/carrier-portal/engine';
import { onboardingSchema } from 'features/carrier-portal/schema/onboardingSchema';
import type {
  PortalSessionResponseV2,
} from 'utils/api/carrierPortal/v2';

const AGREEMENT_STATUSES: readonly AgreementStatus[] = [
  'PENDING',
  'SIGNED',
  'VOIDED',
  'EXPIRED',
  'DECLINED',
  'DRAFT',
] as const;

const toAgreementStatus = (raw: string): AgreementStatus => {
  const upper = raw.toUpperCase();
  const match = AGREEMENT_STATUSES.find((status) => status === upper);
  return match ?? 'PENDING';
};

const toAgreementContext = (
  raw: PortalSessionResponseV2['agreement'],
): AgreementContext | undefined => {
  if (!raw) {
    return undefined;
  }
  return {
    id: raw.id,
    status: toAgreementStatus(raw.status),
    embedUrl: raw.embedUrl,
    signedFieldsLocked: raw.signedFieldsLocked,
  };
};

const toInvitationContext = (
  raw: PortalSessionResponseV2['invitation'],
): InvitationContext => ({
  email: raw.email,
  phone: raw.phone,
  organizationName: raw.organizationName,
});

/**
 * The backend sets currentStepId to the step that was just submitted, not the
 * next step. Advance past any already-completed step so the UI shows the
 * correct next screen.
 */
export const advanceCurrentStep = (session: Session): Session => {
  const { currentStepId, completedStepIds } = session;
  if (!currentStepId || !completedStepIds.includes(currentStepId)) {
    return session;
  }
  const nextStepId = getNextStepId(onboardingSchema, session, currentStepId);
  return { ...session, currentStepId: nextStepId };
};

export const toEngineSession = (response: PortalSessionResponseV2): Session => ({
  id: response.session.id,
  carrierId: response.session.carrierId,
  currentStepId: response.session.currentStepId,
  completedStepIds: response.session.completedStepIds ?? [],
  answers: response.session.answers ?? {},
  fmcsaSnapshot: undefined,
  agreement: toAgreementContext(response.agreement),
  invitation: toInvitationContext(response.invitation),
});

interface PrismaSessionRow {
  id: string;
  carrierId: string;
  currentStepId: string | null;
  completedStepIds: string[];
  answers?: Record<string, Record<string, unknown>> | null;
}

const isPrismaSessionRow = (value: unknown): value is PrismaSessionRow =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  'carrierId' in value &&
  'currentStepId' in value &&
  'completedStepIds' in value;

/**
 * Merge a submit-step response into an existing engine Session.
 *
 * The submit-step API returns the raw Prisma OnboardingSession row (not the
 * full `{ session, carrier, agreement, invitation }` envelope from GET). To
 * keep invitation + agreement context stable, we project only the mutable
 * fields onto the previous Session.
 */
export const mergeSubmitStepResponse = (previous: Session, raw: unknown): Session => {
  if (isPrismaSessionRow(raw)) {
    return {
      ...previous,
      id: raw.id,
      carrierId: raw.carrierId,
      currentStepId: raw.currentStepId,
      completedStepIds: raw.completedStepIds ?? previous.completedStepIds,
      answers: raw.answers ?? previous.answers,
    };
  }
  // Some endpoints may instead return the full envelope; fall back to that.
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'session' in raw &&
    'invitation' in raw
  ) {
    return toEngineSession(raw as PortalSessionResponseV2);
  }
  return previous;
};

// ---------------------------------------------------------------------------
// Error narrowing
// ---------------------------------------------------------------------------

export interface FieldLockError {
  message: string;
  code: 'FIELD_LOCKED';
  field?: string;
}

interface AxiosLikeError {
  response?: {
    data?: {
      errors?: { message?: string; code?: string; field?: string }[];
    };
  };
  message?: string;
}

const isAxiosLikeError = (value: unknown): value is AxiosLikeError =>
  typeof value === 'object' && value !== null && ('response' in value || 'message' in value);

export const extractFieldLockError = (error: unknown): FieldLockError | null => {
  if (!isAxiosLikeError(error)) {
    return null;
  }
  const first = error.response?.data?.errors?.[0];
  if (first && first.code === 'FIELD_LOCKED') {
    return {
      message: first.message ?? 'Field is locked',
      code: 'FIELD_LOCKED',
      field: first.field,
    };
  }
  return null;
};

export const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosLikeError(error)) {
    const first = error.response?.data?.errors?.[0];
    if (first?.message) {
      return first.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};
