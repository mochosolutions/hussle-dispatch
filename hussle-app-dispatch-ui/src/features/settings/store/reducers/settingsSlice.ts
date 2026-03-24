import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  SettingsPageState,
  OrgSettings,
  UpdateSettingsRequestPayload,
  UpdateSettingsFailurePayload,
} from '../../types';

const initialState: SettingsPageState = {
  settings: null,
  loading: false,
  error: null,
  saving: false,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    fetchSettingsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSettingsSuccess(state, action: PayloadAction<OrgSettings>) {
      state.settings = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchSettingsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    updateSettingsRequest(state, _action: PayloadAction<UpdateSettingsRequestPayload>) {
      state.saving = true;
      state.error = null;
    },
    updateSettingsSuccess(state, action: PayloadAction<OrgSettings>) {
      state.settings = action.payload;
      state.saving = false;
      state.error = null;
    },
    updateSettingsFailure(state, action: PayloadAction<UpdateSettingsFailurePayload>) {
      state.saving = false;
      state.error = action.payload.error;
    },
    clearSettings(state) {
      state.settings = null;
      state.loading = false;
      state.error = null;
      state.saving = false;
    },
  },
});

export const {
  fetchSettingsRequest,
  fetchSettingsSuccess,
  fetchSettingsFailure,
  updateSettingsRequest,
  updateSettingsSuccess,
  updateSettingsFailure,
  clearSettings,
} = settingsSlice.actions;

export const settingsReducer = settingsSlice.reducer;
