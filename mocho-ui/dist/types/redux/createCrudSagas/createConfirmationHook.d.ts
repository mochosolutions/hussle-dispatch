import { Effect } from 'redux-saga/effects';
import { ConfirmationConfig } from './types';
/**
 * Creates a confirmation hook generator from a ConfirmationConfig
 *
 * Uses race() to listen for both confirmation AND modal close events.
 * This ensures sagas properly finish when user cancels (clicks backdrop/cancel button).
 *
 * @template TData - The type of data passed to the hook
 * @param confirmConfig - The confirmation configuration
 * @returns A generator function that shows confirmation and returns true/false
 *
 * @example
 * ```typescript
 * const confirmDelete = createConfirmationHook({
 *   title: 'Delete Post',
 *   message: 'Are you sure?',
 *   confirmActionType: 'CONFIRM_DELETE_POST',
 *   severity: 'error',
 * });
 *
 * // In saga:
 * const shouldDelete = yield* confirmDelete(postId);
 * if (!shouldDelete) return;
 * ```
 */
export declare function createConfirmationHook<TData = unknown>(confirmConfig: ConfirmationConfig<TData>): (data: TData) => Generator<Effect, boolean, unknown>;
//# sourceMappingURL=createConfirmationHook.d.ts.map