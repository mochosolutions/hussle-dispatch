import { put, select, take, race, call } from 'redux-saga/effects';
import {
  requestNavigation,
  confirmNavigation,
  cancelNavigation,
  selectIsFormDirty,
  selectPendingNavigation,
  clearFormDirty,
} from './dirtyFormSlice';
import type { PayloadAction } from '@reduxjs/toolkit';

/**
 * Configuration for createDirtyFormSaga
 */
export interface DirtyFormSagaConfig {
  /**
   * Unique form ID (e.g., 'authors/edit', 'posts/create')
   */
  formId: string;

  /**
   * Callback to perform navigation
   * Should accept a path and navigate to it
   */
  onNavigate: (path: string) => void;

  /**
   * Optional custom confirmation message
   */
  confirmationMessage?: string;
}

/**
 * Create Dirty Form Saga
 *
 * Factory function that creates a reusable saga for handling navigation blocking
 * when a form has unsaved changes.
 *
 * **Key Features:**
 * - NO window.beforeunload (saga-based navigation blocking)
 * - Works with any routing library (React Router, Next.js, etc.)
 * - Reusable across multiple forms
 * - Type-safe with TypeScript
 * - Integrates with Redux state
 *
 * **How It Works:**
 * 1. Component calls `dispatch(requestNavigation({ path, formId }))`
 * 2. Saga checks if form is dirty
 * 3. If dirty, shows confirmation dialog
 * 4. User confirms/cancels via `confirmNavigation` or `cancelNavigation` actions
 * 5. Saga proceeds with navigation or stays on page
 *
 * **Usage:**
 * ```typescript
 * // 1. Create saga in your Redux saga root
 * import { createDirtyFormSaga } from '@/utils/redux/createDirtyFormSaga';
 * import { useNavigate } from 'react-router-dom';
 *
 * function* rootSaga() {
 *   yield fork(createDirtyFormSaga({
 *     formId: 'authors/edit',
 *     onNavigate: (path) => navigate(path),
 *   }));
 * }
 *
 * // 2. In your component, use onDirtyChange callback
 * <CrudFormPageV2
 *   mode="edit"
 *   entityName="Author"
 *   FormComponent={AuthorForm}
 *   onDirtyChange={(isDirty) => dispatch(setFormDirty({ formId: 'authors/edit', isDirty }))}
 *   onNavigate={(path) => dispatch(requestNavigation({ path, formId: 'authors/edit' }))}
 *   // ... other props
 * />
 *
 * // 3. Show confirmation dialog in your UI
 * const confirmationDialog = useSelector(selectConfirmationDialog);
 *
 * <Dialog open={confirmationDialog.isOpen}>
 *   <DialogContent>{confirmationDialog.message}</DialogContent>
 *   <DialogActions>
 *     <Button onClick={() => dispatch(cancelNavigation())}>Cancel</Button>
 *     <Button onClick={() => dispatch(confirmNavigation())}>Leave</Button>
 *   </DialogActions>
 * </Dialog>
 * ```
 *
 * @param config - Saga configuration
 * @returns Saga generator function
 */
export function createDirtyFormSaga({
  formId,
  onNavigate,
  confirmationMessage,
}: DirtyFormSagaConfig) {
  return function* dirtyFormSaga() {
    while (true) {
      // Wait for navigation request
      const action: PayloadAction<{ path: string; formId: string }> = yield take(
        requestNavigation.type
      );

      const { path, formId: actionFormId } = action.payload;

      // Only handle navigation for this specific form
      if (actionFormId !== formId) {
        continue;
      }

      // Check if form is dirty
      const isDirty: boolean = yield select(selectIsFormDirty(formId));

      if (!isDirty) {
        // Form is clean, navigate immediately
        yield call(onNavigate, path);
        yield put(clearFormDirty({ formId }));
        continue;
      }

      // Form is dirty, wait for user confirmation or cancellation
      const { confirmed, cancelled } = yield race({
        confirmed: take(confirmNavigation.type),
        cancelled: take(cancelNavigation.type),
      });

      if (confirmed) {
        // User confirmed, proceed with navigation
        const pendingNav: { path: string; formId: string } | null = yield select(
          selectPendingNavigation
        );

        if (pendingNav && pendingNav.formId === formId) {
          yield call(onNavigate, pendingNav.path);
          yield put(clearFormDirty({ formId }));
        }
      }

      // If cancelled, do nothing (stay on page)
    }
  };
}

/**
 * Create Multiple Dirty Form Sagas
 *
 * Helper to create sagas for multiple forms at once.
 *
 * @example
 * ```typescript
 * function* rootSaga() {
 *   const sagas = createMultipleDirtyFormSagas([
 *     { formId: 'authors/edit', onNavigate: (path) => navigate(path) },
 *     { formId: 'posts/create', onNavigate: (path) => navigate(path) },
 *     { formId: 'categories/edit', onNavigate: (path) => navigate(path) },
 *   ]);
 *
 *   yield all(sagas.map((saga) => fork(saga)));
 * }
 * ```
 */
export function createMultipleDirtyFormSagas(
  configs: DirtyFormSagaConfig[]
): Array<() => Generator> {
  return configs.map((config) => createDirtyFormSaga(config));
}

export default createDirtyFormSaga;
