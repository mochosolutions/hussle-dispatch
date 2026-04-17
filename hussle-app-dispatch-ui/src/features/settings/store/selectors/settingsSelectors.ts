import type { RootState } from 'store';
import { settingsEntitySelectors } from '../reducers/settingsEntitySlice';
import { teamEntitySelectors } from '../reducers/teamEntitySlice';

export const selectSettings = (state: RootState) => state.pages.settings.settings;

export const selectSettingsLoading = (state: RootState) => state.pages.settings.loading;

export const selectSettingsSaving = (state: RootState) => state.pages.settings.saving;

export const selectSettingsError = (state: RootState) => state.pages.settings.error;

export const selectOrgSettingsEntity = (state: RootState) =>
  settingsEntitySelectors.selectAll(state);

export const selectTeamMembers = (state: RootState) => teamEntitySelectors.selectAll(state);

export const selectTeamMemberById = (id: string) => (state: RootState) =>
  teamEntitySelectors.selectById(state, id);
