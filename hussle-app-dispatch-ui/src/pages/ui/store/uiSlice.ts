import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
  modalType: string;
  modalProps: Record<string, unknown>;
}

interface DrawerState {
  drawerType: string;
  drawerProps: Record<string, unknown>;
}

interface UiState {
  modal: ModalState | null;
  drawer: DrawerState | null;
}

const initialState: UiState = {
  modal: null,
  drawer: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openModal(state, action: PayloadAction<ModalState>) {
      state.modal = action.payload;
    },
    closeModal(state) {
      state.modal = null;
    },
    openDrawer(state, action: PayloadAction<DrawerState>) {
      state.drawer = action.payload;
    },
    closeDrawer(state) {
      state.drawer = null;
    },
  },
});

export const { openModal, closeModal, openDrawer, closeDrawer } = uiSlice.actions;
export default uiSlice.reducer;
