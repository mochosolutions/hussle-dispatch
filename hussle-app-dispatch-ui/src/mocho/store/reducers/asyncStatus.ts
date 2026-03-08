// state/asyncStatusSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { call, put, cancelled, select } from 'redux-saga/effects';
import type { CallEffect, PutEffect, SelectEffect, CancelledEffect } from 'redux-saga/effects';

/**
 * Standard loading states for async flows.
 */
export enum LoadingState {
  Idle      = 'Idle',
  Pending   = 'Pending',
  Fulfilled = 'Fulfilled',
  Rejected  = 'Rejected',
}

/**
 * Tracks loading status and error messages for any number of async operations,
 * keyed by a unique string per flow.
 */
export interface AsyncStatusState {
  loading: Record<string, LoadingState>;
  errors:  Record<string, string>;
}

const initialState: AsyncStatusState = {
  loading: {},
  errors:  {},
};

export const asyncStatusSlice = createSlice({
  name: 'asyncStatus',
  initialState,
  reducers: {
    /**
     * Set the loading state for a given key.
     * @param key    unique identifier for the async flow (e.g. "users/fetchAll")
     * @param status one of LoadingState
     */
    setAsyncStatus(
      state,
      action: PayloadAction<{ key: string; status: LoadingState }>
    ) {
      state.loading[action.payload.key] = action.payload.status;
    },

    /**
     * Record an error message for a given key.
     */
    setAsyncError(
      state,
      action: PayloadAction<{ key: string; message: string }>
    ) {
      state.errors[action.payload.key] = action.payload.message;
    },

    /**
     * Clear any error for a given key.
     */
    clearAsyncError(
      state,
      action: PayloadAction<{ key: string }>
    ) {
      Reflect.deleteProperty(state.errors, action.payload.key);
    },
  },
});

export const {
  setAsyncStatus,
  setAsyncError,
  clearAsyncError,
} = asyncStatusSlice.actions;

export default asyncStatusSlice.reducer;

/**
 * Raw selector to read loading state from an AsyncStatusState.
 * 
 * Usage in your app:
 *   const loading = useSelector(state => selectLoading(state.asyncStatus, 'jobs/fetchAll'))
 */
export function selectLoading(
  statusState: AsyncStatusState,
  key: string
): LoadingState {
  return statusState.loading[key] ?? LoadingState.Idle;
}

/**
 * Raw selector to read error message from an AsyncStatusState.
 *
 * Usage in your app:
 *   const error = useSelector(state => selectError(state.asyncStatus, 'jobs/fetchAll'))
 */
export function selectError(
  statusState: AsyncStatusState,
  key: string
): string {
  return statusState.errors[key] ?? '';
}

/**
 * Factory for a bound selector, if you prefer:
 *   const selectJobsLoading = makeSelectLoading('jobs/fetchAll');
 *   const loading = useSelector(state => selectJobsLoading(state.asyncStatus));
 */
export function makeSelectLoading(key: string) {
  return (statusState: AsyncStatusState): LoadingState =>
    statusState.loading[key] ?? LoadingState.Idle;
}

export function makeSelectError(key: string) {
  return (statusState: AsyncStatusState): string =>
    statusState.errors[key] ?? '';
}

/**
 * Options for callApiWithStatus:
 * - key: unique status key (e.g. 'jobs/fetchAll')
 * - api: function returning Promise<T>
 * - onStart/onSuccess/onError/onFinally: optional action objects
 */
export interface CallApiWithStatusOpts<T> {
  key: string;
  api: () => Promise<T>;
  onStart?: { type: string; payload?: any };
  onSuccess?: (data: T) => { type: string; payload: any };
  onError?: (err: Error) => { type: string; payload: any };
  onFinally?: { type: string; payload?: any };
}

/** Union of all effect return types this saga yields */
type SagaEffect = CallEffect | PutEffect | SelectEffect | CancelledEffect;


/**
 * Wraps an API call in standardized loading/error state updates.
 * Returns the API result so you can chain further side‑effects.
 */
export function* callApiWithStatus<T>(
  opts: CallApiWithStatusOpts<T>
): Generator<SagaEffect, T, T> {
  const { key, api, onStart, onSuccess, onError, onFinally } = opts;

  try {
    // Optional feature-specific start action
    if (onStart) yield put(onStart);

    // Generic pending
    yield put(setAsyncStatus({ key, status: LoadingState.Pending }));
    yield put(clearAsyncError({ key }));

    // Execute the API call
    const data: T = yield call(api);

    // Optional feature-specific success action
    if (onSuccess) yield put(onSuccess(data));

    // Generic fulfilled
    yield put(setAsyncStatus({ key, status: LoadingState.Fulfilled }));
    return data;
  } catch (err: any) {
    // Optional feature-specific error action
    if (onError) yield put(onError(err));

    // Generic rejected
    yield put(setAsyncStatus({ key, status: LoadingState.Rejected }));
    yield put(setAsyncError({ key, message: err.message || 'Unknown error' }));
    throw err;
  } finally {
    // If this saga was cancelled, reset to Idle
    if (yield cancelled()) {
      yield put(setAsyncStatus({ key, status: LoadingState.Idle }));
    }
    // Optional finally action
    if (onFinally) yield put(onFinally);
  }
}