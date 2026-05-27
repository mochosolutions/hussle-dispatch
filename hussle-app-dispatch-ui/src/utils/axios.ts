import type { AxiosRequestConfig, AxiosError } from 'axios';
import axios from 'axios';
// notistack import allowed here only for closeSnackbar — sanctioned exception.
// All notification dispatch goes through the Redux notification slice; closeSnackbar
// is used solely to dismiss any active toasts during auth-failure cleanup.
import { closeSnackbar } from 'notistack';
import config from '../config';
import { store } from 'store';
import { sessionExpired } from '../features/auth/store/authSlice';
import { resetPopups } from '../features/ui/store/reducers/uiSlice';
import { notify } from '../features/ui/store/reducers/notificationSlice';
import { cancel as cancelRefresh } from '../features/auth/refreshScheduler';
import { performTokenRefresh } from '../features/auth/refreshFn';
import { classifyContext } from './authInterceptorHelpers';

interface QueuedRequest {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];
let loggingOut = false;
let reconnectingToastId: string | number | null = null;

export const setLoggingOut = (value: boolean) => {
  loggingOut = value;
};

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((pending) => {
    if (error) {
      pending.reject(error);
    } else {
      pending.resolve();
    }
  });
  failedQueue = [];
};

const AUTH_BYPASS_PATHS = ['/auth/login', '/auth/logout', '/auth/token/refresh'];

const isAuthBypassRequest = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }
  return AUTH_BYPASS_PATHS.some((path) => url.includes(path));
};

const dispatchSessionExpired = (originalRequestUrl: string | undefined): void => {
  try {
    localStorage.removeItem('rememberMe');
    cancelRefresh();
    closeSnackbar();
    store.dispatch(resetPopups());
    store.dispatch(sessionExpired({ context: classifyContext(originalRequestUrl) }));
  } catch (error: unknown) {
    console.error('dispatchSessionExpired failed', error);
  }
};

const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

const readCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return undefined;
};

const axiosInstance = axios.create({
  baseURL: `${config.apiUrl}/api/v1`,
  withCredentials: true,
});

// Forward the CSRF double-submit token from the csrfToken cookie into the
// X-CSRF-Token header. Server-side csrfProtection middleware skips safe
// methods + public auth paths, so missing-on-first-request is harmless.
axiosInstance.interceptors.request.use((requestConfig) => {
  const csrfToken = readCookie(CSRF_COOKIE_NAME);
  if (csrfToken !== undefined && csrfToken.length > 0) {
    requestConfig.headers.set(CSRF_HEADER_NAME, csrfToken);
  }
  return requestConfig;
});

const extractErrorMessage = (error: AxiosError): string => {
  const data = error.response?.data as { errors?: { message: string; code?: string }[] } | undefined;
  const firstError = data?.errors?.[0];
  return firstError?.message ?? 'Access denied';
};

const extractErrorCode = (error: AxiosError): string | undefined => {
  const data = error.response?.data as { errors?: { message: string; code?: string }[] } | undefined;
  return data?.errors?.[0]?.code;
};

const showReconnectingToast = (): void => {
  if (reconnectingToastId !== null) {
    return;
  }
  const action = store.dispatch(
    notify({ message: 'Reconnecting…', variant: 'info', options: { persist: true } }),
  );
  reconnectingToastId = action.payload.id;
};

const dismissReconnectingToast = (): void => {
  if (reconnectingToastId !== null) {
    closeSnackbar(reconnectingToastId);
    reconnectingToastId = null;
  }
};

/**
 * Posts /auth/token/refresh via the shared `performTokenRefresh` helper. The
 * helper handles backoff + re-scheduling internally; this wrapper only adds
 * the "Reconnecting…" toast lifecycle for the interceptor-triggered path.
 */
const tryRefreshWithRetry = (): Promise<void> =>
  performTokenRefresh({
    onTransientStart: showReconnectingToast,
    onTransientEnd: dismissReconnectingToast,
  });

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const requestUrl = originalRequest?.url;

    const isAuthRequest = isAuthBypassRequest(requestUrl);

    if (error.response?.status === 403) {
      const message = extractErrorMessage(error);
      const code = extractErrorCode(error);
      if (!isAuthRequest && code === 'ORG_SUSPENDED') {
        dispatchSessionExpired(requestUrl);
      } else if (!isAuthRequest) {
        store.dispatch(notify({ message, variant: 'error' }));
      }
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (loggingOut || isAuthRequest) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => axiosInstance(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await tryRefreshWithRetry();
      processQueue(null);
      return axiosInstance(originalRequest);
    } catch (refreshError: unknown) {
      processQueue(refreshError);
      dispatchSessionExpired(requestUrl);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
