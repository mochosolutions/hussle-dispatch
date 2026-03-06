import {createSelector} from "@reduxjs/toolkit";
import {authSelector} from "./authSelector";

export const confirmationStatusSelector = createSelector(
  authSelector,
  (authState) => authState?.confirmationStatus,
);

export const rememberMeSelector = createSelector(
  authSelector,
  (authState) => authState?.rememberMe
);

export const isLoginPageLoadingSelector = createSelector(
  authSelector,
  (loginPageObj) => {
    const loadingState = loginPageObj?.loading.login ?? "";
    return loadingState === "Pending";
  }
);

export const loginPageErrorSelector = createSelector(
  authSelector,
  (loginPageObj) => {
    const loadingState = loginPageObj?.loading.login ?? "";
    return loadingState === "Rejected";
  }
);

export const forceChangePasswordPageErrorSelector = createSelector(
  authSelector,
  (loginPageObj) => {
    const loadingState = loginPageObj?.forceChangePassword.login ?? "";
    return loadingState === "Rejected";
  }
);

export const isInitializedSelector = createSelector(
  authSelector,
  (authState) => authState?.isInitializing,
);

export const userSessionSelector = createSelector(
  authSelector,
  (authState) => authState?.session,
);

export const forceChangePasswordSelector = createSelector(
  authSelector,
  (authState) => authState?.forceChangePassword,
);

export const isForceChangePasswordLoadingSelector = createSelector(
  authSelector,
  (loginPageObj) => {
    const loadingState = loginPageObj?.loading.login ?? '';
    return loadingState === 'Pending';
  }
);

export const selectIsLoggedIn = createSelector(
  authSelector,
  (authState) => authState?.isLoggedIn,
);
