import type { Draft } from '@reduxjs/toolkit';
import { LoadingState } from '../types/loadingState';

/**
 * Interface defining fields needed for request/success/failure logic.
 */
export interface HasLoadingAndErrors {
  loading: Record<string, string>;
  errors: Record<string, string>;
}

// Options for request, success, and failure handlers
interface RequestOptions {
  key: string;
}
interface FailureOptions {
  loadingKey: string;
  errorKey: string;
  failureMessage: string;
}
interface SuccessOptions {
  loadingKey: string;
  errorKey: string;
}

export function ensureMaps<T extends HasLoadingAndErrors>(state: Draft<T>) {
  // Immer Draft types allow mutation; casts keep TS happy.
  if (!state.loading) (state as HasLoadingAndErrors).loading = {};
  if (!state.errors) (state as HasLoadingAndErrors).errors = {};
}

export function setPending<T extends HasLoadingAndErrors>(
  state: Draft<T>,
  { key }: RequestOptions
) {
  ensureMaps(state);
  state.loading[key] = LoadingState.Pending;
}

/**
 * Sets the given loading key to "Fulfilled" and clears the error at errorKey.
 */
export function setFulfilled<T extends HasLoadingAndErrors>(
  state: Draft<T>,
  { loadingKey, errorKey }: SuccessOptions
) {
  ensureMaps(state);
  state.loading[loadingKey] = LoadingState.Fulfilled;
  state.errors[errorKey] = '';
}

/**
 * Sets the given loading key to "Rejected,"
 * and updates the error object with the provided message.
 */
export function setRejected<T extends HasLoadingAndErrors>(
  state: Draft<T>,
  { loadingKey, errorKey, failureMessage }: FailureOptions
) {
  ensureMaps(state);
  state.loading[loadingKey] = LoadingState.Rejected;
  state.errors[errorKey] = failureMessage;
}
