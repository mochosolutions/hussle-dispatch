import type { AxiosRequestConfig, AxiosError } from 'axios';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import config from '../config';
import { store } from 'store';
import { logoutSuccess } from '../features/auth/store/authSlice';
import { getNavigate } from 'utils/getNavigate';

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

const handleAuthFailure = () => {
  localStorage.removeItem('rememberMe');
  store.dispatch(logoutSuccess());

  try {
    const navigate = getNavigate();
    if (typeof navigate === 'function') {
      navigate('/login');
    }
  } catch {
    // Navigation not available (e.g., outside React tree) — state reset is sufficient
  }
};

const axiosInstance = axios.create({
  baseURL: `${config.apiUrl}/api/v1`,
  withCredentials: true,
});

const ORG_SUSPENDED_MESSAGE = 'Organization is suspended or inactive';

const extractErrorMessage = (error: AxiosError): string => {
  const data = error.response?.data as { errors?: Array<{ message: string }> } | undefined;
  const firstError = data?.errors?.[0];
  return firstError?.message ?? 'Access denied';
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 403) {
      const message = extractErrorMessage(error);
      if (message.includes(ORG_SUSPENDED_MESSAGE)) {
        handleAuthFailure();
      } else {
        enqueueSnackbar(message, { variant: 'error' });
      }
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (loggingOut) {
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
      await axios.post(
        `${config.apiUrl}/api/v1/auth/token/refresh`,
        {},
        { withCredentials: true },
      );
      processQueue(null);
      return axiosInstance(originalRequest);
    } catch (refreshError: unknown) {
      processQueue(refreshError);
      handleAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
