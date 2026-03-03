import { PayloadAction } from '@reduxjs/toolkit';
import { CallEffect, PutEffect, SelectEffect, CancelledEffect } from 'redux-saga/effects';
/**
 * Standard loading states for async flows.
 */
export declare enum LoadingState {
    Idle = "Idle",
    Pending = "Pending",
    Fulfilled = "Fulfilled",
    Rejected = "Rejected"
}
/**
 * Tracks loading status and error messages for any number of async operations,
 * keyed by a unique string per flow.
 */
export interface AsyncStatusState {
    loading: Record<string, LoadingState>;
    errors: Record<string, string>;
}
export declare const asyncStatusSlice: import('@reduxjs/toolkit').Slice<AsyncStatusState, {
    /**
     * Set the loading state for a given key.
     * @param key    unique identifier for the async flow (e.g. "users/fetchAll")
     * @param status one of LoadingState
     */
    setAsyncStatus(state: {
        loading: {
            [x: string]: LoadingState;
        };
        errors: {
            [x: string]: string;
        };
    }, action: PayloadAction<{
        key: string;
        status: LoadingState;
    }>): void;
    /**
     * Record an error message for a given key.
     */
    setAsyncError(state: {
        loading: {
            [x: string]: LoadingState;
        };
        errors: {
            [x: string]: string;
        };
    }, action: PayloadAction<{
        key: string;
        message: string;
    }>): void;
    /**
     * Clear any error for a given key.
     */
    clearAsyncError(state: {
        loading: {
            [x: string]: LoadingState;
        };
        errors: {
            [x: string]: string;
        };
    }, action: PayloadAction<{
        key: string;
    }>): void;
}, "asyncStatus", "asyncStatus", import('@reduxjs/toolkit').SliceSelectors<AsyncStatusState>>;
export declare const setAsyncStatus: import('@reduxjs/toolkit').ActionCreatorWithPayload<{
    key: string;
    status: LoadingState;
}, "asyncStatus/setAsyncStatus">, setAsyncError: import('@reduxjs/toolkit').ActionCreatorWithPayload<{
    key: string;
    message: string;
}, "asyncStatus/setAsyncError">, clearAsyncError: import('@reduxjs/toolkit').ActionCreatorWithPayload<{
    key: string;
}, "asyncStatus/clearAsyncError">;
declare const _default: import('redux').Reducer<AsyncStatusState>;
export default _default;
/**
 * Raw selector to read loading state from an AsyncStatusState.
 *
 * Usage in your app:
 *   const loading = useSelector(state => selectLoading(state.asyncStatus, 'jobs/fetchAll'))
 */
export declare function selectLoading(statusState: AsyncStatusState, key: string): LoadingState;
/**
 * Raw selector to read error message from an AsyncStatusState.
 *
 * Usage in your app:
 *   const error = useSelector(state => selectError(state.asyncStatus, 'jobs/fetchAll'))
 */
export declare function selectError(statusState: AsyncStatusState, key: string): string;
/**
 * Factory for a bound selector, if you prefer:
 *   const selectJobsLoading = makeSelectLoading('jobs/fetchAll');
 *   const loading = useSelector(state => selectJobsLoading(state.asyncStatus));
 */
export declare function makeSelectLoading(key: string): (statusState: AsyncStatusState) => LoadingState;
export declare function makeSelectError(key: string): (statusState: AsyncStatusState) => string;
/**
 * Options for callApiWithStatus:
 * - key: unique status key (e.g. 'jobs/fetchAll')
 * - api: function returning Promise<T>
 * - onStart/onSuccess/onError/onFinally: optional action objects
 */
export interface CallApiWithStatusOpts<T> {
    key: string;
    api: () => Promise<T>;
    onStart?: {
        type: string;
        payload?: any;
    };
    onSuccess?: (data: T) => {
        type: string;
        payload: any;
    };
    onError?: (err: Error) => {
        type: string;
        payload: any;
    };
    onFinally?: {
        type: string;
        payload?: any;
    };
}
/** Union of all effect return types this saga yields */
type SagaEffect = CallEffect | PutEffect | SelectEffect | CancelledEffect;
/**
 * Wraps an API call in standardized loading/error state updates.
 * Returns the API result so you can chain further side‑effects.
 */
export declare function callApiWithStatus<T>(opts: CallApiWithStatusOpts<T>): Generator<SagaEffect, T, T>;
//# sourceMappingURL=asyncStatus.d.ts.map