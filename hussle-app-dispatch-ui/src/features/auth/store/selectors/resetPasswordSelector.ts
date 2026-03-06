import {createSelector} from '@reduxjs/toolkit';
import {authSelector} from './authSelector';

export const isInitatePassResetLoadingSelector = createSelector(
  authSelector,
  (loginPageObj) => {
    const loadingState = loginPageObj?.loading.initPasswordReset ?? '';
    return loadingState === 'Pending';
  },
);

export const isConfirmPasswordResetLoadingSelector = createSelector(
  authSelector,
  (loginPageObj) => {
    const loadingState = loginPageObj?.loading.confirmPasswordReset ?? '';
    return loadingState === 'Pending';
  },
);

export const isInitatePassResetErrorSelector = createSelector(
  authSelector,
  (loginPageObj) => {
    const loadingState = loginPageObj?.loading.initPasswordReset ?? '';
    return loadingState === 'Rejected';
  },
);

export const isConfirmPasswordResetErrorSelector = createSelector(
  authSelector,
  (loginPageObj) => {
    const loadingState = loginPageObj?.loading.confirmPasswordReset ?? '';
    return loadingState === 'Rejected';
  },
);
