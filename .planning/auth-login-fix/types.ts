// Auto-generated from contract.yaml — DO NOT EDIT MANUALLY
//
// Source: .planning/auth-login-fix/contract.yaml
// Plan:   .planning/auth-login-fix/plan.md
//
// Shared types for the auth-login-fix contract. Consume from both
// hussle-app-dispatch-api (response shaping) and hussle-app-dispatch-ui
// (response parsing + Redux state) to keep both sides aligned.

// ===========================================================================
// Enums
// ===========================================================================

export enum AuthStatus {
  AUTHENTICATED = 'authenticated',
  CHALLENGE_REQUIRED = 'CHALLENGE_REQUIRED',
  UNCONFIRMED = 'UNCONFIRMED',
}

/**
 * Frontend-only enum (NOT over the wire). Drives the `sessionExpired({ context })`
 * Redux action dispatched by the axios interceptor on definitive auth failure.
 * The axios interceptor classifies context based on request URL prefix:
 *   - `/carrier-portal/*` or `/driver-portal/*` → SessionExpiredContext.PORTAL
 *   - everything else                            → SessionExpiredContext.MAIN
 *
 * Routing reaction:
 *   - MAIN   → sessionExpiredSaga navigates to `/login`; AuthGuard rescues on Redux state change.
 *   - PORTAL → PortalSessionGuard renders portal-appropriate "session expired" screen.
 */
export enum SessionExpiredContext {
  MAIN = 'main',
  PORTAL = 'portal',
}

// ===========================================================================
// Shared structural types
// ===========================================================================

export interface ErrorBody {
  errors: Array<{
    message: string;
    /** Optional machine-readable error code (e.g., `ORG_SUSPENDED`, `UNAUTHORIZED`). */
    code?: string;
  }>;
}

/**
 * Authenticated user identity. Shape unchanged by auth-login-fix; passthrough
 * for additional fields populated by the user service.
 */
export interface User {
  id: string;
  email: string;
  organizationId?: string | null;
  // Implementation returns additional fields; consumers should treat User as
  // open-shape and reference only the documented members above.
  [key: string]: unknown;
}

/** Organization the user has membership in. Shape unchanged. */
export interface AccessibleOrg {
  [key: string]: unknown;
}

// ===========================================================================
// Request bodies
// ===========================================================================

export interface LoginRequest {
  email: string;
  password: string;
  /**
   * NEW in auth-login-fix.
   * When `true`, the issued session uses extended TTL (30d) instead of base (7d).
   * Persisted on the Redis session blob so subsequent rotations preserve the TTL.
   * Omitted or `false` → 7d session.
   */
  rememberMe?: boolean;
}

// ===========================================================================
// Response shapes — all authenticated responses carry `accessTokenExpiresAt`.
// ===========================================================================

/**
 * Discriminator: `status: 'authenticated'`. Issued by login, refresh response is
 * separate (RefreshTokenResponse) because refresh doesn't return the user object.
 */
export interface AuthenticatedResponse {
  user: User;
  accessibleOrgs: AccessibleOrg[];
  /**
   * @deprecated Frontend ignores this; auth flows through the HttpOnly `accessToken`
   * cookie. Retained for backward compatibility. Will be removed in a future cleanup.
   */
  accessToken: string;
  status: AuthStatus.AUTHENTICATED;
  message: string;
  /**
   * NEW in auth-login-fix. Absolute ISO-8601 timestamp at which the access token
   * expires. Drives the frontend `refreshScheduler` (timer + visibility listener).
   *
   * Frontend MUST defensively no-op if undefined (graceful degradation during
   * a frontend-first deploy where the backend hasn't shipped this field yet).
   * Example: "2026-05-27T15:00:00.000Z"
   */
  accessTokenExpiresAt: string;
}

/** Discriminator: `status: 'CHALLENGE_REQUIRED'`. Cognito challenge in flight. */
export interface ChallengeRequiredResponse {
  status: AuthStatus.CHALLENGE_REQUIRED;
  user: User;
  /** Cognito-issued session token for completing the challenge. */
  session: string;
  challengeName: string;
  message: string;
}

/** Discriminator: `status: 'UNCONFIRMED'`. Email not yet verified. */
export interface UnconfirmedResponse {
  status: AuthStatus.UNCONFIRMED;
  user: User;
  message: string;
  canResendCode: boolean;
}

/**
 * Discriminated union for all three login outcomes. Branch on `status`.
 */
export type LoginResponse =
  | AuthenticatedResponse
  | ChallengeRequiredResponse
  | UnconfirmedResponse;

/**
 * POST /auth/token/refresh response body. Tokens themselves are in cookies.
 * `accessTokenExpiresAt` MUST be used by the frontend to re-schedule the
 * proactive refresh timer after every successful refresh.
 */
export interface RefreshTokenResponse {
  message: string;
  accessTokenExpiresAt: string;
}

/**
 * GET /auth/me response. `accessTokenExpiresAt` is decoded from the `exp` claim
 * of the access-token JWT on the request — /auth/me does NOT mint a new token.
 */
export interface CurrentUserResponse {
  user: User;
  accessibleOrgs: AccessibleOrg[];
  message: string;
  accessTokenExpiresAt: string;
}

// ===========================================================================
// Per-endpoint response unions (convenience type aliases for axios callers)
// ===========================================================================

export type AuthLoginResponse = LoginResponse;
export type AuthRefreshTokenResponse = RefreshTokenResponse;
export type AuthCurrentUserResponse = CurrentUserResponse;
export type AuthSignupOrgResponse = AuthenticatedResponse;
export type AuthAcceptInviteResponse = AuthenticatedResponse;
export type AuthSwitchOrgResponse = AuthenticatedResponse;
export type AuthPasswordChallengeResponse = AuthenticatedResponse;

// ===========================================================================
// Constants — TTL values referenced by both backend (Redis EX) and frontend
// (cookie maxAge validation in tests). Defined here so a future TTL change is
// one edit, not a hunt-and-replace.
// ===========================================================================

/** Base refresh-token TTL: 7 days, in seconds. */
export const REFRESH_TTL_BASE_SECONDS = 7 * 24 * 60 * 60;

/** Extended refresh-token TTL (Remember Me): 30 days, in seconds. */
export const REFRESH_TTL_EXTENDED_SECONDS = 30 * 24 * 60 * 60;

/** Access-token JWT TTL: 1 hour, expressed for `jsonwebtoken`'s `expiresIn`. */
export const ACCESS_TOKEN_EXPIRES_IN = '1h';

/** Read-through grace window after rotation: 10 seconds. */
export const ROTATION_GRACE_TTL_SECONDS = 10;

/**
 * Proactive refresh lead time: fire refresh this many milliseconds before
 * `accessTokenExpiresAt`. Also the threshold for visibility-change refresh
 * ("if expiry is within this much, refresh before any other request").
 */
export const PROACTIVE_REFRESH_LEAD_MS = 5 * 60 * 1000;

/** Exponential backoff schedule (ms) for transient-error retry on refresh. */
export const TRANSIENT_RETRY_BACKOFF_MS = [500, 1500, 4000] as const;
