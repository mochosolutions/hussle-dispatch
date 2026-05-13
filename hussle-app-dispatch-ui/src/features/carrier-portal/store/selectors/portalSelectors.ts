import type { RootState } from 'store';

export const selectSession = (state: RootState) => state.pages.carrierPortal.session;

export const selectCarrier = (state: RootState) => state.pages.carrierPortal.carrier;

export const selectAnswers = (state: RootState) => state.pages.carrierPortal.answers;

export const selectCurrentPhase = (state: RootState) => state.pages.carrierPortal.currentPhase;

export const selectLastSavedPhase = (state: RootState) =>
  state.pages.carrierPortal.lastSavedPhase;

export const selectIsLoading = (state: RootState) => state.pages.carrierPortal.loading;

export const selectIsSavingAnswer = (state: RootState) => state.pages.carrierPortal.savingAnswer;

export const selectError = (state: RootState) => state.pages.carrierPortal.error;

export const selectCompletedPhases = (state: RootState) =>
  state.pages.carrierPortal.session?.completedPhases ?? [];

export const selectIsSavingPhase = (state: RootState) => state.pages.carrierPortal.savingPhase;

export const selectLastSavedAt = (state: RootState) => state.pages.carrierPortal.lastSavedAt;
