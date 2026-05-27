import { SessionExpiredContext } from '../features/auth/types';

const PORTAL_URL_PATTERNS = ['/carrier-portal', '/driver-portal'];

/**
 * Classifies a failing request's URL as portal vs main. Used by the axios
 * interceptor to decide which `sessionExpired({ context })` to dispatch.
 */
export const classifyContext = (url: string | undefined): SessionExpiredContext => {
  if (!url) {
    return SessionExpiredContext.MAIN;
  }
  return PORTAL_URL_PATTERNS.some((p) => url.includes(p))
    ? SessionExpiredContext.PORTAL
    : SessionExpiredContext.MAIN;
};

/**
 * Classifies refresh-call failure status into the retry policy:
 *  - 'auth-failure' → 401/403, do not retry, dispatch sessionExpired immediately.
 *  - 'transient'    → undefined (network) or 5xx, retry per backoff schedule.
 *  - 'terminal'     → other 4xx, do not retry, rethrow.
 */
export type RefreshFailureClass = 'auth-failure' | 'transient' | 'terminal';

export const classifyRefreshFailure = (status: number | undefined): RefreshFailureClass => {
  if (status === 401 || status === 403) {
    return 'auth-failure';
  }
  if (status === undefined) {
    return 'transient';
  }
  if (status >= 500 && status < 600) {
    return 'transient';
  }
  return 'terminal';
};
