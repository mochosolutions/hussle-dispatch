import { put, take, race, Effect } from 'redux-saga/effects';
import { openModal, closeModal } from '../../store/reducers/ui';
import type { ConfirmationConfig } from './types';

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
export function createConfirmationHook<TData = unknown>(
  confirmConfig: ConfirmationConfig<TData>
) {
  return function* (data: TData): Generator<Effect, boolean, unknown> {
    const message =
      typeof confirmConfig.message === 'function'
        ? confirmConfig.message(data)
        : confirmConfig.message;

    // Use custom modal if specified, otherwise use generic confirmDialog
    const modalType = confirmConfig.modalType || 'confirmDialog';

    const modalProps = confirmConfig.getModalProps
      ? confirmConfig.getModalProps(data)
      : {
          title: confirmConfig.title,
          message,
          confirmActionType: confirmConfig.confirmActionType,
          confirmLabel: confirmConfig.confirmLabel,
          cancelLabel: confirmConfig.cancelLabel,
          severity: confirmConfig.severity || 'warning',
          open: true,
        };

    yield put(openModal({ modalType, modalProps }));

    try {
      // Race between confirm and cancel actions
      // Whichever happens first will complete the race
      const result = (yield race({
        confirmed: take(confirmConfig.confirmActionType),
        cancelled: take(closeModal.type),
      })) as { confirmed?: unknown; cancelled?: unknown };

      // If modal was closed (backdrop/cancel button), return false to abort
      if (result.cancelled) {
        console.log(`[${confirmConfig.confirmActionType}] User cancelled - modal closed`);
        return false;
      }

      // If confirmed, return true to proceed
      console.log(`[${confirmConfig.confirmActionType}] User confirmed`);
      return !!result.confirmed;
    } finally {
      // Always close modal when saga finishes
      yield put(closeModal());
    }
  };
}
