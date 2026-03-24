import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';
import { authSelector } from './authSelector';

export const confirmationStatusSelector = (state: RootState) =>
  authSelector(state)?.confirmationStatus;

export const rememberMeSelector = (state: RootState) =>
  authSelector(state)?.rememberMe;

export const isLoginPageLoadingSelector = createSelector(
  authSelector,
  (auth) => (auth?.loading.login ?? '') === 'Pending',
);

export const loginPageErrorSelector = createSelector(
  authSelector,
  (auth) => (auth?.loading.login ?? '') === 'Rejected',
);

export const forceChangePasswordPageErrorSelector = createSelector(
  authSelector,
  (auth) => (auth?.forceChangePassword.login ?? '') === 'Rejected',
);

export const isInitializedSelector = (state: RootState) =>
  authSelector(state)?.isInitializing;

export const userSessionSelector = (state: RootState) =>
  authSelector(state)?.session;

export const forceChangePasswordSelector = (state: RootState) =>
  authSelector(state)?.forceChangePassword;

export const isForceChangePasswordLoadingSelector = createSelector(
  authSelector,
  (auth) => (auth?.loading.login ?? '') === 'Pending',
);

export const selectIsLoggedIn = (state: RootState) =>
  authSelector(state)?.isLoggedIn;
