/**
 * UI Slice - Global UI state management
 *
 * This provides modal and confirmation dialog state management.
 * Used by the CRUD saga utilities for confirmation dialogs.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ModalProps {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'warning' | 'error' | 'info' | 'success';
  open?: boolean;
  [key: string]: unknown;
}

export interface ModalState {
  isOpen: boolean;
  modalType: string | null;
  modalProps: ModalProps | null;
}

export interface UIState {
  modal: ModalState;
}

const initialState: UIState = {
  modal: {
    isOpen: false,
    modalType: null,
    modalProps: null,
  },
};

export interface OpenModalPayload {
  modalType: string;
  modalProps?: ModalProps;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<OpenModalPayload>) => {
      state.modal.isOpen = true;
      state.modal.modalType = action.payload.modalType;
      state.modal.modalProps = action.payload.modalProps ?? null;
    },
    closeModal: (state) => {
      state.modal.isOpen = false;
      state.modal.modalType = null;
      state.modal.modalProps = null;
    },
  },
});

export const { openModal, closeModal } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export default uiSlice;
