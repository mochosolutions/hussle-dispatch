import type { RootState } from 'store';

export const selectSettings = (state: RootState) => state.pages.settings.settings;

export const selectSettingsLoading = (state: RootState) => state.pages.settings.loading;

export const selectSettingsSaving = (state: RootState) => state.pages.settings.saving;

export const selectSettingsError = (state: RootState) => state.pages.settings.error;
