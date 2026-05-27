import axios from 'axios';
import config from '../../config';
import { schedule as scheduleRefresh } from './refreshScheduler';
import { TRANSIENT_RETRY_BACKOFF_MS } from './refreshConstants';
import { classifyRefreshFailure } from '../../utils/authInterceptorHelpers';

interface RefreshResponseShape {
  accessTokenExpiresAt?: string;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Shared low-level refresh primitive. Posts /auth/token/refresh and on success
 * re-schedules proactive refresh from the response. On transient errors
 * (network / 5xx) it retries per TRANSIENT_RETRY_BACKOFF_MS. On auth-failure
 * (401/403) or terminal 4xx it throws so callers can react.
 *
 * onTransient: optional callback for surface effects (toast on/off).
 */
export interface PerformTokenRefreshOptions {
  onTransientStart?: () => void;
  onTransientEnd?: () => void;
}

export const performTokenRefresh = async (
  opts: PerformTokenRefreshOptions = {},
): Promise<void> => {
  const backoffs = TRANSIENT_RETRY_BACKOFF_MS;
  let lastError: unknown = null;
  let transientStarted = false;

  for (let attempt = 0; attempt <= backoffs.length; attempt += 1) {
    try {
      const response = await axios.post<RefreshResponseShape>(
        `${config.apiUrl}/api/v1/auth/token/refresh`,
        {},
        { withCredentials: true },
      );
      if (transientStarted) {
        opts.onTransientEnd?.();
      }
      const expiresAt = response.data?.accessTokenExpiresAt;
      if (typeof expiresAt === 'string') {
        // Re-arm the proactive timer for the next cycle.
        scheduleRefresh(expiresAt, () => performTokenRefresh());
      }
      return;
    } catch (error: unknown) {
      lastError = error;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const failureClass = classifyRefreshFailure(status);

      if (failureClass === 'auth-failure' || failureClass === 'terminal' || attempt >= backoffs.length) {
        if (transientStarted) {
          opts.onTransientEnd?.();
        }
        throw error;
      }

      if (!transientStarted) {
        opts.onTransientStart?.();
        transientStarted = true;
      }
      await sleep(backoffs[attempt] ?? 0);
    }
  }
  throw lastError ?? new Error('refresh exhausted');
};

/**
 * Scheduler callback. Wraps performTokenRefresh and swallows errors — the next
 * real request will hit the 401 interceptor path and trigger sessionExpired
 * routing properly. Calling sessionExpired here would bypass the interceptor's
 * URL context classification and double-fire.
 */
export const proactiveRefresh = async (): Promise<void> => {
  try {
    await performTokenRefresh();
  } catch {
    // Intentional swallow — see jsdoc above.
  }
};
