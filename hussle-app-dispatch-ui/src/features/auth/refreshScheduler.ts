import { PROACTIVE_REFRESH_LEAD_MS } from './refreshConstants';

// Singleton scheduler for proactive access-token refresh. The caller (axios
// interceptor in US-04) supplies the refresh function, keeping this module
// free of imports from `utils/axios` to avoid a circular dependency.

let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
let visibilityListener: (() => void) | null = null;
let nextExpiresAt: Date | null = null;
let activeRefreshFn: (() => Promise<void>) | null = null;

export const cancel = (): void => {
  if (timeoutHandle !== null) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
  if (visibilityListener !== null) {
    document.removeEventListener('visibilitychange', visibilityListener);
    visibilityListener = null;
  }
  nextExpiresAt = null;
  activeRefreshFn = null;
};

export const schedule = (expiresAt: string, refreshFn: () => Promise<void>): void => {
  cancel();

  const expiresAtDate = new Date(expiresAt);
  if (Number.isNaN(expiresAtDate.getTime())) {
    console.warn(`[refreshScheduler] Invalid expiresAt: ${expiresAt}`);
    return;
  }

  nextExpiresAt = expiresAtDate;
  activeRefreshFn = refreshFn;

  const delayMs = Math.max(0, expiresAtDate.getTime() - Date.now() - PROACTIVE_REFRESH_LEAD_MS);

  timeoutHandle = setTimeout(() => {
    void refreshFn().catch(() => {
      // Errors are owned by the caller; swallow here to keep the timer path quiet.
    });
  }, delayMs);

  visibilityListener = () => {
    if (
      document.visibilityState === 'visible' &&
      nextExpiresAt !== null &&
      nextExpiresAt.getTime() - Date.now() < PROACTIVE_REFRESH_LEAD_MS
    ) {
      void refreshFn().catch(() => {
        // See above — caller handles errors.
      });
    }
  };
  document.addEventListener('visibilitychange', visibilityListener);
};

export const __test_getState = () =>
  import.meta.env.MODE === 'production'
    ? null
    : {
        timeoutHandle,
        hasVisibilityListener: visibilityListener !== null,
        nextExpiresAt,
        activeRefreshFn,
      };
