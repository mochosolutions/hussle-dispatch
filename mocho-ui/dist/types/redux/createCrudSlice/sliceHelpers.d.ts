import { Draft } from '@reduxjs/toolkit';
/**
 * Interface defining fields needed for request/success/failure logic.
 */
export interface HasLoadingAndErrors {
    loading: Record<string, string>;
    errors: Record<string, string>;
}
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
export declare function ensureMaps<T extends HasLoadingAndErrors>(state: Draft<T>): void;
export declare function setPending<T extends HasLoadingAndErrors>(state: Draft<T>, { key }: RequestOptions): void;
/**
 * Sets the given loading key to "Fulfilled" and clears the error at errorKey.
 */
export declare function setFulfilled<T extends HasLoadingAndErrors>(state: Draft<T>, { loadingKey, errorKey }: SuccessOptions): void;
/**
 * Sets the given loading key to "Rejected,"
 * and updates the error object with the provided message.
 */
export declare function setRejected<T extends HasLoadingAndErrors>(state: Draft<T>, { loadingKey, errorKey, failureMessage }: FailureOptions): void;
export {};
//# sourceMappingURL=sliceHelpers.d.ts.map