import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * State shape for dirty form tracking
 */
export interface DirtyFormState {
  /**
   * Map of form IDs to their dirty state
   * e.g., { 'authors/edit/123': true, 'posts/create': false }
   */
  dirtyForms: Record<string, boolean>;

  /**
   * Pending navigation (if blocked by dirty form)
   */
  pendingNavigation: {
    path: string;
    formId: string;
  } | null;

  /**
   * Confirmation dialog state
   */
  confirmationDialog: {
    isOpen: boolean;
    message: string;
    formId: string | null;
  };
}

const initialState: DirtyFormState = {
  dirtyForms: {},
  pendingNavigation: null,
  confirmationDialog: {
    isOpen: false,
    message: 'You have unsaved changes. Are you sure you want to leave?',
    formId: null,
  },
};

/**
 * Dirty Form Slice
 *
 * Manages dirty form state and navigation blocking.
 * Used by createDirtyFormSaga to track unsaved changes.
 */
export const dirtyFormSlice = createSlice({
  name: 'dirtyForm',
  initialState,
  reducers: {
    /**
     * Set dirty state for a specific form
     */
    setFormDirty(
      state,
      action: PayloadAction<{ formId: string; isDirty: boolean }>
    ) {
      const { formId, isDirty } = action.payload;
      state.dirtyForms[formId] = isDirty;
    },

    /**
     * Clear dirty state for a specific form
     */
    clearFormDirty(state, action: PayloadAction<{ formId: string }>) {
      const { formId } = action.payload;
      Reflect.deleteProperty(state.dirtyForms, formId);
    },

    /**
     * Clear all dirty forms
     */
    clearAllDirtyForms(state) {
      state.dirtyForms = {};
      state.pendingNavigation = null;
      state.confirmationDialog = {
        ...state.confirmationDialog,
        isOpen: false,
        formId: null,
      };
    },

    /**
     * Request navigation (may be blocked if form is dirty)
     */
    requestNavigation(
      state,
      action: PayloadAction<{ path: string; formId: string }>
    ) {
      const { path, formId } = action.payload;
      const isDirty = state.dirtyForms[formId];

      if (isDirty) {
        // Block navigation and show confirmation
        state.pendingNavigation = { path, formId };
        state.confirmationDialog = {
          isOpen: true,
          message: 'You have unsaved changes. Are you sure you want to leave?',
          formId,
        };
      }
      // If not dirty, saga will handle navigation directly
    },

    /**
     * Confirm navigation (discard changes)
     */
    confirmNavigation(state) {
      // Clear dirty state for this form
      if (state.pendingNavigation?.formId) {
        Reflect.deleteProperty(state.dirtyForms, state.pendingNavigation.formId);
      }

      // Close dialog (saga will proceed with navigation)
      state.confirmationDialog = {
        ...state.confirmationDialog,
        isOpen: false,
        formId: null,
      };
    },

    /**
     * Cancel navigation (stay on page)
     */
    cancelNavigation(state) {
      state.pendingNavigation = null;
      state.confirmationDialog = {
        ...state.confirmationDialog,
        isOpen: false,
        formId: null,
      };
    },

    /**
     * Update confirmation dialog message
     */
    setConfirmationMessage(state, action: PayloadAction<{ message: string }>) {
      state.confirmationDialog.message = action.payload.message;
    },
  },
});

export const {
  setFormDirty,
  clearFormDirty,
  clearAllDirtyForms,
  requestNavigation,
  confirmNavigation,
  cancelNavigation,
  setConfirmationMessage,
} = dirtyFormSlice.actions;

export default dirtyFormSlice.reducer;

/**
 * Selectors
 */
export const selectDirtyForms = (state: { dirtyForm: DirtyFormState }) =>
  state.dirtyForm.dirtyForms;

export const selectIsFormDirty = (formId: string) => (state: {
  dirtyForm: DirtyFormState;
}) => state.dirtyForm.dirtyForms[formId] || false;

export const selectPendingNavigation = (state: { dirtyForm: DirtyFormState }) =>
  state.dirtyForm.pendingNavigation;

export const selectConfirmationDialog = (state: { dirtyForm: DirtyFormState }) =>
  state.dirtyForm.confirmationDialog;

export const selectHasAnyDirtyForms = (state: { dirtyForm: DirtyFormState }) =>
  Object.values(state.dirtyForm.dirtyForms).some((isDirty) => isDirty);
